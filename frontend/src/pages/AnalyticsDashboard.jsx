import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/formatters";
import { exportToCSV } from "../utils/exportUtils";
import {
  Users, UserCheck, CircleDollarSign, Clock, UserPlus,
  CreditCard, ArrowRight, TrendingUp, TrendingDown,
  GraduationCap, BookOpen, AlertCircle, Eye, BarChart3,
  Activity, Target, RefreshCw, ChevronRight, CheckCircle,
  DollarSign, Zap, Award, LayoutDashboard, Download,
  FileSpreadsheet, X, Search, FileText
} from "lucide-react";

// ── ANIMATION STYLES (AppXwinD Brand: Deep Navy + Royal Blue) ──────────────
const DASH_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
  .dash-root { font-family: "Inter", sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0)} 50%{box-shadow:0 0 32px 6px rgba(37,99,235,0.22)} }
  @keyframes orbFloat { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-8px) scale(1.04)} }
  @keyframes dotBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .kpi-card{animation:fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both}
  .kpi-card:nth-child(1){animation-delay:0.06s}
  .kpi-card:nth-child(2){animation-delay:0.12s}
  .kpi-card:nth-child(3){animation-delay:0.18s}
  .kpi-card:nth-child(4){animation-delay:0.24s}
  .kpi-card:nth-child(5){animation-delay:0.30s}
  .kpi-card:nth-child(6){animation-delay:0.36s}
  .kpi-card:nth-child(7){animation-delay:0.42s}
  .kpi-card:nth-child(8){animation-delay:0.48s}
  .glass-card{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:transform 0.24s cubic-bezier(.25,.46,.45,.94),box-shadow 0.24s cubic-bezier(.25,.46,.45,.94),border-color 0.24s ease}
  .glass-card:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(37,99,235,0.18);border-color:rgba(59,130,246,0.35) !important}
  .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;animation:dotBlink 1.8s ease-in-out infinite}
  .orb-float{animation:orbFloat 6s ease-in-out infinite}
  .tr-hover{transition:background 0.15s ease}
  .tr-hover:hover{background:rgba(59,130,246,0.06)}
  .glow-btn{animation:glowPulse 3.5s ease-in-out infinite;transition:transform 0.18s ease,filter 0.18s ease}
  .glow-btn:hover{transform:translateY(-1px);filter:brightness(1.1)}
  .s1{animation:fadeUp 0.6s ease both;animation-delay:0.15s}
  .s2{animation:fadeUp 0.6s ease both;animation-delay:0.25s}
  .s3{animation:fadeUp 0.6s ease both;animation-delay:0.35s}
  .s4{animation:fadeUp 0.6s ease both;animation-delay:0.45s}
  .bar-h{transition:width 1.1s cubic-bezier(.25,.46,.45,.94)}
  .bar-v{transition:height 1.1s cubic-bezier(.25,.46,.45,.94)}
  .gauge-arc{transition:stroke-dasharray 1.5s cubic-bezier(.25,.46,.45,.94)}
  .donut-s{transition:stroke-dasharray 1s cubic-bezier(.25,.46,.45,.94)}
`;

// ── ANIMATED COUNTER HOOK ───────────────────────────────────────────────────
const useCounter = (target, duration = 1300, delay = 0) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target && target !== 0) return;
    const t = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const p = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return val;
};

// ── SVG DONUT CHART ─────────────────────────────────────────────────────────
const DonutChart = ({ segments, size = 136, thickness = 18, ready }) => {
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness * 2) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  let cum = 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={thickness} />
      {total === 0
        ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth={thickness} />
        : segments.map((seg, i) => {
            if (!seg.value) return null;
            const pct = seg.value / total;
            const dashLen = ready ? pct * C : 0;
            const offset = -(cum * C);
            cum += pct;
            return (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
                strokeWidth={thickness} strokeDasharray={`${dashLen} ${C - dashLen}`}
                strokeDashoffset={offset} strokeLinecap="butt" className="donut-s"
                style={{ transitionDelay: `${i * 0.12}s` }} />
            );
          })
      }
    </svg>
  );
};

// ── FORMATTERS ──────────────────────────────────────────────────────────────
const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return String.fromCharCode(0x20B9) + (v / 10000000).toFixed(1) + "Cr";
  if (v >= 100000) return String.fromCharCode(0x20B9) + (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return String.fromCharCode(0x20B9) + (v / 1000).toFixed(0) + "K";
  return String.fromCharCode(0x20B9) + Math.round(v);
};

// Compute last 6 calendar months
const getMonthlyData = (feeHistory = []) => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      amount: 0,
      count: 0,
    });
  }
  feeHistory.forEach((pm) => {
    if (!pm.paymentDate) return;
    const pd = new Date(pm.paymentDate);
    const key = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}`;
    const target = months.find((m) => m.key === key);
    if (target) {
      target.amount += Number(pm.amount || 0);
      target.count += 1;
    }
  });
  return months;
};

