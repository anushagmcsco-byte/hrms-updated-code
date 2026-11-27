import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  CreditCard,
  Download,
  FileCheck,
  ShieldCheck,
  Printer,
  Sparkles,
  X,
  Clock,
  Calendar,
  RefreshCw,
  Archive,
  Database,
  Sliders,
  Landmark,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SalaryStructurePanel,
  LoansAdvancesPanel,
  StatutoryCompliancePanel,
} from '../components/PayrollExtendedModules';
import {
  computeTenantPayrollFromAttendanceAndLeaves,
  ComputedPayslipItem,
  extractMonthKeyFromCycle,
  extractMonthKeyFromPayslip,
  formatMonthKeyLabel,
  getCurrentMonthKey,
  getMonthlyCycleId,
  getRecentMonthKeys,
  hydrateStoredPayslip,
  summarizePayslipTotals,
} from '../utils/payrollCalculator';

export const PayrollView: React.FC = () => {
  const {
    payrollCycles,
    payslips,
    users,
    attendance,
    leaves,
    currentUser,
    currentTenant,
    approvePayrollCycle,
    publishPayrollCycle,
    storeMonthlyPayslips,
    showToast,
  } = useApp();

  const currentMonthKey = getCurrentMonthKey();
  const [activePayrollTab, setActivePayrollTab] = useState<'monthly' | 'structure' | 'loans' | 'statutory'>('monthly');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [selectedPayslip, setSelectedPayslip] = useState<ComputedPayslipItem | null>(null);

  // Reset to present month when switching companies
  useEffect(() => {
    setSelectedMonthKey(getCurrentMonthKey());
    setSelectedPayslip(null);
  }, [currentTenant.id]);

  const role = currentUser.role;
  const isPayrollAdmin =
    role === 'payroll_admin' ||
    role === 'hr_admin' ||
    role === 'company_owner' ||
    role === 'super_admin' ||
    role === 'tenant_super_admin';

  const autoAuthorizeEnabled = currentTenant.securitySettings.autoAuthorizePayroll !== false;
  const isPresentMonth = selectedMonthKey === currentMonthKey;
  const isPastMonth = selectedMonthKey < currentMonthKey;

  const tenantCycles = useMemo(
    () => payrollCycles.filter((c) => c.tenantId === currentTenant.id),
    [payrollCycles, currentTenant.id]
  );

  const tenantStoredPayslips = useMemo(
    () => payslips.filter((p) => p.tenantId === currentTenant.id),
    [payslips, currentTenant.id]
  );

  // Active employee IDs in this tenant (deleted employees are permanently purged)
  const activeEmployeeIds = useMemo(
    () => new Set(users.filter((u) => u.tenantId === currentTenant.id).map((u) => u.id)),
    [users, currentTenant.id]
  );

  // Build sorted list of all available monthly periods (Present Month + Previous Stored Months + selected month)
  const availableMonthKeys = useMemo(() => {
    const keySet = new Set<string>(getRecentMonthKeys(3));
    keySet.add(selectedMonthKey);
    tenantCycles.forEach((c) => keySet.add(extractMonthKeyFromCycle(c)));
    tenantStoredPayslips.forEach((p) => keySet.add(extractMonthKeyFromPayslip(p, tenantCycles)));
    return Array.from(keySet)
      .filter((k) => /^\d{4}-\d{2}$/.test(k))
      .sort((a, b) => b.localeCompare(a));
  }, [selectedMonthKey, tenantCycles, tenantStoredPayslips]);

  // Helper to resolve monthly payslips for ANY monthKey:
  // - Present Month: live calculated from Attendance + Leave Management (and auto-stored to Firestore)
  // - Previous Months: loads permanently stored Firestore payslips first (never overwritten), falling back to computation if a newly selected historical month hasn't been stored yet
  const resolveMonthPayroll = useMemo(() => {
    return (monthKey: string) => {
      const cycle = tenantCycles.find((c) => extractMonthKeyFromCycle(c) === monthKey);
      const cycleId = cycle?.id || getMonthlyCycleId(currentTenant.id, monthKey);
      const monthLabel = formatMonthKeyLabel(monthKey);

      const storedForMonth = tenantStoredPayslips.filter(
        (p) =>
          extractMonthKeyFromPayslip(p, tenantCycles) === monthKey &&
          activeEmployeeIds.has(p.employeeId)
      );

      // For present month, compute live from Attendance & Leaves so punches & leave approvals appear instantly
      if (monthKey === currentMonthKey) {
        const computed = computeTenantPayrollFromAttendanceAndLeaves({
          tenantId: currentTenant.id,
          cycleId,
          monthKey,
          cycleStatus: cycle?.status || 'approved',
          users,
          attendance,
          leaves,
        });
        return {
          monthKey,
          monthLabel,
          cycleId,
          cycleStatus: cycle?.status || 'approved',
          isStoredInCloud: storedForMonth.length > 0,
          payslips: computed.payslips,
          totals: computed.totals,
        };
      }

      // For previous months: prefer permanently stored Firestore snapshots!
      if (storedForMonth.length > 0) {
        const hydrated = storedForMonth
          .map((slip) => hydrateStoredPayslip(slip, monthKey))
          .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        return {
          monthKey,
          monthLabel,
          cycleId,
          cycleStatus: cycle?.status || 'published',
          isStoredInCloud: true,
          payslips: hydrated,
          totals: summarizePayslipTotals(hydrated),
        };
      }

      // If an older month was picked via month picker and not yet stored, calculate preview from that month's data
      const fallbackComputed = computeTenantPayrollFromAttendanceAndLeaves({
        tenantId: currentTenant.id,
        cycleId,
        monthKey,
        cycleStatus: 'published',
        users,
        attendance,
        leaves,
      });
      return {
        monthKey,
        monthLabel,
        cycleId,
        cycleStatus: cycle?.status || 'published',
        isStoredInCloud: false,
        payslips: fallbackComputed.payslips,
        totals: fallbackComputed.totals,
      };
    };
  }, [
    tenantCycles,
    tenantStoredPayslips,
    activeEmployeeIds,
    currentMonthKey,
    currentTenant.id,
    users,
    attendance,
    leaves,
  ]);

  const activeMonthPayroll = useMemo(
    () => resolveMonthPayroll(selectedMonthKey),
    [resolveMonthPayroll, selectedMonthKey]
  );

  // Summary strip for all months (Present + Previous Stored Months)
  const monthlySummaries = useMemo(
    () => availableMonthKeys.map((mKey) => resolveMonthPayroll(mKey)),
    [availableMonthKeys, resolveMonthPayroll]
  );

  const visiblePayslips = isPayrollAdmin
    ? activeMonthPayroll.payslips
    : activeMonthPayroll.payslips.filter((p) => p.employeeId === currentUser.id);

  // Grand Totals for the selected month's visible register
  const visibleTotals = useMemo(() => {
    return visiblePayslips.reduce(
      (acc, slip) => ({
        paidDays: Number((acc.paidDays + slip.paidDays).toFixed(1)),
        workingDays: acc.workingDays + slip.workingDays,
        gross: acc.gross + slip.grossEarnings,
        deductions: acc.deductions + slip.totalDeductions,
        net: acc.net + slip.netPayable,
        lopAmount: acc.lopAmount + slip.leaveSummary.lopAmount,
      }),
      { paidDays: 0, workingDays: 0, gross: 0, deductions: 0, net: 0, lopAmount: 0 }
    );
  }, [visiblePayslips]);

  // All stored monthly payslips for the currently inspected employee in the modal
  const selectedEmployeeHistory = useMemo(() => {
    if (!selectedPayslip) return [];
    return availableMonthKeys
      .map((mKey) => {
        const monthData = resolveMonthPayroll(mKey);
        const match = monthData.payslips.find((p) => p.employeeId === selectedPayslip.employeeId);
        return match ? { monthKey: mKey, monthLabel: monthData.monthLabel, slip: match } : null;
      })
      .filter((item): item is { monthKey: string; monthLabel: string; slip: ComputedPayslipItem } => item !== null);
  }, [selectedPayslip, availableMonthKeys, resolveMonthPayroll]);

  const handleSelectCustomMonth = (newMonthKey: string) => {
    if (!newMonthKey || !/^\d{4}-\d{2}$/.test(newMonthKey)) return;
    setSelectedMonthKey(newMonthKey);
    // Automatically store the newly opened month's payslips in Firestore if not already archived
    storeMonthlyPayslips(newMonthKey, { forceRecalculate: false, silent: true });
  };

  const handlePublish = (cycleId: string) => {
    publishPayrollCycle(cycleId);
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore fallback
    }
  };

  const handleExportBankTransfer = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Month,Employee,Code,BankMasked,PaidDays,WorkingDays,ApprovedPaidLeaves,UnpaidLOPDays,GrossINR,DeductionsINR,NetPayableINR,Currency\n' +
      activeMonthPayroll.payslips
        .map(
          (p) =>
            `"${activeMonthPayroll.monthLabel}","${p.employeeName}","${p.employeeCode}","${p.bankAccountMasked}",${p.paidDays},${p.workingDays},${p.leaveSummary.approvedPaidLeaveDays},${p.leaveSummary.approvedUnpaidLeaveDays},${p.grossEarnings},${p.totalDeductions},${p.netPayable},"INR"`
        )
        .join('\n') +
      `\n"${activeMonthPayroll.monthLabel}","TOTAL AMOUNT GIVEN","${activeMonthPayroll.totals.employeeCount} Staff","",${activeMonthPayroll.totals.totalPaidDays},${activeMonthPayroll.totals.employeeCount * activeMonthPayroll.totals.workingDaysPerEmployee},${activeMonthPayroll.totals.totalApprovedPaidLeaveDays},${activeMonthPayroll.totals.totalUnpaidLeaveDays},${activeMonthPayroll.totals.totalGross},${activeMonthPayroll.totals.totalDeductions},${activeMonthPayroll.totals.totalNet},"INR"`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `NattonFlow_Payroll_${selectedMonthKey}_${currentTenant.slug || currentTenant.id}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${activeMonthPayroll.monthLabel} Bank ACH CSV with monthly totals.`);
  };

  const effectiveStatusLabel = isPastMonth
    ? 'STORED MONTHLY ARCHIVE'
    : activeMonthPayroll.cycleStatus === 'published'
    ? 'CURRENT MONTH · PUBLISHED'
    : autoAuthorizeEnabled
    ? 'CURRENT MONTH · AUTO-STORED'
    : activeMonthPayroll.cycleStatus.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Top Header & Monthly Selector Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="text-[#4361EE]" size={22} />
            <span>Monthly Payroll Engine &amp; Payslip Archive</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly-wise payslips auto-fetched from Attendance &amp; Leave Management. Both previous and present months stay permanently stored in cloud and are removed only when an employee is deleted.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            aria-label="Select payroll month"
            className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 shadow-xs focus:outline-none focus:border-[#4361EE]"
          >
            {availableMonthKeys.map((mKey) => (
              <option key={mKey} value={mKey}>
                {formatMonthKeyLabel(mKey)} {mKey === currentMonthKey ? '(Current Month)' : '(Stored Archive)'}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs">
            <Calendar size={13} className="text-[#4361EE]" />
            <input
              type="month"
              value={selectedMonthKey}
              max={currentMonthKey}
              onChange={(e) => handleSelectCustomMonth(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              title="Open or store payslips for any month"
            />
          </label>

          {isPayrollAdmin && (
            <button
              type="button"
              onClick={handleExportBankTransfer}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={14} className="text-[#4361EE]" />
              <span>Export {formatMonthKeyLabel(selectedMonthKey)} CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Payroll Module Sub-Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
        {[
          { id: 'monthly', label: 'Monthly Payroll & Archive', icon: CreditCard },
          { id: 'structure', label: 'Salary Structure (CTC)', icon: Sliders },
          { id: 'loans', label: 'Loans & Advances', icon: Landmark },
          { id: 'statutory', label: 'Statutory PF / ESI / TDS', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activePayrollTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePayrollTab(tab.id as typeof activePayrollTab)}
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

      {activePayrollTab === 'structure' && <SalaryStructurePanel />}
      {activePayrollTab === 'loans' && <LoansAdvancesPanel />}
      {activePayrollTab === 'statutory' && (
        <StatutoryCompliancePanel
          monthLabel={activeMonthPayroll.monthLabel}
          monthKey={activeMonthPayroll.monthKey}
          payslips={visiblePayslips}
        />
      )}

      {activePayrollTab === 'monthly' && (
      <>
      {/* Monthly-Wise Stored History Strip (Present + Previous Months) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Archive size={15} className="text-[#4361EE]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Monthly Payslip Vault ({monthlySummaries.length} Months Stored)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Database size={12} className="text-emerald-600" />
            <span>Permanent Cloud Archive · Deleted Only Upon Employee Removal</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {monthlySummaries.map((m) => {
            const isSelected = m.monthKey === selectedMonthKey;
            const isCurrent = m.monthKey === currentMonthKey;
            return (
              <button
                key={m.monthKey}
                type="button"
                onClick={() => setSelectedMonthKey(m.monthKey)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-[#4361EE] ring-1 ring-[#4361EE]/20'
                    : 'bg-[#F7F9FC] border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#14213D]">{m.monthLabel}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-blue-100 text-[#4361EE]'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isCurrent ? 'Present' : 'Stored'}
                  </span>
                </div>
                <p className="text-base font-extrabold text-emerald-700 mt-1.5 tabular-nums">
                  ₹{m.totals.totalNet.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {m.totals.employeeCount} payslip{m.totals.employeeCount === 1 ? '' : 's'} · {m.totals.totalPaidDays} paid d
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Auto-Synced Monthly Pipeline Card */}
      {isPayrollAdmin && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4361EE]">
                {activeMonthPayroll.monthLabel} Payroll Status
              </span>
              <span className="text-[11px] text-slate-500">
                · {isPresentMonth ? 'Live Sync from Attendance & Leave Management' : 'Permanent Monthly Historical Snapshot'}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${
                isPastMonth || activeMonthPayroll.cycleStatus === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-[#4361EE]'
              }`}
            >
              {effectiveStatusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Clock size={15} />
                <span>1. Attendance ({selectedMonthKey})</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                {activeMonthPayroll.totals.totalAttendanceLogs} log{activeMonthPayroll.totals.totalAttendanceLogs === 1 ? '' : 's'} · {activeMonthPayroll.totals.totalOvertimeHours}h OT
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Calendar size={15} />
                <span>2. Leaves ({selectedMonthKey})</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                {activeMonthPayroll.totals.totalApprovedPaidLeaveDays}d paid · {activeMonthPayroll.totals.totalUnpaidLeaveDays}d unpaid LOP
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <ShieldCheck size={15} />
                <span>3. Auto-Authorized</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                {autoAuthorizeEnabled ? 'Auto-authorized & stored live' : 'Manual approval mode'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs">
              <div className="flex items-center gap-1.5 text-[#4361EE] font-bold">
                <FileCheck size={15} />
                <span>4. Cloud Stored</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {activeMonthPayroll.totals.employeeCount} monthly payslip{activeMonthPayroll.totals.employeeCount === 1 ? '' : 's'} saved
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 flex-wrap gap-3">
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{activeMonthPayroll.monthLabel} Total Amount Given:</span>
              <strong className="text-base font-extrabold text-emerald-700 tabular-nums">
                ₹{activeMonthPayroll.totals.totalNet.toLocaleString('en-IN')}
              </strong>
              <span className="text-slate-400">
                ({activeMonthPayroll.totals.employeeCount} employees · {activeMonthPayroll.totals.totalPaidDays} paid days)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!autoAuthorizeEnabled &&
                activeMonthPayroll.cycleStatus !== 'approved' &&
                activeMonthPayroll.cycleStatus !== 'published' && (
                  <button
                    type="button"
                    onClick={() => approvePayrollCycle(activeMonthPayroll.cycleId)}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                  >
                    Authorize Cycle
                  </button>
                )}

              <button
                type="button"
                onClick={() => storeMonthlyPayslips(selectedMonthKey, { forceRecalculate: true, silent: false })}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                title="Recalculate and store this month's payslips from Attendance & Leave Management"
              >
                <RefreshCw size={13} />
                <span>Sync &amp; Store {formatMonthKeyLabel(selectedMonthKey)}</span>
              </button>

              {isPresentMonth && (
                <button
                  type="button"
                  onClick={() => handlePublish(activeMonthPayroll.cycleId)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Publish {activeMonthPayroll.monthLabel} Payslips</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cycle Summary Metrics in INR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-400 font-semibold uppercase">
            Gross Earnings ({activeMonthPayroll.monthLabel})
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            ₹{visibleTotals.gross.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Basic + HRA + Allowances + Overtime ({activeMonthPayroll.totals.totalOvertimeHours}h)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-400 font-semibold uppercase">
            Deductions, Taxes &amp; LOP
          </p>
          <p className="text-xl font-bold text-rose-600 mt-1 tabular-nums">
            -₹{visibleTotals.deductions.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            PF + TDS + Medical
            {visibleTotals.lopAmount > 0
              ? ` · LOP adjustment: -₹${visibleTotals.lopAmount.toLocaleString('en-IN')}`
              : ' · 0 LOP deductions'}
          </p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs">
          <p className="text-emerald-700 font-bold uppercase">
            Total Amount Given ({activeMonthPayroll.monthLabel})
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
            ₹{visibleTotals.net.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">
            Net payout across {visiblePayslips.length} staff · Stored in Cloud Firestore
          </p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {isPayrollAdmin
                ? `${activeMonthPayroll.monthLabel} — Stored Employee Payslip Register`
                : `${activeMonthPayroll.monthLabel} — My Stored Monthly Payslip`}
            </h2>
            <p className="text-xs text-slate-500">
              {isPresentMonth
                ? 'Automatically synced from present month Attendance & Leave Management and stored in cloud'
                : 'Permanently stored historical monthly archive — retained until an employee is deleted'}
            </p>
          </div>
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg self-start sm:self-auto border ${
              isPresentMonth
                ? 'text-[#4361EE] bg-blue-50 border-blue-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}
          >
            {isPresentMonth ? 'Present Month · Auto-Stored' : 'Previous Month · Archived'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Attendance &amp; Leaves</th>
                <th className="py-3 px-4">Paid Days</th>
                <th className="py-3 px-4">Gross (₹)</th>
                <th className="py-3 px-4">Deductions (₹)</th>
                <th className="py-3 px-4">Net Payable (₹)</th>
                <th className="py-3 px-4 text-right">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visiblePayslips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">
                      No stored payslips for {currentTenant.name} in {activeMonthPayroll.monthLabel}.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Add active employees in the Employees Directory and their monthly payslips will be stored automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                visiblePayslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{slip.employeeName}</p>
                      <p className="text-[10px] text-slate-400">
                        <span className="font-mono">{slip.employeeCode}</span> · {slip.designation}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{slip.monthLabel}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-slate-700 font-medium">
                          {slip.attendanceSummary.presentCount} punch{slip.attendanceSummary.presentCount === 1 ? '' : 'es'}
                          {slip.attendanceSummary.remoteCount > 0
                            ? ` (${slip.attendanceSummary.remoteCount} remote)`
                            : ''}
                          {slip.overtimeHours > 0 ? ` · +${slip.overtimeHours}h OT` : ''}
                        </p>
                        <p className="text-slate-500">
                          {slip.leaveSummary.approvedPaidLeaveDays > 0
                            ? `${slip.leaveSummary.approvedPaidLeaveDays}d Paid Leave`
                            : '0d Paid Leave'}
                          {slip.leaveSummary.approvedUnpaidLeaveDays > 0 && (
                            <span className="text-rose-600 font-semibold">
                              {' '}
                              · {slip.leaveSummary.approvedUnpaidLeaveDays}d Unpaid LOP
                            </span>
                          )}
                          {slip.leaveSummary.pendingLeaveDays > 0 && (
                            <span className="text-amber-600">
                              {' '}
                              · {slip.leaveSummary.pendingLeaveDays}d Pending
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 tabular-nums">
                      {slip.paidDays} / {slip.workingDays}
                      {slip.unpaidDays > 0 && (
                        <span className="block text-[10px] text-rose-600 font-medium">
                          -{slip.unpaidDays}d LOP
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 tabular-nums">
                      ₹{slip.grossEarnings.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-rose-600 font-medium tabular-nums">
                      -₹{slip.totalDeductions.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">
                      ₹{slip.netPayable.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPayslip(slip)}
                        className="px-3 py-1 text-xs font-semibold text-[#4361EE] hover:bg-blue-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        View Payslip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {visiblePayslips.length > 0 && (
              <tfoot className="bg-[#EEF4FF] border-t-2 border-blue-200 text-xs font-extrabold text-[#14213D]">
                <tr>
                  <td className="py-3.5 px-4" colSpan={3}>
                    TOTAL AMOUNT GIVEN — {activeMonthPayroll.monthLabel.toUpperCase()} ({visiblePayslips.length}{' '}
                    {visiblePayslips.length === 1 ? 'EMPLOYEE' : 'EMPLOYEES'})
                  </td>
                  <td className="py-3.5 px-4 tabular-nums">
                    {visibleTotals.paidDays} / {visibleTotals.workingDays} d
                  </td>
                  <td className="py-3.5 px-4 tabular-nums">
                    ₹{visibleTotals.gross.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-rose-600 tabular-nums">
                    -₹{visibleTotals.deductions.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 text-sm tabular-nums">
                    ₹{visibleTotals.net.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[11px] font-semibold text-[#4361EE]">
                    Grand Total
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      </>
      )}

      {/* Official Enterprise Monthly Payslip Modal Preview (with Employee Monthly History Switcher) */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedPayslip(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Payslip Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-3 pr-8">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png"
                  alt="Logo"
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1 bg-white shadow-xs"
                />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{currentTenant.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Monthly Compensation &amp; Tax Statement
                  </p>
                  <p className="text-[11px] font-bold text-[#4361EE]">
                    Pay Period: {selectedPayslip.monthLabel}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedPayslip.monthKey === currentMonthKey ? 'Current · Stored' : 'Archived · Stored'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  SLIP-{selectedPayslip.monthKey}-{selectedPayslip.employeeCode}
                </p>
              </div>
            </div>

            {/* Per-Employee Stored Monthly Payslips Switcher */}
            {selectedEmployeeHistory.length > 1 && (
              <div className="mt-4 pb-3 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Stored Monthly Payslips for {selectedPayslip.employeeName}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedEmployeeHistory.map((item) => {
                    const isActive = item.monthKey === selectedPayslip.monthKey;
                    return (
                      <button
                        key={item.monthKey}
                        type="button"
                        onClick={() => {
                          setSelectedPayslip(item.slip);
                          setSelectedMonthKey(item.monthKey);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#4361EE] text-white border-[#4361EE]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-[#4361EE]'
                        }`}
                      >
                        {item.monthLabel} · ₹{item.slip.netPayable.toLocaleString('en-IN')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Employee Demographic Block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs bg-slate-50 p-3 rounded-xl mt-4 border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Employee Name</span>
                <p className="font-bold text-slate-800">{selectedPayslip.employeeName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Employee ID</span>
                <p className="font-mono text-slate-800 font-semibold">{selectedPayslip.employeeCode}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Department</span>
                <p className="text-slate-800 font-medium">{selectedPayslip.department}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Designation</span>
                <p className="text-slate-800 font-medium">{selectedPayslip.designation}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Bank Account</span>
                <p className="font-mono text-slate-800">{selectedPayslip.bankAccountMasked}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax ID / PAN</span>
                <p className="font-mono text-slate-800">{selectedPayslip.panMasked}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Working Days</span>
                <p className="text-slate-800">{selectedPayslip.workingDays} Days</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Paid / LOP Days</span>
                <p className="text-slate-800 font-bold">
                  {selectedPayslip.paidDays} Paid
                  {selectedPayslip.unpaidDays > 0 ? ` · ${selectedPayslip.unpaidDays} LOP` : ''}
                </p>
              </div>
            </div>

            {/* Live Attendance & Leave Data Breakdown */}
            <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-[#4361EE] uppercase font-bold">Attendance Logs</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedPayslip.attendanceSummary.presentCount} recorded
                  {selectedPayslip.attendanceSummary.remoteCount > 0
                    ? ` (${selectedPayslip.attendanceSummary.remoteCount} remote)`
                    : ''}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#4361EE] uppercase font-bold">Approved Paid Leaves</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedPayslip.leaveSummary.approvedPaidLeaveDays} days
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#4361EE] uppercase font-bold">Unpaid Leave (LOP)</span>
                <p className="font-bold text-rose-600 mt-0.5">
                  {selectedPayslip.unpaidDays} days
                  {selectedPayslip.leaveSummary.lopAmount > 0
                    ? ` (-₹${selectedPayslip.leaveSummary.lopAmount.toLocaleString('en-IN')})`
                    : ''}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#4361EE] uppercase font-bold">Overtime Logged</span>
                <p className="font-bold text-emerald-700 mt-0.5">
                  {selectedPayslip.overtimeHours} hrs
                  {selectedPayslip.attendanceSummary.overtimePay > 0
                    ? ` (+₹${selectedPayslip.attendanceSummary.overtimePay.toLocaleString('en-IN')})`
                    : ''}
                </p>
              </div>
            </div>

            {/* Breakdown Grid: Earnings vs Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="border border-slate-200 rounded-xl p-3">
                <p className="font-bold pb-2 border-b border-slate-100 uppercase tracking-wider text-[11px] text-[#4361EE]">
                  Earnings
                </p>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Salary (Prorated)</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      ₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">House Rent Allowance (HRA)</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      ₹{selectedPayslip.hra.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Special Allowance</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      ₹{selectedPayslip.specialAllowance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bonus &amp; Overtime Pay</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      ₹{selectedPayslip.bonus.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                    <span>Total Gross Earnings</span>
                    <span className="tabular-nums">
                      ₹{selectedPayslip.grossEarnings.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3">
                <p className="font-bold pb-2 border-b border-slate-100 uppercase tracking-wider text-[11px] text-rose-600">
                  Deductions &amp; Taxes
                </p>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provident Fund (PF 12%)</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      ₹{selectedPayslip.providentFund.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax Deducted at Source (TDS)</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      ₹{selectedPayslip.taxDeducted.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medical Group Coverage</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      ₹{selectedPayslip.medicalInsurance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-5 border-t border-slate-100 font-bold text-rose-600">
                    <span>Total Deductions</span>
                    <span className="tabular-nums">
                      -₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Payable Highlight */}
            <div className="mt-4 bg-[#EEF4FF] border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#4361EE] uppercase tracking-wide">
                  Net Disbursed Amount ({selectedPayslip.monthLabel})
                </p>
                <p className="text-xs text-slate-500">
                  Credited to registered corporate bank account (NEFT / IMPS)
                </p>
              </div>
              <p className="text-2xl font-extrabold text-[#4361EE] tabular-nums">
                ₹{selectedPayslip.netPayable.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Permanently stored monthly statement · {selectedPayslip.monthLabel}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast(`Printing ${selectedPayslip.monthLabel} payslip for ${selectedPayslip.employeeName}.`);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
