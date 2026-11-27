import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Lock, 
  Calendar, 
  Clock, 
  CreditCard, 
  ArrowRight, 
  Filter, 
  Search, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Code2
} from 'lucide-react';
import { ROLE_PERMISSIONS_MATRIX } from '../data/mockData';
import { UserRole } from '../types';

export const SpecificationDocumentView: React.FC = () => {
  const { showToast, setIsBookDemoModalOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'booking_spec' | 'rbac_matrix' | 'workflows' | 'security'>('overview');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [matrixSearch, setMatrixSearch] = useState('');

  const rolesList: Array<{ id: UserRole; name: string; badge: string }> = [
    { id: 'super_admin', name: 'SaaS Super Admin', badge: 'Cloud Ops' },
    { id: 'company_owner', name: 'Company Owner / C-Suite', badge: 'Executive' },
    { id: 'hr_admin', name: 'HR Admin (Full Access)', badge: 'Admin' },
    { id: 'payroll_admin', name: 'Payroll & Finance Admin', badge: 'Finance' },
    { id: 'manager', name: 'Department Manager', badge: 'Team Lead' },
    { id: 'team_lead', name: 'Team Leader', badge: 'Squad' },
    { id: 'employee', name: 'Employee (Self-Service)', badge: 'ESS' },
    { id: 'recruiter', name: 'Talent Recruiter', badge: 'ATS' }
  ];

  const handleDownloadMarkdown = () => {
    const mdContent = `# NattonFlow HR — Software Requirements Specification (SRS) & System Architecture Document
Document Version: 2.4.0 (Enterprise Release)
Status: Approved & Validated
Target Platform: Multi-Tenant Enterprise HRMS with Anti-Dummy Verification & Zero-Trust RBAC

## 1. Executive Summary & Architectural Overview
NattonFlow HR is a unified, multi-tenant Human Resource Management System (HRMS) built for fast-growing companies and mid-market enterprises. It consolidates attendance, leave tracking, automated 8-stage payroll calculation, candidate ATS tracking, and IT asset allocation into a single zero-trust platform.

### Multi-Tenant Isolation
- Cryptographically isolated tenant partitions (tenant_id scoped queries).
- Zero PII leakage between distinct organizational accounts.
- Super Admins manage tenant subscriptions and infrastructure without access to private employee personal identification records.

---

## 2. Client Live Demo Booking & Anti-Dummy Email Verification Workflow

### Problem Statement
Public 'Book a Demo' CTAs frequently suffer from bot spam, temporary throwaway emails (tempmail, 10minutemail), and competitor fake queries that clog sales engineers' calendars.

### End-to-End Workflow Validation Steps:
1. Client Profiles Organization:
   - Full Name, Designation
   - Corporate Work Email (domain inspected in real-time)
   - Company Name, Size (1-20, 21-50, 51-200, 201-1000, 1000+)
   - Current HR software & Modules requested
   - Preferred date, time slot, and timezone
2. Automated Anti-Dummy Intelligence & Lead Scoring:
   - Domain Analysis: Checks against 120+ disposable email domains. Free public providers (gmail, yahoo) receive secondary prioritization.
   - Lead Quality Scoring (0-100): Calculated from corporate domain validity, company headcount size, and modules requested.
3. Genuine Client Verification Gate:
   - System dispatches a 6-digit cryptographic OTP token and verification link.
   - Client enters OTP to confirm genuine corporate identity.
4. Persistent Storage & Meeting Allocation:
   - Request stored permanently in \`nattonflow_demo_bookings\` state and localStorage registry.
   - Automated routing assigns a dedicated Solutions Architect (e.g. Marcus Vance, David Chen, or Elena Rostova).
   - Generates meeting URL and calendar invite download.
   - Appears in Super Admin / HR Admin "Demo Bookings & Leads Registry" with lead qualification score.

---

## 3. Role-Based Access Control (RBAC) Specification & Menus

NattonFlow HR enforces strict Separation of Duties (SoD) across 8 distinct user roles:

1. Super Admin:
   - Modules: SaaS Multi-Tenant Hub, Demo Bookings & Leads, Platform Billing, Privacy Vault, RSD Spec.
   - Permissions: Global provisioning, tenant lifecycle, zero employee salary PII.
2. Company Owner / Executive:
   - Modules: Executive KPI Dashboard, People & Teams, Financial Summary, Org Settings.
   - Scope: Read-level business oversight and high-level expenditure auditing.
3. HR Admin:
   - Modules: Full Workforce Directory, Biometric Attendance, Time Off Approvals, Payroll Engine, Recruitment ATS, Performance Reviews, Asset Allocation, Helpdesk.
   - Permissions: Global administrative CRUD and approvals.
4. Payroll Admin:
   - Modules: 8-Stage Payroll Engine, Bank ACH Batch Generation, Attendance Hours Reconciliation, Expense Reimbursements.
   - Scope: Financial calculations and statutory compliance only.
5. Department Manager:
   - Modules: My Team Members, Team Attendance & Punch Regularizations, Team Leave Approvals, Performance Reviews, Expense Approvals.
   - Scope: Department / Team scoped only. Zero access to company-wide financial Ledgers.
6. Team Lead:
   - Modules: Squad Overview, Daily Attendance Tracking, Squad Leave Calendar, Peer Feedback & OKRs.
   - Scope: Direct sprint squad members only.
7. Employee (Self-Service ESS):
   - Modules: My Employee Portal, Geofenced Web Clock-In/Out, My Leaves, My Digital Payslips, My Goals, My Expense Claims, Assigned IT Assets, Helpdesk.
   - Scope: Strict self-only visibility.
8. Talent Recruiter:
   - Modules: Candidate Pipeline Kanban, Job Openings Board, Candidate Database, Interview Scheduling.
   - Scope: Recruitment pipeline only.

---

## 4. Workflow Validation Rules & Quality Gates

### Biometric & Attendance Punch Engine
- Geofence & IP validation: Checks incoming punch IP against authorized office range.
- Shift Tolerance: 15-minute grace period before marked as 'late'. Half-day triggered for <4.5 working hours.
- Regularization: Requires manager approval for missing punches.

### Multi-Level Leave Approval Engine
- Balance Validation: Validates available leave quotas prior to submission.
- Blackout Dates: Warns if applied dates overlap with mandatory corporate holidays.
- Escalation: Unactioned requests auto-escalate after 48 hours.

### 8-Stage Payroll Cross-Check
- Stage 1: Unapproved attendance punches check.
- Stage 2: Pending leave requests reconciliation.
- Stage 3: Approved expense claims integration.
- Stage 4: Basic salary and HRA computations.
- Stage 5: Statutory deductions (Provident Fund, Tax Slabs, Insurance).
- Stage 6: Anomaly detection (>20% variance warning).
- Stage 7: Administrative sign-off & lock.
- Stage 8: NACHA/ACH direct deposit file generation.

© 2026 NattonFlow HR Systems Inc. All Rights Reserved.`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'NattonFlow_HR_Requirements_Specification_Document.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Requirement Specification Document downloaded as Markdown.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-[#4361EE]" size={22} />
              <span>Requirement Specification Document (RSD / SRS)</span>
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              v2.4.0 Certified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal architectural specifications, genuine client demo verification workflow, role permission matrices, and validation rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer size={14} className="text-slate-500" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-4 py-2 text-xs font-bold bg-[#4361EE] hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export Spec (.md)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'overview', label: '1. Executive Architecture', icon: BookOpen },
          { id: 'booking_spec', label: '2. Client Demo & Anti-Dummy Workflow', icon: Calendar },
          { id: 'rbac_matrix', label: '3. Role Permissions Matrix (RBAC)', icon: Users },
          { id: 'workflows', label: '4. Workflow Validation Steps', icon: CheckCircle2 },
          { id: 'security', label: '5. Zero-Trust Security & Privacy', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'border-[#4361EE] text-[#4361EE] bg-blue-50/50 rounded-t-lg' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE ARCHITECTURE */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-[#4361EE]" />
              <span>1. System Architecture & Multi-Tenant Isolation Model</span>
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              NattonFlow HR is engineered as a highly scalable multi-tenant SaaS application. It unifies workforce operations into a single authoritative core while enforcing strict data segregation between organizations and role personas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Tenant Data Isolation</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Every entity in the database (Users, Attendance, Leaves, Payroll, Candidates) is tagged with a mandatory <code className="text-[#4361EE] font-mono">tenant_id</code> partition key. Cross-tenant leakage is prevented at the query layer.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock size={15} className="text-[#4361EE]" />
                  <span>Zero PII Super Admin Policy</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Platform Super Admins maintain SaaS infrastructure, billing, and tenant instances, but are mathematically prohibited from inspecting customer employee salaries, SSNs, or private appraisals.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers size={15} className="text-purple-600" />
                  <span>Configurable Modular Engine</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Supports Growth, Professional, and Enterprise tiers with modular enablement for biometric hardware syncing, statutory tax rules, and custom ATS workflows.
                </p>
              </div>
            </div>
          </div>

          {/* System Components Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Core Subsystems Architecture</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <p className="font-bold text-slate-800">1. Attendance & Biometrics</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time punch regularizations, geofenced mobile check-ins, biometric API bridge.</p>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <p className="font-bold text-slate-800">2. Automated Payroll Core</p>
                <p className="text-[11px] text-slate-500 mt-0.5">8-stage calculation engine, tax slab deductions, NACHA/ACH batch disbursement export.</p>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <p className="font-bold text-slate-800">3. Talent ATS Pipeline</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Drag-and-drop Kanban candidate screening, job board publisher, offer letter generator.</p>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <p className="font-bold text-slate-800">4. Leads & Demo Registry</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Anti-dummy corporate email filter, 6-digit OTP verification, solutions engineer allocation.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT DEMO & ANTI-DUMMY WORKFLOW SPEC */}
      {activeTab === 'booking_spec' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-[#4361EE]" />
                  <span>2. Client Demo Booking & Anti-Dummy Email Verification Specification</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed functional requirement for capturing client details, filtering spambots, email verification, and persistent storage.
                </p>
              </div>
              <button
                onClick={() => setIsBookDemoModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold bg-[#4361EE] hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Launch Live Demo Modal</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Sequence Diagram / Step Breakdown */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                End-to-End Workflow Validation Steps:
              </h4>

              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#4361EE] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Step 1: Client Profiling Form Submission</p>
                    <p className="text-slate-600 mt-0.5">
                      The prospective client enters their Full Name, Designation, Corporate Work Email, Direct Phone, Company Name, Total Workforce Size (1-20 up to 1000+), Current HRMS, and selects desired demonstration modules.
                    </p>
                    <div className="mt-2 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 font-mono">
                      Data Captured: fullName, workEmail, phone, companyName, companySize, currentHrms, selectedModules[], preferredDate, preferredTimeSlot, timezone
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Step 2: Real-Time Corporate Domain Validation & Lead Scoring</p>
                    <p className="text-slate-600 mt-0.5">
                      The system parses the email domain against a blacklist of 120+ disposable/temporary mail providers (tempmail, 10minutemail, mailinator, etc.). Generic personal emails (gmail, yahoo) trigger a warning recommending an official company domain.
                    </p>
                    <p className="text-slate-600 mt-1">
                      An intelligent <strong>Lead Quality Score (0 - 100)</strong> is calculated:
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                      <li>Base score: 50</li>
                      <li>Verified Corporate Domain: +30 points</li>
                      <li>Company Size bonus: +4 to +15 points based on headcount</li>
                      <li>Multiple modules selected: +2 points per module</li>
                      <li>Disposable / Dummy email: Penalized to 15 points and flagged as <code className="text-rose-600 font-bold">rejected_dummy</code></li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Step 3: Cryptographic 6-Digit Email Verification Gate (Anti-Dummy Filter)</p>
                    <p className="text-slate-600 mt-0.5">
                      To eliminate dummy reservations that waste sales engineer capacity, the platform dispatches a transactional email containing a 6-digit OTP token (<code className="font-mono text-[#4361EE]">e.g. 582914</code>) and direct magic confirmation link.
                    </p>
                    <p className="text-slate-600 mt-1">
                      The client must enter the OTP within the verification modal. In this demo environment, an interactive <strong>"Simulated Corporate Email Inbox"</strong> is provided in the UI so reviewers can inspect the dispatched email and 1-click test token verification.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    4
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Step 4: Persistent Storage & Sales Allocation</p>
                    <p className="text-slate-600 mt-0.5">
                      Where does it go and store? The request is permanently saved to the <code className="font-mono text-slate-800">nattonflow_demo_bookings</code> registry in localStorage and React state.
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                      <li>State transitions from <code className="text-amber-600 font-bold">pending_verification</code> to <code className="text-emerald-600 font-bold">scheduled</code>.</li>
                      <li>Dedicated Solutions Architect assigned based on timezone (e.g. Marcus Vance for EST/PST, David Chen for CET).</li>
                      <li>Video conference room link generated (e.g. <code className="text-[#4361EE] font-mono">https://meet.nattonflow.com/demo-company-xyz</code>).</li>
                      <li>Synchronized with the Super Admin and HR Admin <strong>"Demo Bookings & Leads Registry"</strong> with one-click CSV export.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROLE PERMISSIONS MATRIX (RBAC) */}
      {activeTab === 'rbac_matrix' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-[#4361EE]" />
                <span>3. Specific User Role Permissions (RBAC) Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every role has distinct menu visibility and access boundaries. Filter by role persona to inspect granular privileges.
              </p>
            </div>

            {/* Filter and Role Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedRoleFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    selectedRoleFilter === 'all' 
                      ? 'bg-[#14213D] text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Roles Overview
                </button>
                {rolesList.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleFilter(r.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      selectedRoleFilter === r.id 
                        ? 'bg-[#4361EE] text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-[#F7F9FC]"
                />
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="py-3 px-4">Role Persona</th>
                      <th className="py-3 px-4">Menu / Module</th>
                      <th className="py-3 px-4 text-center">View</th>
                      <th className="py-3 px-4 text-center">Create</th>
                      <th className="py-3 px-4 text-center">Edit</th>
                      <th className="py-3 px-4 text-center">Approve</th>
                      <th className="py-3 px-4 text-center">Delete</th>
                      <th className="py-3 px-4 text-center">Export</th>
                      <th className="py-3 px-4">Access Scope</th>
                      <th className="py-3 px-4">Functional Policy Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {Object.entries(ROLE_PERMISSIONS_MATRIX)
                      .filter(([roleKey]) => selectedRoleFilter === 'all' || selectedRoleFilter === roleKey)
                      .flatMap(([roleKey, perms]) => 
                        perms
                          .filter(p => !matrixSearch || p.module.toLowerCase().includes(matrixSearch.toLowerCase()) || p.description.toLowerCase().includes(matrixSearch.toLowerCase()))
                          .map((perm, idx) => (
                            <tr key={`${roleKey}-${perm.module}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                                  {roleKey.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                                {perm.module}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {perm.canView ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {perm.canCreate ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {perm.canEdit ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {perm.canApprove ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {perm.canDelete ? <span className="text-rose-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {perm.canExport ? <span className="text-blue-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  perm.scope === 'global' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                  perm.scope === 'department_team' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {perm.scope === 'global' ? 'Global Org' : perm.scope === 'department_team' ? 'Team Scoped' : 'Self Only'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {perm.description}
                              </td>
                            </tr>
                          ))
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WORKFLOW VALIDATION STEPS */}
      {activeTab === 'workflows' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#4361EE]" />
              <span>4. Workflow Validation Steps & Quality Gate Specifications</span>
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Every workflow in NattonFlow HR enforces automated checks prior to state transitions. Below are the functional specifications for the 4 primary business engines:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Biometric Attendance */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Clock size={16} className="text-[#4361EE]" />
                  <span>A. Biometric Attendance Punch Validation</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px]">
                  <li><strong>Geofence Verification:</strong> Punch allowed only from authenticated corporate IP or GPS coordinates within 200m radius of registered office.</li>
                  <li><strong>Shift Grace Period:</strong> Punctuality clock allows 15-minute tolerance. 16–60 minutes triggers 'Late' flag. &gt;4.5h elapsed without check-in triggers 'Half-Day'.</li>
                  <li><strong>Punch Correction Workflow:</strong> Employee submits missing punch reason → Manager validates physical badge logs → Approval updates monthly worked hours.</li>
                </ul>
              </div>

              {/* Leave Request Workflow */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Calendar size={16} className="text-emerald-600" />
                  <span>B. Multi-Stage Leave Request Validation</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px]">
                  <li><strong>Quota Verification:</strong> Pre-checks remaining Paid, Sick, or Casual leave balances. Submissions exceeding balance are rejected or converted to Unpaid.</li>
                  <li><strong>Public Holiday Conflict:</strong> Dates matching public holidays are automatically subtracted from requested day count.</li>
                  <li><strong>Two-Tier Escalation:</strong> Leaves &gt;3 days require both direct Manager approval and HR Admin sign-off before calendar lock.</li>
                </ul>
              </div>

              {/* 8-Stage Payroll Engine */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <CreditCard size={16} className="text-purple-600" />
                  <span>C. 8-Stage Automated Payroll Calculation Engine</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px]">
                  <li><strong>Stage 1-3:</strong> Ingests biometric punches, subtracts unpaid leaves, aggregates approved expense claims.</li>
                  <li><strong>Stage 4-5:</strong> Computes Basic, HRA, statutory deductions (Provident Fund 12%, ESI, Tax Slabs).</li>
                  <li><strong>Stage 6-8:</strong> Runs anomaly detection algorithms (flags &gt;20% gross compensation shifts), publishes locked digital payslips, exports NACHA/ACH bank file.</li>
                </ul>
              </div>

              {/* ATS Kanban Pipeline */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Users size={16} className="text-amber-600" />
                  <span>D. Talent Acquisition (ATS) Workflow Gates</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px]">
                  <li><strong>Screening Gate:</strong> Auto-parses resumes for mandatory criteria and years of experience.</li>
                  <li><strong>Interview Scorecards:</strong> Technical round cannot transition to 'Offered' without at least 2 submitted panel scorecards &gt;3.5/5.0.</li>
                  <li><strong>One-Click Onboarding:</strong> Transitioning candidate to 'Hired' automatically generates an Employee record and provisioning checklist.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ZERO-TRUST SECURITY & PRIVACY */}
      {activeTab === 'security' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock size={18} className="text-[#4361EE]" />
              <span>5. Zero-Trust Security, Privacy Vault & Compliance</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                NattonFlow HR is architected to exceed SOC-2 Type II, ISO 27001, and GDPR workforce privacy standards:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Field-Level PII Encryption</h4>
                  <p className="text-[11px] text-slate-500">
                    Sensitive attributes (Tax IDs, Bank Account numbers, Base Salaries, Medical records) are encrypted using AES-256 before persistence. Displayed in UI with dynamic masking (e.g. <code className="font-mono text-slate-800">•••• •••• 4091</code>).
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Immutable Audit Logging</h4>
                  <p className="text-[11px] text-slate-500">
                    Every state-altering API call (compensation edit, tenant provisioning, demo verification, leave override) records Actor IP, Timestamp, and Severity in an append-only security vault.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
