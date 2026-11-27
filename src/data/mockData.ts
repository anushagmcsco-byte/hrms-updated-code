import { 
  Tenant, 
  User, 
  AttendanceRecord, 
  LeaveRequest, 
  PayrollCycle, 
  PayslipItem, 
  JobOpening, 
  Candidate, 
  ExpenseClaim, 
  PerformanceReview, 
  AuditLog, 
  CompanyAsset, 
  HelpdeskTicket, 
  SaaSCompanyBilling,
  TenantId,
  ClientDemoBooking,
  RoleMenuPermission,
  AppNotification
} from '../types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-acme',
    name: 'Acme Cloud Technologies',
    slug: 'acme-tech',
    domain: 'acmecloud.io',
    plan: 'Enterprise',
    status: 'active',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    totalEmployees: 142,
    createdAt: '2025-02-15',
    monthlyBilling: 85200,
    whatsappNumber: '+91 98201 99882',
    whatsappEnabled: true,
    chatbotEnabled: true,
    securitySettings: {
      enforceMfa: true,
      ipWhitelistEnabled: true,
      sessionTimeoutMinutes: 30,
      auditLogsRetentionDays: 365
    }
  },
  {
    id: 'tenant-globex',
    name: 'Globex Robotics Corp',
    slug: 'globex-robotics',
    domain: 'globex.ai',
    plan: 'Professional',
    status: 'active',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    totalEmployees: 68,
    createdAt: '2025-07-20',
    monthlyBilling: 40800,
    whatsappNumber: '+91 98202 77665',
    whatsappEnabled: true,
    chatbotEnabled: true,
    securitySettings: {
      enforceMfa: true,
      ipWhitelistEnabled: false,
      sessionTimeoutMinutes: 60,
      auditLogsRetentionDays: 180
    }
  },
  {
    id: 'tenant-hyperion',
    name: 'Hyperion BioPharma Labs',
    slug: 'hyperion-labs',
    domain: 'hyperionbio.com',
    plan: 'Enterprise',
    status: 'trial',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    totalEmployees: 34,
    createdAt: '2026-10-01',
    monthlyBilling: 20400,
    whatsappNumber: '+91 98450 33441',
    whatsappEnabled: true,
    chatbotEnabled: true,
    securitySettings: {
      enforceMfa: true,
      ipWhitelistEnabled: true,
      sessionTimeoutMinutes: 15,
      auditLogsRetentionDays: 730
    }
  }
];

export const INITIAL_USERS: User[] = [
  // Platform Owner / Root Super Admin (Single Application Owner for the whole platform)
  {
    id: 'usr-super-1',
    tenantId: 'tenant-acme',
    name: 'Elena Vance (Application Owner)',
    email: 'elena.vance@nattonflow.internal',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'super_admin',
    isAppOwner: true,
    title: 'Chief SaaS Architect & Application Owner',
    department: 'Platform Architecture & Ownership',
    employeeCode: 'ROOT-001',
    phone: '+91 98450 11223',
    joinDate: '2024-01-10',
    salaryBase: 350000,
    leaveBalances: { paid: 30, sick: 15, casual: 10, unpaid: 0 },
    status: 'active'
  },
  // Company Super Admins (One Sub-Owner per company, appointed by Application Owner)
  {
    id: 'usr-acme-super-admin',
    tenantId: 'tenant-acme',
    companySuperAdminTenantId: 'tenant-acme',
    name: 'Vikram Malhotra (Acme Super Admin)',
    email: 'vikram.m@acmecloud.io',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    role: 'tenant_super_admin',
    title: 'Executive VP & Company Super Admin',
    department: 'Executive Governance',
    employeeCode: 'ACM-SUP-01',
    phone: '+91 98201 99882',
    joinDate: '2022-02-01',
    salaryBase: 210000,
    leaveBalances: { paid: 26, sick: 12, casual: 6, unpaid: 0 },
    status: 'active'
  },
  {
    id: 'usr-globex-super-admin',
    tenantId: 'tenant-globex',
    companySuperAdminTenantId: 'tenant-globex',
    name: 'Sunita Sharma (Globex Super Admin)',
    email: 'sunita.s@globex.ai',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    role: 'tenant_super_admin',
    title: 'Director of Operations & Company Super Admin',
    department: 'Executive Governance',
    employeeCode: 'GLB-SUP-01',
    phone: '+91 98202 77665',
    joinDate: '2023-03-15',
    salaryBase: 195000,
    leaveBalances: { paid: 24, sick: 10, casual: 5, unpaid: 0 },
    status: 'active'
  },
  {
    id: 'usr-hyperion-super-admin',
    tenantId: 'tenant-hyperion',
    companySuperAdminTenantId: 'tenant-hyperion',
    name: 'Dr. Arjun Nambiar (Hyperion Super Admin)',
    email: 'arjun.n@hyperionbio.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'tenant_super_admin',
    title: 'Chief Governance Officer & Super Admin',
    department: 'Executive Governance',
    employeeCode: 'HYP-SUP-01',
    phone: '+91 98450 33441',
    joinDate: '2023-07-01',
    salaryBase: 225000,
    leaveBalances: { paid: 28, sick: 12, casual: 6, unpaid: 0 },
    status: 'active'
  }
];

