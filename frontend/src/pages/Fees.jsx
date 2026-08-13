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

  // Fee History Pagination State (10 receipts per page)
  const [receiptsCurrentPage, setReceiptsCurrentPage] = useState(1);
  const [receiptsPerPage, setReceiptsPerPage] = useState(10);

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

  // Fee History Pagination calculation
  const totalReceiptPages = Math.ceil(feeHistory.length / receiptsPerPage) || 1;
  const validReceiptPage = Math.min(Math.max(1, receiptsCurrentPage), totalReceiptPages);
  const indexOfLastReceipt = validReceiptPage * receiptsPerPage;
  const indexOfFirstReceipt = indexOfLastReceipt - receiptsPerPage;
  const paginatedFeeHistory = feeHistory.slice(indexOfFirstReceipt, indexOfLastReceipt);

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
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Fees & Financial Revenue Analytics</h1>
        <p className="text-xs text-[#64748B]">Collect tuition payments, analyze year-wise & monthly revenue trends, and issue receipts.</p>
      </div>

      {/* REVENUE ANALYTICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:border-[#D6E2F0] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] hover:-translate-y-[1px] transition-all duration-150">
          <span className="text-[11px] uppercase font-bold text-[#64748B] block mb-1">Total Expected Revenue</span>
          <span className="text-2xl font-black text-[#0F172A]">₹{totalExpected.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:border-[#D6E2F0] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] hover:-translate-y-[1px] transition-all duration-150 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-[#059669] block">Total Collected</span>
            {revenueDiff >= 0 ? (
              <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] rounded-full font-bold text-[10px] inline-flex items-center space-x-0.5" title="MoM Growth">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                <span>+₹{revenueDiff.toLocaleString("en-IN")} (+{percentageChange}%)</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] rounded-full font-bold text-[10px] inline-flex items-center space-x-0.5" title="MoM Decrease">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                <span>-₹{Math.abs(revenueDiff).toLocaleString("en-IN")} ({percentageChange}%)</span>
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-[#059669]">₹{totalCollected.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:border-[#D6E2F0] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] hover:-translate-y-[1px] transition-all duration-150">
          <span className="text-[11px] uppercase font-bold text-[#D97706] block mb-1">Pending Balance</span>
          <span className="text-2xl font-black text-[#D97706]">₹{totalPending.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:border-[#D6E2F0] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] hover:-translate-y-[1px] transition-all duration-150">
          <span className="text-[11px] uppercase font-bold text-[#2563EB] block mb-1">Collection Efficiency</span>
          <span className="text-2xl font-black text-[#2563EB]">{efficiencyRate}%</span>
        </div>
      </div>

      {/* FINANCIAL REVENUE ANALYTICS SECTION (YEARLY VS MONTHLY SWITCHER) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-5 sm:p-6 space-y-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-[#2563EB] shrink-0" />
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Financial Revenue Analysis & Trends</h3>
              <p className="text-xs text-[#64748B] font-medium">Compare year-over-year annual collection performance and monthly breakdowns.</p>
            </div>
          </div>

          {/* Analytics Mode Switcher: Yearly vs Monthly */}
          <div className="flex items-center space-x-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
            <button
              type="button"
              onClick={() => setAnalyticsTab("yearly")}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center space-x-1.5 transition ${analyticsTab === "yearly" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Year-Wise Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTab("monthly")}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center space-x-1.5 transition ${analyticsTab === "monthly" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
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
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Annual Financial Performance & YoY Growth
              </span>

              <div className="flex items-center space-x-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
                <button
                  type="button"
                  onClick={() => setYearlyViewMode("table")}
                  className={`p-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1 transition ${yearlyViewMode === "table" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  title="Table View (Default)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setYearlyViewMode("grid")}
                  className={`p-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1 transition ${yearlyViewMode === "grid" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid View</span>
                </button>
              </div>
            </div>

            {yearlyList.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No yearly collection data available yet.</p>
            ) : yearlyViewMode === "table" ? (
              /* YEARLY TABLE LIST VIEW */
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-[12px]">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[11px] font-bold tracking-wider border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap">Financial Year</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Receipts Issued</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Cash Volume</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Digital / Online Volume</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Annual Revenue</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">YoY Growth</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Monthly Avg</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F7] text-[#334155]">
                    {yearlyList.map((y) => (
                      <tr
                        key={y.year}
                        onClick={() => setSelectedYearData(y)}
                        className="hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-extrabold text-[#0F172A] text-sm">
                          Year {y.year}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full font-bold text-[10px]">
                            {y.receiptCount} Receipts
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#334155]">
                          ₹{y.cashCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#334155]">
                          ₹{y.onlineCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#059669] text-sm">
                          ₹{y.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {Number(y.yoyGrowth) >= 0 ? (
                            <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] rounded-full font-bold text-[10px] inline-flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              <span>+{y.yoyGrowth}%</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] rounded-full font-bold text-[10px] inline-flex items-center">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              <span>{y.yoyGrowth}%</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#2563EB]">
                          ₹{Number(y.monthlyAvg).toLocaleString("en-IN")}/mo
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedYearData(y);
                            }}
                            className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] hover:text-[#1D4ED8] border border-[#BFDBFE] rounded-[8px] font-semibold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
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
                    className="p-5 bg-white border border-[#E2E8F0] rounded-[14px] flex flex-col cursor-pointer hover:border-[#BFDBFE] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] hover:-translate-y-[1px] transition-all duration-150 shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-extrabold text-[#2563EB]">Year {y.year}</span>
                      {Number(y.yoyGrowth) >= 0 ? (
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] rounded-full font-bold text-[10px] inline-flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          <span>+{y.yoyGrowth}% YoY</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] rounded-full font-bold text-[10px] inline-flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          <span>{y.yoyGrowth}% YoY</span>
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Total Annual Revenue</span>
                      <span className="text-2xl font-extrabold text-[#059669]">₹{y.totalAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="payment-breakdown mt-auto pt-3 border-t border-[#EEF2F7] flex items-center justify-between w-full text-[11px] text-[#64748B]">
                      <div>
                        Cash: <span className="font-semibold text-[#0F172A]">₹{y.cashCount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="ml-auto text-right">
                        Digital: <span className="font-semibold text-[#0F172A]">₹{y.onlineCount.toLocaleString("en-IN")}</span>
                      </div>
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
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Monthly Breakdown ({monthlyList.length} Months Recorded)
              </span>

              <div className="flex items-center space-x-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
                <button
                  type="button"
                  onClick={() => setMonthlyViewMode("table")}
                  className={`p-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1 transition ${monthlyViewMode === "table" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  title="Table View (Default)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyViewMode("grid")}
                  className={`p-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1 transition ${monthlyViewMode === "grid" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid View</span>
                </button>
              </div>
            </div>

            {monthlyList.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No monthly collection records found.</p>
            ) : monthlyViewMode === "table" ? (
              /* MONTHLY TABLE LIST VIEW (DEFAULT) */
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-[12px]">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[11px] font-bold tracking-wider border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap">Month & Year</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Receipts Count</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Cash Collection</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Online / UPI Collection</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Revenue</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F7] text-[#334155]">
                    {monthlyList.map((m) => (
                      <tr
                        key={m.monthName}
                        onClick={() => setSelectedMonthData(m)}
                        className="hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#0F172A] text-sm">
                          {m.monthName}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full font-bold text-[10px]">
                            {m.receiptCount} Receipts
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#334155]">
                          ₹{m.cashCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#334155]">
                          ₹{m.onlineCount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#059669] text-sm">
                          ₹{m.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMonthData(m);
                            }}
                            className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] hover:text-[#1D4ED8] border border-[#BFDBFE] rounded-[8px] font-semibold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
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
                    className="p-4 bg-white border border-[#E2E8F0] rounded-[14px] flex flex-col cursor-pointer hover:border-[#BFDBFE] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] hover:-translate-y-[1px] transition-all duration-150 shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#2563EB]">{m.monthName}</span>
                      <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full text-[10px] font-bold">
                        {m.receiptCount} Receipts
                      </span>
                    </div>

                    <div className="text-xl font-extrabold text-[#059669] mb-3">
                      ₹{m.totalAmount.toLocaleString("en-IN")}
                    </div>

                    <div className="payment-breakdown mt-auto pt-2 border-t border-[#EEF2F7] flex items-center justify-between w-full text-[11px] text-[#64748B]">
                      <div>
                        Cash: <span className="font-semibold text-[#0F172A]">₹{m.cashCount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="ml-auto text-right">
                        Online: <span className="font-semibold text-[#0F172A]">₹{m.onlineCount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* COLLECT STUDENT FEE SECTION (MIDDLE SECTION ON DESKTOP & MOBILE) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0]">
          <PlusCircle className="w-5 h-5 text-[#2563EB] shrink-0" />
          <h3 className="text-base font-extrabold text-[#0F172A]">Collect Student Fee</h3>
        </div>

        {error && (
          <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] rounded-[10px] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCollectFee} className="space-y-4 text-xs">
          {/* Top Row: Student Selection & Dynamic Student Info Summary Badge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <label className="block font-bold text-[#334155] mb-1.5">Select Student *</label>
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

            {selectedStudentObj ? (
              <div className="p-3.5 bg-[#F8FAFC] rounded-[12px] border border-[#E2E8F0] space-y-1.5 text-[11px] self-end shadow-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Enrolled Course:</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedStudentObj.admission?.courseNameSnapshot || selectedStudentObj.admission?.course?.name}
                  </span>
                </div>
                <div className="flex justify-between text-[#D97706] font-bold">
                  <span>Current Pending Dues:</span>
                  <span>₹{Number(selectedStudentObj.admission?.pendingAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            ) : (
              <div className="hidden lg:block p-3 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] text-[#94A3B8] text-[11px] italic text-center">
                Select a student above to view pending fee balance
              </div>
            )}
          </div>

          {/* Form Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount paid"
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-bold text-sm placeholder-[#94A3B8]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 cursor-pointer font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-medium"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI / GPAY</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Txn Ref / Receipt No</label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Optional reference"
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-medium placeholder-[#94A3B8]"
              />
            </div>
          </div>

          {/* Bottom Action Row: Remarks & Submit Button */}
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block font-semibold text-[#334155] mb-1">Remarks / Installment Note</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Installment payment note..."
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-medium placeholder-[#94A3B8]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm rounded-[8px] shadow-[0_3px_8px_rgba(5,150,105,0.18)] transition flex items-center justify-center space-x-2 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>{submitting ? "Processing..." : "Record Payment & Print Receipt"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* FEE HISTORY SECTION WITH GRID / LIST VIEW TOGGLE */}
      <div className={viewMode === "grid" ? "space-y-4" : "bg-white border border-[#E2E8F0] rounded-[14px] p-4 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]"}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-2 ${viewMode === "grid" ? "bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-[0_2px_6px_rgba(15,23,42,0.04)]" : ""}`}>
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-[#059669] shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] whitespace-nowrap">Fee Payment Receipts History</h3>
          </div>

          {/* Grid vs List View Toggle Switch */}
          <div className="flex items-center space-x-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-[8px] text-xs font-bold flex items-center space-x-1 transition ${viewMode === "table" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-[8px] text-xs font-bold flex items-center space-x-1 transition ${viewMode === "grid" ? "bg-[#2563EB] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid View</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-[#64748B]">Loading fee receipts...</div>
        ) : feeHistory.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#64748B]">No payment receipts recorded yet.</div>
        ) : viewMode === "table" ? (
          /* LIST / TABLE VIEW */
          <div className="overflow-x-auto border border-[#E2E8F0] rounded-[12px]">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[11px] font-bold tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Receipt / Ref</th>
                  <th className="py-3 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Mode</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Amount</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7] text-[#334155]">
                {paginatedFeeHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                      {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0F172A] whitespace-nowrap">
                      {p.admission?.studentId || p.admission?.student?.id ? (
                        <a
                          href={`/dashboard/students/${p.admission?.studentId || p.admission?.student?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#2563EB] hover:underline transition inline-flex items-center space-x-1"
                          title="Open Student Profile in new tab"
                        >
                          <span>{p.admission?.student?.fullName || "Student"}</span>
                          <ExternalLink className="w-3 h-3 text-[#2563EB] inline shrink-0" />
                        </a>
                      ) : (
                        p.admission?.student?.fullName || "Student"
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] font-mono whitespace-nowrap">
                      {formatDate(p.paymentDate || p.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded font-bold uppercase text-[10px] whitespace-nowrap">
                        {p.paymentMode || "CASH"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#059669] text-sm whitespace-nowrap">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedReceiptPayment(p)}
                          className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] hover:text-[#1D4ED8] border border-[#BFDBFE] rounded-[8px] font-semibold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>

                        {(p.admission?.studentId || p.admission?.student?.id || p.admission?.student?.studentId) && (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppFeeReminder(p.admission?.studentId || p.admission?.student?.id || p.admission?.student?.studentId)}
                            className="px-2 py-1 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] rounded-[8px] font-bold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer shadow-xs"
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
                              className="px-2.5 py-1 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded-[8px] font-bold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer shadow-xs"
                              title="Edit fee payment receipt details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p.id, p.transactionReference, p.amount)}
                              className="px-2 py-1 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3] rounded-[8px] font-bold text-[11px] transition cursor-pointer shadow-xs"
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
          <div className="grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-3 gap-4">
            {paginatedFeeHistory.map((p) => (
              <div
                key={p.id}
                className="p-[14px] bg-white border border-[#E2E8F0] rounded-[12px] space-y-3 shadow-[0_2px_6px_rgba(15,23,42,0.04)] hover:border-[#BFDBFE] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] transition-all duration-150 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Row: Receipt ID badge (left) + Payment Mode badge (right) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-[6px] border border-[#BFDBFE] truncate">
                      {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-[6px] font-bold uppercase text-[10px] shrink-0">
                      {p.paymentMode || "CASH"}
                    </span>
                  </div>

                  {/* Student Name & Date */}
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A] truncate">
                      {p.admission?.studentId || p.admission?.student?.id ? (
                        <a
                          href={`/dashboard/students/${p.admission?.studentId || p.admission?.student?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#2563EB] hover:underline transition inline-flex items-center space-x-1"
                          title="Open Student Profile in new tab"
                        >
                          <span>{p.admission?.student?.fullName || "Student"}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#2563EB] inline shrink-0" />
                        </a>
                      ) : (
                        p.admission?.student?.fullName || "Student"
                      )}
                    </h4>
                    <p className="text-xs text-[#64748B] font-mono mt-0.5">
                      Date: {formatDate(p.paymentDate || p.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Divider + Bottom Row: Amount & Actions */}
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2 mt-auto">
                  <div className="text-[18px] font-[800] text-[#059669] leading-none">
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptPayment(p)}
                      className="w-auto px-3 py-[7px] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] hover:text-[#1D4ED8] border border-[#BFDBFE] rounded-[8px] font-semibold text-xs flex items-center space-x-1 transition cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 shrink-0" />
                      <span>Print</span>
                    </button>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditFeeModal(p)}
                        className="w-auto px-3 py-[7px] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded-[8px] font-bold text-xs flex items-center space-x-1 transition cursor-pointer shadow-xs"
                        title="Edit fee payment receipt details"
                      >
                        <Edit className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION CONTROLS BAR (10 RECEIPTS PER PAGE) */}
        {feeHistory.length > 0 && (
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] font-medium">
            <div className="flex flex-wrap items-center gap-2">
              <span>Show</span>
              <select
                value={receiptsPerPage}
                onChange={(e) => {
                  setReceiptsPerPage(Number(e.target.value));
                  setReceiptsCurrentPage(1);
                }}
                className="bg-white border border-[#CBD5E1] text-[#0F172A] rounded-[8px] px-2.5 py-1 font-bold focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value={10}>10 receipts per page</option>
                <option value={20}>20 receipts per page</option>
                <option value={50}>50 receipts per page</option>
                <option value={100}>100 receipts per page</option>
              </select>
              <span>
                Showing <strong className="text-[#0F172A]">{indexOfFirstReceipt + 1}</strong> to{" "}
                <strong className="text-[#0F172A]">{Math.min(indexOfLastReceipt, feeHistory.length)}</strong> of{" "}
                <strong className="text-[#059669]">{feeHistory.length}</strong> receipts
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={validReceiptPage === 1}
                onClick={() => setReceiptsCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:border-[#BFDBFE] font-bold rounded-[8px] transition disabled:bg-[#F8FAFC] disabled:text-[#CBD5E1] disabled:border-[#E2E8F0] cursor-pointer"
              >
                ◀ Prev
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalReceiptPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalReceiptPages || Math.abs(p - validReceiptPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-[#94A3B8] font-bold">...</span>}
                        <button
                          type="button"
                          onClick={() => setReceiptsCurrentPage(p)}
                          className={`px-3 py-1.5 rounded-[8px] font-extrabold text-xs transition cursor-pointer ${p === validReceiptPage
                              ? "bg-[#2563EB] text-white border border-[#2563EB] shadow-xs"
                              : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
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
                disabled={validReceiptPage >= totalReceiptPages}
                onClick={() => setReceiptsCurrentPage((prev) => Math.min(prev + 1, totalReceiptPages))}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:border-[#BFDBFE] font-bold rounded-[8px] transition disabled:bg-[#F8FAFC] disabled:text-[#CBD5E1] disabled:border-[#E2E8F0] cursor-pointer"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SELECTED YEAR DETAILED BREAKDOWN MODAL */}
      {selectedYearData && (
        <Modal
          isOpen={!!selectedYearData}
          onClose={() => setSelectedYearData(null)}
          title={`Year ${selectedYearData.year} - Financial & Revenue Breakdown`}
        >
          <div className="space-y-4 text-xs font-sans text-[#334155]">
            <div className="p-4 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-4 gap-3">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Annual Revenue</span>
                <span className="text-base font-extrabold text-[#059669]">₹{selectedYearData.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Receipts Issued</span>
                <span className="text-base font-extrabold text-[#2563EB]">{selectedYearData.receiptCount} Receipts</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Cash Collection</span>
                <span className="text-xs font-bold text-[#0F172A]">₹{selectedYearData.cashCount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Digital / Online</span>
                <span className="text-xs font-bold text-[#0F172A]">₹{selectedYearData.onlineCount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#475569] uppercase tracking-wider text-[10px]">Monthly Collections in {selectedYearData.year}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(selectedYearData.monthsMap).map((mObj) => (
                  <div key={mObj.monthName} className="p-3 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-[#2563EB] block">{mObj.monthName}</span>
                    <span className="text-sm font-extrabold text-[#059669]">₹{mObj.totalAmount.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">{mObj.receiptCount} receipts</span>
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
          <div className="space-y-4 text-xs font-sans text-[#334155]">
            <div className="p-4 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-3 gap-3">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Total Revenue</span>
                <span className="text-base font-extrabold text-[#059669]">₹{selectedMonthData.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Receipts Count</span>
                <span className="text-base font-extrabold text-[#2563EB]">{selectedMonthData.receiptCount} Receipts</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Cash vs Online</span>
                <span className="text-xs font-bold text-[#0F172A]">Cash: ₹{selectedMonthData.cashCount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-80 border border-[#E2E8F0] rounded-[10px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[10px] font-bold border-b border-[#E2E8F0] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Receipt Ref</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {selectedMonthData.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                        {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A]">
                        {p.admission?.student?.fullName || "Student"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#64748B]">
                        {formatDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded font-bold uppercase text-[10px]">
                          {p.paymentMode || "CASH"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#059669]">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            const rec = p;
                            setSelectedMonthData(null);
                            setSelectedReceiptPayment(rec);
                          }}
                          className="px-2 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] hover:text-[#1D4ED8] rounded font-semibold text-[10px] cursor-pointer"
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
              <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-[10px] text-[#BE123C]">
                {editFeeError}
              </div>
            )}

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1">
              <span className="text-[#64748B] block font-semibold text-[10px] uppercase">Student Name</span>
              <span className="font-bold text-[#0F172A] text-sm">
                {editingPayment.admission?.student?.fullName || "Student"}
              </span>
              <span className="text-[#64748B] block text-[11px] font-mono">
                Course: {editingPayment.admission?.courseNameSnapshot || editingPayment.admission?.course?.name || "General Course"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#334155] block mb-1 font-semibold">Paid Amount (₹) *</label>
                <input
                  type="number"
                  value={editFeeForm.amount}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, amount: e.target.value })}
                  required
                  min={1}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[#334155] block mb-1 font-semibold">Payment Date *</label>
                <input
                  type="date"
                  value={editFeeForm.paymentDate}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, paymentDate: e.target.value })}
                  onClick={(e) => e.target.showPicker?.()}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-bold cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#334155] block mb-1 font-semibold">Payment Mode</label>
                <select
                  value={editFeeForm.paymentMode}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-bold"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="text-[#334155] block mb-1 font-semibold">Txn Ref / Receipt No</label>
                <input
                  type="text"
                  value={editFeeForm.transactionReference}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, transactionReference: e.target.value })}
                  placeholder="UPI Ref / Receipt Number"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[#334155] block mb-1 font-semibold">Remarks / Installment Note</label>
              <textarea
                rows={2}
                value={editFeeForm.remarks}
                onChange={(e) => setEditFeeForm({ ...editFeeForm, remarks: e.target.value })}
                placeholder="Installment payment note..."
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-[8px] font-bold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editFeeSubmitting}
                className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-[8px] font-bold shadow-xs flex items-center space-x-1 disabled:opacity-50 cursor-pointer transition"
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
