import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { formatDate } from "../utils/formatters";
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

  // Pagination State (10 expenses per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

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

    const cleanTitle = (title || "").trim();
    const parsedAmount = Number(amount);

    if (!cleanTitle || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid expense title and amount.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: cleanTitle,
        amount: parsedAmount,
        expenseDate: expenseDate || new Date().toISOString().split("T")[0],
        paymentMode: paymentMode || "CASH",
      };

      if (categoryId) {
        payload.categoryId = categoryId;
      } else if (newCategoryName.trim()) {
        payload.categoryName = newCategoryName.trim();
      }

      if (paidTo.trim()) payload.paidTo = paidTo.trim();
      if (remarks.trim()) payload.remarks = remarks.trim();

      await api.post("/expenses", payload);

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

  // Pagination calculation
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Expense Management ERP</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track institute operational expenses, vendor payments, and monthly outflows.</p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-2">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === "table" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4 shrink-0" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === "grid" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Grid View</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Add New Expense</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm">
          <span className="text-[11px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-1 whitespace-nowrap">Total Expenses Recorded</span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">₹{Number(stats.totalExpense || 0).toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm">
          <span className="text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1 whitespace-nowrap">Total Expense Transactions</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white whitespace-nowrap">{stats.totalCount || 0} Records</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm col-span-1 min-[420px]:col-span-2 sm:col-span-1">
          <span className="text-[11px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-1 whitespace-nowrap">Top Category</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate block mt-1">
            {Object.keys(stats.categoryStats || {})[0] || "General Outflow"}
          </span>
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
            placeholder="Search by expense title, paid to, or remarks..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-rose-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-transparent border-none text-xs font-bold text-slate-900 dark:text-slate-200 outline-none cursor-pointer truncate"
          >
            <option value="" className="bg-white dark:bg-slate-950">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-950">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT VIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No expense records found.</div>
        ) : viewMode === "table" ? (
          /* TABLE LIST VIEW */
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Expense Title</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Mode</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Paid To / Remarks</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Amount</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {formatDate(exp.expenseDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {exp.title}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded font-semibold text-[10px]">
                        {exp.category?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded font-bold uppercase text-[10px]">
                        {exp.paymentMode || "CASH"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs whitespace-nowrap">
                      {exp.paidTo ? `Paid to ${exp.paidTo} - ` : ""}{exp.remarks || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg border border-rose-200 dark:border-rose-900/50 transition shadow-sm"
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
          <div className="grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-3 gap-4 items-stretch">
            {paginatedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="card h-full flex flex-col bg-white dark:bg-slate-950/80 border border-[#E2E8F0] dark:border-slate-800 rounded-[12px] p-[14px] shadow-[0_2px_6px_rgba(15,23,42,0.04)] hover:-translate-y-[2px] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] transition-all duration-200 ease-in-out"
              >
                <div className="card-header flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded font-semibold text-[10px]">
                    {exp.category?.name || "General"}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded font-bold uppercase text-[10px]">
                    {exp.paymentMode || "CASH"}
                  </span>
                </div>

                <div className="expense-content flex-1 space-y-2 pt-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{exp.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Date: {formatDate(exp.expenseDate)}
                    </p>
                  </div>

                  {exp.remarks && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic break-words">"{exp.remarks}"</p>
                  )}
                </div>

                <div className="expense-footer mt-auto pt-[10px] mt-[12px] border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[18px] font-[800] text-[#E11D48]">
                    ₹{Number(exp.amount).toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1.5 w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg border border-rose-200 dark:border-rose-900/50 transition shadow-sm"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION CONTROLS BAR (10 EXPENSES PER PAGE) */}
        {filteredExpenses.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex flex-wrap items-center gap-2">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-1 font-bold focus:outline-none focus:border-rose-500 cursor-pointer shadow-sm"
              >
                <option value={10}>10 expenses per page</option>
                <option value={20}>20 expenses per page</option>
                <option value={50}>50 expenses per page</option>
                <option value={100}>100 expenses per page</option>
              </select>
              <span>
                Showing <strong className="text-slate-900 dark:text-white">{indexOfFirstItem + 1}</strong> to{" "}
                <strong className="text-slate-900 dark:text-white">{Math.min(indexOfLastItem, filteredExpenses.length)}</strong> of{" "}
                <strong className="text-rose-600 dark:text-rose-400">{filteredExpenses.length}</strong> expenses
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-rose-500 font-bold transition disabled:opacity-40 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 disabled:hover:text-slate-500 cursor-pointer shadow-sm"
              >
                ◀ Prev
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-600 font-bold">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                            p === validCurrentPage
                              ? "bg-rose-600 text-white shadow"
                              : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-rose-500 font-bold transition disabled:opacity-40 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 disabled:hover:text-slate-500 cursor-pointer shadow-sm"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-[480px] max-h-[calc(100vh-24px)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white my-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record New Expense</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Office Rent, Electricity Bill, Lab Assets"
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 placeholder-slate-400 font-medium"
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
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 placeholder-slate-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 font-medium cursor-pointer"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 font-medium cursor-pointer"
                >
                  <option value="">Select Existing Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-950">{c.name}</option>
                  ))}
                </select>
              </div>

              {!categoryId && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Or Create New Category</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Marketing & Ads"
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 placeholder-slate-400 font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 font-medium cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Paid To (Person / Vendor)</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="Vendor / Payee Name"
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Voucher Note</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Voucher or invoice note..."
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-rose-500 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
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
