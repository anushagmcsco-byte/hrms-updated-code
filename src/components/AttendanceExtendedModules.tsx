import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Plus,
  Trash2,
  Users,
  Calendar,
  Coffee,
  Timer,
  X
} from 'lucide-react';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ShiftRosterPanel: React.FC = () => {
  const {
    shifts,
    users,
    currentTenant,
    addShiftTemplate,
    assignEmployeeToShift,
    deleteShiftTemplate
  } = useApp();

  const tenantShifts = shifts.filter(s => s.tenantId === currentTenant.id);
  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('General Day Shift');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('18:30');
  const [graceMinutes, setGraceMinutes] = useState('15');
  const [breakMinutes, setBreakMinutes] = useState('45');
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const toggleDay = (day: string) => {
    setWorkingDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addShiftTemplate({
      name: name.trim(),
      startTime,
      endTime,
      graceMinutes: Number(graceMinutes) || 15,
      breakMinutes: Number(breakMinutes) || 45,
      workingDays: workingDays.length > 0 ? workingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      assignedEmployeeIds: []
    });
    setShowAddModal(false);
    setName('');
  };

  const handleSeedStandardShifts = () => {
    addShiftTemplate({
      name: 'General Shift',
      startTime: '09:30',
      endTime: '18:30',
      graceMinutes: 15,
      breakMinutes: 45,
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      assignedEmployeeIds: tenantUsers.map(u => u.id)
    });
    addShiftTemplate({
      name: 'Morning APAC Shift',
      startTime: '07:00',
      endTime: '16:00',
      graceMinutes: 10,
      breakMinutes: 45,
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      assignedEmployeeIds: []
    });
    addShiftTemplate({
      name: 'Night US Support Shift',
      startTime: '21:00',
      endTime: '06:00',
      graceMinutes: 15,
      breakMinutes: 60,
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      assignedEmployeeIds: []
    });
  };

  return (
    <div className="space-y-5">
      {/* Shift Templates Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-[#4361EE]" />
              <span>Shift Management &amp; Schedules</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define shifts, grace windows, break allowances, and weekly working days for {currentTenant.name}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tenantShifts.length === 0 && (
              <button
                type="button"
                onClick={handleSeedStandardShifts}
                className="px-3 py-2 text-xs font-semibold text-[#4361EE] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Load Standard Shifts
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} />
              <span>Create Shift</span>
            </button>
          </div>
        </div>

        {tenantShifts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No custom shifts configured yet for {currentTenant.name}. Click &ldquo;Load Standard Shifts&rdquo; or &ldquo;Create Shift&rdquo; to start rostering.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenantShifts.map(shift => (
              <div key={shift.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{shift.name}</h3>
                    <p className="text-sm font-mono font-bold text-[#4361EE] mt-0.5 tabular-nums">
                      {shift.startTime} – {shift.endTime}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteShiftTemplate(shift.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Delete shift"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>Grace: <strong>{shift.graceMinutes}m</strong> · Break: <strong>{shift.breakMinutes}m</strong></p>
                  <p>Days: <span className="font-medium text-slate-800">{shift.workingDays.join(', ')}</span></p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 tabular-nums">
                    <Users size={12} className="text-[#4361EE]" />
                    {(shift.assignedEmployeeIds || []).length} Assigned
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Employee Shift Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={15} className="text-[#4361EE]" />
              <span>Employee Weekly Shift Roster</span>
            </h3>
            <p className="text-xs text-slate-500">Assign any staff member to a shift template (syncs across devices)</p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">{tenantUsers.length} Employees</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Shift</th>
                <th className="py-3 px-4">Schedule Window</th>
                <th className="py-3 px-4">Working Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenantUsers.map(emp => {
                const assigned = tenantShifts.find(s => (s.assignedEmployeeIds || []).includes(emp.id));
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4 text-slate-500">{emp.department}</td>
                    <td className="py-3 px-4">
                      {tenantShifts.length === 0 ? (
                        <span className="text-slate-400">Standard (09:30–18:30)</span>
                      ) : (
                        <select
                          value={assigned?.id || ''}
                          onChange={(e) => assignEmployeeToShift(e.target.value, emp.id)}
                          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-semibold cursor-pointer"
                        >
                          <option value="">Unassigned (Default)</option>
                          {tenantShifts.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 tabular-nums">
                      {assigned ? `${assigned.startTime} – ${assigned.endTime}` : '09:30 – 18:30'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {assigned ? assigned.workingDays.join(', ') : 'Mon, Tue, Wed, Thu, Fri'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateShift} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Shift Template</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Morning EMEA Shift"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grace Period (mins)</label>
                <input type="number" min={0} max={60} value={graceMinutes} onChange={(e) => setGraceMinutes(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Allowed Break (mins)</label>
                <input type="number" min={0} max={120} value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Working Days</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                      workingDays.includes(day)
                        ? 'bg-[#4361EE] text-white border-[#4361EE]'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg cursor-pointer">
                Save Shift
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const OvertimeBreakPanel: React.FC = () => {
  const { attendance, currentTenant, logOvertimeForRecord } = useApp();
  const tenantAttendance = attendance.filter(a => a.tenantId === currentTenant.id);
  const [otInputs, setOtInputs] = useState<Record<string, string>>({});

  const totalBreakMins = tenantAttendance.reduce((sum, a) => sum + (a.breakMinutes || 0), 0);
  const totalOtHours = tenantAttendance.reduce(
    (sum, a) => sum + Math.max(Number(a.overtimeHours) || 0, Math.max(0, (Number(a.workHours) || 0) - 8)),
    0
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Logged Overtime Hours</p>
          <p className="text-2xl font-bold text-[#4361EE] mt-1 tabular-nums">{totalOtHours.toFixed(1)} hrs</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Auto-synced at 1.5× hourly rate into Payroll</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Break Time Tracked</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{totalBreakMins} mins</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Standard policy cap: 45–60 mins / shift</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Tracked Shift Sessions</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{tenantAttendance.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active compliance monitoring</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Timer size={15} className="text-[#4361EE]" />
              <span>Overtime &amp; Break Compliance Ledger</span>
            </h3>
            <p className="text-xs text-slate-500">Approve or log overtime hours directly onto attendance records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Work Hours</th>
                <th className="py-3 px-4">Break Duration</th>
                <th className="py-3 px-4">Overtime (hrs)</th>
                <th className="py-3 px-4 text-right">Log / Adjust OT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenantAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No attendance sessions recorded yet for {currentTenant.name}. Punch in on the Live Attendance tab first.
                  </td>
                </tr>
              ) : (
                tenantAttendance.map(rec => {
                  const computedOt = Math.max(Number(rec.overtimeHours) || 0, Math.max(0, (Number(rec.workHours) || 0) - 8));
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{rec.employeeName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{rec.date}</td>
                      <td className="py-3 px-4 font-semibold tabular-nums">{rec.workHours}h</td>
                      <td className="py-3 px-4 tabular-nums">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Coffee size={12} className="text-amber-600" />
                          {rec.breakMinutes || 0}m {rec.onBreakSince ? '(On Break)' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#4361EE] tabular-nums">+{computedOt.toFixed(1)}h</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={12}
                            step={0.5}
                            placeholder={String(computedOt)}
                            value={otInputs[rec.id] ?? ''}
                            onChange={(e) => setOtInputs(prev => ({ ...prev, [rec.id]: e.target.value }))}
                            className="w-16 text-xs px-2 py-1 rounded border border-slate-200 text-right tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = Number(otInputs[rec.id]);
                              if (Number.isFinite(val)) {
                                logOvertimeForRecord(rec.id, val);
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded cursor-pointer"
                          >
                            Save OT
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
    </div>
  );
};
