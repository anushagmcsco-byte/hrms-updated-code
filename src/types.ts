export type UserRole = 
  | 'super_admin'         // Main Platform Owner / Root Super Admin
  | 'tenant_super_admin'  // Company Super Admin (Allocated per Company)
  | 'company_owner' 
  | 'hr_admin' 
  | 'payroll_admin' 
  | 'manager' 
  | 'team_lead' 
  | 'employee' 
  | 'recruiter';

export type TenantId = 'tenant-acme' | 'tenant-globex' | 'tenant-hyperion' | string;

export interface CompanyChatbotTemplate {
  id: string;
  question: string;
  keywords: string[];
  answerTemplate: string;
  category: string;
  createdBy: string;
  createdAt: string;
  usageCount?: number;
}

export interface ChatbotAskedQuestionLog {
  id: string;
  question: string;
  askedBy: string;
  askedAt: string;
  matchedTemplateId?: string;
  addedAsTemplate?: boolean;
}

export interface PlatformSupportConfig {
  id: string;
  brandName: string; // e.g. "NattonFlow Platform" -> renders "NattonFlow Platform Assistant"
  whatsappNumber: string;
  whatsappEnabled: boolean;
  chatbotEnabled: boolean;
  chatbotTemplates: CompanyChatbotTemplate[];
  chatbotAskedLog?: ChatbotAskedQuestionLog[];
  updatedAt?: string;
}

export interface Tenant {
  id: TenantId;
  name: string;
  slug: string;
  domain: string;
  plan: 'Growth' | 'Professional' | 'Enterprise';
  status: 'active' | 'trial' | 'suspended';
  currency: string;
  timezone: string;
  totalEmployees: number;
  createdAt: string;
  monthlyBilling: number;
  logoUrl?: string;
  whatsappNumber?: string;
  whatsappEnabled?: boolean;
  chatbotEnabled?: boolean;
  chatbotTemplates?: CompanyChatbotTemplate[];
  chatbotAskedLog?: ChatbotAskedQuestionLog[];
  officeLocation?: {
    name: string;
    campus: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    allowedRadiusMeters: number;
    authorizedSubnet: string;
  };
  salaryStructure?: {
    basicPct: number;
    hraPct: number;
    specialPct: number;
    pfPct: number;
    esiEnabled: boolean;
    esiPct: number;
    esiCeiling: number;
    professionalTax: number;
  };
  customDepartments?: string[];
  customDesignations?: string[];
  securitySettings: {
    enforceMfa: boolean;
    ipWhitelistEnabled: boolean;
    sessionTimeoutMinutes: number;
    auditLogsRetentionDays: number;
    autoAuthorizePayroll?: boolean;
  };
}

export interface User {
  id: string;
  tenantId: TenantId;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  title: string;
  department: string;
  employeeCode: string;
  phone: string;
  joinDate: string;
  managerId?: string;
  managerName?: string;
  salaryBase: number;
  leaveBalances: {
    paid: number;
    sick: number;
    casual: number;
    unpaid: number;
  };
  status: 'active' | 'on_leave' | 'terminated';
  isAppOwner?: boolean; // Main Application Owner (Global Root Super Admin)
  companySuperAdminTenantId?: string; // Designated Company Super Admin for specific tenant
}

export interface AttendanceRecord {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string; // "09:02 AM"
  checkOut: string | null; // "06:15 PM"
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_leave' | 'remote';
  workHours: number;
  location: string;
  ipAddress: string;
  correctionRequested?: boolean;
  correctionReason?: string;
  correctionStatus?: 'pending' | 'approved' | 'rejected';
  officeLocationVerified?: boolean;
  officeCampus?: string;
  shiftName?: string;
  breakMinutes?: number;
  onBreakSince?: string | null;
  overtimeHours?: number;
}

export interface LeaveRequest {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'Paid Annual' | 'Sick Leave' | 'Casual' | 'Paternity/Maternity' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  approverId: string;
  approverName: string;
  approvalNotes?: string;
}

export interface PayrollCycle {
  id: string;
  tenantId: TenantId;
  month: string; // e.g. "November 2026"
  monthKey?: string; // e.g. "2026-11"
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'validated' | 'approved' | 'published';
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  warningsCount: number;
  processedAt?: string;
}

