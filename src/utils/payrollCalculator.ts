import { AttendanceRecord, LeaveRequest, PayrollCycle, PayslipItem, User } from '../types';

export interface ComputedPayslipItem extends PayslipItem {
  monthKey: string;
  monthLabel: string;
  attendanceSummary: {
    presentCount: number;
    remoteCount: number;
    halfDayCount: number;
    absentCount: number;
    totalHoursWorked: number;
    overtimePay: number;
  };
  leaveSummary: {
    approvedPaidLeaveDays: number;
    approvedUnpaidLeaveDays: number;
    pendingLeaveDays: number;
    lopAmount: number;
  };
}

export interface ComputedPayrollTotals {
  employeeCount: number;
  workingDaysPerEmployee: number;
  totalPaidDays: number;
  totalUnpaidDays: number;
  totalAttendanceLogs: number;
  totalApprovedPaidLeaveDays: number;
  totalUnpaidLeaveDays: number;
  totalPendingLeaveDays: number;
  totalOvertimeHours: number;
  totalGross: number;
  totalLopAmount: number;
  totalDeductions: number;
  totalNet: number;
}

export interface ComputedPayrollResult {
  monthKey: string;
  monthLabel: string;
  payslips: ComputedPayslipItem[];
  totals: ComputedPayrollTotals;
}

const WORKING_DAYS = 22;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getCurrentMonthKey(refDate: Date = new Date()): string {
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getRecentMonthKeys(count: number = 3, refDate: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    keys.push(getCurrentMonthKey(d));
  }
  return keys;
}

export function formatMonthKeyLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  if (!Number.isFinite(year) || monthIdx < 0 || monthIdx > 11) {
    return monthKey;
  }
  return `${MONTH_NAMES[monthIdx]} ${year}`;
}

export function getMonthPeriodBounds(monthKey: string): { periodStart: string; periodEnd: string } {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr) || new Date().getFullYear();
  const monthNum = Number(mStr) || new Date().getMonth() + 1;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const mm = String(monthNum).padStart(2, '0');
  return {
    periodStart: `${year}-${mm}-01`,
    periodEnd: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function extractMonthKeyFromCycle(cycle: Pick<PayrollCycle, 'monthKey' | 'periodStart' | 'month'>): string {
  if (cycle.monthKey && /^\d{4}-\d{2}$/.test(cycle.monthKey)) {
    return cycle.monthKey;
  }
  if (cycle.periodStart && /^\d{4}-\d{2}/.test(cycle.periodStart)) {
    return cycle.periodStart.slice(0, 7);
  }
  if (cycle.month) {
    const parts = cycle.month.trim().split(/\s+/);
    if (parts.length === 2) {
      const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
      const yr = Number(parts[1]);
      if (mIdx >= 0 && Number.isFinite(yr)) {
        return `${yr}-${String(mIdx + 1).padStart(2, '0')}`;
      }
    }
  }
  return getCurrentMonthKey();
}

export function extractMonthKeyFromPayslip(
  slip: PayslipItem,
  cycles: PayrollCycle[] = []
): string {
  if (slip.monthKey && /^\d{4}-\d{2}$/.test(slip.monthKey)) {
    return slip.monthKey;
  }
  const match = slip.id.match(/(\d{4}-\d{2})/) || slip.payrollCycleId.match(/(\d{4}-\d{2})/);
  if (match) return match[1];
  const cycle = cycles.find((c) => c.id === slip.payrollCycleId);
  if (cycle) return extractMonthKeyFromCycle(cycle);
  return getCurrentMonthKey();
}

export function getMonthlyCycleId(tenantId: string, monthKey: string): string {
  return `cycle-${tenantId}-${monthKey}`;
}

export function getMonthlyPayslipId(tenantId: string, monthKey: string, employeeId: string): string {
  return `slip-${tenantId}-${monthKey}-${employeeId}`;
}

function stableDigitsFromString(seed: string, length: number = 4): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positive = Math.abs(hash);
  return String(positive).padStart(length, '0').slice(-length);
}

/**
 * Strips runtime helper sub-objects so PayslipItem writes cleanly to Cloud Firestore.
 */
export function toStorablePayslip(slip: ComputedPayslipItem): PayslipItem {
  const { attendanceSummary: _a, leaveSummary: _l, ...storable } = slip;
  return {
    ...storable,
    storedAt: storable.storedAt || new Date().toISOString(),
  };
}

/**
 * Hydrates a stored Firestore PayslipItem into ComputedPayslipItem shape for consistent rendering.
 */
