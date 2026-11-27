import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Building2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  MessageCircle,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanyChatbotTemplate } from '../types';
import { computeTenantPayrollFromAttendanceAndLeaves } from '../utils/payrollCalculator';
import {
  buildTemplateResolutionContext,
  buildWhatsAppRedirectUrl,
  getCompanyAssistantName,
  getCompanyDefaultChatbotTemplates,
  resolveCompanyWhatsAppNumber,
  resolveTemplateAnswer,
  TEMPLATE_PLACEHOLDERS
} from '../utils/chatbotSupportEngine';

interface ChatbotWhatsAppConfigPanelProps {
  mode: 'company' | 'super_admin';
}

export const ChatbotWhatsAppConfigPanel: React.FC<ChatbotWhatsAppConfigPanelProps> = ({ mode }) => {
  const {
    tenants,
    currentTenant,
    users,
    attendance,
    leaves,
    demoBookings,
    platformSupportConfig,
    updatePlatformSupportConfig,
    updateCompanyWhatsAppSettings,
    addCompanyChatbotTemplate,
    updateCompanyChatbotTemplate,
    deleteCompanyChatbotTemplate,
    showToast
  } = useApp();

  // In super_admin mode, default to 'platform-root' (Main Super Admin) with selector to configure any company too
  const [selectedScopeId, setSelectedScopeId] = useState<string>(
    mode === 'super_admin' ? 'platform-root' : currentTenant.id
  );

  useEffect(() => {
    if (mode === 'company') {
      setSelectedScopeId(currentTenant.id);
    }
  }, [mode, currentTenant.id]);

  const isPlatformScope = selectedScopeId === 'platform-root';
  const targetTenant = useMemo(
    () => (isPlatformScope ? undefined : tenants.find(t => t.id === selectedScopeId) || currentTenant),
    [isPlatformScope, tenants, selectedScopeId, currentTenant]
  );

  const scopeTitle = isPlatformScope
    ? platformSupportConfig.brandName || 'NattonFlow Platform'
    : targetTenant?.name || currentTenant.name;
  const assistantTitle = getCompanyAssistantName(scopeTitle);

  const resolvedWhatsAppNumber = useMemo(
    () =>
      resolveCompanyWhatsAppNumber({
        tenant: targetTenant,
        users,
        demoBookings,
        platformSupportConfig,
        isPlatformMode: isPlatformScope
      }),
    [targetTenant, users, demoBookings, platformSupportConfig, isPlatformScope]
  );

  const [brandInput, setBrandInput] = useState(platformSupportConfig.brandName || 'NattonFlow Platform');
  const [whatsappInput, setWhatsappInput] = useState(resolvedWhatsAppNumber);
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    isPlatformScope ? platformSupportConfig.whatsappEnabled !== false : targetTenant?.whatsappEnabled !== false
  );
  const [chatbotEnabled, setChatbotEnabled] = useState(
    isPlatformScope ? platformSupportConfig.chatbotEnabled !== false : targetTenant?.chatbotEnabled !== false
  );

  // Sync local form state when switching target company or platform scope
  useEffect(() => {
    setBrandInput(platformSupportConfig.brandName || 'NattonFlow Platform');
    setWhatsappInput(resolvedWhatsAppNumber);
    setWhatsappEnabled(
      isPlatformScope ? platformSupportConfig.whatsappEnabled !== false : targetTenant?.whatsappEnabled !== false
    );
    setChatbotEnabled(
      isPlatformScope ? platformSupportConfig.chatbotEnabled !== false : targetTenant?.chatbotEnabled !== false
    );
  }, [
    selectedScopeId,
    resolvedWhatsAppNumber,
    isPlatformScope,
    platformSupportConfig.brandName,
    platformSupportConfig.whatsappEnabled,
    platformSupportConfig.chatbotEnabled,
    targetTenant?.whatsappEnabled,
    targetTenant?.chatbotEnabled
  ]);

  // Template form state
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [questionInput, setQuestionInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Custom Q&A');
  const [answerInput, setAnswerInput] = useState('');

  const livePayrollNet = useMemo(() => {
    if (isPlatformScope) {
      return tenants.reduce((acc, t) => {
        const res = computeTenantPayrollFromAttendanceAndLeaves({
          tenantId: t.id,
          cycleId: `cfg-${t.id}`,
          users,
          attendance,
          leaves
        });
        return acc + res.totals.totalNet;
      }, 0);
    }
    if (!targetTenant) return 0;
    return computeTenantPayrollFromAttendanceAndLeaves({
      tenantId: targetTenant.id,
      cycleId: `cfg-${targetTenant.id}`,
      users,
      attendance,
      leaves
    }).totals.totalNet;
  }, [isPlatformScope, tenants, targetTenant, users, attendance, leaves]);

  const previewCtx = useMemo(
    () =>
      buildTemplateResolutionContext({
        tenant: targetTenant,
        users,
        attendance,
        leaves,
        monthlyNetTotal: livePayrollNet,
        platformSupportConfig,
        isPlatformMode: isPlatformScope,
        demoBookings
      }),
    [targetTenant, users, attendance, leaves, livePayrollNet, platformSupportConfig, isPlatformScope, demoBookings]
  );

  const customTemplates: CompanyChatbotTemplate[] = useMemo(() => {
    if (isPlatformScope) return platformSupportConfig.chatbotTemplates || [];
    return targetTenant?.chatbotTemplates || [];
  }, [isPlatformScope, platformSupportConfig.chatbotTemplates, targetTenant?.chatbotTemplates]);

  const defaultTemplates: CompanyChatbotTemplate[] = useMemo(() => {
    if (isPlatformScope || !targetTenant) return [];
    return getCompanyDefaultChatbotTemplates(targetTenant);
  }, [isPlatformScope, targetTenant]);

  const askedLog = useMemo(() => {
    if (isPlatformScope) return platformSupportConfig.chatbotAskedLog || [];
    return targetTenant?.chatbotAskedLog || [];
  }, [isPlatformScope, platformSupportConfig.chatbotAskedLog, targetTenant?.chatbotAskedLog]);

  const handleSaveChannelConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPlatformScope) {
      updatePlatformSupportConfig({
        brandName: brandInput.trim() || 'NattonFlow Platform',
        whatsappNumber: whatsappInput.trim(),
        whatsappEnabled,
        chatbotEnabled
      });
      showToast('Main Super Admin WhatsApp & Assistant settings synced to cloud!');
    } else if (targetTenant) {
      updateCompanyWhatsAppSettings(targetTenant.id, {
        whatsappNumber: whatsappInput.trim(),
        whatsappEnabled,
        chatbotEnabled
      });
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !answerInput.trim()) {
      showToast('Please enter both a Question and Dynamic Answer Template.');
      return;
    }
    const targetId = isPlatformScope ? 'platform-root' : targetTenant?.id || currentTenant.id;
    if (editingTplId) {
      updateCompanyChatbotTemplate(targetId, editingTplId, {
        question: questionInput.trim(),
        category: categoryInput.trim() || 'Custom Q&A',
        answerTemplate: answerInput.trim()
      });
      setEditingTplId(null);
    } else {
      addCompanyChatbotTemplate(targetId, {
        question: questionInput.trim(),
        category: categoryInput.trim() || 'Custom Q&A',
        answerTemplate: answerInput.trim()
      });
    }
    setQuestionInput('');
    setCategoryInput('Custom Q&A');
    setAnswerInput('');
  };

  const waHref = buildWhatsAppRedirectUrl(whatsappInput, scopeTitle);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bot size={17} className="text-[#4361EE]" />
            <span>
              {mode === 'super_admin'
                ? 'Main Super Admin & Company WhatsApp + Dynamic Chatbot Control Hub'
                : `${assistantTitle} & Floating WhatsApp Redirect`}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'super_admin'
              ? 'Configure the Main Super Admin floating WhatsApp redirect & dynamic assistant templates, or manage any client company below.'
              : 'Every company owner gets a dedicated floating WhatsApp redirect icon and an automatic "{Company Name} Assistant" chatbot powered by dynamic Q&A templates.'}
          </p>
        </div>

        {/* Scope Selector in Main Super Admin mode */}
        {mode === 'super_admin' && (
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-[11px] font-bold text-slate-600">Managing:</label>
            <select
              value={selectedScopeId}
              onChange={(e) => {
                setSelectedScopeId(e.target.value);
                setEditingTplId(null);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-[#F7F9FC] text-slate-800"
            >
              <option value="platform-root">Main Super Admin ({platformSupportConfig.brandName || 'NattonFlow Platform'})</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.whatsappNumber || 'Owner Phone'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live Preview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <MessageCircle size={12} />
              <span>Floating WhatsApp Redirect Target</span>
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
              {whatsappInput || resolvedWhatsAppNumber}
            </p>
            <p className="text-[11px] text-emerald-800 truncate">
              Redirects directly to {scopeTitle} WhatsApp
            </p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <span>Open WhatsApp</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#4361EE] flex items-center gap-1">
              <Sparkles size={12} />
              <span>Dynamic Chatbot Title (&ldquo;Assistant&rdquo; Constant)</span>
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
              {assistantTitle}
            </p>
            <p className="text-[11px] text-slate-600 truncate">
              {customTemplates.length} custom template{customTemplates.length === 1 ? '' : 's'} · {askedLog.length} asked question{askedLog.length === 1 ? '' : 's'}
            </p>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-white text-[#4361EE] border border-blue-200 text-[10px] font-bold">
            {isPlatformScope ? 'ROOT ADMIN' : 'COMPANY OWNER'}
          </span>
        </div>
      </div>

      {/* WhatsApp Number & Toggle Form */}
      <form onSubmit={handleSaveChannelConfig} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          {isPlatformScope && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Main Super Admin Brand Name (&ldquo;Assistant&rdquo; stays constant)
              </label>
              <input
                type="text"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                placeholder="NattonFlow Platform"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          )}

          <div className={isPlatformScope ? '' : 'sm:col-span-2 lg:col-span-1'}>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone size={12} className="text-[#25D366]" />
              <span>{isPlatformScope ? 'Main Super Admin WhatsApp Number' : 'Company Owner WhatsApp Number'}</span>
            </label>
            <input
              type="text"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#25D366] rounded cursor-pointer"
              />
              <span>WhatsApp Icon</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={chatbotEnabled}
                onChange={(e) => setChatbotEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#4361EE] rounded cursor-pointer"
              />
              <span>Chatbot Active</span>
            </label>
          </div>

          <div className="flex justify-end lg:justify-start">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-[#14213D] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>Save WhatsApp &amp; Bot Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* Dynamic Chatbot Q&A Template Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form onSubmit={handleSaveTemplate} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Plus size={14} className="text-[#4361EE]" />
              <span>
                {editingTplId
                  ? `Edit Dynamic Q&A Template (${assistantTitle})`
                  : `Add Dynamic Question Template (${assistantTitle})`}
              </span>
            </h3>
            {editingTplId && (
              <button
                type="button"
                onClick={() => {
                  setEditingTplId(null);
                  setQuestionInput('');
                  setAnswerInput('');
                }}
                className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Question / Topic *</label>
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder={`e.g. How can I contact ${scopeTitle} HR?`}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="HR / Payroll"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Dynamic Answer Template (supports live company variables) *
            </label>
            <textarea
              rows={3}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="e.g. Contact {{companyName}} Owner ({{ownerName}}) on WhatsApp {{whatsappNumber}} or email {{ownerEmail}}."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-1.5">Click to insert live dynamic variables:</p>
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_PLACEHOLDERS.map(p => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => setAnswerInput(prev => `${prev}${prev ? ' ' : ''}${p.token}`)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#4361EE] border border-slate-200 cursor-pointer"
                  title={`${p.label}: e.g. ${p.example}`}
                >
                  {p.token}
                </button>
              ))}
            </div>
          </div>

          {answerInput.trim() && (
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-slate-700">
              <span className="font-bold text-[#4361EE]">Live Preview: </span>
              <span>{resolveTemplateAnswer(answerInput, previewCtx)}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#4361EE] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>{editingTplId ? 'Save Updated Template' : `Add to ${assistantTitle}`}</span>
          </button>
        </form>

        {/* Active Templates & Asked Questions List */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5 max-h-[360px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">
                Active Dynamic Templates for {assistantTitle} ({customTemplates.length + defaultTemplates.length})
              </h3>
            </div>

            {customTemplates.map(tpl => (
              <div key={tpl.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-[#4361EE] mr-1.5">
                      {tpl.category}
                    </span>
                    <span className="font-bold text-slate-900">{tpl.question}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTplId(tpl.id);
                        setQuestionInput(tpl.question);
                        setCategoryInput(tpl.category);
                        setAnswerInput(tpl.answerTemplate);
                      }}
                      className="p-1 text-slate-400 hover:text-[#4361EE] cursor-pointer"
                      title="Edit template"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        deleteCompanyChatbotTemplate(
                          isPlatformScope ? 'platform-root' : targetTenant?.id || currentTenant.id,
                          tpl.id
                        )
                      }
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  {resolveTemplateAnswer(tpl.answerTemplate, previewCtx)}
                </p>
                <p className="text-[9px] text-slate-400">
                  Added by {tpl.createdBy} · {tpl.createdAt}
                </p>
              </div>
            ))}

            {defaultTemplates.map(tpl => (
              <div key={tpl.id} className="bg-white/70 p-2.5 rounded-xl border border-dashed border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    {resolveTemplateAnswer(tpl.question, previewCtx)}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                    AUTO TEMPLATE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {resolveTemplateAnswer(tpl.answerTemplate, previewCtx)}
                </p>
              </div>
            ))}
          </div>

          {askedLog.length > 0 && (
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 max-h-[160px] overflow-y-auto">
              <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Recently Asked Questions ({askedLog.length})</span>
              </h4>
              {askedLog.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-700 truncate">&ldquo;{item.question}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTplId(null);
                      setQuestionInput(item.question);
                      setCategoryInput('Asked Question');
                      setAnswerInput(`{{companyName}} team response: Reach WhatsApp {{whatsappNumber}} or {{ownerEmail}}.`);
                    }}
                    className="text-[10px] font-bold text-[#4361EE] hover:underline shrink-0 cursor-pointer"
                  >
                    + Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Company Quick Matrix when viewed by Main Super Admin */}
      {mode === 'super_admin' && (
        <div className="pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#4361EE]" />
            <span>All Company Owners — Floating WhatsApp &amp; Assistant Matrix</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tenants.map(t => {
              const waNum = resolveCompanyWhatsAppNumber({
                tenant: t,
                users,
                demoBookings,
                platformSupportConfig,
                isPlatformMode: false
              });
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedScopeId(t.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedScopeId === t.id
                      ? 'border-[#4361EE] bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <Building2 size={13} className="text-[#4361EE] shrink-0" />
                      <span className="truncate">{getCompanyAssistantName(t.name)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold text-emerald-700 truncate">WA: {waNum}</span>
                    <span className="text-[10px] text-slate-500">
                      {(t.chatbotTemplates || []).length} custom Q&amp;A
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
