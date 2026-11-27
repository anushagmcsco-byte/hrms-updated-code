import React, { useState } from 'react';
import { useApp, AppView } from '../context/AppContext';
import { 
  Building2, 
  Users, 
  Clock, 
  Calendar, 
  CreditCard, 
  Briefcase, 
  TrendingUp, 
  Receipt, 
  Laptop, 
  LifeBuoy, 
  ShieldCheck, 
  BarChart3, 
  Smartphone, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Layers,
  Settings,
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown,
  X,
  Megaphone
} from 'lucide-react';
import { UserRole } from '../types';
import { FileText, Calendar as CalendarIcon } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser, 
    currentTenant, 
    setIsBookDemoModalOpen,
    mobileMenuOpen,
    setMobileMenuOpen
  } = useApp();

  const role = currentUser.role;

  // Custom curated menus tailored uniquely per role
  const getNavItemsForRole = (): Array<{ id: AppView; label: string; icon: any; badge?: string }> => {
    switch (role) {
      case 'super_admin':
        return [
          { id: 'dashboard', label: 'Platform Architecture & Owner', icon: BarChart3, badge: 'Owner' },
          { id: 'super_admin', label: 'Multi-Tenant SaaS Hub', icon: ShieldCheck, badge: 'Platform' },
          { id: 'employees', label: 'Global Staff Directory', icon: Users },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'demo_bookings', label: 'Verified Demo Leads', icon: CalendarIcon, badge: 'Leads' },
          { id: 'audit_logs', label: 'Global Audit Vault', icon: Lock },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'tenant_super_admin':
        return [
          { id: 'dashboard', label: 'Company Governance Cockpit', icon: BarChart3, badge: 'SuperAdmin' },
          { id: 'employees', label: 'Company Headcount & CRUD', icon: Users, badge: 'Staff' },
          { id: 'attendance', label: 'Biometric Attendance', icon: Clock },
          { id: 'leaves', label: 'Time Off & Approvals', icon: Calendar, badge: 'Workflows' },
          { id: 'payroll', label: 'Executive Payroll Engine', icon: CreditCard, badge: 'ACH Ready' },
          { id: 'recruitment', label: 'Talent Acquisition (ATS)', icon: Briefcase, badge: 'ATS' },
          { id: 'performance', label: 'Performance Appraisals', icon: TrendingUp },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'expenses', label: 'Expense Reimbursements', icon: Receipt },
          { id: 'assets', label: 'Company IT Assets', icon: Laptop },
          { id: 'demo_bookings', label: 'Client Demo Requests', icon: CalendarIcon, badge: 'Leads' },
          { id: 'reports', label: 'Corporate Analytics', icon: Layers },
          { id: 'settings', label: 'Company Policies & Config', icon: Settings },
          { id: 'audit_logs', label: 'Company Audit Vault', icon: Lock },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'company_owner':
        return [
          { id: 'dashboard', label: 'Executive KPI Cockpit', icon: BarChart3, badge: 'C-Suite' },
          { id: 'employees', label: 'Company Headcount', icon: Users },
          { id: 'payroll', label: 'Executive Payroll Summary', icon: CreditCard, badge: 'Finance' },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'demo_bookings', label: 'Client Demo Requests', icon: CalendarIcon, badge: 'Leads' },
          { id: 'reports', label: 'Executive Analytics', icon: Layers },
          { id: 'settings', label: 'Corporate Policies', icon: Settings },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'hr_admin':
        return [
          { id: 'dashboard', label: 'HR Operations Overview', icon: BarChart3 },
          { id: 'employees', label: 'Workforce Directory', icon: Users },
          { id: 'attendance', label: 'Biometric Attendance', icon: Clock },
          { id: 'leaves', label: 'Time Off & Approvals', icon: Calendar, badge: 'Workflows' },
          { id: 'payroll', label: 'Automated Payroll Engine', icon: CreditCard, badge: 'Engine' },
          { id: 'recruitment', label: 'Talent Acquisition (ATS)', icon: Briefcase, badge: 'ATS' },
          { id: 'performance', label: 'Performance Appraisals', icon: TrendingUp },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'expenses', label: 'Expense Reimbursements', icon: Receipt },
          { id: 'assets', label: 'IT Assets Register', icon: Laptop },
          { id: 'helpdesk', label: 'HR Helpdesk & Query', icon: LifeBuoy },
          { id: 'demo_bookings', label: 'Client Demo Requests', icon: CalendarIcon, badge: 'Leads' },
          { id: 'reports', label: 'Workforce Analytics', icon: Layers },
          { id: 'settings', label: 'Organization Settings', icon: Settings },
          { id: 'audit_logs', label: 'Privacy & Audit Vault', icon: Lock },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'payroll_admin':
        return [
          { id: 'dashboard', label: 'Payroll & Tax Cockpit', icon: BarChart3 },
          { id: 'payroll', label: '8-Stage Payroll Engine', icon: CreditCard, badge: 'ACH Ready' },
          { id: 'attendance', label: 'Hours Reconciliation', icon: Clock },
          { id: 'expenses', label: 'Expense Approvals', icon: Receipt },
          { id: 'audit_logs', label: 'Financial Audit Vault', icon: Lock },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'manager':
        return [
          { id: 'dashboard', label: 'Department Dashboard', icon: BarChart3 },
          { id: 'employees', label: 'My Subordinate Team', icon: Users, badge: 'My Team' },
          { id: 'attendance', label: 'Team Shifts & Punches', icon: Clock, badge: 'Approve' },
          { id: 'leaves', label: 'Team Leave Requests', icon: Calendar, badge: 'Pending' },
          { id: 'performance', label: 'Team Appraisals & OKRs', icon: TrendingUp },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'expenses', label: 'Team Expense Approvals', icon: Receipt },
          { id: 'reports', label: 'Team Productivity', icon: Layers },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'team_lead':
        return [
          { id: 'dashboard', label: 'Squad Sprint Overview', icon: BarChart3 },
          { id: 'attendance', label: 'Squad Attendance', icon: Clock },
          { id: 'leaves', label: 'Squad Leave Calendar', icon: Calendar },
          { id: 'performance', label: 'Peer Reviews & Goals', icon: TrendingUp },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'employee':
        return [
          { id: 'dashboard', label: 'My Employee Portal', icon: BarChart3, badge: 'Self-Service' },
          { id: 'attendance', label: 'Web Clock-In & Punches', icon: Clock },
          { id: 'leaves', label: 'My Leaves & Apply', icon: Calendar },
          { id: 'payroll', label: 'My Digital Payslips', icon: CreditCard, badge: 'PDF' },
          { id: 'performance', label: 'My Goals & Self-Review', icon: TrendingUp },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'expenses', label: 'My Expense Claims', icon: Receipt },
          { id: 'assets', label: 'My Assigned IT Assets', icon: Laptop },
          { id: 'helpdesk', label: 'Support & Helpdesk', icon: LifeBuoy },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      case 'recruiter':
        return [
          { id: 'dashboard', label: 'Recruitment Overview', icon: BarChart3 },
          { id: 'recruitment', label: 'Candidate Pipeline (ATS)', icon: Briefcase, badge: 'Kanban' },
          { id: 'engagement', label: 'Announcements & eNPS', icon: Megaphone },
          { id: 'helpdesk', label: 'HR Helpdesk & Query', icon: LifeBuoy },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText, badge: 'SRS' }
        ];

      default:
        return [
          { id: 'dashboard', label: 'Overview', icon: BarChart3 },
          { id: 'spec_document', label: 'Requirement Spec (RSD)', icon: FileText }
        ];
    }
  };

  const visibleNav = getNavItemsForRole();

  return (
    <>
      {/* Mobile & Tablet Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 bg-[#14213D] text-white flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-[#1e2f52] shadow-2xl lg:shadow-none z-50 select-none overflow-x-hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand Header — exact h-16 height matching TopNavbar for a seamless seam */}
        <div className={`h-16 flex-shrink-0 flex items-center border-b border-[#23355b] bg-[#0f192e] ${
          collapsed ? 'justify-center px-2' : 'justify-between px-3 gap-2'
        }`}>
          <div
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 cursor-pointer min-w-0 ${collapsed ? '' : 'flex-1'}`}
            title="Go to Dashboard"
          >
            <img
              src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png"
              alt="Brand Logo"
              className="w-10 h-10 object-contain rounded-lg flex-shrink-0 bg-white shadow-sm p-1 transition-transform hover:scale-105"
            />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-white font-bold truncate leading-tight">
                  {currentTenant.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                  {currentUser.role === 'super_admin' ? 'Super Admin Mode' : `${currentTenant.plan} Workspace`}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center flex-shrink-0">
            {/* Close button on mobile & tablet drawers */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#203155] transition-colors cursor-pointer"
              title="Close navigation"
            >
              <X size={18} />
            </button>

            {/* Desktop collapse toggle */}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="hidden lg:flex text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-[#203155] transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Expand toggle strip when collapsed on desktop */}
        {collapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-[#23355b]/60">
            <button
              onClick={() => setCollapsed(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-[#203155] transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Tenant Indicator badge if not collapsed */}
        {!collapsed && currentUser.role !== 'super_admin' && (
          <div className="mx-3 mt-3 px-3 py-2 bg-[#1b2b4d] rounded-lg border border-[#2b3e69] flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Building2 size={14} className="text-[#4361EE] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Active Tenant</p>
                <p className="text-xs text-slate-200 font-medium truncate mt-0.5">{currentTenant.name}</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded flex-shrink-0">
              {currentTenant.plan}
            </span>
          </div>
        )}

        {/* Navigation List — strictly overflow-x-hidden with proper min-w-0 truncation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setMobileMenuOpen(false);
                }}
                title={item.label}
                className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-all group relative cursor-pointer ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-2.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/25'
                    : 'text-slate-300 hover:bg-[#1b2b4d] hover:text-white'
                }`}
              >
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between gap-2 min-w-0 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#4361EE]/30 text-blue-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Floating Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#0f192e] text-white text-xs font-semibold rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-700">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dedicated View Switchers: Mobile App, SaaS Landing, and Book Live Demo */}
        <div className="p-2.5 border-t border-[#23355b] bg-[#111c33] space-y-1 flex-shrink-0">
          <button
            onClick={() => {
              setIsBookDemoModalOpen(true);
              setMobileMenuOpen(false);
            }}
            title="Book Live Demo"
            className={`w-full flex items-center rounded-lg text-xs font-bold bg-[#4361EE] hover:bg-blue-600 text-white shadow-xs transition-all cursor-pointer ${
              collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-2'
            }`}
          >
            <CalendarIcon size={15} className="text-white flex-shrink-0" />
            {!collapsed && <span className="truncate">Book Live Demo</span>}
          </button>

          <button
            onClick={() => {
              setCurrentView('mobile_preview');
              setMobileMenuOpen(false);
            }}
            title="Mobile App Simulator"
            className={`w-full flex items-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
              collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-2'
            } ${
              currentView === 'mobile_preview'
                ? 'bg-purple-600 text-white'
                : 'text-slate-300 hover:bg-[#1b2b4d] hover:text-white'
            }`}
          >
            <Smartphone size={15} className="text-purple-400 flex-shrink-0" />
            {!collapsed && <span className="truncate">Mobile App Simulator</span>}
          </button>

          <button
            onClick={() => {
              setCurrentView('public_website');
              setMobileMenuOpen(false);
            }}
            title="Public SaaS Portal"
            className={`w-full flex items-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
              collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-2'
            } ${
              currentView === 'public_website'
                ? 'bg-sky-600 text-white'
                : 'text-slate-300 hover:bg-[#1b2b4d] hover:text-white'
            }`}
          >
            <Globe size={15} className="text-sky-400 flex-shrink-0" />
            {!collapsed && <span className="truncate">Public SaaS Portal</span>}
          </button>
        </div>

        {/* Mini Profile Footer */}
        {!collapsed ? (
          <div className="p-3 border-t border-[#23355b] bg-[#0c1527] flex items-center gap-2.5 flex-shrink-0 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-[#4361EE] flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 capitalize truncate">
                {currentUser.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-[#23355b] bg-[#0c1527] flex justify-center flex-shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-[#4361EE]"
            />
          </div>
        )}
      </aside>
    </>
  );
};
