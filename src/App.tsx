import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardView } from './views/DashboardView';
import { EmployeesView } from './views/EmployeesView';
import { AttendanceView } from './views/AttendanceView';
import { LeavesView } from './views/LeavesView';
import { PayrollView } from './views/PayrollView';
import { RecruitmentView } from './views/RecruitmentView';
import { PerformanceView } from './views/PerformanceView';
import { OperationsView } from './views/OperationsView';
import { SuperAdminView } from './views/SuperAdminView';
import { AuditLogsView } from './views/AuditLogsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { MobilePreviewView } from './views/MobilePreviewView';
import { PublicWebsiteView } from './views/PublicWebsiteView';
import { LoginView } from './views/LoginView';
import { DemoBookingsView } from './views/DemoBookingsView';
import { SpecificationDocumentView } from './views/SpecificationDocumentView';
import { EngagementView } from './views/EngagementView';
import { BookDemoModal } from './components/BookDemoModal';
import { DispatchedEmailModal } from './components/DispatchedEmailModal';
import { RolePermissionGuard } from './components/RolePermissionGuard';
import { FloatingSupportDock } from './components/FloatingSupportDock';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, toastMessage, isAuthenticated } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  // If user is not authenticated, render the secure Login Page
  if (!isAuthenticated) {
    return (
      <div className="relative">
        <LoginView />
        {/* Modals rendered so trial verification works from LoginView */}
        <DispatchedEmailModal />
        <BookDemoModal />
        <FloatingSupportDock />
        {toastMessage && (
          <div className="fixed bottom-6 left-6 bg-[#14213D] text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // If in Public Website mode, render the public SaaS landing directly
  if (currentView === 'public_website') {
    return (
      <div className="relative">
        <PublicWebsiteView />
        {/* Global Book Demo Modal & Dispatched Email Modal */}
        <BookDemoModal />
        <DispatchedEmailModal />
        <FloatingSupportDock />
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 bg-[#14213D] text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#F7F9FC]">
      {/* Dynamic Collapsible Sidebar with Role-Distinct Menus */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Sticky Top Navbar */}
        <TopNavbar />

        {/* View Content Body with Zero-Trust RBAC Guards */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-7 min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'employees' && <EmployeesView />}
            {currentView === 'attendance' && <AttendanceView />}
            {currentView === 'leaves' && <LeavesView />}
            {currentView === 'payroll' && <PayrollView />}
            
            {currentView === 'recruitment' && (
              <RolePermissionGuard 
                requiredRoles={['super_admin', 'tenant_super_admin', 'company_owner', 'hr_admin', 'recruiter', 'manager']}
                moduleName="Talent Acquisition (ATS Pipeline)"
              >
                <RecruitmentView />
              </RolePermissionGuard>
            )}

            {currentView === 'performance' && <PerformanceView />}
            {currentView === 'engagement' && <EngagementView />}
            {(currentView === 'expenses' || currentView === 'assets' || currentView === 'helpdesk') && <OperationsView />}

            {currentView === 'super_admin' && (
              <RolePermissionGuard 
                requiredRoles={['super_admin']}
                moduleName="Multi-Tenant SaaS Infrastructure Hub"
              >
                <SuperAdminView />
              </RolePermissionGuard>
            )}

            {currentView === 'demo_bookings' && (
              <RolePermissionGuard 
                requiredRoles={['super_admin', 'tenant_super_admin', 'company_owner', 'hr_admin']}
                moduleName="Verified Client Demo Requests & Leads Registry"
              >
                <DemoBookingsView />
              </RolePermissionGuard>
            )}

            {currentView === 'audit_logs' && (
              <RolePermissionGuard 
                requiredRoles={['super_admin', 'tenant_super_admin', 'company_owner', 'hr_admin', 'payroll_admin']}
                moduleName="Security Audit Vault & Immutable Logs"
              >
                <AuditLogsView />
              </RolePermissionGuard>
            )}

            {currentView === 'reports' && (
              <RolePermissionGuard 
                requiredRoles={['super_admin', 'tenant_super_admin', 'company_owner', 'hr_admin', 'payroll_admin', 'manager']}
                moduleName="Executive Workforce Analytics"
              >
                <ReportsView />
              </RolePermissionGuard>
            )}

            {currentView === 'settings' && (
              <RolePermissionGuard 
                requiredRoles={['super_admin', 'tenant_super_admin', 'company_owner', 'hr_admin']}
                moduleName="Organization & Corporate Policy Settings"
              >
                <SettingsView />
              </RolePermissionGuard>
            )}

            {currentView === 'spec_document' && <SpecificationDocumentView />}
            {currentView === 'mobile_preview' && <MobilePreviewView />}
          </div>
        </main>
      </div>

      {/* Global Book Live Demo Modal & Dispatched Email Modal */}
      <BookDemoModal />
      <DispatchedEmailModal />
      <FloatingSupportDock />

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 bg-[#14213D] text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
