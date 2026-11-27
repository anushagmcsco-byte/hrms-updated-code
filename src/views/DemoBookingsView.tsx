import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Search,
  Filter,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Mail,
  Phone,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  FileText,
  Video,
  Plus,
  X,
  MessageCircle,
  MessageSquare,
  Crown,
  ArrowRight
} from 'lucide-react';
import { ClientDemoBooking } from '../types';

const formatWhatsAppHref = (phone: string, text: string) => {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

const formatSmsHref = (phone: string, text: string) => {
  const clean = phone.replace(/\s+/g, '');
  return `sms:${clean}?body=${encodeURIComponent(text)}`;
};

export const DemoBookingsView: React.FC = () => {
  const {
    demoBookings,
    updateDemoBookingStatus,
    deleteDemoBooking,
    resendDemoVerificationEmail,
    setIsBookDemoModalOpen,
    setActiveDemoRequestForVerification,
    dispatchedEmails,
    setActiveDispatchedEmailModal,
    setCurrentView,
    currentUser,
    currentTenant,
    tenants,
    switchTenant,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'company'>(
    currentUser.role === 'super_admin' ? 'all' : 'company'
  );
  const [selectedBookingForEmailModal, setSelectedBookingForEmailModal] = useState<ClientDemoBooking | null>(null);

  const scopedBookings = demoBookings.filter(b => {
    if (scopeFilter === 'company') {
      return (
        b.linkedTenantId === currentTenant.id ||
        b.companyName.trim().toLowerCase() === currentTenant.name.trim().toLowerCase()
      );
    }
    return true;
  });

  const filteredBookings = scopedBookings.filter(b => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.fullName.toLowerCase().includes(q) ||
      b.companyName.toLowerCase().includes(q) ||
      b.workEmail.toLowerCase().includes(q) ||
      (b.companyOwnerEmail || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q) ||
      b.assignedSalesEngineer.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = scopedBookings.filter(b => b.status === 'scheduled' || b.status === 'email_verified').length;
  const pendingCount = scopedBookings.filter(b => b.status === 'pending_verification').length;
  const avgLeadScore = scopedBookings.length
    ? Math.round(scopedBookings.reduce((acc, curr) => acc + curr.leadScore, 0) / scopedBookings.length)
    : 0;

  const visibleEmails =
    scopeFilter === 'company'
      ? dispatchedEmails.filter(
          m =>
            m.tenantId === currentTenant.id ||
            m.companyName.trim().toLowerCase() === currentTenant.name.trim().toLowerCase()
        )
      : dispatchedEmails;

  const exportLeadsCsv = () => {
    const headers = [
      'ID',
      'Client Name',
      'Client Email',
      'Company Owner Email',
      'Phone',
      'Message Channel',
      'Company Name',
      'Linked Tenant ID',
      'Workforce Size',
      'Current HRMS',
      'Selected Modules',
      'Preferred Date',
      'Slot',
      'Status',
      'Lead Score',
      'Assigned Solutions Architect',
      'Created At'
    ];

    const rows = filteredBookings.map(b => [
      `"${b.id}"`,
      `"${b.fullName}"`,
      `"${b.workEmail}"`,
      `"${b.companyOwnerEmail || b.workEmail}"`,
      `"${b.phone}"`,
      `"${b.messageChannel || 'both'}"`,
      `"${b.companyName}"`,
      `"${b.linkedTenantId || ''}"`,
      `"${b.companySize}"`,
      `"${b.currentHrms}"`,
      `"${b.selectedModules.join(', ')}"`,
      `"${b.preferredDate}"`,
      `"${b.preferredTimeSlot}"`,
      `"${b.status}"`,
      b.leadScore,
      `"${b.assignedSalesEngineer}"`,
      `"${b.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NattonFlow_Verified_Client_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Client demo leads exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-[#4361EE]" size={22} />
              <span>Client Demo Requests & Verified Leads Registry</span>
            </h1>
            <span className="bg-blue-100 text-[#4361EE] text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
              SMS/WhatsApp + Dual Email Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracks SMS/WhatsApp dispatches, Client & Company Owner emails, and dynamic updates to each Company Account, Super Admin, and HR Admin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setCurrentView('spec_document')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={14} className="text-[#4361EE]" />
            <span>View RSD Spec</span>
          </button>

          <button
            onClick={exportLeadsCsv}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Leads CSV</span>
          </button>

          <button
            onClick={() => {
              setActiveDemoRequestForVerification(null);
              setIsBookDemoModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold bg-[#4361EE] hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Book Live Demo</span>
          </button>
        </div>
      </div>

      {/* Dispatched Enterprise Client & Owner Emails Banner */}
      {visibleEmails.length > 0 && (
        <div className="bg-gradient-to-r from-[#14213D] to-[#1e325c] rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4361EE] flex items-center justify-center text-white flex-shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold">Client & Owner Emails Dispatched ({visibleEmails.length})</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Live Manifest
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Personalized manifests dispatched to Client Coordinators and Company Owners with synced workspace credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {visibleEmails.slice(0, 4).map(m => (
              <button
                key={m.id}
                onClick={() => setActiveDispatchedEmailModal(m)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Inspect email sent to ${m.recipientName} (${m.recipientRoleLabel || 'Admin'})`}
              >
                <Mail size={12} className="text-[#4361EE]" />
                <span className="truncate max-w-[165px]">
                  {m.recipientName} • {m.recipientRoleLabel?.includes('Owner') ? 'Owner' : m.companyName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{scopeFilter === 'company' ? `${currentTenant.name.split(' ')[0]} Demo Requests` : 'Total Demo Requests'}</span>
            <Calendar size={16} className="text-[#4361EE]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{scopedBookings.length}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Active Pipeline</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Verified Genuine Clients</span>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{verifiedCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {scopedBookings.length ? Math.round((verifiedCount / scopedBookings.length) * 100) : 0}% Conversion
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending OTP Verification</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingCount}</span>
            <span className="text-[11px] text-slate-400">Sent via SMS / WhatsApp & Email</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average Lead Quality Score</span>
            <Sparkles size={16} className="text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{avgLeadScore}</span>
            <span className="text-[11px] text-purple-600 font-bold">/ 100 Quality</span>
          </div>
        </div>
      </div>

      {/* Filter, Scope Switcher, and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search client, owner email, phone, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4361EE] bg-[#F7F9FC]"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScopeFilter('company')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                scopeFilter === 'company' ? 'bg-white text-[#14213D] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Company
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                scopeFilter === 'all' ? 'bg-white text-[#14213D] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Companies ({demoBookings.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 whitespace-nowrap">
            <Filter size={13} />
            <span>Status:</span>
          </span>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'email_verified', label: 'Verified' },
            { id: 'pending_verification', label: 'Pending OTP' },
            { id: 'rejected_dummy', label: 'Dummy / Blocked' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#14213D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Client & Organization</th>
                <th className="py-3 px-4">Client & Company Owner Emails</th>
                <th className="py-3 px-4">Phone & SMS / WhatsApp</th>
                <th className="py-3 px-4">Account & Admins Updated</th>
                <th className="py-3 px-4">Requested Demo Slot</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No demo bookings found matching the current filters. Click &ldquo;Book Live Demo&rdquo; to create one!
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const ownerEmail = b.companyOwnerEmail || b.workEmail;
                  const channel = b.messageChannel || 'both';
                  const dispatchCount = b.messageDispatches?.length || 0;
                  const linkedTenant = b.linkedTenantId
                    ? tenants.find(t => t.id === b.linkedTenantId)
                    : undefined;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Client & Organization */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{b.fullName}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 size={12} className="text-slate-400" />
                            <span>{b.companyName}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {b.companySize} staff • Score: <strong>{b.leadScore}/100</strong>
                          </p>
                        </div>
                      </td>

                      {/* Client & Company Owner Emails */}
                      <td className="py-3.5 px-4 space-y-1">
                        <p className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Mail size={12} className="text-[#4361EE] flex-shrink-0" />
                          <span className="truncate max-w-[190px]" title={b.workEmail}>{b.workEmail}</span>
                        </p>
                        <p className="font-medium text-amber-800 flex items-center gap-1.5 text-[11px]">
                          <Crown size={12} className="text-amber-500 flex-shrink-0" />
                          <span className="truncate max-w-[190px]" title={ownerEmail}>Owner: {ownerEmail}</span>
                        </p>
                        <div>
                          {b.isCorporateEmail ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 size={10} />
                              Verified Corporate Domain
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <AlertTriangle size={10} />
                              Personal / External Domain
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone & SMS/WhatsApp Status */}
                      <td className="py-3.5 px-4 space-y-1.5">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Phone size={12} className="text-emerald-600" />
                          <span>{b.phone}</span>
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {(channel === 'whatsapp' || channel === 'both') && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                              <MessageCircle size={10} />
                              WhatsApp Sent
                            </span>
                          )}
                          {(channel === 'sms' || channel === 'both') && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                              <MessageSquare size={10} />
                              SMS Sent
                            </span>
                          )}
                          {dispatchCount > 0 && (
                            <span className="text-[10px] text-slate-400">({dispatchCount})</span>
                          )}
                        </div>
                      </td>

                      {/* Linked Account & Admins Updated */}
                      <td className="py-3.5 px-4 space-y-1">
                        {linkedTenant ? (
                          <button
                            type="button"
                            onClick={() => {
                              switchTenant(linkedTenant.id);
                              showToast(`Switched active workspace to ${linkedTenant.name}`);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4361EE] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                            title="Switch to this company workspace"
                          >
                            <Building2 size={11} />
                            <span className="truncate max-w-[140px]">{linkedTenant.name}</span>
                            <ArrowRight size={10} />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {b.linkedTenantId || 'Synced'}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                            Super Admin ✓
                          </span>
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                            HR Admin ✓
                          </span>
                        </div>
                      </td>

                      {/* Slot */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900 flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{b.preferredDate}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>{b.preferredTimeSlot}</span>
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {b.status === 'scheduled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            Scheduled & Synced
                          </span>
                        )}
                        {b.status === 'email_verified' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ShieldCheck size={12} />
                            Email Verified
                          </span>
                        )}
                        {b.status === 'pending_verification' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} />
                            Pending OTP ({b.verificationToken})
                          </span>
                        )}
                        {b.status === 'rejected_dummy' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle size={12} />
                            Blocked Dummy Lead
                          </span>
                        )}
                        {b.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Completed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'pending_verification' && (
                            <button
                              onClick={() => {
                                setActiveDemoRequestForVerification(b);
                                setIsBookDemoModalOpen(true);
                              }}
                              title="Open verification dialog to enter OTP code"
                              className="px-2.5 py-1 text-[11px] font-bold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            >
                              Enter OTP
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedBookingForEmailModal(b)}
                            title="Inspect SMS/WhatsApp, Client & Owner Emails, and Admin Sync"
                            className="p-1.5 text-slate-500 hover:text-[#4361EE] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Mail size={15} />
                          </button>

                          {b.meetingLink && (
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Launch video meeting"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Video size={15} />
                            </a>
                          )}

                          <button
                            onClick={() => deleteDemoBooking(b.id)}
                            title="Delete demo request record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Channel Dispatch & Admin Sync Audit Modal */}
      {selectedBookingForEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-[#14213D] text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span className="text-xs font-bold">
                  Multi-Channel Dispatch Audit — {selectedBookingForEmailModal.companyName}
                </span>
              </div>
              <button
                onClick={() => setSelectedBookingForEmailModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Dual Email & Account Sync Metadata */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <p>
                  <span className="font-semibold text-slate-900">Client Email:</span>{' '}
                  {selectedBookingForEmailModal.fullName} &lt;{selectedBookingForEmailModal.workEmail}&gt;
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Company Owner Email:</span>{' '}
                  {selectedBookingForEmailModal.companyOwnerName || 'Company Owner'} &lt;
                  {selectedBookingForEmailModal.companyOwnerEmail || selectedBookingForEmailModal.workEmail}&gt;
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Mobile ({(selectedBookingForEmailModal.messageChannel || 'both').toUpperCase()}):</span>{' '}
                  {selectedBookingForEmailModal.phone}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Updated Company Workspace & Admins:</span>{' '}
                  <span className="text-emerald-700 font-semibold">
                    {selectedBookingForEmailModal.linkedTenantId || 'Synced'} —{' '}
                    {(selectedBookingForEmailModal.updatedAdminsSummary || ['Platform Super Admin', 'Company Super Admin', 'HR Admin']).join(' • ')}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Scheduled Slot:</span>{' '}
                  {selectedBookingForEmailModal.preferredDate} ({selectedBookingForEmailModal.preferredTimeSlot})
                </p>
              </div>

              {/* SMS & WhatsApp Message Dispatches */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone size={14} className="text-emerald-600" />
                  <span>SMS / WhatsApp Message Logs ({selectedBookingForEmailModal.phone})</span>
                </h4>

                {(selectedBookingForEmailModal.messageDispatches && selectedBookingForEmailModal.messageDispatches.length > 0
                  ? selectedBookingForEmailModal.messageDispatches
                  : [
                      {
                        id: 'fallback-wa',
                        channel: 'whatsapp' as const,
                        recipientPhone: selectedBookingForEmailModal.phone,
                        messageBody: `NattonFlow HR Demo for ${selectedBookingForEmailModal.companyName} | OTP: ${selectedBookingForEmailModal.verificationToken} | Slot: ${selectedBookingForEmailModal.preferredDate} (${selectedBookingForEmailModal.preferredTimeSlot}) | Room: ${selectedBookingForEmailModal.meetingLink}`,
                        stage: 'verification_otp' as const,
                        sentAt: selectedBookingForEmailModal.verificationSentAt,
                        status: 'delivered' as const
                      }
                    ]
                ).map(d => (
                  <div key={d.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        d.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {d.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} • {d.stage === 'booking_confirmed' ? 'Booking Confirmed' : 'OTP Verification'}
                      </span>
                      <a
                        href={
                          d.channel === 'whatsapp'
                            ? formatWhatsAppHref(d.recipientPhone, d.messageBody)
                            : formatSmsHref(d.recipientPhone, d.messageBody)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#4361EE] hover:underline flex items-center gap-1"
                      >
                        <span>Open in {d.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <pre className="text-[11px] whitespace-pre-wrap font-sans text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      {d.messageBody}
                    </pre>
                  </div>
                ))}
              </div>

              {/* Email Manifest Preview */}
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4361EE] text-white flex items-center justify-center font-bold">
                      NF
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">NattonFlow HR Enterprise Team</p>
                      <p className="text-[10px] text-slate-500">demos@nattonflow.com</p>
                    </div>
                  </div>
                  <div className="bg-[#14213D] text-white font-mono text-lg font-black px-4 py-1 rounded-lg tracking-widest">
                    OTP: {selectedBookingForEmailModal.verificationToken}
                  </div>
                </div>

                <p>
                  Sent to Client (<strong>{selectedBookingForEmailModal.workEmail}</strong>) and Company Owner (
                  <strong>{selectedBookingForEmailModal.companyOwnerEmail || selectedBookingForEmailModal.workEmail}</strong>).
                </p>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                  <p><strong>Assigned Architect:</strong> {selectedBookingForEmailModal.assignedSalesEngineer}</p>
                  <p><strong>Requested Modules:</strong> {selectedBookingForEmailModal.selectedModules.join(', ')}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const token = resendDemoVerificationEmail(selectedBookingForEmailModal.id);
                    setSelectedBookingForEmailModal({
                      ...selectedBookingForEmailModal,
                      verificationToken: token
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Resend SMS/WhatsApp & Email Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateDemoBookingStatus(selectedBookingForEmailModal.id, 'scheduled', 'Manually verified by admin');
                    setSelectedBookingForEmailModal(null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Manually Approve & Schedule</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

