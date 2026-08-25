import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/formatters";
import {
  FileText,
  Printer,
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Building2,
  CreditCard,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const ExpenseReports = () => {
  const [activeTab, setActiveTab] = useState("daily"); // daily | monthly | yearly | category | party | payment | pending
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Categories & Parties for filters
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);

  // Filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchOptions = async () => {
    try {
      const [expRes, partyRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/expenses/parties"),
      ]);
      setCategories(expRes.data?.data?.categories || []);
      setParties(partyRes.data?.data?.parties || []);
    } catch (err) {
      console.error("Fetch report filter options error:", err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (categoryId) params.categoryId = categoryId;
      if (partyId) params.partyId = partyId;
      if (paymentMode) params.paymentMode = paymentMode;

      let endpoint = `/expenses/reports/${activeTab}`;
      if (activeTab === "payment") endpoint = "/expenses/reports/payment-method";
      if (activeTab === "pending") endpoint = "/expenses/reports/pending-recurring";

      const res = await api.get(endpoint, { params });
      setReportData(res.data?.data || null);
    } catch (err) {
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategoryId("");
    setPartyId("");
    setPaymentMode("");
    setTimeout(() => {
      fetchReport();
    }, 50);
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (!reportData) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Convert current report into CSV format
    if (activeTab === "daily" || activeTab === "monthly" || activeTab === "yearly") {
      const rows = [["Period", "Total Amount (INR)", "Transaction Count"]];
      (reportData.report || []).forEach((r) => {
        rows.push([r.day || r.month || r.year, r.total, r.count]);
      });
      csvContent += rows.map((e) => e.join(",")).join("\n");
    } else if (activeTab === "category") {
      const rows = [["Category Name", "Total Amount (INR)", "Count", "Percentage"]];
      (reportData.report || []).forEach((r) => {
        rows.push([`"${r.name}"`, r.total, r.count, `${r.percentage}%`]);
      });
      csvContent += rows.map((e) => e.join(",")).join("\n");
    } else if (activeTab === "party") {
      const rows = [["Party / Vendor Name", "Total Amount (INR)", "Count"]];
      (reportData.report || []).forEach((r) => {
        rows.push([`"${r.partyName}"`, r.total, r.count]);
      });
      csvContent += rows.map((e) => e.join(",")).join("\n");
    } else if (activeTab === "payment") {
      const rows = [["Payment Method", "Total Amount (INR)", "Count", "Percentage"]];
      (reportData.report || []).forEach((r) => {
        rows.push([r.method, r.total, r.count, `${r.percentage}%`]);
      });
      csvContent += rows.map((e) => e.join(",")).join("\n");
    } else if (activeTab === "pending") {
      const rows = [["Rule Title", "Due Date", "Status", "Amount (INR)", "Party"]];
      (reportData.instances || []).forEach((i) => {
        rows.push([`"${i.recurringExpense?.title}"`, formatDate(i.dueDate), i.status, i.amount, `"${i.party?.name || ''}"`]);
      });
      csvContent += rows.map((e) => e.join(",")).join("\n");
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expense_Report_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = reportData?.summary || {};

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Expense Reports & Financial Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate and export custom expense summaries across date ranges, categories, vendors, and recurring dues.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* REPORT TYPE TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: "daily", name: "Daily Report" },
          { id: "monthly", name: "Monthly Report" },
          { id: "yearly", name: "Yearly Report" },
          { id: "category", name: "Category-wise" },
          { id: "party", name: "Party-wise" },
          { id: "payment", name: "Payment Method-wise" },
          { id: "pending", name: "Pending Recurring" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md font-bold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Report Multi-Filters</span>
          </span>
          <button
            onClick={handleResetFilters}
            className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Date From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-[38px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium cursor-pointer"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Date To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-[38px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium cursor-pointer"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-[38px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Party (Vendor)</span>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full h-[38px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value="">All Parties</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Payment Method</span>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full h-[38px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value="">All Methods</option>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
        >
          Apply Report Filters
        </button>
      </div>

      {/* SUMMARY KPI BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase block mb-1">Total Report Amount</span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            ₹{Number(summary.totalAmount || summary.grandTotal || summary.totalPendingAmount || 0).toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase block mb-1">Total Records</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {summary.totalCount || summary.totalPendingCount || 0} Transactions
          </h3>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Report Segments</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {summary.totalDays || summary.monthsCount || summary.yearsCount || summary.categoriesCount || summary.partiesCount || summary.methodsCount || 0} Segments
          </h3>
        </div>
      </div>

      {/* REPORT CONTENT VIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Generating report data...</div>
        ) : !reportData ? (
          <div className="text-center py-16 text-xs text-slate-500">No report metrics returned.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            {/* DAILY / MONTHLY / YEARLY TABLE */}
            {(activeTab === "daily" || activeTab === "monthly" || activeTab === "yearly") && (
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Period / Date</th>
                    <th className="py-3.5 px-4 text-center">Transaction Count</th>
                    <th className="py-3.5 px-4 text-right">Total Outflow Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(reportData.report || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.day ? formatDate(row.day) : row.month || row.year}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {row.count} records
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap text-sm">
                        ₹{Number(row.total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* CATEGORY WISE TABLE */}
            {activeTab === "category" && (
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Category Name</th>
                    <th className="py-3.5 px-4 text-center">Transactions</th>
                    <th className="py-3.5 px-4 text-center">Share (%)</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(reportData.report || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.name}</td>
                      <td className="py-3.5 px-4 text-center font-bold whitespace-nowrap">{row.count}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{row.percentage}%</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap text-sm">
                        ₹{Number(row.total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PARTY WISE TABLE */}
            {activeTab === "party" && (
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Party / Vendor Name</th>
                    <th className="py-3.5 px-4 text-center">Transactions</th>
                    <th className="py-3.5 px-4 text-right">Total Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(reportData.report || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.partyName}</td>
                      <td className="py-3.5 px-4 text-center font-bold whitespace-nowrap">{row.count}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap text-sm">
                        ₹{Number(row.total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PAYMENT METHOD TABLE */}
            {activeTab === "payment" && (
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-center">Transactions</th>
                    <th className="py-3.5 px-4 text-center">Distribution (%)</th>
                    <th className="py-3.5 px-4 text-right">Total Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(reportData.report || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white uppercase whitespace-nowrap">{row.method}</td>
                      <td className="py-3.5 px-4 text-center font-bold whitespace-nowrap">{row.count}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{row.percentage}%</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap text-sm">
                        ₹{Number(row.total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PENDING RECURRING EXPENSES TABLE */}
            {activeTab === "pending" && (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Recurring Expense Title</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Party / Vendor</th>
                    <th className="py-3.5 px-4 text-right">Pending Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(reportData.instances || []).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.recurringExpense?.title}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(row.dueDate)}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.status === "OVERDUE"
                            ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                        {row.party?.name || "General Payee"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap text-sm">
                        ₹{Number(row.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseReports;
