import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  User, 
  Tenant, 
  UserRole, 
  TenantId, 
  AttendanceRecord, 
  LeaveRequest, 
  PayrollCycle, 
  PayslipItem, 
  JobOpening, 
  Candidate, 
  ExpenseClaim, 
  AuditLog, 
  CompanyAsset, 
  HelpdeskTicket, 
  SaaSCompanyBilling,
  ClientDemoBooking,
  DemoBookingStatus,
  DemoMessageChannel,
  DemoMessageDispatch,
  DispatchedClientEmail,
  AppNotification,
  PerformanceGoal,
  PerformanceReview,
  ShiftTemplate,
  EmployeeDocument,
  OnboardingTask,
  InterviewSchedule,
  OfferLetter,
  ContinuousFeedback,
  CompanyAnnouncement,
  EnpsResponse,
  EmployeeLoan,
  CompanyChatbotTemplate,
  ChatbotAskedQuestionLog,
  PlatformSupportConfig
} from '../types';
import {
  DEFAULT_PLATFORM_SUPPORT_CONFIG,
  extractKeywordsFromText
} from '../utils/chatbotSupportEngine';
import { 
  INITIAL_TENANTS, 
  INITIAL_USERS, 
  INITIAL_ATTENDANCE, 
  INITIAL_LEAVES, 
  INITIAL_PAYROLL_CYCLES, 
  INITIAL_PAYSLIPS, 
  INITIAL_JOBS, 
  INITIAL_CANDIDATES, 
  INITIAL_EXPENSES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_ASSETS, 
  INITIAL_HELPDESK, 
  INITIAL_SAAS_BILLINGS,
  INITIAL_DEMO_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  TENANT_OFFICE_LOCATIONS
} from '../data/mockData';
import {
  db,
  testFirestoreConnection,
  saveDocToCloud,
  saveBatchToCloud,
  BatchWriteEntry,
  deleteDocFromCloud,
  sanitizeForFirestore,
  fetchCollectionFromServer,
  handleFirestoreError,
  OperationType
} from '../firebase';
import {
  computeTenantPayrollFromAttendanceAndLeaves,
  extractMonthKeyFromCycle,
  extractMonthKeyFromPayslip,
  formatMonthKeyLabel,
  getCurrentMonthKey,
  getMonthPeriodBounds,
  getMonthlyCycleId,
  getRecentMonthKeys,
  toStorablePayslip
} from '../utils/payrollCalculator';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch 
} from 'firebase/firestore';

export type AppView = 
  | 'public_website' 
  | 'super_admin' 
  | 'dashboard' 
  | 'employees' 
  | 'attendance' 
  | 'leaves' 
  | 'payroll' 
  | 'recruitment' 
  | 'performance' 
  | 'expenses' 
  | 'assets' 
  | 'helpdesk' 
  | 'audit_logs' 
  | 'reports' 
  | 'settings' 
  | 'mobile_preview'
  | 'demo_bookings'
  | 'spec_document'
  | 'engagement';

interface AppContextType {
  // Current session & view
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentTenant: Tenant;
  setCurrentTenant: (tenant: Tenant) => void;
  tenants: Tenant[];
  users: User[];
  
  // Permanent Employee CRUD & Company Super Admin delegation
  addEmployee: (employeeData: Omit<User, 'id'>) => User;
  deleteEmployee: (employeeId: string) => boolean;
  updateEmployee: (employeeId: string, updates: Partial<User>) => void;
  assignCompanySuperAdmin: (companyId: string, userId: string) => void;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  
  // Role switcher helper
  switchRole: (role: UserRole) => void;
  switchTenant: (tenantId: TenantId) => void;
  
  // Attendance operations with Office Geofence & Verified Remote Punch support
  attendance: AttendanceRecord[];
  checkInCurrentEmployee: (locationVerified?: boolean, customLocationName?: string, isRemotePunch?: boolean) => boolean;
  checkOutCurrentEmployee: (locationVerified?: boolean, customLocationName?: string, isRemotePunch?: boolean) => boolean;
  requestAttendanceCorrection: (date: string, reason: string, customLocation?: string) => void;
  approveAttendanceCorrection: (recordId: string) => void;
  toggleAttendanceBreak: () => void;
  logOvertimeForRecord: (recordId: string, overtimeHours: number) => void;
  
  // Leaves
  leaves: LeaveRequest[];
  applyLeave: (leaveType: LeaveRequest['leaveType'], startDate: string, endDate: string, days: number, reason: string) => void;
  updateLeaveStatus: (leaveId: string, status: 'approved' | 'rejected', notes?: string) => void;
  
  // Payroll
  payrollCycles: PayrollCycle[];
  payslips: PayslipItem[];
  runPayrollValidation: (cycleId: string) => void;
  approvePayrollCycle: (cycleId: string) => void;
  publishPayrollCycle: (cycleId: string) => void;
  storeMonthlyPayslips: (monthKey: string, options?: { forceRecalculate?: boolean; silent?: boolean }) => void;
  
