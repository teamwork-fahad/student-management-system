import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { formatDate } from "../../utils/formatters";
import {
  Wallet,
  Calendar,
  Clock,
  TrendingDown,
  Repeat,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Building2,
  PieChart,
  Tag,
  CheckCircle2,
  XCircle,
  ChevronRight,
  PlusCircle,
} from "lucide-react";

export const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/expenses/stats");
      setStats(res.data?.data || null);
    } catch (err) {
      console.error("Fetch finance dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const summary = stats?.summary || {
    totalExpense: 0,
    todayExpense: 0,
    thisMonthExpense: 0,
    thisYearExpense: 0,
    recurringCount: 0,
    recurringPendingAmount: 0,
  };

  const categoryStats = stats?.categoryStats || {};
  const partyStats = stats?.partyStats || {};
  const paymentMethodStats = stats?.paymentMethodStats || {};
  const monthlyStats = stats?.monthlyStats || {};
  const recurringStatus = stats?.recurringStatus || { UPCOMING: 0, DUE: 0, OVERDUE: 0, PAID: 0 };
  const recentExpenses = stats?.recentExpenses || [];

  const grandTotal = summary.totalExpense || 1;

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            Finance & Expense Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time institute expense telemetry, outflow analytics, vendor breakdowns, and recurring commitments.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            to="/dashboard/expenses"
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition flex items-center space-x-1.5 border border-slate-200 dark:border-slate-800"
          >
            <span>View All Expenses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard/finance/recurring"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Manage Recurring</span>
          </Link>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Expense */}
        <div
          onClick={() => navigate("/dashboard/expenses")}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expense</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/80 rounded-xl text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
            ₹{Number(summary.totalExpense).toLocaleString("en-IN")}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">All logged transactions</span>
        </div>

        {/* This Month Expense */}
        <div
          onClick={() => navigate("/dashboard/expenses")}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">This Month</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/80 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white whitespace-nowrap">
            ₹{Number(summary.thisMonthExpense).toLocaleString("en-IN")}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Current month total</span>
        </div>

        {/* Today Expense */}
        <div
          onClick={() => navigate("/dashboard/expenses")}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today Expense</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            ₹{Number(summary.todayExpense).toLocaleString("en-IN")}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Outflow today</span>
        </div>

        {/* This Year Expense */}
        <div
          onClick={() => navigate("/dashboard/expenses")}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">This Year</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
            ₹{Number(summary.thisYearExpense).toLocaleString("en-IN")}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">YTD Total Outflow</span>
        </div>

        {/* Recurring Active Rules */}
        <div
          onClick={() => navigate("/dashboard/finance/recurring")}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recurring Rules</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/80 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white whitespace-nowrap">
            {summary.recurringCount} Active Rules
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Subscriptions & Rent</span>
        </div>

        {/* Recurring Pending Amount */}
        <div
          onClick={() => navigate("/dashboard/finance/recurring")}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm hover:border-amber-500 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Recurring Pending</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
            ₹{Number(summary.recurringPendingAmount).toLocaleString("en-IN")}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Due / Overdue commits</span>
        </div>
      </div>

      {/* GRID 2 COLUMNS: CHART & RECURRING STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Expense Trend */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Monthly Expense Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly expense outflows across current billing periods.</p>
            </div>
            <Link to="/dashboard/finance/reports" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>View Full Report</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {Object.keys(monthlyStats).length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">No monthly data available yet.</div>
          ) : (
            <div className="space-y-3 pt-2">
              {Object.entries(monthlyStats).map(([month, total]) => {
                const pct = Math.min(100, Math.round((total / grandTotal) * 100));
                return (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{month}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                        ₹{Number(total).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-rose-600 to-pink-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recurring Payment Status Overview */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Recurring Status
            </h3>
            <Link to="/dashboard/finance/recurring" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
              Manage Rules
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div
              onClick={() => navigate("/dashboard/finance/recurring")}
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 cursor-pointer hover:scale-[1.02] transition"
            >
              <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>Overdue</span>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{recurringStatus.OVERDUE || 0}</p>
              <span className="text-[10px] text-amber-600/80 font-medium">Requires payment</span>
            </div>

            <div
              onClick={() => navigate("/dashboard/finance/recurring")}
              className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 cursor-pointer hover:scale-[1.02] transition"
            >
              <div className="flex items-center space-x-1.5 text-blue-700 dark:text-blue-400 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Due Today</span>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{recurringStatus.DUE || 0}</p>
              <span className="text-[10px] text-blue-600/80 font-medium">Due for clearance</span>
            </div>

            <div
              onClick={() => navigate("/dashboard/finance/recurring")}
              className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-[1.02] transition"
            >
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 text-xs font-bold mb-1">
                <Calendar className="w-4 h-4" />
                <span>Upcoming</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{recurringStatus.UPCOMING || 0}</p>
              <span className="text-[10px] text-slate-500 font-medium">Scheduled ahead</span>
            </div>

            <div
              onClick={() => navigate("/dashboard/finance/recurring")}
              className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 cursor-pointer hover:scale-[1.02] transition"
            >
              <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Paid</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{recurringStatus.PAID || 0}</p>
              <span className="text-[10px] text-emerald-600/80 font-medium">Cleared instances</span>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY & PARTY & PAYMENT METHOD BREAKDOWNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category-wise Breakdown */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Category-wise Expense
          </h3>
          <div className="space-y-3 pt-2">
            {Object.keys(categoryStats).length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No category expenses logged.</div>
            ) : (
              Object.entries(categoryStats).map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{cat}</span>
                  <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400">
                    ₹{Number(total).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Party-wise Breakdown */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Party-wise Expense
            </h3>
            <Link to="/dashboard/finance/parties" className="text-[11px] font-bold text-blue-600 hover:underline">
              Parties
            </Link>
          </div>
          <div className="space-y-3 pt-2">
            {Object.keys(partyStats).length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No party transactions logged.</div>
            ) : (
              Object.entries(partyStats).slice(0, 5).map(([party, total]) => (
                <div key={party} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{party}</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                    ₹{Number(total).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Payment Methods
          </h3>
          <div className="space-y-3 pt-2">
            {Object.keys(paymentMethodStats).length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No payment method logs.</div>
            ) : (
              Object.entries(paymentMethodStats).map(([mode, total]) => (
                <div key={mode} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{mode}</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{Number(total).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RECENT EXPENSES TABLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Expense Transactions</h3>
          <Link to="/dashboard/expenses" className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
            View All Expenses
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No recent expense transactions found.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Party / Payee</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {recentExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {exp.expenseNumber || `EXP-${exp.id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">{formatDate(exp.expenseDate)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{exp.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold">
                        {exp.category?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                      {exp.party?.name || exp.paidTo || "N/A"}
                    </td>
                    <td className="py-3 px-4 font-bold text-[10px] uppercase whitespace-nowrap">{exp.paymentMode}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;