// ── KPI CARD COMPONENT ──────────────────────────────────────────────────────
const KPICardAnimated = ({ card, delay }) => {
  const count = useCounter(card.target, 1200, delay);
  return (
    <div
      className="kpi-card relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 transition-all duration-300 group cursor-default shadow-sm hover:shadow-md hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: card.iconBg, color: card.accent }}
        >
          {card.icon}
        </div>
        {card.trend != null && (
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-0.5 border ${
              card.trend >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
            }`}
          >
            {card.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{card.trend >= 0 ? "+Active" : "-Dues"}</span>
          </span>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
        {card.displayFn ? card.displayFn(count) : count}
      </div>

      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{card.label}</div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{card.sub}</div>
    </div>
  );
};

// ── MAIN ANALYTICS DASHBOARD COMPONENT ──────────────────────────────────────
export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [feeHistory, setFeeHistory] = useState([]);
  const [courses, setCourses] = useState([]);
  const [expenseStats, setExpenseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [chartsReady, setChartsReady] = useState(false);
  const [now] = useState(new Date());

  // Interactive Modal state: 'monthly' | 'topCourses' | 'pendingDues' | 'statusBreakdown' | 'financialOverview' | null
  const [activeModal, setActiveModal] = useState(null);
  const [modalSearch, setModalSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [statsRes, admRes, feesRes, crsRes, expRes] = await Promise.all([
        api.get("/admissions/statistics"),
        api.get("/admissions?limit=500&sortBy=newest"),
        api.get("/fees?limit=500"),
        api.get("/courses"),
        api.get("/expenses/stats").catch(() => ({ data: { data: null } })),
      ]);
      setStats(statsRes.data?.data || null);
      setRecentAdmissions(admRes.data?.data?.admissions || []);
      const fd = feesRes.data?.data;
      setFeeHistory(Array.isArray(fd) ? fd : fd?.payments || []);
      setCourses(crsRes.data?.data || []);
      setExpenseStats(expRes.data?.data || null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to load dashboard data. Ensure backend is running.");
    } finally {
      setLoading(false);
      setTimeout(() => setChartsReady(true), 180);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner label="Loading Analytics Intelligence..." />;

  // ── DERIVED VALUES
  const fin = stats?.financialSummary || {};
  const brk = stats?.statusBreakdown || {};
  const totalS = stats?.totalAdmissions || 0;
  const totalUniqueS = stats?.totalUniqueStudents || totalS;
  const activeC = brk.ACTIVE || 0;
  const completedC = brk.COMPLETED || 0;
  const cancelledC = brk.CANCELLED || 0;
  const totalRev = Number(fin.totalPaidAmount || 0);
  const pendingAmt = Number(fin.totalPendingAmount || 0);
  const totalFees = Number(fin.totalFinalFees || 0);
  const collRate =
    totalFees > 0
      ? Math.round((totalRev / totalFees) * 100)
      : totalRev + pendingAmt > 0
      ? Math.round((totalRev / (totalRev + pendingAmt)) * 100)
      : 0;
  const totalExp = Number(expenseStats?.totalExpense || 0);
  const netRev = totalRev - totalExp;
  const monthly = getMonthlyData(feeHistory);
  const maxMon = Math.max(...monthly.map((m) => m.amount), 1);
  const curMon = monthly[monthly.length - 1]?.amount || 0;
  const prevMon = monthly[monthly.length - 2]?.amount || 0;
  const momChg = prevMon > 0 ? (((curMon - prevMon) / prevMon) * 100).toFixed(1) : null;

  // Top courses from admission snapshot names
  const cMap = {};
  recentAdmissions.forEach((a) => {
    const n = a.courseNameSnapshot || "Unknown";
    cMap[n] = (cMap[n] || 0) + 1;
  });
  const topCourses = Object.entries(cMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const topCoursesDisplay = topCourses.slice(0, 5);
  const maxCC = topCoursesDisplay[0]?.count || 1;

  const highPend = [...recentAdmissions]
    .filter((a) => Number(a.pendingAmount) > 0)
    .sort((a, b) => Number(b.pendingAmount) - Number(a.pendingAmount));

  const donut = [
    { label: "Active", value: activeC, color: "#3b82f6" },
    { label: "Completed", value: completedC, color: "#10b981" },
    { label: "Cancelled", value: cancelledC, color: "#ef4444" },
  ];

  const kpiCards = [
    {
      label: "Total Students",
      target: totalUniqueS,
      displayFn: (v) => v.toLocaleString("en-IN"),
      sub: `${totalS} total course enrollments`,
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: "#60a5fa",
      iconBg: "rgba(59,130,246,0.18)",
      cardBg: "linear-gradient(145deg,#0d1b3e,#0f2255)",
    },
    {
      label: "Active Enrollments",
      target: activeC,
      displayFn: (v) => v.toLocaleString("en-IN"),
      sub: "Currently studying",
      icon: <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: "#34d399",
      iconBg: "rgba(16,185,129,0.18)",
      cardBg: "linear-gradient(145deg,#0d2a1e,#022c22)",
    },
    {
      label: "Fees Collected",
      target: totalRev,
      displayFn: (v) => fmtK(v),
      sub: `${collRate}% collection efficiency`,
      icon: <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: "#4ade80",
      iconBg: "rgba(74,222,128,0.15)",
      cardBg: "linear-gradient(145deg,#0a2218,#032215)",
      trend: collRate > 75 ? 1 : -1,
    },
    {
      label: "Pending Dues",
      target: pendingAmt,
      displayFn: (v) => fmtK(v),
      sub: "Outstanding balance",
      icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: "#fb923c",
      iconBg: "rgba(251,146,60,0.18)",
      cardBg: "linear-gradient(145deg,#1c0e00,#1a0900)",
      trend: pendingAmt > 0 ? -1 : 1,
    },
    {
      label: "Total Courses",
      target: courses.length,
      displayFn: (v) => v.toLocaleString("en-IN"),
      sub: "Active programs",
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: "#a78bfa",
      iconBg: "rgba(167,139,250,0.18)",
      cardBg: "linear-gradient(145deg,#1a0d3e,#2d1b69)",
    },
    {
      label: "Graduated",
      target: completedC,
      displayFn: (v) => v.toLocaleString("en-IN"),
      sub: "Successfully completed",
      icon: <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: "#38bdf8",
      iconBg: "rgba(56,189,248,0.15)",
      cardBg: "linear-gradient(145deg,#0d1b3e,#0c2a45)",
    },
    {
      label: "This Month",
      target: curMon,
      displayFn: (v) => fmtK(v),
      sub:
        momChg != null
          ? Number(momChg) >= 0
            ? `+${momChg}% vs last month`
            : `${momChg}% vs last month`
          : "Current month revenue",
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: Number(momChg) >= 0 ? "#4ade80" : "#f87171",
      iconBg: Number(momChg) >= 0 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
      cardBg: "linear-gradient(145deg,#0f172a,#0d2a1e)",
      trend: momChg != null ? Number(momChg) : null,
    },
    {
      label: "Collection Rate",
      target: collRate,
      displayFn: (v) => `${v}%`,
      sub: collRate >= 80 ? "Excellent performance" : collRate >= 50 ? "On track" : "Needs attention",
      icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />,
      accent: collRate >= 80 ? "#34d399" : collRate >= 50 ? "#fb923c" : "#f87171",
      iconBg: "rgba(59,130,246,0.15)",
      cardBg: "linear-gradient(145deg,#0f172a,#0d1b3e)",
      trend: collRate > 70 ? 1 : -1,
    },
  ];

  const SS = {
    ACTIVE: { bg: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "rgba(59,130,246,0.4)" },
    COMPLETED: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "rgba(16,185,129,0.4)" },
    DROPPED: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.4)" },
    CANCELLED: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.3)" },
    ON_HOLD: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d", border: "rgba(245,158,11,0.4)" },
  };

  // ── EXPORT HANDLERS ───────────────────────────────────────────────────────
  const handleExportFullReport = () => {
    const summaryRows = [
      { Metric: "Total Unique Physical Students", Value: totalUniqueS },
      { Metric: "Total Course Admissions", Value: totalS },
      { Metric: "Active Studying Students", Value: activeC },
      { Metric: "Completed / Graduated Students", Value: completedC },
      { Metric: "Cancelled Admissions", Value: cancelledC },
      { Metric: "Total Course Fees", Value: totalFees },
      { Metric: "Total Fees Collected", Value: totalRev },
      { Metric: "Total Outstanding Pending Dues", Value: pendingAmt },
      { Metric: "Collection Efficiency Rate", Value: `${collRate}%` },
      { Metric: "Total Operating Expenses", Value: totalExp },
      { Metric: "Net Revenue / Profit", Value: netRev },
    ];
    exportToCSV("ERP_Analytics_Executive_Summary", [
      { label: "Metric Name", key: "Metric" },
      { label: "Metric Value", key: "Value" },
    ], summaryRows);
  };

  const handleExportMonthly = () => {
    exportToCSV(
      "Monthly_Revenue_Collection_Trend",
      [
        { label: "Month", key: "label" },
        { label: "Year-Month Key", key: "key" },
        { label: "Total Amount Collected (INR)", key: "amount" },
        { label: "Total Transactions Count", key: "count" },
      ],
      monthly
    );
  };

  const handleExportTopCourses = () => {
    exportToCSV(
      "Course_Enrollment_Statistics",
      [
        { label: "Course Name", key: "name" },
        { label: "Enrolled Students Count", key: "count" },
      ],
      topCourses
    );
  };

  const handleExportPendingDues = () => {
    const rows = highPend.map((a) => ({
      admissionNumber: a.admissionNumber || "",
      studentName: a.student?.fullName || a.inquiry?.fullName || a.guardianName || a.studentName || "N/A",
      studentId: a.student?.studentId || a.studentId || "",
      mobile: a.student?.mobile || "",
      courseName: a.courseNameSnapshot || "",
      totalFees: Number(a.finalFees || a.courseFees || 0),
      paidAmount: Number(a.paidAmount || 0),
      pendingAmount: Number(a.pendingAmount || 0),
      status: a.status,
      admissionDate: a.admissionDate ? formatDate(a.admissionDate) : "",
    }));

    exportToCSV(
      "Students_Pending_Dues_Report",
      [
        { label: "Admission #", key: "admissionNumber" },
        { label: "Student Name", key: "studentName" },
        { label: "Student STU ID", key: "studentId" },
        { label: "Mobile", key: "mobile" },
        { label: "Course Name", key: "courseName" },
        { label: "Total Fees (₹)", key: "totalFees" },
        { label: "Paid Amount (₹)", key: "paidAmount" },
        { label: "Pending Dues (₹)", key: "pendingAmount" },
        { label: "Status", key: "status" },
        { label: "Admission Date", key: "admissionDate" },
      ],
      rows
    );
  };

  const handleExportStatusBreakdown = () => {
    const rows = Object.entries(brk).map(([status, count]) => ({
      status,
      count,
      percentage: totalS > 0 ? `${Math.round((count / totalS) * 100)}%` : "0%",
    }));
    exportToCSV(
      "Student_Status_Breakdown",
      [
        { label: "Enrollment Status", key: "status" },
        { label: "Total Students", key: "count" },
        { label: "Share (%)", key: "percentage" },
      ],
      rows
    );
  };

  const handleExportRecentAdmissions = () => {
    const rows = recentAdmissions.map((a) => ({
      admissionNumber: a.admissionNumber || "",
      studentName: a.student?.fullName || a.inquiry?.fullName || a.guardianName || a.studentName || "N/A",
      mobile: a.student?.mobile || "",
      courseName: a.courseNameSnapshot || "",
      paidAmount: Number(a.paidAmount || 0),
      pendingAmount: Number(a.pendingAmount || 0),
      status: a.status,
      date: a.admissionDate ? formatDate(a.admissionDate) : "",
    }));
    exportToCSV(
      "All_Student_Admissions_List",
      [
        { label: "Admission #", key: "admissionNumber" },
        { label: "Student Name", key: "studentName" },
        { label: "Mobile", key: "mobile" },
        { label: "Course", key: "courseName" },
        { label: "Paid (₹)", key: "paidAmount" },
        { label: "Pending (₹)", key: "pendingAmount" },
        { label: "Status", key: "status" },
        { label: "Admission Date", key: "date" },
      ],
      rows
    );
  };

  return (
    <>
      <style>{DASH_STYLES}</style>
      <div className="dash-root space-y-6 pb-16">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="s1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <div
                className="w-1.5 h-8 rounded-full shrink-0 bg-gradient-to-b from-blue-600 to-indigo-600"
              />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
              <span
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              >
                <span className="live-dot" />
                <span>LIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 ml-5 font-medium">
              {now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              &nbsp;&middot;&nbsp;EduMaster Academy ERP ({totalUniqueS} Unique Students &middot; {totalS} Admissions)
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleExportFullReport}
              className="px-3.5 py-2 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-1.5 hover:bg-emerald-900 transition shadow-lg"
              title="Download full analytics report in Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Analytics (CSV/Excel)</span>
            </button>
            <button
              onClick={fetchData}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:border-blue-600 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <Link
              to="/dashboard"
              className="glow-btn px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #0f4c8a 0%, #2563eb 100%)" }}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div
            className="p-4 rounded-2xl border border-rose-800 text-rose-300 text-xs flex items-center justify-between"
            style={{ background: "rgba(136,19,55,0.25)" }}
          >
            <span>&#9888; {errorMsg}</span>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-xl font-bold text-[11px] ml-3 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── KPI GRID ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map((card, i) => (
            <KPICardAnimated key={card.label} card={card} delay={i * 60} />
          ))}
        </div>

        {/* ── CHARTS ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 s2">
          {/* Monthly Fee Bar Chart */}
          <div
            className="glass-card lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Monthly Revenue Trend</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Fee collection performance &mdash; last 6 months</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setModalSearch("");
                    setActiveModal("monthly");
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/50 rounded-xl flex items-center space-x-1.5 hover:bg-blue-900 hover:text-white transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details & Export</span>
                </button>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">This Month</div>
                  <div className="text-lg font-black text-blue-400">{fmtINR(curMon)}</div>
                </div>
              </div>
            </div>

            {/* Bars */}
            <div className="flex items-end gap-2 sm:gap-3" style={{ height: "120px" }}>
              {monthly.map((m, i) => {
                const pct = maxMon > 0 ? (m.amount / maxMon) * 100 : 0;
                const isCur = i === monthly.length - 1;
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 group h-full">
                    <div className="flex-1 w-full flex items-end relative">
                      <div
                        className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ zIndex: 10 }}
                      >
                        {fmtK(m.amount)}
                      </div>
                      <div
                        className="w-full rounded-t-lg bar-v relative overflow-hidden"
                        style={{
                          height: chartsReady ? `${Math.max(pct, 3)}%` : "3%",
                          background: isCur
                            ? "linear-gradient(to top, #1d4ed8, #60a5fa)"
                            : "linear-gradient(to top, #1e3a5f80, #2563eb50)",
                          boxShadow: isCur
                            ? "0 0 16px rgba(59,130,246,0.4), 0 0 32px rgba(59,130,246,0.15)"
                            : "none",
                          transitionDelay: `${i * 0.08}s`,
                        }}
                      >
                        {isCur && (
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              background:
                                "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${
                        isCur ? "text-blue-400" : "text-slate-500"
                      }`}
                    >
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary row */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/60 grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Total Collected", val: fmtINR(totalRev), color: "#4ade80" },
                { label: "Outstanding", val: fmtINR(pendingAmt), color: "#fb923c" },
                { label: "Net Revenue", val: fmtINR(Math.max(netRev, 0)), color: "#60a5fa" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[10px] text-slate-500 mb-0.5">{item.label}</div>
                  <div className="text-xs sm:text-sm font-extrabold" style={{ color: item.color }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart */}
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Enrollment Status</span>
              </h3>
              <button
                onClick={() => {
                  setModalSearch("");
                  setActiveModal("statusBreakdown");
                }}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 rounded-xl flex items-center space-x-1 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative">
                <DonutChart segments={donut} size={136} thickness={18} ready={chartsReady} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{totalUniqueS}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">Students</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 mt-4">
              {donut.map((seg) => {
                const pct = totalS > 0 ? Math.round((seg.value / totalS) * 100) : 0;
                return (
                  <div key={seg.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: seg.color }} />
                      <span className="text-slate-600 dark:text-slate-400 font-bold">{seg.label}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bar-h"
                          style={{
                            width: chartsReady ? `${pct}%` : "0%",
                            background: seg.color,
                            transitionDelay: "0.4s",
                          }}
                        />
                      </div>
                      <span className="font-black text-slate-900 dark:text-white w-6 text-right">{seg.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MIDDLE ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 s3">
          {/* Top Courses */}
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Top Enrolled Courses</span>
              </h3>
              <button
                onClick={() => {
                  setModalSearch("");
                  setActiveModal("topCourses");
                }}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 rounded-xl flex items-center space-x-1 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View All & Export</span>
              </button>
            </div>
            {topCoursesDisplay.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No enrollment data yet.</p>
            ) : (
              <div className="space-y-5">
                {topCoursesDisplay.map((c, i) => {
                  const pct = maxCC > 0 ? (c.count / maxCC) * 100 : 0;
                  const PAL = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];
                  const col = PAL[i % PAL.length];
                  return (
                    <div key={c.name} className="group">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <div
                            className="w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0"
                            style={{ background: `${col}25`, color: col }}
                          >
                            {i + 1}
                          </div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate" title={c.name}>
                            {c.name}
                          </span>
                        </div>
                        <span className="font-extrabold ml-2 shrink-0" style={{ color: col }}>
                          {c.count} {c.count === 1 ? "student" : "students"}
                        </span>
                      </div>
                      <div
                        className="w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                      >
                        <div
                          className="h-full rounded-full bar-h"
                          style={{
                            width: chartsReady ? `${Math.max(pct, 5)}%` : "0%",
                            background: `linear-gradient(90deg, ${col}80, ${col})`,
                            boxShadow: `0 0 10px ${col}50`,
                            transitionDelay: `${i * 0.1}s`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* High Pending Dues */}
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>High Pending Dues</span>
              </h3>
              <button
                onClick={() => {
                  setModalSearch("");
                  setActiveModal("pendingDues");
                }}
                className="px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center space-x-1 hover:bg-amber-100 dark:hover:bg-amber-900 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View All ({highPend.length}) & Export</span>
              </button>
            </div>
            {highPend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50"
                >
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">All dues cleared!</p>
                <p className="text-[11px] text-slate-500 font-medium">No outstanding balances</p>
              </div>
            ) : (
              <div className="space-y-3">
                {highPend.slice(0, 5).map((adm, i) => {
                  const url = `/dashboard/students/${adm.student?.id || adm.studentId}`;
                  const pA = Number(adm.pendingAmount);
                  const tA = Number(adm.finalFees || 0);
                  const dp = tA > 0 ? Math.round((pA / tA) * 100) : 100;
                  const urg = dp >= 80 ? "#ef4444" : dp >= 50 ? "#f59e0b" : "#fb923c";
                  return (
                    <div
                      key={adm.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-950/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition"
                      onClick={() => window.open(url, "_blank")}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                        style={{ background: `${urg}20`, color: urg }}
                      >
                        {(adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "Student"}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">{adm.courseNameSnapshot}</div>
                        <div className="mt-1 w-full h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bar-h"
                            style={{
                              width: chartsReady ? `${dp}%` : "0%",
                              background: urg,
                              transitionDelay: `${i * 0.08 + 0.5}s`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold" style={{ color: urg }}>
                          {fmtK(pA)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{dp}% due</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── FINANCIAL SUMMARY CARDS ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 s4">
          {/* Collection Gauge */}
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm text-center cursor-pointer hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => setActiveModal("financialOverview")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Collection Efficiency</span>
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex justify-center relative mb-3">
              <svg width="120" height="70" viewBox="0 0 120 70">
                <path d="M 16 60 A 44 44 0 0 1 104 60" fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="12" strokeLinecap="round" />
                <path
                  d="M 16 60 A 44 44 0 0 1 104 60"
                  fill="none"
                  stroke="url(#gaugeG)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${chartsReady ? (collRate / 100) * 138 : 0} 138`}
                  className="gauge-arc"
                  style={{ transitionDelay: "0.4s" }}
                />
                <defs>
                  <linearGradient id="gaugeG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-1 inset-x-0 text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{collRate}%</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{fmtINR(totalRev)}</span>
              {" collected of "}
              <span className="text-slate-900 dark:text-white font-bold">{fmtINR(totalFees || totalRev + pendingAmt)}</span>
            </p>
          </div>

          {/* Net Revenue */}
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm text-center cursor-pointer hover:border-emerald-500 transition"
            onClick={() => setActiveModal("financialOverview")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Net Profit / Revenue</span>
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{fmtINR(Math.max(netRev, 0))}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-4">After {fmtINR(totalExp)} in expenses</p>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <div className="text-slate-500 dark:text-slate-400 font-medium">Revenue</div>
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">{fmtK(totalRev)}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400 font-medium">Expenses</div>
                <div className="font-extrabold text-rose-600 dark:text-rose-400">{fmtK(totalExp)}</div>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm text-center cursor-pointer hover:border-blue-500 transition"
            onClick={() => setActiveModal("statusBreakdown")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Completion Rate</span>
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <Award className="w-7 h-7 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">
              {totalS > 0 ? Math.round((completedC / totalS) * 100) : 0}%
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-4">
              {completedC} of {totalUniqueS} unique students
            </p>
            <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bar-h"
                style={{
                  width: chartsReady ? `${totalS > 0 ? (completedC / totalS) * 100 : 0}%` : "0%",
                  background: "linear-gradient(90deg,#1d4ed8,#3b82f6)",
                  boxShadow: "0 0 12px rgba(59,130,246,0.4)",
                  transitionDelay: "0.6s",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── RECENT ADMISSIONS TABLE ────────────────────────────────────── */}
        <div
          className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm s4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Recent Student Admissions</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Latest student enrollments &middot; Click any row to open student profile
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleExportRecentAdmissions}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold rounded-2xl flex items-center space-x-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <Link
                to="/dashboard/students"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 whitespace-nowrap shrink-0 transition ml-2"
              >
                <span>View All Students</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {recentAdmissions.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">No admissions found.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800/80">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[720px]">
                <thead
                  className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800"
                >
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">#ID</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Student</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Course</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Paid</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Pending</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {recentAdmissions.slice(0, 15).map((adm, i) => {
                    const tid = adm.student?.id || adm.studentId || adm.id;
                    const url = `/dashboard/students/${tid}`;
                    const hasPend = Number(adm.pendingAmount) > 0;
                    const sty = SS[adm.status] || {
                      bg: "rgba(100,116,139,0.15)",
                      color: "#94a3b8",
                      border: "rgba(100,116,139,0.3)",
                    };
                    return (
                      <tr key={adm.id} className="tr-hover cursor-pointer" onClick={() => window.open(url, "_blank")}>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap" style={{ color: "#60a5fa" }}>
                          {adm.admissionNumber || `#${i + 1}`}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0"
                              style={{ background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", color: "#93c5fd" }}
                            >
                              {(adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "?")[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs leading-tight">
                                {adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "N/A"}
                              </div>
                              <div className="text-[10px] text-slate-500">{adm.student?.studentId || adm.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-[160px] truncate whitespace-nowrap" title={adm.courseNameSnapshot}>
                          {adm.courseNameSnapshot || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                          {fmtINR(adm.paidAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                          {hasPend ? (
                            <span className="text-amber-400">{fmtINR(adm.pendingAmount)}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap"
                            style={{ background: sty.bg, color: sty.color, borderColor: sty.border }}
                          >
                            {adm.status || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono whitespace-nowrap text-[11px]">
                          {formatDate(adm.admissionDate)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                            style={{ background: "rgba(59,130,246,0.18)", color: "#93c5fd" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(59,130,246,0.4)";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(59,130,246,0.18)";
                              e.currentTarget.style.color = "#93c5fd";
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>View</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── INTERACTIVE ANALYTICS DETAIL MODALS ───────────────────────── */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {activeModal === "monthly" && "Monthly Revenue & Collection Analysis"}
                      {activeModal === "topCourses" && "Course-wise Enrollment Analysis"}
                      {activeModal === "pendingDues" && "Detailed Pending Dues & Outstanding Balances"}
                      {activeModal === "statusBreakdown" && "Student Status Breakdown"}
                      {activeModal === "financialOverview" && "Financial & Revenue Executive Summary"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Complete inspection & export report</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (activeModal === "monthly") handleExportMonthly();
                      else if (activeModal === "topCourses") handleExportTopCourses();
                      else if (activeModal === "pendingDues") handleExportPendingDues();
                      else if (activeModal === "statusBreakdown") handleExportStatusBreakdown();
                      else if (activeModal === "financialOverview") handleExportFullReport();
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl flex items-center space-x-1.5 shadow-md transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV / Excel</span>
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Search Bar if applicable */}
              {(activeModal === "pendingDues" || activeModal === "topCourses") && (
                <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
                  <div className="relative w-full max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by student name, course or STU ID..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Modal Body Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* 1. Monthly Revenue Modal */}
                {activeModal === "monthly" && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="text-slate-500 dark:text-slate-400 uppercase text-[10px] bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Month</th>
                          <th className="py-3 px-4">Year-Month Key</th>
                          <th className="py-3 px-4 text-right">Transactions Count</th>
                          <th className="py-3 px-4 text-right">Amount Collected (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {monthly.map((m) => (
                          <tr key={m.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.label}</td>
                            <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{m.key}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">{m.count}</td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(m.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. Top Courses Modal */}
                {activeModal === "topCourses" && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="text-slate-500 dark:text-slate-400 uppercase text-[10px] bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4"># Rank</th>
                          <th className="py-3 px-4">Course Name</th>
                          <th className="py-3 px-4 text-right">Enrolled Students</th>
                          <th className="py-3 px-4 text-right">Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {topCourses
                          .filter((c) => c.name.toLowerCase().includes(modalSearch.toLowerCase()))
                          .map((c, i) => (
                            <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">#{i + 1}</td>
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                              <td className="py-3 px-4 text-right font-extrabold text-blue-600 dark:text-blue-400">{c.count}</td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">
                                {totalS > 0 ? `${Math.round((c.count / totalS) * 100)}%` : "0%"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. Pending Dues Modal */}
                {activeModal === "pendingDues" && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="text-slate-500 dark:text-slate-400 uppercase text-[10px] bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Mobile</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4 text-right">Total Fees</th>
                          <th className="py-3 px-4 text-right">Paid</th>
                          <th className="py-3 px-4 text-right">Pending Dues</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {highPend
                          .filter((a) => {
                            const q = modalSearch.toLowerCase();
                            return (
                              (a.student?.fullName || "").toLowerCase().includes(q) ||
                              (a.courseNameSnapshot || "").toLowerCase().includes(q) ||
                              (a.student?.studentId || "").toLowerCase().includes(q)
                            );
                          })
                          .map((a) => {
                            const pA = Number(a.pendingAmount);
                            return (
                              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 dark:text-white">{a.student?.fullName || "N/A"}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{a.student?.studentId || a.studentId}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{a.student?.mobile || "—"}</td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{a.courseNameSnapshot || "—"}</td>
                                <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{fmtINR(a.finalFees || a.courseFees)}</td>
                                <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{fmtINR(a.paidAmount)}</td>
                                <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400 font-extrabold">{fmtINR(pA)}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                    {a.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. Status Breakdown Modal */}
                {activeModal === "statusBreakdown" && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="text-slate-500 dark:text-slate-400 uppercase text-[10px] bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Status Category</th>
                          <th className="py-3 px-4 text-right">Student Count</th>
                          <th className="py-3 px-4 text-right">Share of Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {Object.entries(brk).map(([st, cnt]) => (
                          <tr key={st} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st}</td>
                            <td className="py-3 px-4 text-right font-extrabold text-blue-600 dark:text-blue-400">{cnt}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">
                              {totalS > 0 ? `${Math.round((cnt / totalS) * 100)}%` : "0%"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 5. Financial Overview Modal */}
                {activeModal === "financialOverview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Final Fees</div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-1">{fmtINR(totalFees)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Collected Revenue</div>
                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{fmtINR(totalRev)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Pending Dues</div>
                        <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-1">{fmtINR(pendingAmt)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Net Revenue / Profit</div>
                        <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-1">{fmtINR(netRev)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-600 pt-2">
          <Zap className="w-3 h-3" />
          <span>AppXwinD Technology ERP &middot; Real-time Analytics Intelligence</span>
          <span className="live-dot" />
        </div>
      </div>
    </>
  );
};
