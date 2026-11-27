import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, TenantId } from '../types';
import { 
  Search, 
  Bell, 
  UserCheck, 
  Building2, 
  ChevronDown, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle, 
  Laptop, 
  ExternalLink,
  Smartphone,
  Globe,
  SlidersHorizontal,
  X,
  LogOut,
  Calendar,
  FileText,
  Menu,
  Trash2,
  Plus,
  ArrowRight,
  BellRing
} from 'lucide-react';
import { AppNotification } from '../types';

export const TopNavbar: React.FC = () => {
  const { 
    currentUser, 
    switchRole, 
    currentTenant, 
    switchTenant, 
    tenants,
    users,
    searchQuery, 
    setSearchQuery,
    notificationsCount,
    clearNotifications,
    notificationsList,
    addTenantNotification,
    deleteTenantNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    currentView,
    setCurrentView,
    setIsBookDemoModalOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    showToast,
    logout
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // State for Add Notification modal
  const [showAddNotifModal, setShowAddNotifModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifDesc, setNotifDesc] = useState('');
  const [notifCategory, setNotifCategory] = useState<AppNotification['category']>('announcement');
  const [notifTargetView, setNotifTargetView] = useState<string>('dashboard');
  const [notifPriority, setNotifPriority] = useState<'normal' | 'urgent'>('normal');
  const [notifTenantId, setNotifTenantId] = useState<string>(currentTenant.id);

  useEffect(() => {
    setNotifTenantId(currentTenant.id);
  }, [currentTenant.id]);

  const roles: Array<{ role: UserRole; label: string; badge: string; desc: string }> = [
    { role: 'super_admin', label: 'Main Super Admin (Owner)', badge: 'App Owner', desc: 'Root application owner, multi-company super admin manager' },
    { role: 'tenant_super_admin', label: 'Company Super Admin', badge: 'Company Exec', desc: 'Supreme admin authority for this specific company workspace' },
    { role: 'company_owner', label: 'Company Owner / Founder', badge: 'Executive', desc: 'High-level business reports, executive control' },
    { role: 'hr_admin', label: 'HR Admin (Full Access)', badge: 'Admin', desc: 'Full HR workforce, leaves, hiring & policies' },
    { role: 'payroll_admin', label: 'Payroll Admin', badge: 'Finance', desc: 'Salary formulas, tax deductions, ACH/NEFT release' },
    { role: 'manager', label: 'Department Manager', badge: 'Team Lead', desc: 'Team attendance, approvals, sprint reviews' },
    { role: 'team_lead', label: 'Team Leader', badge: 'Projects', desc: 'Sprint timesheets & peer reviews' },
    { role: 'employee', label: 'Employee (Self-Service)', badge: 'ESS Portal', desc: 'Clock-in/out, apply leave, payslips, claims' },
    { role: 'recruiter', label: 'Talent Recruiter', badge: 'Talent ATS', desc: 'Candidate pipelines, jobs, interview stages' }
  ];

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 px-2.5 sm:px-5 flex items-center justify-between gap-1.5 sm:gap-3 sticky top-0 z-20 shadow-xs w-full min-w-0">
      {/* Left: Mobile/Tablet Hamburger Toggle + Compact Logo + Desktop Search Bar */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2 cursor-pointer lg:hidden flex-shrink-0"
          title="Go to Dashboard"
        >
          <img
            src="/assets/aistudio/NattonFlow_HR_Team_Logo_cabe3d63.png"
            alt="Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
          />
        </div>

        {/* Search input shown only when viewport has generous width (xl+) so it never overlaps controls */}
        <div className="relative w-full max-w-xs hidden xl:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, payroll, leaves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F9FC] text-xs text-[#172033] pl-9 pr-8 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/10 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Backdrop for all dropdown popovers */}
      {(showTenantMenu || showRoleMenu || showNotifMenu) && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs sm:bg-transparent"
          onClick={() => {
            setShowTenantMenu(false);
            setShowRoleMenu(false);
            setShowNotifMenu(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Right Controls: Tenant Switcher, Role Persona Switcher, Notifications, Quick Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
        {/* Multi-Tenant Switcher (Clean full company name with proper truncation) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTenantMenu(!showTenantMenu);
              setShowRoleMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            title={`Active Workspace: ${currentTenant.name}`}
          >
            <Building2 size={14} className="text-[#4361EE] flex-shrink-0" />
            <span className="truncate max-w-[74px] sm:max-w-[155px] xl:max-w-[190px]">
              {currentTenant.name}
            </span>
            <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
          </button>

          {showTenantMenu && (
            <div className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 max-h-[80vh] overflow-y-auto">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Multi-Tenant Isolation</p>
                  <p className="text-xs text-slate-600">Switch company workspace context</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTenantMenu(false)}
                  className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-1.5 mt-2">
                {tenants.map(t => {
                  const liveCount = users.filter(u => u.tenantId === t.id).length;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchTenant(t.id);
                        setShowTenantMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        t.id === currentTenant.id ? 'bg-[#EEF4FF] text-[#4361EE] font-semibold border border-blue-200 shadow-2xs' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{t.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{liveCount} {liveCount === 1 ? 'employee' : 'employees'} • {t.currency}</p>
                      </div>
                      {t.id === currentTenant.id && <CheckCircle size={15} className="text-[#4361EE]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Live Role Switcher (Crucial for testing all 8 role experiences effortlessly) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowTenantMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-1.5 bg-[#EEF4FF] hover:bg-blue-100/80 text-[#4361EE] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-blue-200 cursor-pointer whitespace-nowrap"
            title={`Active Role: ${currentUser.role.replace(/_/g, ' ').toUpperCase()}`}
          >
            <UserCheck size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline truncate max-w-[115px] lg:max-w-[140px]">
              {currentUser.role.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className="sm:hidden">Role</span>
            <ChevronDown size={13} className="flex-shrink-0" />
          </button>

          {showRoleMenu && (
            <div className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 max-h-[80vh] overflow-y-auto">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4361EE]">Instant Persona Switcher</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold">8 Roles</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Test NattonFlow HR through each user perspective</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRoleMenu(false)}
                  className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-72 sm:max-h-80 overflow-y-auto space-y-1 mt-2">
                {roles.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-start justify-between cursor-pointer ${
                      r.role === currentUser.role ? 'bg-[#EEF4FF] border border-blue-200 shadow-2xs' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{r.label}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {r.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{r.desc}</p>
                    </div>
                    {r.role === currentUser.role && <CheckCircle size={14} className="text-[#4361EE] flex-shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Company-Isolated Notifications Popover with Full CRUD & Click-to-Redirect */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowRoleMenu(false);
              setShowTenantMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={`${notificationsCount} unread alerts for ${currentTenant.name}`}
          >
            <Bell size={18} />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#DC2626] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-top-2">
              {/* Header */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">Company Notifications</span>
                    <span className="text-[10px] bg-blue-100 text-[#4361EE] font-bold px-1.5 py-0.2 rounded">
                      {notificationsCount} New
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate max-w-[220px]">
                    Isolated to: <strong className="text-slate-700">{currentTenant.name}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setShowAddNotifModal(true);
                      setShowNotifMenu(false);
                    }}
                    className="px-2 py-1 text-[11px] font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Broadcast Alert to this Company"
                  >
                    <Plus size={13} />
                    <span>Post Alert</span>
                  </button>

                  {notificationsCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead(currentTenant.id)}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:text-[#4361EE] hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                      title="Mark all as read"
                    >
                      Read all
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowNotifMenu(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notification List with Click-to-Redirect */}
              <div className="space-y-2 max-h-80 overflow-y-auto p-2.5 divide-y divide-slate-100">
                {notificationsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <BellRing size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No company notifications</p>
                    <p className="text-[10px] mt-0.5">All updates for {currentTenant.name} have been read</p>
                    <button
                      onClick={() => {
                        setShowAddNotifModal(true);
                        setShowNotifMenu(false);
                      }}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Create First Alert</span>
                    </button>
                  </div>
                ) : (
                  notificationsList.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.targetView) {
                          setCurrentView(n.targetView as any);
                          showToast(`Redirected to ${n.targetView.replace(/_/g, ' ')} module.`);
                        }
                        setShowNotifMenu(false);
                      }}
                      className={`p-3 rounded-xl text-xs transition-all cursor-pointer group hover:border-[#4361EE]/40 border ${
                        n.read ? 'bg-slate-50/70 text-slate-600 border-slate-100' : 'bg-blue-50/70 text-slate-900 border-blue-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded ${
                            n.category === 'payroll' ? 'bg-emerald-100 text-emerald-800' :
                            n.category === 'leave' ? 'bg-amber-100 text-amber-800' :
                            n.category === 'recruitment' ? 'bg-purple-100 text-purple-800' :
                            n.category === 'attendance' ? 'bg-blue-100 text-blue-800' :
                            n.category === 'security' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {n.category || 'General'}
                          </span>
                          {n.priority === 'urgent' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white animate-pulse">
                              Urgent
                            </span>
                          )}
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4361EE]"></span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTenantNotification(n.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <p className="font-semibold leading-snug text-slate-900">{n.title}</p>
                      {n.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.description}</p>
                      )}

                      {n.targetView && (
                        <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-200/50 text-[10px]">
                          <span className="text-[#4361EE] font-semibold flex items-center gap-1">
                            <span>Redirect to: <strong className="capitalize">{n.targetView.replace(/_/g, ' ')}</strong></span>
                            <ArrowRight size={11} />
                          </span>
                          <span className="text-slate-400 text-[9px]">Click to open</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notificationsList.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px]">
                  <button
                    onClick={clearNotifications}
                    className="text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                  >
                    Clear All ({currentTenant.name})
                  </button>
                  <span className="text-slate-400 text-[10px]">
                    Strictly isolated per company
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: Book Live Demo, RSD Spec, Public Site, Logout */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-1.5 sm:pl-2.5">
          <button
            onClick={() => setIsBookDemoModalOpen(true)}
            title="Book Live Enterprise Demo"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Calendar size={13} />
            <span>Book Demo</span>
          </button>

          <button
            onClick={() => setCurrentView('spec_document')}
            title="View Requirement Specification Document (RSD)"
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#4361EE] hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 whitespace-nowrap cursor-pointer"
          >
            <FileText size={13} className="text-[#4361EE]" />
            <span>RSD Spec</span>
          </button>

          <button
            onClick={() => setCurrentView('public_website')}
            title="Preview Public SaaS Website"
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200 whitespace-nowrap cursor-pointer"
          >
            <Globe size={13} className="text-sky-600" />
            <span>Public Site</span>
          </button>

          <button
            onClick={logout}
            title="Secure Lock / Logout"
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 flex items-center gap-1 whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Add Notification / Company Broadcast Modal */}
      {showAddNotifModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!notifTitle.trim()) {
                showToast('Please enter an alert title.');
                return;
              }
              const created = addTenantNotification({
                tenantId: notifTenantId || currentTenant.id,
                title: notifTitle.trim(),
                description: notifDesc.trim() || undefined,
                category: notifCategory,
                priority: notifPriority,
                targetView: notifTargetView
              });
              const companyName = tenants.find(t => t.id === created.tenantId)?.name || currentTenant.name;
              showToast(`Alert broadcasted to ${companyName}!`);
              setShowAddNotifModal(false);
              setNotifTitle('');
              setNotifDesc('');
            }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-[#4361EE] rounded-xl">
                  <BellRing size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Post Company Alert</h3>
                  <p className="text-[11px] text-slate-500">Only visible to the selected organization</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNotifModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Organization */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Company Workspace
              </label>
              {currentUser.role === 'super_admin' ? (
                <select
                  value={notifTenantId}
                  onChange={(e) => setNotifTenantId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-blue-50/50 font-medium text-slate-800 focus:outline-none focus:border-[#4361EE]"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 size={14} className="text-[#4361EE]" />
                  <span>{currentTenant.name} (Isolated to this workspace)</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notification Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Q4 Townhall & Payroll Sign-off Deadline"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Please ensure all biometric regularization requests are finalized before 5 PM IST."
                value={notifDesc}
                onChange={(e) => setNotifDesc(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={notifCategory}
                  onChange={(e) => setNotifCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                >
                  <option value="announcement">Announcement</option>
                  <option value="payroll">Payroll Alert</option>
                  <option value="leave">Time Off & Leave</option>
                  <option value="attendance">Biometric Attendance</option>
                  <option value="recruitment">Recruitment / ATS</option>
                  <option value="security">Security & MFA</option>
                  <option value="onboarding">Staff Onboarding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={notifPriority}
                  onChange={(e) => setNotifPriority(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent / High Priority</option>
                </select>
              </div>
            </div>

            {/* Click-to-Redirect Target Page */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Click-to-Redirect Target Page
              </label>
              <select
                value={notifTargetView}
                onChange={(e) => setNotifTargetView(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-[#4361EE]"
              >
                <option value="dashboard">Dashboard Overview</option>
                <option value="leaves">Leaves & Time Off Approvals</option>
                <option value="payroll">Payroll Engine & Disbursal</option>
                <option value="attendance">Biometric Attendance Log</option>
                <option value="employees">Employee Directory</option>
                <option value="recruitment">Recruitment (ATS Pipeline)</option>
                <option value="performance">Performance & OKRs</option>
                <option value="expenses">Expense Reimbursements</option>
                <option value="reports">Executive Analytics & Reports</option>
                <option value="audit_logs">Security Audit Vault</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                When employees click this alert, they will be instantly redirected to this view.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddNotifModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                Publish Alert
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};