// Clean dynamic dataset - no dummy attendance punches
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

// Clean dynamic dataset - no dummy leaves
export const INITIAL_LEAVES: LeaveRequest[] = [];

// Clean initial cycles for dynamic processing
export const INITIAL_PAYROLL_CYCLES: PayrollCycle[] = [
  {
    id: 'cycle-nov-2026',
    tenantId: 'tenant-acme',
    month: 'November 2026',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-30',
    status: 'draft',
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    employeeCount: 0,
    warningsCount: 0
  },
  {
    id: 'cycle-glb-nov-2026',
    tenantId: 'tenant-globex',
    month: 'November 2026',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-30',
    status: 'draft',
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    employeeCount: 0,
    warningsCount: 0
  },
  {
    id: 'cycle-hyp-nov-2026',
    tenantId: 'tenant-hyperion',
    month: 'November 2026',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-30',
    status: 'draft',
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    employeeCount: 0,
    warningsCount: 0
  }
];

// Clean dynamic dataset - payslips are generated from real onboarded employees
export const INITIAL_PAYSLIPS: PayslipItem[] = [];

// Clean dynamic dataset - no dummy jobs
export const INITIAL_JOBS: JobOpening[] = [];

// Clean dynamic dataset - no dummy candidates
export const INITIAL_CANDIDATES: Candidate[] = [];

// Clean dynamic dataset - no dummy expense claims
export const INITIAL_EXPENSES: ExpenseClaim[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    tenantId: 'tenant-acme',
    actorName: 'Elena Vance (Application Owner)',
    actorRole: 'Application Owner',
    action: 'PLATFORM_GOVERNANCE_INITIALIZED',
    resource: 'Acme Cloud Technologies Tenant Partition',
    ipAddress: '198.51.100.1',
    timestamp: '2026-11-12 08:30:00',
    severity: 'low'
  },
  {
    id: 'aud-2',
    tenantId: 'tenant-acme',
    actorName: 'Elena Vance (Application Owner)',
    actorRole: 'Application Owner',
    action: 'COMPANY_SUPER_ADMIN_APPOINTED',
    resource: 'Vikram Malhotra appointed as Acme Super Admin',
    ipAddress: '198.51.100.1',
    timestamp: '2026-11-12 08:35:12',
    severity: 'high'
  },
  {
    id: 'aud-3',
    tenantId: 'tenant-globex',
    actorName: 'Elena Vance (Application Owner)',
    actorRole: 'Application Owner',
    action: 'COMPANY_SUPER_ADMIN_APPOINTED',
    resource: 'Sunita Sharma appointed as Globex Super Admin',
    ipAddress: '198.51.100.1',
    timestamp: '2026-11-12 08:36:00',
    severity: 'high'
  },
  {
    id: 'aud-4',
    tenantId: 'tenant-hyperion',
    actorName: 'Elena Vance (Application Owner)',
    actorRole: 'Application Owner',
    action: 'COMPANY_SUPER_ADMIN_APPOINTED',
    resource: 'Dr. Arjun Nambiar appointed as Hyperion Super Admin',
    ipAddress: '198.51.100.1',
    timestamp: '2026-11-12 08:37:00',
    severity: 'high'
  }
];

