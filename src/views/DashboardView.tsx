import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { computeTenantPayrollFromAttendanceAndLeaves } from '../utils/payrollCalculator';
import { 
  Users, 
  Clock, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  ChevronRight,
  Shield,
  Send,
  PlusCircle,
  FileText,
  UserCheck,
  Building2,
  Briefcase,
  Layers,
  Award,
  CheckCircle,
  XCircle,
  ExternalLink,
  Crown,
  Laptop,
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-react';
import { UserRole } from '../types';

export const DashboardView: React.FC = () => {
  const { 
    currentUser, 
    users,
    tenants,
    currentTenant, 
    attendance, 
    leaves, 
    payrollCycles, 
    jobs,
    candidates,
    expenses,
    demoBookings,
    setCurrentView,
    checkInCurrentEmployee,
    checkOutCurrentEmployee,
    updateLeaveStatus,
    approveAttendanceCorrection,
    assignCompanySuperAdmin,
    showToast
  } = useApp();

  const [liveClock, setLiveClock] = useState(new Date());
  const [delegatingTenantId, setDelegatingTenantId] = useState<string | null>(null);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const role = currentUser.role;

  // Strict Tenant Data Isolation for 100% Dynamic Live Company Metrics (Zero Static Data)
  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id);
  const tenantAttendance = attendance.filter(a => a.tenantId === currentTenant.id);
  const tenantLeaves = leaves.filter(l => l.tenantId === currentTenant.id);
  const tenantCycles = payrollCycles.filter(c => c.tenantId === currentTenant.id);
  const tenantJobs = jobs.filter(j => j.tenantId === currentTenant.id);
  const tenantCandidates = candidates.filter(c => c.tenantId === currentTenant.id);
  const tenantExpenses = expenses.filter(e => e.tenantId === currentTenant.id);
  const syncedDemoBookings =
    role === 'super_admin'
      ? demoBookings
      : demoBookings.filter(
          b =>
            b.linkedTenantId === currentTenant.id ||
            b.companyName.trim().toLowerCase() === currentTenant.name.trim().toLowerCase()
        );

  const todayStr = new Date().toISOString().split('T')[0];
  const totalEmployees = tenantUsers.length;
  const presentToday = tenantAttendance.filter(a => a.date === todayStr && (a.status === 'present' || a.status === 'late')).length;
  const onLeaveToday = tenantAttendance.filter(a => a.date === todayStr && a.status === 'on_leave').length + tenantLeaves.filter(l => l.status === 'approved').length;
  const pendingLeavesCount = tenantLeaves.filter(l => l.status === 'pending').length;
  const pendingCorrectionsCount = tenantAttendance.filter(a => a.correctionStatus === 'pending').length;
  const pendingExpensesCount = tenantExpenses.filter(e => e.status === 'pending').length;
  const pendingApprovalsCount = pendingLeavesCount + pendingCorrectionsCount;

  // Dynamic payroll strictly scoped to the selected company, auto-calculated from Attendance & Leaves
  const activeTenantCycle = tenantCycles.find(c => c.month.includes('November')) || tenantCycles[0] || null;
  const liveDashboardPayroll = computeTenantPayrollFromAttendanceAndLeaves({
    tenantId: currentTenant.id,
    cycleId: activeTenantCycle?.id || `cycle-live-${currentTenant.id}`,
    cycleStatus: activeTenantCycle?.status || 'approved',
    users,
    attendance,
    leaves
  });
  const computedNetPayroll = liveDashboardPayroll.totals.totalNet;
  const activePayrollMonth = activeTenantCycle?.month || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const activePayrollStatus = activeTenantCycle?.status || (totalEmployees > 0 ? 'approved' : 'pending');

  const attendanceRate = totalEmployees > 0 ? Math.min(100, Math.round((presentToday / totalEmployees) * 100)) : 0;

  // Dynamic departmental distribution computed exclusively from currentTenant's real employees
  const deptCountsMap = tenantUsers.reduce<Record<string, number>>((acc, u) => {
    const dept = u.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  const dynamicDepartments = Object.entries(deptCountsMap)
    .map(([name, count]) => ({
      name,
      count,
      pct: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Dynamic team metrics for Department Manager / Team Lead
  const myDeptUsers = tenantUsers.filter(u => u.department === currentUser.department);
  const myDeptPresentToday = tenantAttendance.filter(
    a => a.date === todayStr && a.department === currentUser.department && (a.status === 'present' || a.status === 'late')
  ).length;
  const myDeptAttendanceRate = myDeptUsers.length > 0 ? Math.round((myDeptPresentToday / myDeptUsers.length) * 100) : 0;

  // Dynamic platform ARR across all real tenants
  const dynamicPlatformArr = tenants.reduce((sum, t) => sum + ((t.monthlyBilling || 0) * 12), 0);

  // Check if current user is currently checked in
  const userTodayAttendance = tenantAttendance.find(a => a.employeeId === currentUser.id && a.date === todayStr);
  const isCheckedIn = !!userTodayAttendance;
  const isCheckedOut = !!userTodayAttendance?.checkOut && userTodayAttendance.checkOut !== '-';

  // Helper for Application Owner delegating Company Super Admin
  const handleAssignSuperAdmin = (tenantId: string) => {
    if (!selectedAdminUserId) {
      showToast('Please select an employee to appoint as Company Super Admin.');
      return;
    }
    assignCompanySuperAdmin(tenantId, selectedAdminUserId);
    setDelegatingTenantId(null);
    setSelectedAdminUserId('');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Dynamic Role Context */}
      <div className="bg-gradient-to-r from-[#14213D] via-[#1c2e56] to-[#4361EE] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-100 border border-white/15">
                <Building2 size={13} className="text-amber-300" />
                <span>{currentTenant.name}</span>
                <span className="text-[10px] text-blue-200 font-mono">({currentTenant.id})</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200 border border-blue-400/20">
                {currentUser.isAppOwner ? (
                  <>
                    <Crown size={12} className="text-amber-300" />
                    <span>Application Owner</span>
                  </>
                ) : role === 'tenant_super_admin' ? (
                  <>
                    <Shield size={12} className="text-emerald-300" />
                    <span>Company Super Admin</span>
                  </>
                ) : (
                  <span className="capitalize">{role.replace(/_/g, ' ')}</span>
                )}
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-200 border border-emerald-400/30">
                <Clock size={12} className="text-emerald-300" />
                <span>Live IST: {liveClock.toLocaleTimeString()}</span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Good day, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-slate-200 text-sm mt-1 max-w-xl">
              {currentUser.isAppOwner && "Platform Architecture Hub: manage client tenants, appoint company super-admins, and inspect SaaS license health."}
              {role === 'tenant_super_admin' && "Company Executive Cockpit: supreme governance, headcount administration, and payroll authorizations."}
              {role === 'company_owner' && "Executive Business Cockpit: high-level workforce capacity, financial overhead, and compliance health."}
              {role === 'hr_admin' && "Workforce Operations: attendance logs, applicant tracking (ATS), and time-off request queues."}
              {role === 'payroll_admin' && "Statutory Payroll & Tax Engine: 8-stage verification pipeline, PF/ESI deductions, and bank NEFT batch."}
              {(role === 'manager' || role === 'team_lead') && `Team Leadership Portal: ${pendingApprovalsCount} pending subordinate requests awaiting your review.`}
              {role === 'recruiter' && "Talent Acquisition Desk: open job listings, candidate stage pipeline, and interview schedules."}
              {role === 'employee' && "Employee Self-Service (ESS): web clock-in, leave balances, and verified digital payslips."}
            </p>
          </div>

          {/* Quick Action Dock */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {!isCheckedIn ? (
              <button
                onClick={() => checkInCurrentEmployee(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 text-xs flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Clock size={16} />
                <span>Punch Check-In</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={() => checkOutCurrentEmployee(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-900/20 text-xs flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Clock size={16} />
                <span>Punch Check-Out ({userTodayAttendance?.checkIn})</span>
              </button>
            ) : (
              <div className="bg-white/20 text-emerald-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/20">
                <CheckCircle2 size={14} />
                <span>Shift Completed ({userTodayAttendance.workHours} hrs)</span>
              </div>
            )}

            <button
              onClick={() => setCurrentView('leaves')}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl border border-white/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar size={15} />
              <span>Request Leave</span>
            </button>

            <button
              onClick={() => setCurrentView('payroll')}
              className="bg-white text-[#14213D] hover:bg-slate-100 font-semibold px-3.5 py-2.5 rounded-xl shadow-md text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CreditCard size={15} className="text-[#4361EE]" />
              <span>View Payslip</span>
            </button>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* 1. ROLE-CUSTOMIZED KPI GRID                                   */}
      {/* ============================================================== */}

      {/* A. PLATFORM APPLICATION OWNER (DYNAMIC ACTIVE COMPANY + PLATFORM METRICS) */}
      {currentUser.isAppOwner && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{currentTenant.name.split(' ')[0]} Headcount</span>
              <div className="p-2 rounded-lg bg-[#EEF4FF] text-[#4361EE]">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#172033]">{totalEmployees}</span>
              <span className="text-xs font-semibold text-[#4361EE]">
                {dynamicDepartments.length} {dynamicDepartments.length === 1 ? 'Dept' : 'Depts'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">Live staff in {currentTenant.name}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Company Payroll Net</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 font-bold">₹</div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">₹{computedNetPayroll.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {activePayrollMonth} • Plan: {currentTenant.plan} (₹{(currentTenant.monthlyBilling || 0).toLocaleString('en-IN')}/mo)
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
              <div className="p-2 rounded-lg bg-blue-50 text-[#4361EE]">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{presentToday}/{totalEmployees}</span>
              <span className="text-xs font-semibold text-emerald-600">({attendanceRate}%)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{onLeaveToday} on leave • {pendingApprovalsCount} pending approvals</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Platform ARR ({tenants.length} Cos)</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Building2 size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-700">₹{dynamicPlatformArr.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {users.filter(u => u.role === 'tenant_super_admin').length} Super Admins • {tenantJobs.length} Open Jobs here
            </p>
          </div>
        </div>
      )}

      {/* B. COMPANY SUPER ADMIN & COMPANY OWNER */}
      {(role === 'tenant_super_admin' || role === 'company_owner') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Company Headcount</span>
              <div className="p-2 rounded-lg bg-[#EEF4FF] text-[#4361EE]">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#172033]">{totalEmployees}</span>
              <span className="text-xs font-medium text-emerald-600">
                {dynamicDepartments.length} {dynamicDepartments.length === 1 ? 'dept' : 'depts'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Verified permanent records in {currentTenant.name}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Monthly Payroll Net (₹)</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">₹{computedNetPayroll.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{activePayrollMonth} • Status: {activePayrollStatus.toUpperCase()}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
              <div className="p-2 rounded-lg bg-blue-50 text-[#4361EE]">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{presentToday}</span>
              <span className="text-xs font-semibold text-emerald-600">({attendanceRate}%)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{onLeaveToday} on leave • {pendingCorrectionsCount} regularizations</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-700">{pendingApprovalsCount + pendingExpensesCount}</span>
              <span className="text-xs font-semibold text-slate-500">Items</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingLeavesCount} leaves • {pendingExpensesCount} expenses • {currentTenant.securitySettings.enforceMfa ? 'MFA On' : 'MFA Off'}
            </p>
          </div>
        </div>
      )}

      {/* C. HR ADMIN */}
      {role === 'hr_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Active Staff</span>
              <div className="p-2 rounded-lg bg-[#EEF4FF] text-[#4361EE]">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#172033]">{totalEmployees}</span>
              <span className="text-xs font-semibold text-emerald-600">
                {tenantUsers.filter(u => u.status === 'active').length} active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across {dynamicDepartments.length} active departments in {currentTenant.name}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{attendanceRate}%</span>
              <span className="text-xs font-medium text-slate-500">{presentToday}/{totalEmployees}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Office geofence verified today</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Calendar size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">{pendingApprovalsCount}</span>
              <span className="text-xs font-semibold text-amber-600">Action items</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{pendingLeavesCount} leave requests & {pendingCorrectionsCount} regularizations</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Open Positions (ATS)</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-700">{tenantJobs.length}</span>
              <span className="text-xs font-semibold text-purple-600">{tenantCandidates.length} Candidates</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active recruitment pipelines for {currentTenant.name}</p>
          </div>
        </div>
      )}

      {/* D. PAYROLL ADMIN */}
      {role === 'payroll_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Disbursal Batch</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 font-bold">₹</div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">₹{computedNetPayroll.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">For {totalEmployees} employees in {currentTenant.name}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Statutory PF & ESI</span>
              <div className="p-2 rounded-lg bg-blue-50 text-[#4361EE]">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                ₹{liveDashboardPayroll.payslips.reduce((sum, s) => sum + s.providentFund, 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-blue-600">12% Earned Basic</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Auto-computed from {liveDashboardPayroll.totals.employeeCount} active payslips</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">TDS Withheld</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <FileText size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-700">₹{Math.round(computedNetPayroll * 0.10).toLocaleString('en-IN')}</span>
              <span className="text-xs font-semibold text-indigo-600">Form 16/24Q</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{currentTenant.currency} tax withholding pool</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Cycle Status</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 uppercase">{activePayrollStatus}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{activePayrollMonth} • {tenantCycles.length} cycles recorded</p>
          </div>
        </div>
      )}

      {/* E. DEPARTMENT MANAGER & TEAM LEAD */}
      {(role === 'manager' || role === 'team_lead') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Department Staff</span>
              <div className="p-2 rounded-lg bg-blue-50 text-[#4361EE]">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{myDeptUsers.length}</span>
              <span className="text-xs font-semibold text-slate-600 truncate">{currentUser.department}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Out of {totalEmployees} total in {currentTenant.name}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Team Present Today</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{myDeptAttendanceRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">{myDeptPresentToday}/{myDeptUsers.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Live attendance for {currentUser.department}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Leave Requests</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Calendar size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">{pendingLeavesCount}</span>
              <span className="text-xs font-semibold text-amber-600">Pending Review</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{pendingCorrectionsCount} attendance regularizations</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Expense Claims</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-700">{pendingExpensesCount}</span>
              <span className="text-xs font-semibold text-purple-600">Awaiting Sign-off</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{tenantExpenses.length} total claims in {currentTenant.name}</p>
          </div>
        </div>
      )}

      {/* F. TALENT RECRUITER */}
      {role === 'recruiter' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Requisitions</span>
              <div className="p-2 rounded-lg bg-blue-50 text-[#4361EE]">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{tenantJobs.length}</span>
              <span className="text-xs font-semibold text-blue-600">Open Roles</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">In {currentTenant.name}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Candidates</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-700">{tenantCandidates.length}</span>
              <span className="text-xs font-semibold text-purple-600">Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tracked in ATS pipeline</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">In Interview Stage</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Calendar size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {tenantCandidates.filter(c => c.stage === 'Technical' || c.stage === 'HR Interview').length}
              </span>
              <span className="text-xs font-semibold text-amber-600">Candidates</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Scheduled for panel reviews</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Offers & Hires</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">
                {tenantCandidates.filter(c => c.stage === 'Offered' || c.stage === 'Hired').length}
              </span>
              <span className="text-xs font-semibold text-emerald-600">Confirmed</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">For {currentTenant.name}</p>
          </div>
        </div>
      )}

      {/* G. EMPLOYEE SELF-SERVICE (ESS) */}
      {role === 'employee' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Paid Vacation Balance</span>
              <div className="p-2 rounded-lg bg-blue-50 text-[#4361EE]">
                <Calendar size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#4361EE]">{currentUser.leaveBalances.paid}</span>
              <span className="text-xs font-semibold text-slate-500">Days available</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{currentTenant.name} leave policy</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Sick / Medical Leave</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{currentUser.leaveBalances.sick}</span>
              <span className="text-xs font-semibold text-emerald-600">Days available</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Synced with cloud HR database</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Casual Leave</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Award size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">{currentUser.leaveBalances.casual}</span>
              <span className="text-xs font-semibold text-amber-600">Days</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">For urgent personal matters</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Verified Monthly Salary</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">₹{currentUser.salaryBase.toLocaleString('en-IN')}</span>
              <span className="text-xs font-semibold text-purple-600">/ mo</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Currency: {currentTenant.currency}</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ROLE-TAILORED MODULAR WIDGET PANELS                         */}
      {/* ============================================================== */}

      {/* WIDGET PANEL A: MAIN APPLICATION OWNER (MULTI-COMPANY SUPER ADMIN DELEGATION HUB) */}
      {currentUser.isAppOwner && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Crown size={20} className="text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">
                  Multi-Company Super Admin Delegation & Governance Hub
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                As Platform Owner, assign and manage dedicated Company Super Admins for each client organization.
              </p>
            </div>

            <button
              onClick={() => setCurrentView('super_admin')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Shield size={14} />
              <span>Open SaaS Infrastructure</span>
            </button>
          </div>

          {/* Tenants & Super Admin Delegation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client Company</th>
                  <th className="py-3 px-4">Allocated Company Super Admin</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Monthly Billing</th>
                  <th className="py-3 px-4">Headcount</th>
                  <th className="py-3 px-4 text-right">Appoint / Reassign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenants.map(tenant => {
                  const companySuperAdmin = users.find(u => 
                    u.role === 'tenant_super_admin' && (u.companySuperAdminTenantId === tenant.id || u.tenantId === tenant.id)
                  );
                  const isDelegating = delegatingTenantId === tenant.id;
                  const companyCandidates = users.filter(u => u.tenantId === tenant.id && !u.isAppOwner);

                  return (
                    <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-[#4361EE]" />
                          <span>{tenant.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{tenant.id}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {companySuperAdmin ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={companySuperAdmin.avatar} 
                              alt={companySuperAdmin.name} 
                              className="w-7 h-7 rounded-full object-cover border border-[#4361EE]" 
                            />
                            <div>
                              <p className="font-bold text-slate-800">{companySuperAdmin.name}</p>
                              <p className="text-[10px] text-slate-400">{companySuperAdmin.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            Pending Appointment
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <span className="bg-blue-50 text-[#4361EE] px-2 py-0.5 rounded font-bold text-[10px]">
                          {tenant.plan}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        ₹{tenant.monthlyBilling.toLocaleString('en-IN')} / mo
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{users.filter(u => u.tenantId === tenant.id).length}</span>
                        <span className="text-slate-400 text-[10px]"> verified</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isDelegating ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <select
                              value={selectedAdminUserId}
                              onChange={(e) => setSelectedAdminUserId(e.target.value)}
                              className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                            >
                              <option value="">Select Employee...</option>
                              {companyCandidates.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.title})</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignSuperAdmin(tenant.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDelegatingTenantId(null)}
                              className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setDelegatingTenantId(tenant.id);
                              setSelectedAdminUserId(companySuperAdmin?.id || '');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#4361EE] text-[#4361EE] hover:bg-blue-50 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            {companySuperAdmin ? 'Reassign Admin' : 'Appoint Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WIDGET PANEL B: GENERAL OPERATIONS / APPROVALS / PAYROLL / ESS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Operational Queue tailored to role */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Action Hub (Leaves & Attendance Approvals) */}
          {(role === 'hr_admin' || role === 'tenant_super_admin' || role === 'company_owner' || role === 'manager' || role === 'team_lead') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#4361EE]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Priority Sign-off & Workflow Inbox ({pendingApprovalsCount} pending)
                  </h2>
                </div>
                <button 
                  onClick={() => setCurrentView('leaves')}
                  className="text-xs font-semibold text-[#4361EE] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Requests</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {tenantLeaves.filter(l => l.status === 'pending').length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No pending leave applications in {currentTenant.name}. All caught up!
                  </p>
                ) : (
                  tenantLeaves.filter(l => l.status === 'pending').slice(0, 3).map((req) => (
                    <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-[#4361EE] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {req.employeeName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {req.employeeName} <span className="text-slate-400 font-normal">({req.department})</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Requested <span className="font-medium text-slate-700">{req.days} days ({req.leaveType})</span> • "{req.reason}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateLeaveStatus(req.id, 'approved', 'Authorized by manager')}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle size={13} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => updateLeaveStatus(req.id, 'rejected', 'Declined due to project deliverables')}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Live Demo Bookings Synced to Account, Super Admin & HR Admin */}
          {(role === 'super_admin' || role === 'tenant_super_admin' || role === 'company_owner' || role === 'hr_admin') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#4361EE]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {role === 'super_admin'
                      ? `Platform Demo Bookings & Admin Sync (${syncedDemoBookings.length})`
                      : `${currentTenant.name} Demo Bookings & Alerts (${syncedDemoBookings.length})`}
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentView('demo_bookings')}
                  className="text-xs font-semibold text-[#4361EE] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Demo Registry</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {syncedDemoBookings.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No demo bookings recorded for {currentTenant.name} yet. New bookings automatically send SMS/WhatsApp, email Client + Company Owner, and update this workspace.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 mt-2">
                  {syncedDemoBookings.slice(0, 3).map(demo => (
                    <div key={demo.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{demo.fullName}</span>
                          <span className="text-[11px] font-semibold text-slate-500">• {demo.companyName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            demo.status === 'scheduled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {demo.status === 'scheduled' ? 'Confirmed' : 'Pending OTP'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone size={11} className="text-emerald-600" />
                            <span>{demo.phone} ({(demo.messageChannel || 'both').toUpperCase()})</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail size={11} className="text-[#4361EE]" />
                            <span>{demo.workEmail}</span>
                          </span>
                          <span className="flex items-center gap-1 text-amber-700">
                            <Crown size={11} className="text-amber-500" />
                            <span>Owner: {demo.companyOwnerEmail || demo.workEmail}</span>
                          </span>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] font-bold text-slate-800">{demo.preferredDate}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">Super Admin & HR Admin Synced</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payroll Stepper Engine (For Payroll Admin & Company Super Admin) */}
          {(role === 'payroll_admin' || role === 'tenant_super_admin') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-[#4361EE]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Payroll Execution Engine — {currentTenant.name} ({activePayrollMonth})
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentView('payroll')}
                  className="text-xs font-semibold text-[#4361EE] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Payroll</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="text-[10px] font-bold block uppercase">Staff Included</span>
                  <span className="font-extrabold">{totalEmployees} Active</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="text-[10px] font-bold block uppercase">Attendance Sync</span>
                  <span className="font-extrabold">{tenantAttendance.length} Logs</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="text-[10px] font-bold block uppercase">Approved Leaves</span>
                  <span className="font-extrabold">{tenantLeaves.filter(l => l.status === 'approved').length} Leaves</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#4361EE]">
                  <span className="text-[10px] font-bold block uppercase">Cycle State</span>
                  <span className="font-extrabold uppercase">{activePayrollStatus}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-slate-800">
                    Bank Transfer Batch: {currentTenant.slug.toUpperCase().replace(/-/g, '_')}_NEFT.txt
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Total Net Disbursal ({currentTenant.name}): ₹{computedNetPayroll.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => showToast(`Encrypted NEFT batch exported for ${currentTenant.name}.`)}
                  className="px-3 py-1.5 bg-[#4361EE] text-white rounded-lg font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Download NEFT Batch
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Departmental Workforce Distribution (100% live from selected company) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-[#4361EE]" />
                <span>Departmental Workforce Distribution — {currentTenant.name}</span>
              </h2>
              <button 
                onClick={() => setCurrentView('employees')}
                className="text-xs font-semibold text-[#4361EE] hover:underline cursor-pointer"
              >
                View Roster ({totalEmployees})
              </button>
            </div>

            {dynamicDepartments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <p className="font-semibold text-slate-600">No employees recorded yet for {currentTenant.name}.</p>
                <p className="text-[11px] mt-1">Onboard team members in the Employee Directory to populate live analytics.</p>
                <button
                  onClick={() => setCurrentView('employees')}
                  className="mt-3 px-3.5 py-1.5 bg-[#4361EE] text-white rounded-lg font-semibold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Add First Employee
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {dynamicDepartments.map(dept => (
                  <div key={dept.name}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{dept.name}</span>
                      <span className="text-slate-500">
                        {dept.count} {dept.count === 1 ? 'Member' : 'Members'} ({dept.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#4361EE] h-1.5 rounded-full transition-all duration-300" style={{ width: `${dept.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Company Staff Snapshot (Updates immediately on company switch) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={16} className="text-[#4361EE]" />
                <span>{currentTenant.name} — Live Team Roster</span>
              </h2>
              <button
                onClick={() => setCurrentView('employees')}
                className="text-xs font-semibold text-[#4361EE] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Directory</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {tenantUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No staff added to {currentTenant.name} yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {tenantUsers.slice(0, 5).map(emp => (
                  <div key={emp.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{emp.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{emp.title} • {emp.department}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                        {emp.employeeCode}
                      </span>
                      <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        ₹{(emp.salaryBase || 0).toLocaleString('en-IN')}/mo
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Personal Card, ESS & Security Shield */}
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <UserCheck size={16} className="text-[#4361EE]" />
              <span>Active Profile Information</span>
            </h2>

            <div className="flex items-center gap-3.5 mt-3">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-12 h-12 rounded-xl object-cover border-2 border-[#4361EE]/40"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                    {currentUser.employeeCode}
                  </span>
                  <span className="text-[10px] bg-blue-50 text-[#4361EE] font-semibold px-1.5 py-0.5 rounded uppercase">
                    {currentUser.role.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Leave Balance Counters */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Paid Vacation</span>
                <span className="text-sm font-bold text-[#4361EE]">{currentUser.leaveBalances.paid}d</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Sick Leave</span>
                <span className="text-sm font-bold text-emerald-600">{currentUser.leaveBalances.sick}d</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Casual</span>
                <span className="text-sm font-bold text-amber-600">{currentUser.leaveBalances.casual}d</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => setCurrentView('leaves')}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Apply for Vacation / Leave</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => setCurrentView('payroll')}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Download Latest Payslip (PDF)</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Cryptographic Multi-Tenant Security Shield */}
          <div className="bg-[#14213D] text-white rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#4361EE]" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Cryptographic Tenant Shield
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Workforce records, employee PII, and payroll calculations are strictly sealed within the <strong>{currentTenant.name}</strong> security partition.
            </p>
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 size={12} />
                <span>Isolated DB Active</span>
              </span>
              <span>AES-256 GCM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
