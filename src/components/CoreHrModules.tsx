import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  Network,
  ClipboardCheck,
  ShieldCheck,
  X,
  Users,
  Briefcase,
  Upload,
  CheckSquare,
  Square
} from 'lucide-react';
import { EmployeeDocument, OnboardingTask } from '../types';

export const OrgChartPanel: React.FC = () => {
  const { users, currentTenant, updateEmployee, showToast } = useApp();
  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id);

  // Group into Executive / Leads (no managerId or leadership role) and reporting teams
  const leaders = tenantUsers.filter(
    u =>
      !u.managerId ||
      u.role === 'super_admin' ||
      u.role === 'tenant_super_admin' ||
      u.role === 'company_owner'
  );
  const departments = Array.from(new Set(tenantUsers.map(u => u.department || 'Unassigned')));

  const handleAssignManager = (empId: string, managerId: string) => {
    const mgr = tenantUsers.find(u => u.id === managerId);
    updateEmployee(empId, {
      managerId: mgr ? mgr.id : '',
      managerName: mgr ? mgr.name : ''
    });
    showToast(mgr ? `Reporting manager updated to ${mgr.name}.` : 'Reporting manager cleared.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Network size={16} className="text-[#4361EE]" />
              <span>Organization Structure &amp; Reporting Hierarchy</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live visual hierarchy for {currentTenant.name}. Assign reporting managers inline to update org structure.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 tabular-nums">
            {tenantUsers.length} Staff · {departments.length} Departments
          </span>
        </div>

        {tenantUsers.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No employees found in {currentTenant.name}. Onboard employees in the Directory tab to build the org chart.
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Tier 1: Executive / Leadership Root */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Executive Leadership &amp; Workspace Governance
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leaders.slice(0, 6).map(leader => {
                  const directReports = tenantUsers.filter(u => u.managerId === leader.id).length;
                  return (
                    <div
                      key={leader.id}
                      className="p-3.5 rounded-xl border border-[#4361EE]/30 bg-blue-50/40 flex items-center gap-3"
                    >
                      <img
                        src={leader.avatar}
                        alt={leader.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{leader.name}</p>
                        <p className="text-[11px] text-slate-600 truncate">{leader.title}</p>
                        <p className="text-[10px] text-[#4361EE] font-semibold mt-0.5 tabular-nums">
                          {leader.department} · {directReports} direct report{directReports === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tier 2: Departmental Reporting Tree */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Departmental Teams &amp; Reporting Lines
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departments.map(dept => {
                  const members = tenantUsers.filter(u => (u.department || 'Unassigned') === dept);
                  return (
                    <div key={dept} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-[#4361EE]" />
                          <span className="text-xs font-bold text-slate-900">{dept}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                          {members.length} member{members.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {members.map(emp => (
                          <div
                            key={emp.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{emp.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {emp.title} · <span className="font-mono">{emp.employeeCode}</span>
                                </p>
                              </div>
                            </div>

                            <select
                              value={emp.managerId || ''}
                              onChange={(e) => handleAssignManager(emp.id, e.target.value)}
                              aria-label={`Reporting manager for ${emp.name}`}
                              className="text-[11px] border border-slate-200 rounded-md px-2 py-1 bg-slate-50 text-slate-700 max-w-[140px] cursor-pointer"
                            >
                              <option value="">Reports to: Exec</option>
                              {tenantUsers
                                .filter(m => m.id !== emp.id)
                                .map(m => (
                                  <option key={m.id} value={m.id}>
                                    Mgr: {m.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DepartmentsRolesPanel: React.FC = () => {
  const { users, currentTenant, updateTenant, showToast } = useApp();
  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id);

  const defaultDepts = ['Engineering', 'Design', 'Marketing', 'Human Resources', 'Finance & Payroll', 'Executive Leadership'];
  const defaultDesigs = ['Senior Software Engineer', 'Product Designer', 'HR Business Partner', 'Finance Lead', 'Engineering Manager', 'QA Automation Engineer'];

  const allDepts = Array.from(
    new Set([
      ...defaultDepts,
      ...(currentTenant.customDepartments || []),
      ...tenantUsers.map(u => u.department).filter(Boolean)
    ])
  );
  const allDesigs = Array.from(
    new Set([
      ...defaultDesigs,
      ...(currentTenant.customDesignations || []),
      ...tenantUsers.map(u => u.title).filter(Boolean)
    ])
  );

  const [newDeptName, setNewDeptName] = useState('');
  const [newDesigName, setNewDesigName] = useState('');

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newDeptName.trim();
    if (!cleaned) return;
    if (allDepts.some(d => d.toLowerCase() === cleaned.toLowerCase())) {
      showToast(`Department "${cleaned}" already exists.`);
      return;
    }
    updateTenant(currentTenant.id, {
      customDepartments: [...(currentTenant.customDepartments || []), cleaned]
    });
    setNewDeptName('');
    showToast(`Department "${cleaned}" added to ${currentTenant.name}.`);
  };

  const handleAddDesig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newDesigName.trim();
    if (!cleaned) return;
    if (allDesigs.some(d => d.toLowerCase() === cleaned.toLowerCase())) {
      showToast(`Designation "${cleaned}" already exists.`);
      return;
    }
    updateTenant(currentTenant.id, {
      customDesignations: [...(currentTenant.customDesignations || []), cleaned]
    });
    setNewDesigName('');
    showToast(`Designation "${cleaned}" added to ${currentTenant.name}.`);
  };

  const handleRemoveCustomDept = (dept: string) => {
    updateTenant(currentTenant.id, {
      customDepartments: (currentTenant.customDepartments || []).filter(d => d !== dept)
    });
    showToast(`Removed custom department "${dept}".`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Departments Manager */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-[#4361EE]" />
              <span>Departments &amp; Cost Centers</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Live headcount and monthly payroll budget per department</p>
          </div>
          <span className="text-xs font-bold text-slate-600 tabular-nums">{allDepts.length} Total</span>
        </div>

        <form onSubmit={handleAddDept} className="flex items-center gap-2">
          <input
            type="text"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="Add new department (e.g. Data Science, Legal)"
            className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
          />
          <button
            type="submit"
            className="px-3.5 py-2.5 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Add Dept</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {allDepts.map(dept => {
            const members = tenantUsers.filter(u => u.department === dept);
            const monthlyCost = members.reduce((sum, m) => sum + (m.salaryBase || 0), 0);
            const isCustom = (currentTenant.customDepartments || []).includes(dept);
            return (
              <div key={dept} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{dept}</p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {members.length} staff · ₹{monthlyCost.toLocaleString('en-IN')}/mo base
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isCustom && members.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDept(dept)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Remove custom department"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Designations Manager */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={16} className="text-[#4361EE]" />
              <span>Job Designations &amp; Role Catalog</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Standardized job titles across {currentTenant.name}</p>
          </div>
          <span className="text-xs font-bold text-slate-600 tabular-nums">{allDesigs.length} Titles</span>
        </div>

        <form onSubmit={handleAddDesig} className="flex items-center gap-2">
          <input
            type="text"
            value={newDesigName}
            onChange={(e) => setNewDesigName(e.target.value)}
            placeholder="Add new designation (e.g. Staff Security Engineer)"
            className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
          />
          <button
            type="submit"
            className="px-3.5 py-2.5 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Add Title</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {allDesigs.map(desig => {
            const count = tenantUsers.filter(u => u.title === desig).length;
            return (
              <div key={desig} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{desig}</span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {count} assigned
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DocumentVaultPanel: React.FC = () => {
  const {
    users,
    currentUser,
    currentTenant,
    employeeDocuments,
    addEmployeeDocument,
    toggleVerifyDocument,
    deleteEmployeeDocument
  } = useApp();

  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id);
  const tenantDocs = employeeDocuments.filter(d => d.tenantId === currentTenant.id);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [employeeId, setEmployeeId] = useState(tenantUsers[0]?.id || currentUser.id);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EmployeeDocument['category']>('Offer Letter');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');

  const filteredDocs = tenantDocs.filter(d => categoryFilter === 'all' || d.category === categoryFilter);
  const verifiedCount = tenantDocs.filter(d => d.verified).length;

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const targetEmp = tenantUsers.find(u => u.id === employeeId) || currentUser;
    addEmployeeDocument({
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      title: title.trim(),
      category,
      fileName: fileName.trim() || `${title.trim().replace(/\s+/g, '_')}.pdf`,
      verified: false,
      notes: notes.trim() || undefined
    });
    setShowAddModal(false);
    setTitle('');
    setFileName('');
    setNotes('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-[#4361EE]" />
              <span>Employee Document Vault &amp; KYC Compliance</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Centralized repository for Offer Letters, ID Verification, NDAs, Tax Form-16, and Policy Handbooks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50"
            >
              <option value="all">All Categories ({tenantDocs.length})</option>
              <option value="Offer Letter">Offer Letter</option>
              <option value="ID Verification">ID Verification</option>
              <option value="Tax & Form 16">Tax &amp; Form 16</option>
              <option value="NDA & Contract">NDA &amp; Contract</option>
              <option value="Policy Handbook">Policy Handbook</option>
              <option value="Certification">Certification</option>
            </select>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Upload size={14} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] font-bold uppercase text-slate-400">Stored Files</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">{tenantDocs.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
            <p className="text-[10px] font-bold uppercase text-emerald-700">HR Verified</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">{verifiedCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80">
            <p className="text-[10px] font-bold uppercase text-amber-700">Pending Review</p>
            <p className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">{tenantDocs.length - verifiedCount}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Document</th>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Uploaded</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No documents stored yet for {currentTenant.name}. Click &ldquo;Upload Document&rdquo; to archive employee files.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(docItem => (
                  <tr key={docItem.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{docItem.title}</p>
                      <p className="text-[11px] font-mono text-slate-400">{docItem.fileName}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{docItem.employeeName}</td>
                    <td className="py-3 px-3 text-slate-600">{docItem.category}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{docItem.uploadedAt}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[11px] font-bold ${docItem.verified ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {docItem.verified ? 'Verified' : 'Pending KYC'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleVerifyDocument(docItem.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#4361EE] hover:bg-blue-50 rounded-md cursor-pointer"
                        >
                          {docItem.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEmployeeDocument(docItem.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddDoc} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Upload Employee Document</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                {tenantUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.employeeCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Signed Employment Agreement / PAN Card"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EmployeeDocument['category'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="ID Verification">ID Verification</option>
                  <option value="Tax & Form 16">Tax &amp; Form 16</option>
                  <option value="NDA & Contract">NDA &amp; Contract</option>
                  <option value="Policy Handbook">Policy Handbook</option>
                  <option value="Certification">Certification</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">File Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Offer_Letter.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compliance Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Verified against original KYC"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer">
                Save to Vault
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const LifecycleOnboardingPanel: React.FC = () => {
  const {
    users,
    currentTenant,
    onboardingTasks,
    addOnboardingTask,
    generateDefaultOnboardingTasks,
    toggleOnboardingTask,
    deleteOnboardingTask
  } = useApp();

  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id);
  const tenantTasks = onboardingTasks.filter(t => t.tenantId === currentTenant.id);

  const [selectedEmpId, setSelectedEmpId] = useState<string>(tenantUsers[0]?.id || '');
  const [lifecycleMode, setLifecycleMode] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [customTitle, setCustomTitle] = useState('');
  const [customStage, setCustomStage] = useState<OnboardingTask['stage']>('Pre-Boarding');

  const activeEmp = tenantUsers.find(u => u.id === selectedEmpId) || tenantUsers[0];
  const empTasks = activeEmp
    ? tenantTasks.filter(t => t.employeeId === activeEmp.id && t.lifecycleType === lifecycleMode)
    : [];
  const completedCount = empTasks.filter(t => t.completed).length;
  const pct = empTasks.length > 0 ? Math.round((completedCount / empTasks.length) * 100) : 0;

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !activeEmp) return;
    addOnboardingTask({
      employeeId: activeEmp.id,
      employeeName: activeEmp.name,
      department: activeEmp.department,
      lifecycleType: lifecycleMode,
      stage: customStage,
      title: customTitle.trim(),
      assigneeRole: 'HR Admin',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    });
    setCustomTitle('');
  };

  return (
    <div className="space-y-5">
      {/* 9-Stage Employee Lifecycle Journey Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Unified 9-Stage Employee Lifecycle
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center">
          {['01 Recruit', '02 Interview', '03 Offer', '04 Onboard', '05 Core HR', '06 Attendance', '07 Perform', '08 Payroll', '09 Growth'].map((step, i) => (
            <div
              key={step}
              className={`p-2 rounded-lg border text-[11px] font-semibold ${
                i === 3 ? 'bg-blue-50 border-[#4361EE]/40 text-[#4361EE]' : 'bg-slate-50 border-slate-200/80 text-slate-700'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Onboarding & Offboarding Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#4361EE]" />
              <span>Employee Onboarding &amp; Offboarding Checklists</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track IT provisioning, KYC documentation, payroll enrollment, and exit clearances per employee.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setLifecycleMode('onboarding')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  lifecycleMode === 'onboarding' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Onboarding
              </button>
              <button
                type="button"
                onClick={() => setLifecycleMode('offboarding')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  lifecycleMode === 'offboarding' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Offboarding
              </button>
            </div>

            <select
              value={activeEmp?.id || ''}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-semibold"
            >
              {tenantUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
              ))}
            </select>

            {activeEmp && (
              <button
                type="button"
                onClick={() => generateDefaultOnboardingTasks(activeEmp, lifecycleMode)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Generate Standard Checklist
              </button>
            )}
          </div>
        </div>

        {activeEmp && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {activeEmp.name} — {lifecycleMode === 'onboarding' ? 'Onboarding' : 'Offboarding'} Progress
              </span>
              <span className="font-mono font-bold text-[#4361EE] tabular-nums">
                {completedCount}/{empTasks.length} completed ({pct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-[#4361EE]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <form onSubmit={handleAddCustomTask} className="flex flex-col sm:flex-row gap-2">
              <select
                value={customStage}
                onChange={(e) => setCustomStage(e.target.value as OnboardingTask['stage'])}
                className="text-xs p-2 rounded-lg border border-slate-200 bg-slate-50"
              >
                <option value="Pre-Boarding">Pre-Boarding</option>
                <option value="Documentation">Documentation</option>
                <option value="IT & Assets">IT &amp; Assets</option>
                <option value="Payroll & Statutory">Payroll &amp; Statutory</option>
                <option value="Induction">Induction</option>
                <option value="Exit Clearance">Exit Clearance</option>
              </select>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Add custom checklist task..."
                className="flex-1 text-xs p-2 rounded-lg border border-slate-200"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Add Task
              </button>
            </form>

            {empTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No {lifecycleMode} tasks yet for {activeEmp.name}. Click &ldquo;Generate Standard Checklist&rdquo; above to create one in 1 click.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {empTasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 flex items-center justify-between gap-3 text-xs ${
                      task.completed ? 'bg-emerald-50/40' : 'bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleOnboardingTask(task.id)}
                      className="flex items-start gap-2.5 text-left flex-1 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {task.stage} · Owner: {task.assigneeRole} · Due {task.dueDate}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOnboardingTask(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
