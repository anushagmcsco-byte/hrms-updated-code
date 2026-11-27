import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Edit3,
  ExternalLink,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanyChatbotTemplate } from '../types';
import { computeTenantPayrollFromAttendanceAndLeaves } from '../utils/payrollCalculator';
import {
  buildTemplateResolutionContext,
  buildWhatsAppRedirectUrl,
  getCompanyAssistantName,
  getCompanyDefaultChatbotTemplates,
  matchChatbotQuestion,
  resolveCompanyWhatsAppNumber,
  resolveTemplateAnswer,
  TEMPLATE_PLACEHOLDERS
} from '../utils/chatbotSupportEngine';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  askedQuestion?: string;
  matchedTemplateId?: string;
  confidence?: 'exact' | 'keyword' | 'fallback';
  suggestedTemplateDraft?: {
    question: string;
    keywords: string[];
    answerTemplate: string;
    category: string;
  };
  addedToTemplate?: boolean;
}

export const FloatingSupportDock: React.FC = () => {
  const {
    currentUser,
    currentTenant,
    currentView,
    tenants,
    users,
    attendance,
    leaves,
    demoBookings,
    platformSupportConfig,
    updateCompanyWhatsAppSettings,
    addCompanyChatbotTemplate,
    updateCompanyChatbotTemplate,
    deleteCompanyChatbotTemplate,
    recordChatbotQuestionAsked,
    isAuthenticated,
    showToast
  } = useApp();

  const isMainSuperAdmin = currentUser.role === 'super_admin' || Boolean(currentUser.isAppOwner);
  const canManageTemplates =
    isMainSuperAdmin ||
    currentUser.role === 'tenant_super_admin' ||
    currentUser.role === 'company_owner' ||
    currentUser.role === 'hr_admin';

  // Main Super Admin can toggle between Platform Root (Main Super Admin) and Active Company Tenant
  const [scopeMode, setScopeMode] = useState<'platform' | 'tenant'>(
    currentView === 'super_admin' ? 'platform' : 'tenant'
  );

  useEffect(() => {
    if (!isMainSuperAdmin) {
      setScopeMode('tenant');
    } else if (currentView === 'super_admin') {
      setScopeMode('platform');
    }
  }, [isMainSuperAdmin, currentView]);

  const effectiveIsPlatform = isMainSuperAdmin && scopeMode === 'platform';
  const targetScopeId: string | 'platform-root' = effectiveIsPlatform ? 'platform-root' : currentTenant.id;

  const activeCompanyName = effectiveIsPlatform
    ? platformSupportConfig.brandName || 'NattonFlow Platform'
    : currentTenant.name;
  const assistantTitle = getCompanyAssistantName(activeCompanyName);

  const activeWhatsAppNumber = useMemo(
    () =>
      resolveCompanyWhatsAppNumber({
        tenant: currentTenant,
        users,
        demoBookings,
        platformSupportConfig,
        isPlatformMode: effectiveIsPlatform
      }),
    [currentTenant, users, demoBookings, platformSupportConfig, effectiveIsPlatform]
  );

  const whatsAppRedirectUrl = useMemo(
    () => buildWhatsAppRedirectUrl(activeWhatsAppNumber, activeCompanyName),
    [activeWhatsAppNumber, activeCompanyName]
  );

  const whatsappEnabled = effectiveIsPlatform
    ? platformSupportConfig.whatsappEnabled !== false
    : currentTenant.whatsappEnabled !== false;
  const chatbotEnabled = effectiveIsPlatform
    ? platformSupportConfig.chatbotEnabled !== false
    : currentTenant.chatbotEnabled !== false;

  const livePayrollNet = useMemo(() => {
    if (effectiveIsPlatform) {
      return tenants.reduce((acc, t) => {
        const res = computeTenantPayrollFromAttendanceAndLeaves({
          tenantId: t.id,
          cycleId: `chatbot-${t.id}`,
          users,
          attendance,
          leaves
        });
        return acc + res.totals.totalNet;
      }, 0);
    }
    return computeTenantPayrollFromAttendanceAndLeaves({
      tenantId: currentTenant.id,
      cycleId: `chatbot-${currentTenant.id}`,
      users,
      attendance,
      leaves
    }).totals.totalNet;
  }, [effectiveIsPlatform, tenants, currentTenant.id, users, attendance, leaves]);

  const templateCtx = useMemo(
    () =>
      buildTemplateResolutionContext({
        tenant: currentTenant,
        users,
        attendance,
        leaves,
        monthlyNetTotal: livePayrollNet,
        platformSupportConfig,
        isPlatformMode: effectiveIsPlatform,
        demoBookings
      }),
    [currentTenant, users, attendance, leaves, livePayrollNet, platformSupportConfig, effectiveIsPlatform, demoBookings]
  );

  const customTemplates: CompanyChatbotTemplate[] = useMemo(() => {
    if (effectiveIsPlatform) {
      return platformSupportConfig.chatbotTemplates || [];
    }
    return currentTenant.chatbotTemplates || [];
  }, [effectiveIsPlatform, platformSupportConfig.chatbotTemplates, currentTenant.chatbotTemplates]);

  const combinedTemplates: CompanyChatbotTemplate[] = useMemo(() => {
    if (effectiveIsPlatform) {
      return customTemplates;
    }
    const defaults = getCompanyDefaultChatbotTemplates(currentTenant);
    return [...customTemplates, ...defaults];
  }, [effectiveIsPlatform, customTemplates, currentTenant]);

  const askedQuestionsLog = useMemo(() => {
    if (effectiveIsPlatform) {
      return platformSupportConfig.chatbotAskedLog || [];
    }
    return currentTenant.chatbotAskedLog || [];
  }, [effectiveIsPlatform, platformSupportConfig.chatbotAskedLog, currentTenant.chatbotAskedLog]);

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'templates'>('chat');
  const [inputText, setInputText] = useState('');
  const [autoLearnAsked, setAutoLearnAsked] = useState(true);
  const [messagesByScope, setMessagesByScope] = useState<Record<string, ChatMessage[]>>({});

  // Inline template editor / creator state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplQuestion, setTplQuestion] = useState('');
  const [tplAnswer, setTplAnswer] = useState('');
  const [tplCategory, setTplCategory] = useState('Custom Q&A');
  const [phoneInput, setPhoneInput] = useState(activeWhatsAppNumber);

  useEffect(() => {
    setPhoneInput(activeWhatsAppNumber);
  }, [activeWhatsAppNumber, targetScopeId]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const currentMessages = useMemo(() => {
    const existing = messagesByScope[targetScopeId];
    if (existing && existing.length > 0) return existing;
    const welcome: ChatMessage = {
      id: `welcome-${targetScopeId}`,
      sender: 'bot',
      text: `Hello${isAuthenticated ? ` ${currentUser.name.split(' ')[0]}` : ''}! I am ${assistantTitle}. Ask me anything about ${activeCompanyName} — payroll, attendance, leaves, demo bookings, or WhatsApp support (${activeWhatsAppNumber}). Any related question you ask can also be saved directly to my dynamic template!`,
      timestamp: 'Live'
    };
    return [welcome];
  }, [messagesByScope, targetScopeId, isAuthenticated, currentUser.name, assistantTitle, activeCompanyName, activeWhatsAppNumber]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length, isOpen, activeTab]);

  const handleAskQuestion = (rawQuestion: string) => {
    const cleanQ = rawQuestion.trim();
    if (!cleanQ) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: cleanQ,
      timestamp: nowTime
    };

    const match = matchChatbotQuestion({
      questionText: cleanQ,
      templates: combinedTemplates,
      ctx: templateCtx
    });

    const alreadyCustomSaved = customTemplates.some(
      t => t.question.trim().toLowerCase() === cleanQ.toLowerCase()
    );

    const shouldAutoAdd =
      autoLearnAsked && !alreadyCustomSaved && (match.confidence !== 'exact' || !match.matchedTemplate);

    recordChatbotQuestionAsked(
      targetScopeId,
      cleanQ,
      match.matchedTemplate?.id,
      shouldAutoAdd
        ? {
            answerTemplate: match.suggestedTemplateDraft.answerTemplate,
            category: match.suggestedTemplateDraft.category
          }
        : undefined
    );

    const botMsg: ChatMessage = {
      id: `b-${Date.now() + 1}`,
      sender: 'bot',
      text: match.renderedAnswer,
      timestamp: nowTime,
      askedQuestion: cleanQ,
      matchedTemplateId: match.matchedTemplate?.id,
      confidence: match.confidence,
      suggestedTemplateDraft: match.suggestedTemplateDraft,
      addedToTemplate: shouldAutoAdd || alreadyCustomSaved
    };

    setMessagesByScope(prev => {
      const base = prev[targetScopeId] && prev[targetScopeId].length > 0 ? prev[targetScopeId] : currentMessages;
      return {
        ...prev,
        [targetScopeId]: [...base, userMsg, botMsg]
      };
    });
    setInputText('');
  };

  const handleSaveAskedMessageAsTemplate = (msg: ChatMessage) => {
    if (!msg.suggestedTemplateDraft) return;
    setTplQuestion(msg.suggestedTemplateDraft.question);
    setTplAnswer(msg.suggestedTemplateDraft.answerTemplate);
    setTplCategory(msg.suggestedTemplateDraft.category || 'Custom Q&A');
    setEditingTemplateId(null);
    setActiveTab('templates');
  };

  const handleSaveTemplateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplQuestion.trim() || !tplAnswer.trim()) {
      showToast('Please enter both a question and a dynamic answer template.');
      return;
    }
    if (editingTemplateId) {
      updateCompanyChatbotTemplate(targetScopeId, editingTemplateId, {
        question: tplQuestion.trim(),
        answerTemplate: tplAnswer.trim(),
        category: tplCategory.trim() || 'Custom Q&A'
      });
      setEditingTemplateId(null);
    } else {
      addCompanyChatbotTemplate(targetScopeId, {
        question: tplQuestion.trim(),
        answerTemplate: tplAnswer.trim(),
        category: tplCategory.trim() || 'Custom Q&A'
      });
    }
    setTplQuestion('');
    setTplAnswer('');
    setTplCategory('Custom Q&A');
  };

  const handleSaveWhatsAppNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    updateCompanyWhatsAppSettings(targetScopeId, { whatsappNumber: phoneInput.trim() });
  };

  const quickQuestions = useMemo(() => {
    return combinedTemplates.slice(0, 4).map(t => ({
      id: t.id,
      label: resolveTemplateAnswer(t.question, templateCtx)
    }));
  }, [combinedTemplates, templateCtx]);

  if (!whatsappEnabled && !chatbotEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Expanded Dynamic Company Assistant Chatbot Window */}
      {isOpen && chatbotEnabled && (
        <div className="pointer-events-auto w-[calc(100vw-2rem)] sm:w-[400px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header: Always "{Company Name} Assistant" */}
          <div className="bg-[#14213D] text-white p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#4361EE] flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold truncate leading-tight">
                  {assistantTitle}
                </h3>
                <p className="text-[10px] text-blue-200 truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>
                    {effectiveIsPlatform ? 'Main Super Admin' : currentTenant.name} · WA: {activeWhatsAppNumber}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {whatsappEnabled && (
                <a
                  href={whatsAppRedirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open WhatsApp (${activeWhatsAppNumber})`}
                  className="p-1.5 rounded-lg bg-[#25D366] hover:bg-emerald-500 text-white transition-colors"
                >
                  <MessageCircle size={15} />
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Main Super Admin Scope Switcher (Platform Root vs Active Client Company) */}
          {isMainSuperAdmin && (
            <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between gap-2 text-[10px] border-t border-slate-800">
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <ShieldCheck size={12} />
                <span>Super Admin Scope:</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setScopeMode('platform')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    scopeMode === 'platform' ? 'bg-[#4361EE] text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Main Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setScopeMode('tenant')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer truncate max-w-[130px] ${
                    scopeMode === 'tenant' ? 'bg-[#4361EE] text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {currentTenant.name}
                </button>
              </div>
            </div>
          )}

          {/* Mode Tabs: Chat vs Dynamic Template Builder */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'chat'
                    ? 'bg-[#4361EE] text-white'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Sparkles size={12} />
                <span>Ask Assistant</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'templates'
                    ? 'bg-[#4361EE] text-white'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Settings2 size={12} />
                <span>Templates ({customTemplates.length})</span>
              </button>
            </div>

            <label
              className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 cursor-pointer"
              title="Automatically add newly asked related questions into this company's chatbot template library"
            >
              <input
                type="checkbox"
                checked={autoLearnAsked}
                onChange={(e) => setAutoLearnAsked(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#4361EE] rounded cursor-pointer"
              />
              <span>Auto-add Q&A</span>
            </label>
          </div>

          {/* Body: Chat Tab */}
          {activeTab === 'chat' ? (
            <>
              {/* Quick Prompts */}
              <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {quickQuestions.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleAskQuestion(q.label)}
                    className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#4361EE] hover:bg-blue-100 border border-blue-100 transition-colors cursor-pointer"
                  >
                    {q.label.length > 36 ? q.label.slice(0, 36) + '…' : q.label}
                  </button>
                ))}
              </div>

              {/* Conversation History */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F7F9FC] min-h-[240px] max-h-[340px]">
                {currentMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#4361EE] text-white rounded-br-sm'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.sender === 'bot' && msg.askedQuestion && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                            <Check size={11} />
                            <span>
                              {msg.addedToTemplate
                                ? 'Added to company template'
                                : 'Matched dynamic template'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSaveAskedMessageAsTemplate(msg)}
                            className="text-[10px] font-bold text-[#4361EE] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={10} />
                            <span>{msg.addedToTemplate ? 'Edit Template' : '+ Add to Template'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion(inputText);
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask ${assistantTitle}...`}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#4361EE]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-[#4361EE] hover:bg-blue-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            /* Dynamic Template & WhatsApp Number Manager inside the Chatbot */
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-[#F7F9FC] max-h-[430px]">
              {/* WhatsApp Redirect Number Config */}
              <form
                onSubmit={handleSaveWhatsAppNumber}
                className="bg-white p-3 rounded-xl border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#25D366]" />
                    <span>WhatsApp Icon Redirect ({activeCompanyName})</span>
                  </span>
                  <a
                    href={whatsAppRedirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[#25D366] hover:underline flex items-center gap-0.5"
                  >
                    <span>Test Link</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    disabled={!canManageTemplates}
                    placeholder="+91 98765 43210"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                  {canManageTemplates && (
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  )}
                </div>
              </form>

              {/* Add / Edit Dynamic Q&A Template Form */}
              <form
                onSubmit={handleSaveTemplateForm}
                className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    {editingTemplateId ? 'Edit Dynamic Q&A Template' : `Add Q&A to ${assistantTitle}`}
                  </h4>
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setTplQuestion('');
                        setTplAnswer('');
                      }}
                      className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={tplQuestion}
                  onChange={(e) => setTplQuestion(e.target.value)}
                  placeholder="Question (e.g. What is our leave encashment policy?)"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value)}
                    placeholder="Category"
                    className="w-1/2 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 truncate">
                    Auto-resolves {"{{companyName}}"} &amp; live stats
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={tplAnswer}
                  onChange={(e) => setTplAnswer(e.target.value)}
                  placeholder="Dynamic Answer Template (use {{companyName}}, {{whatsappNumber}}, {{ownerEmail}}, {{payrollNet}}...)"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                />

                {/* Quick Insert Variable Chips */}
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_PLACEHOLDERS.slice(0, 6).map(p => (
                    <button
                      key={p.token}
                      type="button"
                      onClick={() => setTplAnswer(prev => `${prev}${prev ? ' ' : ''}${p.token}`)}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#4361EE] border border-slate-200 cursor-pointer"
                    >
                      +{p.token}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#4361EE] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{editingTemplateId ? 'Update Dynamic Template' : 'Add Question Template to Chatbot'}</span>
                </button>
              </form>

              {/* Saved Custom Templates List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Saved Company Templates ({customTemplates.length})</span>
                  <span>Asked Log ({askedQuestionsLog.length})</span>
                </div>

                {customTemplates.length === 0 ? (
                  <p className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                    Ask any question in the chat tab with &ldquo;Auto-add Q&amp;A&rdquo; checked, or add a custom dynamic template above.
                  </p>
                ) : (
                  customTemplates.map(tpl => (
                    <div
                      key={tpl.id}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-900 leading-snug">{tpl.question}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplateId(tpl.id);
                              setTplQuestion(tpl.question);
                              setTplAnswer(tpl.answerTemplate);
                              setTplCategory(tpl.category);
                            }}
                            className="p-1 text-slate-400 hover:text-[#4361EE] cursor-pointer"
                            title="Edit template"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCompanyChatbotTemplate(targetScopeId, tpl.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {resolveTemplateAnswer(tpl.answerTemplate, templateCtx)}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                        <span>{tpl.category}</span>
                        <span>By {tpl.createdBy}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Dock Launcher Icons (WhatsApp + "{Company Name} Assistant" Chatbot) */}
      <div className="pointer-events-auto flex items-center gap-2.5">
        {whatsappEnabled && (
          <a
            href={whatsAppRedirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${activeCompanyName} (${activeWhatsAppNumber})`}
            className="group relative flex items-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white px-3.5 py-3 rounded-full shadow-xl border-2 border-white transition-all hover:scale-105"
          >
            <MessageCircle size={20} className="shrink-0" />
            <span className="hidden md:inline text-xs font-bold pr-0.5 max-w-[160px] truncate">
              WhatsApp · {activeWhatsAppNumber}
            </span>
            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full right-0 mb-2 whitespace-nowrap bg-[#14213D] text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700">
              Redirect to {activeCompanyName} WhatsApp ({activeWhatsAppNumber})
            </span>
          </a>
        )}

        {chatbotEnabled && (
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={`Open ${assistantTitle}`}
            className="flex items-center gap-2 bg-[#4361EE] hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-xl border-2 border-white transition-all hover:scale-105 cursor-pointer"
          >
            <Bot size={20} className="shrink-0" />
            <span className="text-xs font-bold max-w-[190px] truncate">
              {assistantTitle}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
