import React from 'react';
import { useApp, AppView } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, UserCheck, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface RolePermissionGuardProps {
  requiredRoles: UserRole[];
  moduleName: string;
  children: React.ReactNode;
}

export const RolePermissionGuard: React.FC<RolePermissionGuardProps> = ({
  requiredRoles,
  moduleName,
  children
}) => {
  const { currentUser, switchRole, setCurrentView } = useApp();

  const isAuthorized = requiredRoles.includes(currentUser.role);

  if (isAuthorized) {
    return <>{children}</>;
  }

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Application Owner / Root Admin',
    tenant_super_admin: 'Company Super Admin',
    company_owner: 'Company Owner / C-Suite',
    hr_admin: 'HR Admin (Full Access)',
    payroll_admin: 'Payroll & Finance Admin',
    manager: 'Department Manager',
    team_lead: 'Team Leader',
    employee: 'Employee (Self-Service)',
    recruiter: 'Talent Recruiter'
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-rose-100">
          <ShieldAlert size={28} />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Access Restricted (RBAC Policy Guard)
          </span>
          <h3 className="text-lg font-black text-slate-900 mt-2">
            Unauthorized Access to {moduleName}
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Your active role <span className="font-bold text-slate-900">({roleLabels[currentUser.role]})</span> does not have security permissions to view or edit this module.
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-2">
          <p className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            Authorized Role Personas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {requiredRoles.map(r => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-blue-50 text-[#4361EE] hover:text-blue-700 border border-blue-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                title={`Switch persona to ${roleLabels[r]}`}
              >
                <UserCheck size={12} />
                <span>Switch to {roleLabels[r]}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            NattonFlow HR enforces zero-trust role segregation to protect financial data, candidate reviews, and personal identity documents.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
