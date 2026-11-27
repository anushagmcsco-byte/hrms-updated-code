import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles,
  Filter,
  FileCheck2,
  X,
  Lock,
  Building2,
  Radio,
  Navigation,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Coffee,
  CalendarDays,
  Timer
} from 'lucide-react';
import { TENANT_OFFICE_LOCATIONS, OfficeLocation } from '../data/mockData';
import { ShiftRosterPanel, OvertimeBreakPanel } from '../components/AttendanceExtendedModules';

export const AttendanceView: React.FC = () => {
  const { 
    attendance, 
    users,
    currentUser, 
    checkInCurrentEmployee, 
    checkOutCurrentEmployee,
    requestAttendanceCorrection,
    approveAttendanceCorrection,
    toggleAttendanceBreak,
    currentTenant,
    updateTenant,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'live' | 'shifts' | 'overtime'>('live');
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [filterDept, setFilterDept] = useState('all');
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().split('T')[0]);

  // Office Location Geofence State (uses custom persisted tenant office location when configured)
  const office: OfficeLocation = currentTenant.officeLocation
    ? { tenantId: currentTenant.id, ...currentTenant.officeLocation }
    : TENANT_OFFICE_LOCATIONS[currentTenant.id] || {
        tenantId: currentTenant.id,
        name: `${currentTenant.name} Corporate Office`,
        campus: 'Embassy Tech Village, Outer Ring Road',
        address: 'Devarabeesanahalli',
        city: 'Bengaluru, Karnataka 560103',
        lat: 12.9260,
        lng: 77.6762,
        allowedRadiusMeters: 300,
        authorizedSubnet: '198.51.100.0/24'
      };

  // State: whether employee device is currently verified within the physical office campus
  const [isInsideOffice, setIsInsideOffice] = useState<boolean>(true);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [detectedDistance, setDetectedDistance] = useState<number>(18); // meters from office center
  const [verificationMode, setVerificationMode] = useState<'simulated_office' | 'real_gps'>('simulated_office');

  // Location Request Modal State (triggered when clicking Outside / Remote or verifying location)
  const [showLocationPromptModal, setShowLocationPromptModal] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'granted' | 'manual'>('idle');
  const [detectionSource, setDetectionSource] = useState<'gps' | 'network' | 'manual' | null>(null);
  const [gpsNoticeMsg, setGpsNoticeMsg] = useState<string | null>(null);
  const [capturedCoords, setCapturedCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [detectedPlaceLabel, setDetectedPlaceLabel] = useState<string>('');
  const [customLocationInput, setCustomLocationInput] = useState<string>('');
  const [remoteReasonInput, setRemoteReasonInput] = useState<string>('');
  const [confirmedRemoteLocation, setConfirmedRemoteLocation] = useState<string | null>(null);

  // Reset geofence verification state when user switches company
  useEffect(() => {
    setIsInsideOffice(true);
    setDetectedDistance(18);
    setVerificationMode('simulated_office');
    setCapturedCoords(null);
    setDetectedPlaceLabel('');
    setConfirmedRemoteLocation(null);
    setGpsStatus('idle');
    setDetectionSource(null);
    setGpsNoticeMsg(null);
  }, [currentTenant.id]);

  // Strict Tenant Data Isolation
  const tenantAttendance = attendance.filter(a => a.tenantId === currentTenant.id);

  const todayStr = new Date().toISOString().split('T')[0];
  const myRecord = tenantAttendance.find(a => a.employeeId === currentUser.id && a.date === todayStr);

  const isCheckedIn = !!myRecord;
  const isCheckedOut = !!myRecord?.checkOut && myRecord.checkOut !== '-';

  const isApprover = currentUser.role === 'manager' || currentUser.role === 'hr_admin' || currentUser.role === 'team_lead' || currentUser.role === 'company_owner' || currentUser.role === 'super_admin' || currentUser.role === 'tenant_super_admin';

  const pendingRegularizations = tenantAttendance.filter(a => a.correctionStatus === 'pending');

  const filteredAttendance = tenantAttendance.filter(a => {
    if (filterDept === 'all') return true;
    return a.department === filterDept;
  });

  // Live Daily Attendance KPI Breakdown for current tenant
  const tenantStaffCount = users.filter(u => u.tenantId === currentTenant.id && !u.isAppOwner).length;
  const todayRecords = tenantAttendance.filter(a => a.date === todayStr);
  const presentTodayCount = todayRecords.filter(a => a.status === 'present').length;
  const lateTodayCount = todayRecords.filter(a => a.status === 'late').length;
  const remoteTodayCount = todayRecords.filter(a => a.status === 'remote').length;
  const uniquePunchedIds = new Set(todayRecords.map(a => a.employeeId));
  const absentTodayCount = Math.max(0, tenantStaffCount - uniquePunchedIds.size);
  const isOnBreak = Boolean(myRecord?.onBreakSince);

  const handleRegularizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      showToast('Please provide a reason for the attendance adjustment.');
      return;
    }
    requestAttendanceCorrection(correctionDate, correctionReason, confirmedRemoteLocation || undefined);
    setShowRegularizeModal(false);
    setCorrectionReason('');
  };

  // Compute distance in meters via Haversine formula
  const computeDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Helper: fetch JSON with timeout so fallback never hangs
  const fetchJsonWithTimeout = async (url: string, timeoutMs: number = 4000): Promise<any> => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timer);
    }
  };

  // Reverse-geocode GPS coordinates into a human-readable locality/city label
  const reverseGeocodeCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const data = await fetchJsonWithTimeout(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        3500
      );
      const parts = [data?.locality || data?.city, data?.principalSubdivision, data?.countryName]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
      const uniqueParts = Array.from(new Set(parts));
      return uniqueParts.length > 0 ? uniqueParts.join(', ') : null;
    } catch {
      return null;
    }
  };

  // Automatic network IP geolocation fallback when browser GPS is restricted (e.g. embedded iframe permissions policy)
  const detectLocationViaNetwork = async (): Promise<{ lat: number; lng: number; label: string } | null> => {
    const providers: Array<() => Promise<{ lat: number; lng: number; label: string } | null>> = [
      async () => {
        const d = await fetchJsonWithTimeout('https://get.geojs.io/v1/ip/geo.json', 4000);
        const lat = Number(d?.latitude);
        const lng = Number(d?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const label = [d?.city, d?.region, d?.country].filter(Boolean).join(', ');
        return { lat, lng, label: label || `Network (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` };
      },
      async () => {
        const d = await fetchJsonWithTimeout('https://ipwho.is/', 4000);
        if (d?.success === false) return null;
        const lat = Number(d?.latitude);
        const lng = Number(d?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const label = [d?.city, d?.region, d?.country].filter(Boolean).join(', ');
        return { lat, lng, label: label || `Network (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` };
      },
      async () => {
        const d = await fetchJsonWithTimeout('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en', 4000);
        const lat = Number(d?.latitude);
        const lng = Number(d?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const label = [d?.locality || d?.city, d?.principalSubdivision, d?.countryName].filter(Boolean).join(', ');
        return { lat, lng, label: label || `Network (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` };
      }
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result) return result;
      } catch {
        // Try next provider seamlessly
      }
    }
    return null;
  };

  // Unified Location Detection Handler: tries native Device GPS first, then automatically falls back to Network Geolocation
  const handleDetectRealGps = (openModalOnOutside: boolean = false) => {
    setIsDetectingGps(true);
    setGpsStatus('requesting');
    setGpsNoticeMsg(null);

    const applyDetectedLocation = (
      userLat: number,
      userLng: number,
      source: 'gps' | 'network',
      placeLabel: string,
      accuracy?: number,
      fallbackNotice?: string
    ) => {
      setIsDetectingGps(false);
      setGpsStatus('granted');
      setDetectionSource(source);
      setVerificationMode('real_gps');
      setCapturedCoords({ lat: userLat, lng: userLng, accuracy });
      setDetectedPlaceLabel(placeLabel);
      setGpsNoticeMsg(fallbackNotice || null);

      const distanceM = computeDistanceMeters(userLat, userLng, office.lat, office.lng);
      setDetectedDistance(distanceM);
      setCustomLocationInput(placeLabel);

      if (source === 'gps' && distanceM <= office.allowedRadiusMeters) {
        setIsInsideOffice(true);
        setConfirmedRemoteLocation(null);
        showToast(`GPS Verified: Inside ${office.name} (${distanceM}m from office, within ${office.allowedRadiusMeters}m perimeter).`);
      } else {
        setIsInsideOffice(false);
        const distanceLabel = distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${distanceM}m`;
        setConfirmedRemoteLocation(`${placeLabel} — ${distanceLabel} from ${office.campus}`);
        showToast(`Location Verified (${source === 'gps' ? 'Device GPS' : 'Network'}): ${placeLabel} (${distanceLabel} from ${office.campus}).`);
      }
    };

    const runNetworkFallback = async (gpsFailReason: string) => {
      const networkLoc = await detectLocationViaNetwork();
      if (networkLoc) {
        applyDetectedLocation(
          networkLoc.lat,
          networkLoc.lng,
          'network',
          networkLoc.label,
          undefined,
          `${gpsFailReason} Verified automatically via network geolocation — refine your exact address below if needed.`
        );
        return;
      }

      // Offline / all automated providers unavailable -> calm manual entry mode (never a dead-end error)
      setIsDetectingGps(false);
      setGpsStatus('manual');
      setDetectionSource('manual');
      setGpsNoticeMsg('Automatic GPS and network location lookup are unavailable right now. Select a quick location below or type your current address.');
      setIsInsideOffice(false);
      if (openModalOnOutside) {
        setShowLocationPromptModal(true);
      }
      showToast('Enter your current location below to complete remote verification.');
    };

    if (!navigator.geolocation) {
      void runNetworkFallback('Browser GPS is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 0);
        const fallbackCoordsLabel = `GPS (${userLat.toFixed(4)}°, ${userLng.toFixed(4)}°)`;

        void reverseGeocodeCoords(userLat, userLng).then((resolvedAddress) => {
          applyDetectedLocation(
            userLat,
            userLng,
            'gps',
            resolvedAddress || fallbackCoordsLabel,
            accuracy
          );
        });
      },
      (error) => {
        const failReason =
          error.code === 1
            ? 'Direct browser GPS is restricted in this preview window.'
            : error.code === 2
            ? 'Device GPS signal was unavailable.'
            : 'Device GPS scan timed out.';
        void runNetworkFallback(failReason);
      },
      { timeout: 6000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // Triggered when clicking "Outside / Remote": opens Location Modal and immediately detects location
  const handleOutsideRemoteClick = () => {
    setIsInsideOffice(false);
    setShowLocationPromptModal(true);
    handleDetectRealGps(true);
  };

  // Quick-fill remote location helper preserving detected city when available
  const applyQuickLocationPreset = (prefix: string) => {
    if (detectedPlaceLabel && !detectedPlaceLabel.startsWith('GPS (')) {
      setCustomLocationInput(`${prefix} — ${detectedPlaceLabel}`);
    } else {
      setCustomLocationInput(prefix);
    }
  };

  // Confirm Remote / Outside Location inside the Location Prompt Modal
  const handleConfirmOutsideLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const locLabel = customLocationInput.trim() || (capturedCoords
      ? `GPS (${capturedCoords.lat.toFixed(4)}°, ${capturedCoords.lng.toFixed(4)}°)`
      : '');

    if (!locLabel) {
      setGpsNoticeMsg('Please enter your current city or address before confirming.');
      return;
    }

    // If native GPS verified the user is actually within the office campus radius, allow campus check-in
    if (detectionSource === 'gps' && detectedDistance <= office.allowedRadiusMeters) {
      setIsInsideOffice(true);
      setConfirmedRemoteLocation(null);
      showToast(`Office Location Verified: Inside ${office.campus} (${detectedDistance}m). Punch enabled.`);
      setShowLocationPromptModal(false);
      return;
    }

    const fullLocation = capturedCoords
      ? `${locLabel} [Lat: ${capturedCoords.lat.toFixed(4)}, Lng: ${capturedCoords.lng.toFixed(4)}]`
      : locLabel;

    setConfirmedRemoteLocation(fullLocation);
    setIsInsideOffice(false);

    // If user also provided a reason for off-site/remote attendance, submit a regularization request for manager approval
    if (remoteReasonInput.trim()) {
      requestAttendanceCorrection(todayStr, `${remoteReasonInput.trim()} (Location: ${fullLocation})`, fullLocation);
      setRemoteReasonInput('');
    } else {
      showToast(`Remote location verified (${locLabel}). You can now click Remote Punch In / Out.`);
    }
    setShowLocationPromptModal(false);
  };

  // Allow company admins/managers to set their verified current location as the company's official office campus
  const handleSetCurrentLocationAsOffice = () => {
    const label = detectedPlaceLabel || customLocationInput.trim() || confirmedRemoteLocation || `${currentTenant.name} Office`;
    const parts = label.split(',').map(p => p.trim()).filter(Boolean);
    const campusLabel = parts[0] || label;
    const cityLabel = parts.slice(1).join(', ') || label;
    const lat = capturedCoords?.lat ?? office.lat;
    const lng = capturedCoords?.lng ?? office.lng;

    updateTenant(currentTenant.id, {
      officeLocation: {
        name: `${currentTenant.name} Office`,
        campus: campusLabel,
        address: label,
        city: cityLabel,
        lat,
        lng,
        allowedRadiusMeters: office.allowedRadiusMeters || 300,
        authorizedSubnet: office.authorizedSubnet || '198.51.100.0/24'
      }
    });
    setIsInsideOffice(true);
    setDetectedDistance(0);
    setConfirmedRemoteLocation(null);
    showToast(`Updated ${currentTenant.name}'s authorized office campus to ${label} across all devices!`);
  };

  const canRemotePunch = !isInsideOffice && Boolean(confirmedRemoteLocation);

  const handlePunchIn = () => {
    if (isInsideOffice) {
      checkInCurrentEmployee(true, `${office.name} (${office.campus})`, false);
      return;
    }
    if (confirmedRemoteLocation) {
      checkInCurrentEmployee(false, confirmedRemoteLocation, true);
      return;
    }
    handleOutsideRemoteClick();
    showToast('Please verify your current location to enable Remote Punch In.');
  };

  const handlePunchOut = () => {
    if (isInsideOffice) {
      checkOutCurrentEmployee(true, `${office.name} (${office.campus})`, false);
      return;
    }
    if (confirmedRemoteLocation) {
      checkOutCurrentEmployee(false, confirmedRemoteLocation, true);
      return;
    }
    handleOutsideRemoteClick();
    showToast('Please verify your current location to enable Remote Punch Out.');
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Banner with Punch Dock & Office Geofence Verification Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#4361EE] uppercase tracking-wider mb-1">
            <Clock size={15} />
            <span>Smart Biometric & Office Geo-Fence Verification</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Attendance & Shift Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zero-proxy clock-in: employee attendance is cryptographically verified to the physical office campus coordinates.
          </p>
        </div>

        {/* Punch Card Controls with Live System Clock */}
        <div className="flex items-center gap-3 bg-[#F7F9FC] p-3 rounded-xl border border-slate-200 flex-wrap sm:flex-nowrap">
          <div className="text-right pr-2">
            <div className="flex items-center gap-1.5 justify-end text-[11px] font-mono font-bold text-[#4361EE]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{liveTime.toLocaleTimeString()} IST</span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {isCheckedIn ? `${myRecord?.checkIn} (Active)` : 'Not punched yet'}
            </p>
          </div>

          {!isCheckedIn ? (
            <button
              onClick={handlePunchIn}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer ${
                isInsideOffice 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : canRemotePunch
                  ? 'bg-[#4361EE] hover:bg-blue-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              title={
                isInsideOffice
                  ? 'Punch In from Office Location'
                  : canRemotePunch
                  ? `Remote Punch In from ${confirmedRemoteLocation}`
                  : 'Verify your current location to punch in remotely'
              }
            >
              {isInsideOffice ? <Clock size={15} /> : <MapPin size={15} />}
              <span>
                {isInsideOffice
                  ? 'Punch In'
                  : canRemotePunch
                  ? 'Remote Punch In'
                  : 'Verify Location to Punch'}
              </span>
            </button>
          ) : !isCheckedOut ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAttendanceBreak}
                className={`px-3 py-2.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isOnBreak
                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Track lunch or tea break duration"
              >
                <Coffee size={14} className={isOnBreak ? 'text-amber-700' : 'text-slate-500'} />
                <span>{isOnBreak ? 'End Break' : 'Start Break'}</span>
              </button>
              <button
                onClick={handlePunchOut}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer ${
                  isInsideOffice 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : canRemotePunch
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                title={
                  isInsideOffice
                    ? 'Punch Out from Office Location'
                    : canRemotePunch
                    ? `Remote Punch Out from ${confirmedRemoteLocation}`
                    : 'Verify your current location to punch out remotely'
                }
              >
                {isInsideOffice ? <Clock size={15} /> : <MapPin size={15} />}
                <span>
                  {isInsideOffice
                    ? 'Punch Out'
                    : canRemotePunch
                    ? 'Remote Punch Out'
                    : 'Verify Location to Punch Out'}
                </span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
              <CheckCircle2 size={14} />
              <span>Day Completed</span>
            </div>
          )}

          <button
            onClick={() => setShowRegularizeModal(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Regularize
          </button>
        </div>
      </div>

      {/* Attendance Module Sub-Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
        {[
          { id: 'live', label: 'Live Attendance & Geofence', icon: Clock },
          { id: 'shifts', label: 'Shift Roster & Schedules', icon: CalendarDays },
          { id: 'overtime', label: 'Overtime & Break Tracking', icon: Timer },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                active
                  ? 'bg-[#14213D] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Present / Absent / Late / Remote WFH Daily KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present On-Time</p>
          <p className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">{presentTodayCount}</p>
          <p className="text-[11px] text-slate-500">Checked in today ({todayStr})</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remote / WFH</p>
          <p className="text-xl font-extrabold text-[#4361EE] font-mono tabular-nums mt-1">{remoteTodayCount}</p>
          <p className="text-[11px] text-slate-500">Geo-verified off-site punches</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Late Arrivals</p>
          <p className="text-xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">{lateTodayCount}</p>
          <p className="text-[11px] text-slate-500">Beyond shift grace window</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Not Punched / Absent</p>
          <p className="text-xl font-extrabold text-rose-600 font-mono tabular-nums mt-1">{absentTodayCount}</p>
          <p className="text-[11px] text-slate-500">Out of {tenantStaffCount} active staff</p>
        </div>
      </div>

      {activeTab === 'shifts' && <ShiftRosterPanel />}
      {activeTab === 'overtime' && <OvertimeBreakPanel />}

      {activeTab === 'live' && (
      <>

      {/* 2. Interactive Office Geofence & Physical Campus Terminal */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isInsideOffice 
          ? 'bg-gradient-to-r from-emerald-50/80 to-blue-50/50 border-emerald-200 shadow-xs' 
          : canRemotePunch
          ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border-blue-200 shadow-xs'
          : 'bg-gradient-to-r from-amber-50/80 to-orange-50/40 border-amber-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs border ${
              isInsideOffice 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : canRemotePunch
                ? 'bg-[#4361EE] text-white border-blue-400'
                : 'bg-amber-500 text-white border-amber-400'
            }`}>
              {isInsideOffice ? <ShieldCheck size={22} /> : <MapPin size={22} />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isInsideOffice 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : canRemotePunch
                    ? 'bg-blue-100 text-[#4361EE] border-blue-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isInsideOffice
                    ? 'Location Verified: Inside Office Campus'
                    : canRemotePunch
                    ? 'Remote Mode: Location Verified'
                    : 'Outside Campus: Verify Location'}
                </span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Building2 size={13} className="text-[#4361EE]" />
                  <span>{office.name}</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1">
                <strong>Registered Office Address:</strong> {office.campus}{office.address && office.address !== office.campus ? `, ${office.address}` : ''}{office.city && !office.address?.includes(office.city) ? `, ${office.city}` : ''}
              </p>

              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 font-mono">
                  <MapPin size={12} className="text-[#4361EE]" />
                  <span>Lat: {office.lat.toFixed(4)}°, Lng: {office.lng.toFixed(4)}°</span>
                </span>
                <span className="text-slate-300">•</span>
                <span>Geofence Radius: <strong>{office.allowedRadiusMeters} meters</strong></span>
                <span className="text-slate-300">•</span>
                <span>Authorized Subnet: <code className="bg-white/80 px-1 py-0.2 rounded border border-slate-200">{office.authorizedSubnet}</code></span>
              </div>
            </div>
          </div>

          {/* Interactive Geofence & Location Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
            {/* GPS Detection Button */}
            <button
              onClick={() => handleDetectRealGps(false)}
              disabled={isDetectingGps}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Detect your device's actual GPS or network location"
            >
              {isDetectingGps ? (
                <RefreshCw size={13} className="animate-spin text-[#4361EE]" />
              ) : (
                <Navigation size={13} className="text-[#4361EE]" />
              )}
              <span>{isDetectingGps ? 'Detecting Location...' : 'Detect My Location'}</span>
            </button>

            {/* Inside Office vs Outside / Remote (Asks for Location) */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsInsideOffice(true);
                  setDetectedDistance(18);
                  setConfirmedRemoteLocation(null);
                  setVerificationMode('simulated_office');
                  showToast(`Office Location Verified: Within ${office.campus} (Distance: 18m). Punch enabled.`);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isInsideOffice 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle size={13} />
                <span>Inside Campus</span>
              </button>

              <button
                type="button"
                onClick={handleOutsideRemoteClick}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  !isInsideOffice 
                    ? 'bg-[#4361EE] text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin size={13} />
                <span>Outside / Remote</span>
              </button>
            </div>
          </div>
        </div>

        {/* Remote Verified / Location Verification Status Bar when outside office */}
        {!isInsideOffice && (
          <div className={`mt-3.5 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            canRemotePunch
              ? 'border-blue-200/80 text-slate-700'
              : 'border-amber-200/80 text-amber-900'
          }`}>
            <div className="flex items-start gap-2">
              {canRemotePunch ? (
                <CheckCircle2 size={15} className="flex-shrink-0 text-[#4361EE] mt-0.5" />
              ) : (
                <AlertCircle size={15} className="flex-shrink-0 text-amber-600 mt-0.5" />
              )}
              <div>
                {canRemotePunch ? (
                  <>
                    <p>
                      <strong className="text-[#14213D]">Remote Attendance Verified:</strong> Your current location has been logged for compliance. You can now use <strong>Remote Punch In / Punch Out</strong> above.
                    </p>
                    <p className="text-[11px] text-[#4361EE] mt-1 font-medium flex items-center gap-1">
                      <MapPin size={12} />
                      <span>Verified Location: <strong>{confirmedRemoteLocation}</strong></span>
                    </p>
                  </>
                ) : (
                  <p>
                    <strong>Location Verification Needed:</strong> You are currently outside <strong>{office.campus}</strong>. Verify your current location to unlock <strong>Remote Punch In / Punch Out</strong>.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {canRemotePunch && isApprover && (
                <button
                  type="button"
                  onClick={handleSetCurrentLocationAsOffice}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg font-bold text-[11px] whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  title="Update this company's authorized office campus to your current verified location"
                >
                  <Building2 size={12} />
                  <span>Set as Office Campus</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleOutsideRemoteClick}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#4361EE] border border-blue-200 rounded-lg font-bold text-[11px] whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <Navigation size={12} />
                <span>{canRemotePunch ? 'Update Location' : 'Verify Location'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shifts & Policy Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-xs">
          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Standard Shift</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">09:30 AM - 06:30 PM ({currentTenant.timezone || 'IST'})</p>
          <p className="text-[11px] text-slate-500 mt-1">Grace Period: 15 minutes</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-xs">
          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Working Days</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">Monday - Friday (5 Days)</p>
          <p className="text-[11px] text-slate-500 mt-1">Weekend: Saturday & Sunday</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-xs">
          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Location Security</p>
          <p className="text-sm font-bold text-emerald-600 mt-0.5">Campus Geofence Verified</p>
          <p className="text-[11px] text-slate-500 mt-1">Allowed perimeter: {office.allowedRadiusMeters}m</p>
        </div>
      </div>

      {/* Manager Regularization Approvals Section (If there are pending items) */}
      {isApprover && pendingRegularizations.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Pending Attendance Corrections ({pendingRegularizations.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">Requires manager approval before payroll lock</span>
          </div>

          <div className="space-y-2">
            {pendingRegularizations.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {item.employeeName} <span className="text-slate-400 font-normal">({item.department})</span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Date: <span className="font-semibold">{item.date}</span> • Reason: "{item.correctionReason}"
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveAttendanceCorrection(item.id)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve Regularization</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Log Table with Office Verified Location Badges */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Live Attendance Roster</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              Today: {todayStr}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F7F9FC]"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Effective Hours</th>
                <th className="py-3 px-4">Verified Office Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No attendance punch records yet for {currentTenant.name}.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Clock in using the "Punch In" button above while verified within the office campus to record live daily attendance.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{record.employeeName}</td>
                    <td className="py-3 px-4 text-slate-500">{record.department}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{record.checkIn}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{record.checkOut || 'Active'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        record.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700'
                          : record.status === 'late'
                          ? 'bg-amber-50 text-amber-700'
                          : record.status === 'remote'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{record.workHours} hrs</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {record.officeLocationVerified === false ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                            record.correctionStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-[#4361EE] border-blue-200'
                          }`}>
                            <MapPin size={11} />
                            <span>
                              {record.correctionStatus === 'pending'
                                ? 'Remote (Pending)'
                                : record.correctionStatus === 'approved'
                                ? 'Remote Approved'
                                : 'Remote Verified'}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck size={11} className="text-emerald-600" />
                            <span>Office Verified</span>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-600 font-medium truncate max-w-[200px]" title={record.location}>
                          {record.officeCampus || record.location}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Regularize Modal */}
      {showRegularizeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRegularizeSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Request Attendance Regularization</h3>
              <button 
                type="button" 
                onClick={() => setShowRegularizeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
              <input
                type="date"
                required
                value={correctionDate}
                onChange={(e) => setCorrectionDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Explanation</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Metro delay, client on-site visit, card scanner malfunction"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRegularizeModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                Submit Regularization
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Location Request & Verification Modal (Triggered on Outside / Remote) */}
      {showLocationPromptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmOutsideLocation}
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#4361EE] rounded-xl">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Location Verification Required</h3>
                  <p className="text-[11px] text-slate-500">Share your current location for {currentTenant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationPromptModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Device GPS / Network Geolocation Status Box */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              gpsStatus === 'granted'
                ? isInsideOffice
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
                : gpsStatus === 'manual'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold min-w-0">
                  {gpsStatus === 'requesting' ? (
                    <RefreshCw size={14} className="animate-spin text-[#4361EE] shrink-0" />
                  ) : gpsStatus === 'granted' ? (
                    <CheckCircle2 size={14} className={`shrink-0 ${isInsideOffice ? 'text-emerald-600' : 'text-amber-600'}`} />
                  ) : (
                    <MapPin size={14} className="text-[#4361EE] shrink-0" />
                  )}
                  <span className="truncate">
                    {gpsStatus === 'requesting' && 'Detecting your current location...'}
                    {gpsStatus === 'granted' && (isInsideOffice
                      ? `Inside Office Geofence (${detectedDistance}m away)`
                      : `Location Verified (${detectedDistance >= 1000 ? `${(detectedDistance / 1000).toFixed(1)} km` : `${detectedDistance}m`} from office)`
                    )}
                    {gpsStatus === 'manual' && 'Enter Your Current Location'}
                    {gpsStatus === 'idle' && 'Detect your current location'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDetectRealGps(true)}
                  disabled={isDetectingGps}
                  className="px-2.5 py-1 bg-white text-[#4361EE] border border-blue-200 hover:bg-blue-50 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Navigation size={11} />
                  <span>{isDetectingGps ? 'Detecting...' : 'Re-detect'}</span>
                </button>
              </div>

              {capturedCoords && (
                <div className="text-[11px] font-mono bg-white/80 px-2.5 py-1.5 rounded-lg border border-black/5 flex flex-wrap items-center justify-between gap-1">
                  <span>
                    Coords: {capturedCoords.lat.toFixed(4)}°, {capturedCoords.lng.toFixed(4)}°
                    {capturedCoords.accuracy ? ` (±${capturedCoords.accuracy}m)` : ''}
                  </span>
                  <span className="font-sans text-[10px] font-semibold text-slate-600">
                    {detectionSource === 'gps' ? 'Device GPS' : 'Network Geolocation'}
                  </span>
                </div>
              )}

              {gpsNoticeMsg && (
                <p className="text-[11px] leading-relaxed opacity-90">{gpsNoticeMsg}</p>
              )}

              <p className="text-[10px] opacity-80">
                Authorized Office Campus: <strong>{office.campus}</strong> (Allowed radius: {office.allowedRadiusMeters}m)
              </p>
            </div>

            {/* Current Location Input (Auto-populated when detected, always editable) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Current Location / Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Work From Home - Hyderabad, or Client Site - HITEC City"
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {['Work From Home', 'Client Site Visit', 'Field / On-Site'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyQuickLocationPreset(preset)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#4361EE] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Remote / Off-site Reason for Manager Approval */}
            {!isInsideOffice && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Outside / Remote Work (Optional — sends manager approval request)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., On-site client deployment, field visit, or approved WFH"
                  value={remoteReasonInput}
                  onChange={(e) => setRemoteReasonInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE] resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Confirming your location unlocks Remote Punch-In / Punch-Out with your verified location logged. Adding a reason also sends a remote regularization note to your manager.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLocationPromptModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                {remoteReasonInput.trim() ? 'Submit & Enable Remote Punch' : 'Confirm & Enable Remote Punch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