// Clean dynamic dataset - no dummy assets
export const INITIAL_ASSETS: CompanyAsset[] = [];

// Clean dynamic dataset - no dummy tickets
export const INITIAL_HELPDESK: HelpdeskTicket[] = [];

export const INITIAL_SAAS_BILLINGS: SaaSCompanyBilling[] = [
  {
    id: 'bill-1',
    companyName: 'Acme Cloud Technologies',
    plan: 'Enterprise',
    status: 'active',
    activeSeats: 142,
    seatLimit: 200,
    monthlyRevenue: 85200,
    renewalDate: '2026-12-15',
    mfaCompliance: 98,
    storageUsedGb: 42.4
  },
  {
    id: 'bill-2',
    companyName: 'Globex Robotics Corp',
    plan: 'Professional',
    status: 'active',
    activeSeats: 68,
    seatLimit: 75,
    monthlyRevenue: 40800,
    renewalDate: '2026-11-20',
    mfaCompliance: 92,
    storageUsedGb: 18.2
  },
  {
    id: 'bill-3',
    companyName: 'Hyperion BioPharma Labs',
    plan: 'Enterprise',
    status: 'trial',
    activeSeats: 310,
    seatLimit: 500,
    monthlyRevenue: 62000,
    renewalDate: '2026-11-25',
    mfaCompliance: 100,
    storageUsedGb: 88.6
  },
  {
    id: 'bill-4',
    companyName: 'Nextera FinTech Global',
    plan: 'Enterprise',
    status: 'active',
    activeSeats: 215,
    seatLimit: 250,
    monthlyRevenue: 3440,
    renewalDate: '2027-01-10',
    mfaCompliance: 100,
    storageUsedGb: 61.0
  }
];

export const HOLIDAY_CALENDAR = [
  { date: '2026-11-26', name: 'Thanksgiving Day', type: 'Mandatory Public' },
  { date: '2026-11-27', name: 'Day After Thanksgiving', type: 'Company Holiday' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'Mandatory Public' },
  { date: '2027-01-01', name: 'New Year’s Day', type: 'Mandatory Public' },
  { date: '2027-01-18', name: 'Martin Luther King Jr. Day', type: 'Federal Observance' }
];

