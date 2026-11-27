import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Printer,
  Lock,
  Server,
  Globe,
  Clock,
  Mail,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Scale,
  Building2,
} from 'lucide-react';

export type PublicPortalPage = 'home' | 'security_privacy' | 'terms';

interface PublicLegalPagesProps {
  activePage: 'security_privacy' | 'terms';
  onSwitchPage: (page: PublicPortalPage) => void;
  onRequestSecurityReview: () => void;
  onEnterWorkspace: () => void;
}

interface TocItem {
  id: string;
  number: string;
  title: string;
}

const SECURITY_TOC: TocItem[] = [
  { id: 'sec-architecture', number: '01', title: 'Multi-Tenant Architecture & Isolation' },
  { id: 'sec-encryption', number: '02', title: 'Encryption & Access Controls' },
  { id: 'sec-privacy', number: '03', title: 'Privacy Policy & Data Collected' },
  { id: 'sec-subprocessors', number: '04', title: 'Data Usage & Sub-Processors' },
  { id: 'sec-compliance', number: '05', title: 'Compliance & Data Subject Rights' },
  { id: 'sec-retention', number: '06', title: 'Retention, Deletion & Breach SLA' },
  { id: 'sec-contact', number: '07', title: 'Security Contact & Disclosure' },
];

const TERMS_TOC: TocItem[] = [
  { id: 'tos-scope', number: '01', title: 'Acceptance & Scope of Services' },
  { id: 'tos-accounts', number: '02', title: 'Workspaces & Role Governance' },
  { id: 'tos-billing', number: '03', title: 'Free Trial, Plans & INR Billing' },
  { id: 'tos-ownership', number: '04', title: 'Customer Data Ownership' },
  { id: 'tos-aup', number: '05', title: 'Acceptable Use & Geofencing' },
  { id: 'tos-statutory', number: '06', title: 'Payroll & Statutory Compliance' },
  { id: 'tos-ip', number: '07', title: 'Intellectual Property Rights' },
  { id: 'tos-sla', number: '08', title: 'Availability SLA & Maintenance' },
  { id: 'tos-liability', number: '09', title: 'Confidentiality & Liability' },
  { id: 'tos-governing', number: '10', title: 'Termination & Governing Law' },
];

