import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  Building2, 
  User, 
  Lock, 
  ExternalLink, 
  ArrowRight, 
  Download, 
  Copy, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  Send,
  Inbox,
  Check,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DispatchedEmailModal: React.FC = () => {
  const { 
    activeDispatchedEmailModal, 
    setActiveDispatchedEmailModal, 
    activateDynamicTenantFromEmail,
    showToast 
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!activeDispatchedEmailModal) return null;

  const mail = activeDispatchedEmailModal;

  const handleCopyCredentials = () => {
    const creds = `NattonFlow HR Enterprise Workspace Credentials
Recipient: ${mail.recipientName}
Email: ${mail.recipientEmail}
Company: ${mail.companyName}
Workspace URL: ${mail.workspaceUrl}
Verification Code: ${mail.verificationToken}
Assigned Solutions Architect: ${mail.assignedArchitect}`;

    navigator.clipboard.writeText(creds);
    setCopied(true);
    showToast('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerifyAndEnterDashboard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = enteredCode.trim();

    if (token !== mail.verificationToken) {
      setErrorMessage(`Invalid code. Please enter the 6-digit code (${mail.verificationToken}) sent to ${mail.recipientEmail}.`);
      return;
    }

    setErrorMessage(null);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    activateDynamicTenantFromEmail(mail.id);
  };

  const handleAutoFillAndVerify = () => {
    setEnteredCode(mail.verificationToken);
    setErrorMessage(null);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
    activateDynamicTenantFromEmail(mail.id);
  };

  const handleDownloadIcs = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NattonFlow HR//Enterprise Onboarding//EN
BEGIN:VEVENT
SUMMARY:NattonFlow HR Enterprise Setup for ${mail.companyName}
DESCRIPTION:1-on-1 enterprise onboarding walkthrough with ${mail.assignedArchitect}. Dedicated workspace: ${mail.workspaceUrl}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NattonFlow_HR_${mail.companyName.replace(/\s+/g, '_')}_Invite.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Calendar invite downloaded.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Top Window Bar */}
        <div className="bg-[#14213D] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#1e2f52] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4361EE] flex items-center justify-center text-white shadow-xs">
              <Mail size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  14-Day Free Trial Verification Dispatched
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  <span>Delivered to Client Inbox</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Verification email sent from <strong className="text-white">{mail.companyName}</strong> to <strong className="text-white">{mail.recipientEmail}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveDispatchedEmailModal(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Close window"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Interactive Verification Card (Prominent Top Section) */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 p-4 border-b border-blue-200/90 flex-shrink-0">
          <form onSubmit={handleVerifyAndEnterDashboard} className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#4361EE] text-white shadow-xs">
                  <KeyRound size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Enter Verification Code to Launch {mail.companyName} Dashboard
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    A 6-digit code has been delivered to <strong>{mail.recipientEmail}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoFillAndVerify}
                className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-blue-100 text-[#4361EE] rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Fill verification code directly from the dispatched mail"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Auto-Fill Code ({mail.verificationToken})</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  placeholder={`Enter 6-digit code (e.g. ${mail.verificationToken})`}
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value.replace(/[^0-9]/g, ''));
                    setErrorMessage(null);
                  }}
                  className="w-full text-sm font-mono tracking-widest text-center sm:text-left pl-3 pr-3 py-2.5 rounded-xl border-2 border-[#4361EE] bg-white font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Verify Code & Enter {mail.companyName} Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Email Client Metadata Header */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs space-y-1.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400 w-16">From:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                "{mail.companyName} HR Platform" &lt;onboarding@{mail.companyDomain}&gt;
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold">
              SMTP 250 OK
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-400 w-16">To:</span>
            <span className="font-bold text-[#4361EE] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              "{mail.recipientName}" &lt;{mail.recipientEmail}&gt;
            </span>
            {mail.recipientRoleLabel && (
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                {mail.recipientRoleLabel}
              </span>
            )}
          </div>

          {mail.ccOwnerEmail && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-400 w-16">CC:</span>
              <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {mail.ccOwnerEmail}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400 w-16">Subject:</span>
            <span className="font-semibold text-slate-800">
              🔐 {mail.bookingId ? 'Demo & Workspace' : '14-Day Free Trial'}: Verification Code [{mail.verificationToken}] for {mail.companyName} Workspace
            </span>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-[#FDFDFE]">
          
          {/* Branded Email Letter */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png" 
                  alt="Logo" 
                  className="w-12 h-12 object-contain rounded-xl p-0.5 bg-slate-50 border border-slate-200 shadow-2xs"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900">{mail.companyName} Workforce Hub</h4>
                  <p className="text-[11px] text-slate-500">Dedicated Enterprise Tenant Partition ({mail.tenantId})</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                  14-Day Free Trial Active
                </span>
                <p className="text-[10px] text-slate-400 mt-1">250 Licensed Seats</p>
              </div>
            </div>

            {/* Email Greeting */}
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900 text-sm">
                Dear {mail.recipientName},
              </p>
              <p>
                Thank you for starting your <strong>14-Day Free Trial</strong> for <strong className="text-slate-900">{mail.companyName}</strong>. Your dedicated cloud HRMS partition has been configured with complete biometric attendance geofencing, statutory payroll pipelines, and time-off workflows.
              </p>
              <p className="text-slate-600">
                To complete your security verification and enter the <strong>{mail.companyName}</strong> corporate dashboard, please use the 6-digit verification code below:
              </p>
            </div>

            {/* Big Prominent Verification Code Box */}
            <div className="bg-gradient-to-r from-[#14213D] to-[#1e325c] text-white p-5 rounded-2xl text-center space-y-2 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Your 14-Day Free Trial Verification Code:
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-amber-300 bg-white/10 py-2.5 px-6 rounded-xl inline-block border border-white/20">
                {mail.verificationToken}
              </div>
              <p className="text-[11px] text-slate-300">
                Valid for 15 minutes. Enter this code in the verification bar above to launch your workspace.
              </p>
            </div>

            {/* Dynamic Credentials Table */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-900 text-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Enterprise Workspace Manifest</span>
                <span className="text-emerald-400">14-Day Trial • Free</span>
              </div>

              <div className="p-4 space-y-2.5 divide-y divide-slate-200/60">
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Company Name</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#4361EE]" />
                    <span>{mail.companyName}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Recipient Email ID</span>
                  <span className="font-bold text-[#4361EE]">{mail.recipientEmail}</span>
                </div>

                {mail.ccOwnerEmail && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500 font-medium">Co-Dispatched Email (CC)</span>
                    <span className="font-bold text-amber-700">{mail.ccOwnerEmail}</span>
                  </div>
                )}

                {mail.phone && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500 font-medium">Phone ({(mail.messageChannel || 'both').toUpperCase()})</span>
                    <span className="font-bold text-emerald-700">{mail.phone}</span>
                  </div>
                )}

                {mail.preferredDate && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500 font-medium">Scheduled Demo Slot</span>
                    <span className="font-semibold text-slate-900">
                      {mail.preferredDate} {mail.preferredTimeSlot ? `• ${mail.preferredTimeSlot}` : ''}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Assigned Admin</span>
                  <span className="font-bold text-slate-900">
                    {mail.recipientName} ({mail.recipientRoleLabel || 'Company Super Admin'})
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Dedicated Workspace URL</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {mail.workspaceUrl}
                  </span>
                </div>

                {mail.meetingLink && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500 font-medium">Demo Video Room</span>
                    <a
                      href={mail.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#4361EE] hover:underline flex items-center gap-1"
                    >
                      <span>Join Meeting</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Assigned Solutions Architect</span>
                  <span className="font-semibold text-slate-800">{mail.assignedArchitect}</span>
                </div>
              </div>
            </div>

            {/* Active Modules Included */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Full-Suite Modules Activated for {mail.companyName}:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {mail.activeModules.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 bg-emerald-50/60 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg">
                    <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{mod}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct 1-Click Launch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAutoFillAndVerify}
                className="w-full py-3 bg-[#4361EE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡ Instant 1-Click Verify & Enter {mail.companyName} Dashboard</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadIcs}
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} className="text-slate-500" />
              <span>Download .ICS Calendar</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
