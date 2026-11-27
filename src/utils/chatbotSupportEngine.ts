import {
  AttendanceRecord,
  ClientDemoBooking,
  CompanyChatbotTemplate,
  LeaveRequest,
  PlatformSupportConfig,
  Tenant,
  User
} from '../types';

export const CONSTANT_ASSISTANT_SUFFIX = 'Assistant';

export const TEMPLATE_PLACEHOLDERS: Array<{ token: string; label: string; example: string }> = [
  { token: '{{companyName}}', label: 'Company Name', example: 'Acme Cloud Technologies' },
  { token: '{{assistantName}}', label: 'Assistant Title', example: 'Acme Cloud Technologies Assistant' },
  { token: '{{whatsappNumber}}', label: 'WhatsApp Number', example: '+91 98201 99882' },
  { token: '{{ownerName}}', label: 'Owner / Super Admin', example: 'Vikram Malhotra' },
  { token: '{{ownerEmail}}', label: 'Owner Email', example: 'vikram.m@acmecloud.io' },
  { token: '{{hrEmail}}', label: 'HR Email', example: 'hr@acmecloud.io' },
  { token: '{{domain}}', label: 'Company Domain', example: 'acmecloud.io' },
  { token: '{{plan}}', label: 'Plan Tier', example: 'Enterprise' },
  { token: '{{currency}}', label: 'Payroll Currency', example: 'INR (₹)' },
  { token: '{{timezone}}', label: 'Timezone', example: 'Asia/Kolkata (IST)' },
  { token: '{{headcount}}', label: 'Active Staff', example: '12' },
  { token: '{{presentToday}}', label: 'Present Today', example: '9' },
  { token: '{{pendingLeaves}}', label: 'Pending Leaves', example: '2' },
  { token: '{{payrollNet}}', label: 'Monthly Net Payroll', example: '₹4,85,000' }
];

export const DEFAULT_PLATFORM_WHATSAPP = '+91 98450 11223';

export const DEFAULT_PLATFORM_TEMPLATES: CompanyChatbotTemplate[] = [
  {
    id: 'tpl-platform-welcome',
    question: 'What can {{assistantName}} help me with?',
    keywords: ['help', 'what', 'features', 'capabilities', 'assistant', 'support', 'hello', 'hi'],
    answerTemplate:
      'Welcome to {{assistantName}}! I support Main Super Admin & all client organizations with tenant provisioning, WhatsApp routing ({{whatsappNumber}}), live demo bookings, 8-stage payroll governance, and attendance/leave policies.',
    category: 'General',
    createdBy: 'Main Super Admin',
    createdAt: '2026-01-01'
  },
  {
    id: 'tpl-platform-whatsapp',
    question: 'How do I contact the Main Super Admin or Company Owner on WhatsApp?',
    keywords: ['whatsapp', 'contact', 'phone', 'number', 'call', 'owner', 'super admin', 'support'],
    answerTemplate:
      'You can reach {{companyName}} directly on WhatsApp at {{whatsappNumber}} (Owner/Admin: {{ownerName}}, {{ownerEmail}}). Click the green floating WhatsApp icon at the bottom-right to open WhatsApp immediately.',
    category: 'WhatsApp & Contact',
    createdBy: 'Main Super Admin',
    createdAt: '2026-01-01'
  },
  {
    id: 'tpl-platform-demo',
    question: 'How do live demo bookings, SMS/WhatsApp alerts, and dual emails work?',
    keywords: ['demo', 'book', 'sms', 'email', 'trial', 'schedule', 'onboarding'],
    answerTemplate:
      'When a live demo is booked for {{companyName}}, verification OTP & confirmation dispatches are sent via SMS/WhatsApp to the client number, emails are sent to both the Client and Company Owner ({{ownerEmail}}), and the company Super Admin & HR Admin workspaces sync immediately.',
    category: 'Demo & Onboarding',
    createdBy: 'Main Super Admin',
    createdAt: '2026-01-01'
  },
  {
    id: 'tpl-platform-payroll',
    question: 'How is monthly payroll calculated in {{companyName}}?',
    keywords: ['payroll', 'salary', 'payslip', 'net', 'deduction', 'pf', 'esi', 'lop', 'ctc'],
    answerTemplate:
      '{{companyName}} computes payroll in {{currency}} automatically from live Attendance logs and approved/unpaid Leaves. Current projected net payout across {{headcount}} team members is {{payrollNet}}.',
    category: 'Payroll',
    createdBy: 'Main Super Admin',
    createdAt: '2026-01-01'
  }
];