export interface PayslipItem {
  id: string;
  tenantId: TenantId;
  payrollCycleId: string;
  monthKey?: string; // e.g. "2026-11"
  monthLabel?: string; // e.g. "November 2026"
  storedAt?: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  bankAccountMasked: string;
  panMasked: string;
  workingDays: number;
  paidDays: number;
  unpaidDays: number;
  overtimeHours: number;
  attendanceLogsCount?: number;
  remoteLogsCount?: number;
  approvedPaidLeaveDays?: number;
  approvedUnpaidLeaveDays?: number;
  pendingLeaveDays?: number;
  overtimePay?: number;
  lopAmount?: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus: number;
  grossEarnings: number;
  providentFund: number;
  taxDeducted: number;
  medicalInsurance: number;
  totalDeductions: number;
  netPayable: number;
  status: 'generated' | 'reviewed' | 'published';
  warnings: string[];
}

export interface JobOpening {
  id: string;
  tenantId: TenantId;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Remote' | 'Hybrid';
  applicantsCount: number;
  status: 'published' | 'draft' | 'closed';
  postedDate: string;
  salaryRange: string;
}

export interface Candidate {
  id: string;
  tenantId: TenantId;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  stage: 'Applied' | 'Screening' | 'Technical' | 'HR Interview' | 'Offered' | 'Hired' | 'Rejected';
  rating: number; // 1-5
  experienceYears: number;
  appliedDate: string;
  resumeUrl: string;
}

export interface ExpenseClaim {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  category: 'Travel' | 'Client Meal' | 'Software & Tools' | 'Office Supplies' | 'Certification';
  amount: number;
  receiptUrl?: string;
  merchant: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  description: string;
}

export interface PerformanceReview {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  period: 'Q3 2026' | 'Annual 2026';
  rating: number; // 1 to 5
  goalsProgress: number; // 0 - 100%
  strengths: string;
  improvements: string;
  status: 'submitted' | 'under_review' | 'completed';
}

