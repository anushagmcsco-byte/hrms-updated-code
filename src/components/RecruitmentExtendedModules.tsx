import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Video,
  FileSignature,
  Globe,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  UserCheck,
  MapPin,
  Briefcase,
  X,
  Star,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { InterviewSchedule, OfferLetter } from '../types';

export const InterviewsPanel: React.FC = () => {
  const {
    interviews,
    candidates,
    users,
    currentTenant,
    scheduleInterview,
    updateInterviewStatus,
    deleteInterview,
  } = useApp();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [candidateId, setCandidateId] = useState('');
  const [round, setRound] = useState<InterviewSchedule['round']>('Technical');
  const [interviewerName, setInterviewerName] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [mode, setMode] = useState<InterviewSchedule['mode']>('Video Call');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hr-panel-room');

  const [evalModalId, setEvalModalId] = useState<string | null>(null);
  const [evalScore, setEvalScore] = useState('4');
  const [evalFeedback, setEvalFeedback] = useState('');

  const tenantInterviews = interviews.filter((i) => i.tenantId === currentTenant.id);
  const tenantCandidates = candidates.filter((c) => c.tenantId === currentTenant.id);
  const tenantStaff = users.filter((u) => u.tenantId === currentTenant.id && !u.isAppOwner);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = tenantCandidates.find((c) => c.id === candidateId) || tenantCandidates[0];
    if (!cand) return;
    scheduleInterview({
      candidateId: cand.id,
      candidateName: cand.name,
      jobTitle: cand.jobTitle,
      round,
      interviewerName: interviewerName.trim() || tenantStaff[0]?.name || 'Hiring Manager',
      scheduledDate,
      scheduledTime,
      mode,
      meetingLink: mode === 'Video Call' ? meetingLink.trim() : undefined,
    });
    setShowScheduleModal(false);
    setInterviewerName('');
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalModalId) return;
    updateInterviewStatus(evalModalId, 'completed', evalFeedback.trim(), Number(evalScore) || 4);
    setEvalModalId(null);
    setEvalFeedback('');
    setEvalScore('4');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={16} className="text-[#4361EE]" />
            <span>Interview Scheduling &amp; Panel Scorecards</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate technical and HR rounds, track panel evaluations, and score candidates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCandidateId(tenantCandidates[0]?.id || '');
            setShowScheduleModal(true);
          }}
          disabled={tenantCandidates.length === 0}
          className="px-3.5 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Schedule Interview</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Candidate &amp; Role</th>
                <th className="py-3 px-4">Round &amp; Panelist</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Scorecard / Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenantInterviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">
                      No interviews scheduled yet for {currentTenant.name}.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Schedule a screening, technical, or executive round to start panel evaluations.
                    </p>
                  </td>
                </tr>
              ) : (
                tenantInterviews.map((iv) => (
                  <tr key={iv.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{iv.candidateName}</p>
                      <p className="text-[11px] text-slate-500">{iv.jobTitle}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{iv.round}</p>
                      <p className="text-[11px] text-slate-500">Interviewer: {iv.interviewerName}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {iv.scheduledDate} · {iv.scheduledTime}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{iv.mode}</span>
                      {iv.meetingLink && (
                        <p className="text-[10px] text-[#4361EE] truncate max-w-[160px]">{iv.meetingLink}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {iv.status === 'completed' ? (
                        <div>
                          <div className="flex items-center gap-1 text-emerald-700 font-bold">
                            <Star size={12} className="fill-amber-400 text-amber-500" />
                            <span>{iv.score || 4}/5 · Completed</span>
                          </div>
                          {iv.feedback && (
                            <p className="text-[11px] text-slate-500 max-w-xs truncate" title={iv.feedback}>
                              {iv.feedback}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            iv.status === 'cancelled' ? 'text-rose-600' : 'text-[#4361EE]'
                          }`}
                        >
                          {iv.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {iv.status === 'scheduled' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEvalModalId(iv.id);
                                setEvalScore('4');
                                setEvalFeedback('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                            >
                              Log Scorecard
                            </button>
                            <button
                              type="button"
                              onClick={() => updateInterviewStatus(iv.id, 'cancelled')}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteInterview(iv.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete interview record"
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

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSchedule}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Candidate Interview</h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate *</label>
              <select
                required
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                {tenantCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.jobTitle} ({c.stage})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Round</label>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value as InterviewSchedule['round'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Screening">Screening</option>
                  <option value="Technical">Technical</option>
                  <option value="System Design">System Design</option>
                  <option value="HR & Culture">HR &amp; Culture</option>
                  <option value="Final Executive">Final Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interviewer</label>
                <input
                  type="text"
                  list="panel-interviewers-list"
                  placeholder={tenantStaff[0]?.name || 'Panel Lead'}
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
                <datalist id="panel-interviewers-list">
                  {tenantStaff.map((u) => (
                    <option key={u.id} value={u.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as InterviewSchedule['mode'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Video Call">Video Call</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
              {mode === 'Video Call' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Link</label>
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Schedule Round
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evaluation Scorecard Modal */}
      {evalModalId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEvaluation}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Complete Interview Scorecard</h3>
              <button
                type="button"
                onClick={() => setEvalModalId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Overall Panel Rating (1 - 5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={evalScore}
                onChange={(e) => setEvalScore(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evaluation Notes &amp; Hire Recommendation *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Summarize technical depth, communication, and next-step recommendation..."
                value={evalFeedback}
                onChange={(e) => setEvalFeedback(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEvalModalId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Save Scorecard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const OffersOnboardingPanel: React.FC = () => {
  const {
    offerLetters,
    candidates,
    currentTenant,
    createOfferLetter,
    updateOfferStatus,
    convertOfferToEmployee,
  } = useApp();

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [candidateId, setCandidateId] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [annualCtc, setAnnualCtc] = useState('1800000');
  const [joiningDate, setJoiningDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Standard full-time employment with EPF, medical insurance, and annual bonus.');

  const tenantOffers = offerLetters.filter((o) => o.tenantId === currentTenant.id);
  const tenantCandidates = candidates.filter((c) => c.tenantId === currentTenant.id);

  const handleIssueOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = tenantCandidates.find((c) => c.id === candidateId) || tenantCandidates[0];
    if (!cand) return;
    const ctc = Number(annualCtc) || 1200000;
    createOfferLetter({
      candidateId: cand.id,
      candidateName: cand.name,
      candidateEmail: cand.email,
      jobTitle: cand.jobTitle,
      department,
      annualCtc: ctc,
      monthlySalary: Math.round(ctc / 12),
      joiningDate,
      notes: notes.trim(),
    });
    setShowOfferModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSignature size={16} className="text-[#4361EE]" />
            <span>Digital Offer Letters &amp; 1-Click Employee Onboarding</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue compensation offers, track candidate acceptances, and convert accepted hires into employees with pre-populated onboarding checklists.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCandidateId(tenantCandidates[0]?.id || '');
            setShowOfferModal(true);
          }}
          disabled={tenantCandidates.length === 0}
          className="px-3.5 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Generate Offer Letter</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Role &amp; Dept</th>
                <th className="py-3 px-4">Annual CTC (₹)</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Offer Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenantOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">
                      No offer letters issued yet for {currentTenant.name}.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Generate an offer letter for a shortlisted candidate to enable 1-click digital onboarding.
                    </p>
                  </td>
                </tr>
              ) : (
                tenantOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{offer.candidateName}</p>
                      <p className="text-[11px] text-slate-500">{offer.candidateEmail}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{offer.jobTitle}</p>
                      <p className="text-[11px] text-slate-500">{offer.department}</p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <p className="font-bold text-slate-900">
                        ₹{offer.annualCtc.toLocaleString('en-IN')} / yr
                      </p>
                      <p className="text-[10px] text-slate-400">
                        ₹{offer.monthlySalary.toLocaleString('en-IN')} / mo
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{offer.joiningDate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-bold uppercase ${
                          offer.status === 'onboarded'
                            ? 'text-emerald-700'
                            : offer.status === 'accepted'
                            ? 'text-[#4361EE]'
                            : offer.status === 'declined'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {(offer.status === 'sent' || offer.status === 'draft') && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateOfferStatus(offer.id, 'accepted')}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer"
                            >
                              Mark Accepted
                            </button>
                            <button
                              type="button"
                              onClick={() => updateOfferStatus(offer.id, 'declined')}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {offer.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => convertOfferToEmployee(offer.id)}
                            className="px-3 py-1 text-[11px] font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck size={12} />
                            <span>Onboard as Employee</span>
                          </button>
                        )}
                        {offer.status === 'onboarded' && (
                          <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Added to Directory</span>
                          </span>
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

      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleIssueOffer}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Generate Digital Offer Letter</h3>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate *</label>
              <select
                required
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                {tenantCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Annual CTC (₹ INR)</label>
                <input
                  type="number"
                  required
                  min={200000}
                  step={50000}
                  value={annualCtc}
                  onChange={(e) => setAnnualCtc(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Joining Date</label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Offer Terms &amp; Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Issue Offer Letter
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const CareerPagePreviewPanel: React.FC = () => {
  const { jobs, currentTenant, addCandidate, showToast } = useApp();
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantExp, setApplicantExp] = useState('3');

  const publishedJobs = jobs.filter(
    (j) => j.tenantId === currentTenant.id && j.status === 'published'
  );
  const activeJob = publishedJobs.find((j) => j.id === applyingJobId);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !applicantName.trim() || !applicantEmail.trim()) return;
    addCandidate({
      name: applicantName.trim(),
      email: applicantEmail.trim(),
      phone: applicantPhone.trim() || '+91 98000 00000',
      jobId: activeJob.id,
      jobTitle: activeJob.title,
      stage: 'Applied',
      rating: 4,
      experienceYears: Number(applicantExp) || 2,
    });
    showToast(`Application received from ${applicantName.trim()} for ${activeJob.title} and added to ATS pipeline.`);
    setApplyingJobId(null);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantPhone('');
  };

  return (
    <div className="space-y-5">
      {/* Branded Career Portal Hero */}
      <div className="bg-[#14213D] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
            <Globe size={13} />
            <span>Hosted Branded Career Portal · careers.{currentTenant.domain}</span>
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Build Your Career at {currentTenant.name}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Live public career board synced directly to your ATS Kanban pipeline. Applications submitted here immediately appear under the Applied stage for {currentTenant.name}.
          </p>
        </div>
        <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xs shrink-0">
          <p className="text-slate-300 text-[10px] uppercase font-bold">Open Published Roles</p>
          <p className="text-2xl font-black font-mono mt-0.5 tabular-nums">{publishedJobs.length}</p>
        </div>
      </div>

      {/* Published Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {publishedJobs.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-500">
            No published roles for {currentTenant.name} yet. Click "Post New Job" above to publish roles to your Career Page.
          </div>
        ) : (
          publishedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4 hover:border-[#4361EE] transition-colors"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4361EE]">
                  {job.department} · {job.type}
                </p>
                <h3 className="text-base font-bold text-slate-900 mt-1">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} />
                    {job.location}
                  </span>
                  <span className="font-semibold text-slate-700">{job.salaryRange}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Posted {job.postedDate}</span>
                <button
                  type="button"
                  onClick={() => setApplyingJobId(job.id)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live Candidate Application Modal */}
      {activeJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleApplySubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply: {activeJob.title}</h3>
                <p className="text-[11px] text-slate-500">
                  {currentTenant.name} · {activeJob.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingJobId(null)}
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
                placeholder="e.g. Sneha Deshmukh"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="sneha@domain.com"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relevant Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={35}
                value={applicantExp}
                onChange={(e) => setApplicantExp(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApplyingJobId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
