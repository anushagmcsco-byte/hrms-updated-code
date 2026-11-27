import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Award,
  Users,
  CreditCard,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import {
  computeTenantPayrollFromAttendanceAndLeaves,
  getCurrentMonthKey,
  getMonthlyCycleId,
} from '../utils/payrollCalculator';

export const ReportsView: React.FC = () => {
  const {
    currentTenant,
    users,
    attendance,
    leaves,
    jobs,
    candidates,
    enpsResponses,
    employeeLoans,
    performanceReviews,
    showToast,
  } = useApp();

  const [selectedReportType, setSelectedReportType] = useState<
    'headcount' | 'payroll' | 'attendance' | 'attrition'
  >('headcount');

  // Strict tenant isolation across all analytics
  const tenantUsers = useMemo(
    () => users.filter((u) => u.tenantId === currentTenant.id && !u.isAppOwner),
    [users, currentTenant.id]
  );
  const tenantAttendance = useMemo(
    () => attendance.filter((a) => a.tenantId === currentTenant.id),
    [attendance, currentTenant.id]
  );
  const tenantLeaves = useMemo(
    () => leaves.filter((l) => l.tenantId === currentTenant.id),
    [leaves, currentTenant.id]
  );
  const tenantJobs = useMemo(
    () => jobs.filter((j) => j.tenantId === currentTenant.id),
    [jobs, currentTenant.id]
  );
  const tenantCandidates = useMemo(
    () => candidates.filter((c) => c.tenantId === currentTenant.id),
    [candidates, currentTenant.id]
  );
  const tenantEnps = useMemo(
    () => enpsResponses.filter((r) => r.tenantId === currentTenant.id),
    [enpsResponses, currentTenant.id]
  );
  const tenantLoans = useMemo(
    () => employeeLoans.filter((l) => l.tenantId === currentTenant.id),
    [employeeLoans, currentTenant.id]
  );
  const tenantReviews = useMemo(
    () => performanceReviews.filter((r) => r.tenantId === currentTenant.id),
    [performanceReviews, currentTenant.id]
  );

  // Live INR Payroll calculation for current month
  const currentMonthKey = getCurrentMonthKey();
  const livePayroll = useMemo(
    () =>
      computeTenantPayrollFromAttendanceAndLeaves({
        tenantId: currentTenant.id,
        cycleId: getMonthlyCycleId(currentTenant.id, currentMonthKey),
        monthKey: currentMonthKey,
        cycleStatus: 'approved',
        users,
        attendance,
        leaves,
      }),
    [currentTenant.id, currentMonthKey, users, attendance, leaves]
  );

  // Departmental breakdown (headcount + payroll)
  const deptBreakdown = useMemo(() => {
    const map: Record<string, { count: number; monthlySalary: number }> = {};
    tenantUsers.forEach((u) => {
      const dept = u.department || 'Unassigned';
      if (!map[dept]) map[dept] = { count: 0, monthlySalary: 0 };
      map[dept].count += 1;
      map[dept].monthlySalary += Number(u.salaryBase) || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [tenantUsers]);

  // Role breakdown
  const roleBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    tenantUsers.forEach((u) => {
      const r = u.role.replace(/_/g, ' ');
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [tenantUsers]);

  // Attendance & Overtime stats
  const attendanceStats = useMemo(() => {
    const total = tenantAttendance.length;
    const present = tenantAttendance.filter((a) => a.status === 'present').length;
    const remote = tenantAttendance.filter((a) => a.status === 'remote').length;
    const late = tenantAttendance.filter((a) => a.status === 'late').length;
    const totalHours = tenantAttendance.reduce((s, a) => s + (Number(a.workHours) || 0), 0);
    const totalOt = tenantAttendance.reduce(
      (s, a) => s + Math.max(Number(a.overtimeHours) || 0, Math.max(0, (Number(a.workHours) || 0) - 8)),
      0
    );
    const totalBreakMins = tenantAttendance.reduce((s, a) => s + (Number(a.breakMinutes) || 0), 0);
    const reliabilityPct = total > 0 ? Math.round(((present + remote) / total) * 100) : 100;
    return {
      total,
      present,
      remote,
      late,
      totalHours: Number(totalHours.toFixed(1)),
      totalOt: Number(totalOt.toFixed(1)),
      totalBreakMins,
      reliabilityPct,
    };
  }, [tenantAttendance]);

  // eNPS & Hiring metrics
  const enpsMetrics = useMemo(() => {
    const count = tenantEnps.length;
    if (count === 0) return { score: null as number | null, promoters: 0, passives: 0, detractors: 0 };
    const promoters = tenantEnps.filter((r) => r.score >= 9).length;
    const passives = tenantEnps.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = tenantEnps.filter((r) => r.score <= 6).length;
    const score = Math.round(((promoters - detractors) / count) * 100);
    return { score, promoters, passives, detractors };
  }, [tenantEnps]);

  const avgSalaryPerSeat =
    tenantUsers.length > 0
      ? Math.round(tenantUsers.reduce((s, u) => s + (Number(u.salaryBase) || 0), 0) / tenantUsers.length)
      : 0;

  const avgTenureYears = useMemo(() => {
    if (tenantUsers.length === 0) return '0.0';
    const now = Date.now();
    const totalYears = tenantUsers.reduce((sum, u) => {
      const joined = Date.parse(u.joinDate);
      if (Number.isNaN(joined)) return sum + 1;
      return sum + Math.max(0.1, (now - joined) / (1000 * 60 * 60 * 24 * 365.25));
    }, 0);
    return (totalYears / tenantUsers.length).toFixed(1);
  }, [tenantUsers]);

  // Real CSV Export per active tab
  const handleExportCsv = () => {
    let csv = '';
    if (selectedReportType === 'headcount') {
      csv =
        'EmployeeCode,Name,Department,Designation,Role,Status,JoinDate,MonthlyBaseINR\n' +
        tenantUsers
          .map(
            (u) =>
              `"${u.employeeCode}","${u.name}","${u.department}","${u.title}","${u.role}","${u.status}","${u.joinDate}",${u.salaryBase}`
          )
          .join('\n');
    } else if (selectedReportType === 'payroll') {
      csv =
        'EmployeeCode,Name,Department,PaidDays,WorkingDays,GrossINR,DeductionsINR,NetPayableINR\n' +
        livePayroll.payslips
          .map(
            (p) =>
              `"${p.employeeCode}","${p.employeeName}","${p.department}",${p.paidDays},${p.workingDays},${p.grossEarnings},${p.totalDeductions},${p.netPayable}`
          )
          .join('\n');
    } else if (selectedReportType === 'attendance') {
      csv =
        'Date,Employee,Department,CheckIn,CheckOut,Status,WorkHours,BreakMins,OvertimeHours,Location\n' +
        tenantAttendance
          .map(
            (a) =>
              `"${a.date}","${a.employeeName}","${a.department}","${a.checkIn}","${a.checkOut || ''}","${a.status}",${a.workHours},${a.breakMinutes || 0},${a.overtimeHours || 0},"${a.location}"`
          )
          .join('\n');
    } else {
      csv =
        'Metric,Value\n' +
        `"Active Headcount",${tenantUsers.length}\n` +
        `"Average Tenure Years",${avgTenureYears}\n` +
        `"Open Requisitions",${tenantJobs.length}\n` +
        `"Candidates in Funnel",${tenantCandidates.length}\n` +
        `"eNPS Score","${enpsMetrics.score === null ? 'N/A' : enpsMetrics.score}"\n` +
        `"Completed Appraisals",${tenantReviews.length}`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NattonFlow_${selectedReportType}_${currentTenant.slug || currentTenant.id}_${currentMonthKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${selectedReportType.toUpperCase()} CSV report for ${currentTenant.name}.`);
  };

  const handlePrintPdf = () => {
    window.print();
    showToast(`Opened print / Save PDF dialog for ${currentTenant.name} Executive Report.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-[#4361EE]" size={22} />
            <span>Executive Analytics &amp; Workforce Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live multi-tenant analytics isolated strictly to{' '}
            <strong className="text-slate-700">{currentTenant.name}</strong> (INR ₹).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'headcount', label: 'Headcount & Demographics', icon: Users },
          { id: 'payroll', label: 'Payroll & Compensation (₹)', icon: CreditCard },
          { id: 'attendance', label: 'Attendance & Overtime', icon: Clock },
          { id: 'attrition', label: 'Retention, Hiring & eNPS', icon: HeartHandshake },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = selectedReportType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedReportType(tab.id as typeof selectedReportType)}
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

      {/* TAB 1: HEADCOUNT & DEMOGRAPHICS */}
      {selectedReportType === 'headcount' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Departmental Headcount Allocation</h3>
              <span className="text-xs font-mono text-slate-500">
                Active Staff: {tenantUsers.length}
              </span>
            </div>

            {deptBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No active employees found in {currentTenant.name}.
              </p>
            ) : (
              <div className="space-y-3">
                {deptBreakdown.map(([dept, stats]) => {
                  const pct = tenantUsers.length > 0 ? Math.round((stats.count / tenantUsers.length) * 100) : 0;
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{dept}</span>
                        <span className="text-slate-500 font-mono tabular-nums">
                          {stats.count} staff ({pct}%) · ₹{stats.monthlySalary.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4361EE] h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Role Distribution ({currentTenant.name})
              </h3>
              {roleBreakdown.map(([roleName, cnt]) => (
                <div key={roleName} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                  <span className="capitalize text-slate-600 font-medium">{roleName}</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">{cnt}</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Average Employee Tenure</span>
              <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {avgTenureYears} Years
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Computed from employee join dates in {currentTenant.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYROLL & COMPENSATION */}
      {selectedReportType === 'payroll' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Gross Monthly Payroll</p>
              <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                ₹{livePayroll.totals.totalGross.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Total Deductions &amp; Tax</p>
              <p className="text-xl font-bold text-rose-600 font-mono tabular-nums mt-1">
                -₹{livePayroll.totals.totalDeductions.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
              <p className="text-emerald-700 font-bold uppercase text-[10px]">Net Disbursed ({currentMonthKey})</p>
              <p className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
                ₹{livePayroll.totals.totalNet.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Avg Monthly Base / Seat</p>
              <p className="text-xl font-bold text-[#4361EE] font-mono tabular-nums mt-1">
                ₹{avgSalaryPerSeat.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Departmental Compensation Cost Breakdown</h3>
              <span className="text-xs text-slate-500">
                Active Loans: {tenantLoans.filter((l) => l.status === 'approved').length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Headcount</th>
                    <th className="py-3 px-4">Monthly Base Payroll (₹)</th>
                    <th className="py-3 px-4">Annualized Run-Rate (₹)</th>
                    <th className="py-3 px-4 text-right">Avg / Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {deptBreakdown.map(([dept, stats]) => (
                    <tr key={dept} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{dept}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{stats.count}</td>
                      <td className="py-3 px-4 font-mono font-semibold tabular-nums">
                        ₹{stats.monthlySalary.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                        ₹{(stats.monthlySalary * 12).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#4361EE] tabular-nums">
                        ₹{Math.round(stats.monthlySalary / Math.max(1, stats.count)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & OVERTIME */}
      {selectedReportType === 'attendance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Attendance Reliability</p>
              <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                {attendanceStats.reliabilityPct}%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{attendanceStats.total} recorded punches</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Total Logged Hours</p>
              <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {attendanceStats.totalHours}h
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {attendanceStats.present} campus · {attendanceStats.remote} remote
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Overtime Logged</p>
              <p className="text-xl font-bold text-[#4361EE] font-mono tabular-nums mt-1">
                +{attendanceStats.totalOt}h
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Synced into payroll overtime pay</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Leave Requests</p>
              <p className="text-xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                {tenantLeaves.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {tenantLeaves.filter((l) => l.status === 'approved').length} approved ·{' '}
                {tenantLeaves.filter((l) => l.status === 'pending').length} pending
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Attendance &amp; Overtime Audit</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Work Hours</th>
                    <th className="py-3 px-4">Break</th>
                    <th className="py-3 px-4 text-right">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tenantAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No attendance logs recorded for {currentTenant.name} yet.
                      </td>
                    </tr>
                  ) : (
                    tenantAttendance.slice(0, 15).map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono">{rec.date}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{rec.employeeName}</td>
                        <td className="py-2.5 px-4 uppercase text-[11px] font-bold text-slate-600">{rec.status}</td>
                        <td className="py-2.5 px-4 font-mono tabular-nums">{rec.workHours}h</td>
                        <td className="py-2.5 px-4 font-mono tabular-nums">{rec.breakMinutes || 0}m</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#4361EE] tabular-nums">
                          +{Math.max(Number(rec.overtimeHours) || 0, Math.max(0, (Number(rec.workHours) || 0) - 8)).toFixed(1)}h
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RETENTION, HIRING & eNPS */}
      {selectedReportType === 'attrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Employee Net Promoter Score (eNPS)</p>
              <p className="text-3xl font-black font-mono text-[#4361EE] tabular-nums">
                {enpsMetrics.score === null ? 'No Data' : `${enpsMetrics.score > 0 ? '+' : ''}${enpsMetrics.score}`}
              </p>
              <p className="text-slate-500">
                Promoters: <strong className="text-emerald-700">{enpsMetrics.promoters}</strong> · Passives:{' '}
                <strong>{enpsMetrics.passives}</strong> · Detractors:{' '}
                <strong className="text-rose-600">{enpsMetrics.detractors}</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Hiring Funnel Conversion</p>
              <p className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                {tenantCandidates.length} <span className="text-sm font-semibold text-slate-400">applicants</span>
              </p>
              <p className="text-slate-500">
                {tenantJobs.length} open jobs ·{' '}
                {tenantCandidates.filter((c) => c.stage === 'Offered' || c.stage === 'Hired').length} offered / hired
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Workforce Status</p>
              <p className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                {tenantUsers.filter((u) => u.status === 'active').length} / {tenantUsers.length} Active
              </p>
              <p className="text-slate-500">
                {tenantUsers.filter((u) => u.status === 'on_leave').length} on leave ·{' '}
                {tenantUsers.filter((u) => u.status === 'terminated').length} exited
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">360° Appraisal Completion</p>
              <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {tenantReviews.filter((r) => r.status === 'completed').length} / {tenantReviews.length}
              </p>
              <p className="text-slate-500">Finalized performance evaluations</p>
            </div>
          </div>

          <div className="bg-[#14213D] text-white p-5 rounded-xl text-xs space-y-3 self-start">
            <div className="flex items-center gap-2 text-blue-300 font-bold">
              <Award size={16} />
              <span>Multi-Tenant Governance &amp; Audit</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              All metrics shown above are strictly partitioned to <strong>{currentTenant.name}</strong> ({currentTenant.plan} plan) and computed in real time from Cloud Firestore records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
