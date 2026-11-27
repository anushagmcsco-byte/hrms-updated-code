import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Mail,
  User,
  Phone,
  Globe,
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Video,
  Inbox,
  MessageSquare,
  MessageCircle,
  Crown,
  UserCheck,
  Copy,
  Check,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DemoMessageChannel } from '../types';

const formatWhatsAppHref = (phone: string, text: string) => {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

const formatSmsHref = (phone: string, text: string) => {
  const clean = phone.replace(/\s+/g, '');
  return `sms:${clean}?body=${encodeURIComponent(text)}`;
};

const formatMailtoHref = (to: string, subject: string, body: string) =>
  `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const BookDemoModal: React.FC = () => {
  const {
    isBookDemoModalOpen,
    setIsBookDemoModalOpen,
    submitDemoBooking,
    verifyDemoBookingEmail,
    resendDemoVerificationEmail,
    activeDemoRequestForVerification,
    setActiveDemoRequestForVerification,
    setCurrentView,
    switchTenant,
    tenants,
    dispatchedEmails,
    showToast
  } = useApp();

  const [step, setStep] = useState<'form' | 'verify' | 'confirmed'>('form');

  // Form State
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [companyOwnerEmail, setCompanyOwnerEmail] = useState('');
  const [companyOwnerName, setCompanyOwnerName] = useState('');
  const [sameAsClientEmail, setSameAsClientEmail] = useState(false);
  const [phone, setPhone] = useState('');
  const [messageChannel, setMessageChannel] = useState<DemoMessageChannel>('both');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState<'1-20' | '21-50' | '51-200' | '201-1000' | '1000+'>('51-200');
  const [currentHrms, setCurrentHrms] = useState('Spreadsheets / Excel');
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'Automated Payroll',
    'Biometric Attendance',
    'Time Off & Leave'
  ]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata (IST - Indian Standard Time)');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('11:30 AM - 12:15 PM IST (Pre-Lunch Session)');
  const [notes, setNotes] = useState('');

  // Verification & Preview State
  const [otpCode, setOtpCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeEmailTab, setActiveEmailTab] = useState<'client' | 'owner'>('client');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync Client Email into Company Owner Email when checkbox is active
  useEffect(() => {
    if (sameAsClientEmail) {
      setCompanyOwnerEmail(workEmail);
    }
  }, [sameAsClientEmail, workEmail]);

  // Auto-detect email domain health
  const emailDomain = workEmail.includes('@') ? workEmail.split('@')[1]?.toLowerCase().trim() : '';
  const disposableDomains = ['tempmail.com', 'tempmail.ninja', 'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'test.com'];
  const freePersonalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
  const isDisposable = disposableDomains.includes(emailDomain);
  const isFreePersonal = freePersonalDomains.includes(emailDomain);
  const isCorporateDomain = emailDomain && !isDisposable && !isFreePersonal && emailDomain.includes('.') && emailDomain.length > 3;

  useEffect(() => {
    if (activeDemoRequestForVerification) {
      if (activeDemoRequestForVerification.status === 'scheduled') {
        setStep('confirmed');
      } else if (activeDemoRequestForVerification.status === 'pending_verification') {
        setStep('verify');
      }
    } else {
      setStep('form');
    }
  }, [activeDemoRequestForVerification]);

  if (!isBookDemoModalOpen) return null;

  const handleModuleToggle = (moduleName: string) => {
    if (selectedModules.includes(moduleName)) {
      if (selectedModules.length > 1) {
        setSelectedModules(selectedModules.filter(m => m !== moduleName));
      }
    } else {
      setSelectedModules([...selectedModules, moduleName]);
    }
  };

  const handleCopyText = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedOwnerEmail = (sameAsClientEmail ? workEmail : companyOwnerEmail).trim();
    const phoneDigits = phone.replace(/[^0-9]/g, '');

    if (!fullName.trim() || !workEmail.trim() || !resolvedOwnerEmail || !companyName.trim() || !phone.trim()) {
      showToast('Please fill in Client Name, Client Email, Company Owner Email, Phone/WhatsApp, and Company Name.');
      return;
    }

    if (phoneDigits.length < 7) {
      showToast('Please enter a valid mobile / WhatsApp number (minimum 7 digits with country code).');
      return;
    }

    submitDemoBooking({
      fullName: fullName.trim(),
      workEmail: workEmail.trim(),
      companyOwnerEmail: resolvedOwnerEmail,
      companyOwnerName: companyOwnerName.trim() || undefined,
      phone: phone.trim(),
      messageChannel,
      companyName: companyName.trim(),
      companyWebsite: companyWebsite || `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      companySize,
      currentHrms,
      selectedModules,
      preferredDate,
      preferredTimeSlot,
      timezone: selectedTimezone,
      notes
    });

    setStep('verify');
    setActiveEmailTab('client');
    setOtpCode('');
    setVerifyError('');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDemoRequestForVerification) return;
    setIsVerifying(true);
    setVerifyError('');

    setTimeout(() => {
      const res = verifyDemoBookingEmail(activeDemoRequestForVerification.id, otpCode);
      setIsVerifying(false);
      if (res.success) {
        setStep('confirmed');
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}
      } else {
        setVerifyError(res.message);
      }
    }, 350);
  };

  const handleResend = () => {
    if (!activeDemoRequestForVerification) return;
    resendDemoVerificationEmail(activeDemoRequestForVerification.id);
  };

  const closeModal = () => {
    if (step === 'confirmed') {
      setActiveDemoRequestForVerification(null);
      setStep('form');
    }
    setIsBookDemoModalOpen(false);
  };

  const resetForNewDemo = () => {
    setActiveDemoRequestForVerification(null);
    setStep('form');
    setOtpCode('');
    setVerifyError('');
  };

  const activeDispatches = activeDemoRequestForVerification?.messageDispatches || [];
  const otpDispatches = activeDispatches.filter(d => d.stage === 'verification_otp');
  const confirmedDispatches = activeDispatches.filter(d => d.stage === 'booking_confirmed');
  const latestDispatches = (confirmedDispatches.length > 0 ? confirmedDispatches : otpDispatches);

  const linkedTenant = activeDemoRequestForVerification?.linkedTenantId
    ? tenants.find(t => t.id === activeDemoRequestForVerification.linkedTenantId)
    : undefined;

  const relatedEmails = activeDemoRequestForVerification
    ? dispatchedEmails.filter(m => m.bookingId === activeDemoRequestForVerification.id)
    : [];

  const ownerEmailDisplay =
    activeDemoRequestForVerification?.companyOwnerEmail || activeDemoRequestForVerification?.workEmail || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Header Bar */}
        <div className="bg-[#14213D] text-white px-6 py-4 flex items-center justify-between border-b border-[#1e2f52] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4361EE] flex items-center justify-center text-white shadow-md">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Book Live Enterprise HRMS Demo
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  SMS / WhatsApp + Dual Email Sync
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dispatches via SMS/WhatsApp & Email to Client + Company Owner and dynamically updates Super Admin & HR Admin
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Progress Breadcrumb */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 'form' ? 'bg-[#4361EE] text-white' : 'bg-emerald-500 text-white'
            }`}>
              {step !== 'form' ? '✓' : '1'}
            </span>
            <span className={step === 'form' ? 'text-[#4361EE] font-bold' : ''}>Client, Owner & Channel</span>
          </div>

          <div className="h-0.5 w-10 bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 'verify' ? 'bg-[#4361EE] text-white' : step === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {step === 'confirmed' ? '✓' : '2'}
            </span>
            <span className={step === 'verify' ? 'text-[#4361EE] font-bold' : ''}>SMS/WhatsApp & Email OTP</span>
          </div>

          <div className="h-0.5 w-10 bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className={step === 'confirmed' ? 'text-emerald-600 font-bold' : ''}>Account & Admins Synced</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* STEP 1: CLIENT DETAILS FORM */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#4361EE] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="font-bold text-slate-900">Instant Multi-Channel Dispatch & Dynamic Account Sync</p>
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-[#4361EE] flex items-center gap-1.5 shadow-2xs w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live Time: {currentTime.toLocaleTimeString()}</span>
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Booking details & verification OTP are dispatched to your mobile via <strong>WhatsApp / SMS</strong> and emailed to both the <strong>Client Email</strong> and <strong>Company Owner Email</strong>, while updating your company workspace, <strong>Super Admin</strong>, and <strong>HR Admin</strong>.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Full Name & Designation *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins (VP of People)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] focus:ring-1 focus:ring-[#4361EE] bg-white"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization Name *
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Technologies Inc."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white"
                    />
                  </div>
                </div>

                {/* Client Corporate Work Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Work Email (HR / Coordinator) *
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="hr@company.com"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-1 bg-white ${
                        isDisposable
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400'
                          : isCorporateDomain
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-400'
                            : 'border-slate-300 focus:border-[#4361EE] focus:ring-[#4361EE]'
                      }`}
                    />
                  </div>
                  {workEmail && (
                    <div className="mt-1 text-[11px]">
                      {isDisposable && (
                        <p className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Temporary / dummy email detected.
                        </p>
                      )}
                      {isFreePersonal && (
                        <p className="text-amber-700 font-medium">
                          Personal email (@{emailDomain}). Details & HR Admin sync will still execute.
                        </p>
                      )}
                      {isCorporateDomain && (
                        <p className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Verified corporate domain: <span className="font-bold">@{emailDomain}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Company Owner Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Company Owner Email *
                    </label>
                    <button
                      type="button"
                      onClick={() => setSameAsClientEmail(!sameAsClientEmail)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        sameAsClientEmail
                          ? 'bg-blue-50 text-[#4361EE] border-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sameAsClientEmail ? '✓ Same as Client Email' : 'Use Client Email'}
                    </button>
                  </div>
                  <div className="relative">
                    <Crown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input
                      type="email"
                      required
                      disabled={sameAsClientEmail}
                      placeholder="owner@company.com"
                      value={sameAsClientEmail ? workEmail : companyOwnerEmail}
                      onChange={(e) => setCompanyOwnerEmail(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white disabled:bg-slate-50 disabled:text-slate-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Receives booking manifest & updates as Company Super Admin / Owner.
                  </p>
                </div>

                {/* Company Owner Name (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Owner Name (Optional)
                  </label>
                  <div className="relative">
                    <UserCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Verma (CEO / Founder)"
                      value={companyOwnerName}
                      onChange={(e) => setCompanyOwnerName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white"
                    />
                  </div>
                </div>

                {/* Phone / WhatsApp Number (Required) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile / WhatsApp Number (SMS & WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Include country code (e.g. +91 or +1) for instant WhatsApp & SMS delivery.
                  </p>
                </div>

                {/* Message Delivery Channel Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Instant Phone Notification Channel (SMS / WhatsApp) *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMessageChannel('whatsapp')}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        messageChannel === 'whatsapp'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <MessageCircle size={15} className="text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMessageChannel('sms')}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        messageChannel === 'sms'
                          ? 'bg-blue-50 border-[#4361EE] text-[#4361EE] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <MessageSquare size={15} className="text-[#4361EE]" />
                      <span>SMS Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMessageChannel('both')}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        messageChannel === 'both'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Send size={14} className="text-indigo-600" />
                      <span>Both (WhatsApp + SMS)</span>
                    </button>
                  </div>
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Workforce / Company Size *
                  </label>
                  <div className="relative">
                    <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value as typeof companySize)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                    >
                      <option value="1-20">1 - 20 employees (Growth)</option>
                      <option value="21-50">21 - 50 employees (Growth Plus)</option>
                      <option value="51-200">51 - 200 employees (Professional)</option>
                      <option value="201-1000">201 - 1,000 employees (Mid-Enterprise)</option>
                      <option value="1000+">1,000+ employees (Global Enterprise)</option>
                    </select>
                  </div>
                </div>

                {/* Current HRMS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current HR / Payroll Setup
                  </label>
                  <select
                    value={currentHrms}
                    onChange={(e) => setCurrentHrms(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                  >
                    <option value="Spreadsheets / Excel">Manual Spreadsheets / Excel</option>
                    <option value="BambooHR">BambooHR</option>
                    <option value="Darwinbox">Darwinbox</option>
                    <option value="Workday">Workday</option>
                    <option value="Gusto / Rippling">Gusto / Rippling</option>
                    <option value="Other / In-house">Other In-house Software</option>
                  </select>
                </div>

                {/* Preferred Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Preferred Demo Date *
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Business Days</span>
                  </div>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Preferred Time Slot */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Actual Consultation Slot *
                    </label>
                    <span className="text-[10px] text-emerald-600 font-bold">Real-Time Available</span>
                  </div>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={preferredTimeSlot}
                      onChange={(e) => setPreferredTimeSlot(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                    >
                      <option value="10:00 AM - 10:45 AM IST (Morning Slot)">10:00 AM - 10:45 AM IST (Morning Slot)</option>
                      <option value="11:30 AM - 12:15 PM IST (Pre-Lunch Session)">11:30 AM - 12:15 PM IST (Pre-Lunch Session)</option>
                      <option value="02:00 PM - 02:45 PM IST (Afternoon Slot)">02:00 PM - 02:45 PM IST (Afternoon Slot)</option>
                      <option value="03:30 PM - 04:15 PM IST (Technical Architecture Deep-Dive)">03:30 PM - 04:15 PM IST (Technical Deep-Dive)</option>
                      <option value="05:00 PM - 05:45 PM IST (Executive Leadership Q&A)">05:00 PM - 05:45 PM IST (Executive Q&A)</option>
                      <option value="06:30 PM - 07:15 PM IST (Evening Session)">06:30 PM - 07:15 PM IST (Evening Session)</option>
                    </select>
                  </div>
                </div>

                {/* Timezone Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Timezone
                  </label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={selectedTimezone}
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white text-slate-800"
                    >
                      <option value="Asia/Kolkata (IST - Indian Standard Time)">Asia/Kolkata (IST - Indian Standard Time, UTC+5:30)</option>
                      <option value="Asia/Dubai (GST - Gulf Standard Time)">Asia/Dubai (GST, UTC+4:00)</option>
                      <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT, UTC+8:00)</option>
                      <option value="Europe/London (GMT / BST)">Europe/London (GMT/BST, UTC+0/1)</option>
                      <option value="America/New_York (EST / EDT)">America/New_York (EST/EDT, UTC-5/4)</option>
                      <option value="America/Los_Angeles (PST / PDT)">America/Los_Angeles (PST/PDT, UTC-8/7)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modules of Interest */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Specific HR Modules to Cover in Live Demo (Select all that apply):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Automated Payroll',
                    'Biometric Attendance',
                    'Time Off & Leave',
                    'Recruitment ATS',
                    'Performance & OKRs',
                    'Expenses & Claims',
                    'IT Asset Tracking',
                    'Role-Based Access (RBAC)'
                  ].map(mod => {
                    const isSelected = selectedModules.includes(mod);
                    return (
                      <button
                        type="button"
                        key={mod}
                        onClick={() => handleModuleToggle(mod)}
                        className={`text-left text-xs px-3 py-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-[#4361EE] text-[#4361EE] font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{mod}</span>
                        {isSelected && <CheckCircle2 size={13} className="text-[#4361EE] flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Requirements Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Business Pain Points or Specific Demo Requests (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Need biometric attendance sync with monthly statutory payroll and manager leave workflows."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4361EE] bg-white placeholder:text-slate-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500">
                  Sends via <strong className="text-slate-700">{messageChannel === 'both' ? 'WhatsApp & SMS' : messageChannel.toUpperCase()}</strong> + emails Client & Company Owner + updates Super Admin & HR Admin
                </p>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#4361EE] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Book Demo & Send Alerts</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: SMS / WHATSAPP + DUAL EMAIL VERIFICATION GATE */}
          {step === 'verify' && activeDemoRequestForVerification && (
            <div className="space-y-4 animate-in fade-in">
              {/* Dynamic Account & Admin Sync Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 flex-1 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <h4 className="font-bold text-slate-900">
                      Company Account, Super Admin & HR Admin Dynamically Updated
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">
                      Workspace: {activeDemoRequestForVerification.linkedTenantId || linkedTenant?.id || 'Synced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Synced Roles:{' '}
                    <span className="font-semibold text-slate-800">
                      {(activeDemoRequestForVerification.updatedAdminsSummary || ['Platform Super Admin', 'Company Super Admin', 'HR Admin']).join(' • ')}
                    </span>
                  </p>
                </div>
              </div>

              {/* SMS & WhatsApp Dispatch Panel */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-emerald-400" />
                    <span>
                      SMS / WhatsApp Dispatched to {activeDemoRequestForVerification.phone}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Channel: {(activeDemoRequestForVerification.messageChannel || 'both').toUpperCase()}
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50">
                  {latestDispatches.map(dispatch => {
                    const isWa = dispatch.channel === 'whatsapp';
                    return (
                      <div
                        key={dispatch.id}
                        className={`rounded-xl border p-3 bg-white flex flex-col justify-between gap-2.5 ${
                          isWa ? 'border-emerald-200' : 'border-blue-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isWa ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isWa ? <MessageCircle size={11} /> : <MessageSquare size={11} />}
                              <span>{isWa ? 'WhatsApp Message' : 'SMS Message'}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">✓ Delivered</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-600 mb-1">
                            To: <strong>{dispatch.recipientPhone}</strong>
                          </p>
                          <pre className="text-[11px] text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                            {dispatch.messageBody}
                          </pre>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={
                              isWa
                                ? formatWhatsAppHref(dispatch.recipientPhone, dispatch.messageBody)
                                : formatSmsHref(dispatch.recipientPhone, dispatch.messageBody)
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-colors ${
                              isWa ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#4361EE] hover:bg-blue-700'
                            }`}
                          >
                            {isWa ? <MessageCircle size={12} /> : <MessageSquare size={12} />}
                            <span>{isWa ? 'Open in WhatsApp' : 'Open in SMS App'}</span>
                            <ExternalLink size={11} />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyText(dispatch.id, dispatch.messageBody, `${dispatch.channel.toUpperCase()} message`)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Copy message"
                          >
                            {copiedId === dispatch.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dual Email Dispatch Preview (Client Email & Company Owner Email) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="bg-slate-200/80 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Inbox size={15} className="text-[#4361EE]" />
                    <span>Dual Email Dispatch (Client & Company Owner)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveEmailTab('client')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        activeEmailTab === 'client'
                          ? 'bg-[#14213D] text-white'
                          : 'bg-white text-slate-600 border border-slate-300'
                      }`}
                    >
                      Client Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEmailTab('owner')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        activeEmailTab === 'owner'
                          ? 'bg-[#14213D] text-white'
                          : 'bg-white text-slate-600 border border-slate-300'
                      }`}
                    >
                      Company Owner Email
                    </button>
                  </div>
                </div>

                {(() => {
                  const showingOwner = activeEmailTab === 'owner';
                  const targetEmail = showingOwner ? ownerEmailDisplay : activeDemoRequestForVerification.workEmail;
                  const targetName = showingOwner
                    ? activeDemoRequestForVerification.companyOwnerName || activeDemoRequestForVerification.fullName
                    : activeDemoRequestForVerification.fullName;
                  const emailSubject = `NattonFlow HR Live Demo & OTP [${activeDemoRequestForVerification.verificationToken}] — ${activeDemoRequestForVerification.companyName}`;
                  const emailBody = `Hello ${targetName},\n\nYour NattonFlow HR live demo for ${activeDemoRequestForVerification.companyName} has been scheduled.\n\nVerification Code: ${activeDemoRequestForVerification.verificationToken}\nDate & Slot: ${activeDemoRequestForVerification.preferredDate} (${activeDemoRequestForVerification.preferredTimeSlot})\nClient Email: ${activeDemoRequestForVerification.workEmail}\nCompany Owner Email: ${ownerEmailDisplay}\nPhone / WhatsApp: ${activeDemoRequestForVerification.phone}\nAssigned Architect: ${activeDemoRequestForVerification.assignedSalesEngineer}\nVideo Meeting Room: ${activeDemoRequestForVerification.meetingLink}`;

                  return (
                    <div className="p-4 bg-white space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs flex-wrap gap-2">
                        <div>
                          <p className="font-bold text-slate-800">
                            From: <span className="text-[#4361EE]">NattonFlow Demos &lt;demos@nattonflow.com&gt;</span>
                          </p>
                          <p className="text-slate-600">
                            To ({showingOwner ? 'Company Owner / Super Admin' : 'Client / HR Admin'}):{' '}
                            <span className="font-bold text-slate-900">{targetName} &lt;{targetEmail}&gt;</span>
                          </p>
                        </div>
                        <a
                          href={formatMailtoHref(targetEmail, emailSubject, emailBody)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#4361EE] border border-blue-200 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Mail size={12} />
                          <span>Send via Mail App</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      <div className="text-xs text-slate-700 space-y-2">
                        <p className="font-semibold text-slate-900">Subject: {emailSubject}</p>
                        <p>
                          Hello <strong>{targetName}</strong>,
                        </p>
                        <p className="text-slate-600">
                          Demo booking details for <strong>{activeDemoRequestForVerification.companyName}</strong> have been dispatched to both <strong>{activeDemoRequestForVerification.workEmail}</strong> and Company Owner <strong>{ownerEmailDisplay}</strong>, as well as {activeDemoRequestForVerification.phone} ({(activeDemoRequestForVerification.messageChannel || 'both').toUpperCase()}).
                        </p>

                        {/* Prominent Verification OTP Badge */}
                        <div className="py-2 flex items-center gap-3 flex-wrap">
                          <div className="bg-[#14213D] text-white px-5 py-2.5 rounded-xl font-mono text-xl font-black tracking-widest shadow-inner">
                            {activeDemoRequestForVerification.verificationToken}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpCode(activeDemoRequestForVerification.verificationToken);
                              showToast('Verification code copied and auto-filled!');
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          >
                            1-Click Auto-Fill Code
                          </button>
                          <span className="text-[11px] text-slate-500">
                            {relatedEmails.length} email manifest{relatedEmails.length === 1 ? '' : 's'} logged
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Enter the 6-Digit Verification Code (from SMS/WhatsApp or Email):
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 582914"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-48 text-center font-mono text-lg font-bold tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/20 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isVerifying || otpCode.length < 6}
                      className="px-6 py-2.5 bg-[#4361EE] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Confirming & Syncing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Verify & Confirm Demo Slot</span>
                        </>
                      )}
                    </button>
                  </div>
                  {verifyError && (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertTriangle size={13} />
                      <span>{verifyError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      ← Edit Client & Owner Details
                    </button>
                    <button
                      type="button"
                      onClick={resetForNewDemo}
                      className="text-[#4361EE] hover:underline font-semibold cursor-pointer"
                    >
                      + Start New Booking
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Need a fresh code?</span>
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[#4361EE] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Resend via SMS/WhatsApp & Email</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: DEMO CONFIRMED & FULL SYNC SUMMARY */}
          {step === 'confirmed' && activeDemoRequestForVerification && (
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Confirmed • SMS/WhatsApp & Dual Emails Dispatched • Admins Updated
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  Live Demo Confirmed for {activeDemoRequestForVerification.companyName}!
                </h3>
                <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1">
                  Confirmation has been dispatched to <strong>{activeDemoRequestForVerification.phone}</strong> via{' '}
                  <strong>{(activeDemoRequestForVerification.messageChannel || 'both').toUpperCase()}</strong>, emailed to{' '}
                  <strong>{activeDemoRequestForVerification.workEmail}</strong> & <strong>{ownerEmailDisplay}</strong>, and synced to the company workspace, Super Admin, and HR Admin.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-[#F7F9FC] border border-slate-200 rounded-xl p-5 text-left max-w-xl mx-auto space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <span className="text-xs font-semibold text-slate-500">Client</span>
                  <span className="text-xs font-bold text-slate-900">{activeDemoRequestForVerification.fullName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <span className="text-xs font-semibold text-slate-500">Client Email</span>
                  <span className="text-xs font-bold text-[#4361EE]">{activeDemoRequestForVerification.workEmail}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <span className="text-xs font-semibold text-slate-500">Company Owner Email</span>
                  <span className="text-xs font-bold text-amber-700">{ownerEmailDisplay}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <span className="text-xs font-semibold text-slate-500">Phone ({(activeDemoRequestForVerification.messageChannel || 'both').toUpperCase()})</span>
                  <span className="text-xs font-bold text-emerald-700">{activeDemoRequestForVerification.phone}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <span className="text-xs font-semibold text-slate-500">Date & Slot</span>
                  <span className="text-xs font-bold text-slate-900 text-right">
                    {activeDemoRequestForVerification.preferredDate} ({activeDemoRequestForVerification.preferredTimeSlot})
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <span className="text-xs font-semibold text-slate-500">Synced Account & Admins</span>
                  <span className="text-[11px] font-bold text-emerald-700 text-right">
                    {(activeDemoRequestForVerification.updatedAdminsSummary || ['Super Admin', 'HR Admin']).join(' • ')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-500">Video Meeting Link</span>
                  <a
                    href={activeDemoRequestForVerification.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#4361EE] hover:underline flex items-center gap-1"
                  >
                    <Video size={13} />
                    <span>Launch Video Room</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Confirmed SMS / WhatsApp Quick Send Buttons */}
              {latestDispatches.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                  {latestDispatches.map(d => (
                    <a
                      key={d.id}
                      href={
                        d.channel === 'whatsapp'
                          ? formatWhatsAppHref(d.recipientPhone, d.messageBody)
                          : formatSmsHref(d.recipientPhone, d.messageBody)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs ${
                        d.channel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                      }`}
                    >
                      {d.channel === 'whatsapp' ? <MessageCircle size={13} /> : <MessageSquare size={13} />}
                      <span>Open Confirmed {d.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</span>
                      <ExternalLink size={11} />
                    </a>
                  ))}
                </div>
              )}

              {/* Storage Confirmation & Next Steps */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 flex-wrap">
                {activeDemoRequestForVerification.linkedTenantId && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = activeDemoRequestForVerification.linkedTenantId!;
                      closeModal();
                      switchTenant(targetId);
                      setCurrentView('dashboard');
                      showToast(`Switched to ${activeDemoRequestForVerification.companyName} workspace!`);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Building2 size={14} />
                    <span>Open {activeDemoRequestForVerification.companyName} Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    setCurrentView('demo_bookings');
                    showToast('Viewing verified client demo bookings in Leads Registry.');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#14213D] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-[#4361EE]" />
                  <span>View in Demo Leads Registry</span>
                </button>

                <button
                  type="button"
                  onClick={resetForNewDemo}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Book Another Demo</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

