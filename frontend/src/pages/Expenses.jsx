import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Wallet,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Calendar,
  CreditCard,
  TrendingDown,
  LayoutGrid,
  List,
  AlertCircle,
  X,
  Tag,
} from "lucide-react";

export const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ totalExpense: 0, totalCount: 0, categoryStats: {}, monthlyStats: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState("table");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [selectedCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (selectedCategory) params.categoryId = selectedCategory;

      const res = await api.get("/expenses", { params });
      const data = res.data?.data;
      setExpenses(data?.expenses || []);
      setCategories(data?.categories || []);
    } catch (err) {
      console.error("Fetch expenses error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/expenses/stats");
      setStats(res.data?.data || { totalExpense: 0, totalCount: 0 });
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !amount || Number(amount) <= 0) {
      setError("Please enter a valid expense title and amount.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/expenses", {
        title,
        amount: Number(amount),
        expenseDate,
        paymentMode,
        categoryId: categoryId || undefined,
        categoryName: !categoryId && newCategoryName ? newCategoryName : undefined,
        paidTo,
        remarks,
      });

      setIsModalOpen(false);
      setTitle("");
      setAmount("");
      setRemarks("");
      setPaidTo("");
      setCategoryId("");
      setNewCategoryName("");

      fetchExpenses();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
      fetchStats();
    } catch (err) {
      alert("Failed to delete expense.");
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.remarks || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.paidTo || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Expense Management</h1>
          <p className="text-xs text-slate-400">Track institute operational expenses, vendor payments, and monthly outflows.</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === "table" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === "grid" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid View</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Expense</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Total Expenses Recorded</span>
          <span className="text-xl font-extrabold text-rose-400">₹{Number(stats.totalExpense || 0).toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Total Expense Transactions</span>
          <span className="text-xl font-extrabold text-white">{stats.totalCount || 0} Records</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Top Category</span>
          <span className="text-sm font-bold text-slate-200 truncate block mt-1">
            {Object.keys(stats.categoryStats || {})[0] || "General Outflow"}
          </span>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense title, paid to, or remarks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT VIEW */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No expense records found.</div>
        ) : viewMode === "table" ? (
          /* TABLE LIST VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Expense Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Paid To / Remarks</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(exp.expenseDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {exp.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-semibold text-[10px]">
                        {exp.category?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold uppercase text-[10px]">
                        {exp.paymentMode || "CASH"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">
                      {exp.paidTo ? `Paid to ${exp.paidTo} - ` : ""}{exp.remarks || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-400 text-sm">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-white rounded-lg transition"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExpenses.map((exp) => (
              <div key={exp.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-semibold text-[10px]">
                    {exp.category?.name || "General"}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold uppercase text-[10px]">
                    {exp.paymentMode || "CASH"}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Date: {new Date(exp.expenseDate).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {exp.remarks && (
                  <p className="text-xs text-slate-400 truncate italic">"{exp.remarks}"</p>
                )}

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  <div className="text-base font-extrabold text-rose-400">
                    ₹{Number(exp.amount).toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-white rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Record New Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Office Rent, Electricity Bill, Lab Assets"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI / GPAY</option>
                    <option value="CARD">CARD</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Expense Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500"
                >
                  <option value="">Select Existing Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {!categoryId && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Or Create New Category</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Marketing & Ads"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Paid To (Person / Vendor)</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="Vendor / Payee Name"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Remarks / Voucher Note</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Voucher or invoice note..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-md disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