export const INITIAL_DEMO_BOOKINGS: ClientDemoBooking[] = [
  {
    id: 'demo-req-101',
    fullName: 'Victoria Sterling',
    workEmail: 'victoria.sterling@meridianfintech.com',
    phone: '+1 (415) 883-9201',
    companyName: 'Meridian FinTech Solutions',
    companyWebsite: 'https://meridianfintech.com',
    companySize: '201-1000',
    currentHrms: 'Legacy BambooHR & Excel',
    selectedModules: ['Automated Payroll', 'Biometric Attendance', 'Time Off & Leave', 'Performance & OKRs'],
    preferredDate: '2026-11-16',
    preferredTimeSlot: '10:00 AM - 10:45 AM EST',
    timezone: 'America/New_York (EST)',
    notes: 'Looking to replace disconnected payroll with automated bank ACH integration and real-time attendance clock-in for 450 hybrid staff.',
    status: 'scheduled',
    verificationToken: '582914',
    verificationSentAt: '2026-11-10T14:20:00Z',
    verifiedAt: '2026-11-10T14:23:12Z',
    leadScore: 98,
    isCorporateEmail: true,
    meetingLink: 'https://meet.nattonflow.com/demo-meridian-fintech',
    assignedSalesEngineer: 'Marcus Vance (Enterprise Solutions Architect)',
    createdAt: '2026-11-10T14:18:32Z',
    clientIp: '198.51.100.44'
  },
  {
    id: 'demo-req-102',
    fullName: 'Rajesh K. Nambiar',
    workEmail: 'rajesh.n@cognitivescale.io',
    phone: '+1 (650) 412-8876',
    companyName: 'CognitiveScale Systems',
    companyWebsite: 'https://cognitivescale.io',
    companySize: '51-200',
    currentHrms: 'Darwinbox',
    selectedModules: ['Biometric Attendance', 'Recruitment ATS', 'HR Helpdesk & Query'],
    preferredDate: '2026-11-17',
    preferredTimeSlot: '02:00 PM - 02:45 PM PST',
    timezone: 'America/Los_Angeles (PST)',
    notes: 'Urgent requirement to streamline candidate screening pipeline and geo-fenced mobile attendance for multi-location engineering hubs.',
    status: 'scheduled',
    verificationToken: '739105',
    verificationSentAt: '2026-11-11T01:10:00Z',
    verifiedAt: '2026-11-11T01:14:45Z',
    leadScore: 94,
    isCorporateEmail: true,
    meetingLink: 'https://meet.nattonflow.com/demo-cognitivescale',
    assignedSalesEngineer: 'Elena Rostova (Lead HR Tech Specialist)',
    createdAt: '2026-11-11T01:09:12Z',
    clientIp: '203.0.113.88'
  },
  {
    id: 'demo-req-103',
    fullName: 'Claire Fontaine',
    workEmail: 'c.fontaine@lumiere-biotech.fr',
    phone: '+33 1 42 68 55 00',
    companyName: 'Lumière BioSciences',
    companyWebsite: 'https://lumiere-biotech.fr',
    companySize: '21-50',
    currentHrms: 'Spreadsheets',
    selectedModules: ['Automated Payroll', 'Expenses & Claims', 'IT Assets & Hardware'],
    preferredDate: '2026-11-18',
    preferredTimeSlot: '11:30 AM - 12:15 PM CET',
    timezone: 'Europe/Paris (CET)',
    notes: 'Transitioning from seed to Series A. Need clean payslips generation and hardware asset tracking for scientific staff.',
    status: 'email_verified',
    verificationToken: '448291',
    verificationSentAt: '2026-11-11T07:45:00Z',
    verifiedAt: '2026-11-11T07:48:30Z',
    leadScore: 89,
    isCorporateEmail: true,
    meetingLink: 'https://meet.nattonflow.com/demo-lumiere-bio',
    assignedSalesEngineer: 'David Chen (Senior Enterprise Architect)',
    createdAt: '2026-11-11T07:44:11Z',
    clientIp: '195.154.122.19'
  },
  {
    id: 'demo-req-104',
    fullName: 'Alex Vance',
    workEmail: 'alextest9999@tempmail.ninja',
    phone: '+1 (555) 019-2834',
    companyName: 'Test Dummy Ltd',
    companyWebsite: 'http://localhost:3000',
    companySize: '1-20',
    currentHrms: 'None',
    selectedModules: ['Automated Payroll'],
    preferredDate: '2026-11-14',
    preferredTimeSlot: '09:00 AM - 09:30 AM EST',
    timezone: 'America/New_York (EST)',
    notes: 'Testing bot dummy request',
    status: 'rejected_dummy',
    verificationToken: '110293',
    verificationSentAt: '2026-11-09T18:00:00Z',
    leadScore: 12,
    isCorporateEmail: false,
    meetingLink: '',
    assignedSalesEngineer: 'Automated Spam Filter',
    createdAt: '2026-11-09T17:59:40Z',
    clientIp: '45.142.120.10'
  }
];