  // ATS Recruitment
  jobs: JobOpening[];
  candidates: Candidate[];
  addJobOpening: (job: Omit<JobOpening, 'id' | 'tenantId' | 'applicantsCount' | 'postedDate'>) => void;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'tenantId' | 'appliedDate' | 'resumeUrl'>) => void;
  updateCandidateStage: (candidateId: string, newStage: Candidate['stage']) => void;
  
  // Expenses
  expenses: ExpenseClaim[];
  addExpense: (category: ExpenseClaim['category'], amount: number, merchant: string, description: string) => void;
  approveExpense: (id: string) => void;
  
  // Tickets, Assets & Performance Goals
  tickets: HelpdeskTicket[];
  addTicket: (category: HelpdeskTicket['category'], subject: string, priority: HelpdeskTicket['priority']) => void;
  updateTicketStatus: (ticketId: string, status: HelpdeskTicket['status']) => void;
  assets: CompanyAsset[];
  addAsset: (asset: Omit<CompanyAsset, 'id' | 'tenantId'>) => void;
  deleteAsset: (assetId: string) => void;
  performanceGoals: PerformanceGoal[];
  addPerformanceGoal: (goal: Omit<PerformanceGoal, 'id' | 'tenantId' | 'createdAt'>) => void;
  updatePerformanceGoalProgress: (goalId: string, progress: number) => void;
  deletePerformanceGoal: (goalId: string) => void;

  // Extended Enterprise HRMS Modules (Shifts, Docs, Lifecycle, Interviews, Offers, 360 Appraisals, Feedback/PIP, Announcements, eNPS, Loans)
  shifts: ShiftTemplate[];
  addShiftTemplate: (shift: Omit<ShiftTemplate, 'id' | 'tenantId'>) => void;
  assignEmployeeToShift: (shiftId: string, employeeId: string) => void;
  deleteShiftTemplate: (shiftId: string) => void;

  employeeDocuments: EmployeeDocument[];
  addEmployeeDocument: (docItem: Omit<EmployeeDocument, 'id' | 'tenantId' | 'uploadedAt' | 'uploadedBy'>) => void;
  toggleVerifyDocument: (docId: string) => void;
  deleteEmployeeDocument: (docId: string) => void;

  onboardingTasks: OnboardingTask[];
  addOnboardingTask: (task: Omit<OnboardingTask, 'id' | 'tenantId' | 'completed'>) => void;
  generateDefaultOnboardingTasks: (employee: User, lifecycleType?: 'onboarding' | 'offboarding') => void;
  toggleOnboardingTask: (taskId: string) => void;
  deleteOnboardingTask: (taskId: string) => void;

  interviews: InterviewSchedule[];
  scheduleInterview: (interview: Omit<InterviewSchedule, 'id' | 'tenantId' | 'status'>) => void;
  updateInterviewStatus: (interviewId: string, status: InterviewSchedule['status'], feedback?: string, score?: number) => void;
  deleteInterview: (interviewId: string) => void;

  offerLetters: OfferLetter[];
  createOfferLetter: (offer: Omit<OfferLetter, 'id' | 'tenantId' | 'issuedAt' | 'status'>) => void;
  updateOfferStatus: (offerId: string, status: OfferLetter['status']) => void;
  convertOfferToEmployee: (offerId: string) => void;

  performanceReviews: PerformanceReview[];
  addPerformanceReview: (review: Omit<PerformanceReview, 'id' | 'tenantId'>) => void;
  updatePerformanceReviewStatus: (reviewId: string, status: PerformanceReview['status']) => void;

  continuousFeedback: ContinuousFeedback[];
  addContinuousFeedback: (fb: Omit<ContinuousFeedback, 'id' | 'tenantId' | 'createdAt' | 'authorName'>) => void;
  updatePipStatus: (fbId: string, pipStatus: 'active' | 'improved' | 'closed') => void;
  deleteContinuousFeedback: (fbId: string) => void;

  announcements: CompanyAnnouncement[];
  addAnnouncement: (ann: Omit<CompanyAnnouncement, 'id' | 'tenantId' | 'createdAt' | 'authorName' | 'acknowledgedBy'>) => void;
  togglePinAnnouncement: (annId: string) => void;
  acknowledgeAnnouncement: (annId: string) => void;
  deleteAnnouncement: (annId: string) => void;

  enpsResponses: EnpsResponse[];
  submitEnpsResponse: (data: { score: number; surveyTitle: string; comment: string; anonymous: boolean }) => void;

  employeeLoans: EmployeeLoan[];
  requestEmployeeLoan: (data: { loanType: EmployeeLoan['loanType']; principalAmount: number; tenureMonths: number; reason: string }) => void;
  updateLoanStatus: (loanId: string, status: EmployeeLoan['status']) => void;
  recordLoanEmiPayment: (loanId: string) => void;
  
  // SaaS Admin Data & Client Tenant Registration
  saasBillings: SaaSCompanyBilling[];
  updateCompanyStatus: (companyId: string, status: SaaSCompanyBilling['status']) => void;
  registerNewTenant: (data: {
    name: string;
    domain: string;
    plan: 'Growth' | 'Professional' | 'Enterprise';
    currency: string;
    timezone: string;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    seatLimit: number;
    initialEmployeesCount: number;
  }) => Promise<boolean>;
  syncAllFromCloud: () => Promise<boolean>;
  isCloudSyncing: boolean;

  // Per-Company & Main Super Admin Dynamic WhatsApp + Chatbot Template Management
  platformSupportConfig: PlatformSupportConfig;
  updatePlatformSupportConfig: (updates: Partial<PlatformSupportConfig>) => void;
  updateCompanyWhatsAppSettings: (
    targetId: string | 'platform-root',
    updates: { whatsappNumber?: string; whatsappEnabled?: boolean; chatbotEnabled?: boolean }
  ) => void;
  addCompanyChatbotTemplate: (
    targetId: string | 'platform-root',
    data: { question: string; answerTemplate: string; keywords?: string[]; category?: string }
  ) => CompanyChatbotTemplate;
  updateCompanyChatbotTemplate: (
    targetId: string | 'platform-root',
    templateId: string,
    updates: Partial<CompanyChatbotTemplate>
  ) => void;
  deleteCompanyChatbotTemplate: (targetId: string | 'platform-root', templateId: string) => void;
  recordChatbotQuestionAsked: (
    targetId: string | 'platform-root',
    questionText: string,
    matchedTemplateId?: string,
    autoAddTemplate?: { answerTemplate: string; category?: string }
  ) => void;
  
  // Authentication & Security Gate
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole, userId?: string) => boolean;
  logout: () => void;
  
  // Audit Logs
  auditLogs: AuditLog[];
  logAction: (action: string, resource: string, severity?: AuditLog['severity']) => void;

  // Search & Global quick actions
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notificationsCount: number;
  clearNotifications: () => void;
  notificationsList: AppNotification[];
  addTenantNotification: (notification: { 
    tenantId?: string; 
    title: string; 
    description?: string;
    category?: AppNotification['category']; 
    priority?: 'normal' | 'urgent';
    targetView?: string;
  }) => AppNotification;
  deleteTenantNotification: (notificationId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (tenantId?: string) => void;

  // Mobile drawer responsiveness
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Client Demo Bookings & Genuine Client Verification
  demoBookings: ClientDemoBooking[];
  isBookDemoModalOpen: boolean;
  setIsBookDemoModalOpen: (open: boolean) => void;
  activeDemoRequestForVerification: ClientDemoBooking | null;
  setActiveDemoRequestForVerification: (booking: ClientDemoBooking | null) => void;
  submitDemoBooking: (data: {
    fullName: string;
    workEmail: string;
    companyOwnerEmail?: string;
    companyOwnerName?: string;
    phone: string;
    messageChannel?: DemoMessageChannel;
    companyName: string;
    companyWebsite: string;
    companySize: '1-20' | '21-50' | '51-200' | '201-1000' | '1000+';
    currentHrms: string;
    selectedModules: string[];
    preferredDate: string;
    preferredTimeSlot: string;
    timezone: string;
    notes?: string;
  }) => ClientDemoBooking;
  verifyDemoBookingEmail: (bookingId: string, token: string) => { success: boolean; message: string };
  resendDemoVerificationEmail: (bookingId: string) => string;
  updateDemoBookingStatus: (bookingId: string, status: DemoBookingStatus, notes?: string) => void;
  deleteDemoBooking: (bookingId: string) => void;

  // Dynamic Email Dispatching with all details
  dispatchedEmails: DispatchedClientEmail[];
  activeDispatchedEmailModal: DispatchedClientEmail | null;
  setActiveDispatchedEmailModal: (email: DispatchedClientEmail | null) => void;
  sendDynamicClientEmail: (data: {
    recipientEmail: string;
    recipientName?: string;
    companyName?: string;
    companySize?: '1-20' | '21-50' | '51-200' | '201-1000' | '1000+';
    primaryModules?: string[];
  }) => DispatchedClientEmail;
  activateDynamicTenantFromEmail: (dispatchedEmailId: string) => void;

  // Toast alert feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_tenants');
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch {
      return INITIAL_TENANTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_tenants', JSON.stringify(tenants));
    } catch (e) {
      console.error('Failed persisting tenants to localStorage', e);
    }
  }, [tenants]);
  
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => {
    try {
      const savedId = localStorage.getItem('nattonflow_active_tenant_id');
      if (savedId) {
        const found = tenants.find(t => t.id === savedId);
        if (found) return found;
      }
    } catch {}
    return tenants[0];
  });
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isCloudReady, setIsCloudReady] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const lastMonthlySyncSigRef = useRef<string>('');
  const inFlightBatchRef = useRef<boolean>(false);

  const PENDING_CLOUD_WRITES_KEY = 'nattonflow_pending_cloud_writes_v1';
  const readPendingWritesFromStorage = (): Record<string, BatchWriteEntry> => {
    try {
      const raw = localStorage.getItem(PENDING_CLOUD_WRITES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };
  const pendingWritesRef = useRef<Record<string, BatchWriteEntry>>(readPendingWritesFromStorage());

  const persistPendingWrites = (map: Record<string, BatchWriteEntry>) => {
    pendingWritesRef.current = map;
    try {
      if (Object.keys(map).length === 0) {
        localStorage.removeItem(PENDING_CLOUD_WRITES_KEY);
      } else {
        localStorage.setItem(PENDING_CLOUD_WRITES_KEY, JSON.stringify(map));
      }
    } catch {}
  };

  const queuePendingCloudWrites = (entries: BatchWriteEntry[]) => {
    const next = { ...pendingWritesRef.current };
    for (const entry of entries) {
      next[`${entry.collectionName}__${entry.docId}`] = entry;
    }
    persistPendingWrites(next);
  };

  const clearPendingCloudWrites = (entries: BatchWriteEntry[]) => {
    const next = { ...pendingWritesRef.current };
    for (const entry of entries) {
      delete next[`${entry.collectionName}__${entry.docId}`];
    }
    persistPendingWrites(next);
  };

  const mergeWithPending = <T extends { id: string }>(colName: string, cloudList: T[]): T[] => {
    const map = new Map<string, T>();
    cloudList.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    const pendingEntries = Object.values(pendingWritesRef.current);
    for (const entry of pendingEntries) {
      if (entry.collectionName === colName) {
        const existing = map.get(entry.docId);
        const merged = entry.merge && existing
          ? ({ ...existing, ...(entry.data as unknown as T) } as T)
          : (entry.data as unknown as T);
        map.set(entry.docId, merged);
      }
    }
    return Array.from(map.values());
  };

  const DEFAULT_TENANT_ORDER: Record<string, number> = {
    'tenant-acme': 1,
    'tenant-globex': 2,
    'tenant-hyperion': 3
  };

  const sortTenantsForDisplay = (list: Tenant[]): Tenant[] => {
    return [...list].sort((a, b) => {
      const aDefault = DEFAULT_TENANT_ORDER[a.id];
      const bDefault = DEFAULT_TENANT_ORDER[b.id];
      // Show newly registered custom client tenants prominently at the top (newest first)
      if (!aDefault && bDefault) return -1;
      if (aDefault && !bDefault) return 1;
      if (aDefault && bDefault) return aDefault - bDefault;
      const dateCmp = (b.createdAt || '').localeCompare(a.createdAt || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.id || '').localeCompare(a.id || '');
    });
  };

  const DEFAULT_BILLING_ORDER: Record<string, number> = {
    'bill-1': 1,
    'bill-2': 2,
    'bill-3': 3,
    'bill-4': 4
  };

  const sortBillingsForDisplay = (list: SaaSCompanyBilling[]): SaaSCompanyBilling[] => {
    return [...list].sort((a, b) => {
      const aDefault = DEFAULT_BILLING_ORDER[a.id];
      const bDefault = DEFAULT_BILLING_ORDER[b.id];
      if (!aDefault && bDefault) return -1;
      if (aDefault && !bDefault) return 1;
      if (aDefault && bDefault) return aDefault - bDefault;
      const dateCmp = (b.createdAt || '').localeCompare(a.createdAt || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.id || '').localeCompare(a.id || '');
    });
  };

  const flushPendingCloudWrites = async (): Promise<boolean> => {
    const entries = Object.values(pendingWritesRef.current);
    if (entries.length === 0) return true;
    const ok = await saveBatchToCloud(entries);
    if (ok) {
      clearPendingCloudWrites(entries);
    }
    return ok;
  };
  
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_users_v3');
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        // Strictly filter out any legacy dummy mock records
        const clean = parsed.filter(u => 
          !['usr-owner-1', 'usr-hr-1', 'usr-pay-1', 'usr-mgr-1', 'usr-lead-1', 'usr-emp-1', 'usr-rec-1', 'usr-emp-2', 'usr-emp-3', 'usr-globex-owner', 'usr-globex-hr', 'usr-globex-eng', 'usr-globex-tech', 'usr-hyperion-owner', 'usr-hyperion-hr', 'usr-hyperion-bio'].includes(u.id)
        );
        // Ensure Application Owner and Company Super Admins are always intact
        const initialSupers = INITIAL_USERS.filter(u => u.isAppOwner || u.role === 'tenant_super_admin');
        const userMap = new Map<string, User>();
        initialSupers.forEach(u => userMap.set(u.id, u));
        clean.forEach(u => userMap.set(u.id, u));
        return Array.from(userMap.values());
      }
    } catch (e) {
      console.error('Failed reading nattonflow_users_v3', e);
    }
    return INITIAL_USERS;
  });

  // Permanently save users whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_users_v3', JSON.stringify(users));
    } catch (e) {
      console.error('Failed persisting users to localStorage', e);
    }
  }, [users]);

  // Default active user is the Application Owner
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return users.find(u => u.isAppOwner) || users.find(u => u.role === 'super_admin') || users[0];
  });

  // Dynamic permanent attendance punches
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_attendance_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ATTENDANCE;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_attendance_v3', JSON.stringify(attendance));
    } catch (e) {}
  }, [attendance]);

  // Dynamic permanent leave requests
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_leaves_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LEAVES;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_leaves_v3', JSON.stringify(leaves));
    } catch (e) {}
  }, [leaves]);

  // Dynamic permanent payroll cycles & payslips
  const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_payroll_cycles_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PAYROLL_CYCLES;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_payroll_cycles_v3', JSON.stringify(payrollCycles));
    } catch (e) {}
  }, [payrollCycles]);

  const [payslips, setPayslips] = useState<PayslipItem[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_payslips_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PAYSLIPS;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_payslips_v3', JSON.stringify(payslips));
    } catch (e) {}
  }, [payslips]);

  // Dynamic permanent recruitment ATS
  const [jobs, setJobs] = useState<JobOpening[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_jobs_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_JOBS;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_jobs_v3', JSON.stringify(jobs));
    } catch (e) {}
  }, [jobs]);

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_candidates_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CANDIDATES;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_candidates_v3', JSON.stringify(candidates));
    } catch (e) {}
  }, [candidates]);

  // Dynamic permanent expense claims
  const [expenses, setExpenses] = useState<ExpenseClaim[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_expenses_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EXPENSES;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_expenses_v3', JSON.stringify(expenses));
    } catch (e) {}
  }, [expenses]);

  // Dynamic permanent assets
  const [assets, setAssets] = useState<CompanyAsset[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_assets_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ASSETS;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_assets_v3', JSON.stringify(assets));
    } catch (e) {}
  }, [assets]);

  // Dynamic permanent helpdesk tickets
  const [tickets, setTickets] = useState<HelpdeskTicket[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_tickets_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_HELPDESK;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_tickets_v3', JSON.stringify(tickets));
    } catch (e) {}
  }, [tickets]);

  // Dynamic permanent performance OKRs / goals
  const [performanceGoals, setPerformanceGoals] = useState<PerformanceGoal[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_performance_goals_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_performance_goals_v3', JSON.stringify(performanceGoals));
    } catch (e) {}
  }, [performanceGoals]);

  // Extended Enterprise HRMS State (persisted to localStorage & synced via Cloud Firestore)
  const [shifts, setShifts] = useState<ShiftTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_shifts_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_shifts_v1', JSON.stringify(shifts)); } catch {} }, [shifts]);

  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocument[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_employee_documents_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_employee_documents_v1', JSON.stringify(employeeDocuments)); } catch {} }, [employeeDocuments]);

  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_onboarding_tasks_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_onboarding_tasks_v1', JSON.stringify(onboardingTasks)); } catch {} }, [onboardingTasks]);

  const [interviews, setInterviews] = useState<InterviewSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_interviews_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_interviews_v1', JSON.stringify(interviews)); } catch {} }, [interviews]);

  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_offer_letters_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_offer_letters_v1', JSON.stringify(offerLetters)); } catch {} }, [offerLetters]);

  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_performance_reviews_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_performance_reviews_v1', JSON.stringify(performanceReviews)); } catch {} }, [performanceReviews]);

  const [continuousFeedback, setContinuousFeedback] = useState<ContinuousFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_continuous_feedback_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_continuous_feedback_v1', JSON.stringify(continuousFeedback)); } catch {} }, [continuousFeedback]);

  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_announcements_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_announcements_v1', JSON.stringify(announcements)); } catch {} }, [announcements]);

  const [enpsResponses, setEnpsResponses] = useState<EnpsResponse[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_enps_responses_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_enps_responses_v1', JSON.stringify(enpsResponses)); } catch {} }, [enpsResponses]);

  const [employeeLoans, setEmployeeLoans] = useState<EmployeeLoan[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_employee_loans_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => { try { localStorage.setItem('nattonflow_employee_loans_v1', JSON.stringify(employeeLoans)); } catch {} }, [employeeLoans]);

  const [saasBillings, setSaasBillings] = useState<SaaSCompanyBilling[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_saas_billings_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SAAS_BILLINGS;
  });
  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_saas_billings_v3', JSON.stringify(saasBillings));
    } catch (e) {}
  }, [saasBillings]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  
  // Default to false so on initial load the website shows the login page first as requested
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('nattonflow_auth_session');
    return saved === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [demoBookings, setDemoBookings] = useState<ClientDemoBooking[]>(() => {
    const saved = localStorage.getItem('nattonflow_demo_bookings');
    return saved ? JSON.parse(saved) : INITIAL_DEMO_BOOKINGS;
  });

  useEffect(() => {
    localStorage.setItem('nattonflow_demo_bookings', JSON.stringify(demoBookings));
  }, [demoBookings]);

  const [isBookDemoModalOpen, setIsBookDemoModalOpen] = useState(false);
  const [activeDemoRequestForVerification, setActiveDemoRequestForVerification] = useState<ClientDemoBooking | null>(null);
  
  const [dispatchedEmails, setDispatchedEmails] = useState<DispatchedClientEmail[]>(() => {
    const saved = localStorage.getItem('nattonflow_dispatched_emails');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'mail-initial-1',
        recipientName: 'Victoria Sterling',
        recipientEmail: 'victoria.sterling@meridianfintech.com',
        companyName: 'Meridian FinTech Solutions',
        companyDomain: 'meridianfintech.com',
        workspaceUrl: 'https://meridian-fintech.nattonflow.hr/workspace',
        assignedArchitect: 'Marcus Vance (Enterprise Solutions Architect)',
        assignedArchitectEmail: 'marcus.vance@nattonflow.com',
        plan: 'Enterprise',
        seatsAllocated: 250,
        verificationToken: '582914',
        activeModules: ['Automated 8-Stage Payroll', 'Biometric Attendance', 'Time Off & Leave', 'Performance & OKRs'],
        sentAt: '2026-11-10T14:20:00Z',
        status: 'sent',
        tenantId: 'tenant-acme'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('nattonflow_dispatched_emails', JSON.stringify(dispatchedEmails));
  }, [dispatchedEmails]);

  const [activeDispatchedEmailModal, setActiveDispatchedEmailModal] = useState<DispatchedClientEmail | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_notifications_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_notifications_v3', JSON.stringify(allNotifications));
    } catch (e) {}
  }, [allNotifications]);

  const [platformSupportConfig, setPlatformSupportConfig] = useState<PlatformSupportConfig>(() => {
    try {
      const saved = localStorage.getItem('nattonflow_platform_support_config_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PLATFORM_SUPPORT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nattonflow_platform_support_config_v1', JSON.stringify(platformSupportConfig));
    } catch {}
  }, [platformSupportConfig]);

  // =========================================================================
  // REAL-TIME CLOUD FIREBASE FIRESTORE MULTI-DEVICE SYNCHRONIZATION
  // 1. Immediately attaches real-time onSnapshot listeners for core collections
  //    (tenants, saas_billings, users, payroll_cycles) so newly registered clients
  //    appear across ALL devices in real time without waiting on 27 sequential pulls.
  // 2. Flushes any pending offline/interrupted writes and safely reconciles local
  //    non-deleted client tenants & users up to Firestore BEFORE server overwrite.
  // 3. Auto-links tenants <-> saas_billings so every client tenant is visible everywhere.
  // =========================================================================
  const syncCoreFromServer = async (): Promise<boolean> => {
    setIsCloudSyncing(true);
    try {
      await flushPendingCloudWrites();
      const [
        cloudTenants,
        cloudUsers,
        cloudBillings,
        cloudCycles,
        cloudAttendance,
        cloudLeaves,
        cloudSlips,
        cloudNotifs,
        cloudEmails,
        cloudDemos
      ] = await Promise.all([
        fetchCollectionFromServer<Tenant>('tenants'),
        fetchCollectionFromServer<User>('users'),
        fetchCollectionFromServer<SaaSCompanyBilling>('saas_billings'),
        fetchCollectionFromServer<PayrollCycle>('payroll_cycles'),
        fetchCollectionFromServer<AttendanceRecord>('attendance'),
        fetchCollectionFromServer<LeaveRequest>('leaves'),
        fetchCollectionFromServer<PayslipItem>('payslips'),
        fetchCollectionFromServer<AppNotification>('notifications'),
        fetchCollectionFromServer<DispatchedClientEmail>('dispatched_emails'),
        fetchCollectionFromServer<ClientDemoBooking>('demo_bookings')
      ]);

      const mergedTenants = sortTenantsForDisplay(mergeWithPending<Tenant>('tenants', cloudTenants));
      if (mergedTenants.length > 0) {
        setTenants(mergedTenants);
        setCurrentTenant(prev => mergedTenants.find(t => t.id === prev.id) || mergedTenants[0]);
      }

      const mergedUsers = mergeWithPending<User>('users', cloudUsers);
      if (mergedUsers.length > 0) {
        setUsers(mergedUsers);
        setCurrentUser(prev => mergedUsers.find(u => u.id === prev.id) || prev);
      }

      const mergedBillings = sortBillingsForDisplay(mergeWithPending<SaaSCompanyBilling>('saas_billings', cloudBillings));
      if (mergedBillings.length > 0) {
        setSaasBillings(mergedBillings);
      }

      const mergedCycles = mergeWithPending<PayrollCycle>('payroll_cycles', cloudCycles);
      if (mergedCycles.length > 0) {
        setPayrollCycles(mergedCycles);
      }

      setAttendance(cloudAttendance);
      setLeaves(cloudLeaves);
      setPayslips(cloudSlips);
      setAllNotifications(mergeWithPending<AppNotification>('notifications', cloudNotifs));
      const mergedEmails = mergeWithPending<DispatchedClientEmail>('dispatched_emails', cloudEmails);
      if (mergedEmails.length > 0) setDispatchedEmails(mergedEmails);
      setDemoBookings(mergeWithPending<ClientDemoBooking>('demo_bookings', cloudDemos));
      try {
        const supportSnap = await getDoc(doc(db, 'meta', 'platform_support_config'));
        if (supportSnap.exists()) {
          setPlatformSupportConfig(prev => ({ ...prev, ...(supportSnap.data() as PlatformSupportConfig) }));
        }
      } catch {}
      return true;
    } catch (err) {
      console.warn('Core cloud sync notice:', err);
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const syncAllFromCloud = async (): Promise<boolean> => {
    const coreOk = await syncCoreFromServer();
    try {
      const [
        cloudJobs,
        cloudCandidates,
        cloudExpenses,
        cloudTickets,
        cloudAssets,
        cloudGoals,
        cloudAudit,
        cloudShifts,
        cloudDocs,
        cloudOnboarding,
        cloudInterviews,
        cloudOffers,
        cloudReviews,
        cloudFeedback,
        cloudAnnouncements,
        cloudEnps,
        cloudLoans
      ] = await Promise.all([
        fetchCollectionFromServer<JobOpening>('jobs'),
        fetchCollectionFromServer<Candidate>('candidates'),
        fetchCollectionFromServer<ExpenseClaim>('expenses'),
        fetchCollectionFromServer<HelpdeskTicket>('tickets'),
        fetchCollectionFromServer<CompanyAsset>('assets'),
        fetchCollectionFromServer<PerformanceGoal>('performance_goals'),
        fetchCollectionFromServer<AuditLog>('audit_logs'),
        fetchCollectionFromServer<ShiftTemplate>('shifts'),
        fetchCollectionFromServer<EmployeeDocument>('employee_documents'),
        fetchCollectionFromServer<OnboardingTask>('onboarding_tasks'),
        fetchCollectionFromServer<InterviewSchedule>('interviews'),
        fetchCollectionFromServer<OfferLetter>('offer_letters'),
        fetchCollectionFromServer<PerformanceReview>('performance_reviews'),
        fetchCollectionFromServer<ContinuousFeedback>('continuous_feedback'),
        fetchCollectionFromServer<CompanyAnnouncement>('announcements'),
        fetchCollectionFromServer<EnpsResponse>('enps_surveys'),
        fetchCollectionFromServer<EmployeeLoan>('employee_loans')
      ]);

      setJobs(cloudJobs);
      setCandidates(cloudCandidates);
      setExpenses(cloudExpenses);
      setTickets(cloudTickets);
      setAssets(cloudAssets);
      setPerformanceGoals(cloudGoals);
      if (cloudAudit.length > 0) {
        cloudAudit.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAuditLogs(cloudAudit);
      }
      setShifts(cloudShifts);
      setEmployeeDocuments(cloudDocs);
      setOnboardingTasks(cloudOnboarding);
      setInterviews(cloudInterviews);
      setOfferLetters(cloudOffers);
      setPerformanceReviews(cloudReviews);
      setContinuousFeedback(cloudFeedback);
      setAnnouncements(cloudAnnouncements);
      setEnpsResponses(cloudEnps);
      setEmployeeLoans(cloudLoans);
      return coreOk;
    } catch (err) {
      console.warn('Extended cloud sync notice:', err);
      return coreOk;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const unsubscribers: Array<() => void> = [];

    const LEGACY_DUMMY_USER_IDS = new Set([
      'usr-owner-1', 'usr-hr-1', 'usr-pay-1', 'usr-mgr-1', 'usr-lead-1',
      'usr-emp-1', 'usr-rec-1', 'usr-emp-2', 'usr-emp-3', 'usr-globex-owner',
      'usr-globex-hr', 'usr-globex-eng', 'usr-globex-tech', 'usr-hyperion-owner',
      'usr-hyperion-hr', 'usr-hyperion-bio'
    ]);

    const readLocalArray = <T extends { id?: string }>(key: string): T[] => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const subscribeCol = <T,>(
      colName: string,
      onData: (items: T[], fromCache: boolean) => void
    ) => {
      const unsub = onSnapshot(
        collection(db, colName),
        (snapshot) => {
          if (!isMounted) return;
          const list: T[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as T);
          });
          onData(list, snapshot.metadata.fromCache);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, colName, false);
        }
      );
      unsubscribers.push(unsub);
    };

    // STEP 1: Attach real-time listeners for core tenant & identity collections IMMEDIATELY
    // so new client registrations stream live to every device within milliseconds.
    subscribeCol<Tenant>('tenants', (cloudTenants) => {
      const merged = sortTenantsForDisplay(mergeWithPending<Tenant>('tenants', cloudTenants));
      if (merged.length > 0) {
        setTenants(merged);
        setCurrentTenant(prev => merged.find(t => t.id === prev.id) || merged[0]);
      }
    });

    subscribeCol<SaaSCompanyBilling>('saas_billings', (list) => {
      const merged = sortBillingsForDisplay(mergeWithPending<SaaSCompanyBilling>('saas_billings', list));
      if (merged.length > 0) setSaasBillings(merged);
    });

    subscribeCol<User>('users', (cloudUsers) => {
      const merged = mergeWithPending<User>('users', cloudUsers);
      if (merged.length > 0) {
        setUsers(merged);
        setCurrentUser(prev => merged.find(u => u.id === prev.id) || prev);
      }
    });

    subscribeCol<PayrollCycle>('payroll_cycles', (list) => {
      const merged = mergeWithPending<PayrollCycle>('payroll_cycles', list);
      if (merged.length > 0) setPayrollCycles(merged);
    });

    const unsubPlatformSupport = onSnapshot(
      doc(db, 'meta', 'platform_support_config'),
      (snap) => {
        if (!isMounted || !snap.exists()) return;
        const data = snap.data() as PlatformSupportConfig;
        setPlatformSupportConfig(prev => ({ ...prev, ...data }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'meta/platform_support_config', false);
      }
    );
    unsubscribers.push(unsubPlatformSupport);

    async function bootstrapMigrateAndSubscribe() {
      await testFirestoreConnection();
      if (!isMounted) return;

      try {
        // 1. One-time core cloud bootstrap (never re-seeds after deletion)
        const metaRef = doc(db, 'meta', 'bootstrap_v1');
        const metaSnap = await getDoc(metaRef);
        if (!metaSnap.exists() && isMounted) {
          const batch = writeBatch(db);
          INITIAL_TENANTS.forEach(t => {
            batch.set(doc(db, 'tenants', t.id), sanitizeForFirestore(t));
          });
          const initialSupers = INITIAL_USERS.filter(u => u.isAppOwner || u.role === 'tenant_super_admin');
          initialSupers.forEach(u => {
            batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u));
          });
          INITIAL_PAYROLL_CYCLES.forEach(c => {
            batch.set(doc(db, 'payroll_cycles', c.id), sanitizeForFirestore(c));
          });
          INITIAL_NOTIFICATIONS.forEach(n => {
            batch.set(doc(db, 'notifications', n.id), sanitizeForFirestore(n));
          });
          INITIAL_SAAS_BILLINGS.forEach(b => {
            batch.set(doc(db, 'saas_billings', b.id), sanitizeForFirestore(b));
          });
          batch.set(metaRef, { initializedAt: new Date().toISOString(), version: 2 });
          await batch.commit();
        }

        // 2. Always flush any queued/interrupted client writes first
        await flushPendingCloudWrites();

        // 3. Always reconcile non-deleted local client tenants, billings, users, and cycles
        //    with Cloud Firestore so any recently added tenant on THIS device immediately
        //    syncs up to ALL devices even if an earlier write was interrupted.
        const [deletedDocs, serverTenants, serverBillings, serverUsers, serverCycles] = await Promise.all([
          fetchCollectionFromServer<{ collectionName: string; docId: string }>('deleted_ids'),
          fetchCollectionFromServer<Tenant>('tenants'),
          fetchCollectionFromServer<SaaSCompanyBilling>('saas_billings'),
          fetchCollectionFromServer<User>('users'),
          fetchCollectionFromServer<PayrollCycle>('payroll_cycles')
        ]);
        const deletedSet = new Set(deletedDocs.map(d => `${d.collectionName}__${d.docId}`));

        const reconcileBatch: BatchWriteEntry[] = [];

        const serverTenantMap = new Map(serverTenants.map(t => [t.id, t]));
        const localTenants = readLocalArray<Tenant>('nattonflow_tenants');
        for (const lt of localTenants) {
          if (!lt.id || deletedSet.has(`tenants__${lt.id}`)) continue;
          const existing = serverTenantMap.get(lt.id);
          if (!existing) {
            reconcileBatch.push({ collectionName: 'tenants', docId: lt.id, data: lt as unknown as Record<string, unknown> });
            serverTenantMap.set(lt.id, lt);
          } else {
            const defaultSeed = INITIAL_TENANTS.find(t => t.id === lt.id);
            if (defaultSeed && existing.name === defaultSeed.name && lt.name !== defaultSeed.name) {
              reconcileBatch.push({ collectionName: 'tenants', docId: lt.id, data: lt as unknown as Record<string, unknown>, merge: true });
              serverTenantMap.set(lt.id, lt);
            }
          }
        }

        const serverUserMap = new Map(serverUsers.map(u => [u.id, u]));
        const localUsers = readLocalArray<User>('nattonflow_users_v3');
        for (const lu of localUsers) {
          if (!lu.id || LEGACY_DUMMY_USER_IDS.has(lu.id) || deletedSet.has(`users__${lu.id}`)) continue;
          if (!serverUserMap.has(lu.id)) {
            reconcileBatch.push({ collectionName: 'users', docId: lu.id, data: lu as unknown as Record<string, unknown> });
            serverUserMap.set(lu.id, lu);
          }
        }

        const serverBillingMap = new Map(serverBillings.map(b => [b.id, b]));
        const localBillings = readLocalArray<SaaSCompanyBilling>('nattonflow_saas_billings_v3');
        for (const lb of localBillings) {
          if (!lb.id || deletedSet.has(`saas_billings__${lb.id}`)) continue;
          if (!serverBillingMap.has(lb.id)) {
            reconcileBatch.push({ collectionName: 'saas_billings', docId: lb.id, data: lb as unknown as Record<string, unknown> });
            serverBillingMap.set(lb.id, lb);
          }
        }

        const serverCycleMap = new Map(serverCycles.map(c => [c.id, c]));
        const localCycles = readLocalArray<PayrollCycle>('nattonflow_payroll_cycles_v3');
        for (const lc of localCycles) {
          if (!lc.id || deletedSet.has(`payroll_cycles__${lc.id}`)) continue;
          if (!serverCycleMap.has(lc.id)) {
            reconcileBatch.push({ collectionName: 'payroll_cycles', docId: lc.id, data: lc as unknown as Record<string, unknown> });
            serverCycleMap.set(lc.id, lc);
          }
        }

        // Ensure EVERY tenant in Cloud has a linked SaaSCompanyBilling entry so SuperAdminView
        // always lists every provisioned & trial client tenant across all devices
        const allBillingsList = Array.from(serverBillingMap.values());
        for (const tenant of serverTenantMap.values()) {
          const matchedBilling = allBillingsList.find(
            b => b.tenantId === tenant.id || b.companyName.trim().toLowerCase() === tenant.name.trim().toLowerCase()
          );
          if (!matchedBilling) {
            const synthBilling: SaaSCompanyBilling = {
              id: `bill-${tenant.id}`,
              tenantId: tenant.id,
              companyName: tenant.name,
              plan: tenant.plan || 'Enterprise',
              status: tenant.status || 'active',
              activeSeats: Math.max(1, tenant.totalEmployees || 1),
              seatLimit: Math.max(50, (tenant.totalEmployees || 1) * 2),
              monthlyRevenue: tenant.monthlyBilling || (tenant.plan === 'Enterprise' ? 2500 : tenant.plan === 'Professional' ? 1200 : 500),
              renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
              mfaCompliance: tenant.securitySettings?.enforceMfa ? 100 : 85,
              storageUsedGb: 2.5,
              createdAt: tenant.createdAt || new Date().toISOString()
            };
            reconcileBatch.push({
              collectionName: 'saas_billings',
              docId: synthBilling.id,
              data: synthBilling as unknown as Record<string, unknown>
            });
            allBillingsList.push(synthBilling);
          } else if (!matchedBilling.tenantId) {
            reconcileBatch.push({
              collectionName: 'saas_billings',
              docId: matchedBilling.id,
              data: { tenantId: tenant.id },
              merge: true
            });
          }
        }

        if (reconcileBatch.length > 0 && isMounted) {
          // Commit in chunks of 400 (Firestore batch limit is 500)
          for (let i = 0; i < reconcileBatch.length; i += 400) {
            await saveBatchToCloud(reconcileBatch.slice(i, i + 400));
          }
        }

        // 4. One-time safe push of remaining operational localStorage collections
        const alreadyMigrated = localStorage.getItem('nattonflow_cloud_migrated_v2') === 'true';
        if (!alreadyMigrated && isMounted) {
          const migrationTargets: Array<{ col: string; lsKey: string }> = [
            { col: 'attendance', lsKey: 'nattonflow_attendance_v3' },
            { col: 'leaves', lsKey: 'nattonflow_leaves_v3' },
            { col: 'payslips', lsKey: 'nattonflow_payslips_v3' },
            { col: 'jobs', lsKey: 'nattonflow_jobs_v3' },
            { col: 'candidates', lsKey: 'nattonflow_candidates_v3' },
            { col: 'expenses', lsKey: 'nattonflow_expenses_v3' },
            { col: 'tickets', lsKey: 'nattonflow_tickets_v3' },
            { col: 'assets', lsKey: 'nattonflow_assets_v3' },
            { col: 'performance_goals', lsKey: 'nattonflow_performance_goals_v3' },
            { col: 'dispatched_emails', lsKey: 'nattonflow_dispatched_emails' },
            { col: 'notifications', lsKey: 'nattonflow_notifications_v3' },
            { col: 'demo_bookings', lsKey: 'nattonflow_demo_bookings' }
          ];

          for (const target of migrationTargets) {
            const localItems = readLocalArray<Record<string, unknown> & { id?: string }>(target.lsKey);
            if (localItems.length === 0) continue;

            const cloudItems = await fetchCollectionFromServer<Record<string, unknown> & { id?: string }>(target.col);
            const cloudMap = new Map(cloudItems.map(item => [item.id, item]));

            for (const item of localItems) {
              if (!item.id) continue;
              if (deletedSet.has(`${target.col}__${item.id}`)) continue;
              if (!cloudMap.has(item.id)) {
                await saveDocToCloud(target.col, item.id, item);
              }
            }
          }

          try {
            localStorage.setItem('nattonflow_cloud_migrated_v2', 'true');
          } catch {}
        }
      } catch (e) {
        console.warn('Cloud bootstrap/reconciliation notice:', e);
      }

      if (!isMounted) return;

      // 5. Pull fresh server data for core collections so stale localStorage never lingers
      await syncCoreFromServer();
      if (!isMounted) return;

      // 6. Attach remaining real-time onSnapshot listeners
      subscribeCol<AttendanceRecord>('attendance', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setAttendance(list);
      });

      subscribeCol<LeaveRequest>('leaves', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setLeaves(list);
      });

      subscribeCol<AppNotification>('notifications', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setAllNotifications(mergeWithPending<AppNotification>('notifications', list));
      });

      subscribeCol<PayslipItem>('payslips', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setPayslips(list);
      });

      subscribeCol<JobOpening>('jobs', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setJobs(list);
      });

      subscribeCol<Candidate>('candidates', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setCandidates(list);
      });

      subscribeCol<ExpenseClaim>('expenses', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setExpenses(list);
      });

      subscribeCol<HelpdeskTicket>('tickets', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setTickets(list);
      });

      subscribeCol<CompanyAsset>('assets', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setAssets(list);
      });

      subscribeCol<PerformanceGoal>('performance_goals', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setPerformanceGoals(list);
      });

      subscribeCol<DispatchedClientEmail>('dispatched_emails', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setDispatchedEmails(mergeWithPending<DispatchedClientEmail>('dispatched_emails', list));
      });

      subscribeCol<ClientDemoBooking>('demo_bookings', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setDemoBookings(mergeWithPending<ClientDemoBooking>('demo_bookings', list));
      });

      subscribeCol<AuditLog>('audit_logs', (list) => {
        if (list.length > 0) {
          list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setAuditLogs(list);
        }
      });

      subscribeCol<ShiftTemplate>('shifts', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setShifts(list);
      });
      subscribeCol<EmployeeDocument>('employee_documents', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setEmployeeDocuments(list);
      });
      subscribeCol<OnboardingTask>('onboarding_tasks', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setOnboardingTasks(list);
      });
      subscribeCol<InterviewSchedule>('interviews', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setInterviews(list);
      });
      subscribeCol<OfferLetter>('offer_letters', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setOfferLetters(list);
      });
      subscribeCol<PerformanceReview>('performance_reviews', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setPerformanceReviews(list);
      });
      subscribeCol<ContinuousFeedback>('continuous_feedback', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setContinuousFeedback(list);
      });
      subscribeCol<CompanyAnnouncement>('announcements', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setAnnouncements(list);
      });
      subscribeCol<EnpsResponse>('enps_surveys', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setEnpsResponses(list);
      });
      subscribeCol<EmployeeLoan>('employee_loans', (list, fromCache) => {
        if (list.length > 0 || !fromCache) setEmployeeLoans(list);
      });

      if (isMounted) {
        setIsCloudReady(true);
      }
    }

    bootstrapMigrateAndSubscribe();

    // 7. Refresh core collections directly from Firestore server when mobile/desktop tab
    //    returns to foreground or reconnects (skipping while a batch write is in flight)
    let lastRefreshAt = 0;
    const handleForegroundSync = () => {
      if (inFlightBatchRef.current) return;
      const now = Date.now();
      if (now - lastRefreshAt < 4000) return;
      if (document.visibilityState === 'visible') {
        lastRefreshAt = now;
        syncCoreFromServer();
      }
    };

    window.addEventListener('focus', handleForegroundSync);
    window.addEventListener('online', handleForegroundSync);
    document.addEventListener('visibilitychange', handleForegroundSync);

    return () => {
      isMounted = false;
      unsubscribers.forEach(fn => fn());
      window.removeEventListener('focus', handleForegroundSync);
      window.removeEventListener('online', handleForegroundSync);
      document.removeEventListener('visibilitychange', handleForegroundSync);
    };
  }, []);

  // Dynamic Multi-Tenant Isolation: strictly isolate notifications to the active company workspace
  // while surfacing platform-root demo/onboarding alerts to the global Platform Super Admin
  const tenantNotifications = allNotifications.filter(
    n =>
      n.tenantId === currentTenant.id ||
      (currentUser.role === 'super_admin' && n.tenantId === 'platform-root')
  );

  const notificationsCount = tenantNotifications.filter(n => !n.read).length;

  const clearNotifications = () => {
    const toRemove = allNotifications.filter(n => n.tenantId === currentTenant.id);
    setAllNotifications(prev => prev.filter(n => n.tenantId !== currentTenant.id));
    toRemove.forEach(n => {
      deleteDocFromCloud('notifications', n.id);
    });
    showToast(`Cleared all notifications for ${currentTenant.name}.`);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setAllNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    saveDocToCloud('notifications', notificationId, { read: true }, true);
  };

  const markAllNotificationsAsRead = (targetTenantId?: string) => {
    const tenantIdToClear = targetTenantId || currentTenant.id;
    setAllNotifications(prev => prev.map(n => n.tenantId === tenantIdToClear ? { ...n, read: true } : n));
    const targetNotifs = allNotifications.filter(n => n.tenantId === tenantIdToClear);
    targetNotifs.forEach(n => {
      saveDocToCloud('notifications', n.id, { read: true }, true);
    });
    showToast(`Marked all ${currentTenant.name} notifications as read.`);
  };

  const deleteTenantNotification = (notificationId: string) => {
    setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
    deleteDocFromCloud('notifications', notificationId);
    showToast('Notification removed.');
  };

  const addTenantNotification = (data: { 
    tenantId?: string; 
    title: string; 
    description?: string;
    category?: AppNotification['category']; 
    priority?: 'normal' | 'urgent';
    targetView?: string;
  }): AppNotification => {
    const targetTenantId = data.tenantId || currentTenant.id;
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: targetTenantId,
      title: data.title,
      ...(data.description ? { description: data.description } : {}),
      time: 'Just now',
      read: false,
      category: data.category || 'announcement',
      priority: data.priority || 'normal',
      targetView: data.targetView || 'dashboard',
      createdBy: currentUser.name
    };
    setAllNotifications(prev => [newNotif, ...prev]);
    saveDocToCloud('notifications', newNotif.id, newNotif as unknown as Record<string, unknown>);
    return newNotif;
  };

  // Update Tenant profile & security policies permanently across all devices
  const updateTenant = (tenantId: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const updated: Tenant = {
          ...t,
          ...updates,
          securitySettings: updates.securitySettings
            ? { ...t.securitySettings, ...updates.securitySettings }
            : t.securitySettings
        };
        saveDocToCloud('tenants', tenantId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return t;
    }));
    setCurrentTenant(prev => {
      if (prev.id === tenantId) {
        return {
          ...prev,
          ...updates,
          securitySettings: updates.securitySettings
            ? { ...prev.securitySettings, ...updates.securitySettings }
            : prev.securitySettings
        };
      }
      return prev;
    });
    logAction('TENANT_UPDATED', `Updated organization settings for ${updates.name || tenantId}`, 'medium');
  };

  // Permanent Employee CRUD operations with Real-time Cloud Persistence (Sanitized for Firestore)
  const addEmployee = (data: Omit<User, 'id'>): User => {
    const newEmp: User = sanitizeForFirestore({
      ...data,
      id: `usr-emp-${Date.now()}`
    });
    // 1. Optimistic state update for instant UI feedback
    setUsers(prev => [newEmp, ...prev]);

    // 2. Permanent Cloud Firestore storage across all devices (mobile & desktop)
    saveDocToCloud('users', newEmp.id, newEmp as unknown as Record<string, unknown>).then(ok => {
      if (!ok) {
        showToast('Warning: Cloud sync failed for new employee. Check network connection.');
      }
    });

    logAction('EMPLOYEE_PERMANENTLY_ADDED', `Added ${newEmp.name} (${newEmp.employeeCode}) to company ${newEmp.tenantId}`, 'medium');
    
    // Add notification strictly for that company
    addTenantNotification({
      tenantId: newEmp.tenantId,
      title: `New Team Member Onboarded: ${newEmp.name}`,
      description: `${newEmp.name} joined as ${newEmp.title} in ${newEmp.department} (${newEmp.employeeCode}).`,
      category: 'onboarding',
      priority: 'normal',
      targetView: 'employees'
    });

    showToast(`Added ${newEmp.name} to permanent cloud database! Synced across all devices.`);
    return newEmp;
  };

  const deleteEmployee = (employeeId: string): boolean => {
    const target = users.find(u => u.id === employeeId);
    if (!target) return false;

    // Collect related records across ALL months to purge from Firestore as well
    const empAttendanceIds = attendance.filter(a => a.employeeId === employeeId).map(a => a.id);
    const empLeaveIds = leaves.filter(l => l.employeeId === employeeId).map(l => l.id);
    const empPayslips = payslips.filter(p => p.employeeId === employeeId);
    const empPayslipIds = empPayslips.map(p => p.id);
    const affectedCycleIds = new Set(empPayslips.map(p => p.payrollCycleId));
    const empExpenseIds = expenses.filter(e => e.employeeId === employeeId).map(e => e.id);
    const empTicketIds = tickets.filter(t => t.employeeId === employeeId).map(t => t.id);

    const remainingPayslips = payslips.filter(p => p.employeeId !== employeeId);

    // Permanently remove employee and cascade to all related records in local state
    setUsers(prev => prev.filter(u => u.id !== employeeId));
    setAttendance(prev => prev.filter(a => a.employeeId !== employeeId));
    setLeaves(prev => prev.filter(l => l.employeeId !== employeeId));
    setPayslips(remainingPayslips);
    setExpenses(prev => prev.filter(e => e.employeeId !== employeeId));
    setTickets(prev => prev.filter(t => t.employeeId !== employeeId));

    // Recalculate affected monthly payroll cycle totals so deleted employee is removed cleanly
    if (affectedCycleIds.size > 0) {
      setPayrollCycles(prev => prev.map(cycle => {
        if (!affectedCycleIds.has(cycle.id)) return cycle;
        const cycleMonthKey = extractMonthKeyFromCycle(cycle);
        const cycleSlips = remainingPayslips.filter(
          p => p.tenantId === cycle.tenantId &&
            (p.payrollCycleId === cycle.id || extractMonthKeyFromPayslip(p, prev) === cycleMonthKey)
        );
        const updated: PayrollCycle = {
          ...cycle,
          employeeCount: cycleSlips.length,
          totalGross: cycleSlips.reduce((sum, s) => sum + (s.grossEarnings || 0), 0),
          totalDeductions: cycleSlips.reduce((sum, s) => sum + (s.totalDeductions || 0), 0),
          totalNet: cycleSlips.reduce((sum, s) => sum + (s.netPayable || 0), 0)
        };
        saveDocToCloud('payroll_cycles', cycle.id, updated as unknown as Record<string, unknown>, true);
        return updated;
      }));
    }

    // Permanently remove employee & all stored monthly payslips from Cloud Firestore database
    deleteDocFromCloud('users', employeeId);
    empAttendanceIds.forEach(id => deleteDocFromCloud('attendance', id));
    empLeaveIds.forEach(id => deleteDocFromCloud('leaves', id));
    empPayslipIds.forEach(id => deleteDocFromCloud('payslips', id));
    empExpenseIds.forEach(id => deleteDocFromCloud('expenses', id));
    empTicketIds.forEach(id => deleteDocFromCloud('tickets', id));

    // Sweep Firestore directly for any stored historical monthly payslips belonging to this deleted employee
    void getDocs(query(collection(db, 'payslips'), where('employeeId', '==', employeeId)))
      .then((snap) => {
        snap.forEach((docSnap) => {
          if (!empPayslipIds.includes(docSnap.id)) {
            void deleteDocFromCloud('payslips', docSnap.id);
          }
        });
      })
      .catch(() => {
        // Already deleted loaded payslip IDs above
      });

    logAction('EMPLOYEE_PERMANENTLY_DELETED', `Permanently deleted employee ${target.name} (${target.employeeCode}) and purged all current & historical monthly payslips from database`, 'critical');

    // Notify company
    addTenantNotification({
      tenantId: target.tenantId,
      title: `Employee Record Deleted: ${target.name}`,
      description: `Staff member ${target.name} (${target.employeeCode}) and all stored monthly payslips were permanently removed.`,
      category: 'security',
      priority: 'urgent',
      targetView: 'employees'
    });

    // If deleting current user, switch to safe fallback
    if (currentUser.id === employeeId) {
      const fallback = users.find(u => u.id !== employeeId && u.tenantId === target.tenantId) || users.find(u => u.id !== employeeId);
      if (fallback) setCurrentUser(fallback);
    }
    showToast(`Employee ${target.name} and all stored monthly payslips permanently deleted from cloud database.`);
    return true;
  };

  const updateEmployee = (employeeId: string, updates: Partial<User>) => {
    const cleanUpdates = sanitizeForFirestore(updates);
    const targetUser = users.find(u => u.id === employeeId);
    setUsers(prev => prev.map(u => u.id === employeeId ? { ...u, ...cleanUpdates } : u));
    saveDocToCloud('users', employeeId, cleanUpdates as unknown as Record<string, unknown>, true);
    if (cleanUpdates.phone && targetUser) {
      if (targetUser.isAppOwner || targetUser.role === 'super_admin') {
        updatePlatformSupportConfig({ whatsappNumber: cleanUpdates.phone });
      } else if (targetUser.role === 'company_owner' || targetUser.role === 'tenant_super_admin') {
        updateTenant(targetUser.tenantId, { whatsappNumber: cleanUpdates.phone });
      }
    }
    logAction('EMPLOYEE_UPDATED', `Updated details for employee #${employeeId}`, 'low');
  };

  const assignCompanySuperAdmin = (companyId: string, userId: string) => {
    const updates = {
      role: 'tenant_super_admin' as const,
      companySuperAdminTenantId: companyId,
      tenantId: companyId
    };
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          ...updates
        };
      }
      return u;
    }));
    saveDocToCloud('users', userId, updates as unknown as Record<string, unknown>, true);
    const targetUser = users.find(u => u.id === userId);
    const targetTenant = tenants.find(t => t.id === companyId);
    logAction('COMPANY_SUPER_ADMIN_APPOINTED', `Appointed ${targetUser?.name || userId} as Company Super Admin for ${targetTenant?.name || companyId}`, 'high');
    addTenantNotification({
      tenantId: companyId,
      title: `Company Super Admin Appointed: ${targetUser?.name}`,
      description: `${targetUser?.name} was appointed as Company Super Admin with complete tenant governance.`,
      category: 'security',
      priority: 'urgent',
      targetView: 'dashboard'
    });
    showToast(`Appointed Company Super Admin for ${targetTenant?.name || companyId}!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const logAction = (action: string, resource: string, severity: AuditLog['severity'] = 'low') => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: currentTenant.id,
      actorName: currentUser.name,
      actorRole: currentUser.role.replace('_', ' ').toUpperCase(),
      action,
      resource,
      ipAddress: '198.51.100.' + Math.floor(Math.random() * 50 + 10),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      severity
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveDocToCloud('audit_logs', newLog.id, newLog as unknown as Record<string, unknown>);
  };

  const switchRole = (role: UserRole) => {
    // 1. Try to find a user in the current company with this role
    let match = users.find(u => u.role === role && u.tenantId === currentTenant.id);
    
    // 2. Fallback to any user with this role
    if (!match) {
      match = users.find(u => u.role === role);
    }

    // 3. If no user exists with this role, dynamically synthesize a corporate persona for this company
    if (!match) {
      const tenantObj = currentTenant;
      const rolePersonaTemplates: Record<UserRole, Partial<User>> = {
        super_admin: {
          name: 'Elena Vance (Application Owner)',
          email: 'elena.vance@nattonflow.internal',
          title: 'Chief SaaS Architect & Application Owner',
          department: 'Platform Architecture & Ownership',
          employeeCode: 'ROOT-001',
          salaryBase: 350000,
          isAppOwner: true
        },
        tenant_super_admin: {
          name: `Vikram Malhotra (${tenantObj.name} Super Admin)`,
          email: `admin@${tenantObj.domain}`,
          title: 'Executive VP & Company Super Admin',
          department: 'Executive Governance',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-SUP-01`,
          salaryBase: 220000
        },
        company_owner: {
          name: `Rajesh V. Singhania (${tenantObj.name} Owner)`,
          email: `founder@${tenantObj.domain}`,
          title: 'Managing Director & Enterprise Client Owner',
          department: 'Executive Governance',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-OWN-01`,
          salaryBase: 300000
        },
        hr_admin: {
          name: `Priya Nair (HR Admin - ${tenantObj.name})`,
          email: `hr@${tenantObj.domain}`,
          title: 'Lead HR Operations Partner',
          department: 'Human Resources',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-HR-01`,
          salaryBase: 145000
        },
        payroll_admin: {
          name: `David Chen (Payroll Admin - ${tenantObj.name})`,
          email: `payroll@${tenantObj.domain}`,
          title: 'Principal Payroll & Tax Compliance Lead',
          department: 'Finance & Accounts',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-PAY-01`,
          salaryBase: 155000
        },
        manager: {
          name: `Rachel K. Albright (Dept Manager - ${tenantObj.name})`,
          email: `manager@${tenantObj.domain}`,
          title: 'Engineering & Department Delivery Manager',
          department: 'Engineering',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-MGR-01`,
          salaryBase: 185000
        },
        team_lead: {
          name: `Aman Verma (Team Lead - ${tenantObj.name})`,
          email: `teamlead@${tenantObj.domain}`,
          title: 'Senior Technical Lead',
          department: 'Engineering',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-TL-01`,
          salaryBase: 135000
        },
        employee: {
          name: `Dev Patel (Staff Member - ${tenantObj.name})`,
          email: `dev@${tenantObj.domain}`,
          title: 'Product Engineer',
          department: 'Engineering',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-EMP-01`,
          salaryBase: 95000
        },
        recruiter: {
          name: `Sarah Jenkins (Talent Recruiter - ${tenantObj.name})`,
          email: `recruiter@${tenantObj.domain}`,
          title: 'Senior Talent Acquisition Specialist',
          department: 'Human Resources',
          employeeCode: `${tenantObj.slug.substring(0, 3).toUpperCase()}-REC-01`,
          salaryBase: 110000
        }
      };

      const template = rolePersonaTemplates[role] || rolePersonaTemplates.employee;
      const sessionPersona: User = sanitizeForFirestore({
        id: `usr-session-${role}-${currentTenant.id}`,
        tenantId: currentTenant.id,
        name: template.name || 'Corporate Team Member',
        email: template.email || `user@${tenantObj.domain}`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: role,
        title: template.title || 'Staff',
        department: template.department || 'Operations',
        employeeCode: template.employeeCode || 'EMP-100',
        phone: '+91 98450 ' + Math.floor(10000 + Math.random() * 90000),
        joinDate: '2024-03-01',
        salaryBase: template.salaryBase || 100000,
        leaveBalances: { paid: 24, sick: 12, casual: 6, unpaid: 0 },
        status: 'active',
        isAppOwner: template.isAppOwner
      });

      // Keep role preview isolated to session without injecting dummy records into permanent DB
      match = sessionPersona;
    }

    setCurrentUser(match);
    logAction('USER_ROLE_SWITCHED', `Switched context to ${role}`, 'low');
    showToast(`Switched active profile to ${match.name} (${match.role.replace('_', ' ')})`);
    
    // Dedicated Auto-Routing per User Request:
    // When switching to Payroll Admin -> Route immediately to 'payroll' engine
    // When switching to Department Manager -> Route immediately to 'dashboard'
    // When switching to Super Admin -> Route to 'super_admin'
    // When switching to Recruiter -> Route to 'recruitment'
    if (role === 'payroll_admin') {
      setCurrentView('payroll');
    } else if (role === 'manager') {
      setCurrentView('dashboard');
    } else if (role === 'super_admin') {
      setCurrentView('super_admin');
    } else if (role === 'recruiter') {
      setCurrentView('recruitment');
    } else {
      // Re-validate and sanitize current view: If restricted for this role, auto-redirect to dashboard
      const demoAllowed = ['super_admin', 'tenant_super_admin', 'hr_admin'];
      if (currentView === 'demo_bookings' && !demoAllowed.includes(role)) {
        setCurrentView('dashboard');
      } else if (currentView === 'super_admin') {
        setCurrentView('dashboard');
      } else if (currentView === 'settings' && !['tenant_super_admin', 'company_owner', 'hr_admin'].includes(role)) {
        setCurrentView('dashboard');
      }
    }
  };

  const switchTenant = (tenantId: TenantId) => {
    const target = tenants.find(t => t.id === tenantId);
    if (target) {
      setCurrentTenant(target);
      try {
        localStorage.setItem('nattonflow_active_tenant_id', target.id);
      } catch {}
      logAction('TENANT_SWITCHED', `Switched active company to ${target.name}`, 'medium');
      showToast(`Active organization switched to: ${target.name}`);
    }
  };

  const checkInCurrentEmployee = (
    locationVerified: boolean = true,
    customLocationName?: string,
    isRemotePunch: boolean = false
  ): boolean => {
    const office = currentTenant.officeLocation
      ? { tenantId: currentTenant.id, ...currentTenant.officeLocation }
      : TENANT_OFFICE_LOCATIONS[currentTenant.id] || {
          tenantId: currentTenant.id,
          name: `${currentTenant.name} Corporate Office`,
          campus: 'Corporate Tech Campus',
          address: 'Devarabeesanahalli',
          city: 'Bengaluru, Karnataka',
          lat: 12.9260,
          lng: 77.6762,
          allowedRadiusMeters: 300,
          authorizedSubnet: '198.51.100.0/24'
        };

    if (locationVerified === false && !isRemotePunch) {
      showToast(`Location Verification Required: Please verify your current location before punching in.`);
      return false;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    // Check if record already exists for today in this tenant
    const existing = attendance.find(
      a => a.employeeId === currentUser.id && a.tenantId === currentTenant.id && a.date === todayStr
    );
    if (existing) {
      showToast('You are already checked in for today!');
      return false;
    }

    const locationName = customLocationName || `${office.name} (${office.campus})`;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      date: todayStr,
      checkIn: timeStr,
      checkOut: null,
      status: isRemotePunch ? 'remote' : 'present',
      workHours: 0.1,
      location: locationName,
      officeLocationVerified: !isRemotePunch,
      officeCampus: isRemotePunch ? locationName : office.campus,
      ipAddress: isRemotePunch ? 'Remote Verified IP' : office.authorizedSubnet.split('/')[0]
    };

    setAttendance(prev => [newRecord, ...prev]);
    // Save to Firestore so check-in is immediately synchronized to all devices
    saveDocToCloud('attendance', newRecord.id, newRecord as unknown as Record<string, unknown>);

    if (isRemotePunch) {
      logAction('EMPLOYEE_REMOTE_CHECKED_IN', `Remote check-in recorded at ${timeStr} [Verified Location: ${locationName}]`, 'low');
      addTenantNotification({
        tenantId: currentTenant.id,
        category: 'attendance',
        title: `${currentUser.name} clocked in remotely at ${timeStr} (${locationName})`
      });
      showToast(`Remote Check-In Recorded at ${timeStr} (${locationName}).`);
    } else {
      logAction('EMPLOYEE_CHECKED_IN', `Check-in recorded at ${timeStr} [Office Location Verified: ${office.campus}]`, 'low');
      addTenantNotification({
        tenantId: currentTenant.id,
        category: 'attendance',
        title: `${currentUser.name} clocked in at ${timeStr} (Office Geofence Verified: ${office.campus})`
      });
      showToast(`Office Geofence Verified: Clocked in at ${timeStr} (${office.campus}). Have a great day!`);
    }
    return true;
  };

  const checkOutCurrentEmployee = (
    locationVerified: boolean = true,
    customLocationName?: string,
    isRemotePunch: boolean = false
  ): boolean => {
    const office = currentTenant.officeLocation
      ? { tenantId: currentTenant.id, ...currentTenant.officeLocation }
      : TENANT_OFFICE_LOCATIONS[currentTenant.id] || {
          tenantId: currentTenant.id,
          name: `${currentTenant.name} Corporate Office`,
          campus: 'Corporate Tech Campus',
          address: 'Devarabeesanahalli',
          city: 'Bengaluru, Karnataka',
          lat: 12.9260,
          lng: 77.6762,
          allowedRadiusMeters: 300,
          authorizedSubnet: '198.51.100.0/24'
        };

    if (locationVerified === false && !isRemotePunch) {
      showToast(`Location Verification Required: Please verify your current location before punching out.`);
      return false;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let found = false;
    setAttendance(prev => prev.map(rec => {
      if (rec.employeeId === currentUser.id && rec.tenantId === currentTenant.id && (!rec.checkOut || rec.checkOut === '-')) {
        found = true;
        const updatedRec: AttendanceRecord = {
          ...rec,
          checkOut: timeStr,
          workHours: Math.max(rec.workHours, 8.2),
          officeLocationVerified: isRemotePunch ? false : true,
          officeCampus: isRemotePunch ? (customLocationName || rec.officeCampus || rec.location) : office.campus
        };
        saveDocToCloud('attendance', rec.id, updatedRec as unknown as Record<string, unknown>, true);
        return updatedRec;
      }
      return rec;
    }));

    if (found) {
      if (isRemotePunch) {
        const locLabel = customLocationName || 'Verified Remote Location';
        logAction('EMPLOYEE_REMOTE_CHECKED_OUT', `Remote check-out recorded at ${timeStr} [${locLabel}]`, 'low');
        addTenantNotification({
          tenantId: currentTenant.id,
          category: 'attendance',
          title: `${currentUser.name} clocked out remotely at ${timeStr} (${locLabel})`
        });
        showToast(`Remote Check-Out Recorded at ${timeStr}!`);
      } else {
        logAction('EMPLOYEE_CHECKED_OUT', `Check-out recorded at ${timeStr} [Office Location Verified: ${office.campus}]`, 'low');
        addTenantNotification({
          tenantId: currentTenant.id,
          category: 'attendance',
          title: `${currentUser.name} clocked out at ${timeStr} (Office Verified: ${office.campus})`
        });
        showToast(`Office Geofence Verified: Checked out successfully at ${timeStr}!`);
      }
      return true;
    } else {
      showToast('No active check-in session found for checkout.');
      return false;
    }
  };

  const requestAttendanceCorrection = (date: string, reason: string, customLocation?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const existing = attendance.find(
      rec => rec.employeeId === currentUser.id && rec.tenantId === currentTenant.id && rec.date === targetDate
    );

    if (existing) {
      const updated: AttendanceRecord = {
        ...existing,
        correctionRequested: true,
        correctionReason: reason,
        correctionStatus: 'pending',
        ...(customLocation ? { location: customLocation } : {})
      };
      setAttendance(prev => prev.map(rec => rec.id === existing.id ? updated : rec));
      saveDocToCloud('attendance', existing.id, updated as unknown as Record<string, unknown>, true);
    } else {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newRecord: AttendanceRecord = {
        id: `att-reg-${Date.now()}`,
        tenantId: currentTenant.id,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department,
        date: targetDate,
        checkIn: timeStr,
        checkOut: null,
        status: 'remote',
        workHours: 0,
        location: customLocation || 'Remote / Off-Site (Pending Manager Approval)',
        officeLocationVerified: false,
        officeCampus: customLocation || 'Remote Location',
        ipAddress: '198.51.100.22',
        correctionRequested: true,
        correctionReason: reason,
        correctionStatus: 'pending'
      };
      setAttendance(prev => [newRecord, ...prev]);
      saveDocToCloud('attendance', newRecord.id, newRecord as unknown as Record<string, unknown>);
    }

    logAction('ATTENDANCE_CORRECTION_REQUESTED', `Date: ${targetDate}, Location: ${customLocation || 'Standard'}, Reason: ${reason}`, 'low');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'attendance',
      title: `${currentUser.name} submitted attendance regularization request (${targetDate})`
    });
    showToast('Attendance regularization request submitted to your reporting manager.');
  };

  const approveAttendanceCorrection = (recordId: string) => {
    setAttendance(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const updated = {
          ...rec,
          status: 'present' as const,
          correctionStatus: 'approved' as const
        };
        saveDocToCloud('attendance', rec.id, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return rec;
    }));
    logAction('ATTENDANCE_CORRECTION_APPROVED', `Record ID: ${recordId}`, 'medium');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'attendance',
      title: `Attendance regularization approved for staff member`
    });
    showToast('Attendance regularization approved and synchronized to payroll.');
  };

  const toggleAttendanceBreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const active = attendance.find(
      a => a.tenantId === currentTenant.id && a.employeeId === currentUser.id && a.date === todayStr && (!a.checkOut || a.checkOut === '-')
    );
    if (!active) {
      showToast('Please punch in first before starting a break.');
      return;
    }
    const nowIso = new Date().toISOString();
    let updated: AttendanceRecord;
    if (active.onBreakSince) {
      const elapsedMins = Math.max(1, Math.round((Date.now() - new Date(active.onBreakSince).getTime()) / 60000));
      updated = {
        ...active,
        breakMinutes: (active.breakMinutes || 0) + elapsedMins,
        onBreakSince: null
      };
      showToast(`Break ended (${elapsedMins} min logged; total break: ${updated.breakMinutes} min).`);
    } else {
      updated = {
        ...active,
        onBreakSince: nowIso
      };
      showToast('Break started. Click "End Break" when resuming shift.');
    }
    setAttendance(prev => prev.map(a => (a.id === active.id ? updated : a)));
    saveDocToCloud('attendance', active.id, updated as unknown as Record<string, unknown>, true);
  };

  const logOvertimeForRecord = (recordId: string, overtimeHours: number) => {
    const safeHours = Math.max(0, Math.min(12, Number(overtimeHours) || 0));
    setAttendance(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const updated: AttendanceRecord = {
          ...rec,
          overtimeHours: safeHours,
          workHours: Number((Math.max(8, rec.workHours || 8) + safeHours).toFixed(1))
        };
        saveDocToCloud('attendance', rec.id, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return rec;
    }));
    logAction('OVERTIME_LOGGED', `Logged ${safeHours}h overtime on attendance record #${recordId}`, 'low');
    showToast(`Overtime (${safeHours}h) saved and synced to monthly payroll.`);
  };

  const applyLeave = (
    leaveType: LeaveRequest['leaveType'], 
    startDate: string, 
    endDate: string, 
    days: number, 
    reason: string
  ) => {
    const newLeave: LeaveRequest = {
      id: `lv-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
      approverId: currentUser.managerId || 'usr-mgr-1',
      approverName: currentUser.managerName || 'Rachel K. Albright'
    };

    setLeaves(prev => [newLeave, ...prev]);
    saveDocToCloud('leaves', newLeave.id, newLeave as unknown as Record<string, unknown>);

    logAction('LEAVE_APPLICATION_SUBMITTED', `${days} days ${leaveType} (${startDate} to ${endDate})`, 'low');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'leave',
      title: `${currentUser.name} applied for ${days} days ${leaveType} (${currentUser.department})`
    });
    showToast(`Leave request for ${days} day(s) submitted for manager approval.`);
  };

  const updateLeaveStatus = (leaveId: string, status: 'approved' | 'rejected', notes?: string) => {
    setLeaves(prev => prev.map(lv => {
      if (lv.id === leaveId) {
        const updated = {
          ...lv,
          status,
          approvalNotes: notes || (status === 'approved' ? 'Approved by Manager' : 'Declined due to coverage constraints')
        };
        saveDocToCloud('leaves', leaveId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return lv;
    }));
    logAction(`LEAVE_${status.toUpperCase()}`, `Leave request #${leaveId} set to ${status}`, 'medium');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'leave',
      title: `Leave request #${leaveId.slice(-4)} was ${status} by ${currentUser.name}`
    });
    showToast(`Leave request ${status} successfully.`);
  };

  // Permanently store monthly payslips & cycle in Firestore for a specific month ("YYYY-MM").
  // Previous months are never overwritten once stored unless forceRecalculate is explicitly requested.
  const storeMonthlyPayslips = (
    monthKey: string,
    options?: { forceRecalculate?: boolean; silent?: boolean }
  ) => {
    const currentMonthKey = getCurrentMonthKey();
    const isPresentMonth = monthKey === currentMonthKey;
    const isPastMonth = monthKey < currentMonthKey;
    const forceRecalculate = Boolean(options?.forceRecalculate);
    const silent = Boolean(options?.silent);

    const existingCycle = payrollCycles.find(
      c => c.tenantId === currentTenant.id && extractMonthKeyFromCycle(c) === monthKey
    );
    const cycleId = existingCycle?.id || getMonthlyCycleId(currentTenant.id, monthKey);
    const monthLabel = formatMonthKeyLabel(monthKey);
    const { periodStart, periodEnd } = getMonthPeriodBounds(monthKey);

    const existingMonthSlips = payslips.filter(
      p => p.tenantId === currentTenant.id && extractMonthKeyFromPayslip(p, payrollCycles) === monthKey
    );
    const existingByEmpId = new Map(existingMonthSlips.map(s => [s.employeeId, s]));

    const computed = computeTenantPayrollFromAttendanceAndLeaves({
      tenantId: currentTenant.id,
      cycleId,
      monthKey,
      cycleStatus: isPastMonth || existingCycle?.status === 'published' ? 'published' : 'approved',
      users,
      attendance,
      leaves
    });

    if (computed.payslips.length === 0) return;

    const slipsToPersist: PayslipItem[] = [];
    const finalMonthSlips: PayslipItem[] = [];

    computed.payslips.forEach(compSlip => {
      const existingSlip = existingByEmpId.get(compSlip.employeeId);
      // Preserve previously stored historical month payslips untouched unless explicitly recalculated
      if (isPastMonth && existingSlip && !forceRecalculate) {
        finalMonthSlips.push(existingSlip);
        return;
      }

      const storable = toStorablePayslip({
        ...compSlip,
        status: isPastMonth || existingCycle?.status === 'published' ? 'published' : compSlip.status
      });

      const changed =
        !existingSlip ||
        existingSlip.netPayable !== storable.netPayable ||
        existingSlip.grossEarnings !== storable.grossEarnings ||
        existingSlip.totalDeductions !== storable.totalDeductions ||
        existingSlip.paidDays !== storable.paidDays ||
        existingSlip.unpaidDays !== storable.unpaidDays ||
        existingSlip.attendanceLogsCount !== storable.attendanceLogsCount ||
        existingSlip.approvedPaidLeaveDays !== storable.approvedPaidLeaveDays ||
        existingSlip.approvedUnpaidLeaveDays !== storable.approvedUnpaidLeaveDays ||
        existingSlip.monthKey !== storable.monthKey ||
        existingSlip.employeeName !== storable.employeeName ||
        forceRecalculate;

      if (changed) {
        slipsToPersist.push(storable);
      }
      finalMonthSlips.push(changed ? storable : existingSlip);
    });

    const totalGross = finalMonthSlips.reduce((sum, s) => sum + (s.grossEarnings || 0), 0);
    const totalDeductions = finalMonthSlips.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);
    const totalNet = finalMonthSlips.reduce((sum, s) => sum + (s.netPayable || 0), 0);

    const nextCycle: PayrollCycle = {
      id: cycleId,
      tenantId: currentTenant.id,
      month: monthLabel,
      monthKey,
      periodStart,
      periodEnd,
      status: isPastMonth
        ? 'published'
        : existingCycle?.status === 'published'
        ? 'published'
        : 'approved',
      employeeCount: finalMonthSlips.length,
      totalGross,
      totalDeductions,
      totalNet,
      warningsCount: 0,
      processedAt:
        existingCycle?.processedAt ||
        (isPastMonth ? `${periodEnd} 18:00` : new Date().toISOString().replace('T', ' ').slice(0, 16))
    };

    const cycleChanged =
      !existingCycle ||
      existingCycle.monthKey !== nextCycle.monthKey ||
      existingCycle.totalNet !== nextCycle.totalNet ||
      existingCycle.totalGross !== nextCycle.totalGross ||
      existingCycle.totalDeductions !== nextCycle.totalDeductions ||
      existingCycle.employeeCount !== nextCycle.employeeCount;

    if (slipsToPersist.length > 0) {
      setPayslips(prev => {
        const persistedIds = new Set(slipsToPersist.map(s => s.id));
        const kept = prev.filter(p => !persistedIds.has(p.id));
        return [...kept, ...slipsToPersist];
      });
      slipsToPersist.forEach(slip => {
        saveDocToCloud('payslips', slip.id, slip as unknown as Record<string, unknown>, true);
      });
    }

    if (cycleChanged) {
      setPayrollCycles(prev => {
        const exists = prev.some(c => c.id === nextCycle.id);
        if (exists) {
          return prev.map(c => (c.id === nextCycle.id ? nextCycle : c));
        }
        return [nextCycle, ...prev];
      });
      saveDocToCloud('payroll_cycles', nextCycle.id, nextCycle as unknown as Record<string, unknown>, true);
    }

    if (!silent) {
      showToast(
        `${monthLabel} payslips stored permanently in cloud (${finalMonthSlips.length} staff · Total Given: ₹${totalNet.toLocaleString('en-IN')}).`
      );
    } else if (isPresentMonth && slipsToPersist.length > 0) {
      // Silently persisted present month updates across devices
    }
  };

  // Automatic cloud archival: always stores Present Month (live) + Previous 2 Months (archived permanently)
  // Never overwrites already-stored previous months, and never deletes payslips except via deleteEmployee.
  useEffect(() => {
    if (!isCloudReady) return;
    const tenantEmps = users.filter(u => u.tenantId === currentTenant.id);
    if (tenantEmps.length === 0) return;

    const recentMonths = getRecentMonthKeys(3); // [presentMonth, prevMonth1, prevMonth2]
    const currentMonthKey = recentMonths[0];

    const sig = JSON.stringify({
      t: currentTenant.id,
      m: currentMonthKey,
      u: tenantEmps.map(u => `${u.id}:${u.name}:${u.salaryBase}:${u.department}:${u.title}`).sort(),
      a: attendance
        .filter(a => a.tenantId === currentTenant.id && (a.date || '').startsWith(currentMonthKey))
        .map(a => `${a.id}:${a.status}:${a.workHours}`),
      l: leaves
        .filter(
          l =>
            l.tenantId === currentTenant.id &&
            ((l.startDate || '').startsWith(currentMonthKey) || (l.endDate || '').startsWith(currentMonthKey))
        )
        .map(l => `${l.id}:${l.status}:${l.leaveType}:${l.days}`),
      cCount: payrollCycles.filter(c => c.tenantId === currentTenant.id).length
    });

    if (lastMonthlySyncSigRef.current === sig) return;
    lastMonthlySyncSigRef.current = sig;

    recentMonths.forEach((mKey) => {
      storeMonthlyPayslips(mKey, { forceRecalculate: false, silent: true });
    });
  }, [isCloudReady, currentTenant.id, users, attendance, leaves]);

  const runPayrollValidation = (cycleId: string) => {
    const existingCycle = payrollCycles.find(c => c.id === cycleId);
    const monthKey = existingCycle ? extractMonthKeyFromCycle(existingCycle) : getCurrentMonthKey();
    storeMonthlyPayslips(monthKey, { forceRecalculate: true, silent: false });
  };

  const approvePayrollCycle = (cycleId: string) => {
    const existingCycle = payrollCycles.find(c => c.id === cycleId);
    const monthKey = existingCycle ? extractMonthKeyFromCycle(existingCycle) : getCurrentMonthKey();
    storeMonthlyPayslips(monthKey, { forceRecalculate: monthKey === getCurrentMonthKey(), silent: true });
    logAction('PAYROLL_APPROVED_BY_ADMIN', `Cycle #${cycleId} (${formatMonthKeyLabel(monthKey)}) authorized for release.`, 'high');
    showToast(`Payroll for ${formatMonthKeyLabel(monthKey)} authorized and stored.`);
  };

  const publishPayrollCycle = (cycleId: string) => {
    const processedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const existingCycle = payrollCycles.find(c => c.id === cycleId);
    const monthKey = existingCycle ? extractMonthKeyFromCycle(existingCycle) : getCurrentMonthKey();
    const resolvedCycleId = existingCycle?.id || getMonthlyCycleId(currentTenant.id, monthKey);
    const monthLabel = formatMonthKeyLabel(monthKey);
    const { periodStart, periodEnd } = getMonthPeriodBounds(monthKey);

    const computed = computeTenantPayrollFromAttendanceAndLeaves({
      tenantId: currentTenant.id,
      cycleId: resolvedCycleId,
      monthKey,
      cycleStatus: 'published',
      users,
      attendance,
      leaves
    });
    const publishedSlips: PayslipItem[] = computed.payslips.map(slip =>
      toStorablePayslip({ ...slip, status: 'published' })
    );

    const updatedCycle: PayrollCycle = {
      id: resolvedCycleId,
      tenantId: currentTenant.id,
      month: monthLabel,
      monthKey,
      periodStart,
      periodEnd,
      status: 'published',
      employeeCount: computed.totals.employeeCount,
      totalGross: computed.totals.totalGross,
      totalDeductions: computed.totals.totalDeductions,
      totalNet: computed.totals.totalNet,
      warningsCount: 0,
      processedAt
    };

    setPayrollCycles(prev => {
      const exists = prev.some(c => c.id === resolvedCycleId);
      if (exists) {
        return prev.map(c => (c.id === resolvedCycleId ? updatedCycle : c));
      }
      return [updatedCycle, ...prev];
    });
    saveDocToCloud('payroll_cycles', resolvedCycleId, updatedCycle as unknown as Record<string, unknown>, true);

    setPayslips(prev => {
      const newIds = new Set(publishedSlips.map(s => s.id));
      const others = prev.filter(p => !newIds.has(p.id));
      return [...others, ...publishedSlips];
    });
    publishedSlips.forEach(slip => {
      saveDocToCloud('payslips', slip.id, slip as unknown as Record<string, unknown>, true);
    });

    logAction(
      'PAYROLL_PUBLISHED_TO_EMPLOYEES',
      `Published & stored ${monthLabel} payslips from live Attendance & Leaves. Total Amount Given: ₹${computed.totals.totalNet.toLocaleString('en-IN')}.`,
      'high'
    );
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'payroll',
      priority: 'urgent',
      title: `${monthLabel} payslips stored & published (Total: ₹${computed.totals.totalNet.toLocaleString('en-IN')})`
    });
    showToast(`${monthLabel} payslips stored & published! Total Amount Given: ₹${computed.totals.totalNet.toLocaleString('en-IN')}.`);
  };

  const addJobOpening = (jobData: Omit<JobOpening, 'id' | 'tenantId' | 'applicantsCount' | 'postedDate'>) => {
    const newJob: JobOpening = {
      ...jobData,
      id: `job-${Date.now()}`,
      tenantId: currentTenant.id,
      applicantsCount: 0,
      postedDate: new Date().toISOString().split('T')[0]
    };
    setJobs(prev => [newJob, ...prev]);
    saveDocToCloud('jobs', newJob.id, newJob as unknown as Record<string, unknown>);
    logAction('JOB_REQUISITION_POSTED', `Job: ${jobData.title} in ${jobData.department}`, 'medium');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'recruitment',
      title: `New job opened: ${jobData.title} (${jobData.department})`
    });
    showToast(`Job listing "${jobData.title}" published to careers board.`);
  };

  const addCandidate = (candData: Omit<Candidate, 'id' | 'tenantId' | 'appliedDate' | 'resumeUrl'>) => {
    const newCandidate: Candidate = sanitizeForFirestore({
      ...candData,
      id: `cand-${Date.now()}`,
      tenantId: currentTenant.id,
      appliedDate: new Date().toISOString().split('T')[0],
      resumeUrl: '#'
    });
    setCandidates(prev => [newCandidate, ...prev]);
    saveDocToCloud('candidates', newCandidate.id, newCandidate as unknown as Record<string, unknown>);

    // Increment applicants count on matching job opening in cloud as well
    if (candData.jobId) {
      setJobs(prev => prev.map(j => {
        if (j.id === candData.jobId) {
          const updatedJob = { ...j, applicantsCount: (j.applicantsCount || 0) + 1 };
          saveDocToCloud('jobs', j.id, updatedJob as unknown as Record<string, unknown>, true);
          return updatedJob;
        }
        return j;
      }));
    }

    logAction('CANDIDATE_ADDED', `Added candidate ${candData.name} for ${candData.jobTitle}`, 'low');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'recruitment',
      title: `New candidate added: ${candData.name} (${candData.jobTitle})`
    });
    showToast(`Candidate "${candData.name}" added and synced across all devices.`);
  };

  const updateCandidateStage = (candidateId: string, newStage: Candidate['stage']) => {
    const matching = candidates.find(c => c.id === candidateId);
    setCandidates(prev => prev.map(cand => {
      if (cand.id === candidateId) {
        const updated = { ...cand, stage: newStage };
        saveDocToCloud('candidates', candidateId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return cand;
    }));
    logAction('CANDIDATE_PIPELINE_MOVED', `Candidate #${candidateId} advanced to ${newStage}`, 'low');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'recruitment',
      title: `${matching?.name || 'Candidate'} advanced to stage: ${newStage.toUpperCase()}`
    });
    showToast(`Candidate moved to ${newStage}.`);
  };

  const addExpense = (category: ExpenseClaim['category'], amount: number, merchant: string, description: string) => {
    const newExp: ExpenseClaim = {
      id: `exp-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      category,
      amount,
      merchant,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      description
    };
    setExpenses(prev => [newExp, ...prev]);
    saveDocToCloud('expenses', newExp.id, newExp as unknown as Record<string, unknown>);
    logAction('EXPENSE_SUBMITTED', `₹${amount} for ${merchant} (${category})`, 'low');
    showToast(`Expense claim for ₹${amount.toLocaleString('en-IN')} submitted for reimbursement.`);
  };

  const approveExpense = (id: string) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        const updated = { ...exp, status: 'approved' as const };
        saveDocToCloud('expenses', id, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return exp;
    }));
    logAction('EXPENSE_CLAIM_APPROVED', `Claim #${id} approved for payment processing.`, 'low');
    showToast('Expense claim approved.');
  };

  const addTicket = (category: HelpdeskTicket['category'], subject: string, priority: HelpdeskTicket['priority']) => {
    const newTkt: HelpdeskTicket = {
      id: `tkt-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      category,
      subject,
      status: 'open',
      priority,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTickets(prev => [newTkt, ...prev]);
    saveDocToCloud('tickets', newTkt.id, newTkt as unknown as Record<string, unknown>);
    logAction('HELPDESK_TICKET_CREATED', `Category: ${category}, Subject: ${subject}`, 'low');
    showToast('HR Helpdesk ticket submitted. Average response time: < 4 hours.');
  };

  const updateTicketStatus = (ticketId: string, status: HelpdeskTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updated = { ...t, status };
        saveDocToCloud('tickets', ticketId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return t;
    }));
    logAction('HELPDESK_TICKET_UPDATED', `Ticket #${ticketId} marked as ${status}`, 'low');
    showToast(`Ticket status updated to ${status.replace('_', ' ').toUpperCase()}.`);
  };

  const addAsset = (assetData: Omit<CompanyAsset, 'id' | 'tenantId'>) => {
    const newAsset: CompanyAsset = sanitizeForFirestore({
      ...assetData,
      id: `ast-${Date.now()}`,
      tenantId: currentTenant.id
    });
    setAssets(prev => [newAsset, ...prev]);
    saveDocToCloud('assets', newAsset.id, newAsset as unknown as Record<string, unknown>);
    logAction('ASSET_REGISTERED', `Registered ${assetData.type}: ${assetData.name} (${assetData.serialNumber})`, 'low');
    showToast(`Hardware asset "${assetData.name}" registered and synced across all devices.`);
  };

  const deleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    deleteDocFromCloud('assets', assetId);
    logAction('ASSET_REMOVED', `Removed asset #${assetId} from inventory`, 'medium');
    showToast('Hardware asset permanently removed.');
  };

  const addPerformanceGoal = (goalData: Omit<PerformanceGoal, 'id' | 'tenantId' | 'createdAt'>) => {
    const newGoal: PerformanceGoal = sanitizeForFirestore({
      ...goalData,
      id: `okr-${Date.now()}`,
      tenantId: currentTenant.id,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setPerformanceGoals(prev => [newGoal, ...prev]);
    saveDocToCloud('performance_goals', newGoal.id, newGoal as unknown as Record<string, unknown>);
    logAction('PERFORMANCE_GOAL_CREATED', `Created OKR "${goalData.title}" assigned to ${goalData.ownerName}`, 'low');
    showToast(`OKR "${goalData.title}" saved and synced across all devices.`);
  };

  const updatePerformanceGoalProgress = (goalId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    setPerformanceGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const updated = { ...g, progress: clamped };
        saveDocToCloud('performance_goals', goalId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return g;
    }));
  };

  const deletePerformanceGoal = (goalId: string) => {
    setPerformanceGoals(prev => prev.filter(g => g.id !== goalId));
    deleteDocFromCloud('performance_goals', goalId);
    showToast('OKR goal removed.');
  };

  // --- SHIFT MANAGEMENT & ROSTERING ---
  const addShiftTemplate = (shiftData: Omit<ShiftTemplate, 'id' | 'tenantId'>) => {
    const newShift: ShiftTemplate = sanitizeForFirestore({
      ...shiftData,
      id: `shift-${Date.now()}`,
      tenantId: currentTenant.id
    });
    setShifts(prev => [newShift, ...prev]);
    saveDocToCloud('shifts', newShift.id, newShift as unknown as Record<string, unknown>);
    logAction('SHIFT_CREATED', `Created shift "${newShift.name}" (${newShift.startTime} - ${newShift.endTime})`, 'low');
    showToast(`Shift "${newShift.name}" created and synced.`);
  };

  const assignEmployeeToShift = (shiftId: string, employeeId: string) => {
    setShifts(prev => prev.map(s => {
      if (s.tenantId !== currentTenant.id) return s;
      const filtered = (s.assignedEmployeeIds || []).filter(id => id !== employeeId);
      const updatedIds = s.id === shiftId ? [...filtered, employeeId] : filtered;
      if (JSON.stringify(updatedIds) !== JSON.stringify(s.assignedEmployeeIds || [])) {
        const updated = { ...s, assignedEmployeeIds: updatedIds };
        saveDocToCloud('shifts', s.id, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return s;
    }));
    showToast('Shift roster assignment updated across all devices.');
  };

  const deleteShiftTemplate = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    deleteDocFromCloud('shifts', shiftId);
    showToast('Shift template removed.');
  };

  // --- CORE HR DOCUMENT VAULT ---
  const addEmployeeDocument = (docData: Omit<EmployeeDocument, 'id' | 'tenantId' | 'uploadedAt' | 'uploadedBy'>) => {
    const newDoc: EmployeeDocument = sanitizeForFirestore({
      ...docData,
      id: `doc-${Date.now()}`,
      tenantId: currentTenant.id,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString().split('T')[0]
    });
    setEmployeeDocuments(prev => [newDoc, ...prev]);
    saveDocToCloud('employee_documents', newDoc.id, newDoc as unknown as Record<string, unknown>);
    logAction('DOCUMENT_UPLOADED', `Uploaded "${newDoc.title}" (${newDoc.category}) for ${newDoc.employeeName}`, 'low');
    showToast(`Document "${newDoc.title}" saved to vault.`);
  };

  const toggleVerifyDocument = (docId: string) => {
    setEmployeeDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        const updated = { ...d, verified: !d.verified };
        saveDocToCloud('employee_documents', docId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return d;
    }));
    showToast('Document verification status updated.');
  };

  const deleteEmployeeDocument = (docId: string) => {
    setEmployeeDocuments(prev => prev.filter(d => d.id !== docId));
    deleteDocFromCloud('employee_documents', docId);
    showToast('Document removed from vault.');
  };

  // --- EMPLOYEE LIFECYCLE ONBOARDING & OFFBOARDING CHECKLISTS ---
  const addOnboardingTask = (taskData: Omit<OnboardingTask, 'id' | 'tenantId' | 'completed'>) => {
    const newTask: OnboardingTask = sanitizeForFirestore({
      ...taskData,
      id: `onb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: currentTenant.id,
      completed: false
    });
    setOnboardingTasks(prev => [newTask, ...prev]);
    saveDocToCloud('onboarding_tasks', newTask.id, newTask as unknown as Record<string, unknown>);
    showToast(`Lifecycle task "${newTask.title}" added.`);
  };

  const generateDefaultOnboardingTasks = (employee: User, lifecycleType: 'onboarding' | 'offboarding' = 'onboarding') => {
    const dueBase = new Date();
    const fmt = (offsetDays: number) => {
      const d = new Date(dueBase.getTime() + offsetDays * 86400000);
      return d.toISOString().split('T')[0];
    };
    const templates: Array<{ stage: OnboardingTask['stage']; title: string; assigneeRole: string; offset: number }> =
      lifecycleType === 'onboarding'
        ? [
            { stage: 'Pre-Boarding', title: 'Collect signed Offer Letter & NDA', assigneeRole: 'HR Admin', offset: 1 },
            { stage: 'Documentation', title: 'Verify PAN, Aadhaar & Bank Account KYC', assigneeRole: 'HR Admin', offset: 2 },
            { stage: 'IT & Assets', title: 'Provision corporate email, SSO & laptop', assigneeRole: 'IT Admin', offset: 2 },
            { stage: 'Payroll & Statutory', title: 'Enroll in EPF, Medical Insurance & Payroll Cycle', assigneeRole: 'Payroll Admin', offset: 3 },
            { stage: 'Induction', title: 'Complete Security Policy & Manager 1:1 Orientation', assigneeRole: 'Department Manager', offset: 5 }
          ]
        : [
            { stage: 'Exit Clearance', title: 'Conduct HR Exit Interview & Knowledge Handover', assigneeRole: 'HR Admin', offset: 2 },
            { stage: 'IT & Assets', title: 'Revoke SSO/VPN access & collect company laptop/ID card', assigneeRole: 'IT Admin', offset: 3 },
            { stage: 'Payroll & Statutory', title: 'Compute Full & Final (F&F) Settlement & Relieving Letter', assigneeRole: 'Payroll Admin', offset: 5 }
          ];

    const created: OnboardingTask[] = templates.map((tpl, idx) => ({
      id: `onb-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      tenantId: employee.tenantId,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      lifecycleType,
      stage: tpl.stage,
      title: tpl.title,
      assigneeRole: tpl.assigneeRole,
      dueDate: fmt(tpl.offset),
      completed: false
    }));

    setOnboardingTasks(prev => [...created, ...prev]);
    created.forEach(t => saveDocToCloud('onboarding_tasks', t.id, t as unknown as Record<string, unknown>));
    logAction('LIFECYCLE_CHECKLIST_CREATED', `Generated ${created.length} ${lifecycleType} tasks for ${employee.name}`, 'low');
    showToast(`Generated ${created.length} ${lifecycleType} checklist tasks for ${employee.name}.`);
  };

  const toggleOnboardingTask = (taskId: string) => {
    setOnboardingTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        const updated: OnboardingTask = {
          ...t,
          completed: nextCompleted,
          ...(nextCompleted ? { completedAt: new Date().toISOString().split('T')[0] } : {})
        };
        saveDocToCloud('onboarding_tasks', taskId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return t;
    }));
  };

  const deleteOnboardingTask = (taskId: string) => {
    setOnboardingTasks(prev => prev.filter(t => t.id !== taskId));
    deleteDocFromCloud('onboarding_tasks', taskId);
  };

  // --- RECRUITMENT INTERVIEWS & OFFER LETTERS ---
  const scheduleInterview = (data: Omit<InterviewSchedule, 'id' | 'tenantId' | 'status'>) => {
    const newInt: InterviewSchedule = sanitizeForFirestore({
      ...data,
      id: `int-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'scheduled'
    });
    setInterviews(prev => [newInt, ...prev]);
    saveDocToCloud('interviews', newInt.id, newInt as unknown as Record<string, unknown>);
    logAction('INTERVIEW_SCHEDULED', `Scheduled ${newInt.round} interview for ${newInt.candidateName} on ${newInt.scheduledDate}`, 'low');
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'recruitment',
      title: `Interview scheduled: ${newInt.candidateName} (${newInt.round})`,
      description: `${newInt.scheduledDate} at ${newInt.scheduledTime} with ${newInt.interviewerName}`,
      targetView: 'recruitment'
    });
    showToast(`Interview scheduled for ${newInt.candidateName} (${newInt.scheduledDate} ${newInt.scheduledTime}).`);
  };

  const updateInterviewStatus = (interviewId: string, status: InterviewSchedule['status'], feedback?: string, score?: number) => {
    setInterviews(prev => prev.map(i => {
      if (i.id === interviewId) {
        const updated: InterviewSchedule = sanitizeForFirestore({
          ...i,
          status,
          ...(feedback !== undefined ? { feedback } : {}),
          ...(score !== undefined ? { score } : {})
        });
        saveDocToCloud('interviews', interviewId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return i;
    }));
    showToast(`Interview marked as ${status.toUpperCase()}.`);
  };

  const deleteInterview = (interviewId: string) => {
    setInterviews(prev => prev.filter(i => i.id !== interviewId));
    deleteDocFromCloud('interviews', interviewId);
  };

  const createOfferLetter = (offerData: Omit<OfferLetter, 'id' | 'tenantId' | 'issuedAt' | 'status'>) => {
    const newOffer: OfferLetter = sanitizeForFirestore({
      ...offerData,
      id: `ofr-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'sent',
      issuedAt: new Date().toISOString().split('T')[0]
    });
    setOfferLetters(prev => [newOffer, ...prev]);
    saveDocToCloud('offer_letters', newOffer.id, newOffer as unknown as Record<string, unknown>);
    if (offerData.candidateId) {
      updateCandidateStage(offerData.candidateId, 'Offered');
    }
    logAction('OFFER_ISSUED', `Issued offer letter to ${newOffer.candidateName} (₹${newOffer.annualCtc.toLocaleString('en-IN')} CTC)`, 'medium');
    showToast(`Offer letter issued to ${newOffer.candidateName}!`);
  };

  const updateOfferStatus = (offerId: string, status: OfferLetter['status']) => {
    const match = offerLetters.find(o => o.id === offerId);
    setOfferLetters(prev => prev.map(o => {
      if (o.id === offerId) {
        const updated = { ...o, status };
        saveDocToCloud('offer_letters', offerId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return o;
    }));
    if (match && status === 'accepted' && match.candidateId) {
      updateCandidateStage(match.candidateId, 'Hired');
    }
    showToast(`Offer status updated to ${status.toUpperCase()}.`);
  };

  const convertOfferToEmployee = (offerId: string) => {
    const offer = offerLetters.find(o => o.id === offerId);
    if (!offer) return;
    if (offer.status === 'onboarded') {
      showToast(`${offer.candidateName} has already been onboarded.`);
      return;
    }
    const prefix = currentTenant.name.slice(0, 3).toUpperCase();
    const code = `${prefix}-${Math.floor(200 + Math.random() * 799)}`;
    const createdEmp = addEmployee({
      tenantId: currentTenant.id,
      name: offer.candidateName,
      email: offer.candidateEmail,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      role: 'employee',
      title: offer.jobTitle,
      department: offer.department,
      employeeCode: code,
      phone: '+91 98450 ' + Math.floor(10000 + Math.random() * 89999),
      joinDate: offer.joiningDate || new Date().toISOString().split('T')[0],
      salaryBase: offer.monthlySalary || Math.round(offer.annualCtc / 12),
      leaveBalances: { paid: 20, sick: 10, casual: 6, unpaid: 0 },
      status: 'active',
      isAppOwner: false
    });
    updateOfferStatus(offerId, 'onboarded');
    if (offer.candidateId) {
      updateCandidateStage(offer.candidateId, 'Hired');
    }
    generateDefaultOnboardingTasks(createdEmp, 'onboarding');
    addEmployeeDocument({
      employeeId: createdEmp.id,
      employeeName: createdEmp.name,
      title: `Signed Offer Letter — ${offer.jobTitle}`,
      category: 'Offer Letter',
      fileName: `Offer_${createdEmp.employeeCode}.pdf`,
      verified: true,
      notes: `Annual CTC ₹${offer.annualCtc.toLocaleString('en-IN')}`
    });
    showToast(`Digital Onboarding Complete: ${createdEmp.name} added to Employee Directory with checklist & offer doc!`);
  };

  // --- PERFORMANCE APPRAISAL REVIEWS & CONTINUOUS FEEDBACK / PIP ---
  const addPerformanceReview = (revData: Omit<PerformanceReview, 'id' | 'tenantId'>) => {
    const newRev: PerformanceReview = sanitizeForFirestore({
      ...revData,
      id: `rev-${Date.now()}`,
      tenantId: currentTenant.id
    });
    setPerformanceReviews(prev => [newRev, ...prev]);
    saveDocToCloud('performance_reviews', newRev.id, newRev as unknown as Record<string, unknown>);
    logAction('APPRAISAL_SUBMITTED', `Submitted ${newRev.period} appraisal for ${newRev.employeeName} (${newRev.rating}/5)`, 'low');
    showToast(`Performance appraisal saved for ${newRev.employeeName}.`);
  };

  const updatePerformanceReviewStatus = (reviewId: string, status: PerformanceReview['status']) => {
    setPerformanceReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const updated = { ...r, status };
        saveDocToCloud('performance_reviews', reviewId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return r;
    }));
    showToast(`Appraisal status updated to ${status.replace('_', ' ').toUpperCase()}.`);
  };

  const addContinuousFeedback = (fbData: Omit<ContinuousFeedback, 'id' | 'tenantId' | 'createdAt' | 'authorName'>) => {
    const newFb: ContinuousFeedback = sanitizeForFirestore({
      ...fbData,
      id: `fb-${Date.now()}`,
      tenantId: currentTenant.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setContinuousFeedback(prev => [newFb, ...prev]);
    saveDocToCloud('continuous_feedback', newFb.id, newFb as unknown as Record<string, unknown>);
    logAction('FEEDBACK_LOGGED', `${newFb.type} logged for ${newFb.employeeName} (${newFb.competency})`, 'low');
    showToast(`${newFb.type} posted for ${newFb.employeeName}.`);
  };

  const updatePipStatus = (fbId: string, pipStatus: 'active' | 'improved' | 'closed') => {
    setContinuousFeedback(prev => prev.map(f => {
      if (f.id === fbId) {
        const updated = { ...f, pipStatus };
        saveDocToCloud('continuous_feedback', fbId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return f;
    }));
    showToast(`PIP status updated to ${pipStatus.toUpperCase()}.`);
  };

  const deleteContinuousFeedback = (fbId: string) => {
    setContinuousFeedback(prev => prev.filter(f => f.id !== fbId));
    deleteDocFromCloud('continuous_feedback', fbId);
  };

  // --- COMPANY ANNOUNCEMENTS & eNPS PULSE SURVEYS ---
  const addAnnouncement = (annData: Omit<CompanyAnnouncement, 'id' | 'tenantId' | 'createdAt' | 'authorName' | 'acknowledgedBy'>) => {
    const newAnn: CompanyAnnouncement = sanitizeForFirestore({
      ...annData,
      id: `ann-${Date.now()}`,
      tenantId: currentTenant.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      acknowledgedBy: []
    });
    setAnnouncements(prev => [newAnn, ...prev]);
    saveDocToCloud('announcements', newAnn.id, newAnn as unknown as Record<string, unknown>);
    addTenantNotification({
      tenantId: currentTenant.id,
      category: 'announcement',
      priority: annData.category === 'Urgent' ? 'urgent' : 'normal',
      title: `Announcement: ${annData.title}`,
      description: annData.content.slice(0, 120),
      targetView: 'engagement'
    });
    showToast(`Announcement "${annData.title}" published to ${currentTenant.name}.`);
  };

  const togglePinAnnouncement = (annId: string) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id === annId) {
        const updated = { ...a, pinned: !a.pinned };
        saveDocToCloud('announcements', annId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return a;
    }));
  };

  const acknowledgeAnnouncement = (annId: string) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id === annId) {
        const ack = Array.from(new Set([...(a.acknowledgedBy || []), currentUser.id]));
        const updated = { ...a, acknowledgedBy: ack };
        saveDocToCloud('announcements', annId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return a;
    }));
    showToast('Announcement acknowledged.');
  };

  const deleteAnnouncement = (annId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
    deleteDocFromCloud('announcements', annId);
    showToast('Announcement deleted.');
  };

  const submitEnpsResponse = (data: { score: number; surveyTitle: string; comment: string; anonymous: boolean }) => {
    const newResp: EnpsResponse = sanitizeForFirestore({
      id: `enps-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: currentUser.id,
      employeeName: data.anonymous ? 'Anonymous Employee' : currentUser.name,
      department: currentUser.department,
      score: Math.max(0, Math.min(10, Math.round(data.score))),
      surveyTitle: data.surveyTitle,
      comment: data.comment.trim(),
      anonymous: data.anonymous,
      submittedAt: new Date().toISOString().split('T')[0]
    });
    setEnpsResponses(prev => [newResp, ...prev]);
    saveDocToCloud('enps_surveys', newResp.id, newResp as unknown as Record<string, unknown>);
    showToast('Thank you! Your eNPS pulse survey response has been recorded.');
  };

  // --- EMPLOYEE LOANS & SALARY ADVANCES ---
  const requestEmployeeLoan = (data: { loanType: EmployeeLoan['loanType']; principalAmount: number; tenureMonths: number; reason: string }) => {
    const principal = Math.max(1000, Number(data.principalAmount) || 0);
    const tenure = Math.max(1, Math.min(36, Number(data.tenureMonths) || 6));
    const newLoan: EmployeeLoan = sanitizeForFirestore({
      id: `loan-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      loanType: data.loanType,
      principalAmount: principal,
      tenureMonths: tenure,
      monthlyEmi: Math.round(principal / tenure),
      paidEmis: 0,
      reason: data.reason.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0]
    });
    setEmployeeLoans(prev => [newLoan, ...prev]);
    saveDocToCloud('employee_loans', newLoan.id, newLoan as unknown as Record<string, unknown>);
    logAction('LOAN_REQUESTED', `${currentUser.name} requested ${data.loanType} of ₹${principal.toLocaleString('en-IN')} (${tenure} mos)`, 'medium');
    showToast(`Loan / advance request of ₹${principal.toLocaleString('en-IN')} submitted.`);
  };

  const updateLoanStatus = (loanId: string, status: EmployeeLoan['status']) => {
    setEmployeeLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const updated = { ...l, status };
        saveDocToCloud('employee_loans', loanId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return l;
    }));
    showToast(`Loan application marked as ${status.toUpperCase()}.`);
  };

  const recordLoanEmiPayment = (loanId: string) => {
    setEmployeeLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const nextPaid = Math.min(l.tenureMonths, (l.paidEmis || 0) + 1);
        const nextStatus: EmployeeLoan['status'] = nextPaid >= l.tenureMonths ? 'repaid' : l.status;
        const updated: EmployeeLoan = { ...l, paidEmis: nextPaid, status: nextStatus };
        saveDocToCloud('employee_loans', loanId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return l;
    }));
    showToast('Monthly EMI repayment recorded.');
  };

  const updateCompanyStatus = (companyId: string, status: SaaSCompanyBilling['status']) => {
    const targetBilling = saasBillings.find(c => c.id === companyId);
    setSaasBillings(prev => prev.map(comp => {
      if (comp.id === companyId) {
        const updated = { ...comp, status };
        saveDocToCloud('saas_billings', companyId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return comp;
    }));
    // Also mirror status onto the linked Tenant record for cross-device consistency
    const linkedTenant = tenants.find(
      t =>
        (targetBilling?.tenantId && t.id === targetBilling.tenantId) ||
        (targetBilling && t.name.trim().toLowerCase() === targetBilling.companyName.trim().toLowerCase()) ||
        t.id === companyId
    );
    if (linkedTenant) {
      const tenantStatus: Tenant['status'] = status === 'suspended' || status === 'overdue' ? 'suspended' : status === 'trial' ? 'trial' : 'active';
      setTenants(prev => prev.map(t => (t.id === linkedTenant.id ? { ...t, status: tenantStatus } : t)));
      saveDocToCloud('tenants', linkedTenant.id, { status: tenantStatus }, true);
    }
    logAction('SAAS_TENANT_STATUS_MODIFIED', `Company #${companyId} status altered to ${status}`, 'critical');
    showToast(`Tenant status updated to ${status} across all devices.`);
  };

  const login = (email: string, role?: UserRole, userId?: string): boolean => {
    let matchedUser: User | undefined;
    if (userId) {
      matchedUser = users.find(u => u.id === userId);
    }
    if (!matchedUser && role) {
      matchedUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.role === role
      );
    }
    if (!matchedUser) {
      matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    if (!matchedUser && role) {
      matchedUser = users.find(u => u.role === role);
    }
    if (!matchedUser) {
      matchedUser = users.find(u => u.role === 'hr_admin') || users[0];
    }
    
    if (matchedUser) {
      setCurrentUser(matchedUser);
      const userTenant = tenants.find(t => t.id === matchedUser!.tenantId) || tenants[0];
      setCurrentTenant(userTenant);
      try {
        localStorage.setItem('nattonflow_active_tenant_id', userTenant.id);
      } catch {}
      setIsAuthenticated(true);
      sessionStorage.setItem('nattonflow_auth_session', 'true');
      logAction('USER_AUTHENTICATED', `User ${matchedUser.email} authenticated successfully (${matchedUser.role})`, 'low');
      showToast(`Welcome back, ${matchedUser.name}! Signed into ${userTenant.name}.`);
      if (matchedUser.role === 'super_admin') {
        setCurrentView('super_admin');
      } else {
        setCurrentView('dashboard');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('nattonflow_auth_session');
    logAction('USER_LOGGED_OUT', `User ${currentUser.email} logged out securely`, 'low');
    showToast('You have been logged out securely. Session ended.');
  };

  const registerNewTenant = async (data: {
    name: string;
    domain: string;
    plan: 'Growth' | 'Professional' | 'Enterprise';
    currency: string;
    timezone: string;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    seatLimit: number;
    initialEmployeesCount: number;
  }): Promise<boolean> => {
    const nowTs = Date.now();
    const nowIso = new Date(nowTs).toISOString();
    const todayStr = nowIso.split('T')[0];
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'client';
    const newTenantId = `tenant-${slug.slice(0, 15)}-${nowTs.toString().slice(-4)}`;

    const monthlyCost = data.plan === 'Enterprise' ? 2500 : data.plan === 'Professional' ? 1200 : 500;
    const ownerPhone = data.adminPhone?.trim() || '+91 98765 43210';

    const newTenant: Tenant = {
      id: newTenantId,
      name: data.name,
      slug,
      domain: data.domain,
      plan: data.plan,
      status: 'active',
      currency: data.currency,
      timezone: data.timezone,
      totalEmployees: data.initialEmployeesCount || 1,
      createdAt: todayStr,
      monthlyBilling: monthlyCost,
      whatsappNumber: ownerPhone,
      whatsappEnabled: true,
      chatbotEnabled: true,
      chatbotTemplates: [],
      securitySettings: {
        enforceMfa: true,
        ipWhitelistEnabled: false,
        sessionTimeoutMinutes: 30,
        auditLogsRetentionDays: 365
      }
    };

    // Create dedicated Company Super Admin for this new client tenant so it immediately
    // shows as appointed in Governance Hub and Login Sub-Owner selector on all devices
    const newOwnerUser: User = {
      id: `usr-owner-${nowTs}`,
      tenantId: newTenantId,
      companySuperAdminTenantId: newTenantId,
      name: data.adminName || `${data.name} Admin`,
      email: data.adminEmail || `admin@${data.domain}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'tenant_super_admin',
      title: 'Managing Director & Company Super Admin',
      department: 'Executive Leadership',
      employeeCode: `${data.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'CLT'}-001`,
      phone: ownerPhone,
      joinDate: todayStr,
      salaryBase: data.currency.includes('INR') ? 175000 : 15000,
      leaveBalances: { paid: 25, sick: 12, casual: 6, unpaid: 0 },
      status: 'active'
    };

    // Create linked SaaS Billing ledger entry
    const newBillingEntry: SaaSCompanyBilling = {
      id: `bill-${nowTs}`,
      tenantId: newTenantId,
      companyName: data.name,
      plan: data.plan,
      status: 'active',
      activeSeats: data.initialEmployeesCount || 1,
      seatLimit: data.seatLimit || 50,
      monthlyRevenue: monthlyCost,
      renewalDate: new Date(nowTs + 30 * 86400000).toISOString().split('T')[0],
      mfaCompliance: 100,
      storageUsedGb: 2.5,
      createdAt: nowIso
    };

    const initialCycle: PayrollCycle = {
      id: `cycle-${newTenantId}-${nowTs}`,
      tenantId: newTenantId,
      month: new Date(nowTs).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      monthKey: getCurrentMonthKey(),
      periodStart: todayStr.slice(0, 8) + '01',
      periodEnd: todayStr.slice(0, 8) + '30',
      status: 'draft',
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      employeeCount: 1,
      warningsCount: 0
    };

    const batchEntries: BatchWriteEntry[] = [
      { collectionName: 'tenants', docId: newTenant.id, data: newTenant as unknown as Record<string, unknown> },
      { collectionName: 'users', docId: newOwnerUser.id, data: newOwnerUser as unknown as Record<string, unknown> },
      { collectionName: 'saas_billings', docId: newBillingEntry.id, data: newBillingEntry as unknown as Record<string, unknown> },
      { collectionName: 'payroll_cycles', docId: initialCycle.id, data: initialCycle as unknown as Record<string, unknown> }
    ];

    // Queue pending writes first so concurrent snapshots/focus syncs never overwrite the new tenant
    queuePendingCloudWrites(batchEntries);
    inFlightBatchRef.current = true;

    setTenants(prev => sortTenantsForDisplay([newTenant, ...prev.filter(t => t.id !== newTenant.id)]));
    setUsers(prev => [newOwnerUser, ...prev.filter(u => u.id !== newOwnerUser.id)]);
    setSaasBillings(prev => sortBillingsForDisplay([newBillingEntry, ...prev.filter(b => b.id !== newBillingEntry.id)]));
    setPayrollCycles(prev => [initialCycle, ...prev.filter(c => c.id !== initialCycle.id)]);

    // Automatically switch active tenant to the newly registered client
    setCurrentTenant(newTenant);
    try {
      localStorage.setItem('nattonflow_active_tenant_id', newTenant.id);
    } catch {}

    // Atomically commit all 4 documents to Cloud Firestore and await confirmation
    let synced = false;
    try {
      synced = await saveBatchToCloud(batchEntries);
      if (synced) {
        clearPendingCloudWrites(batchEntries);
      }
    } finally {
      inFlightBatchRef.current = false;
    }

    logAction('TENANT_PROVISIONED', `New client organization ${data.name} created under ${data.plan} plan`, 'critical');
    if (synced) {
      showToast(`Client Organization "${data.name}" provisioned and synced across all devices!`);
    } else {
      showToast(`Client Organization "${data.name}" saved locally — automatic cloud sync queued.`);
    }
    return synced;
  };

  const deriveNameFromEmail = (emailAddress: string, fallback = 'Company Owner') => {
    const localPart = emailAddress.split('@')[0] || '';
    const cleaned = localPart.replace(/[0-9_]/g, '').trim();
    if (!cleaned) return fallback;
    if (cleaned.includes('.')) {
      return cleaned
        .split('.')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const buildDemoMessageBody = (params: {
    channel: 'sms' | 'whatsapp';
    stage: 'verification_otp' | 'booking_confirmed';
    fullName: string;
    companyName: string;
    workEmail: string;
    companyOwnerEmail: string;
    preferredDate: string;
    preferredTimeSlot: string;
    timezone: string;
    verificationToken: string;
    meetingLink: string;
    assignedSalesEngineer: string;
    workspaceUrl: string;
  }) => {
    if (params.stage === 'verification_otp') {
      if (params.channel === 'whatsapp') {
        return `*NattonFlow HR Enterprise Demo*\nHello ${params.fullName},\nYour demo request for *${params.companyName}* is logged!\n\n*Verification OTP:* ${params.verificationToken}\n*Slot:* ${params.preferredDate} | ${params.preferredTimeSlot}\n*Client Email:* ${params.workEmail}\n*Company Owner Email:* ${params.companyOwnerEmail}\n*Architect:* ${params.assignedSalesEngineer}\n*Meeting Room:* ${params.meetingLink}\n*Workspace:* ${params.workspaceUrl}`;
      }
      return `NattonFlow HR Demo OTP: ${params.verificationToken}. For ${params.companyName} on ${params.preferredDate} (${params.preferredTimeSlot}). Client: ${params.workEmail}, Owner: ${params.companyOwnerEmail}. Room: ${params.meetingLink}`;
    }

    if (params.channel === 'whatsapp') {
      return `*NattonFlow HR — Demo Confirmed!*\nHello ${params.fullName},\nYour live demo for *${params.companyName}* is now CONFIRMED.\n\n*Date & Slot:* ${params.preferredDate} | ${params.preferredTimeSlot}\n*Architect:* ${params.assignedSalesEngineer}\n*Join Video Room:* ${params.meetingLink}\n*Workspace Updated:* ${params.workspaceUrl}\nDetails also emailed to ${params.workEmail} & ${params.companyOwnerEmail}.`;
    }
    return `NattonFlow HR Demo CONFIRMED for ${params.companyName} on ${params.preferredDate} (${params.preferredTimeSlot}). Join: ${params.meetingLink} | Workspace: ${params.workspaceUrl}`;
  };

  const submitDemoBooking = (data: {
    fullName: string;
    workEmail: string;
    companyOwnerEmail?: string;
    companyOwnerName?: string;
    phone: string;
    messageChannel?: DemoMessageChannel;
    companyName: string;
    companyWebsite: string;
    companySize: '1-20' | '21-50' | '51-200' | '201-1000' | '1000+';
    currentHrms: string;
    selectedModules: string[];
    preferredDate: string;
    preferredTimeSlot: string;
    timezone: string;
    notes?: string;
  }) => {
    const nowTs = Date.now();
    const nowIso = new Date(nowTs).toISOString();
    const todayStr = nowIso.split('T')[0];

    const clientEmail = data.workEmail.trim().toLowerCase();
    const ownerEmail = (data.companyOwnerEmail?.trim() || clientEmail).toLowerCase();
    const ownerName = data.companyOwnerName?.trim() || deriveNameFromEmail(ownerEmail, `${data.companyName} Owner`);
    const cleanPhone = data.phone.trim() || '+91 98765 43210';
    const messageChannel: DemoMessageChannel = data.messageChannel || 'both';

    const emailDomain = clientEmail.split('@')[1]?.toLowerCase().trim() || '';
    const ownerDomain = ownerEmail.split('@')[1]?.toLowerCase().trim() || emailDomain;
    const disposableDomains = ['tempmail.com', 'tempmail.ninja', 'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'test.com', 'dummy.com', 'example.com'];
    const freePersonalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'zoho.com', 'proton.me'];
    
    const isDisposable = disposableDomains.includes(emailDomain);
    const isFree = freePersonalDomains.includes(emailDomain);
    const isCorporate = !isDisposable && !isFree && emailDomain.includes('.') && emailDomain.length > 3;

    // Intelligent Genuine Client Lead Scoring (0-100)
    let score = 50;
    if (isCorporate) score += 30;
    else if (!isDisposable) score += 8;
    else score = 15; // penalize disposable dummy accounts

    if (data.companySize === '1000+') score += 15;
    else if (data.companySize === '201-1000') score += 12;
    else if (data.companySize === '51-200') score += 8;
    else score += 4;

    score += Math.min(10, data.selectedModules.length * 2);
    if (data.companyWebsite && data.companyWebsite.length > 5) score += 5;
    score = Math.max(10, Math.min(99, score));

    // 6-digit verification OTP token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const companySlug = data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 18) || 'client';
    const meetingLink = `https://meet.nattonflow.com/demo-${companySlug}-${Math.random().toString(36).substring(2, 6)}`;
    const workspaceUrl = `https://${companySlug}.nattonflow.hr/workspace`;
    const assignedSalesEngineer = data.timezone.includes('America')
      ? 'Marcus Vance (Enterprise Solutions Architect)'
      : data.timezone.includes('Europe')
        ? 'David Chen (Senior Enterprise Architect)'
        : 'Elena Rostova (Lead HR Tech Specialist)';
    const assignedArchitectEmail = assignedSalesEngineer.includes('Marcus')
      ? 'marcus.vance@nattonflow.com'
      : assignedSalesEngineer.includes('David')
        ? 'david.chen@nattonflow.com'
        : 'elena.rostova@nattonflow.com';

    const batchEntries: BatchWriteEntry[] = [];

    // 1. Dynamically resolve or provision the Company Tenant Account
    const existingTenant = tenants.find(
      t =>
        t.name.trim().toLowerCase() === data.companyName.trim().toLowerCase() ||
        (isCorporate && t.domain.toLowerCase() === emailDomain)
    );

    const seatsLimit =
      data.companySize === '1000+' ? 1500 :
      data.companySize === '201-1000' ? 500 :
      data.companySize === '51-200' ? 250 :
      data.companySize === '21-50' ? 50 : 25;

    const tenantPlan: Tenant['plan'] =
      data.companySize === '1000+' || data.companySize === '201-1000'
        ? 'Enterprise'
        : data.companySize === '51-200'
          ? 'Professional'
          : 'Growth';

    let targetTenant: Tenant;
    if (existingTenant) {
      targetTenant = {
        ...existingTenant,
        domain: existingTenant.domain || (isCorporate ? emailDomain : `${companySlug}.com`),
        timezone: data.timezone || existingTenant.timezone,
        whatsappNumber: cleanPhone || existingTenant.whatsappNumber,
        whatsappEnabled: existingTenant.whatsappEnabled !== false,
        chatbotEnabled: existingTenant.chatbotEnabled !== false
      };
      setTenants(prev => sortTenantsForDisplay(prev.map(t => (t.id === targetTenant.id ? targetTenant : t))));
      if (currentTenant.id === targetTenant.id) {
        setCurrentTenant(targetTenant);
      }
      batchEntries.push({
        collectionName: 'tenants',
        docId: targetTenant.id,
        data: targetTenant as unknown as Record<string, unknown>,
        merge: true
      });
    } else {
      const newTenantId = `tenant-${companySlug.slice(0, 14)}-${nowTs.toString().slice(-4)}`;
      const isIndia = data.timezone.includes('Kolkata') || emailDomain.endsWith('.in') || ownerDomain.endsWith('.in');
      targetTenant = {
        id: newTenantId,
        name: data.companyName.trim(),
        slug: companySlug,
        domain: isCorporate ? emailDomain : `${companySlug}.com`,
        plan: tenantPlan,
        status: 'trial',
        currency: isIndia ? 'INR (₹)' : 'USD ($)',
        timezone: data.timezone || 'Asia/Kolkata (IST)',
        totalEmployees: seatsLimit,
        createdAt: todayStr,
        monthlyBilling: 0,
        whatsappNumber: cleanPhone,
        whatsappEnabled: true,
        chatbotEnabled: true,
        chatbotTemplates: [],
        securitySettings: {
          enforceMfa: true,
          ipWhitelistEnabled: false,
          sessionTimeoutMinutes: 30,
          auditLogsRetentionDays: 365
        }
      };

      const newBilling: SaaSCompanyBilling = {
        id: `bill-${newTenantId}`,
        tenantId: newTenantId,
        companyName: targetTenant.name,
        plan: tenantPlan,
        status: 'trial',
        activeSeats: 1,
        seatLimit: seatsLimit,
        monthlyRevenue: 0,
        renewalDate: new Date(nowTs + 14 * 86400000).toISOString().split('T')[0],
        mfaCompliance: 100,
        storageUsedGb: 1.0,
        createdAt: nowIso
      };

      const initialCycle: PayrollCycle = {
        id: `cycle-${newTenantId}-${nowTs}`,
        tenantId: newTenantId,
        month: new Date(nowTs).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        monthKey: getCurrentMonthKey(),
        periodStart: todayStr.slice(0, 8) + '01',
        periodEnd: todayStr.slice(0, 8) + '30',
        status: 'draft',
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: 1,
        warningsCount: 0
      };

      if (!TENANT_OFFICE_LOCATIONS[newTenantId]) {
        TENANT_OFFICE_LOCATIONS[newTenantId] = {
          tenantId: newTenantId,
          name: `${targetTenant.name} Corporate Campus`,
          campus: 'Main Executive Campus',
          address: 'Corporate Tech Hub',
          city: isIndia ? 'Bengaluru, Karnataka' : 'San Francisco, CA',
          lat: 12.9260,
          lng: 77.6762,
          allowedRadiusMeters: 300,
          authorizedSubnet: '198.51.100.0/24'
        };
      }

      setTenants(prev => sortTenantsForDisplay([targetTenant, ...prev.filter(t => t.id !== targetTenant.id)]));
      setSaasBillings(prev => sortBillingsForDisplay([newBilling, ...prev.filter(b => b.id !== newBilling.id)]));
      setPayrollCycles(prev => [initialCycle, ...prev.filter(c => c.id !== initialCycle.id)]);

      batchEntries.push(
        { collectionName: 'tenants', docId: targetTenant.id, data: targetTenant as unknown as Record<string, unknown> },
        { collectionName: 'saas_billings', docId: newBilling.id, data: newBilling as unknown as Record<string, unknown> },
        { collectionName: 'payroll_cycles', docId: initialCycle.id, data: initialCycle as unknown as Record<string, unknown> }
      );
    }

    // 2. Dynamically create/update Company Owner (Company Super Admin) and HR Admin in users
    const updatedUsersList = [...users];
    const updatedAdminsSummary: string[] = ['Platform Super Admin'];
    const codePrefix = targetTenant.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'CLT';

    const existingOwnerUser = updatedUsersList.find(
      u => u.tenantId === targetTenant.id && (u.email.toLowerCase() === ownerEmail || u.role === 'tenant_super_admin' || u.role === 'company_owner')
    );

    if (existingOwnerUser) {
      const updatedOwner: User = {
        ...existingOwnerUser,
        name: data.companyOwnerName?.trim() || existingOwnerUser.name,
        email: ownerEmail,
        phone: existingOwnerUser.email.toLowerCase() === clientEmail ? cleanPhone : existingOwnerUser.phone || cleanPhone,
        role: existingOwnerUser.role === 'company_owner' ? 'company_owner' : 'tenant_super_admin',
        companySuperAdminTenantId: targetTenant.id
      };
      const idx = updatedUsersList.findIndex(u => u.id === existingOwnerUser.id);
      if (idx !== -1) updatedUsersList[idx] = updatedOwner;
      batchEntries.push({ collectionName: 'users', docId: updatedOwner.id, data: updatedOwner as unknown as Record<string, unknown>, merge: true });
      updatedAdminsSummary.push(`Company Super Admin (${updatedOwner.email})`);
    } else {
      const newOwnerUser: User = {
        id: `usr-owner-${nowTs}`,
        tenantId: targetTenant.id,
        companySuperAdminTenantId: targetTenant.id,
        name: ownerName,
        email: ownerEmail,
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        role: 'tenant_super_admin',
        title: 'Company Owner & Super Admin',
        department: 'Executive Governance',
        employeeCode: `${codePrefix}-OWN-01`,
        phone: cleanPhone,
        joinDate: todayStr,
        salaryBase: targetTenant.currency.includes('INR') ? 210000 : 18000,
        leaveBalances: { paid: 25, sick: 12, casual: 6, unpaid: 0 },
        status: 'active'
      };
      updatedUsersList.unshift(newOwnerUser);
      batchEntries.push({ collectionName: 'users', docId: newOwnerUser.id, data: newOwnerUser as unknown as Record<string, unknown> });
      updatedAdminsSummary.push(`Company Super Admin (${newOwnerUser.email})`);
    }

    if (clientEmail !== ownerEmail) {
      const existingHrUser = updatedUsersList.find(
        u => u.tenantId === targetTenant.id && (u.email.toLowerCase() === clientEmail || u.role === 'hr_admin')
      );
      if (existingHrUser) {
        const updatedHr: User = {
          ...existingHrUser,
          name: existingHrUser.email.toLowerCase() === clientEmail ? data.fullName : existingHrUser.name,
          phone: existingHrUser.email.toLowerCase() === clientEmail ? cleanPhone : existingHrUser.phone
        };
        const idx = updatedUsersList.findIndex(u => u.id === existingHrUser.id);
        if (idx !== -1) updatedUsersList[idx] = updatedHr;
        batchEntries.push({ collectionName: 'users', docId: updatedHr.id, data: updatedHr as unknown as Record<string, unknown>, merge: true });
        updatedAdminsSummary.push(`HR Admin (${updatedHr.email})`);
      } else {
        const newHrUser: User = {
          id: `usr-hr-${nowTs + 1}`,
          tenantId: targetTenant.id,
          name: data.fullName,
          email: clientEmail,
          avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
          role: 'hr_admin',
          title: 'HR Admin & Demo Coordinator',
          department: 'Human Resources',
          employeeCode: `${codePrefix}-HR-01`,
          phone: cleanPhone,
          joinDate: todayStr,
          salaryBase: targetTenant.currency.includes('INR') ? 135000 : 12000,
          leaveBalances: { paid: 22, sick: 10, casual: 6, unpaid: 0 },
          status: 'active'
        };
        updatedUsersList.unshift(newHrUser);
        batchEntries.push({ collectionName: 'users', docId: newHrUser.id, data: newHrUser as unknown as Record<string, unknown> });
        updatedAdminsSummary.push(`HR Admin (${newHrUser.email})`);
      }
    } else {
      const existingHrAdmin = updatedUsersList.find(u => u.tenantId === targetTenant.id && u.role === 'hr_admin');
      if (existingHrAdmin) {
        updatedAdminsSummary.push(`HR Admin (${existingHrAdmin.email})`);
      } else {
        updatedAdminsSummary.push(`HR Admin (Synced to ${targetTenant.name})`);
      }
    }

    setUsers(updatedUsersList);
    setCurrentUser(prev => updatedUsersList.find(u => u.id === prev.id) || prev);

    // 3. Build SMS & WhatsApp dispatches to the target phone number
    const channelsToSend: Array<'whatsapp' | 'sms'> =
      messageChannel === 'both' ? ['whatsapp', 'sms'] : [messageChannel];

    const messageDispatches: DemoMessageDispatch[] = channelsToSend.map((ch, idx) => ({
      id: `msg-${ch}-${nowTs}-${idx}`,
      channel: ch,
      recipientPhone: cleanPhone,
      messageBody: buildDemoMessageBody({
        channel: ch,
        stage: 'verification_otp',
        fullName: data.fullName,
        companyName: data.companyName,
        workEmail: clientEmail,
        companyOwnerEmail: ownerEmail,
        preferredDate: data.preferredDate,
        preferredTimeSlot: data.preferredTimeSlot,
        timezone: data.timezone,
        verificationToken: token,
        meetingLink,
        assignedSalesEngineer,
        workspaceUrl
      }),
      stage: 'verification_otp',
      sentAt: nowIso,
      status: 'delivered'
    }));

    const bookingId = `demo-req-${nowTs}`;
    const newBooking: ClientDemoBooking = {
      id: bookingId,
      ...data,
      workEmail: clientEmail,
      companyOwnerEmail: ownerEmail,
      companyOwnerName: ownerName,
      phone: cleanPhone,
      messageChannel,
      messageDispatches,
      status: isDisposable ? 'rejected_dummy' : 'pending_verification',
      verificationToken: token,
      verificationSentAt: nowIso,
      leadScore: score,
      isCorporateEmail: isCorporate,
      meetingLink,
      assignedSalesEngineer,
      createdAt: nowIso,
      clientIp: '198.51.100.82',
      linkedTenantId: targetTenant.id,
      updatedAdminsSummary
    };

    // 4. Dispatch emails to BOTH Client Email and Company Owner Email
    const clientMailDoc: DispatchedClientEmail = {
      id: `mail-client-${nowTs}`,
      recipientName: data.fullName,
      recipientEmail: clientEmail,
      recipientRoleLabel: ownerEmail === clientEmail ? 'Client & Company Owner' : 'Client Coordinator',
      ccOwnerEmail: ownerEmail !== clientEmail ? ownerEmail : undefined,
      bookingId,
      phone: cleanPhone,
      messageChannel,
      preferredDate: data.preferredDate,
      preferredTimeSlot: data.preferredTimeSlot,
      meetingLink,
      companyName: targetTenant.name,
      companyDomain: targetTenant.domain,
      workspaceUrl,
      assignedArchitect: assignedSalesEngineer,
      assignedArchitectEmail,
      plan: targetTenant.plan,
      seatsAllocated: seatsLimit,
      verificationToken: token,
      activeModules: data.selectedModules,
      sentAt: nowIso,
      status: 'sent',
      tenantId: targetTenant.id
    };

    const newDispatchedMails: DispatchedClientEmail[] = [clientMailDoc];
    if (ownerEmail !== clientEmail) {
      const ownerMailDoc: DispatchedClientEmail = {
        id: `mail-owner-${nowTs + 2}`,
        recipientName: ownerName,
        recipientEmail: ownerEmail,
        recipientRoleLabel: 'Company Owner / Super Admin',
        ccOwnerEmail: clientEmail,
        bookingId,
        phone: cleanPhone,
        messageChannel,
        preferredDate: data.preferredDate,
        preferredTimeSlot: data.preferredTimeSlot,
        meetingLink,
        companyName: targetTenant.name,
        companyDomain: targetTenant.domain,
        workspaceUrl,
        assignedArchitect: assignedSalesEngineer,
        assignedArchitectEmail,
        plan: targetTenant.plan,
        seatsAllocated: seatsLimit,
        verificationToken: token,
        activeModules: data.selectedModules,
        sentAt: nowIso,
        status: 'sent',
        tenantId: targetTenant.id
      };
      newDispatchedMails.push(ownerMailDoc);
    }

    setDispatchedEmails(prev => [...newDispatchedMails, ...prev]);
    newDispatchedMails.forEach(m => {
      batchEntries.push({
        collectionName: 'dispatched_emails',
        docId: m.id,
        data: m as unknown as Record<string, unknown>
      });
    });

    // 5. Dynamically update Notifications for Company Account (Super Admin / Owner / HR Admin) & Platform Super Admin
    const channelSummary =
      messageChannel === 'both' ? 'WhatsApp & SMS' : messageChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';

    const companyNotif: AppNotification = {
      id: `notif-demo-${nowTs}`,
      tenantId: targetTenant.id,
      title: `Demo Booked: ${data.fullName} (${data.preferredDate})`,
      description: `${channelSummary} dispatched to ${cleanPhone}. Details sent to Client (${clientEmail}) & Owner (${ownerEmail}). Super Admin & HR Admin synced.`,
      time: 'Just now',
      read: false,
      category: 'onboarding',
      priority: 'urgent',
      targetView: 'demo_bookings',
      createdBy: data.fullName
    };

    const platformNotif: AppNotification = {
      id: `notif-platform-demo-${nowTs}`,
      tenantId: 'platform-root',
      title: `[${targetTenant.name}] New Demo Booked & Synced`,
      description: `${channelSummary} sent to ${cleanPhone}. Client (${clientEmail}) & Owner (${ownerEmail}) emailed; Company Super Admin & HR Admin updated.`,
      time: 'Just now',
      read: false,
      category: 'onboarding',
      priority: 'urgent',
      targetView: 'demo_bookings',
      createdBy: data.fullName
    };

    setAllNotifications(prev => [companyNotif, platformNotif, ...prev]);
    batchEntries.push(
      { collectionName: 'demo_bookings', docId: newBooking.id, data: newBooking as unknown as Record<string, unknown> },
      { collectionName: 'notifications', docId: companyNotif.id, data: companyNotif as unknown as Record<string, unknown> },
      { collectionName: 'notifications', docId: platformNotif.id, data: platformNotif as unknown as Record<string, unknown> }
    );

    queuePendingCloudWrites(batchEntries);
    setDemoBookings(prev => [newBooking, ...prev]);
    setActiveDemoRequestForVerification(newBooking);

    void saveBatchToCloud(batchEntries).then(ok => {
      if (ok) clearPendingCloudWrites(batchEntries);
    });

    logAction(
      'DEMO_REQUEST_DISPATCHED',
      `Demo booked for ${targetTenant.name} (${data.fullName}). ${channelSummary} sent to ${cleanPhone}; emails sent to ${clientEmail} & ${ownerEmail}; Super Admin & HR Admin updated.`,
      'medium'
    );
    showToast(`${channelSummary} sent to ${cleanPhone} & details emailed to Client + Company Owner!`);
    return newBooking;
  };

  const verifyDemoBookingEmail = (bookingId: string, token: string) => {
    const booking = demoBookings.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, message: 'Booking request not found' };
    }

    if (booking.verificationToken.trim() === token.trim()) {
      const nowTs = Date.now();
      const nowIso = new Date(nowTs).toISOString();
      const channel: DemoMessageChannel = booking.messageChannel || 'both';
      const channelsToSend: Array<'whatsapp' | 'sms'> =
        channel === 'both' ? ['whatsapp', 'sms'] : [channel];
      const ownerEmail = booking.companyOwnerEmail || booking.workEmail;
      const linkedTenant = tenants.find(t => t.id === booking.linkedTenantId);
      const companySlug = (linkedTenant?.slug || booking.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 18);
      const workspaceUrl = `https://${companySlug}.nattonflow.hr/workspace`;

      const confirmationDispatches: DemoMessageDispatch[] = channelsToSend.map((ch, idx) => ({
        id: `msg-conf-${ch}-${nowTs}-${idx}`,
        channel: ch,
        recipientPhone: booking.phone,
        messageBody: buildDemoMessageBody({
          channel: ch,
          stage: 'booking_confirmed',
          fullName: booking.fullName,
          companyName: booking.companyName,
          workEmail: booking.workEmail,
          companyOwnerEmail: ownerEmail,
          preferredDate: booking.preferredDate,
          preferredTimeSlot: booking.preferredTimeSlot,
          timezone: booking.timezone,
          verificationToken: booking.verificationToken,
          meetingLink: booking.meetingLink,
          assignedSalesEngineer: booking.assignedSalesEngineer,
          workspaceUrl
        }),
        stage: 'booking_confirmed',
        sentAt: nowIso,
        status: 'delivered'
      }));

      const updated: ClientDemoBooking = {
        ...booking,
        status: 'scheduled',
        verifiedAt: nowIso,
        leadScore: Math.min(100, booking.leadScore + 10),
        messageDispatches: [...(booking.messageDispatches || []), ...confirmationDispatches]
      };

      const batchEntries: BatchWriteEntry[] = [
        { collectionName: 'demo_bookings', docId: bookingId, data: updated as unknown as Record<string, unknown>, merge: true }
      ];

      // Mark linked dispatched emails as activated
      const linkedMails = dispatchedEmails.filter(m => m.bookingId === bookingId);
      if (linkedMails.length > 0) {
        setDispatchedEmails(prev =>
          prev.map(m => (m.bookingId === bookingId ? { ...m, status: 'activated' } : m))
        );
        linkedMails.forEach(m => {
          batchEntries.push({
            collectionName: 'dispatched_emails',
            docId: m.id,
            data: { status: 'activated' },
            merge: true
          });
        });
      }

      // Activate linked tenant workspace status from trial -> active if verified
      if (linkedTenant && linkedTenant.status === 'trial') {
        const updatedTenant: Tenant = { ...linkedTenant, status: 'active' };
        setTenants(prev => prev.map(t => (t.id === linkedTenant.id ? updatedTenant : t)));
        batchEntries.push({
          collectionName: 'tenants',
          docId: linkedTenant.id,
          data: { status: 'active' },
          merge: true
        });
      }

      // Post confirmed notifications to that company's Super Admin / HR Admin & Platform Super Admin
      const targetTenantId = booking.linkedTenantId || currentTenant.id;
      const confirmCompanyNotif: AppNotification = {
        id: `notif-demo-conf-${nowTs}`,
        tenantId: targetTenantId,
        title: `Demo Verified & Scheduled: ${booking.companyName}`,
        description: `Confirmation sent via ${channel === 'both' ? 'WhatsApp & SMS' : channel.toUpperCase()} to ${booking.phone} and emailed to ${booking.workEmail} & ${ownerEmail}.`,
        time: 'Just now',
        read: false,
        category: 'onboarding',
        priority: 'urgent',
        targetView: 'demo_bookings',
        createdBy: booking.fullName
      };

      const confirmPlatformNotif: AppNotification = {
        id: `notif-platform-conf-${nowTs}`,
        tenantId: 'platform-root',
        title: `[${booking.companyName}] Demo Confirmed & Account Active`,
        description: `Verified ${booking.fullName} (${booking.phone}). Client, Owner, Super Admin & HR Admin updated.`,
        time: 'Just now',
        read: false,
        category: 'onboarding',
        priority: 'normal',
        targetView: 'demo_bookings',
        createdBy: booking.fullName
      };

      setAllNotifications(prev => [confirmCompanyNotif, confirmPlatformNotif, ...prev]);
      batchEntries.push(
        { collectionName: 'notifications', docId: confirmCompanyNotif.id, data: confirmCompanyNotif as unknown as Record<string, unknown> },
        { collectionName: 'notifications', docId: confirmPlatformNotif.id, data: confirmPlatformNotif as unknown as Record<string, unknown> }
      );

      queuePendingCloudWrites(batchEntries);
      setDemoBookings(prev => prev.map(b => (b.id === bookingId ? updated : b)));
      setActiveDemoRequestForVerification(updated);

      void saveBatchToCloud(batchEntries).then(ok => {
        if (ok) clearPendingCloudWrites(batchEntries);
      });

      logAction(
        'CLIENT_DEMO_CONFIRMED',
        `Verified client demo for ${booking.companyName} (${booking.workEmail}, Owner: ${ownerEmail}, Phone: ${booking.phone})`,
        'low'
      );
      showToast(`Demo confirmed! SMS/WhatsApp & emails updated for ${booking.companyName}.`);
      return { success: true, message: 'Verification successful! Demo confirmed.' };
    } else {
      return { success: false, message: 'Invalid 6-digit verification code. Please check your SMS/WhatsApp or email inbox.' };
    }
  };

  const resendDemoVerificationEmail = (bookingId: string) => {
    const newToken = Math.floor(100000 + Math.random() * 900000).toString();
    const sentAt = new Date().toISOString();
    const existing = demoBookings.find(b => b.id === bookingId);
    if (existing) {
      const channel: DemoMessageChannel = existing.messageChannel || 'both';
      const channelsToSend: Array<'whatsapp' | 'sms'> =
        channel === 'both' ? ['whatsapp', 'sms'] : [channel];
      const ownerEmail = existing.companyOwnerEmail || existing.workEmail;
      const slug = existing.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 18) || 'client';
      const resendDispatches: DemoMessageDispatch[] = channelsToSend.map((ch, idx) => ({
        id: `msg-resend-${ch}-${Date.now()}-${idx}`,
        channel: ch,
        recipientPhone: existing.phone,
        messageBody: buildDemoMessageBody({
          channel: ch,
          stage: 'verification_otp',
          fullName: existing.fullName,
          companyName: existing.companyName,
          workEmail: existing.workEmail,
          companyOwnerEmail: ownerEmail,
          preferredDate: existing.preferredDate,
          preferredTimeSlot: existing.preferredTimeSlot,
          timezone: existing.timezone,
          verificationToken: newToken,
          meetingLink: existing.meetingLink,
          assignedSalesEngineer: existing.assignedSalesEngineer,
          workspaceUrl: `https://${slug}.nattonflow.hr/workspace`
        }),
        stage: 'verification_otp',
        sentAt,
        status: 'delivered'
      }));

      const updated: ClientDemoBooking = {
        ...existing,
        verificationToken: newToken,
        verificationSentAt: sentAt,
        messageDispatches: [...(existing.messageDispatches || []), ...resendDispatches]
      };
      setDemoBookings(prev => prev.map(b => (b.id === bookingId ? updated : b)));
      saveDocToCloud('demo_bookings', bookingId, updated as unknown as Record<string, unknown>, true);
      setActiveDemoRequestForVerification(updated);
    }
    showToast(`New 6-digit verification code dispatched via SMS/WhatsApp & Email.`);
    return newToken;
  };

  const updateDemoBookingStatus = (bookingId: string, status: DemoBookingStatus, notes?: string) => {
    setDemoBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const updated = {
          ...b,
          status,
          notes: notes ? `${b.notes || ''} [Update: ${notes}]` : b.notes
        };
        saveDocToCloud('demo_bookings', bookingId, updated as unknown as Record<string, unknown>, true);
        return updated;
      }
      return b;
    }));
    logAction('DEMO_STATUS_UPDATED', `Demo booking ${bookingId} status changed to ${status}`, 'low');
    showToast(`Demo booking status updated to ${status.replace('_', ' ').toUpperCase()}`);
  };

  const deleteDemoBooking = (bookingId: string) => {
    setDemoBookings(prev => prev.filter(b => b.id !== bookingId));
    deleteDocFromCloud('demo_bookings', bookingId);
    showToast('Demo request record removed.');
  };

  const sendDynamicClientEmail = (data: {
    recipientEmail: string;
    recipientName?: string;
    companyName?: string;
    companySize?: '1-20' | '21-50' | '51-200' | '201-1000' | '1000+';
    primaryModules?: string[];
  }): DispatchedClientEmail => {
    const email = data.recipientEmail.trim().toLowerCase();
    const parts = email.split('@');
    const username = parts[0] || 'User';
    const domain = parts[1] || 'company.com';

    // 1. Dynamic derivation of Person Name if not explicitly provided
    let derivedName = data.recipientName?.trim();
    if (!derivedName) {
      const cleanUsername = username.replace(/[0-9_]/g, '');
      if (cleanUsername.includes('.')) {
        derivedName = cleanUsername
          .split('.')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      } else if (cleanUsername.length > 2) {
        if (cleanUsername.startsWith('u') && cleanUsername.length > 4) {
          const stripped = cleanUsername.substring(1);
          derivedName = stripped.charAt(0).toUpperCase() + stripped.slice(1);
        } else {
          derivedName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
        }
      } else {
        derivedName = 'Valued Client';
      }
    }

    // 2. Dynamic derivation of Company Name if not explicitly provided
    let derivedCompany = data.companyName?.trim();
    if (!derivedCompany) {
      const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
      if (!freeProviders.includes(domain)) {
        const domainBase = domain.split('.')[0].replace(/[^a-zA-Z0-9]/g, ' ');
        derivedCompany = domainBase
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') + ' Enterprise';
      } else {
        derivedCompany = `${derivedName}'s Organization`;
      }
    }

    const companySlug = derivedCompany.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
    const newTenantId = `tenant-${companySlug}-${Date.now().toString(36)}`;
    const workspaceUrl = `https://${companySlug}.nattonflow.hr/workspace`;
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    // Assigned solutions architect dynamically tailored
    const architect = domain.endsWith('.in') || domain.includes('asia') || email.includes('anusha')
      ? { name: 'Elena Rostova (Lead HR Solutions Specialist)', email: 'elena.rostova@nattonflow.com' }
      : domain.endsWith('.eu') || domain.endsWith('.uk') || domain.endsWith('.fr')
        ? { name: 'David Chen (Senior Enterprise Architect)', email: 'david.chen@nattonflow.com' }
        : { name: 'Marcus Vance (Enterprise Solutions Architect)', email: 'marcus.vance@nattonflow.com' };

    const modules = data.primaryModules && data.primaryModules.length > 0 
      ? data.primaryModules 
      : [
          'Automated 8-Stage Payroll & Tax Slabs',
          'Smart Biometric & Geofenced Attendance',
          'Time Off & Leave Approvals',
          'Candidate ATS & Recruitment Kanban',
          'Performance Appraisals & OKRs',
          'Expense Claims & Reimbursements'
        ];

    const seats = data.companySize === '1000+' ? 1500 : data.companySize === '201-1000' ? 500 : 250;

    // 3. Provision real dynamic Tenant for this company
    const newTenant: Tenant = {
      id: newTenantId,
      name: derivedCompany,
      slug: companySlug,
      domain: domain,
      plan: 'Enterprise',
      status: 'trial',
      currency: domain.endsWith('.in') || email.includes('anusha') ? 'INR (₹)' : 'USD ($)',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York (EST)',
      totalEmployees: seats,
      createdAt: new Date().toISOString().split('T')[0],
      monthlyBilling: 0,
      securitySettings: {
        enforceMfa: true,
        ipWhitelistEnabled: false,
        sessionTimeoutMinutes: 60,
        auditLogsRetentionDays: 365
      }
    };

    // 4. Provision dedicated Company Super Admin user for this person
    const nowTs = Date.now();
    const newAdminUser: User = {
      id: `usr-${nowTs}`,
      tenantId: newTenantId,
      companySuperAdminTenantId: newTenantId,
      name: derivedName,
      email: email,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
      role: 'tenant_super_admin',
      title: 'VP of Human Resources / Company Super Admin',
      department: 'Human Resources',
      employeeCode: 'ADM-001',
      phone: '+1 (555) 019-2834',
      joinDate: new Date(nowTs).toISOString().split('T')[0],
      salaryBase: 125000,
      leaveBalances: { paid: 25, sick: 12, casual: 6, unpaid: 0 },
      status: 'active'
    };

    // 4b. Create linked SaaS Billing record so Free Trial tenants appear in SuperAdminView across all devices
    const trialBilling: SaaSCompanyBilling = {
      id: `bill-${newTenantId}`,
      tenantId: newTenantId,
      companyName: derivedCompany,
      plan: 'Enterprise',
      status: 'trial',
      activeSeats: 1,
      seatLimit: seats,
      monthlyRevenue: 0,
      renewalDate: new Date(nowTs + 14 * 86400000).toISOString().split('T')[0],
      mfaCompliance: 100,
      storageUsedGb: 1.0,
      createdAt: new Date(nowTs).toISOString()
    };

    // 5. Create Dispatched Email Record with all dynamic details
    const dispatchedMail: DispatchedClientEmail = {
      id: `mail-${nowTs}`,
      recipientName: derivedName,
      recipientEmail: email,
      companyName: derivedCompany,
      companyDomain: domain,
      workspaceUrl,
      assignedArchitect: architect.name,
      assignedArchitectEmail: architect.email,
      plan: 'Enterprise',
      seatsAllocated: seats,
      verificationToken: token,
      activeModules: modules,
      sentAt: new Date(nowTs).toISOString(),
      status: 'sent',
      tenantId: newTenantId
    };

    // 6. Update state & persist atomically to Cloud Firestore across all devices
    const trialBatch: BatchWriteEntry[] = [
      { collectionName: 'tenants', docId: newTenant.id, data: newTenant as unknown as Record<string, unknown> },
      { collectionName: 'users', docId: newAdminUser.id, data: newAdminUser as unknown as Record<string, unknown> },
      { collectionName: 'saas_billings', docId: trialBilling.id, data: trialBilling as unknown as Record<string, unknown> },
      { collectionName: 'dispatched_emails', docId: dispatchedMail.id, data: dispatchedMail as unknown as Record<string, unknown> }
    ];
    queuePendingCloudWrites(trialBatch);

    setTenants(prev => sortTenantsForDisplay([newTenant, ...prev.filter(t => t.id !== newTenantId)]));
    setUsers(prev => [newAdminUser, ...prev.filter(u => u.id !== newAdminUser.id)]);
    setSaasBillings(prev => sortBillingsForDisplay([trialBilling, ...prev.filter(b => b.id !== trialBilling.id)]));
    setDispatchedEmails(prev => [dispatchedMail, ...prev]);

    saveBatchToCloud(trialBatch).then(ok => {
      if (ok) clearPendingCloudWrites(trialBatch);
    });

    // Also register in demo bookings for unified leads registry
    const demoLead: ClientDemoBooking = {
      id: `demo-lead-${Date.now()}`,
      fullName: derivedName,
      workEmail: email,
      phone: '+1 (555) 019-2834',
      companyName: derivedCompany,
      companyWebsite: `https://${domain}`,
      companySize: (data.companySize as any) || '51-200',
      currentHrms: 'Dynamic Onboarding Request',
      selectedModules: modules,
      preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      preferredTimeSlot: '10:00 AM - 10:45 AM',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York (EST)',
      status: 'email_verified',
      verificationToken: token,
      verificationSentAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      leadScore: 96,
      isCorporateEmail: !['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain),
      meetingLink: `https://meet.nattonflow.com/workspace-${companySlug}`,
      assignedSalesEngineer: architect.name,
      createdAt: new Date().toISOString(),
      clientIp: '198.51.100.82'
    };
    setDemoBookings(prev => [demoLead, ...prev]);
    saveDocToCloud('demo_bookings', demoLead.id, demoLead as unknown as Record<string, unknown>);

    // Log in audit trail
    logAction('CLIENT_EMAIL_DISPATCHED', `Dynamic enterprise onboarding email and credentials dispatched to ${derivedName} <${email}> from ${derivedCompany}`, 'medium');

    // Automatically open the dynamic email inspector modal so user can view the full sent mail
    setActiveDispatchedEmailModal(dispatchedMail);

    showToast(`Personalized email dispatched to ${email}! View mail details below.`);
    return dispatchedMail;
  };

  const activateDynamicTenantFromEmail = (dispatchedEmailId: string) => {
    const mail = dispatchedEmails.find(m => m.id === dispatchedEmailId);
    if (!mail) return;

    let targetTenant = tenants.find(t => t.id === mail.tenantId);
    if (!targetTenant) {
      targetTenant = {
        id: mail.tenantId,
        name: mail.companyName,
        slug: mail.companyDomain.split('.')[0] || 'workspace',
        domain: mail.companyDomain,
        plan: mail.plan || 'Enterprise',
        status: 'trial',
        currency: 'INR (₹)',
        timezone: 'Asia/Kolkata (IST)',
        totalEmployees: mail.seatsAllocated || 250,
        createdAt: new Date().toISOString().split('T')[0],
        monthlyBilling: 0,
        securitySettings: {
          enforceMfa: true,
          ipWhitelistEnabled: false,
          sessionTimeoutMinutes: 60,
          auditLogsRetentionDays: 365
        }
      };
      setTenants(prev => [targetTenant!, ...prev]);
    }
    
    // Switch to this particular company
    setCurrentTenant(targetTenant);

    // Register office geofence for attendance punch verification if not exists
    if (!TENANT_OFFICE_LOCATIONS[targetTenant.id]) {
      TENANT_OFFICE_LOCATIONS[targetTenant.id] = {
        tenantId: targetTenant.id,
        name: `${targetTenant.name} Corporate Campus`,
        campus: 'Executive Corporate Park, Tower B',
        address: 'Outer Ring Road Innovation Sector',
        city: 'Bengaluru, Karnataka 560103',
        lat: 12.9260,
        lng: 77.6762,
        allowedRadiusMeters: 300,
        authorizedSubnet: '198.51.100.0/24'
      };
    }

    // Find or create the client's Company Super Admin persona for this specific company
    let targetUser = users.find(u => u.email === mail.recipientEmail && u.tenantId === mail.tenantId);
    if (!targetUser) {
      targetUser = {
        id: `usr-client-${Date.now()}`,
        tenantId: targetTenant.id,
        name: mail.recipientName,
        email: mail.recipientEmail,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'tenant_super_admin',
        title: 'Executive Managing Director & Company Super Admin',
        department: 'Executive Governance',
        employeeCode: `${targetTenant.slug.substring(0, 3).toUpperCase()}-SUP-01`,
        phone: '+91 98450 ' + Math.floor(10000 + Math.random() * 90000),
        joinDate: new Date().toISOString().split('T')[0],
        salaryBase: 220000,
        leaveBalances: { paid: 25, sick: 12, casual: 6, unpaid: 0 },
        status: 'active'
      };
      setUsers(prev => [targetUser!, ...prev]);
    } else {
      targetUser = {
        ...targetUser,
        role: 'tenant_super_admin',
        tenantId: targetTenant.id
      };
      setUsers(prev => prev.map(u => u.id === targetUser!.id ? targetUser! : u));
    }
      
    setCurrentUser(targetUser);
    const existingTrialBilling = saasBillings.find(
      b => b.tenantId === targetTenant!.id || b.companyName.trim().toLowerCase() === targetTenant!.name.trim().toLowerCase()
    );
    const activateBatch: BatchWriteEntry[] = [
      { collectionName: 'tenants', docId: targetTenant.id, data: targetTenant as unknown as Record<string, unknown> },
      { collectionName: 'users', docId: targetUser.id, data: { ...targetUser, companySuperAdminTenantId: targetTenant.id } as unknown as Record<string, unknown> }
    ];
    if (!existingTrialBilling) {
      const billingDoc: SaaSCompanyBilling = {
        id: `bill-${targetTenant.id}`,
        tenantId: targetTenant.id,
        companyName: targetTenant.name,
        plan: targetTenant.plan || 'Enterprise',
        status: 'trial',
        activeSeats: 1,
        seatLimit: targetTenant.totalEmployees || 250,
        monthlyRevenue: 0,
        renewalDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        mfaCompliance: 100,
        storageUsedGb: 1.0,
        createdAt: new Date().toISOString()
      };
      setSaasBillings(prev => sortBillingsForDisplay([billingDoc, ...prev.filter(b => b.id !== billingDoc.id)]));
      activateBatch.push({ collectionName: 'saas_billings', docId: billingDoc.id, data: billingDoc as unknown as Record<string, unknown> });
    }
    queuePendingCloudWrites(activateBatch);
    saveBatchToCloud(activateBatch).then(ok => {
      if (ok) clearPendingCloudWrites(activateBatch);
    });

    // Authenticate the session immediately
    setIsAuthenticated(true);
    sessionStorage.setItem('nattonflow_auth_session', 'true');

    // Mark email as verified and activated in state and Firestore
    setDispatchedEmails(prev => prev.map(m => m.id === dispatchedEmailId ? { ...m, status: 'activated' } : m));
    saveDocToCloud('dispatched_emails', dispatchedEmailId, { status: 'activated' }, true);
    setActiveDispatchedEmailModal(null);

    // Direct routing straight to the dashboard of this particular company
    setCurrentView('dashboard');

    // Create an isolated welcome notification for this company
    addTenantNotification({
      tenantId: targetTenant.id,
      title: `14-Day Free Trial Activated for ${targetTenant.name}`,
      description: `Welcome ${mail.recipientName}! Your dedicated enterprise HRMS workspace is fully operational with 250 seats.`,
      category: 'onboarding',
      priority: 'urgent',
      targetView: 'dashboard'
    });

    logAction('14_DAY_TRIAL_ACTIVATED', `14-Day Free Trial verified & launched for ${targetTenant.name} by ${mail.recipientName} (${mail.recipientEmail})`, 'high');
    showToast(`14-Day Free Trial Verified! Welcome to the ${mail.companyName} Corporate Dashboard.`);
  };

  // =========================================================================
  // PER-COMPANY & MAIN SUPER ADMIN WHATSAPP + DYNAMIC CHATBOT TEMPLATE CRUD
  // =========================================================================
  const updatePlatformSupportConfig = (updates: Partial<PlatformSupportConfig>) => {
    setPlatformSupportConfig(prev => {
      const next: PlatformSupportConfig = sanitizeForFirestore({
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      });
      saveDocToCloud('meta', 'platform_support_config', next as unknown as Record<string, unknown>, true);
      return next;
    });
  };

  const updateCompanyWhatsAppSettings = (
    targetId: string | 'platform-root',
    updates: { whatsappNumber?: string; whatsappEnabled?: boolean; chatbotEnabled?: boolean }
  ) => {
    if (targetId === 'platform-root') {
      updatePlatformSupportConfig(updates);
      logAction('PLATFORM_SUPPORT_UPDATED', `Main Super Admin updated WhatsApp/Chatbot configuration (${updates.whatsappNumber || 'toggle'})`, 'medium');
      showToast('Main Super Admin WhatsApp & Chatbot settings updated across all devices!');
      return;
    }
    const cleanUpdates: Partial<Tenant> = {};
    if (updates.whatsappNumber !== undefined) cleanUpdates.whatsappNumber = updates.whatsappNumber.trim();
    if (updates.whatsappEnabled !== undefined) cleanUpdates.whatsappEnabled = updates.whatsappEnabled;
    if (updates.chatbotEnabled !== undefined) cleanUpdates.chatbotEnabled = updates.chatbotEnabled;
    updateTenant(targetId, cleanUpdates);
    const targetName = tenants.find(t => t.id === targetId)?.name || targetId;
    showToast(`WhatsApp & Chatbot settings saved for ${targetName}.`);
  };

  const addCompanyChatbotTemplate = (
    targetId: string | 'platform-root',
    data: { question: string; answerTemplate: string; keywords?: string[]; category?: string }
  ): CompanyChatbotTemplate => {
    const newTpl: CompanyChatbotTemplate = sanitizeForFirestore({
      id: `tpl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      question: data.question.trim(),
      keywords:
        data.keywords && data.keywords.length > 0
          ? data.keywords
          : extractKeywordsFromText(data.question),
      answerTemplate: data.answerTemplate.trim(),
      category: data.category?.trim() || 'Custom Q&A',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0
    });

    if (targetId === 'platform-root') {
      setPlatformSupportConfig(prev => {
        const next: PlatformSupportConfig = {
          ...prev,
          chatbotTemplates: [newTpl, ...(prev.chatbotTemplates || [])],
          updatedAt: new Date().toISOString()
        };
        saveDocToCloud('meta', 'platform_support_config', next as unknown as Record<string, unknown>, true);
        return next;
      });
      logAction('PLATFORM_CHATBOT_TEMPLATE_ADDED', `Main Super Admin added dynamic chatbot Q&A: "${newTpl.question}"`, 'low');
      showToast('Added dynamic Q&A template to Main Super Admin Assistant!');
      return newTpl;
    }

    const existingTenant = tenants.find(t => t.id === targetId);
    const nextTemplates = [newTpl, ...(existingTenant?.chatbotTemplates || [])];
    updateTenant(targetId, { chatbotTemplates: nextTemplates });
    logAction('CHATBOT_TEMPLATE_ADDED', `Added Q&A template "${newTpl.question}" to ${existingTenant?.name || targetId}`, 'low');
    showToast(`Added question template to ${existingTenant?.name || 'Company'} Assistant!`);
    return newTpl;
  };

  const updateCompanyChatbotTemplate = (
    targetId: string | 'platform-root',
    templateId: string,
    updates: Partial<CompanyChatbotTemplate>
  ) => {
    if (targetId === 'platform-root') {
      setPlatformSupportConfig(prev => {
        const next: PlatformSupportConfig = {
          ...prev,
          chatbotTemplates: (prev.chatbotTemplates || []).map(t =>
            t.id === templateId ? sanitizeForFirestore({ ...t, ...updates }) : t
          ),
          updatedAt: new Date().toISOString()
        };
        saveDocToCloud('meta', 'platform_support_config', next as unknown as Record<string, unknown>, true);
        return next;
      });
      showToast('Updated Main Super Admin chatbot template.');
      return;
    }
    const existingTenant = tenants.find(t => t.id === targetId);
    if (!existingTenant) return;
    const nextTemplates = (existingTenant.chatbotTemplates || []).map(t =>
      t.id === templateId ? sanitizeForFirestore({ ...t, ...updates }) : t
    );
    updateTenant(targetId, { chatbotTemplates: nextTemplates });
    showToast(`Updated chatbot template for ${existingTenant.name}.`);
  };

  const deleteCompanyChatbotTemplate = (targetId: string | 'platform-root', templateId: string) => {
    if (targetId === 'platform-root') {
      setPlatformSupportConfig(prev => {
        const next: PlatformSupportConfig = {
          ...prev,
          chatbotTemplates: (prev.chatbotTemplates || []).filter(t => t.id !== templateId),
          updatedAt: new Date().toISOString()
        };
        saveDocToCloud('meta', 'platform_support_config', next as unknown as Record<string, unknown>, true);
        return next;
      });
      showToast('Removed platform chatbot template.');
      return;
    }
    const existingTenant = tenants.find(t => t.id === targetId);
    if (!existingTenant) return;
    const nextTemplates = (existingTenant.chatbotTemplates || []).filter(t => t.id !== templateId);
    updateTenant(targetId, { chatbotTemplates: nextTemplates });
    showToast(`Removed chatbot template from ${existingTenant.name}.`);
  };

  const recordChatbotQuestionAsked = (
    targetId: string | 'platform-root',
    questionText: string,
    matchedTemplateId?: string,
    autoAddTemplate?: { answerTemplate: string; category?: string }
  ) => {
    const cleanQ = questionText.trim();
    if (!cleanQ) return;

    const logEntry: ChatbotAskedQuestionLog = sanitizeForFirestore({
      id: `qlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      question: cleanQ,
      askedBy: currentUser.name,
      askedAt: new Date().toISOString(),
      matchedTemplateId,
      addedAsTemplate: Boolean(autoAddTemplate)
    });

    if (targetId === 'platform-root') {
      setPlatformSupportConfig(prev => {
        let nextTemplates = prev.chatbotTemplates || [];
        if (matchedTemplateId) {
          nextTemplates = nextTemplates.map(t =>
            t.id === matchedTemplateId ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t
          );
        }
        if (
          autoAddTemplate &&
          !nextTemplates.some(t => t.question.trim().toLowerCase() === cleanQ.toLowerCase())
        ) {
          const newTpl: CompanyChatbotTemplate = sanitizeForFirestore({
            id: `tpl-auto-${Date.now()}`,
            question: cleanQ,
            keywords: extractKeywordsFromText(cleanQ),
            answerTemplate: autoAddTemplate.answerTemplate.trim(),
            category: autoAddTemplate.category || 'Asked Question',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString().split('T')[0],
            usageCount: 1
          });
          nextTemplates = [newTpl, ...nextTemplates];
        }
        const next: PlatformSupportConfig = {
          ...prev,
          chatbotTemplates: nextTemplates,
          chatbotAskedLog: [logEntry, ...(prev.chatbotAskedLog || [])].slice(0, 40),
          updatedAt: new Date().toISOString()
        };
        saveDocToCloud('meta', 'platform_support_config', next as unknown as Record<string, unknown>, true);
        return next;
      });
      return;
    }

    const existingTenant = tenants.find(t => t.id === targetId);
    if (!existingTenant) return;

    let nextTemplates = existingTenant.chatbotTemplates || [];
    if (matchedTemplateId) {
      nextTemplates = nextTemplates.map(t =>
        t.id === matchedTemplateId ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t
      );
    }
    if (
      autoAddTemplate &&
      !nextTemplates.some(t => t.question.trim().toLowerCase() === cleanQ.toLowerCase())
    ) {
      const newTpl: CompanyChatbotTemplate = sanitizeForFirestore({
        id: `tpl-auto-${Date.now()}`,
        question: cleanQ,
        keywords: extractKeywordsFromText(cleanQ),
        answerTemplate: autoAddTemplate.answerTemplate.trim(),
        category: autoAddTemplate.category || 'Asked Question',
        createdBy: currentUser.name,
        createdAt: new Date().toISOString().split('T')[0],
        usageCount: 1
      });
      nextTemplates = [newTpl, ...nextTemplates];
    }
    const nextLog = [logEntry, ...(existingTenant.chatbotAskedLog || [])].slice(0, 40);
    updateTenant(targetId, {
      chatbotTemplates: nextTemplates,
      chatbotAskedLog: nextLog
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
        setCurrentUser,
        currentTenant,
        setCurrentTenant,
        tenants,
        users,
        addEmployee,
        deleteEmployee,
        updateEmployee,
        assignCompanySuperAdmin,
        updateTenant,
        switchRole,
        switchTenant,
        attendance,
        checkInCurrentEmployee,
        checkOutCurrentEmployee,
        requestAttendanceCorrection,
        approveAttendanceCorrection,
        toggleAttendanceBreak,
        logOvertimeForRecord,
        leaves,
        applyLeave,
        updateLeaveStatus,
        payrollCycles,
        payslips,
        runPayrollValidation,
        approvePayrollCycle,
        publishPayrollCycle,
        storeMonthlyPayslips,
        jobs,
        candidates,
        addJobOpening,
        addCandidate,
        updateCandidateStage,
        expenses,
        addExpense,
        approveExpense,
        tickets,
        addTicket,
        updateTicketStatus,
        assets,
        addAsset,
        deleteAsset,
        performanceGoals,
        addPerformanceGoal,
        updatePerformanceGoalProgress,
        deletePerformanceGoal,
        shifts,
        addShiftTemplate,
        assignEmployeeToShift,
        deleteShiftTemplate,
        employeeDocuments,
        addEmployeeDocument,
        toggleVerifyDocument,
        deleteEmployeeDocument,
        onboardingTasks,
        addOnboardingTask,
        generateDefaultOnboardingTasks,
        toggleOnboardingTask,
        deleteOnboardingTask,
        interviews,
        scheduleInterview,
        updateInterviewStatus,
        deleteInterview,
        offerLetters,
        createOfferLetter,
        updateOfferStatus,
        convertOfferToEmployee,
        performanceReviews,
        addPerformanceReview,
        updatePerformanceReviewStatus,
        continuousFeedback,
        addContinuousFeedback,
        updatePipStatus,
        deleteContinuousFeedback,
        announcements,
        addAnnouncement,
        togglePinAnnouncement,
        acknowledgeAnnouncement,
        deleteAnnouncement,
        enpsResponses,
        submitEnpsResponse,
        employeeLoans,
        requestEmployeeLoan,
        updateLoanStatus,
        recordLoanEmiPayment,
        saasBillings,
        updateCompanyStatus,
        registerNewTenant,
        syncAllFromCloud,
        isCloudSyncing,
        isAuthenticated,
        login,
        logout,
        auditLogs,
        logAction,
        searchQuery,
        setSearchQuery,
        notificationsCount,
        clearNotifications,
        notificationsList: tenantNotifications,
        addTenantNotification,
        deleteTenantNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        mobileMenuOpen,
        setMobileMenuOpen,
        demoBookings,
        isBookDemoModalOpen,
        setIsBookDemoModalOpen,
        activeDemoRequestForVerification,
        setActiveDemoRequestForVerification,
        submitDemoBooking,
        verifyDemoBookingEmail,
        resendDemoVerificationEmail,
        updateDemoBookingStatus,
        deleteDemoBooking,
        dispatchedEmails,
        activeDispatchedEmailModal,
        setActiveDispatchedEmailModal,
        sendDynamicClientEmail,
        activateDynamicTenantFromEmail,
        platformSupportConfig,
        updatePlatformSupportConfig,
        updateCompanyWhatsAppSettings,
        addCompanyChatbotTemplate,
        updateCompanyChatbotTemplate,
        deleteCompanyChatbotTemplate,
        recordChatbotQuestionAsked,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
