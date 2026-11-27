import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  Lock, 
  Zap, 
  HelpCircle, 
  Smartphone,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookDemoModal } from '../components/BookDemoModal';
import { DispatchedEmailModal } from '../components/DispatchedEmailModal';
import { PublicLegalPages, PublicPortalPage } from '../components/PublicLegalPages';
import { 
  FileText, 
  Mail, 
  Send, 
  RefreshCw, 
  User, 
  Globe, 
  Check, 
  AlertTriangle,
  Inbox,
  ExternalLink,
  X,
  Menu
} from 'lucide-react';

export const PublicWebsiteView: React.FC = () => {
  const { 
    setCurrentView, 
    showToast, 
    setIsBookDemoModalOpen,
    sendDynamicClientEmail,
    dispatchedEmails,
    setActiveDispatchedEmailModal
  } = useApp();

  const [activePortalPage, setActivePortalPage] = useState<PublicPortalPage>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [trialEmail, setTrialEmail] = useState('');

  const openPortalPage = (page: PublicPortalPage) => {
    setActivePortalPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHomeSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (activePortalPage !== 'home') {
      setActivePortalPage('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dynamic customization state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customSize, setCustomSize] = useState<'1-20' | '21-50' | '51-200' | '201-1000' | '1000+'>('51-200');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStage, setDispatchStage] = useState('');

  // Real-time dynamic name & company derivation
  const emailParts = trialEmail.trim().split('@');
  const emailUser = emailParts[0] || '';
  const emailDomain = emailParts[1]?.toLowerCase() || '';

  const getDerivedPersonName = (userStr: string) => {
    if (!userStr) return '';
    const clean = userStr.replace(/[0-9_]/g, '');
    if (clean.includes('.')) {
      return clean.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (clean.length > 2) {
      if (clean.startsWith('u') && clean.length > 4) {
        const stripped = clean.substring(1);
        return stripped.charAt(0).toUpperCase() + stripped.slice(1);
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return 'Valued Executive';
  };

  const getDerivedCompanyName = (domainStr: string, nameStr: string) => {
    if (!domainStr) return '';
    const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (!freeDomains.includes(domainStr)) {
      const base = domainStr.split('.')[0].replace(/[^a-zA-Z0-9]/g, ' ');
      return base.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Enterprise';
    }
    return `${nameStr || 'Client'}'s Organization`;
  };

  const derivedName = getDerivedPersonName(emailUser);
  const derivedCompany = getDerivedCompanyName(emailDomain, derivedName);

  // Direct dynamic email sending from hero form
  const handleStartTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialEmail || !trialEmail.includes('@') || trialEmail.trim().length < 5) {
      showToast('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    const recipient = customName || derivedName;
    const company = customCompany || derivedCompany;

    setIsDispatching(true);
    setDispatchStage(`Resolving DNS & MX records for @${emailDomain || 'company.com'}...`);

    setTimeout(() => {
      setDispatchStage(`Provisioning dedicated cloud tenant for "${company}"...`);
      setTimeout(() => {
        setDispatchStage(`Dispatching dynamic enterprise email with all credentials to ${recipient} <${trialEmail}>...`);
        setTimeout(() => {
          setIsDispatching(false);
          setShowConfigModal(false);

          try {
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}

          // Execute dynamic email dispatching in AppContext with all details
          const sentMail = sendDynamicClientEmail({
            recipientEmail: trialEmail.trim(),
            recipientName: recipient,
            companyName: company,
            companySize: customSize,
            primaryModules: [
              'Automated 8-Stage Payroll & Tax Slabs',
              'Smart Biometric Attendance & Geo-Fencing',
              'Time Off & Leave Approvals',
              'Candidate ATS & Recruitment Kanban',
              'Performance Appraisals & OKRs',
              'Expense Claims & Reimbursements'
            ]
          });

          showToast(`Dynamic email sent to ${recipient} at ${company}!`);
          setTrialEmail('');
        }, 500);
      }, 500);
    }, 450);
  };

  const executeSendDynamicEmail = () => {
    handleStartTrial({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleSelectPresetEmail = (preset: string) => {
    setTrialEmail(preset);
  };

  const faqs = [
    {
      q: "How does NattonFlow HR prevent payroll calculation errors?",
      a: "NattonFlow connects attendance logs, shift rosters, and approved leave records into an automated 8-stage payroll engine. Before salaries are finalized, our validation algorithm catches missing biometric punches, incorrect tax slab deductions, and anomalous compensation changes."
    },
    {
      q: "Can our employees use their smartphones for attendance?",
      a: "Yes! NattonFlow HR includes an ultra-fast mobile PWA and React Native app. Employees can clock-in via verified IP geo-fencing, submit time-off requests, and download encrypted payslips with a single tap."
    },
    {
      q: "How is company data kept private and secure?",
      a: "NattonFlow is built privacy-first with strict multi-tenant isolation. Every customer's database partitions are cryptographically tagged, and sensitive PII like SSNs and salaries are encrypted at the field level. Even Super Admins have zero access to private employee records."
    },
    {
      q: "Can we migrate data from our legacy HR software?",
      a: "Absolutely. NattonFlow includes seamless CSV and API migration bridges for BambooHR, Workday, Gusto, and spreadsheets, allowing standard company onboarding in under 15 minutes."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] relative overflow-x-hidden">
      {/* SaaS Website Top Navigation */}
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 w-full">
          {/* Logo with increased size and balanced alignment */}
          <div
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group shrink-0"
            onClick={() => (activePortalPage !== 'home' ? openPortalPage('home') : setCurrentView('dashboard'))}
          >
            <img 
              src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png" 
              alt="NattonFlow HR Logo" 
              className="h-11 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-xs flex-shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-lg sm:text-2xl font-black text-[#14213D] tracking-tight">
                  NattonFlow
                </span>
                <span className="bg-[#4361EE] text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded tracking-wide shadow-2xs">
                  HR
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:inline">
                Enterprise Cloud Platform
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => navigateToHomeSection('solutions')}
              className="hover:text-[#4361EE] transition-colors cursor-pointer whitespace-nowrap"
            >
              Solutions
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('pricing')}
              className="hover:text-[#4361EE] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Pricing</span>
              <span className="bg-blue-100 text-[#4361EE] text-[10px] font-bold px-1.5 py-0.2 rounded">₹ INR</span>
            </button>
            <button
              type="button"
              onClick={() => openPortalPage('security_privacy')}
              className={`transition-colors cursor-pointer whitespace-nowrap ${
                activePortalPage === 'security_privacy' ? 'text-[#4361EE] font-bold' : 'hover:text-[#4361EE]'
              }`}
            >
              Security &amp; Privacy
            </button>
            <button
              type="button"
              onClick={() => openPortalPage('terms')}
              className={`transition-colors cursor-pointer whitespace-nowrap ${
                activePortalPage === 'terms' ? 'text-[#4361EE] font-bold' : 'hover:text-[#4361EE]'
              }`}
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('faq')}
              className="hover:text-[#4361EE] transition-colors cursor-pointer whitespace-nowrap"
            >
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentView('spec_document')}
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#4361EE] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="Read formal Requirement Specification Document (RSD)"
            >
              <FileText size={13} className="text-[#4361EE]" />
              <span>RSD Spec Doc</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="hidden sm:inline-block px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              Launch Demo
            </button>

            <button
              type="button"
              onClick={() => setIsBookDemoModalOpen(true)}
              className="px-3 sm:px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Book Demo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle portal navigation menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 flex flex-col gap-1 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => openPortalPage('home')}
              className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                activePortalPage === 'home' ? 'bg-blue-50 text-[#4361EE] font-bold' : 'hover:bg-slate-50'
              }`}
            >
              Portal Home
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('solutions')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Solutions
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('pricing')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Pricing (₹ INR)
            </button>
            <button
              type="button"
              onClick={() => openPortalPage('security_privacy')}
              className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                activePortalPage === 'security_privacy' ? 'bg-blue-50 text-[#4361EE] font-bold' : 'hover:bg-slate-50'
              }`}
            >
              Security &amp; Privacy
            </button>
            <button
              type="button"
              onClick={() => openPortalPage('terms')}
              className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                activePortalPage === 'terms' ? 'bg-blue-50 text-[#4361EE] font-bold' : 'hover:bg-slate-50'
              }`}
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('faq')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              FAQ
            </button>
            <div className="pt-2 mt-1 border-t border-slate-100 flex items-center gap-2 px-3">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setCurrentView('dashboard');
                }}
                className="flex-1 py-2 text-center font-bold text-[#14213D] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Launch Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setCurrentView('spec_document');
                }}
                className="flex-1 py-2 text-center font-bold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                RSD Spec Doc
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Book Live Demo Modal Overlay */}
      <BookDemoModal />

      {activePortalPage !== 'home' ? (
        <PublicLegalPages
          activePage={activePortalPage}
          onSwitchPage={openPortalPage}
          onRequestSecurityReview={() => setIsBookDemoModalOpen(true)}
          onEnterWorkspace={() => setCurrentView('dashboard')}
        />
      ) : (
        <>
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 max-w-6xl mx-auto text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#4361EE] px-3.5 py-1.5 rounded-full text-xs font-bold mb-6 border border-blue-200">
          <Sparkles size={14} className="text-amber-500" />
          <span>The Modern, Privacy-First HRMS for Growing Enterprises</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#14213D] tracking-tight max-w-4xl mx-auto leading-tight">
          Run HR, attendance, payroll, and employee operations in <span className="text-[#4361EE]">one unified platform.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed">
          Eliminate manual spreadsheet errors, mismatched biometric punches, and confusing workflows. NattonFlow HR brings employee self-service, error-free payroll, and automated approvals together.
        </p>

        {/* Quick Email Trial Form with Dynamic Person & Company Intelligence */}
        <div className="mt-8 max-w-xl mx-auto">
          <form onSubmit={handleStartTrial} className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="relative w-full sm:w-auto flex-1">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                disabled={isDispatching}
                placeholder="Enter corporate email (e.g. anusha@infosys.com, alex@stripe.com)..."
                value={trialEmail}
                onChange={(e) => setTrialEmail(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/20 bg-white shadow-xs disabled:bg-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={isDispatching || !trialEmail.includes('@')}
              className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[#4361EE] rounded-xl shadow-md transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDispatching ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sending Dynamic Email...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Start 14-Day Free Trial</span>
                </>
              )}
            </button>
          </form>

          {/* Inline Dispatching Progress Banner */}
          {isDispatching && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-left animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-[#4361EE]">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Dispatching Dynamic Enterprise Email...</span>
                </div>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-mono">
                  SMTP Live
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-mono">{dispatchStage}</p>
              <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-[#4361EE] rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* Real-time Dynamic Detection Card as user types */}
          {trialEmail.includes('@') && emailDomain.length > 2 && !isDispatching && (
            <div className="mt-3 p-3 bg-white border border-blue-200 rounded-xl shadow-sm text-left animate-in fade-in space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4361EE]">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Dynamic AI Organization & Person Detection</span>
                </div>
                <span className="text-emerald-700 bg-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  <span>Dynamic Email Ready</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  <span className="text-slate-500">Recipient:</span>
                  <strong className="text-slate-900 truncate">{derivedName}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" />
                  <span className="text-slate-500">Company:</span>
                  <strong className="text-slate-900 truncate">{derivedCompany}</strong>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                <span>
                  Tenant URL: <span className="font-mono text-[#4361EE]">https://{derivedCompany.toLowerCase().replace(/[^a-z0-9]/g, '-')}.nattonflow.hr</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomName(derivedName);
                    setCustomCompany(derivedCompany);
                    setShowConfigModal(true);
                  }}
                  className="text-[#4361EE] hover:underline font-semibold"
                >
                  Edit details before send
                </button>
              </div>
            </div>
          )}

          {/* Quick-fill Example Presets */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <span className="text-slate-400">Quick Test Presets:</span>
            {[
              { email: 'anusha.sharma@infosys.com', label: 'Anusha (Infosys)' },
              { email: 'alex.turner@stripe.com', label: 'Alex (Stripe)' },
              { email: 'priya.k@tcs.com', label: 'Priya (TCS)' },
              { email: 'david.kim@uber.com', label: 'David (Uber)' }
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPresetEmail(preset.email)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-[#4361EE] border border-slate-200 hover:border-blue-300 rounded-lg text-slate-600 transition-colors cursor-pointer text-[10px] font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-2.5">
            No credit card required • Dispatches dynamic email with personalized credentials to that person from that company • Instant workspace setup
          </p>
        </div>

        {/* Dynamic Email Dispatch Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-left">
              {/* Header */}
              <div className="bg-[#14213D] text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#4361EE] flex items-center justify-center text-white">
                    <Send size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Dispatch Dynamic Enterprise Setup Email</h3>
                    <p className="text-[11px] text-slate-300">
                      Personalized onboarding credentials will be sent to this specific person from their company
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-4 text-xs text-slate-700">
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-[#4361EE] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600">
                    We automatically inferred the person's name and corporate organization from the email domain. You can adjust the details before dispatching.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Recipient Corporate Email
                    </label>
                    <input
                      type="email"
                      required
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      placeholder="e.g. uanusha017@gmail.com, alex@stripe.com"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white font-medium text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Recipient Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anusha"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Company / Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Infosys Global"
                        value={customCompany}
                        onChange={(e) => setCustomCompany(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Total Company Workforce Size
                    </label>
                    <select
                      value={customSize}
                      onChange={(e: any) => setCustomSize(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                    >
                      <option value="1-20">1 - 20 employees (Growth)</option>
                      <option value="21-50">21 - 50 employees (Growth Plus)</option>
                      <option value="51-200">51 - 200 employees (Professional)</option>
                      <option value="201-1000">201 - 1,000 employees (Mid-Enterprise)</option>
                      <option value="1000+">1,000+ employees (Global Enterprise)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Preview Manifest */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <p className="font-bold text-slate-800">Dynamic Email Payload Manifest:</p>
                  <p><span className="text-slate-500">To:</span> <strong className="text-slate-900">{customName || derivedName}</strong> &lt;{trialEmail}&gt;</p>
                  <p><span className="text-slate-500">From:</span> <strong className="text-slate-900">{customCompany || derivedCompany} HR Platform</strong> &lt;onboarding@{(customCompany || derivedCompany).toLowerCase().replace(/[^a-z0-9]/g, '-')}.com&gt;</p>
                  <p><span className="text-slate-500">Dedicated Tenant URL:</span> <span className="font-mono text-[#4361EE]">https://{(customCompany || derivedCompany).toLowerCase().replace(/[^a-z0-9]/g, '-')}.nattonflow.hr/workspace</span></p>
                  <p><span className="text-slate-500">Included:</span> 14-Day Enterprise Trial, 250 Seats, 8-Stage Payroll, Biometric Attendance, 6-Digit Email Verification Code</p>
                </div>

                {/* Sending Progress Animation */}
                {isDispatching && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4361EE]">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Dispatching Email via SMTP Gateway...</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">{dispatchStage}</p>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-[#4361EE] rounded-full animate-pulse w-3/4" />
                    </div>
                  </div>
                )}

                {/* Modal Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isDispatching}
                    onClick={() => setShowConfigModal(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isDispatching}
                    onClick={executeSendDynamicEmail}
                    className="px-5 py-2.5 bg-[#4361EE] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Send size={14} />
                    <span>Send Dynamic Email & Provision Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Interactive App Banner Preview */}
        <div className="mt-12 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 max-w-4xl mx-auto">
          <div className="bg-[#14213D] text-white rounded-xl p-6 text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono text-blue-300 uppercase">Live SaaS Workspace Demo</span>
              <h3 className="text-xl font-extrabold mt-1">Experience NattonFlow HR as HR Admin, Manager, or Employee</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                Explore real payroll validation, geofenced mobile check-ins, candidate ATS pipelines, and multi-tenant security right now.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-5 py-2.5 bg-white text-[#14213D] hover:bg-slate-100 text-xs font-bold rounded-xl shadow-md transition-all whitespace-nowrap flex items-center gap-2"
            >
              <span>Enter Workspace</span>
              <ArrowRight size={14} className="text-[#4361EE]" />
            </button>
          </div>
        </div>
      </section>

      {/* Trusted By Logos */}
      <section className="border-y border-slate-200 bg-white py-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Trusted by 850+ innovative enterprises and growing workforces worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-slate-600 font-extrabold text-sm sm:text-base">
            <span>Acme Cloud Technologies</span>
            <span>Globex Robotics</span>
            <span>Hyperion BioPharma</span>
            <span>Nextera FinTech</span>
            <span>Starlight Media</span>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section id="solutions" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4361EE]">The NattonFlow Difference</span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#14213D] mt-2">
            Why leading companies replace legacy HRMS
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Traditional HR systems are crowded, slow, and prone to costly payroll mistakes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ✕
            </div>
            <h3 className="text-base font-bold text-slate-900">Legacy Systems: Manual Errors</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exporting spreadsheets, manually checking attendance records, and correcting mistaken tax deductions at the end of each month.
            </p>
            <div className="pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>NattonFlow: 8-Step Auto Validation</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ✕
            </div>
            <h3 className="text-base font-bold text-slate-900">Legacy Systems: Crowded Clutter</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confusing menus with 50+ unlabelled buttons that require hours of employee training and cause endless HR helpdesk tickets.
            </p>
            <div className="pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>NattonFlow: Zero-Clutter Calm UI</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ✕
            </div>
            <h3 className="text-base font-bold text-slate-900">Legacy Systems: Scattered Silos</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Separate tools for hiring, attendance, payslips, and leaves that never sync, creating discrepancies and delayed employee approvals.
            </p>
            <div className="pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>NattonFlow: Unified Workforce Hub</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section in Indian Rupees (INR / ₹) */}
      <section id="pricing" className="py-20 px-6 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4361EE] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Transparent Indian SaaS Pricing (₹ INR)
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#14213D] mt-3">
              Simple, predictable plans for Indian & global workforces
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Statutory PF, ESI, Professional Tax (PT), and TDS Income Tax slab automation included. No hidden setup charges.
            </p>

            <div className="inline-flex items-center gap-2 bg-slate-100 p-1 rounded-xl mt-6">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-[#4361EE] text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-emerald-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded font-black">SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Growth Tier */}
            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <h3 className="text-base font-bold text-slate-900">Growth Plan</h3>
                <p className="text-xs text-slate-500 mt-1">For startups and expanding teams up to 50 staff</p>
                <div className="mt-4">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{billingCycle === 'annual' ? '199' : '249'}
                  </span>
                  <span className="text-xs text-slate-500"> / employee / month</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">+ 18% GST • Billed {billingCycle === 'annual' ? 'annually' : 'monthly'}</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Employee Master Directory & KYC</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Biometric Sync & Web Geo Attendance</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Leave Management & Shift Rosters</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Android & iOS Mobile ESS App</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Standard Digital Payslips via Email</li>
                </ul>
              </div>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="w-full mt-6 py-2.5 text-xs font-bold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
              >
                Choose Growth (₹{billingCycle === 'annual' ? '199' : '249'})
              </button>
            </div>

            {/* Professional Tier (Recommended) */}
            <div className="border-2 border-[#4361EE] rounded-2xl p-6 flex flex-col justify-between relative shadow-xl bg-slate-50/50">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4361EE] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                Most Popular in India
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Professional Plan</h3>
                <p className="text-xs text-slate-500 mt-1">For scaling businesses up to 250 employees</p>
                <div className="mt-4">
                  <span className="text-3xl font-black text-[#4361EE]">
                    ₹{billingCycle === 'annual' ? '479' : '599'}
                  </span>
                  <span className="text-xs text-slate-500"> / employee / month</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">+ 18% GST • All Statutory Compliance Included</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#4361EE] flex-shrink-0" /> Everything in Growth, plus:</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#4361EE] flex-shrink-0" /> 8-Stage Automated Payroll Engine</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#4361EE] flex-shrink-0" /> Statutory PF, ESI, PT & TDS Filing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#4361EE] flex-shrink-0" /> Direct Bank NEFT / RTGS / IMPS Payouts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#4361EE] flex-shrink-0" /> Candidate ATS & Recruitment Kanban</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#4361EE] flex-shrink-0" /> Expense Claims & Reimbursements</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  setShowConfigModal(true);
                  if (!customCompany) setCustomCompany('Acme Technologies');
                  if (!customName) setCustomName('Anusha');
                  if (!trialEmail) setTrialEmail('uanusha017@gmail.com');
                }}
                className="w-full mt-6 py-2.5 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Start 14-Day Free Trial (₹{billingCycle === 'annual' ? '479' : '599'})
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enterprise Cloud</h3>
                <p className="text-xs text-slate-500 mt-1">For organizations requiring tailored enterprise compliance</p>
                <div className="mt-4">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{billingCycle === 'annual' ? '999' : '1,299'}
                  </span>
                  <span className="text-xs text-slate-500"> / employee / month</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Custom volume slabs available for 500+ seats</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Dedicated Cloud Database Partition</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Custom Salary Slabs & Gratuity Calculator</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> SAML SSO / Okta / Azure AD Integration</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> Dedicated India Solutions Architect</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" /> 24/7 Priority SLA & Audit Support</li>
                </ul>
              </div>
              <button 
                onClick={() => setIsBookDemoModalOpen(true)}
                className="w-full mt-6 py-2.5 text-xs font-bold text-white bg-[#14213D] hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Book Live Enterprise Demo
              </button>
            </div>
          </div>

          {/* Pricing Guarantee Banner */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>All plans include instant workspace activation, zero migration downtime, and SOC-2 Type II security.</span>
            </div>
            <button 
              onClick={() => setIsBookDemoModalOpen(true)}
              className="text-[#4361EE] hover:underline font-bold whitespace-nowrap"
            >
              Need custom GST invoicing? Talk to our India sales team →
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4361EE]">Frequently Asked Questions</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#14213D] mt-2">
            Everything you need to know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between"
              >
                <span>{faq.q}</span>
                {activeFaq === idx ? <ChevronUp size={16} className="text-[#4361EE]" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
        </>
      )}

      {/* Footer */}
      <footer className="bg-[#14213D] text-white py-12 px-6 border-t border-slate-800 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div
            className="flex items-center gap-3.5 cursor-pointer"
            onClick={() => openPortalPage('home')}
          >
            <img 
              src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png" 
              alt="NattonFlow HR Logo" 
              className="h-14 sm:h-16 w-auto object-contain rounded-xl bg-white/10 p-1 border border-white/10"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">NattonFlow</span>
                <span className="bg-[#4361EE] text-white text-[10px] font-black px-1.5 py-0.2 rounded">HR</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">© 2026 NattonFlow HR Technologies Pvt Ltd. All rights reserved.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
            <button
              type="button"
              onClick={() => openPortalPage('security_privacy')}
              className={`cursor-pointer transition-colors ${
                activePortalPage === 'security_privacy' ? 'text-white font-bold' : 'hover:text-white'
              }`}
            >
              Security &amp; Privacy
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('pricing')}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => openPortalPage('terms')}
              className={`cursor-pointer transition-colors ${
                activePortalPage === 'terms' ? 'text-white font-bold' : 'hover:text-white'
              }`}
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="text-blue-300 hover:text-white font-bold cursor-pointer transition-colors"
            >
              Access App Dashboard →
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Pill: View Recent Dispatched Dynamic Emails */}
      {dispatchedEmails.length > 0 && (
        <button
          onClick={() => setActiveDispatchedEmailModal(dispatchedEmails[0])}
          className="fixed bottom-6 left-6 z-40 bg-[#14213D] hover:bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold transition-all hover:scale-105"
          title="Inspect the dynamic email dispatched to client"
        >
          <Inbox size={15} className="text-[#4361EE]" />
          <span>Latest Dispatched Email: {dispatchedEmails[0].recipientName} ({dispatchedEmails[0].companyName})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      )}
    </div>
  );
};