export function hydrateStoredPayslip(
  slip: PayslipItem,
  monthKey: string
): ComputedPayslipItem {
  const monthLabel = slip.monthLabel || formatMonthKeyLabel(monthKey);
  return {
    ...slip,
    monthKey,
    monthLabel,
    attendanceSummary: {
      presentCount: slip.attendanceLogsCount ?? 0,
      remoteCount: slip.remoteLogsCount ?? 0,
      halfDayCount: 0,
      absentCount: 0,
      totalHoursWorked: Number(((slip.attendanceLogsCount ?? 0) * 8 + (slip.overtimeHours || 0)).toFixed(1)),
      overtimePay: slip.overtimePay ?? 0,
    },
    leaveSummary: {
      approvedPaidLeaveDays: slip.approvedPaidLeaveDays ?? 0,
      approvedUnpaidLeaveDays: slip.approvedUnpaidLeaveDays ?? slip.unpaidDays ?? 0,
      pendingLeaveDays: slip.pendingLeaveDays ?? 0,
      lopAmount: slip.lopAmount ?? 0,
    },
  };
}

export function summarizePayslipTotals(slips: ComputedPayslipItem[]): ComputedPayrollTotals {
  return slips.reduce<ComputedPayrollTotals>(
    (acc, slip) => ({
      employeeCount: acc.employeeCount + 1,
      workingDaysPerEmployee: WORKING_DAYS,
      totalPaidDays: Number((acc.totalPaidDays + (slip.paidDays || 0)).toFixed(1)),
      totalUnpaidDays: Number((acc.totalUnpaidDays + (slip.unpaidDays || 0)).toFixed(1)),
      totalAttendanceLogs: acc.totalAttendanceLogs + (slip.attendanceSummary.presentCount || 0),
      totalApprovedPaidLeaveDays:
        acc.totalApprovedPaidLeaveDays + (slip.leaveSummary.approvedPaidLeaveDays || 0),
      totalUnpaidLeaveDays:
        acc.totalUnpaidLeaveDays + (slip.leaveSummary.approvedUnpaidLeaveDays || 0),
      totalPendingLeaveDays: Number(
        (acc.totalPendingLeaveDays + (slip.leaveSummary.pendingLeaveDays || 0)).toFixed(1)
      ),
      totalOvertimeHours: Number((acc.totalOvertimeHours + (slip.overtimeHours || 0)).toFixed(1)),
      totalGross: acc.totalGross + (slip.grossEarnings || 0),
      totalLopAmount: acc.totalLopAmount + (slip.leaveSummary.lopAmount || 0),
      totalDeductions: acc.totalDeductions + (slip.totalDeductions || 0),
      totalNet: acc.totalNet + (slip.netPayable || 0),
    }),
    {
      employeeCount: 0,
      workingDaysPerEmployee: WORKING_DAYS,
      totalPaidDays: 0,
      totalUnpaidDays: 0,
      totalAttendanceLogs: 0,
      totalApprovedPaidLeaveDays: 0,
      totalUnpaidLeaveDays: 0,
      totalPendingLeaveDays: 0,
      totalOvertimeHours: 0,
      totalGross: 0,
      totalLopAmount: 0,
      totalDeductions: 0,
      totalNet: 0,
    }
  );
}

/**
 * Dynamically computes monthly payslips and grand totals for a company and specific monthKey ("YYYY-MM")
 * directly from that month's Attendance records and Leave Management records.
 */