export const PublicLegalPages: React.FC<PublicLegalPagesProps> = ({
  activePage,
  onSwitchPage,
  onRequestSecurityReview,
  onEnterWorkspace,
}) => {
  const tocItems = activePage === 'security_privacy' ? SECURITY_TOC : TERMS_TOC;
  const [activeSectionId, setActiveSectionId] = useState<string>(tocItems[0].id);

  useEffect(() => {
    setActiveSectionId(activePage === 'security_privacy' ? SECURITY_TOC[0].id : TERMS_TOC[0].id);
  }, [activePage]);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -96;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F7F9FC] text-[#172033]">
      {/* Top Sub-Header Utility Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSwitchPage('home')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#4361EE] transition-colors cursor-pointer self-start"
          >
            <ArrowLeft size={15} />
            <span>Back to Public SaaS Portal</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Segmented Document Switcher */}
            <div
              role="tablist"
              aria-label="Legal & Trust Documents"
              className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activePage === 'security_privacy'}
                onClick={() => onSwitchPage('security_privacy')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activePage === 'security_privacy'
                    ? 'bg-white text-[#14213D] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck size={14} className={activePage === 'security_privacy' ? 'text-[#4361EE]' : 'text-slate-400'} />
                <span>Security &amp; Privacy</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePage === 'terms'}
                onClick={() => onSwitchPage('terms')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activePage === 'terms'
                    ? 'bg-white text-[#14213D] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale size={14} className={activePage === 'terms' ? 'text-[#4361EE]' : 'text-slate-400'} />
                <span>Terms of Service</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#14213D] bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap print:hidden"
            >
              <Printer size={14} className="text-slate-500" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Document Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {activePage === 'security_privacy' ? (
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4361EE]">
                Trust Center &amp; Legal Documentation
              </p>
              <h1 className="text-3xl sm:text-5xl font-black text-[#14213D] tracking-tight mt-3 leading-tight">
                Security &amp; Privacy
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
                How NattonFlow HR Technologies Pvt Ltd isolates multi-tenant company workspaces, encrypts employee payroll and KYC records, governs geofenced attendance coordinates, and protects personal data under India&apos;s DPDP Act 2023 and GDPR.
              </p>
              <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium">
                <span>Effective: November 1, 2026</span>
                <span aria-hidden="true">·</span>
                <span>Last Updated: November 23, 2026</span>
                <span aria-hidden="true">·</span>
                <span>Scope: NattonFlow Cloud HRMS, Payroll &amp; Mobile ESS</span>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4361EE]">
                Master SaaS Subscription Agreement
              </p>
              <h1 className="text-3xl sm:text-5xl font-black text-[#14213D] tracking-tight mt-3 leading-tight">
                Terms of Service
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
                These Terms of Service govern access to and use of the NattonFlow HR cloud platform, APIs, and mobile employee self-service applications provided by NattonFlow HR Technologies Pvt Ltd to subscribing organizations and authorized users.
              </p>
              <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium">
                <span>Effective: November 1, 2026</span>
                <span aria-hidden="true">·</span>
                <span>Version 2.4</span>
                <span aria-hidden="true">·</span>
                <span>Jurisdiction: Bengaluru, Karnataka, India</span>
              </div>
            </div>
          )}

          {/* Enterprise Trust Summary Strip (Security & Privacy only) */}
          {activePage === 'security_privacy' && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl bg-[#F7F9FC] divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-2 text-[#14213D]">
                  <Lock size={16} className="text-[#4361EE]" />
                  <span className="text-sm font-bold tabular-nums">AES-256 &amp; TLS 1.3</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  End-to-end transport encryption and encrypted storage for salaries, PAN, and bank details.
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[#14213D]">
                  <Server size={16} className="text-[#4361EE]" />
                  <span className="text-sm font-bold">Strict Tenant Isolation</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Logical company boundaries keep every client workspace strictly partitioned across devices.
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[#14213D]">
                  <Globe size={16} className="text-[#4361EE]" />
                  <span className="text-sm font-bold">DPDP 2023 &amp; GDPR</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Aligned with SOC 2 Type II and ISO/IEC 27001 controls with explicit consent governance.
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[#14213D]">
                  <Clock size={16} className="text-[#4361EE]" />
                  <span className="text-sm font-bold tabular-nums">99.95% Uptime SLA</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Automated daily backups, real-time cloud sync, and a 72-hour breach disclosure commitment.
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Jump-To Section Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 sm:px-6 py-3 print:hidden">
        <label htmlFor="legal-section-jump" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Jump to Section
        </label>
        <select
          id="legal-section-jump"
          value={activeSectionId}
          onChange={(e) => scrollToSection(e.target.value)}
          className="w-full text-xs font-semibold text-[#14213D] bg-[#F7F9FC] border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4361EE]"
        >
          {tocItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.number}. {item.title}
            </option>
          ))}
        </select>
      </div>

      {/* Main Two-Column Legal Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
          {/* Left Sticky Table of Contents */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start print:hidden">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              On This Page
            </p>
            <nav aria-label="Document sections" className="space-y-1 border-l border-slate-200 pl-3">
              {tocItems.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-baseline gap-2 cursor-pointer ${
                      isActive
                        ? 'text-[#4361EE] font-bold bg-blue-50/70'
                        : 'text-slate-600 hover:text-[#14213D] hover:bg-slate-100/70 font-medium'
                    }`}
                  >
                    <span className="tabular-nums text-[11px] text-slate-400 shrink-0">{item.number}.</span>
                    <span className="leading-snug">{item.title}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
              <p className="text-xs font-bold text-[#14213D]">Need vendor security review?</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Request our SOC 2 Type II bridge letter, DPA, or architecture walkthrough for enterprise procurement.
              </p>
              <button
                type="button"
                onClick={onRequestSecurityReview}
                className="w-full px-3.5 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Request Security Review
              </button>
            </div>
          </aside>

          {/* Right Editorial Document Column */}
          <article className="flex-1 min-w-0 max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs">
            {activePage === 'security_privacy' ? (
              <div className="space-y-10 text-[15px] leading-relaxed text-slate-700">
                {/* 01 */}
                <section id="sec-architecture" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    01. Multi-Tenant Architecture &amp; Data Isolation
                  </h2>
                  <p>
                    NattonFlow HR is engineered from the ground up as a multi-tenant cloud HRMS where every subscribing organization operates inside a dedicated logical tenant boundary (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[#14213D]">companyId</code>). All workforce directories, payroll runs, attendance records, leave balances, candidate pipelines, OKRs, and asset ledgers are scoped strictly to their owning tenant.
                  </p>
                  <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#4361EE] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#14213D]">Strict Cross-Tenant Partitioning:</strong> API queries, dashboard aggregations, and real-time multi-device sync streams enforce tenant scoping so one company can never read, infer, or mutate another company&apos;s data.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#4361EE] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#14213D]">Zero-PII Platform Owner Boundary:</strong> Platform Super Admins oversee tenant provisioning, subscription billing, and system health without viewing private employee compensation, personal identity numbers, or confidential HR notes unless explicitly authorized through a logged support session.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#4361EE] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#14213D]">Dedicated Enterprise Partitions:</strong> Organizations on the Enterprise Cloud plan may opt for isolated database partitions and custom regional data residency in India (Mumbai / Delhi cloud regions).
                      </span>
                    </li>
                  </ul>
                </section>

                <hr className="border-slate-200" />

                {/* 02 */}
                <section id="sec-encryption" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    02. Encryption, Infrastructure &amp; Access Controls
                  </h2>
                  <p>
                    We apply defense-in-depth protections across network transport, persistent storage, and role-based application access:
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F7F9FC]">
                      <h3 className="font-bold text-[#14213D]">Encryption in Transit &amp; at Rest</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        All browser, mobile ESS, and API communications require HTTPS with TLS 1.3. Database storage, payslip PDFs, and cloud backups are encrypted at rest using AES-256 managed keys.
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F7F9FC]">
                      <h3 className="font-bold text-[#14213D]">Role-Based Access Control (RBAC)</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Granular permissions separate Super Admins, Company Admins, HR Managers, Team Managers, and Employees. Employees can only access their own payslips, attendance, and leave requests.
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F7F9FC]">
                      <h3 className="font-bold text-[#14213D]">Authentication &amp; SSO</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Supports verified corporate credentials, multi-factor authentication (MFA), automatic idle session expiration, and SAML 2.0 / Okta / Microsoft Entra ID SSO on Enterprise Cloud.
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F7F9FC]">
                      <h3 className="font-bold text-[#14213D]">Immutable Audit Trail</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Every payroll disbursement, salary revision, role change, employee offboarding, and geofence override records an immutable audit event with actor ID, timestamp, and company context.
                      </p>
                    </div>
                  </div>
                </section>

                <hr className="border-slate-200" />

                {/* 03 */}
                <section id="sec-privacy" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    03. Privacy Policy &amp; Categories of Data Collected
                  </h2>
                  <p>
                    NattonFlow HR acts as a <strong className="text-[#14213D]">Data Processor</strong> (or Data Fiduciary processor under India&apos;s DPDP Act) on behalf of our subscribing corporate customers, who determine the legal basis for collecting workforce information. We process only the minimum data necessary to operate HRMS workflows:
                  </p>
                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <h3 className="font-bold text-[#14213D]">Organization &amp; Billing Metadata</h3>
                      <p className="text-slate-600 mt-1">
                        Company legal name, GSTIN, registered office address, authorized administrator contact details, subscription tier, and invoice history.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#14213D]">Employee Directory, Payroll &amp; Statutory Records</h3>
                      <p className="text-slate-600 mt-1">
                        Full name, corporate email, employee code, department, reporting manager, salary structure, bank account details for NEFT/IMPS disbursement, and Indian statutory identifiers (PAN, PF UAN, ESIC, Professional Tax state) solely for 8-stage payroll calculation and payslip generation.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#14213D] flex items-center gap-1.5">
                        <MapPin size={15} className="text-[#4361EE]" />
                        <span>Geofenced Attendance &amp; Remote Check-In Privacy</span>
                      </h3>
                      <p className="text-slate-600 mt-1">
                        When an employer enables office premises geofencing or Remote / Outside Check-In verification, the browser or mobile app requests device GPS coordinates <strong className="text-[#14213D]">exclusively at the moment an employee clicks Punch In or Punch Out</strong>. NattonFlow never conducts continuous background GPS tracking, never collects location outside active punch verification, and stores only the verified punch timestamp, work mode, and premises match status.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#14213D]">Recruitment, Performance &amp; Operational Records</h3>
                      <p className="text-slate-600 mt-1">
                        Candidate profiles uploaded to the ATS pipeline, employee OKRs and performance appraisals, expense receipts, IT hardware asset assignments, and internal helpdesk tickets.
                      </p>
                    </div>
                  </div>
                </section>

                <hr className="border-slate-200" />

                {/* 04 */}
                <section id="sec-subprocessors" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    04. Data Usage, Sub-Processors &amp; Zero-Sale Guarantee
                  </h2>
                  <p>
                    We process customer and employee data solely to deliver, secure, synchronize, and support the NattonFlow HR platform. <strong className="text-[#14213D]">We never sell, rent, or broker employee personal data</strong>, and we never use private HR or payroll records to train external advertising or third-party commercial models.
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    To operate reliable multi-device sync and enterprise communications, NattonFlow relies on vetted infrastructure sub-processors bound by strict Data Processing Addendums (DPAs):
                  </p>
                  <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F7F9FC] border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 font-bold">Sub-Processor</th>
                          <th className="py-3 px-4 font-bold">Purpose</th>
                          <th className="py-3 px-4 font-bold">Region / Safeguard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#14213D]">Google Cloud / Firebase Firestore</td>
                          <td className="py-3 px-4">Encrypted real-time database, cloud sync &amp; authentication</td>
                          <td className="py-3 px-4">ISO 27001 / SOC 2 Type II</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#14213D]">Transactional SMTP Relay</td>
                          <td className="py-3 px-4">Payslip dispatch, onboarding credentials &amp; demo alerts</td>
                          <td className="py-3 px-4">TLS 1.3 enforced delivery</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#14213D]">Indian GST &amp; Payment Partners</td>
                          <td className="py-3 px-4">INR subscription billing &amp; GST-compliant invoicing</td>
                          <td className="py-3 px-4">PCI-DSS Level 1 / RBI compliant</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <hr className="border-slate-200" />

                {/* 05 */}
                <section id="sec-compliance" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    05. Compliance Frameworks &amp; Data Subject Rights
                  </h2>
                  <p>
                    NattonFlow&apos;s privacy and security controls are structured to support organizations complying with the <strong className="text-[#14213D]">Digital Personal Data Protection (DPDP) Act, 2023 (India)</strong>, the <strong className="text-[#14213D]">EU General Data Protection Regulation (GDPR)</strong>, <strong className="text-[#14213D]">SOC 2 Type II</strong>, and <strong className="text-[#14213D]">ISO/IEC 27001</strong>.
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    Authorized employees and Company Administrators can exercise the following rights through their HR Administrator or directly via our Data Protection Officer:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
                    <li><strong className="text-[#14213D]">Right of Access &amp; Portability:</strong> Inspect personal HR records and export structured CSV/PDF copies of payslips, attendance logs, and leave statements.</li>
                    <li><strong className="text-[#14213D]">Right to Correction:</strong> Update inaccurate contact, KYC, or banking details through self-service requests approved by HR.</li>
                    <li><strong className="text-[#14213D]">Right to Erasure:</strong> Request permanent deletion of non-statutory personal data once employment or statutory payroll retention windows expire.</li>
                    <li><strong className="text-[#14213D]">Consent Withdrawal:</strong> Decline browser location permissions at any time (subject to employer attendance regularization policies).</li>
                  </ul>
                </section>

                <hr className="border-slate-200" />

                {/* 06 */}
                <section id="sec-retention" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    06. Data Retention, Permanent Deletion &amp; Breach Notification
                  </h2>
                  <p>
                    Customer data is retained for the active duration of the organization&apos;s subscription and as required by applicable Indian labor, tax, and provident fund regulations. When an authorized Company Administrator deletes a record (such as an employee profile, recruitment candidate, OKR, asset, or organization), NattonFlow propagates permanent removal across our synchronized cloud storage so deleted entries are never silently re-imported from cached devices.
                  </p>
                  <p className="mt-3">
                    Upon written contract termination, customers receive a <strong className="text-[#14213D]">30-day data export window</strong>, after which all tenant records are cryptographically purged from active production systems and rotated out of encrypted backups within 60 days.
                  </p>
                  <p className="mt-3">
                    <strong className="text-[#14213D]">Security Incident &amp; Breach Notification SLA:</strong> In the event of a confirmed unauthorized disclosure affecting customer personal data, NattonFlow will notify affected Company Administrators without undue delay and within <strong className="text-[#14213D]">72 hours</strong>, detailing impact scope, containment actions, and remediation steps.
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 07 */}
                <section id="sec-contact" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    07. Security Contact &amp; Responsible Disclosure
                  </h2>
                  <p className="text-sm text-slate-600">
                    For security questionnaires, Data Processing Addendums (DPAs), privacy requests, or responsible vulnerability reports, reach our dedicated Security &amp; Privacy Office:
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="border border-slate-200 rounded-xl p-4">
                      <p className="font-bold text-[#14213D] flex items-center gap-1.5">
                        <Mail size={14} className="text-[#4361EE]" />
                        <span>Security &amp; Vulnerability Reports</span>
                      </p>
                      <p className="font-mono text-[#4361EE] mt-1.5">security@nattonflow.com</p>
                      <p className="text-slate-500 mt-1">Initial acknowledgment within 24 hours.</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4">
                      <p className="font-bold text-[#14213D] flex items-center gap-1.5">
                        <Building2 size={14} className="text-[#4361EE]" />
                        <span>Data Protection Officer (DPO)</span>
                      </p>
                      <p className="font-mono text-[#4361EE] mt-1.5">dpo@nattonflow.com</p>
                      <p className="text-slate-500 mt-1">NattonFlow HR Technologies Pvt Ltd, Bengaluru, India.</p>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* TERMS OF SERVICE CONTENT */
              <div className="space-y-10 text-[15px] leading-relaxed text-slate-700">
                {/* 01 */}
                <section id="tos-scope" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    01. Acceptance &amp; Scope of Services
                  </h2>
                  <p>
                    These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between <strong className="text-[#14213D]">NattonFlow HR Technologies Pvt Ltd</strong> (&ldquo;NattonFlow&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) and the business entity or authorized administrator (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;) accessing or subscribing to the NattonFlow Cloud HRMS platform, Public SaaS Portal, APIs, and Mobile Employee Self-Service (&ldquo;Services&rdquo;).
                  </p>
                  <p className="mt-3">
                    By provisioning a workspace, initiating a 14-day free trial, or clicking through an order confirmation, you represent that you have the authority to bind your organization to these Terms and our{' '}
                    <button
                      type="button"
                      onClick={() => onSwitchPage('security_privacy')}
                      className="text-[#4361EE] font-semibold hover:underline cursor-pointer"
                    >
                      Security &amp; Privacy Policy
                    </button>
                    .
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 02 */}
                <section id="tos-accounts" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    02. Accounts, Multi-Tenant Workspaces &amp; Role Governance
                  </h2>
                  <p>
                    Each subscribing organization receives a logically isolated tenant workspace. Customer is responsible for:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
                    <li>Designating authorized Company Administrators and HR Managers and reviewing role assignments regularly.</li>
                    <li>Maintaining the confidentiality of corporate login credentials, SSO configurations, and seat access across employees.</li>
                    <li>Ensuring the accuracy and legality of all employee profiles, salary structures, office geofence coordinates, and statutory identifiers entered into the workspace.</li>
                    <li>Promptly revoking access for departed personnel and notifying <span className="font-mono text-xs text-[#14213D]">security@nattonflow.com</span> upon suspecting unauthorized account activity.</li>
                  </ul>
                </section>

                <hr className="border-slate-200" />

                {/* 03 */}
                <section id="tos-billing" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    03. 14-Day Free Trial, Subscriptions &amp; INR Billing
                  </h2>
                  <p>
                    New corporate workspaces include a 14-day free trial with no credit card required upfront. Continued access after the trial converts to a paid subscription billed in Indian Rupees (<strong className="text-[#14213D]">₹ INR</strong>) based on active employee seats and selected billing cycle:
                  </p>
                  <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F7F9FC] border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 font-bold">Plan Tier</th>
                          <th className="py-3 px-4 font-bold">Annual Rate</th>
                          <th className="py-3 px-4 font-bold">Monthly Rate</th>
                          <th className="py-3 px-4 font-bold">Seat Scope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700 tabular-nums">
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#14213D]">Growth Plan</td>
                          <td className="py-3 px-4">₹199 / emp / mo</td>
                          <td className="py-3 px-4">₹249 / emp / mo</td>
                          <td className="py-3 px-4">Up to 50 employees</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#14213D]">Professional Plan</td>
                          <td className="py-3 px-4">₹479 / emp / mo</td>
                          <td className="py-3 px-4">₹599 / emp / mo</td>
                          <td className="py-3 px-4">Up to 250 employees</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#14213D]">Enterprise Cloud</td>
                          <td className="py-3 px-4">₹999 / emp / mo</td>
                          <td className="py-3 px-4">₹1,299 / emp / mo</td>
                          <td className="py-3 px-4">Custom slabs (500+ seats)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    All published INR rates exclude applicable Goods and Services Tax (<strong className="text-[#14213D]">18% GST</strong>). Tax-compliant GST invoices are issued automatically per billing cycle. Subscriptions renew automatically unless cancelled by a Company Administrator at least 7 days before the renewal date. Fees paid for an active billing cycle are non-refundable except where required by law or under an Enterprise SLA credit.
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 04 */}
                <section id="tos-ownership" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    04. Customer Data Ownership &amp; Portability
                  </h2>
                  <p>
                    Customer retains all right, title, and interest in and to all employee data, payroll registers, attendance records, documents, and organizational configurations uploaded to or generated within its workspace (&ldquo;Customer Data&rdquo;). Customer grants NattonFlow a limited, non-exclusive license solely to host, synchronize, process, and transmit Customer Data as necessary to provide the Services and fulfill Customer&apos;s instructions.
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 05 */}
                <section id="tos-aup" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    05. Acceptable Use &amp; Geofenced Attendance Policy
                  </h2>
                  <p>
                    Customer and its authorized users agree not to misuse the Services. Specifically, you must not:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
                    <li>Attempt to bypass tenant isolation boundaries, probe or scan platform infrastructure without written authorization, or reverse engineer source code.</li>
                    <li>Upload unlawful, infringing, or malicious payloads, or use automated scraping against the portal or APIs outside documented rate limits.</li>
                    <li>Enable office geofencing or remote GPS punch verification without providing clear internal notice to employees in compliance with workplace privacy laws.</li>
                  </ul>
                </section>

                <hr className="border-slate-200" />

                {/* 06 */}
                <section id="tos-statutory" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    06. Payroll &amp; Statutory Compliance Responsibility
                  </h2>
                  <p>
                    NattonFlow&apos;s 8-stage payroll engine automates salary computation, Provident Fund (PF), Employees&apos; State Insurance (ESI), Professional Tax (PT), and Income Tax TDS slab estimates based on published Indian statutory rules and Customer-configured parameters. However, NattonFlow is a software platform and does not provide legal, tax, or chartered accountancy advice. Customer remains the sole employer of record responsible for reviewing final payroll registers, approving bank payouts, and remitting statutory filings on time.
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 07 */}
                <section id="tos-ip" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    07. Intellectual Property Rights
                  </h2>
                  <p>
                    All software, visual design systems, payroll validation workflows, documentation, trademarks, and the &ldquo;NattonFlow HR&rdquo; brand remain the exclusive intellectual property of NattonFlow HR Technologies Pvt Ltd and its licensors. No license or ownership rights are transferred except the limited right to use the Services during an active subscription term.
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 08 */}
                <section id="tos-sla" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    08. Service Availability (SLA) &amp; Scheduled Maintenance
                  </h2>
                  <p>
                    NattonFlow targets <strong className="text-[#14213D] tabular-nums">99.95% monthly uptime</strong> for production workspaces on paid plans, excluding scheduled maintenance windows announced at least 48 hours in advance and force majeure events. Enterprise Cloud customers with executed Master Service Agreements are eligible for pro-rated service credits if verified monthly availability falls below the committed SLA threshold.
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 09 */}
                <section id="tos-liability" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    09. Confidentiality, Warranties &amp; Limitation of Liability
                  </h2>
                  <p>
                    Both parties agree to protect each other&apos;s non-public business, technical, and financial information with at least reasonable care and to use such Confidential Information strictly to perform obligations under these Terms.
                  </p>
                  <p className="mt-3">
                    Except as expressly stated herein, the Services are provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the maximum extent permitted by applicable law, neither party shall be liable for indirect, incidental, special, or consequential damages, and NattonFlow&apos;s total aggregate liability arising out of or relating to these Terms shall not exceed the total subscription fees actually paid by Customer to NattonFlow during the twelve (12) months immediately preceding the claim.
                  </p>
                </section>

                <hr className="border-slate-200" />

                {/* 10 */}
                <section id="tos-governing" className="scroll-mt-24">
                  <h2 className="text-xl font-extrabold text-[#14213D] tracking-tight mb-3">
                    10. Term, Termination, Governing Law &amp; Notices
                  </h2>
                  <p>
                    Either party may terminate a subscription for uncured material breach upon 30 days&apos; written notice. Following termination, Customer retains read/export access to download Customer Data for 30 calendar days, after which tenant records are permanently purged in accordance with our Security &amp; Privacy Policy.
                  </p>
                  <p className="mt-3">
                    These Terms are governed by and construed in accordance with the laws of the <strong className="text-[#14213D]">Republic of India</strong>. Any unresolved dispute shall be subject to the exclusive jurisdiction of the competent courts in <strong className="text-[#14213D]">Bengaluru, Karnataka, India</strong>.
                  </p>
                  <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-[#F7F9FC] text-xs space-y-1">
                    <p className="font-bold text-[#14213D]">Legal &amp; Contractual Notices</p>
                    <p className="text-slate-600">NattonFlow HR Technologies Pvt Ltd · Bengaluru, Karnataka, India</p>
                    <p className="font-mono text-[#4361EE]">legal@nattonflow.com</p>
                  </div>
                </section>
              </div>
            )}

            {/* Document Footer Cross-Navigation & Action Bar */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
              <div>
                <p className="text-xs font-bold text-[#14213D]">
                  {activePage === 'security_privacy'
                    ? 'Review our subscription & billing terms'
                    : 'Inspect our encryption & privacy safeguards'}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onSwitchPage(activePage === 'security_privacy' ? 'terms' : 'security_privacy')
                  }
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#4361EE] hover:underline cursor-pointer"
                >
                  <FileText size={13} />
                  <span>
                    {activePage === 'security_privacy'
                      ? 'Read Terms of Service'
                      : 'Read Security & Privacy'}
                  </span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="px-4 py-2 text-xs font-bold text-[#14213D] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Open Live Workspace
                </button>
                <button
                  type="button"
                  onClick={onRequestSecurityReview}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  Book Enterprise Security Review
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
