import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { ReceiptModal } from "../components/receipts/ReceiptModal";
import { Modal } from "../components/common/Modal";
import { SearchableSelect } from "../components/common/SearchableSelect";
import { formatDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Receipt,
  PlusCircle,
  Printer,
  TrendingUp,
  TrendingDown,
  PieChart,
  LayoutGrid,
  List,
  Calendar,
  Layers,
  Eye,
  Edit,
  Save,
  X,
  BarChart3,
  DollarSign,
  ExternalLink,
} from "lucide-react";

export const Fees = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [students, setStudents] = useState([]);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  // Edit Fee Payment Modal State (Super Admin)
  const [editingPayment, setEditingPayment] = useState(null);
  const [editFeeForm, setEditFeeForm] = useState({
    amount: "",
    paymentMode: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionReference: "",
    remarks: "",
  });
  const [editFeeSubmitting, setEditFeeSubmitting] = useState(false);
  const [editFeeError, setEditFeeError] = useState("");

  const handleOpenEditFeeModal = (payment) => {
    setEditingPayment(payment);
    const formattedDate = payment.paymentDate
      ? new Date(payment.paymentDate).toISOString().split("T")[0]
      : new Date(payment.createdAt).toISOString().split("T")[0];

    setEditFeeForm({
      amount: payment.amount ? String(payment.amount) : "0",
      paymentMode: payment.paymentMode || "CASH",
      paymentDate: formattedDate,
      transactionReference: payment.transactionReference || "",
      remarks: payment.remarks || "",
    });
    setEditFeeError("");
  };

  const handleEditFeeSubmit = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;

    setEditFeeSubmitting(true);
    setEditFeeError("");
    try {
      await api.put(`/fees/${editingPayment.id}`, {
        amount: Number(editFeeForm.amount),
        paymentMode: editFeeForm.paymentMode,
        paymentDate: editFeeForm.paymentDate,
        transactionReference: editFeeForm.transactionReference,
        remarks: editFeeForm.remarks,
      });

      setEditingPayment(null);
      fetchInitialData();
    } catch (err) {
      setEditFeeError(err.response?.data?.message || "Failed to update fee payment.");
    } finally {
      setEditFeeSubmitting(false);
    }
  };

  const handleSendWhatsAppFeeReminder = async (studentId) => {
    try {
      const res = await api.get(`/fees/student/${studentId}/whatsapp-reminder`);
      const whatsappUrl = res.data.data?.whatsappUrl;
      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank");
      }
    } catch (err) {
      alert("Failed to generate WhatsApp fee reminder");
    }
  };

  const handleDeletePayment = async (paymentId, refNo, amt) => {
    const confirmMsg = `Are you sure you want to delete payment receipt (${refNo || "Payment"}) for ₹${Number(amt).toLocaleString("en-IN")}?\nThis will recalculate the student's pending fee balance.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/fees/${paymentId}`);
      alert("Payment receipt deleted successfully.");
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete payment receipt.");
    }
  };

  // Analytics Switcher Tab: 'yearly' | 'monthly'
  const [analyticsTab, setAnalyticsTab] = useState("yearly");

  // View Modes: default to 'table' for all sections!
  const [viewMode, setViewMode] = useState("table");
  const [yearlyViewMode, setYearlyViewMode] = useState("table");
  const [monthlyViewMode, setMonthlyViewMode] = useState("table");

  // Selected Month & Year modal state
  const [selectedMonthData, setSelectedMonthData] = useState(null);
  const [selectedYearData, setSelectedYearData] = useState(null);

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionReference, setTransactionReference] = useState("");
  const [remarks, setRemarks] = useState("");

  const selectedStudentObj = students.find(
    (s) => s.id === selectedStudentId || s.studentId === selectedStudentId
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentsRes, historyRes] = await Promise.all([
        api.get("/students?limit=100"),
        api.get("/fees?limit=100"),
      ]);

      setStudents(studentsRes.data?.data?.students || []);
      setFeeHistory(historyRes.data?.data?.payments || []);
    } catch (err) {
      console.error("Fee data fetch error:", err);
      setError("Failed to load fee configuration data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentId || !amount || Number(amount) <= 0) {
      setError("Please select a student and enter a valid payment amount.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/fees/collect", {
        studentId: selectedStudentId,
        amount: Number(amount),
        paymentMode,
        paymentDate: paymentDate || undefined,
        transactionReference,
        remarks,
      });

      const payment = response.data?.data?.payment;
      setSelectedReceiptPayment(payment);

      setAmount("");
      setTransactionReference("");
      setRemarks("");
      setSelectedStudentId("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      fetchInitialData();
    } catch (err) {
      console.error("Fee collection error:", err);
      setError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Overall Revenue Metrics
  const totalExpected = students.reduce(
    (acc, s) => acc + Number(s.admission?.finalFees || s.admission?.courseFees || 0),
    0
  );
  const totalCollected = students.reduce(
    (acc, s) => acc + Number(s.admission?.paidAmount || 0),
    0
  );
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const efficiencyRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0;

  // 1. COMPUTE YEARLY FINANCIAL SUMMARY (YEAR-WISE ANALYSIS)
  const yearlySummary = {};
  feeHistory.forEach((p) => {
    const d = new Date(p.paymentDate || p.createdAt);
    const yearKey = d.getFullYear().toString();

    if (!yearlySummary[yearKey]) {
      yearlySummary[yearKey] = {
        year: yearKey,
        totalAmount: 0,
        receiptCount: 0,
        cashCount: 0,
        onlineCount: 0,
        payments: [],
        monthsMap: {},
      };
    }

    const amt = Number(p.amount) || 0;
    yearlySummary[yearKey].totalAmount += amt;
    yearlySummary[yearKey].receiptCount += 1;
    yearlySummary[yearKey].payments.push(p);

    const monthName = d.toLocaleDateString("en-IN", { month: "long" });
    if (!yearlySummary[yearKey].monthsMap[monthName]) {
      yearlySummary[yearKey].monthsMap[monthName] = {
        monthName,
        totalAmount: 0,
        receiptCount: 0,
        cashCount: 0,
        onlineCount: 0,
        payments: [],
      };
    }
    yearlySummary[yearKey].monthsMap[monthName].totalAmount += amt;
    yearlySummary[yearKey].monthsMap[monthName].receiptCount += 1;
    yearlySummary[yearKey].monthsMap[monthName].payments.push(p);

    if ((p.paymentMode || "").toUpperCase() === "CASH") {
      yearlySummary[yearKey].cashCount += amt;
      yearlySummary[yearKey].monthsMap[monthName].cashCount += amt;
    } else {
      yearlySummary[yearKey].onlineCount += amt;
      yearlySummary[yearKey].monthsMap[monthName].onlineCount += amt;
    }
  });

  const yearlyList = Object.values(yearlySummary).sort((a, b) => Number(b.year) - Number(a.year));

  // Compute Year-over-Year (YoY) Growth for each year
  yearlyList.forEach((y, idx) => {
    const prevYearObj = yearlyList[idx + 1];
    const prevYearTotal = prevYearObj?.totalAmount || 0;
    const diff = y.totalAmount - prevYearTotal;
    const yoy = prevYearTotal > 0
      ? ((diff / prevYearTotal) * 100).toFixed(1)
      : (y.totalAmount > 0 ? 100 : 0);
    y.yoyGrowth = yoy;
    y.revenueDiff = diff;
    y.monthlyAvg = (y.totalAmount / 12).toFixed(0);
  });

  // 2. COMPUTE MONTHLY COLLECTION SUMMARY
  const monthlySummary = {};
  feeHistory.forEach((p) => {
    const d = new Date(p.paymentDate || p.createdAt);
    const monthKey = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!monthlySummary[monthKey]) {
      monthlySummary[monthKey] = {
        monthName: monthKey,
        monthDate: d,
        totalAmount: 0,
        receiptCount: 0,
        cashCount: 0,
        onlineCount: 0,
        payments: [],
      };
    }
    const amt = Number(p.amount) || 0;
    monthlySummary[monthKey].totalAmount += amt;
    monthlySummary[monthKey].receiptCount += 1;
    monthlySummary[monthKey].payments.push(p);

    if ((p.paymentMode || "").toUpperCase() === "CASH") {
      monthlySummary[monthKey].cashCount += amt;
    } else {
      monthlySummary[monthKey].onlineCount += amt;
    }
  });

  const monthlyList = Object.values(monthlySummary);
  const currentMonthObj = monthlyList[0];
  const prevMonthObj = monthlyList[1];

  const currentRevenue = currentMonthObj?.totalAmount || 0;
  const prevRevenue = prevMonthObj?.totalAmount || 0;
  const revenueDiff = currentRevenue - prevRevenue;
  const percentageChange = prevRevenue > 0
    ? ((revenueDiff / prevRevenue) * 100).toFixed(1)
    : (currentRevenue > 0 ? 100 : 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Printable Receipt Modal */}
      {selectedReceiptPayment && (
        <ReceiptModal
          payment={selectedReceiptPayment}
          student={students.find((s) => s.admission?.id === selectedReceiptPayment.admissionId)}
          admission={selectedReceiptPayment.admission}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Fees & Financial Revenue Analytics</h1>
        <p className="text-xs text-slate-400">Collect tuition payments, analyze year-wise & monthly revenue trends, and issue receipts.</p>
      </div>

      {/* REVENUE ANALYTICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Expected Revenue</span>
          <span className="text-xl font-extrabold text-white">₹{totalExpected.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total Collected</span>
            {revenueDiff >= 0 ? (
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-0.5" title="MoM Growth">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                <span>+₹{revenueDiff.toLocaleString("en-IN")} (+{percentageChange}%)</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-0.5" title="MoM Decrease">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                <span>-₹{Math.abs(revenueDiff).toLocaleString("en-IN")} ({percentageChange}%)</span>
              </span>
            )}
          </div>
          <span className="text-xl font-extrabold text-emerald-400">₹{totalCollected.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Pending Balance</span>
          <span className="text-xl font-extrabold text-amber-400">₹{totalPending.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Collection Efficiency</span>
          <span className="text-xl font-extrabold text-cyan-400">{efficiencyRate}%</span>
        </div>
      </div>

      {/* FINANCIAL REVENUE ANALYTICS SECTION (YEARLY VS MONTHLY SWITCHER) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-cyan-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white">Financial Revenue Analysis & Trends</h3>
              <p className="text-xs text-slate-400">Compare year-over-year annual collection performance and monthly breakdowns.</p>
            </div>
          </div>

          {/* Analytics Mode Switcher: Yearly vs Monthly */}
          <div className="flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setAnalyticsTab("yearly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                analyticsTab === "yearly" ? "bg-cyan-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Year-Wise Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTab("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                analyticsTab === "monthly" ? "bg-cyan-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Monthly Summary</span>
            </button>
          </div>
        </div>

        {/* 1. YEAR-WISE FINANCIAL ANALYSIS TAB */}
        {analyticsTab === "yearly" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Annual Financial Performance & YoY Growth
              </span>

              <div className="flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setYearlyViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                    yearlyViewMode === "table" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                  title="Table View (Default)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setYearlyViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                    yearlyViewMode === "grid" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid View</span>
                </button>
              </div>
            </div>

            {yearlyList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No yearly collection data available yet.</p>
            ) : yearlyViewMode === "table" ? (
              /* YEARLY TABLE LIST VIEW */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Financial Year</th>
                      <th className="py-3.5 px-4 text-center">Receipts Issued</th>
                      <th className="py-3.5 px-4 text-right">Cash Volume</th>
                      <th className="py-3.5 px-4 text-right">Digital / Online Volume</th>
                      <th className="py-3.5 px-4 text-right">Total Annual Revenue</th>
                      <th className="py-3.5 px-4 text-center">YoY Growth</th>
                      <th className="py-3.5 px-4 text-right">Monthly Avg</th>
                      <th className="py-3.5 px-4 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {yearlyList.map((y) => (
                      <tr
                        key={y.year}
                        onClick={() => setSelectedYearData(y)}
                        className="hover:bg-slate-800/40 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-extrabold text-white text-sm">
                          Year {y.year}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded-full font-bold text-[10px]">
                            {y.receiptCount} Receipts
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                          ₹{y.cashCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                          ₹{y.onlineCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm">
                          ₹{y.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {Number(y.yoyGrowth) >= 0 ? (
                            <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              <span>+{y.yoyGrowth}%</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-bold text-[10px] inline-flex items-center">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              <span>{y.yoyGrowth}%</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-cyan-400">
                          ₹{Number(y.monthlyAvg).toLocaleString("en-IN")}/mo
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedYearData(y);
                            }}
                            className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Year</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* YEARLY GRID CARDS VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearlyList.map((y) => (
                  <div
                    key={y.year}
                    onClick={() => setSelectedYearData(y)}
                    className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3 cursor-pointer hover:border-cyan-500/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-cyan-400">Year {y.year}</span>
                      {Number(y.yoyGrowth) >= 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          <span>+{y.yoyGrowth}% YoY</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-bold text-[10px] inline-flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          <span>{y.yoyGrowth}% YoY</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Annual Revenue</span>
                      <span className="text-2xl font-extrabold text-emerald-400">₹{y.totalAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-900 text-slate-400">
                      <div>Cash: <span className="font-bold text-slate-200">₹{y.cashCount.toLocaleString("en-IN")}</span></div>
                      <div>Digital: <span className="font-bold text-slate-200">₹{y.onlineCount.toLocaleString("en-IN")}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. MONTHLY REVENUE SUMMARY TAB */}
        {analyticsTab === "monthly" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Monthly Breakdown ({monthlyList.length} Months Recorded)
              </span>

              <div className="flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMonthlyViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                    monthlyViewMode === "table" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                  title="Table View (Default)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                    monthlyViewMode === "grid" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid View</span>
                </button>
              </div>
            </div>

            {monthlyList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No monthly collection records found.</p>
            ) : monthlyViewMode === "table" ? (
              /* MONTHLY TABLE LIST VIEW (DEFAULT) */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Month & Year</th>
                      <th className="py-3.5 px-4 text-center">Receipts Count</th>
                      <th className="py-3.5 px-4 text-right">Cash Collection</th>
                      <th className="py-3.5 px-4 text-right">Online / UPI Collection</th>
                      <th className="py-3.5 px-4 text-right">Total Revenue</th>
                      <th className="py-3.5 px-4 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {monthlyList.map((m) => (
                      <tr
                        key={m.monthName}
                        onClick={() => setSelectedMonthData(m)}
                        className="hover:bg-slate-800/40 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {m.monthName}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded-full font-bold text-[10px]">
                            {m.receiptCount} Receipts
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                          ₹{m.cashCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                          ₹{m.onlineCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm">
                          ₹{m.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMonthData(m);
                            }}
                            className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Month</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* MONTHLY GRID CARDS VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyList.map((m) => (
                  <div
                    key={m.monthName}
                    onClick={() => setSelectedMonthData(m)}
                    className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3 cursor-pointer hover:border-cyan-500/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">{m.monthName}</span>
                      <span className="px-2.5 py-0.5 bg-blue-950 text-blue-300 rounded-full text-[10px] font-bold">
                        {m.receiptCount} Receipts
                      </span>
                    </div>

                    <div className="text-xl font-extrabold text-emerald-400">
                      ₹{m.totalAmount.toLocaleString("en-IN")}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-900 text-slate-400">
                      <div>Cash: <span className="font-bold text-slate-200">₹{m.cashCount.toLocaleString("en-IN")}</span></div>
                      <div>Online: <span className="font-bold text-slate-200">₹{m.onlineCount.toLocaleString("en-IN")}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: COLLECT FEE FORM & HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLLECT FEE FORM */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Collect Student Fee</h3>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCollectFee} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Student *</label>
              <SearchableSelect
                options={students.map((s) => ({
                  value: s.id,
                  label: `${s.fullName} (${s.studentId})`,
                  subLabel: `Pending Fees: ₹${Number(s.admission?.pendingAmount || 0).toLocaleString("en-IN")}`,
                }))}
                value={selectedStudentId}
                onChange={(_, val) => setSelectedStudentId(val)}
                placeholder="-- Search & Select Student --"
                searchPlaceholder="Type name, mobile or student ID..."
                required
              />
            </div>

            {selectedStudentObj && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Course:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedStudentObj.admission?.courseNameSnapshot || selectedStudentObj.admission?.course?.name}
                  </span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Current Pending Fees:</span>
                  <span>₹{Number(selectedStudentObj.admission?.pendingAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount paid"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / GPAY</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Txn Ref / Receipt No</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Optional reference"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Remarks / Installment Note</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Installment payment note..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{submitting ? "Processing..." : "Record Payment & Print Receipt"}</span>
            </button>
          </form>
        </div>

        {/* FEE HISTORY SECTION WITH GRID / LIST VIEW TOGGLE */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Fee Payment Receipts History</h3>
            </div>

            {/* Grid vs List View Toggle Switch */}
            <div className="flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
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
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500">Loading fee receipts...</div>
          ) : feeHistory.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500">No payment receipts recorded yet.</div>
          ) : viewMode === "table" ? (
            /* LIST / TABLE VIEW */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Receipt / Ref</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {feeHistory.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {p.admission?.studentId || p.admission?.student?.id ? (
                          <a
                            href={`/dashboard/students/${p.admission?.studentId || p.admission?.student?.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-cyan-400 hover:underline transition inline-flex items-center space-x-1"
                            title="Open Student Profile in new tab"
                          >
                            <span>{p.admission?.student?.fullName || "Student"}</span>
                            <ExternalLink className="w-3 h-3 text-cyan-400/80 inline" />
                          </a>
                        ) : (
                          p.admission?.student?.fullName || "Student"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {formatDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded font-bold uppercase text-[10px]">
                          {p.paymentMode || "CASH"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-400 text-sm">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedReceiptPayment(p)}
                            className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>

                          {(p.admission?.studentId || p.admission?.student?.id || p.admission?.student?.studentId) && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppFeeReminder(p.admission?.studentId || p.admission?.student?.id || p.admission?.student?.studentId)}
                              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-lg font-bold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
                              title="Send WhatsApp Fee Reminder"
                            >
                              <span>💬 Reminder</span>
                            </button>
                          )}

                          {isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditFeeModal(p)}
                                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg font-bold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
                                title="Edit fee payment receipt details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePayment(p.id, p.transactionReference, p.amount)}
                                className="px-2 py-1 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800 rounded-lg font-bold text-[11px] transition cursor-pointer"
                                title="Delete this payment receipt"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {feeHistory.map((p) => (
                <div key={p.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded font-bold uppercase text-[10px]">
                      {p.paymentMode || "CASH"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {p.admission?.studentId || p.admission?.student?.id ? (
                        <a
                          href={`/dashboard/students/${p.admission?.studentId || p.admission?.student?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-cyan-400 hover:underline transition inline-flex items-center space-x-1"
                          title="Open Student Profile in new tab"
                        >
                          <span>{p.admission?.student?.fullName || "Student"}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400/80 inline" />
                        </a>
                      ) : (
                        p.admission?.student?.fullName || "Student"
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Date: {formatDate(p.paymentDate || p.createdAt)}
                    </p>
                  </div>


                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                    <div className="text-base font-extrabold text-emerald-400">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setSelectedReceiptPayment(p)}
                        className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-[11px] flex items-center space-x-1 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditFeeModal(p)}
                          className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition cursor-pointer"
                          title="Edit fee payment receipt details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SELECTED YEAR DETAILED BREAKDOWN MODAL */}
      {selectedYearData && (
        <Modal
          isOpen={!!selectedYearData}
          onClose={() => setSelectedYearData(null)}
          title={`Year ${selectedYearData.year} - Financial & Revenue Breakdown`}
        >
          <div className="space-y-4 text-xs font-sans text-slate-200">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Annual Revenue</span>
                <span className="text-base font-extrabold text-emerald-400">₹{selectedYearData.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Receipts Issued</span>
                <span className="text-base font-extrabold text-cyan-400">{selectedYearData.receiptCount} Receipts</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Cash Collection</span>
                <span className="text-xs font-bold text-slate-200">₹{selectedYearData.cashCount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Digital / Online</span>
                <span className="text-xs font-bold text-slate-200">₹{selectedYearData.onlineCount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Monthly Collections in {selectedYearData.year}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(selectedYearData.monthsMap).map((mObj) => (
                  <div key={mObj.monthName} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-cyan-400 block">{mObj.monthName}</span>
                    <span className="text-sm font-extrabold text-emerald-400">₹{mObj.totalAmount.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{mObj.receiptCount} receipts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* SELECTED MONTH DETAILED BREAKDOWN MODAL */}
      {selectedMonthData && (
        <Modal
          isOpen={!!selectedMonthData}
          onClose={() => setSelectedMonthData(null)}
          title={`${selectedMonthData.monthName} - Fee Collection Breakdown`}
        >
          <div className="space-y-4 text-xs font-sans text-slate-200">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Total Revenue</span>
                <span className="text-base font-extrabold text-emerald-400">₹{selectedMonthData.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Receipts Count</span>
                <span className="text-base font-extrabold text-cyan-400">{selectedMonthData.receiptCount} Receipts</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Cash vs Online</span>
                <span className="text-xs font-bold text-slate-200">Cash: ₹{selectedMonthData.cashCount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Receipt Ref</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedMonthData.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                        {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {p.admission?.student?.fullName || "Student"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {formatDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded font-bold uppercase text-[10px]">
                          {p.paymentMode || "CASH"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            const rec = p;
                            setSelectedMonthData(null);
                            setSelectedReceiptPayment(rec);
                          }}
                          className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded font-semibold text-[10px]"
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT FEE PAYMENT MODAL (SUPER ADMIN) */}
      {editingPayment && (
        <Modal
          isOpen={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          title={`Edit Fee Payment Receipt (${editingPayment.transactionReference || "REC-" + editingPayment.id.slice(-6).toUpperCase()})`}
        >
          <form onSubmit={handleEditFeeSubmit} className="space-y-4 text-xs font-sans">
            {editFeeError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300">
                {editFeeError}
              </div>
            )}

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Student Name</span>
              <span className="font-bold text-white text-sm">
                {editingPayment.admission?.student?.fullName || "Student"}
              </span>
              <span className="text-slate-400 block text-[11px] font-mono">
                Course: {editingPayment.admission?.courseNameSnapshot || editingPayment.admission?.course?.name || "General Course"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Paid Amount (₹) *</label>
                <input
                  type="number"
                  value={editFeeForm.amount}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, amount: e.target.value })}
                  required
                  min={1}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Payment Date *</label>
                <input
                  type="date"
                  value={editFeeForm.paymentDate}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, paymentDate: e.target.value })}
                  onClick={(e) => e.target.showPicker?.()}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Payment Mode</label>
                <select
                  value={editFeeForm.paymentMode}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Txn Ref / Receipt No</label>
                <input
                  type="text"
                  value={editFeeForm.transactionReference}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, transactionReference: e.target.value })}
                  placeholder="UPI Ref / Receipt Number"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Remarks / Installment Note</label>
              <textarea
                rows={2}
                value={editFeeForm.remarks}
                onChange={(e) => setEditFeeForm({ ...editFeeForm, remarks: e.target.value })}
                placeholder="Installment payment note..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editFeeSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow flex items-center space-x-1 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editFeeSubmitting ? "Updating..." : "Save Receipt Changes"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