export function computeTenantPayrollFromAttendanceAndLeaves(params: {
  tenantId: string;
  cycleId?: string;
  monthKey?: string;
  cycleStatus?: 'draft' | 'validated' | 'approved' | 'published';
  users: User[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
}): ComputedPayrollResult {
  const {
    tenantId,
    monthKey = getCurrentMonthKey(),
    cycleStatus = 'approved',
    users,
    attendance,
    leaves,
  } = params;

  const resolvedCycleId = params.cycleId || getMonthlyCycleId(tenantId, monthKey);
  const monthLabel = formatMonthKeyLabel(monthKey);

  const tenantUsers = users.filter((u) => u.tenantId === tenantId);
  const nonOwnerStaff = tenantUsers.filter((u) => !u.isAppOwner);
  const empsToPay = nonOwnerStaff.length > 0 ? nonOwnerStaff : tenantUsers;

  // Scope attendance and leaves strictly to the selected month ("YYYY-MM")
  const monthAttendance = attendance.filter(
    (a) => a.tenantId === tenantId && (a.date || '').startsWith(monthKey)
  );
  const monthLeaves = leaves.filter(
    (l) =>
      l.tenantId === tenantId &&
      ((l.startDate || '').startsWith(monthKey) || (l.endDate || '').startsWith(monthKey))
  );

  const payslips: ComputedPayslipItem[] = empsToPay.map((emp, idx) => {
    const empAttendance = monthAttendance.filter((a) => a.employeeId === emp.id);
    const empLeaves = monthLeaves.filter((l) => l.employeeId === emp.id);

    // 1. Attendance Management Metrics for this month
    const presentCount = empAttendance.filter(
      (a) => a.status === 'present' || a.status === 'late' || a.status === 'remote'
    ).length;
    const remoteCount = empAttendance.filter((a) => a.status === 'remote').length;
    const halfDayCount = empAttendance.filter((a) => a.status === 'half_day').length;
    const absentCount = empAttendance.filter((a) => a.status === 'absent').length;
    const totalHoursWorked = Number(
      empAttendance.reduce((sum, a) => sum + (Number(a.workHours) || 0), 0).toFixed(1)
    );
    const overtimeHours = Number(
      empAttendance
        .reduce(
          (sum, a) =>
            sum +
            Math.max(
              Number(a.overtimeHours) || 0,
              Math.max(0, (Number(a.workHours) || 0) - 8)
            ),
          0
        )
        .toFixed(1)
    );

    // 2. Leave Management Metrics for this month
    const approvedPaidLeaveDays = empLeaves
      .filter((l) => l.status === 'approved' && l.leaveType !== 'Unpaid')
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    const approvedUnpaidLeaveDays = empLeaves
      .filter((l) => l.status === 'approved' && l.leaveType === 'Unpaid')
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    const pendingLeaveDays = empLeaves
      .filter((l) => l.status === 'pending')
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    // 3. Combined Paid Days vs Loss-of-Pay (LOP) Calculation
    const unpaidDays = Number(
      Math.min(WORKING_DAYS, approvedUnpaidLeaveDays + absentCount + halfDayCount * 0.5).toFixed(1)
    );
    const paidDays = Number(Math.max(0, WORKING_DAYS - unpaidDays).toFixed(1));
    const payRatio = paidDays / WORKING_DAYS;

    // 4. Prorated Salary Components + Overtime Pay
    const baseFull = emp.salaryBase || 75000;
    const basicSalary = Math.round(baseFull * payRatio);
    const hra = Math.round(basicSalary * 0.4);
    const specialAllowance = Math.round(basicSalary * 0.2);

    const hourlyRate = baseFull / (WORKING_DAYS * 8);
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
    const proratedBaseBonus = Math.round(5000 * payRatio);
    const bonus = proratedBaseBonus + overtimePay;

    const grossEarnings = basicSalary + hra + specialAllowance + bonus;

    // LOP impact compared to full-attendance monthly gross (excluding overtime)
    const fullMonthlyBaseGross =
      baseFull + Math.round(baseFull * 0.4) + Math.round(baseFull * 0.2) + 5000;
    const earnedWithoutOvertime = basicSalary + hra + specialAllowance + proratedBaseBonus;
    const lopAmount = Math.max(0, fullMonthlyBaseGross - earnedWithoutOvertime);

    // 5. Statutory Deductions (PF 12% of earned basic, TDS 10% of gross, Medical ₹1,500)
    const providentFund = Math.round(basicSalary * 0.12);
    const taxDeducted = Math.round(grossEarnings * 0.1);
    const medicalInsurance = paidDays > 0 ? 1500 : 0;
    const deductions = providentFund + taxDeducted + medicalInsurance;
    const netPayable = Math.max(0, grossEarnings - deductions);

    const warnings: string[] = [];
    if (approvedUnpaidLeaveDays > 0) {
      warnings.push(`${approvedUnpaidLeaveDays}d Unpaid Leave (LOP) deducted`);
    }
    if (absentCount > 0 || halfDayCount > 0) {
      warnings.push(`Attendance adjustments: ${absentCount} absent, ${halfDayCount} half-day`);
    }
    if (pendingLeaveDays > 0) {
      warnings.push(`${pendingLeaveDays}d pending leave awaiting manager approval`);
    }

    const acctDigits = stableDigitsFromString(`${emp.id}-${emp.employeeCode || idx}`, 4);
    const panDigits = stableDigitsFromString(`PAN-${emp.id}`, 4);

    return {
      id: getMonthlyPayslipId(tenantId, monthKey, emp.id),
      tenantId,
      payrollCycleId: resolvedCycleId,
      monthKey,
      monthLabel,
      storedAt: new Date().toISOString(),
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode || `EMP-${idx + 101}`,
      department: emp.department || 'Operations',
      designation: emp.title || 'Staff Member',
      bankAccountMasked: `•••• •••• ${acctDigits}`,
      panMasked: `ABCDE${panDigits}F`,
      workingDays: WORKING_DAYS,
      paidDays,
      unpaidDays,
      overtimeHours,
      attendanceLogsCount: presentCount,
      remoteLogsCount: remoteCount,
      approvedPaidLeaveDays,
      approvedUnpaidLeaveDays,
      pendingLeaveDays,
      overtimePay,
      lopAmount,
      basicSalary,
      hra,
      specialAllowance,
      bonus,
      grossEarnings,
      providentFund,
      taxDeducted,
      medicalInsurance,
      totalDeductions: deductions,
      netPayable,
      status: cycleStatus === 'published' ? 'published' : 'reviewed',
      warnings,
      attendanceSummary: {
        presentCount,
        remoteCount,
        halfDayCount,
        absentCount,
        totalHoursWorked,
        overtimePay,
      },
      leaveSummary: {
        approvedPaidLeaveDays,
        approvedUnpaidLeaveDays,
        pendingLeaveDays,
        lopAmount,
      },
    };
  });

  return {
    monthKey,
    monthLabel,
    payslips,
    totals: summarizePayslipTotals(payslips),
  };
}
