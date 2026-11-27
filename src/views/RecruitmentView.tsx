import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Briefcase, 
  UserPlus, 
  Search, 
  MapPin, 
  DollarSign, 
  Star, 
  ChevronRight, 
  Plus, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  X
} from 'lucide-react';
import { Candidate, JobOpening } from '../types';
import {
  InterviewsPanel,
  OffersOnboardingPanel,
  CareerPagePreviewPanel
} from '../components/RecruitmentExtendedModules';

export const RecruitmentView: React.FC = () => {
  const { jobs, candidates, interviews, offerLetters, addJobOpening, addCandidate, updateCandidateStage, currentUser, currentTenant, switchTenant, tenants, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'jobs' | 'interviews' | 'offers' | 'career_page'>('pipeline');
  const [selectedJobFilter, setSelectedJobFilter] = useState('all');
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  // New Job state
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newLocation, setNewLocation] = useState('Bengaluru, India / Hybrid');
  const [newType, setNewType] = useState<JobOpening['type']>('Full-time');
  const [newSalary, setNewSalary] = useState('₹18 LPA - ₹28 LPA');

  // New Candidate state
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candJobId, setCandJobId] = useState('');
  const [candExp, setCandExp] = useState('4');
  const [candRating, setCandRating] = useState('4');

  const stages: Array<Candidate['stage']> = [
    'Applied',
    'Screening',
    'Technical',
    'HR Interview',
    'Offered',
    'Hired'
  ];

  // Strict Tenant Data Isolation for Talent Category
  const isSuperAdmin = currentUser.role === 'super_admin';
  const tenantJobs = jobs.filter(j => j.tenantId === currentTenant.id);
  const tenantCandidates = candidates.filter(c => c.tenantId === currentTenant.id);

  // Dynamic Talent Metrics
  const openPositionsCount = tenantJobs.length;
  const totalCandidatesCount = tenantCandidates.length;
  const inInterviewCount = tenantCandidates.filter(c => c.stage === 'Technical' || c.stage === 'HR Interview').length;
  const offeredHiredCount = tenantCandidates.filter(c => c.stage === 'Offered' || c.stage === 'Hired').length;

  const filteredCandidates = tenantCandidates.filter(c => {
    if (selectedJobFilter === 'all') return true;
    return c.jobId === selectedJobFilter;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    addJobOpening({
      title: newTitle,
      department: newDept,
      location: newLocation,
      type: newType,
      status: 'published',
      salaryRange: newSalary
    });
    setShowAddJobModal(false);
    setNewTitle('');
    showToast(`Job requisition posted for ${currentTenant.name}!`);
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim() || !candEmail.trim()) return;
    const selectedJob = tenantJobs.find(j => j.id === candJobId) || tenantJobs[0];
    addCandidate({
      name: candName.trim(),
      email: candEmail.trim(),
      phone: candPhone.trim() || '+91 98450 00000',
      jobId: selectedJob?.id || 'general-open',
      jobTitle: selectedJob?.title || 'General Application',
      stage: 'Applied',
      rating: Number(candRating) || 4,
      experienceYears: Number(candExp) || 2
    });
    setShowAddCandidateModal(false);
    setCandName('');
    setCandEmail('');
    setCandPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-[#4361EE]" size={22} />
            <span>Talent Acquisition & Candidate ATS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict multi-tenant talent isolation, structured hiring pipelines, and Indian compensation benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddCandidateModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-[#4361EE] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add Candidate</span>
          </button>

          <button
            onClick={() => setShowAddJobModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* ATS Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
        {[
          { id: 'pipeline', label: `Kanban Pipeline (${tenantCandidates.length})` },
          { id: 'jobs', label: `Job Openings (${tenantJobs.length})` },
          { id: 'interviews', label: `Interviews & Scorecards (${interviews.filter(i => i.tenantId === currentTenant.id).length})` },
          { id: 'offers', label: `Offers & Onboarding (${offerLetters.filter(o => o.tenantId === currentTenant.id).length})` },
          { id: 'career_page', label: 'Branded Career Page' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tenant & Talent Isolation Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4361EE] flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">Talent Isolation Category: Active</h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Partition: {currentTenant.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Requisitions, candidate applications, and salary budgets strictly isolated to <strong className="text-slate-800">{currentTenant.name}</strong>. Zero cross-tenant leakage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold pl-1">Switch Organization:</span>
          <select
            value={currentTenant.id}
            onChange={(e) => switchTenant(e.target.value as any)}
            className="text-xs font-bold bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-[#4361EE]"
          >
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.plan})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Numbers from Talent Isolation Category */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Open Positions</p>
          <p className="text-2xl font-black text-[#14213D] mt-1">{openPositionsCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{currentTenant.name}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Candidates</p>
          <p className="text-2xl font-black text-[#4361EE] mt-1">{totalCandidatesCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Active in Funnel</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Interview Stages</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{inInterviewCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Technical & HR Rounds</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Offers & Hired</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{offeredHiredCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">This Month</p>
        </div>
      </div>

      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Job Filter Pill */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-500">Filter Position:</span>
            <button
              onClick={() => setSelectedJobFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedJobFilter === 'all' ? 'bg-[#14213D] text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              All Openings ({tenantCandidates.length})
            </button>
            {tenantJobs.map(j => (
              <button
                key={j.id}
                onClick={() => setSelectedJobFilter(j.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedJobFilter === j.id ? 'bg-[#4361EE] text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {j.title}
              </button>
            ))}
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageCandidates = filteredCandidates.filter(c => c.stage === stage);
              return (
                <div key={stage} className="bg-slate-100/80 rounded-xl p-3 flex flex-col min-w-[210px] border border-slate-200/60">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800">{stage}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                      {stageCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {stageCandidates.map((cand) => (
                      <div 
                        key={cand.id} 
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-[#4361EE] transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">{cand.name}</p>
                          <div className="flex items-center text-amber-500 text-[10px] font-bold">
                            <Star size={11} className="fill-current mr-0.5" />
                            <span>{cand.rating}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{cand.jobTitle}</p>
                        <p className="text-[10px] text-slate-400">{cand.experienceYears}y exp • {cand.phone}</p>

                        {/* Stage mover buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-mono">CV verified</span>
                          <div className="flex items-center gap-1">
                            {stage !== 'Hired' && (
                              <button
                                onClick={() => {
                                  const nextIdx = stages.indexOf(stage) + 1;
                                  if (nextIdx < stages.length) {
                                    updateCandidateStage(cand.id, stages[nextIdx]);
                                  }
                                }}
                                title="Move to next stage"
                                className="text-[10px] px-1.5 py-0.5 font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded transition-colors flex items-center gap-0.5"
                              >
                                <span>Advance</span>
                                <ArrowRight size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {stageCandidates.length === 0 && (
                      <div className="text-center py-6 text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                        Empty stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantJobs.map((job) => (
            <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4361EE] bg-blue-50 px-2 py-0.5 rounded-full">
                    {job.department}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{job.status}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{job.title}</h3>

                <div className="space-y-1.5 mt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{job.location} ({job.type})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500">₹</span>
                    <span>{job.salaryRange}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{job.applicantsCount} active applicants</span>
                <button
                  onClick={() => {
                    setSelectedJobFilter(job.id);
                    setActiveTab('pipeline');
                  }}
                  className="font-bold text-[#4361EE] hover:underline flex items-center gap-1"
                >
                  <span>View Pipeline</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'interviews' && <InterviewsPanel />}
      {activeTab === 'offers' && <OffersOnboardingPanel />}
      {activeTab === 'career_page' && <CareerPagePreviewPanel />}

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateJob} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Post New Requisition</h3>
              <button 
                type="button" 
                onClick={() => setShowAddJobModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requisition Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Staff Security Architect"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Customer Experience">Customer Experience</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance & Operations">Finance & Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as JobOpening['type'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Office</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Annual Compensation</label>
              <input
                type="text"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddJobModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Publish Opening
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateCandidate} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Candidate to {currentTenant.name}</h3>
              <button
                type="button"
                onClick={() => setShowAddCandidateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan Kulkarni"
                value={candName}
                onChange={(e) => setCandName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rohan@example.com"
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98450 12345"
                  value={candPhone}
                  onChange={(e) => setCandPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Requisition</label>
              <select
                value={candJobId}
                onChange={(e) => setCandJobId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                {tenantJobs.length === 0 ? (
                  <option value="">General Application</option>
                ) : (
                  tenantJobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={candExp}
                  onChange={(e) => setCandExp(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Rating (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={candRating}
                  onChange={(e) => setCandRating(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCandidateModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                Add Candidate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
