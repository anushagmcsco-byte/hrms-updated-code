import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Megaphone,
  Smile,
  Pin,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  MessageSquareHeart
} from 'lucide-react';
import { CompanyAnnouncement } from '../types';

export const EngagementView: React.FC = () => {
  const {
    currentUser,
    currentTenant,
    announcements,
    addAnnouncement,
    togglePinAnnouncement,
    acknowledgeAnnouncement,
    deleteAnnouncement,
    enpsResponses,
    submitEnpsResponse
  } = useApp();

  const [activeTab, setActiveTab] = useState<'announcements' | 'enps'>('announcements');
  const [showAddAnn, setShowAddAnn] = useState(false);

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<CompanyAnnouncement['category']>('HR Policy');
  const [annPinned, setAnnPinned] = useState(true);

  // eNPS Survey form state
  const [score, setScore] = useState<number>(9);
  const [surveyTitle, setSurveyTitle] = useState('Q4 Workplace Experience & Culture Pulse');
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const isAdmin =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'tenant_super_admin' ||
    currentUser.role === 'company_owner' ||
    currentUser.role === 'hr_admin' ||
    currentUser.role === 'manager';

  const tenantAnnouncements = useMemo(() => {
    return announcements
      .filter(a => a.tenantId === currentTenant.id)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [announcements, currentTenant.id]);

  const tenantEnps = useMemo(
    () => enpsResponses.filter(r => r.tenantId === currentTenant.id),
    [enpsResponses, currentTenant.id]
  );

  // eNPS formula: % Promoters (9-10) - % Detractors (0-6)
  const enpsStats = useMemo(() => {
    const total = tenantEnps.length;
    if (total === 0) {
      return { total: 0, promoters: 0, passives: 0, detractors: 0, score: 0, avgRating: 0 };
    }
    const promoters = tenantEnps.filter(r => r.score >= 9).length;
    const passives = tenantEnps.filter(r => r.score >= 7 && r.score <= 8).length;
    const detractors = tenantEnps.filter(r => r.score <= 6).length;
    const enpsScore = Math.round(((promoters - detractors) / total) * 100);
    const avgRating = Number((tenantEnps.reduce((s, r) => s + r.score, 0) / total).toFixed(1));
    return { total, promoters, passives, detractors, score: enpsScore, avgRating };
  }, [tenantEnps]);

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    addAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      category: annCategory,
      pinned: annPinned
    });
    setShowAddAnn(false);
    setAnnTitle('');
    setAnnContent('');
  };

  const handleEnpsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitEnpsResponse({
      score,
      surveyTitle,
      comment: comment.trim() || 'Submitted rating via employee pulse check.',
      anonymous
    });
    setComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="text-[#4361EE]" size={22} />
            <span>Employee Experience, Announcements &amp; eNPS Surveys</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Company-wide announcements, policy acknowledgments, and real-time employee satisfaction (eNPS) pulse checks for {currentTenant.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('announcements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                activeTab === 'announcements' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Announcements ({tenantAnnouncements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('enps')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                activeTab === 'enps' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              eNPS Surveys ({tenantEnps.length})
            </button>
          </div>

          {activeTab === 'announcements' && isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddAnn(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} />
              <span>Post Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* Announcements Board */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {tenantAnnouncements.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
              <Megaphone size={28} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-800">No company announcements published yet</p>
              <p className="text-xs text-slate-500">
                Share townhall updates, policy changes, holiday notices, or company milestones with everyone in {currentTenant.name}.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddAnn(true)}
                  className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Publish First Announcement
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tenantAnnouncements.map(ann => {
                const isAck = (ann.acknowledgedBy || []).includes(currentUser.id);
                return (
                  <div
                    key={ann.id}
                    className={`bg-white rounded-xl border p-5 space-y-3 ${
                      ann.pinned ? 'border-[#4361EE]/40 bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold">
                          <span className={ann.category === 'Urgent' ? 'text-rose-600' : 'text-[#4361EE]'}>
                            {ann.category}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500">{ann.authorName}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-slate-400">{ann.createdAt}</span>
                          {ann.pinned && (
                            <span className="text-[#4361EE] inline-flex items-center gap-0.5">
                              <Pin size={11} /> Pinned
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => togglePinAnnouncement(ann.id)}
                            className={`p-1.5 rounded hover:bg-slate-100 cursor-pointer ${
                              ann.pinned ? 'text-[#4361EE]' : 'text-slate-400'
                            }`}
                            title={ann.pinned ? 'Unpin' : 'Pin announcement'}
                          >
                            <Pin size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAnnouncement(ann.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {(ann.acknowledgedBy || []).length} employee{(ann.acknowledgedBy || []).length === 1 ? '' : 's'} acknowledged
                      </span>
                      {isAck ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Acknowledged
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledgeAnnouncement(ann.id)}
                          className="px-3 py-1 text-xs font-semibold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                        >
                          Acknowledge Read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* eNPS & Employee Satisfaction Pulse Surveys */}
      {activeTab === 'enps' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Live eNPS Scoreboard & Submission Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold uppercase text-slate-400">Live eNPS Score</p>
                <p className={`text-2xl font-extrabold mt-1 tabular-nums ${enpsStats.score >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {enpsStats.score >= 0 ? `+${enpsStats.score}` : enpsStats.score}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Range: -100 to +100</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold uppercase text-emerald-700">Promoters (9–10)</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{enpsStats.promoters}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {enpsStats.total > 0 ? Math.round((enpsStats.promoters / enpsStats.total) * 100) : 0}% of votes
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold uppercase text-amber-600">Passives (7–8)</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{enpsStats.passives}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {enpsStats.total > 0 ? Math.round((enpsStats.passives / enpsStats.total) * 100) : 0}% of votes
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold uppercase text-rose-600">Detractors (0–6)</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{enpsStats.detractors}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Avg Score: {enpsStats.avgRating}/10</p>
              </div>
            </div>

            {/* Submit eNPS Pulse Response */}
            <form onSubmit={handleEnpsSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smile size={16} className="text-[#4361EE]" />
                  <span>Submit Monthly eNPS Pulse Check</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  How likely are you to recommend {currentTenant.name} as a great place to work?
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Survey Cycle</label>
                <select
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Q4 Workplace Experience & Culture Pulse">Q4 Workplace Experience &amp; Culture Pulse</option>
                  <option value="Remote & Hybrid Policy Feedback">Remote &amp; Hybrid Policy Feedback</option>
                  <option value="Manager Support & Career Growth Survey">Manager Support &amp; Career Growth Survey</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">Select Rating (0 = Not Likely · 10 = Extremely Likely)</span>
                  <span className="font-mono font-bold text-[#4361EE] tabular-nums">{score} / 10</span>
                </div>
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }, (_, n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScore(n)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer tabular-nums ${
                        score === n
                          ? n >= 9
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : n >= 7
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">What can we improve or keep doing?</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share candid workplace feedback..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded text-[#4361EE]"
                  />
                  <span>Submit anonymously</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Submit Pulse Vote
                </button>
              </div>
            </form>
          </div>

          {/* Right: Recent Pulse Feedback Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <MessageSquareHeart size={15} className="text-[#4361EE]" />
              <span>Recent Pulse Responses</span>
            </h3>

            {tenantEnps.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No eNPS responses recorded yet for {currentTenant.name}. Cast the first vote on the left.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                {tenantEnps.map(resp => (
                  <div key={resp.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{resp.employeeName}</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          resp.score >= 9 ? 'text-emerald-700' : resp.score >= 7 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {resp.score}/10
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{resp.comment}</p>
                    <p className="text-[10px] text-slate-400">
                      {resp.surveyTitle} · {resp.submittedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {showAddAnn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handlePublishAnnouncement} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Publish Company Announcement</h3>
              <button type="button" onClick={() => setShowAddAnn(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Company Offsite & Q4 Holiday Schedule"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as CompanyAnnouncement['category'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="HR Policy">HR Policy</option>
                  <option value="Townhall">Townhall</option>
                  <option value="Event">Event</option>
                  <option value="Payroll & Tax">Payroll &amp; Tax</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annPinned}
                    onChange={(e) => setAnnPinned(e.target.checked)}
                    className="rounded text-[#4361EE]"
                  />
                  <span>Pin to top of feed</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body *</label>
              <textarea
                required
                rows={4}
                placeholder="Write the full company update or policy details..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddAnn(false)} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer">
                Publish Announcement
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