export const ROLE_PERMISSIONS_MATRIX: Record<string, RoleMenuPermission[]> = {
  super_admin: [
    { module: 'SaaS Multi-Tenant Hub', viewId: 'super_admin', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, scope: 'global', description: 'Complete platform provisioning, tenant lifecycle, plans, and database partition oversight.' },
    { module: 'Demo Bookings & Leads', viewId: 'demo_bookings', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, scope: 'global', description: 'Manage corporate demo requests, verify client domains, view lead scores, and schedule meetings.' },
    { module: 'Global Billing & ARR', viewId: 'super_admin', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Monitor MRR/ARR, payment gateways, and plan upgrades across all client tenants.' },
    { module: 'Privacy & Audit Vault', viewId: 'audit_logs', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'global', description: 'Immutable SOC-2 security audit logs and tenant API access history.' },
    { module: 'Requirements Spec (RSD)', viewId: 'spec_document', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Full architectural and workflow specification document for the HRMS platform.' }
  ],
  company_owner: [
    { module: 'Executive KPI Dashboard', viewId: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'High-level headcount, total payroll expenditure, retention rates, and department budgets.' },
    { module: 'People & Teams', viewId: 'employees', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Company-wide directory, org hierarchy, and executive promotions.' },
    { module: 'Payroll Summary', viewId: 'payroll', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Executive compensation approval and high-level expenditure auditing.' },
    { module: 'Executive Reports', viewId: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'global', description: 'Cross-functional workforce analytics, attrition curves, and financial summaries.' },
    { module: 'Org & Policy Settings', viewId: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Corporate policies, holiday calendars, and department structures.' },
    { module: 'Requirements Spec (RSD)', viewId: 'spec_document', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'global', description: 'View system specification and role permission matrices.' }
  ],
  hr_admin: [
    { module: 'HR Overview', viewId: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'global', description: 'Daily attendance alerts, active leaves, pending onboarding, and urgent tickets.' },
    { module: 'People & Directory', viewId: 'employees', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, scope: 'global', description: 'Full employee profile lifecycle, documentation, bank details, and compensation setup.' },
    { module: 'Attendance & Shifts', viewId: 'attendance', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Biometric punches, shift assignments, and missing punch regularizations.' },
    { module: 'Time Off & Leaves', viewId: 'leaves', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Company leave policies, balance quotas, and multi-level leave approvals.' },
    { module: 'Payroll & Salaries', viewId: 'payroll', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Monthly payroll run, tax slab deductions, and digital payslip dispatch.' },
    { module: 'Talent Acquisition (ATS)', viewId: 'recruitment', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, scope: 'global', description: 'Job openings, resume parsing, Kanban candidate pipeline, and offer letters.' },
    { module: 'Performance & Goals', viewId: 'performance', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Appraisal review cycles, 360-degree feedback, and department OKR tracking.' },
    { module: 'Expenses & Claims', viewId: 'expenses', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Company expense claim audit and reimbursement clearance.' },
    { module: 'IT Assets & Hardware', viewId: 'assets', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Laptops, monitors, and security access cards assignment register.' },
    { module: 'HR Helpdesk', viewId: 'helpdesk', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Resolve employee policy queries, payroll disputes, and workplace requests.' },
    { module: 'Demo Bookings & Leads', viewId: 'demo_bookings', canView: true, canCreate: false, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Review prospective client demo inquiries and schedule discovery sessions.' },
    { module: 'Requirements Spec (RSD)', viewId: 'spec_document', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'global', description: 'View system specifications and workflow validation criteria.' }
  ],
  payroll_admin: [
    { module: 'Payroll Engine & Ledger', viewId: 'payroll', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: '8-stage automated payroll calculation, statutory compliance, and salary slips.' },
    { module: 'Bank ACH Batch Export', viewId: 'payroll', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Generate NACHA/ACH direct deposit file for banking disbursement.' },
    { module: 'Attendance Reconciliation', viewId: 'attendance', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'global', description: 'Audit working hours, overtime hours, and unpaid days before salary finalization.' },
    { module: 'Expense Reimbursements', viewId: 'expenses', canView: true, canCreate: false, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'global', description: 'Audit receipts and add approved claims into the upcoming payroll cycle.' },
    { module: 'Financial Audit Vault', viewId: 'audit_logs', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'global', description: 'Verify financial changes and salary adjustments compliance.' }
  ],
  manager: [
    { module: 'Department Cockpit', viewId: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'department_team', description: 'Team productivity, who is out today, and pending subordinate approvals.' },
    { module: 'My Team Members', viewId: 'employees', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'department_team', description: 'View subordinate profiles, designations, and contact details only.' },
    { module: 'Team Attendance & Punches', viewId: 'attendance', canView: true, canCreate: false, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'department_team', description: 'Approve subordinate biometric punch corrections and shift adjustments.' },
    { module: 'Team Leave Approvals', viewId: 'leaves', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: false, scope: 'department_team', description: 'Review and approve/reject department members time-off requests.' },
    { module: 'Performance & OKR Reviews', viewId: 'performance', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true, scope: 'department_team', description: 'Conduct quarterly appraisals and assign goals for reporting staff.' },
    { module: 'Team Expense Approvals', viewId: 'expenses', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: false, scope: 'department_team', description: 'Approve project travel and meal expenses submitted by team.' }
  ],
  team_lead: [
    { module: 'Squad Overview', viewId: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'department_team', description: 'Daily squad presence, active tasks, and team availability.' },
    { module: 'Squad Attendance', viewId: 'attendance', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'department_team', description: 'Daily presence tracking for sprint coordination.' },
    { module: 'Squad Leave Calendar', viewId: 'leaves', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'department_team', description: 'Plan sprints around team planned vacations.' },
    { module: 'Peer Feedback & OKRs', viewId: 'performance', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: false, scope: 'department_team', description: 'Submit peer reviews and collaborate on sprint key results.' }
  ],
  employee: [
    { module: 'My Employee Portal', viewId: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'self_only', description: 'Personal summary, leave balance, upcoming holidays, and announcements.' },
    { module: 'Clock-In & Attendance', viewId: 'attendance', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'self_only', description: 'One-click web punch-in/out, view daily hours, and request correction.' },
    { module: 'My Leaves & Apply', viewId: 'leaves', canView: true, canCreate: true, canEdit: false, canDelete: true, canApprove: false, canExport: false, scope: 'self_only', description: 'Apply for paid/sick leave, track approval status, and view holiday calendar.' },
    { module: 'My Digital Payslips', viewId: 'payroll', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true, scope: 'self_only', description: 'View and download own monthly salary breakdown and tax computations.' },
    { module: 'My Goals & Self-Review', viewId: 'performance', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: false, scope: 'self_only', description: 'Update progress on quarterly OKRs and submit self-appraisal.' },
    { module: 'My Expense Claims', viewId: 'expenses', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: false, canExport: false, scope: 'self_only', description: 'Upload receipts and submit business expense claims for reimbursement.' },
    { module: 'Assigned IT Assets', viewId: 'assets', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'self_only', description: 'View details and serial numbers of company laptop and equipment.' },
    { module: 'Helpdesk & Support', viewId: 'helpdesk', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'self_only', description: 'Raise tickets to HR or IT for support and policy queries.' }
  ],
  recruiter: [
    { module: 'Recruiter Dashboard', viewId: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, scope: 'global', description: 'Active job openings, candidate pipeline metrics, and interview schedules.' },
    { module: 'Talent Acquisition (ATS)', viewId: 'recruitment', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, scope: 'global', description: 'Drag-and-drop Kanban pipeline from Applied to Hired, add job listings, and ratings.' },
  ]
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // Acme Cloud Technologies (tenant-acme)
  {
    id: 'notif-acme-1',
    tenantId: 'tenant-acme',
    title: 'Acme Cloud: Platform workspace & biometric shift rules activated',
    description: 'Statutory compliance check and AES-256 tenant data isolation configured.',
    category: 'security',
    time: '10m ago',
    read: false,
    priority: 'urgent',
    targetView: 'dashboard'
  },
  {
    id: 'notif-acme-2',
    tenantId: 'tenant-acme',
    title: 'Vikram Malhotra appointed as Company Super Admin for Acme Cloud',
    description: 'Executive governance delegation granted by Application Owner Elena Vance.',
    category: 'announcement',
    time: '35m ago',
    read: false,
    priority: 'urgent',
    targetView: 'employees'
  },
  {
    id: 'notif-acme-3',
    tenantId: 'tenant-acme',
    title: 'November 2026 payroll ledger initialized for Acme Cloud',
    description: 'Ready to calculate and disburse digital payslips upon onboarding employees.',
    category: 'payroll',
    time: '2h ago',
    read: true,
    targetView: 'payroll'
  },

  // Globex Robotics Corp (tenant-globex)
  {
    id: 'notif-globex-1',
    tenantId: 'tenant-globex',
    title: 'Globex Robotics: Organization workspace and shift rules configured',
    description: 'Pune Robotics Center geo-fence perimeters verified.',
    category: 'security',
    time: '15m ago',
    read: false,
    priority: 'urgent',
    targetView: 'attendance'
  },
  {
    id: 'notif-globex-2',
    tenantId: 'tenant-globex',
    title: 'Sunita Sharma appointed as Company Super Admin for Globex Robotics',
    description: 'Executive governance delegation granted by Application Owner Elena Vance.',
    category: 'announcement',
    time: '45m ago',
    read: false,
    targetView: 'employees'
  },
  {
    id: 'notif-globex-3',
    tenantId: 'tenant-globex',
    title: 'Automated statutory TDS and PF ledger active for Globex Robotics',
    description: 'NEFT corporate direct deposit batch export ready for processing.',
    category: 'payroll',
    time: '3h ago',
    read: true,
    targetView: 'payroll'
  },

  // Hyperion BioPharma Labs (tenant-hyperion)
  {
    id: 'notif-hyperion-1',
    tenantId: 'tenant-hyperion',
    title: 'Hyperion BioPharma: Clinical operations workspace active',
    description: 'Hyderabad Bio-Informatics Genome Center security protocol initialized.',
    category: 'security',
    time: '20m ago',
    read: false,
    priority: 'urgent',
    targetView: 'dashboard'
  },
  {
    id: 'notif-hyperion-2',
    tenantId: 'tenant-hyperion',
    title: 'Dr. Arjun Nambiar appointed as Company Super Admin for Hyperion',
    description: 'Executive governance delegation granted by Application Owner Elena Vance.',
    category: 'announcement',
    time: '1h ago',
    read: false,
    targetView: 'employees'
  },
  {
    id: 'notif-hyperion-3',
    tenantId: 'tenant-hyperion',
    title: 'Clinical research talent acquisition pipeline enabled',
    description: 'Open requisitions and candidate evaluation matrix configured.',
    category: 'recruitment',
    time: '4h ago',
    read: true,
    targetView: 'recruitment'
  }
];

export interface OfficeLocation {
  tenantId: string;
  name: string;
  campus: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  allowedRadiusMeters: number;
  authorizedSubnet: string;
}

export const TENANT_OFFICE_LOCATIONS: Record<string, OfficeLocation> = {
  'tenant-acme': {
    tenantId: 'tenant-acme',
    name: 'Acme Cloud Global Headquarters',
    campus: 'Floor 4, Embassy Tech Village, Outer Ring Road',
    address: 'Devarabeesanahalli, Bellandur',
    city: 'Bengaluru, Karnataka 560103',
    lat: 12.9260,
    lng: 77.6762,
    allowedRadiusMeters: 300,
    authorizedSubnet: '198.51.100.0/24'
  },
  'tenant-globex': {
    tenantId: 'tenant-globex',
    name: 'Globex Robotics R&D Campus',
    campus: 'Bay 2, Rajiv Gandhi Infotech Park',
    address: 'Phase 2, Hinjawadi',
    city: 'Pune, Maharashtra 411057',
    lat: 18.5913,
    lng: 73.7389,
    allowedRadiusMeters: 250,
    authorizedSubnet: '103.21.244.0/24'
  },
  'tenant-hyperion': {
    tenantId: 'tenant-hyperion',
    name: 'Hyperion Bio-Informatics Genome Center',
    campus: 'Genome Valley Life Sciences Park, Plot 14',
    address: 'Turkapally, Shamirpet',
    city: 'Hyderabad, Telangana 500078',
    lat: 17.6521,
    lng: 78.6015,
    allowedRadiusMeters: 350,
    authorizedSubnet: '182.72.10.0/24'
  }
};



