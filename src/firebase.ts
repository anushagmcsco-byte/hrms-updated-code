import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDocsFromServer,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with experimentalAutoDetectLongPolling so iOS Safari,
// WhatsApp in-app browsers, and mobile cellular networks sync reliably without WebChannel stalls.
function createFirestoreInstance(): Firestore {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  try {
    return initializeFirestore(
      app,
      { experimentalAutoDetectLongPolling: true },
      dbId
    );
  } catch {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = createFirestoreInstance();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  shouldThrow = false
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}

const MAX_INLINE_DATA_URL_LENGTH = 350_000;

/**
 * Recursively strips `undefined` values so Firestore setDoc/updateDoc never fails
 * with "Unsupported field value: undefined", and guards oversized base64 images
 * so no document ever exceeds Firestore's 1 MiB limit.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data === 'string') {
    if (data.startsWith('data:image/') && data.length > MAX_INLINE_DATA_URL_LENGTH) {
      return '' as unknown as T;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Safely writes a document to Firestore after sanitizing undefined fields.
 */
export async function saveDocToCloud(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  merge = false
): Promise<boolean> {
  const path = `${collectionName}/${docId}`;
  try {
    const cleanData = sanitizeForFirestore(data);
    if (merge) {
      await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
    } else {
      await setDoc(doc(db, collectionName, docId), cleanData);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
    return false;
  }
}

export interface BatchWriteEntry {
  collectionName: string;
  docId: string;
  data: Record<string, unknown>;
  merge?: boolean;
}

/**
 * Atomically writes multiple documents in a single Firestore batch commit so
 * multi-collection records (e.g., new tenant + admin user + billing + payroll cycle)
 * become visible together across all devices. Falls back to parallel setDoc on batch failure.
 */
export async function saveBatchToCloud(entries: BatchWriteEntry[]): Promise<boolean> {
  if (entries.length === 0) return true;
  try {
    const batch = writeBatch(db);
    for (const entry of entries) {
      const cleanData = sanitizeForFirestore(entry.data);
      const ref = doc(db, entry.collectionName, entry.docId);
      if (entry.merge) {
        batch.set(ref, cleanData, { merge: true });
      } else {
        batch.set(ref, cleanData);
      }
    }
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      entries.map((e) => `${e.collectionName}/${e.docId}`).join(','),
      false
    );
    // Fallback to individual writes so partial network issues still persist what they can
    const results = await Promise.all(
      entries.map((entry) =>
        saveDocToCloud(entry.collectionName, entry.docId, entry.data, Boolean(entry.merge))
      )
    );
    return results.every(Boolean);
  }
}

/**
 * Permanently deletes a document from Firestore and records a deletion tombstone
 * so stale localStorage caches on other devices never resurrect the deleted record.
 */
export async function deleteDocFromCloud(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, docId));
    // Record tombstone so other devices migrating local data skip deleted records
    const tombstoneId = `${collectionName}__${docId}`;
    await setDoc(doc(db, 'deleted_ids', tombstoneId), {
      collectionName,
      docId,
      deletedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path, false);
    return false;
  }
}

/**
 * Fetches fresh documents directly from the Firestore server (bypassing stale cache),
 * falling back to cached getDocs if temporarily offline.
 */
export async function fetchCollectionFromServer<T>(collectionName: string): Promise<T[]> {
  try {
    const snap = await getDocsFromServer(collection(db, collectionName));
    const list: T[] = [];
    snap.forEach((d) => list.push(d.data() as T));
    return list;
  } catch (serverErr) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const list: T[] = [];
      snap.forEach((d) => list.push(d.data() as T));
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName, false);
      return [];
    }
  }
}

// Connectivity health-check using getDocFromServer
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}
