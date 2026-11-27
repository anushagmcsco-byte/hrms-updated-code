import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sliders,
  Landmark,
  ShieldCheck,
  Save,
  Plus,
  CheckCircle2,
  XCircle,
  Download,
  IndianRupee,
  Calculator,
  X,
  FileSpreadsheet,
  CreditCard,
} from 'lucide-react';
import { EmployeeLoan } from '../types';
import { ComputedPayslipItem } from '../utils/payrollCalculator';

const DEFAULT_SALARY_STRUCTURE = {
  basicPct: 50,
  hraPct: 25,
  specialPct: 25,
  pfPct: 12,
  esiEnabled: true,
  esiPct: 0.75,
  esiCeiling: 21000,
  professionalTax: 200,
};

export const SalaryStructurePanel: React.FC = () => {
  const { currentTenant, currentUser, updateTenant, showToast } = useApp();

  const isPayrollAdmin =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'tenant_super_admin' ||
    currentUser.role === 'company_owner' ||
    currentUser.role === 'hr_admin' ||
    currentUser.role === 'payroll_admin';

  const saved = currentTenant.salaryStructure || DEFAULT_SALARY_STRUCTURE;

  const [basicPct, setBasicPct] = useState(saved.basicPct);
  const [hraPct, setHraPct] = useState(saved.hraPct);
  const [specialPct, setSpecialPct] = useState(saved.specialPct);
  const [pfPct, setPfPct] = useState(saved.pfPct);
  const [esiEnabled, setEsiEnabled] = useState(saved.esiEnabled);
  const [esiPct, setEsiPct] = useState(saved.esiPct);
  const [esiCeiling, setEsiCeiling] = useState(saved.esiCeiling);
  const [professionalTax, setProfessionalTax] = useState(saved.professionalTax);
  const [simMonthlyGross, setSimMonthlyGross] = useState(85000);

  useEffect(() => {
    const s = currentTenant.salaryStructure || DEFAULT_SALARY_STRUCTURE;
    setBasicPct(s.basicPct);
    setHraPct(s.hraPct);
    setSpecialPct(s.specialPct);
    setPfPct(s.pfPct);
    setEsiEnabled(s.esiEnabled);
    setEsiPct(s.esiPct);
    setEsiCeiling(s.esiCeiling);
    setProfessionalTax(s.professionalTax);
  }, [currentTenant.id, currentTenant.salaryStructure]);

  const earningsPctSum = Math.round((basicPct + hraPct + specialPct) * 10) / 10;
  const isSumValid = Math.abs(earningsPctSum - 100) < 0.01;

  const simCalc = useMemo(() => {
    const gross = Math.max(0, Number(simMonthlyGross) || 0);
    const basic = Math.round((gross * basicPct) / 100);
    const hra = Math.round((gross * hraPct) / 100);
    const special = Math.max(0, gross - basic - hra);
    const employeePf = Math.round((basic * pfPct) / 100);
    const employerPf = Math.round((basic * pfPct) / 100);
    const esiApplicable = esiEnabled && gross <= esiCeiling;
    const employeeEsi = esiApplicable ? Math.round((gross * esiPct) / 100) : 0;
    const employerEsi = esiApplicable ? Math.round((gross * 3.25) / 100) : 0;
    const pt = gross > 15000 ? professionalTax : 0;
    const estTds = gross > 60000 ? Math.round((gross - 60000) * 0.1) : 0;
    const totalDeductions = employeePf + employeeEsi + pt + estTds;
    const netTakeHome = Math.max(0, gross - totalDeductions);
    const monthlyCtc = gross + employerPf + employerEsi;
    return {
      gross,
      basic,
      hra,
      special,
      employeePf,
      employerPf,
      esiApplicable,
      employeeEsi,
      employerEsi,
      pt,
      estTds,
      totalDeductions,
      netTakeHome,
      monthlyCtc,
      annualCtc: monthlyCtc * 12,
    };
  }, [simMonthlyGross, basicPct, hraPct, pfPct, esiEnabled, esiPct, esiCeiling, professionalTax]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSumValid) {
      showToast('Basic + HRA + Special Allowance must total exactly 100%.');
      return;
    }
    updateTenant(currentTenant.id, {
      salaryStructure: {
        basicPct,
        hraPct,
        specialPct,
        pfPct,
        esiEnabled,
        esiPct,
        esiCeiling,
        professionalTax,
      },
    });
    showToast(`Saved CTC salary structure template for ${currentTenant.name} across all devices.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={handleSave}
        className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders size={16} className="text-[#4361EE]" />
              <span>Flexible CTC &amp; Salary Component Template</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define company-wide earnings split and statutory deduction rules for {currentTenant.name}.
            </p>
          </div>
          <span
            className={`text-xs font-mono font-bold ${
              isSumValid ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            Split: {earningsPctSum}% / 100%
          </span>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Earnings Allocation (% of Monthly Gross)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Basic Pay (%)</label>
              <input
                type="number"
                min={20}
                max={80}
                disabled={!isPayrollAdmin}
                value={basicPct}
                onChange={(e) => setBasicPct(Number(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HRA (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                disabled={!isPayrollAdmin}
                value={hraPct}
                onChange={(e) => setHraPct(Number(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Special Allowance (%)</label>
              <input
                type="number"
                min={0}
                max={60}
                disabled={!isPayrollAdmin}
                value={specialPct}
                onChange={(e) => setSpecialPct(Number(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Statutory &amp; Retiral Configuration (India)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EPF Contribution (% of Basic)
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={20}
                disabled={!isPayrollAdmin}
                value={pfPct}
                onChange={(e) => setPfPct(Number(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Tax (₹ / month)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                disabled={!isPayrollAdmin}
                value={professionalTax}
                onChange={(e) => setProfessionalTax(Number(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ESI Rate (%)
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={5}
                disabled={!isPayrollAdmin || !esiEnabled}
                value={esiPct}
                onChange={(e) => setEsiPct(Number(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE] disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ESI Gross Wage Ceiling (₹)
              </label>
              <input
                type="number"
                min={0}
                disabled={!isPayrollAdmin || !esiEnabled}
                value={esiCeiling}
                onChange={(e) => setEsiCeiling(Number(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE] disabled:bg-slate-50"
              />
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isPayrollAdmin}
              checked={esiEnabled}
              onChange={(e) => setEsiEnabled(e.target.checked)}
              className="rounded border-slate-300 text-[#4361EE]"
            />
            <span>Enable statutory ESI withholding for eligible employees under wage ceiling</span>
          </label>
        </div>

        {isPayrollAdmin && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Changes sync immediately to Cloud Firestore for {currentTenant.name}.
            </span>
            <button
              type="submit"
              disabled={!isSumValid}
              className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>Save Salary Template</span>
            </button>
          </div>
        )}
      </form>

      {/* Live Interactive CTC Simulator */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={16} className="text-[#4361EE]" />
              <span>Live Monthly / Annual CTC Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Preview take-home pay using active template</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Sample Monthly Gross Salary (₹ INR)
          </label>
          <input
            type="number"
            step={5000}
            min={10000}
            value={simMonthlyGross}
            onChange={(e) => setSimMonthlyGross(Number(e.target.value) || 0)}
            className="w-full text-sm font-mono font-bold p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
          />
        </div>

        <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Basic ({basicPct}%)</span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              ₹{simCalc.basic.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">HRA ({hraPct}%)</span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              ₹{simCalc.hra.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">Special Allowance ({specialPct}%)</span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              ₹{simCalc.special.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between text-rose-600">
            <span>Employee EPF ({pfPct}%)</span>
            <span className="font-mono font-semibold tabular-nums">
              -₹{simCalc.employeePf.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Employee ESI ({simCalc.esiApplicable ? `${esiPct}%` : 'Exempt'})</span>
            <span className="font-mono font-semibold tabular-nums">
              -₹{simCalc.employeeEsi.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Professional Tax</span>
            <span className="font-mono font-semibold tabular-nums">
              -₹{simCalc.pt.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-rose-600 pb-2 border-b border-slate-100">
            <span>Estimated TDS</span>
            <span className="font-mono font-semibold tabular-nums">
              -₹{simCalc.estTds.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="font-bold text-slate-900">Estimated Monthly Take-Home</span>
            <span className="text-base font-extrabold font-mono text-emerald-700 tabular-nums">
              ₹{simCalc.netTakeHome.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>Employer PF + ESI Contribution</span>
            <span className="font-mono font-semibold text-slate-700 tabular-nums">
              +₹{(simCalc.employerPf + simCalc.employerEsi).toLocaleString('en-IN')} / mo
            </span>
          </div>
          <div className="flex justify-between items-center bg-[#F7F9FC] p-2.5 rounded-lg border border-slate-200 mt-2">
            <span className="font-bold text-[#14213D]">Total Annual CTC</span>
            <span className="font-mono font-extrabold text-[#4361EE] tabular-nums">
              ₹{simCalc.annualCtc.toLocaleString('en-IN')} / yr
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoansAdvancesPanel: React.FC = () => {
  const {
    employeeLoans,
    requestEmployeeLoan,
    updateLoanStatus,
    recordLoanEmiPayment,
    currentUser,
    currentTenant,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [loanType, setLoanType] = useState<EmployeeLoan['loanType']>('Salary Advance');
  const [principalAmount, setPrincipalAmount] = useState('50000');
  const [tenureMonths, setTenureMonths] = useState('6');
  const [reason, setReason] = useState('');

  const isApprover =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'tenant_super_admin' ||
    currentUser.role === 'company_owner' ||
    currentUser.role === 'hr_admin' ||
    currentUser.role === 'payroll_admin';

  const tenantLoans = employeeLoans.filter(
    (l) => l.tenantId === currentTenant.id && (isApprover || l.employeeId === currentUser.id)
  );

  const activeOutstanding = tenantLoans
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + Math.max(0, l.principalAmount - l.paidEmis * l.monthlyEmi), 0);
  const pendingCount = tenantLoans.filter((l) => l.status === 'pending').length;
  const monthlyEmiRecovery = tenantLoans
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + l.monthlyEmi, 0);

  const previewEmi = useMemo(() => {
    const p = Math.max(0, Number(principalAmount) || 0);
    const t = Math.max(1, Number(tenureMonths) || 1);
    return Math.round(p / t);
  }, [principalAmount, tenureMonths]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(principalAmount);
    const months = Number(tenureMonths);
    if (!amt || amt <= 0 || !months || months <= 0 || !reason.trim()) return;
    requestEmployeeLoan({
      loanType,
      principalAmount: amt,
      tenureMonths: months,
      reason: reason.trim(),
    });
    setShowModal(false);
    setReason('');
    setPrincipalAmount('50000');
    setTenureMonths('6');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Landmark size={16} className="text-[#4361EE]" />
            <span>Employee Loans &amp; Salary Advances</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track interest-free salary advances, emergency loans, and automated monthly EMI payroll recoveries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Request Loan / Advance</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Active Outstanding Principal
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            ₹{activeOutstanding.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Monthly EMI Payroll Recovery
          </p>
          <p className="text-xl font-bold text-[#4361EE] mt-1 font-mono tabular-nums">
            ₹{monthlyEmiRecovery.toLocaleString('en-IN')} / mo
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Pending Approvals
          </p>
          <p className="text-xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Facility &amp; Reason</th>
                <th className="py-3 px-4">Principal (₹)</th>
                <th className="py-3 px-4">Monthly EMI</th>
                <th className="py-3 px-4">Repayment Progress</th>
                <th className="py-3 px-4">Status</th>
                {isApprover && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenantLoans.length === 0 ? (
                <tr>
                  <td colSpan={isApprover ? 7 : 6} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">
                      No loan or salary advance applications for {currentTenant.name}.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Request Loan / Advance" above to submit an advance with automatic EMI scheduling.
                    </p>
                  </td>
                </tr>
              ) : (
                tenantLoans.map((loan) => {
                  const pct = Math.min(100, Math.round((loan.paidEmis / Math.max(1, loan.tenureMonths)) * 100));
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{loan.employeeName}</p>
                        <p className="text-[11px] text-slate-500">{loan.department}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{loan.loanType}</p>
                        <p className="text-[11px] text-slate-500 max-w-xs truncate" title={loan.reason}>
                          {loan.reason}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        ₹{loan.principalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">
                        ₹{loan.monthlyEmi.toLocaleString('en-IN')} × {loan.tenureMonths}m
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                          <span>
                            {loan.paidEmis}/{loan.tenureMonths} EMIs
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loan.status === 'repaid' ? 'bg-emerald-500' : 'bg-[#4361EE]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            loan.status === 'repaid'
                              ? 'text-emerald-700'
                              : loan.status === 'approved'
                              ? 'text-[#4361EE]'
                              : loan.status === 'rejected'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      {isApprover && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {loan.status === 'pending' && (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateLoanStatus(loan.id, 'approved')}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => updateLoanStatus(loan.id, 'rejected')}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {loan.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => recordLoanEmiPayment(loan.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#4361EE] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer"
                            >
                              Record EMI (+1)
                            </button>
                          )}
                          {(loan.status === 'repaid' || loan.status === 'rejected') && (
                            <span className="text-[11px] text-slate-400">Closed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Request Loan or Salary Advance</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loan / Advance Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as EmployeeLoan['loanType'])}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                <option value="Salary Advance">Salary Advance</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Home / Relocation">Home / Relocation</option>
                <option value="Education">Education &amp; Upskilling</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={5000}
                  step={1000}
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Repayment Tenure (Months)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={36}
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="bg-[#F7F9FC] p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Calculated Monthly EMI Deduction</span>
              <span className="font-mono font-extrabold text-[#4361EE] tabular-nums">
                ₹{previewEmi.toLocaleString('en-IN')} / mo
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Justification *</label>
              <textarea
                required
                rows={3}
                placeholder="Provide brief reason for finance approval..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

interface StatutoryCompliancePanelProps {
  monthLabel: string;
  monthKey: string;
  payslips: ComputedPayslipItem[];
}

export const StatutoryCompliancePanel: React.FC<StatutoryCompliancePanelProps> = ({
  monthLabel,
  monthKey,
  payslips,
}) => {
  const { currentTenant, showToast } = useApp();
  const structure = currentTenant.salaryStructure || DEFAULT_SALARY_STRUCTURE;

  const rows = useMemo(() => {
    return payslips.map((slip) => {
      const empPf = slip.providentFund;
      const employerPf = Math.round((slip.basicSalary * structure.pfPct) / 100);
      const esiEligible = structure.esiEnabled && slip.grossEarnings <= structure.esiCeiling;
      const empEsi = esiEligible ? Math.round((slip.grossEarnings * structure.esiPct) / 100) : 0;
      const employerEsi = esiEligible ? Math.round((slip.grossEarnings * 3.25) / 100) : 0;
      const pt = slip.grossEarnings > 15000 ? structure.professionalTax : 0;
      const tds = slip.taxDeducted;
      return {
        slip,
        empPf,
        employerPf,
        esiEligible,
        empEsi,
        employerEsi,
        pt,
        tds,
        totalLiability: empPf + employerPf + empEsi + employerEsi + pt + tds,
      };
    });
  }, [payslips, structure]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        empPf: acc.empPf + r.empPf,
        employerPf: acc.employerPf + r.employerPf,
        empEsi: acc.empEsi + r.empEsi,
        employerEsi: acc.employerEsi + r.employerEsi,
        pt: acc.pt + r.pt,
        tds: acc.tds + r.tds,
        totalLiability: acc.totalLiability + r.totalLiability,
      }),
      { empPf: 0, employerPf: 0, empEsi: 0, employerEsi: 0, pt: 0, tds: 0, totalLiability: 0 }
    );
  }, [rows]);

  const handleDownloadCsv = () => {
    const header =
      'Month,Employee,Code,PAN,GrossINR,BasicINR,EmployeePF,EmployerPF,EmployeeESI,EmployerESI,ProfTax,TDS,TotalStatutoryLiability\n';
    const body = rows
      .map(
        (r) =>
          `"${monthLabel}","${r.slip.employeeName}","${r.slip.employeeCode}","${r.slip.panMasked}",${r.slip.grossEarnings},${r.slip.basicSalary},${r.empPf},${r.employerPf},${r.empEsi},${r.employerEsi},${r.pt},${r.tds},${r.totalLiability}`
      )
      .join('\n');
    const footer = `\n"${monthLabel}","TOTAL STATUTORY CHALLAN","${rows.length} Staff","","","",${totals.empPf},${totals.employerPf},${totals.empEsi},${totals.employerEsi},${totals.pt},${totals.tds},${totals.totalLiability}`;
    const blob = new Blob([header + body + footer], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Statutory_PF_ESI_TDS_${monthKey}_${currentTenant.slug || currentTenant.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${monthLabel} Statutory PF/ESI/TDS Compliance Register CSV.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#4361EE]" />
            <span>Statutory Compliance Register (EPF, ESI, PT &amp; TDS) — {monthLabel}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Challan-ready statutory filings derived directly from {monthLabel} processed payslips.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="px-3.5 py-2 text-xs font-bold text-white bg-[#14213D] hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet size={14} />
          <span>Export Statutory Challan CSV</span>
        </button>
      </div>

      {/* Statutory Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Total EPF Challan (EE + ER)</p>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
            ₹{(totals.empPf + totals.employerPf).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            EE: ₹{totals.empPf.toLocaleString('en-IN')} · ER: ₹{totals.employerPf.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Total ESI Contribution</p>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
            ₹{(totals.empEsi + totals.employerEsi).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Ceiling ≤ ₹{structure.esiCeiling.toLocaleString('en-IN')} gross
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-slate-400 font-semibold uppercase text-[10px]">TDS + Professional Tax</p>
          <p className="text-lg font-bold text-rose-600 font-mono tabular-nums mt-1">
            ₹{(totals.tds + totals.pt).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            TDS: ₹{totals.tds.toLocaleString('en-IN')} · PT: ₹{totals.pt.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200">
          <p className="text-[#4361EE] font-bold uppercase text-[10px]">Total Statutory Remittance</p>
          <p className="text-lg font-extrabold text-[#14213D] font-mono tabular-nums mt-1">
            ₹{totals.totalLiability.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">Due 15th of following month</p>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee &amp; PAN</th>
                <th className="py-3 px-4">Gross (₹)</th>
                <th className="py-3 px-4">EPF (EE / ER)</th>
                <th className="py-3 px-4">ESI (EE / ER)</th>
                <th className="py-3 px-4">Prof. Tax</th>
                <th className="py-3 px-4">TDS (Sec 192)</th>
                <th className="py-3 px-4 text-right">Total Liability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No payslips available for statutory calculation in {monthLabel}.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.slip.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{r.slip.employeeName}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {r.slip.employeeCode} · PAN {r.slip.panMasked}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      ₹{r.slip.grossEarnings.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      ₹{r.empPf.toLocaleString('en-IN')} / ₹{r.employerPf.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {r.esiEligible
                        ? `₹${r.empEsi.toLocaleString('en-IN')} / ₹${r.employerEsi.toLocaleString('en-IN')}`
                        : 'Exempt'}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      ₹{r.pt.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-rose-600">
                      ₹{r.tds.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ₹{r.totalLiability.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
