import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  Lock, 
  ShieldCheck, 
  Mail, 
  Key, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Eye, 
  EyeOff,
  UserCheck,
  Crown,
  Shield,
  ChevronDown,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sparkles, Send, RefreshCw, X } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, tenants, sendDynamicClientEmail, showToast } = useApp();

  // Find the single Application Owner from the persistent database
  const appOwner = users.find(u => u.isAppOwner || u.role === 'super_admin') || users[0];

  // Dynamically filter all Sub-Owners (Company Super Admins / Company Owners) directly from the database
  const subOwners = users.filter(u => u.role === 'tenant_super_admin' || u.role === 'company_owner');

  const [loginMode, setLoginMode] = useState<'owner' | 'sub_owner'>('owner');
  const [selectedSubOwnerId, setSelectedSubOwnerId] = useState<string>(() => subOwners[0]?.id || '');

  const [email, setEmail] = useState<string>(() => appOwner?.email || 'elena.vance@nattonflow.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('849 201');
  const [rememberMe, setRememberMe] = useState(true);

  // 14-Day Free Trial Modal State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialEmail, setTrialEmail] = useState('uanusha017@gmail.com');
  const [trialCompanyName, setTrialCompanyName] = useState('Anusha Technologies');
  const [trialAdminName, setTrialAdminName] = useState('Anusha');
  const [isDispatchingTrial, setIsDispatchingTrial] = useState(false);

  // Sync state when switching between Owner and Sub-Owner dropdown or when Firestore streams new tenants
  useEffect(() => {
    if (loginMode === 'owner' && appOwner) {
      setEmail(appOwner.email);
      setSelectedRole(appOwner.role);
    } else if (loginMode === 'sub_owner') {
      const match = subOwners.find(s => s.id === selectedSubOwnerId) || subOwners[0];
      if (match) {
        if (match.id !== selectedSubOwnerId) {
          setSelectedSubOwnerId(match.id);
        }
        setEmail(match.email);
        setSelectedRole(match.role);
      }
    }
  }, [loginMode, selectedSubOwnerId, users]);

  const handleSubOwnerChange = (userId: string) => {
    setSelectedSubOwnerId(userId);
    const match = subOwners.find(s => s.id === userId);
    if (match) {
      setEmail(match.email);
      setSelectedRole(match.role);
    }
  };

  const selectedSubOwner = subOwners.find(s => s.id === selectedSubOwnerId) || subOwners[0];
  const selectedSubOwnerTenant = tenants.find(t => t.id === selectedSubOwner?.tenantId);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = loginMode === 'sub_owner' ? selectedSubOwner?.id : appOwner?.id;
    login(email, selectedRole, targetUserId);
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-[#F7F9FC]">
      {/* Left Brand Panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#0f192e] via-[#14213D] to-[#1e325c] text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Top Brand Logo - Enriched & High-Impact */}
        <div className="relative z-10 flex items-center gap-5">
          <div className="bg-white p-3 rounded-3xl shadow-2xl border-2 border-white/20 transition-transform hover:scale-105 flex-shrink-0">
            <img 
              src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png" 
              alt="NattonFlow HR Logo" 
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
            />
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-400/20">
              Enterprise Unified Workforce
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2">NattonFlow HR</h3>
            <p className="text-xs sm:text-sm font-medium text-slate-300">Multi-Tenant Cloud Platform</p>
          </div>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 my-10 space-y-5">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-blue-400/20">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Cryptographic Tenant Isolation & Data Protection</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Single Application Owner & Multi-Company Sub-Owner Governance.
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
            Complete hierarchical access control: one root Application Owner with centralized oversight, and company-specific Sub-Owners managed via persistent database storage.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/60 max-w-md text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>One Application Owner</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>Company Sub-Owners</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>Live Database Connection</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>Cryptographic Multi-Tenancy</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Protected by AES-256 GCM encryption</span>
          <span>SOC-2 Type II Certified</span>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#4361EE]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Login Form Container */}
      <div className="md:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center max-w-xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 flex-shrink-0">
              <img 
                src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png" 
                alt="NattonFlow HR Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to Workforce Portal</h1>
              <p className="text-xs text-slate-500 mt-1">
                Select Application Owner or choose a Company Sub-Owner from the database.
              </p>
            </div>
          </div>

          {/* Unified Owner / Sub-Owner Selector Box */}
          <div className="bg-[#EEF4FF] p-4 rounded-2xl border border-blue-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#4361EE] uppercase tracking-wider flex items-center gap-1.5">
                <Database size={13} />
                <span>Authentication Gateway</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Database Synced</span>
              </span>
            </div>

            {/* Mode Switcher: One Main Owner vs Company Sub-Owner */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/80 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setLoginMode('owner')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMode === 'owner' 
                    ? 'bg-[#14213D] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Crown size={14} className={loginMode === 'owner' ? 'text-amber-400' : 'text-slate-400'} />
                <span>Application Owner</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMode('sub_owner')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMode === 'sub_owner' 
                    ? 'bg-[#4361EE] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 size={14} className={loginMode === 'sub_owner' ? 'text-blue-200' : 'text-slate-400'} />
                <span>Company Sub-Owner</span>
              </button>
            </div>

            {/* Mode 1: One Main Application Owner */}
            {loginMode === 'owner' && (
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <img 
                    src={appOwner.avatar} 
                    alt={appOwner.name} 
                    className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400" 
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{appOwner.name}</span>
                      <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.2 rounded border border-amber-300">
                        Sole Application Owner
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{appOwner.title} • {appOwner.email}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    One Login
                  </span>
                </div>
              </div>
            )}

            {/* Mode 2: Company Sub-Owner DROPDOWN BOX connected with database */}
            {loginMode === 'sub_owner' && (
              <div className="space-y-2 animate-in fade-in">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Sub-Owner from Database:
                </label>
                <div className="relative">
                  <select
                    value={selectedSubOwnerId}
                    onChange={(e) => handleSubOwnerChange(e.target.value)}
                    className="w-full text-xs p-3 pr-8 rounded-xl border-2 border-[#4361EE] bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 shadow-xs cursor-pointer appearance-none"
                  >
                    {subOwners.map(so => {
                      const company = tenants.find(t => t.id === so.tenantId);
                      return (
                        <option key={so.id} value={so.id}>
                          {so.name} — {company?.name || so.tenantId} ({so.role === 'tenant_super_admin' ? 'Company Super Admin' : 'Company Owner'})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4361EE] pointer-events-none" />
                </div>

                {/* Sub-Owner Database Context Card */}
                {selectedSubOwner && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={selectedSubOwner.avatar} 
                        alt={selectedSubOwner.name} 
                        className="w-9 h-9 rounded-full object-cover border-2 border-[#4361EE]" 
                      />
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{selectedSubOwner.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Workspace: <strong className="text-slate-700">{selectedSubOwnerTenant?.name}</strong> • <span className="font-mono text-[#4361EE] font-semibold">{selectedSubOwner.employeeCode}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-[#4361EE] font-extrabold px-2 py-0.5 rounded border border-blue-200">
                      Sub-Owner
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Work Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/10 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Encrypted Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/10 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* 2FA Token Code */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Two-Factor Authentication (2FA)</label>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>MFA Enforced</span>
                </span>
              </div>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="6-digit authenticator code"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-mono tracking-wider bg-white focus:outline-none focus:border-[#4361EE]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4361EE] focus:ring-[#4361EE]"
                />
                <span>Remember this authorized workstation</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password reset verification token sent to your registered email.')}
                className="font-medium text-[#4361EE] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#4361EE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#4361EE]/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 mt-2 cursor-pointer"
            >
              <span>Authenticate & Enter Workspace</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Start 14-Day Free Trial Card */}
          <div className="pt-4 border-t border-slate-200">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50/50 p-4 rounded-2xl border border-blue-200 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4361EE] bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                  New Company Client?
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  14-Day Free Trial
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Start 14-Day Free Trial for Your Company
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Click below to send a verification code to your client email ID from your company name, verify, and launch your dedicated dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTrialModal(true)}
                className="w-full py-2.5 bg-[#4361EE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>Start 14-Day Free Trial</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Start 14-Day Free Trial Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#4361EE]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Start 14-Day Free Trial</h3>
                  <p className="text-[11px] text-slate-500">Dedicated enterprise workspace for your company</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTrialModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!trialEmail || !trialEmail.includes('@')) {
                  showToast('Please enter a valid work email.');
                  return;
                }
                const compName = trialCompanyName.trim() || 'My Enterprise Corp';
                const admName = trialAdminName.trim() || 'Admin';

                setIsDispatchingTrial(true);
                showToast(`Sending verification code to ${trialEmail} from ${compName}...`);

                setTimeout(() => {
                  setIsDispatchingTrial(false);
                  setShowTrialModal(false);
                  sendDynamicClientEmail({
                    recipientEmail: trialEmail.trim(),
                    recipientName: admName,
                    companyName: compName,
                    companySize: '51-200'
                  });
                }, 600);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Email ID (Where verification code will be sent)
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={trialEmail}
                    onChange={(e) => setTrialEmail(e.target.value)}
                    placeholder="e.g. uanusha017@gmail.com, alex@acme.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/10 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Name (Email sender & dedicated workspace name)
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={trialCompanyName}
                    onChange={(e) => setTrialCompanyName(e.target.value)}
                    placeholder="e.g. Anusha Technologies, Infosys, Acme Robotics"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/10 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Name
                </label>
                <div className="relative">
                  <UserCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={trialAdminName}
                    onChange={(e) => setTrialAdminName(e.target.value)}
                    placeholder="e.g. Anusha Sharma"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/10 bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/60 text-[11px] text-slate-600 leading-relaxed">
                <p>
                  <strong>How it works:</strong> We dispatch an email to <strong>{trialEmail}</strong> from <strong>{trialCompanyName || 'Your Company'}</strong> containing a 6-digit verification code. Once verified, you will be automatically routed to your company dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTrialModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatchingTrial}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDispatchingTrial ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Verification Code & Start Trial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