export interface PerformanceGoal {
  id: string;
  tenantId: TenantId;
  title: string;
  ownerName: string;
  department: string;
  cycle: string;
  progress: number; // 0 - 100
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: TenantId;
  actorName: string;
  actorRole: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CompanyAsset {
  id: string;
  tenantId: TenantId;
  name: string;
  serialNumber: string;
  type: 'Laptop' | 'Monitor' | 'Access Card' | 'Phone';
  assignedTo?: string;
  assignedToName?: string;
  status: 'allocated' | 'available' | 'maintenance';
}

export interface HelpdeskTicket {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  category: 'Payroll Query' | 'IT Support' | 'Policy Clarification' | 'Health Insurance';
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface SaaSCompanyBilling {
  id: string;
  tenantId?: TenantId;
  companyName: string;
  plan: 'Growth' | 'Professional' | 'Enterprise';
  status: 'active' | 'trial' | 'overdue' | 'suspended';
  activeSeats: number;
  seatLimit: number;
  monthlyRevenue: number;
  renewalDate: string;
  mfaCompliance: number; // percentage
  storageUsedGb: number;
  createdAt?: string;
}

export type DemoBookingStatus = 
  | 'pending_verification' 
  | 'email_verified' 
  | 'scheduled' 
  | 'completed' 
  | 'rejected_dummy';

export type DemoMessageChannel = 'whatsapp' | 'sms' | 'both';

export interface DemoMessageDispatch {
  id: string;
  channel: 'sms' | 'whatsapp';
  recipientPhone: string;
  messageBody: string;
  stage: 'verification_otp' | 'booking_confirmed';
  sentAt: string;
  status: 'sent' | 'delivered';
}

export interface ClientDemoBooking {
  id: string;
  fullName: string;
  workEmail: string;
  companyOwnerEmail?: string;
  companyOwnerName?: string;
  phone: string;
  messageChannel?: DemoMessageChannel;
  messageDispatches?: DemoMessageDispatch[];
  companyName: string;
  companyWebsite: string;
  companySize: '1-20' | '21-50' | '51-200' | '201-1000' | '1000+';
  currentHrms: string;
  selectedModules: string[];
  preferredDate: string;
  preferredTimeSlot: string;
  timezone: string;
  notes?: string;
  status: DemoBookingStatus;
  verificationToken: string; // 6-digit verification OTP
  verificationSentAt: string;
  verifiedAt?: string;
  leadScore: number; // 0-100 score based on genuine company domain, size, modules
  isCorporateEmail: boolean;
  meetingLink: string;
  assignedSalesEngineer: string;
  createdAt: string;
  clientIp?: string;
  linkedTenantId?: string;
  updatedAdminsSummary?: string[];
}

export interface RoleMenuPermission {
  module: string;
  viewId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  scope: 'global' | 'department_team' | 'self_only' | 'none';
  description: string;
}

export interface DispatchedClientEmail {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientRoleLabel?: string;
  ccOwnerEmail?: string;
  bookingId?: string;
  phone?: string;
  messageChannel?: DemoMessageChannel;
  preferredDate?: string;
  preferredTimeSlot?: string;
  meetingLink?: string;
  companyName: string;
  companyDomain: string;
  workspaceUrl: string;
  assignedArchitect: string;
  assignedArchitectEmail: string;
  plan: 'Growth' | 'Professional' | 'Enterprise';
  seatsAllocated: number;
  verificationToken: string;
  activeModules: string[];
  sentAt: string;
  status: 'sent' | 'opened' | 'activated';
  tenantId: string;
}

export interface AppNotification {
  id: string;
  tenantId: string; // Multi-tenant partition: isolated to each company
  title: string;
  description?: string;
  time: string;
  read: boolean;
  category?: 'payroll' | 'leave' | 'attendance' | 'recruitment' | 'security' | 'onboarding' | 'announcement';
  priority?: 'normal' | 'urgent';
  targetView?: string; // Redirect view route when clicked (e.g. 'leaves', 'payroll', 'attendance', 'employees')
  createdBy?: string;
}

export interface ShiftTemplate {
  id: string;
  tenantId: TenantId;
  name: string;
  startTime: string; // "09:30"
  endTime: string; // "18:30"
  graceMinutes: number;
  breakMinutes: number;
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  assignedEmployeeIds: string[];
  color?: string;
}

export interface EmployeeDocument {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  title: string;
  category: 'Offer Letter' | 'ID Verification' | 'Tax & Form 16' | 'NDA & Contract' | 'Policy Handbook' | 'Certification';
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  verified: boolean;
  notes?: string;
}

export interface OnboardingTask {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  lifecycleType: 'onboarding' | 'offboarding';
  stage: 'Pre-Boarding' | 'IT & Assets' | 'Documentation' | 'Payroll & Statutory' | 'Induction' | 'Exit Clearance';
  title: string;
  assigneeRole: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface InterviewSchedule {
  id: string;
  tenantId: TenantId;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  round: 'Screening' | 'Technical' | 'System Design' | 'HR & Culture' | 'Final Executive';
  interviewerName: string;
  scheduledDate: string;
  scheduledTime: string;
  mode: 'Video Call' | 'In-Person' | 'Phone';
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  feedback?: string;
  score?: number;
}

export interface OfferLetter {
  id: string;
  tenantId: TenantId;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  annualCtc: number;
  monthlySalary: number;
  joiningDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'onboarded';
  issuedAt: string;
  notes?: string;
}

export interface ContinuousFeedback {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  authorName: string;
  type: 'Kudos' | 'Constructive' | '360 Peer' | 'PIP';
  competency: string;
  message: string;
  createdAt: string;
  pipTargetDate?: string;
  pipStatus?: 'active' | 'improved' | 'closed';
}

export interface CompanyAnnouncement {
  id: string;
  tenantId: TenantId;
  title: string;
  content: string;
  category: 'Townhall' | 'HR Policy' | 'Event' | 'Payroll & Tax' | 'Urgent';
  pinned: boolean;
  authorName: string;
  createdAt: string;
  acknowledgedBy: string[];
}

export interface EnpsResponse {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  score: number; // 0 to 10
  surveyTitle: string;
  comment: string;
  anonymous: boolean;
  submittedAt: string;
}

export interface EmployeeLoan {
  id: string;
  tenantId: TenantId;
  employeeId: string;
  employeeName: string;
  department: string;
  loanType: 'Salary Advance' | 'Medical Emergency' | 'Home / Relocation' | 'Education';
  principalAmount: number;
  tenureMonths: number;
  monthlyEmi: number;
  paidEmis: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  requestedAt: string;
}