export const DEFAULT_PLATFORM_SUPPORT_CONFIG: PlatformSupportConfig = {
  id: 'platform_support_config',
  brandName: 'NattonFlow Platform',
  whatsappNumber: DEFAULT_PLATFORM_WHATSAPP,
  whatsappEnabled: true,
  chatbotEnabled: true,
  chatbotTemplates: DEFAULT_PLATFORM_TEMPLATES,
  chatbotAskedLog: []
};

export function getCompanyDefaultChatbotTemplates(tenant: Tenant): CompanyChatbotTemplate[] {
  return [
    {
      id: `tpl-default-${tenant.id}-intro`,
      question: `How does {{assistantName}} help {{companyName}}?`,
      keywords: ['help', 'hello', 'hi', 'about', 'company', 'assistant', 'info', 'overview'],
      answerTemplate:
        'Hello! I am {{assistantName}} for {{companyName}} ({{domain}}). Plan: {{plan}} · Timezone: {{timezone}} · Currency: {{currency}}. Active workforce: {{headcount}} employees. Reach our Owner ({{ownerName}}) anytime via WhatsApp at {{whatsappNumber}}.',
      category: 'Company Overview',
      createdBy: 'System Dynamic Template',
      createdAt: tenant.createdAt || '2026-01-01'
    },
    {
      id: `tpl-default-${tenant.id}-whatsapp`,
      question: `What is {{companyName}}'s WhatsApp & Owner contact?`,
      keywords: ['whatsapp', 'number', 'phone', 'contact', 'owner', 'admin', 'hr', 'email', 'reach'],
      answerTemplate:
        'Direct WhatsApp support for {{companyName}} is {{whatsappNumber}}. Company Owner / Super Admin: {{ownerName}} ({{ownerEmail}}). HR Admin contact: {{hrEmail}}. Tap the floating WhatsApp icon to start chatting directly.',
      category: 'WhatsApp & Contact',
      createdBy: 'System Dynamic Template',
      createdAt: tenant.createdAt || '2026-01-01'
    },
    {
      id: `tpl-default-${tenant.id}-attendance`,
      question: `What is today's attendance and leave status at {{companyName}}?`,
      keywords: ['attendance', 'present', 'checkin', 'check-in', 'leave', 'holiday', 'absent', 'shift'],
      answerTemplate:
        'Today at {{companyName}}, {{presentToday}} check-ins are logged out of {{headcount}} staff, and there are {{pendingLeaves}} pending leave requests awaiting manager/HR approval.',
      category: 'Attendance & Leaves',
      createdBy: 'System Dynamic Template',
      createdAt: tenant.createdAt || '2026-01-01'
    },
    {
      id: `tpl-default-${tenant.id}-payroll`,
      question: `What is {{companyName}}'s payroll cycle & net payout?`,
      keywords: ['payroll', 'salary', 'payslip', 'pay', 'net', 'tax', 'pf', 'allowance'],
      answerTemplate:
        '{{companyName}} processes payroll in {{currency}} under timezone {{timezone}}. Current attendance & leave synced monthly net payout is {{payrollNet}} across {{headcount}} employees.',
      category: 'Payroll',
      createdBy: 'System Dynamic Template',
      createdAt: tenant.createdAt || '2026-01-01'
    }
  ];
}

