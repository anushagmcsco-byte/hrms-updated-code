import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Target,
  Plus,
  Trash2,
  X,
  Award,
  MessageSquareHeart,
  Star,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ContinuousFeedback, PerformanceReview } from '../types';

export const PerformanceView: React.FC = () => {
  const {
    users,
    currentUser,
    currentTenant,
    performanceGoals,
    addPerformanceGoal,
    updatePerformanceGoalProgress,
    deletePerformanceGoal,
    performanceReviews,
    addPerformanceReview,
    updatePerformanceReviewStatus,
    continuousFeedback,
    addContinuousFeedback,
    updatePipStatus,
    deleteContinuousFeedback,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'okrs' | 'appraisals' | 'feedback'>('okrs');

  // OKR Modal
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [title, setTitle] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [cycle, setCycle] = useState('Q4 2026');
  const [progress, setProgress] = useState('25');

  // Appraisal Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [revEmployeeId, setRevEmployeeId] = useState('');
  const [revPeriod, setRevPeriod] = useState<PerformanceReview['period']>('Annual 2026');
  const [revRating, setRevRating] = useState('4');
  const [revGoalProgress, setRevGoalProgress] = useState('85');
  const [revStrengths, setRevStrengths] = useState('');
  const [revImprovements, setRevImprovements] = useState('');

  // Feedback / PIP Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [fbEmployeeId, setFbEmployeeId] = useState('');
  const [fbType, setFbType] = useState<ContinuousFeedback['type']>('Kudos');
  const [fbCompetency, setFbCompetency] = useState('Execution & Ownership');
  const [fbMessage, setFbMessage] = useState('');
  const [fbPipTargetDate, setFbPipTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split('T')[0];
  });

  const isManagerOrHR =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'tenant_super_admin' ||
    currentUser.role === 'company_owner' ||
    currentUser.role === 'hr_admin' ||
    currentUser.role === 'manager' ||
    currentUser.role === 'team_lead';

  const tenantUsers = users.filter((u) => u.tenantId === currentTenant.id && !u.isAppOwner);
  const tenantGoals = performanceGoals.filter((g) => g.tenantId === currentTenant.id);
  const tenantReviews = performanceReviews.filter((r) => r.tenantId === currentTenant.id);
  const tenantFeedback = continuousFeedback.filter((f) => f.tenantId === currentTenant.id);

  const avgProgress =
    tenantGoals.length > 0
      ? Math.round(tenantGoals.reduce((sum, g) => sum + g.progress, 0) / tenantGoals.length)
      : 0;
  const avgRating =
    tenantReviews.length > 0
      ? (tenantReviews.reduce((sum, r) => sum + r.rating, 0) / tenantReviews.length).toFixed(1)
      : '—';
  const activePipCount = tenantFeedback.filter((f) => f.type === 'PIP' && f.pipStatus === 'active').length;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addPerformanceGoal({
      title: title.trim(),
      ownerName: ownerName.trim() || currentUser.name,
      department,
      cycle,
      progress: Number(progress) || 0,
    });
    setShowAddGoalModal(false);
    setTitle('');
    setOwnerName('');
    setProgress('25');
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = tenantUsers.find((u) => u.id === revEmployeeId) || tenantUsers[0] || currentUser;
    if (!revStrengths.trim()) return;
    addPerformanceReview({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      period: revPeriod,
      rating: Math.min(5, Math.max(1, Number(revRating) || 4)),
      goalsProgress: Math.min(100, Math.max(0, Number(revGoalProgress) || 80)),
      strengths: revStrengths.trim(),
      improvements: revImprovements.trim() || 'Continue cross-functional collaboration and mentoring.',
      status: 'submitted',
    });
    setShowReviewModal(false);
    setRevStrengths('');
    setRevImprovements('');
  };

  const handleCreateFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = tenantUsers.find((u) => u.id === fbEmployeeId) || tenantUsers[0] || currentUser;
    if (!fbMessage.trim()) return;
    addContinuousFeedback({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      type: fbType,
      competency: fbCompetency.trim() || 'Core Competency',
      message: fbMessage.trim(),
      ...(fbType === 'PIP' ? { pipTargetDate: fbPipTargetDate, pipStatus: 'active' as const } : {}),
    });
    setShowFeedbackModal(false);
    setFbMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-[#4361EE]" size={22} />
            <span>Performance Reviews, OKRs &amp; Continuous Feedback</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quarterly OKRs, 360° appraisal cycles, peer kudos, and structured PIP tracking for{' '}
            <strong className="text-slate-700">{currentTenant.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'okrs' && (
            <button
              type="button"
              onClick={() => setShowAddGoalModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Add OKR / Goal</span>
            </button>
          )}
          {activeTab === 'appraisals' && (
            <button
              type="button"
              onClick={() => {
                setRevEmployeeId(tenantUsers[0]?.id || currentUser.id);
                setShowReviewModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Submit 360° Appraisal</span>
            </button>
          )}
          {activeTab === 'feedback' && (
            <button
              type="button"
              onClick={() => {
                setFbEmployeeId(tenantUsers[0]?.id || currentUser.id);
                setShowFeedbackModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Give Feedback / Start PIP</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
        {[
          { id: 'okrs', label: `OKRs & Goals (${tenantGoals.length})`, icon: Target },
          { id: 'appraisals', label: `Appraisal Cycles 360° (${tenantReviews.length})`, icon: Award },
          { id: 'feedback', label: `Continuous Feedback & PIP (${tenantFeedback.length})`, icon: MessageSquareHeart },
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

      {/* Dynamic KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Avg OKR Completion</span>
          <p className="text-xl font-bold text-[#4361EE] font-mono tabular-nums mt-1">{avgProgress}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{tenantGoals.length} active corporate goals</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Avg Appraisal Score</span>
          <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {avgRating} {avgRating !== '—' ? '/ 5.0' : ''}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{tenantReviews.length} submitted reviews</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Peer Kudos &amp; Notes</span>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {tenantFeedback.filter((f) => f.type !== 'PIP').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Continuous recognition feed</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Active PIP Plans</span>
          <p className="text-xl font-bold text-amber-600 font-mono tabular-nums mt-1">{activePipCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Structured coaching plans</p>
        </div>
      </div>

      {/* TAB 1: OKRs & Goals */}
      {activeTab === 'okrs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Strategic Departmental OKRs ({currentTenant.name})</span>
            <span className="text-xs text-slate-400 font-mono">{tenantGoals.length} tracked</span>
          </h3>

          {tenantGoals.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Target size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No OKRs or goals added yet for {currentTenant.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "Add OKR / Goal" above to create live goals that sync across all devices.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenantGoals.map((g) => (
                <div key={g.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{g.title}</span>
                      <span className="ml-2 text-[11px] font-semibold text-[#4361EE]">· {g.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#4361EE] font-mono tabular-nums">{g.progress}%</span>
                      <button
                        type="button"
                        onClick={() => deletePerformanceGoal(g.id)}
                        title="Delete goal"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        g.progress === 100 ? 'bg-emerald-500' : 'bg-[#4361EE]'
                      }`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
                    <span>
                      Accountable: <strong className="text-slate-700">{g.ownerName}</strong> · {g.cycle}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={g.progress}
                      onChange={(e) => updatePerformanceGoalProgress(g.id, Number(e.target.value))}
                      className="w-28 accent-[#4361EE] cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 360° Appraisal Cycles */}
      {activeTab === 'appraisals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Structured Appraisal Cycles (Self &amp; Manager 360°)</h3>
              <p className="text-xs text-slate-500">
                Evaluate goal attainment, strengths, and development areas across review cycles.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Goals Score</th>
                  <th className="py-3 px-4">Strengths &amp; Growth Areas</th>
                  <th className="py-3 px-4">Status</th>
                  {isManagerOrHR && <th className="py-3 px-4 text-right">Workflow</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenantReviews.length === 0 ? (
                  <tr>
                    <td colSpan={isManagerOrHR ? 7 : 6} className="py-10 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No appraisal reviews submitted yet for {currentTenant.name}.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Click "Submit 360° Appraisal" above to record an employee performance review.
                      </p>
                    </td>
                  </tr>
                ) : (
                  tenantReviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{rev.employeeName}</p>
                        <p className="text-[11px] text-slate-500">{rev.department}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{rev.period}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-500" />
                          {rev.rating}.0 / 5
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#4361EE] tabular-nums">
                        {rev.goalsProgress}%
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-800 line-clamp-1">
                          <strong>Strengths:</strong> {rev.strengths}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          <strong>Improve:</strong> {rev.improvements}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            rev.status === 'completed'
                              ? 'text-emerald-700'
                              : rev.status === 'under_review'
                              ? 'text-[#4361EE]'
                              : 'text-amber-600'
                          }`}
                        >
                          {rev.status.replace('_', ' ')}
                        </span>
                      </td>
                      {isManagerOrHR && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {rev.status === 'submitted' && (
                            <button
                              type="button"
                              onClick={() => updatePerformanceReviewStatus(rev.id, 'under_review')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded mr-1.5 cursor-pointer"
                            >
                              Calibrate
                            </button>
                          )}
                          {rev.status !== 'completed' ? (
                            <button
                              type="button"
                              onClick={() => updatePerformanceReviewStatus(rev.id, 'completed')}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                            >
                              Finalize
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Finalized</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Continuous Feedback & PIP */}
      {activeTab === 'feedback' && (
        <div className="space-y-3">
          {tenantFeedback.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
              <MessageSquareHeart size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No continuous feedback or PIP logs yet for {currentTenant.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Recognize team members with Peer Kudos, share 360° constructive feedback, or document Performance Improvement Plans.
              </p>
            </div>
          ) : (
            tenantFeedback.map((fb) => (
              <div
                key={fb.id}
                className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  fb.type === 'PIP' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span
                      className={`font-bold uppercase tracking-wider text-[10px] ${
                        fb.type === 'PIP'
                          ? 'text-amber-700'
                          : fb.type === 'Kudos'
                          ? 'text-emerald-700'
                          : 'text-[#4361EE]'
                      }`}
                    >
                      {fb.type}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-900">{fb.employeeName}</span>
                    <span className="text-slate-500">({fb.department})</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-500">{fb.competency}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{fb.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>From: <strong className="text-slate-600">{fb.authorName}</strong></span>
                    <span className="font-mono">{fb.createdAt}</span>
                    {fb.type === 'PIP' && fb.pipTargetDate && (
                      <span className="text-amber-700 font-semibold">
                        PIP Review Target: {fb.pipTargetDate} ({(fb.pipStatus || 'active').toUpperCase()})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {fb.type === 'PIP' && isManagerOrHR && fb.pipStatus === 'active' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updatePipStatus(fb.id, 'improved')}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                      >
                        Mark Improved
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePipStatus(fb.id, 'closed')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        Close PIP
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteContinuousFeedback(fb.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add OKR Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateGoal}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create OKR / Performance Goal</h3>
              <button
                type="button"
                onClick={() => setShowAddGoalModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Objective / Goal Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Launch mobile self-service attendance rollout"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner</label>
                <input
                  type="text"
                  list="tenant-owners-list"
                  placeholder={currentUser.name}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
                <datalist id="tenant-owners-list">
                  {tenantUsers.map((u) => (
                    <option key={u.id} value={u.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Cycle</label>
                <input
                  type="text"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Progress (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddGoalModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submit Appraisal Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateReview}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Submit 360° Appraisal Review</h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={revEmployeeId}
                  onChange={(e) => setRevEmployeeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  {tenantUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Period</label>
                <select
                  value={revPeriod}
                  onChange={(e) => setRevPeriod(e.target.value as PerformanceReview['period'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Q3 2026">Q3 2026</option>
                  <option value="Annual 2026">Annual 2026</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={revRating}
                  onChange={(e) => setRevRating(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Attainment (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={revGoalProgress}
                  onChange={(e) => setRevGoalProgress(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Key Strengths &amp; Wins *</label>
              <textarea
                required
                rows={2}
                placeholder="Highlight measurable impact and ownership..."
                value={revStrengths}
                onChange={(e) => setRevStrengths(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Development Areas</label>
              <textarea
                rows={2}
                placeholder="Skills or leadership habits to strengthen next quarter..."
                value={revImprovements}
                onChange={(e) => setRevImprovements(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Submit Appraisal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Continuous Feedback / PIP Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateFeedback}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Share Continuous Feedback or Start PIP</h3>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Employee</label>
                <select
                  value={fbEmployeeId}
                  onChange={(e) => setFbEmployeeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  {tenantUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Type</label>
                <select
                  value={fbType}
                  onChange={(e) => setFbType(e.target.value as ContinuousFeedback['type'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Kudos">Kudos / Recognition</option>
                  <option value="360 Peer">360° Peer Review</option>
                  <option value="Constructive">Constructive Coaching</option>
                  {isManagerOrHR && <option value="PIP">Performance Improvement Plan (PIP)</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fbType === 'PIP' ? '' : 'col-span-2'}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Competency Tag</label>
                <input
                  type="text"
                  value={fbCompetency}
                  onChange={(e) => setFbCompetency(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              {fbType === 'PIP' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PIP Review Target Date</label>
                  <input
                    type="date"
                    required
                    value={fbPipTargetDate}
                    onChange={(e) => setFbPipTargetDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback / Action Plan *</label>
              <textarea
                required
                rows={3}
                placeholder="Write specific, actionable observations..."
                value={fbMessage}
                onChange={(e) => setFbMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Post Feedback
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
