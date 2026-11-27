import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Receipt, 
  Laptop, 
  LifeBuoy, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  FileText,
  DollarSign,
  X,
  Trash2
} from 'lucide-react';
import { CompanyAsset, ExpenseClaim, HelpdeskTicket } from '../types';

export const OperationsView: React.FC = () => {
  const { 
    currentView, 
    expenses, 
    addExpense, 
    approveExpense, 
    assets, 
    addAsset,
    deleteAsset,
    tickets, 
    addTicket, 
    updateTicketStatus,
    users,
    currentUser, 
    currentTenant,
    showToast 
  } = useApp();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Strict tenant data isolation
  const tenantExpenses = expenses.filter(e => e.tenantId === currentTenant.id);
  const tenantAssets = assets.filter(a => a.tenantId === currentTenant.id);
  const tenantTickets = tickets.filter(t => t.tenantId === currentTenant.id);
  const tenantUsers = users.filter(u => u.tenantId === currentTenant.id && !u.isAppOwner);

  // Expense form state
  const [expCategory, setExpCategory] = useState<ExpenseClaim['category']>('Travel');
  const [expAmount, setExpAmount] = useState('3500');
  const [expMerchant, setExpMerchant] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Ticket form state
  const [tktCategory, setTktCategory] = useState<HelpdeskTicket['category']>('Payroll Query');
  const [tktSubject, setTktSubject] = useState('');
  const [tktPriority, setTktPriority] = useState<HelpdeskTicket['priority']>('medium');

  // Asset form state
  const [assetName, setAssetName] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetType, setAssetType] = useState<CompanyAsset['type']>('Laptop');
  const [assetAssigneeId, setAssetAssigneeId] = useState('');

  const isFinanceOrHR = currentUser.role === 'payroll_admin' || currentUser.role === 'hr_admin' || currentUser.role === 'company_owner' || currentUser.role === 'super_admin' || currentUser.role === 'tenant_super_admin';

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expMerchant || !expAmount) return;
    addExpense(expCategory, parseFloat(expAmount) || 0, expMerchant, expDesc);
    setShowExpenseModal(false);
    setExpMerchant('');
    setExpDesc('');
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject) return;
    addTicket(tktCategory, tktSubject, tktPriority);
    setShowTicketModal(false);
    setTktSubject('');
  };

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetSerial.trim()) return;
    const assignedUser = tenantUsers.find(u => u.id === assetAssigneeId);
    addAsset({
      name: assetName.trim(),
      serialNumber: assetSerial.trim().toUpperCase(),
      type: assetType,
      status: assignedUser ? 'allocated' : 'available',
      ...(assignedUser ? { assignedTo: assignedUser.id, assignedToName: assignedUser.name } : {})
    });
    setShowAssetModal(false);
    setAssetName('');
    setAssetSerial('');
    setAssetAssigneeId('');
  };

  return (
    <div className="space-y-6">
      {/* Dynamic View rendering depending on sidebar selection: expenses, assets, or helpdesk */}
      {currentView === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Receipt className="text-[#4361EE]" size={22} />
                <span>Expenses & Corporate Reimbursements</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Fast receipt scanning, policy-compliant expense claims, and direct payroll reimbursement.
              </p>
            </div>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} />
              <span>Claim Expense</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-semibold uppercase">Pending Claims</span>
              <p className="text-xl font-bold text-amber-600 mt-1">
                ₹{tenantExpenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting manager sign-off</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-semibold uppercase">Reimbursed This Quarter</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                ₹{tenantExpenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Processed through payroll ACH</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-semibold uppercase">Average Turnaround</span>
              <p className="text-xl font-bold text-slate-800 mt-1">1.8 Days</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Fastest in enterprise benchmark</p>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Merchant & Description</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount (₹)</th>
                    <th className="py-3 px-4">Status</th>
                    {isFinanceOrHR && <th className="py-3 px-4 text-right">Approval</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tenantExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={isFinanceOrHR ? 7 : 6} className="py-10 text-center text-slate-400">
                        <p className="font-semibold text-slate-600">No expense claims submitted for {currentTenant.name}.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Click "Claim Expense" above to dynamically record business receipts.</p>
                      </td>
                    </tr>
                  ) : (
                    tenantExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{exp.employeeName}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{exp.merchant}</p>
                          <p className="text-[11px] text-slate-500">{exp.description}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{exp.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            exp.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {exp.status.toUpperCase()}
                          </span>
                        </td>
                        {isFinanceOrHR && (
                          <td className="py-3 px-4 text-right">
                            {exp.status === 'pending' ? (
                              <button
                                onClick={() => approveExpense(exp.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                              >
                                Approve
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Approved</span>
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
        </div>
      )}

      {currentView === 'assets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Laptop className="text-[#4361EE]" size={22} />
                <span>Enterprise IT Hardware & Asset Inventory</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Laptop allocation, serial number tracking, security encryption, and device offboarding.
              </p>
            </div>

            <button
              onClick={() => setShowAssetModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Register Hardware</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tenantAssets.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 p-6">
                <Laptop size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No hardware assets registered for {currentTenant.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Register Hardware" above to dynamically catalog laptops or monitors.</p>
              </div>
            ) : (
              tenantAssets.map(ast => (
                <div key={ast.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {ast.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ast.status === 'allocated' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {ast.status.toUpperCase()}
                      </span>
                      {isFinanceOrHR && (
                        <button
                          type="button"
                          onClick={() => deleteAsset(ast.id)}
                          title="Delete hardware asset"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{ast.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">SN: {ast.serialNumber}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Custodian</p>
                    <p className="font-semibold text-slate-800">{ast.assignedToName || 'In IT Stockroom'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === 'helpdesk' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <LifeBuoy className="text-[#4361EE]" size={22} />
                <span>Internal HR & IT Helpdesk</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Confidential employee support tickets, payroll queries, and policy escalations.
              </p>
            </div>

            <button
              onClick={() => setShowTicketModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} />
              <span>Raise Ticket</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Raised By</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Logged Date</th>
                    {isFinanceOrHR && <th className="py-3 px-4 text-right">Resolution</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tenantTickets.length === 0 ? (
                    <tr>
                      <td colSpan={isFinanceOrHR ? 7 : 6} className="py-10 text-center text-slate-400">
                        <p className="font-semibold text-slate-600">No support tickets currently open for {currentTenant.name}.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Click "Raise Ticket" above to submit a query to HR or IT.</p>
                      </td>
                    </tr>
                  ) : (
                    tenantTickets.map(tkt => (
                      <tr key={tkt.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">{tkt.employeeName}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{tkt.subject}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold text-[#4361EE]">
                            {tkt.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-bold uppercase ${
                            tkt.priority === 'high' ? 'text-rose-600' : tkt.priority === 'medium' ? 'text-amber-600' : 'text-slate-600'
                          }`}>
                            {tkt.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-bold uppercase ${
                            tkt.status === 'resolved'
                              ? 'text-emerald-700'
                              : tkt.status === 'in_progress'
                              ? 'text-[#4361EE]'
                              : 'text-amber-600'
                          }`}>
                            {tkt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{tkt.createdAt}</td>
                        {isFinanceOrHR && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {tkt.status === 'open' && (
                                <button
                                  type="button"
                                  onClick={() => updateTicketStatus(tkt.id, 'in_progress')}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-[#4361EE] bg-blue-50 hover:bg-blue-100 rounded cursor-pointer"
                                >
                                  Start Work
                                </button>
                              )}
                              {tkt.status !== 'resolved' ? (
                                <button
                                  type="button"
                                  onClick={() => updateTicketStatus(tkt.id, 'resolved')}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                                >
                                  Resolve
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400">Closed</span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Claim Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleExpenseSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Claim Expense Reimbursement</h3>
              <button 
                type="button" 
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as ExpenseClaim['category'])}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                <option value="Travel">Travel & Lodging</option>
                <option value="Client Meal">Client Meal & Hospitality</option>
                <option value="Software & Tools">Software Licenses & Tools</option>
                <option value="Office Supplies">Home Office & Ergonomics</option>
                <option value="Certification">Training & Certifications</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Merchant / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uber / Delta / GitHub"
                  value={expMerchant}
                  onChange={(e) => setExpMerchant(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Justification</label>
              <textarea
                required
                rows={2}
                placeholder="Explain the business purpose..."
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Submit Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleTicketSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create HR Support Ticket</h3>
              <button 
                type="button" 
                onClick={() => setShowTicketModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={tktCategory}
                onChange={(e) => setTktCategory(e.target.value as HelpdeskTicket['category'])}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                <option value="Payroll Query">Payroll & Tax Query</option>
                <option value="IT Support">IT Hardware & Access Support</option>
                <option value="Policy Clarification">Policy Clarification</option>
                <option value="Health Insurance">Health Insurance Enrollment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={tktPriority}
                onChange={(e) => setTktPriority(e.target.value as HelpdeskTicket['priority'])}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                <option value="low">Low - Routine Question</option>
                <option value="medium">Medium - Needs resolution within 2 days</option>
                <option value="high">High - Critical blocker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Subject & Detail</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your inquiry clearly..."
                value={tktSubject}
                onChange={(e) => setTktSubject(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register Hardware Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssetSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register Hardware Asset</h3>
              <button
                type="button"
                onClick={() => setShowAssetModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Device / Asset Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. MacBook Pro 14 M3"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Type</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as CompanyAsset['type'])}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Access Card">Access Card</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C02ZK491MD6R"
                  value={assetSerial}
                  onChange={(e) => setAssetSerial(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Custodian (Optional)</label>
              <select
                value={assetAssigneeId}
                onChange={(e) => setAssetAssigneeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              >
                <option value="">Keep Available in IT Stockroom</option>
                {tenantUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssetModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4361EE] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                Save Hardware
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
