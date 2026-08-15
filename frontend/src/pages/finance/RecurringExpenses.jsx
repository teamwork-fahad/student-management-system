import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/formatters";
import {
  Repeat,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building2,
  X,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  Check,
} from "lucide-react";

export const RecurringExpenses = () => {
  const [recurringList, setRecurringList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [summary, setSummary] = useState({ totalTemplates: 0, pendingAmount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal States
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pay Instance Modal State
  const [payingInstance, setPayingInstance] = useState(null);
  const [payPaymentMode, setPayPaymentMode] = useState("CASH");
  const [payRefNumber, setPayRefNumber] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Form State for Template
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [reminderDays, setReminderDays] = useState(3);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [partyId, setPartyId] = useState("");

  useEffect(() => {
    fetchRecurring();
    fetchOptions();
  }, [statusFilter]);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/expenses/recurring", { params });
      const data = res.data?.data;
      setRecurringList(data?.recurringExpenses || []);
      setSummary(data?.summary || { totalTemplates: 0, pendingAmount: 0, pendingCount: 0 });
    } catch (err) {
      console.error("Fetch recurring expenses error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [catRes, partyRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/expenses/parties"),
      ]);
      setCategories(catRes.data?.data?.categories || []);
      setParties(partyRes.data?.data?.parties || []);
    } catch (err) {
      console.error("Fetch options error:", err);
    }
  };

  const handleOpenRuleModal = (rule = null) => {
    setError("");
    if (rule) {
      setEditingRule(rule);
      setTitle(rule.title || "");
      setAmount(rule.amount || "");
      setPaymentMode(rule.paymentMode || "CASH");
      setFrequency(rule.frequency || "MONTHLY");
      setStartDate(rule.startDate ? rule.startDate.split("T")[0] : "");
      setEndDate(rule.endDate ? rule.endDate.split("T")[0] : "");
      setReminderDays(rule.reminderDays || 3);
      setDescription(rule.description || "");
      setCategoryId(rule.categoryId || "");
      setPartyId(rule.partyId || "");
    } else {
      setEditingRule(null);
      setTitle("");
      setAmount("");
      setPaymentMode("CASH");
      setFrequency("MONTHLY");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setReminderDays(3);
      setDescription("");
      setCategoryId("");
      setPartyId("");
    }
    setIsRuleModalOpen(true);
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !amount || Number(amount) <= 0) {
      setError("Please enter a valid expense title and amount.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        amount: Number(amount),
        paymentMode,
        frequency,
        startDate,
        endDate: endDate ? endDate : null,
        reminderDays: Number(reminderDays),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        partyId: partyId || undefined,
      };

      if (editingRule) {
        await api.put(`/expenses/recurring/${editingRule.id}`, payload);
      } else {
        await api.post("/expenses/recurring", payload);
      }

      setIsRuleModalOpen(false);
      fetchRecurring();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save recurring expense rule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await api.put(`/expenses/recurring/${id}`, { status: nextStatus });
      fetchRecurring();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDeleteRule = async (id, ruleTitle) => {
    if (!window.confirm(`Are you sure you want to delete recurring rule '${ruleTitle}'?`)) return;
    try {
      await api.delete(`/expenses/recurring/${id}`);
      fetchRecurring();
    } catch (err) {
      alert("Failed to delete recurring rule.");
    }
  };

  // Open Record Payment Modal for a recurring instance
  const handleOpenPayModal = (instance, rule) => {
    setPayingInstance({ instance, rule });
    setPayPaymentMode(rule.paymentMode || "CASH");
    setPayRefNumber("");
    setPayRemarks(`Payment for ${rule.title} due ${formatDate(instance.dueDate)}`);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payingInstance) return;

    setPaySubmitting(true);
    try {
      await api.post(`/expenses/recurring/instances/${payingInstance.instance.id}/pay`, {
        paymentMode: payPaymentMode,
        referenceNumber: payRefNumber.trim() || undefined,
        remarks: payRemarks.trim() || undefined,
      });

      setPayingInstance(null);
      fetchRecurring();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setPaySubmitting(false);
    }
  };

  const filteredRecurring = recurringList.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Repeat className="w-7 h-7 text-purple-600 dark:text-purple-400" /> Recurring Expense Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set up automatic repeating rules for Rent, Internet, Electricity & Subscriptions. Record instance payments to generate actual expense vouchers.
          </p>
        </div>

        <button
          onClick={() => handleOpenRuleModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-500/20 flex items-center space-x-2 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>New Recurring Rule</span>
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] uppercase font-bold text-purple-600 dark:text-purple-400 block mb-1">Active Rules</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{summary.totalTemplates || recurringList.length} Rules</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm">
          <span className="text-[11px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-1">Recurring Pending Dues</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">₹{Number(summary.pendingAmount || 0).toLocaleString("en-IN")}</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">Unpaid Due Instances</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{summary.pendingCount || 0} Instances</span>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense rule title or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-transparent border-none text-xs font-bold text-slate-900 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-950">All Statuses</option>
            <option value="ACTIVE" className="bg-white dark:bg-slate-950">Active Rules</option>
            <option value="PAUSED" className="bg-white dark:bg-slate-950">Paused Rules</option>
            <option value="COMPLETED" className="bg-white dark:bg-slate-950">Completed Rules</option>
          </select>
        </div>
      </div>

      {/* RECURRING RULES & INSTANCES LIST */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl p-6">Loading recurring rules...</div>
        ) : filteredRecurring.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl p-6">No recurring expense rules found.</div>
        ) : (
          filteredRecurring.map((rule) => (
            <div key={rule.id} className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              {/* Rule Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-2xl shrink-0">
                    <Repeat className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{rule.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        rule.status === "ACTIVE"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      }`}>
                        {rule.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Frequency: <strong className="text-slate-900 dark:text-white">{rule.frequency}</strong></span>
                      <span>•</span>
                      <span>Next Due: <strong className="text-purple-600 dark:text-purple-400 font-mono">{formatDate(rule.nextDueDate)}</strong></span>
                      {rule.party && (
                        <>
                          <span>•</span>
                          <span>Party: <strong className="text-blue-600 dark:text-blue-400">{rule.party.name}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono mr-2">
                    ₹{Number(rule.amount).toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(rule.id, rule.status)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition"
                    title={rule.status === "ACTIVE" ? "Pause Rule" : "Activate Rule"}
                  >
                    {rule.status === "ACTIVE" ? <PauseCircle className="w-4 h-4 text-amber-500" /> : <PlayCircle className="w-4 h-4 text-emerald-500" />}
                  </button>
                  <button
                    onClick={() => handleOpenRuleModal(rule)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition"
                    title="Edit Rule"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id, rule.title)}
                    className="p-2 bg-rose-50 dark:bg-rose-950 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Instances breakdown table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Generated Commitment Instances
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Payment Date</th>
                        <th className="py-2.5 px-3">Generated Expense Ref</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {(rule.instances || []).map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">{formatDate(inst.dueDate)}</td>
                          <td className="py-2.5 px-3 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                            ₹{Number(inst.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              inst.status === "PAID"
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : inst.status === "OVERDUE"
                                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                : inst.status === "DUE"
                                ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}>
                              {inst.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                            {inst.paidDate ? formatDate(inst.paidDate) : "—"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                            {inst.expense?.expenseNumber || (inst.expense ? `EXP-${inst.expense.id.slice(-6)}` : "—")}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {inst.status !== "PAID" ? (
                              <button
                                onClick={() => handleOpenPayModal(inst, rule)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] shadow-sm transition"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Cleared
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT RECURRING RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-[520px] max-h-[calc(100vh-24px)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white my-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold">{editingRule ? "Edit Recurring Rule" : "Create Recurring Rule"}</h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRuleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Office Rent, Broadband Internet, AWS Subscription"
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-bold cursor-pointer"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="HALF_YEARLY">Half-Yearly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start / First Due Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-medium cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-medium cursor-pointer"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI / GPAY</option>
                    <option value="CARD">CARD</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign Party (Vendor)</label>
                  <select
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-medium cursor-pointer"
                  >
                    <option value="">Select Party / Payee...</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-slate-950">{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-medium cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-950">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional notes for recurring bill..."
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingRule ? "Update Rule" : "Create Recurring Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD INSTANCE PAYMENT MODAL */}
      {payingInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-[460px] max-h-[calc(100vh-24px)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white my-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Recurring Payment</h3>
              <button
                type="button"
                onClick={() => setPayingInstance(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-300">
                <span>{payingInstance.rule.title}</span>
                <span className="font-mono">₹{Number(payingInstance.instance.amount).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Due Date: <span className="font-mono font-bold">{formatDate(payingInstance.instance.dueDate)}</span>
              </p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                <select
                  value={payPaymentMode}
                  onChange={(e) => setPayPaymentMode(e.target.value)}
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-emerald-500 font-bold cursor-pointer"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / GPAY</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reference / Invoice Number</label>
                <input
                  type="text"
                  value={payRefNumber}
                  onChange={(e) => setPayRefNumber(e.target.value)}
                  placeholder="e.g. UTR / Receipt / Invoice #"
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Voucher Remarks</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingInstance(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {paySubmitting ? "Generating Expense..." : "Confirm & Pay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringExpenses;