export function formatWhatsAppDigits(rawPhone?: string): string {
  const digits = (rawPhone || '').replace(/[^\d]/g, '');
  if (!digits) return '919845011223';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildWhatsAppRedirectUrl(phone?: string, companyName?: string): string {
  const digits = formatWhatsAppDigits(phone);
  const message = companyName
    ? `Hello ${companyName} Team, I would like to connect regarding your HRMS workspace.`
    : 'Hello NattonFlow Support, I would like to connect.';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getCompanyAssistantName(companyName?: string): string {
  const cleanName = (companyName || 'Company').trim();
  return `${cleanName} ${CONSTANT_ASSISTANT_SUFFIX}`;
}

export function resolveCompanyWhatsAppNumber(params: {
  tenant?: Tenant;
  users: User[];
  demoBookings?: ClientDemoBooking[];
  platformSupportConfig?: PlatformSupportConfig;
  isPlatformMode?: boolean;
}): string {
  const { tenant, users, demoBookings = [], platformSupportConfig, isPlatformMode } = params;
  if (isPlatformMode) {
    return platformSupportConfig?.whatsappNumber?.trim() || DEFAULT_PLATFORM_WHATSAPP;
  }
  if (tenant?.whatsappNumber && tenant.whatsappNumber.trim()) {
    return tenant.whatsappNumber.trim();
  }
  if (tenant) {
    const ownerOrSuperAdmin =
      users.find(u => u.tenantId === tenant.id && u.role === 'company_owner' && u.phone?.trim()) ||
      users.find(u => u.tenantId === tenant.id && u.role === 'tenant_super_admin' && u.phone?.trim()) ||
      users.find(u => u.tenantId === tenant.id && u.role === 'hr_admin' && u.phone?.trim());
    if (ownerOrSuperAdmin?.phone) {
      return ownerOrSuperAdmin.phone.trim();
    }
    const latestBooking = demoBookings.find(
      b =>
        (b.linkedTenantId === tenant.id ||
          b.companyName.trim().toLowerCase() === tenant.name.trim().toLowerCase()) &&
        b.phone?.trim()
    );
    if (latestBooking?.phone) {
      return latestBooking.phone.trim();
    }
  }
  return platformSupportConfig?.whatsappNumber?.trim() || DEFAULT_PLATFORM_WHATSAPP;
}

export interface TemplateResolutionContext {
  companyName: string;
  whatsappNumber: string;
  ownerName: string;
  ownerEmail: string;
  hrEmail: string;
  domain: string;
  plan: string;
  currency: string;
  timezone: string;
  headcount: number;
  presentToday: number;
  pendingLeaves: number;
  payrollNet: string;
}

export function buildTemplateResolutionContext(params: {
  tenant?: Tenant;
  users: User[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  monthlyNetTotal: number;
  platformSupportConfig: PlatformSupportConfig;
  isPlatformMode: boolean;
  demoBookings?: ClientDemoBooking[];
}): TemplateResolutionContext {
  const {
    tenant,
    users,
    attendance,
    leaves,
    monthlyNetTotal,
    platformSupportConfig,
    isPlatformMode,
    demoBookings
  } = params;

  if (isPlatformMode || !tenant) {
    const appOwner = users.find(u => u.isAppOwner || u.role === 'super_admin');
    return {
      companyName: platformSupportConfig.brandName || 'NattonFlow Platform',
      whatsappNumber: platformSupportConfig.whatsappNumber || DEFAULT_PLATFORM_WHATSAPP,
      ownerName: appOwner?.name || 'Application Owner',
      ownerEmail: appOwner?.email || 'owner@nattonflow.internal',
      hrEmail: 'support@nattonflow.com',
      domain: 'nattonflow.hr',
      plan: 'Root Multi-Tenant SaaS',
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata (IST)',
      headcount: users.length,
      presentToday: attendance.filter(a => a.status === 'present' || a.status === 'remote' || a.status === 'late').length,
      pendingLeaves: leaves.filter(l => l.status === 'pending').length,
      payrollNet: `₹${Math.round(monthlyNetTotal).toLocaleString('en-IN')}`
    };
  }

  const tenantUsers = users.filter(u => u.tenantId === tenant.id);
  const owner =
    tenantUsers.find(u => u.role === 'company_owner') ||
    tenantUsers.find(u => u.role === 'tenant_super_admin') ||
    tenantUsers[0];
  const hrAdmin = tenantUsers.find(u => u.role === 'hr_admin') || owner;
  const todayStr = new Date().toISOString().split('T')[0];
  const tenantAtt = attendance.filter(a => a.tenantId === tenant.id);
  const todayAtt = tenantAtt.filter(a => a.date === todayStr);
  const presentCount = (todayAtt.length > 0 ? todayAtt : tenantAtt).filter(
    a => a.status === 'present' || a.status === 'remote' || a.status === 'late'
  ).length;
  const pendingLeaveCount = leaves.filter(l => l.tenantId === tenant.id && l.status === 'pending').length;

  const currencySymbol = tenant.currency.includes('$')
    ? '$'
    : tenant.currency.includes('€')
      ? '€'
      : tenant.currency.includes('£')
        ? '£'
        : '₹';

  return {
    companyName: tenant.name,
    whatsappNumber: resolveCompanyWhatsAppNumber({
      tenant,
      users,
      demoBookings,
      platformSupportConfig,
      isPlatformMode: false
    }),
    ownerName: owner?.name || `${tenant.name} Owner`,
    ownerEmail: owner?.email || `owner@${tenant.domain}`,
    hrEmail: hrAdmin?.email || `hr@${tenant.domain}`,
    domain: tenant.domain,
    plan: tenant.plan,
    currency: tenant.currency,
    timezone: tenant.timezone,
    headcount: Math.max(tenantUsers.length, 1),
    presentToday: presentCount,
    pendingLeaves: pendingLeaveCount,
    payrollNet: `${currencySymbol}${Math.round(monthlyNetTotal).toLocaleString('en-IN')}`
  };
}

export function resolveTemplateAnswer(templateText: string, ctx: TemplateResolutionContext): string {
  const assistantName = getCompanyAssistantName(ctx.companyName);
  const replacements: Record<string, string> = {
    '{{companyName}}': ctx.companyName,
    '{{assistantName}}': assistantName,
    '{{whatsappNumber}}': ctx.whatsappNumber,
    '{{ownerName}}': ctx.ownerName,
    '{{ownerEmail}}': ctx.ownerEmail,
    '{{hrEmail}}': ctx.hrEmail,
    '{{domain}}': ctx.domain,
    '{{plan}}': ctx.plan,
    '{{currency}}': ctx.currency,
    '{{timezone}}': ctx.timezone,
    '{{headcount}}': String(ctx.headcount),
    '{{presentToday}}': String(ctx.presentToday),
    '{{pendingLeaves}}': String(ctx.pendingLeaves),
    '{{payrollNet}}': ctx.payrollNet
  };

  let output = templateText;
  Object.entries(replacements).forEach(([token, val]) => {
    output = output.split(token).join(val);
  });
  return output;
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'for', 'to', 'in', 'of', 'how',
  'what', 'when', 'where', 'who', 'why', 'can', 'do', 'does', 'i', 'me', 'my', 'we', 'our',
  'with', 'about', 'tell', 'please', 'get', 'show', 'have', 'has', 'are', 'you', 'this', 'that'
]);

export function extractKeywordsFromText(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(words)).slice(0, 10);
}

export function buildSuggestedAnswerTemplateForQuestion(questionText: string): string {
  const q = questionText.toLowerCase();
  if (q.includes('whatsapp') || q.includes('phone') || q.includes('number') || q.includes('call') || q.includes('contact')) {
    return 'For {{companyName}}, our dedicated WhatsApp contact is {{whatsappNumber}} (Owner: {{ownerName}}, {{ownerEmail}} | HR: {{hrEmail}}).';
  }
  if (q.includes('payroll') || q.includes('salary') || q.includes('payslip') || q.includes('pay') || q.includes('tax') || q.includes('pf')) {
    return '{{companyName}} payroll runs in {{currency}} ({{timezone}}). Current synced monthly net payroll is {{payrollNet}} across {{headcount}} team members.';
  }
  if (q.includes('leave') || q.includes('holiday') || q.includes('pto') || q.includes('vacation') || q.includes('absent')) {
    return '{{companyName}} currently has {{pendingLeaves}} pending leave requests. Employees can apply for Paid, Sick, or Casual leave and managers/HR review them directly.';
  }
  if (q.includes('attendance') || q.includes('check') || q.includes('punch') || q.includes('shift') || q.includes('time')) {
    return 'At {{companyName}}, {{presentToday}} check-ins are active today out of {{headcount}} staff under timezone {{timezone}}.';
  }
  if (q.includes('employee') || q.includes('staff') || q.includes('headcount') || q.includes('team') || q.includes('onboard')) {
    return '{{companyName}} ({{domain}}) currently manages {{headcount}} active staff members on the {{plan}} plan. Reach HR at {{hrEmail}} or WhatsApp {{whatsappNumber}}.';
  }
  if (q.includes('demo') || q.includes('book') || q.includes('trial') || q.includes('email')) {
    return 'Live demo & onboarding dispatches for {{companyName}} send SMS/WhatsApp to {{whatsappNumber}} and emails to both Client & Owner ({{ownerEmail}}).';
  }
  return 'Thanks for asking "{{companyName}}" via {{assistantName}}! Our team ({{ownerName}}, {{ownerEmail}} | WhatsApp: {{whatsappNumber}}) can assist with this under our {{plan}} workspace ({{domain}}).';
}

export interface ChatbotMatchResult {
  matchedTemplate: CompanyChatbotTemplate | null;
  renderedAnswer: string;
  confidence: 'exact' | 'keyword' | 'fallback';
  suggestedTemplateDraft: {
    question: string;
    keywords: string[];
    answerTemplate: string;
    category: string;
  };
}

export function matchChatbotQuestion(params: {
  questionText: string;
  templates: CompanyChatbotTemplate[];
  ctx: TemplateResolutionContext;
}): ChatbotMatchResult {
  const { questionText, templates, ctx } = params;
  const cleanQ = questionText.trim().toLowerCase();
  const qTokens = extractKeywordsFromText(questionText);

  let bestTemplate: CompanyChatbotTemplate | null = null;
  let bestScore = 0;

  for (const tpl of templates) {
    const resolvedQ = resolveTemplateAnswer(tpl.question, ctx).toLowerCase();
    if (resolvedQ === cleanQ) {
      bestTemplate = tpl;
      bestScore = 100;
      break;
    }

    let score = 0;
    const tplKeywords = new Set([
      ...tpl.keywords.map(k => k.toLowerCase()),
      ...extractKeywordsFromText(resolvedQ)
    ]);

    for (const token of qTokens) {
      if (tplKeywords.has(token)) {
        score += 3;
      } else {
        for (const kw of tplKeywords) {
          if (kw.includes(token) || token.includes(kw)) {
            score += 1.5;
            break;
          }
        }
      }
    }

    if (resolvedQ.includes(cleanQ) || cleanQ.includes(resolvedQ)) {
      score += 4;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTemplate = tpl;
    }
  }

  const inferredCategory =
    cleanQ.includes('whatsapp') || cleanQ.includes('contact') || cleanQ.includes('phone')
      ? 'WhatsApp & Contact'
      : cleanQ.includes('payroll') || cleanQ.includes('salary') || cleanQ.includes('payslip')
        ? 'Payroll'
        : cleanQ.includes('attendance') || cleanQ.includes('leave') || cleanQ.includes('shift')
          ? 'Attendance & Leaves'
          : cleanQ.includes('demo') || cleanQ.includes('trial')
            ? 'Demo & Onboarding'
            : 'Custom Q&A';

  const suggestedAnswerTemplate = buildSuggestedAnswerTemplateForQuestion(questionText);

  if (bestTemplate && bestScore >= 3) {
    return {
      matchedTemplate: bestTemplate,
      renderedAnswer: resolveTemplateAnswer(bestTemplate.answerTemplate, ctx),
      confidence: bestScore >= 100 ? 'exact' : 'keyword',
      suggestedTemplateDraft: {
        question: questionText.trim(),
        keywords: qTokens,
        answerTemplate: bestTemplate.answerTemplate,
        category: bestTemplate.category || inferredCategory
      }
    };
  }

  return {
    matchedTemplate: null,
    renderedAnswer: resolveTemplateAnswer(suggestedAnswerTemplate, ctx),
    confidence: 'fallback',
    suggestedTemplateDraft: {
      question: questionText.trim(),
      keywords: qTokens,
      answerTemplate: suggestedAnswerTemplate,
      category: inferredCategory
    }
  };
}
