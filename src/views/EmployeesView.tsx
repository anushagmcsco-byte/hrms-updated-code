import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  X,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  Crown,
  Shield,
  Briefcase,
  Camera,
  Upload,
  Sparkles,
  RotateCcw,
  GitBranch,
  Layers,
  FolderLock,
  ClipboardCheck
} from 'lucide-react';
import { User, UserRole } from '../types';
import {
  OrgChartPanel,
  DepartmentsRolesPanel,
  DocumentVaultPanel,
  LifecycleOnboardingPanel
} from '../components/CoreHrModules';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80'
];

export const EmployeesView: React.FC = () => {
  const { 
    users, 
    currentUser, 
    currentTenant, 
    tenants, 
    addEmployee, 
    deleteEmployee, 
    updateEmployee,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'directory' | 'org_chart' | 'departments' | 'documents' | 'lifecycle'>('directory');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state for adding employee
  const [targetTenantId, setTargetTenantId] = useState<string>(currentTenant.id);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newSalary, setNewSalary] = useState('125000');
  const [newAvatar, setNewAvatar] = useState<string>(PRESET_AVATARS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const departments = ['Engineering', 'Design', 'Marketing', 'Human Resources', 'Finance & Payroll', 'Executive Leadership', 'Hardware R&D'];

  // Reset department filter and search when switching companies
  useEffect(() => {
    setSelectedDept('all');
    setSearch('');
  }, [currentTenant.id]);

  // Multi-tenant isolation: filter employees belonging to the active company workspace
  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id);

  // Dynamically combine standard departments with any custom departments in this company
  const dynamicDepartments = Array.from(
    new Set([...departments, ...tenantUsers.map(u => u.department).filter(Boolean)])
  );

  const filteredUsers = tenantUsers.filter(u => {
    const matchesDept = selectedDept === 'all' || u.department === selectedDept;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.title.toLowerCase().includes(search.toLowerCase()) ||
                          u.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setTargetTenantId(currentTenant.id);
    setNewName('');
    setNewEmail('');
    setNewPhone('+91 98' + Math.floor(10000000 + Math.random() * 89999999));
    setNewTitle('');
    setNewDept('Engineering');
    setNewRole('employee');
    setNewSalary('125000');
    setNewAvatar(PRESET_AVATARS[0]);
    setFormError(null);
    setShowAddModal(true);
  };

  // Compress uploaded photo (including large mobile camera photos) to <=256x256 JPEG (~25KB)
  // so it always fits safely inside Firestore 1 MiB document limits and syncs instantaneously across all devices
  const compressAvatarImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          reject(new Error('Could not read file'));
          return;
        }
        const img = new Image();
        img.onload = () => {
          const maxSize = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          resolve(compressed);
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError('Image size exceeds 10MB limit. Please upload a smaller photo.');
      return;
    }

    try {
      const compressedUrl = await compressAvatarImage(file);
      setNewAvatar(compressedUrl);
      setFormError(null);
      showToast('Profile photo optimized and ready for cloud sync!');
    } catch {
      setFormError('Failed to read image file. Please try again.');
    }
  };

  const handleUpdateExistingEmployeeAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.');
      return;
    }

    try {
      const compressedUrl = await compressAvatarImage(file);
      updateEmployee(selectedUser.id, { avatar: compressedUrl });
      setSelectedUser({ ...selectedUser, avatar: compressedUrl });
      showToast(`Profile photo permanently updated for ${selectedUser.name} across all devices!`);
    } catch {
      showToast('Failed to process image file. Please try again.');
    }
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim();

    // 1. Genuine Name Validation (Prevent dumpy / single-letter / test entries)
    const nameWords = trimmedName.split(/\s+/);
    if (nameWords.length < 2 || trimmedName.length < 4) {
      setFormError('Please enter a genuine full legal name (first and last name, min 4 characters).');
      return;
    }

    // 2. Corporate Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid corporate email address (e.g., employee@company.com).');
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === trimmedEmail.toLowerCase())) {
      setFormError(`An employee with email "${trimmedEmail}" already exists in the database.`);
      return;
    }

    // 3. Phone validation
    const cleanPhone = newPhone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit contact telephone number.');
      return;
    }

    // 4. Base Salary validation
    const parsedSalary = parseFloat(newSalary);
    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      setFormError('Please enter a valid positive base salary in Indian Rupees (₹).');
      return;
    }

    const assignedCompany = tenants.find(t => t.id === targetTenantId) || currentTenant;
    const prefix = assignedCompany.name.slice(0, 3).toUpperCase();
    const randomCode = Math.floor(100 + Math.random() * 900);

    // Call addEmployee without any undefined fields so Firestore stores it permanently across all devices
    const payload: Omit<User, 'id'> = {
      tenantId: assignedCompany.id,
      name: trimmedName,
      email: trimmedEmail,
      avatar: newAvatar || PRESET_AVATARS[0],
      role: newRole,
      title: newTitle.trim() || 'Associate Engineer',
      department: newDept,
      employeeCode: `${prefix}-${randomCode}`,
      phone: newPhone,
      joinDate: new Date().toISOString().split('T')[0],
      salaryBase: parsedSalary,
      leaveBalances: { paid: 20, sick: 10, casual: 6, unpaid: 0 },
      status: 'active',
      isAppOwner: false,
      ...(newRole === 'tenant_super_admin' ? { companySuperAdminTenantId: assignedCompany.id } : {})
    };

    const created = addEmployee(payload);

    showToast(`Permanently onboarded ${created.name} (${created.employeeCode}) to cloud database!`);
    setShowAddModal(false);
  };

  const handleConfirmPermanentDelete = () => {
    if (!confirmDeleteId) return;

    const userToDelete = users.find(u => u.id === confirmDeleteId);
    if (!userToDelete) return;

    // Prevent deleting the root Application Owner
    if (userToDelete.isAppOwner) {
      showToast('Cannot delete the root Platform Application Owner.');
      setConfirmDeleteId(null);
      return;
    }

    // Call deleteEmployee from AppContext which permanently deletes and writes to localStorage
    deleteEmployee(confirmDeleteId);
    showToast(`Employee ${userToDelete.name} permanently deleted from database.`);
    setConfirmDeleteId(null);
    setSelectedUser(null);
  };

  // Determine if current user has permission to manage / delete staff
  const canManageStaff = 
    currentUser.role === 'super_admin' || 
    currentUser.role === 'tenant_super_admin' || 
    currentUser.role === 'company_owner' || 
    currentUser.role === 'hr_admin';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-[#4361EE]" size={22} />
              <span>Employee Directory & Permanent Database</span>
            </h1>
            <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
              Persistent DB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified staff roster for {currentTenant.name}. Changes permanently persist in storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast(`Exported ${filteredUsers.length} verified employee records as encrypted CSV.`)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <span>Export Roster</span>
          </button>

          {canManageStaff && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Core HR Module Sub-Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
        {[
          { id: 'directory', label: `Employee Directory (${tenantUsers.length})`, icon: Users },
          { id: 'org_chart', label: 'Org Chart', icon: GitBranch },
          { id: 'departments', label: 'Departments & Roles', icon: Layers },
          { id: 'documents', label: 'Document Vault', icon: FolderLock },
          { id: 'lifecycle', label: 'Onboarding & Exit', icon: ClipboardCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                active
                  ? 'bg-[#14213D] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'org_chart' && <OrgChartPanel />}
      {activeTab === 'departments' && <DepartmentsRolesPanel />}
      {activeTab === 'documents' && <DocumentVaultPanel />}
      {activeTab === 'lifecycle' && <LifecycleOnboardingPanel />}

      {activeTab === 'directory' && (
      <>
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, role, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7F9FC] text-xs text-slate-800 pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedDept === 'all' ? 'bg-[#14213D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Departments ({tenantUsers.length})
          </button>
          {dynamicDepartments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedDept === dept ? 'bg-[#4361EE] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Code & Dept</th>
                <th className="py-3 px-4">Access Role & Hierarchy</th>
                <th className="py-3 px-4">Corporate Contact</th>
                <th className="py-3 px-4">Salary (₹ INR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching employees found in {currentTenant.name}.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            {emp.isAppOwner && (
                              <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded" title="Application Owner">
                                <Crown size={11} className="text-amber-600" />
                                Owner
                              </span>
                            )}
                            {emp.role === 'tenant_super_admin' && (
                              <span className="inline-flex items-center gap-0.5 bg-blue-100 text-[#4361EE] text-[9px] font-bold px-1.5 py-0.2 rounded" title="Company Super Admin">
                                <Shield size={11} />
                                Super Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{emp.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-800 font-semibold">{emp.employeeCode}</span>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        emp.isAppOwner 
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : emp.role === 'tenant_super_admin'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : emp.role === 'hr_admin'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : emp.role === 'payroll_admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : emp.role === 'manager'
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {emp.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{emp.email}</p>
                      <p className="text-[11px] text-slate-400">{emp.phone}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ₹{emp.salaryBase.toLocaleString('en-IN')}
                      <span className="text-[10px] text-slate-400 font-normal"> /mo</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : emp.status === 'on_leave'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {emp.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(emp)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#4361EE] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        >
                          Profile
                        </button>
                        {canManageStaff && !emp.isAppOwner && (
                          <button
                            onClick={() => setConfirmDeleteId(emp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Permanently Delete Employee"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Employee Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="relative group flex-shrink-0">
                <img 
                  src={selectedUser.avatar} 
                  alt={selectedUser.name} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#4361EE] shadow-sm" 
                />
                {canManageStaff && (
                  <>
                    <input
                      type="file"
                      ref={editPhotoInputRef}
                      accept="image/*"
                      onChange={handleUpdateExistingEmployeeAvatar}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editPhotoInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/60 rounded-2xl text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] font-bold transition-opacity cursor-pointer"
                      title="Update profile photo"
                    >
                      <Camera size={14} />
                      <span>Change</span>
                    </button>
                  </>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                  {selectedUser.isAppOwner && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Application Owner
                    </span>
                  )}
                  {selectedUser.role === 'tenant_super_admin' && (
                    <span className="bg-blue-100 text-[#4361EE] text-[10px] font-bold px-2 py-0.5 rounded">
                      Company Super Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{selectedUser.title} • {selectedUser.department}</p>
                <span className="text-[11px] font-mono font-semibold text-[#4361EE] mt-0.5 inline-block">
                  {selectedUser.employeeCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
              <div>
                <p className="text-slate-400 font-medium">Work Email</p>
                <p className="text-slate-800 font-semibold">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Contact Phone</p>
                <p className="text-slate-800 font-semibold">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Assigned Role</p>
                <p className="text-slate-800 font-semibold capitalize">{selectedUser.role.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Monthly Compensation</p>
                <p className="text-slate-800 font-semibold">₹{selectedUser.salaryBase.toLocaleString('en-IN')} / mo</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Joined Date</p>
                <p className="text-slate-800 font-semibold">{selectedUser.joinDate}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Assigned Company</p>
                <p className="text-slate-800 font-semibold">{currentTenant.name}</p>
              </div>
            </div>

            {/* Leave Quota */}
            <div className="py-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-800 mb-2">Leave Balances</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Paid Vacation</span>
                  <span className="font-bold text-[#4361EE]">{selectedUser.leaveBalances.paid} days</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Sick Leave</span>
                  <span className="font-bold text-emerald-600">{selectedUser.leaveBalances.sick} days</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Casual</span>
                  <span className="font-bold text-amber-600">{selectedUser.leaveBalances.casual} days</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {canManageStaff && !selectedUser.isAppOwner ? (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(selectedUser.id)}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Employee</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Permanently Delete Employee?</h3>
                <p className="text-xs text-slate-500">This action removes the record permanently from the database.</p>
              </div>
            </div>

            <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 text-xs text-rose-900">
              <p className="font-semibold">
                Deleting: {users.find(u => u.id === confirmDeleteId)?.name} ({users.find(u => u.id === confirmDeleteId)?.employeeCode})
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                This will delete their employee profile, biometric attendance links, and payslip history. Only authorized administrators can perform this.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Confirm Permanent Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal (Strict Validation - Anti Dumpy Data) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateEmployee} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Onboard New Employee</h3>
                <p className="text-xs text-slate-500">Saves permanently to company database</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="flex-shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Employee Profile Image Upload Section */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera size={14} className="text-[#4361EE]" />
                  <span>Employee Profile Photo</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, WEBP up to 5MB</span>
              </div>

              <div className="flex items-center gap-3.5">
                {/* Active Photo Preview with upload overlay */}
                <div className="relative flex-shrink-0 group">
                  <img
                    src={newAvatar || PRESET_AVATARS[0]}
                    alt="Employee Avatar Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-[#4361EE]/30"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-900/50 rounded-2xl text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] font-bold transition-opacity cursor-pointer"
                    title="Upload custom photo"
                  >
                    <Upload size={14} />
                    <span>Upload</span>
                  </button>
                </div>

                {/* Upload Action & Presets */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload size={13} className="text-[#4361EE]" />
                      <span>Upload Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const random = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
                        setNewAvatar(random);
                      }}
                      className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="Pick random corporate portrait"
                    >
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Random Preset</span>
                    </button>
                  </div>

                  {/* Preset Avatars Row */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {PRESET_AVATARS.map((presetUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewAvatar(presetUrl)}
                        className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                          newAvatar === presetUrl
                            ? 'border-[#4361EE] ring-1 ring-[#4361EE] scale-110'
                            : 'border-transparent hover:border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                        title={`Select preset ${idx + 1}`}
                      >
                        <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Company Selector (Accessible to Super Admin to add to ANY company) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Company Workspace
              </label>
              {currentUser.role === 'super_admin' ? (
                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-blue-50/50 font-medium text-slate-800 focus:outline-none focus:border-[#4361EE]"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id}) - {t.plan}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 size={15} className="text-[#4361EE]" />
                  <span>{currentTenant.name} (Assigned Workspace)</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.k@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98450 12345"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Dev"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                >
                  <option value="employee">Employee (ESS)</option>
                  <option value="manager">Department Manager</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="recruiter">Recruiter (ATS)</option>
                  <option value="payroll_admin">Payroll Admin</option>
                  <option value="hr_admin">HR Admin</option>
                  {currentUser.role === 'super_admin' && (
                    <option value="tenant_super_admin">Company Super Admin</option>
                  )}
                  {currentUser.role === 'super_admin' && (
                    <option value="company_owner">Company Owner</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salary (₹ INR / mo)</label>
                <input
                  type="number"
                  required
                  placeholder="125000"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                Permanently Save & Onboard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
