import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/formatters";
import {
  Users, CircleDollarSign, Clock, UserPlus,
  CreditCard, ArrowRight, Eye,
  LayoutDashboard, GraduationCap, BarChart3, Zap, TrendingUp,
} from "lucide-react";

const HOME_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
  .home-root { font-family: "Inter", sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0)} 50%{box-shadow:0 0 36px 8px rgba(37,99,235,0.28)} }
  @keyframes dotBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes orbFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
  .an1{animation:fadeUp 0.48s ease both;animation-delay:0.04s}
  .an2{animation:fadeUp 0.48s ease both;animation-delay:0.10s}
  .an3{animation:fadeUp 0.48s ease both;animation-delay:0.16s}
  .an4{animation:fadeUp 0.48s ease both;animation-delay:0.22s}
  .an5{animation:fadeUp 0.48s ease both;animation-delay:0.28s}
  .an6{animation:fadeUp 0.48s ease both;animation-delay:0.34s}
  .an7{animation:fadeUp 0.48s ease both;animation-delay:0.40s}
  .glass-c{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:transform 0.22s cubic-bezier(.25,.46,.45,.94),box-shadow 0.22s ease,border-color 0.22s ease}
  .glass-c:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(37,99,235,0.18);border-color:rgba(59,130,246,0.35) !important}
  .big-btn{animation:glowPulse 3s ease-in-out infinite;transition:transform 0.2s ease,filter 0.2s ease}
  .big-btn:hover{transform:translateY(-2px) scale(1.02);filter:brightness(1.1)}
  .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;animation:dotBlink 1.8s ease-in-out infinite}
  .orb-bg{animation:orbFloat 7s ease-in-out infinite}
  .tr-r{transition:background 0.14s ease}
  .tr-r:hover{background:rgba(59,130,246,0.07)}
`;

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return String.fromCharCode(0x20B9) + (v / 10000000).toFixed(1) + "Cr";
  if (v >= 100000) return String.fromCharCode(0x20B9) + (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return String.fromCharCode(0x20B9) + (v / 1000).toFixed(0) + "K";
  return String.fromCharCode(0x20B9) + Math.round(v);
};

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchData = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const [statsRes, admRes] = await Promise.all([
        api.get("/admissions/statistics"),
        api.get("/admissions?limit=10&sortBy=newest"),
      ]);
      setStats(statsRes.data?.data || null);
      setRecentAdmissions(admRes.data?.data?.admissions || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner label="Loading ERP Dashboard..." />;

  const fin = stats?.financialSummary || {};
  const brk = stats?.statusBreakdown || {};
  const totalS = stats?.totalAdmissions || 0;
  const totalUniqueS = stats?.totalUniqueStudents || totalS;
  const activeC = brk.ACTIVE || 0;
  const completedC = brk.COMPLETED || 0;
  const totalRev = Number(fin.totalPaidAmount || 0);
  const pendingAmt = Number(fin.totalPendingAmount || 0);
  const totalFees = Number(fin.totalFinalFees || 0);
  const collRate = totalFees > 0
    ? Math.round((totalRev / totalFees) * 100)
    : (totalRev + pendingAmt > 0 ? Math.round(totalRev / (totalRev + pendingAmt) * 100) : 0);

  const SS = {
    ACTIVE: { bg: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "rgba(59,130,246,0.4)" },
    COMPLETED: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "rgba(16,185,129,0.4)" },
    DROPPED: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.4)" },
    CANCELLED: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.3)" },
    ON_HOLD: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d", border: "rgba(245,158,11,0.4)" },
  };

  const kpis = [
    { label: "Total Students", value: totalUniqueS.toLocaleString("en-IN"), sub: `${totalS} course enrollments (${activeC} active)`, icon: <Users className="w-5 h-5" />, accent: "#60a5fa", iconBg: "rgba(59,130,246,0.18)", bg: "linear-gradient(145deg,#0d1b3e,#0f2255)", cls: "an2" },
    { label: "Fees Collected", value: fmtK(totalRev), sub: collRate + "% collection rate", icon: <CircleDollarSign className="w-5 h-5" />, accent: "#4ade80", iconBg: "rgba(74,222,128,0.15)", bg: "linear-gradient(145deg,#0a2218,#032215)", cls: "an3" },
    { label: "Pending Dues", value: fmtK(pendingAmt), sub: "Outstanding balance", icon: <Clock className="w-5 h-5" />, accent: "#fb923c", iconBg: "rgba(251,146,60,0.18)", bg: "linear-gradient(145deg,#1c0e00,#1a0900)", cls: "an4" },
    { label: "Graduated", value: completedC.toLocaleString("en-IN"), sub: "Successfully completed", icon: <GraduationCap className="w-5 h-5" />, accent: "#38bdf8", iconBg: "rgba(56,189,248,0.15)", bg: "linear-gradient(145deg,#0d1b3e,#0c2a45)", cls: "an5" },
  ];

  return (
    <>
      <style>{HOME_STYLES}</style>
      <div className="home-root space-y-6 pb-12">

        {/* ── HERO BANNER ─────────────────────────────────────────────── */}
        <div className="an1 relative overflow-hidden rounded-3xl border border-slate-800 p-6 sm:p-8"
          style={{ background: "linear-gradient(135deg, #060d1f 0%, #0d1b3e 50%, #0f2255 100%)" }}>
          <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none orb-bg"
            style={{ background: "radial-gradient(circle, #3b82f6, #1d4ed8)" }} />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: "#8b5cf6" }} />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-1.5 h-10 rounded-full" style={{ background: "linear-gradient(to bottom, #3b82f6, #1d4ed8)" }} />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Institute Admin Overview
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    &nbsp;&middot;&nbsp;AppXwinD Technology ERP
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300 max-w-lg leading-relaxed ml-5 mb-4">
                Real-time student onboarding, fee collections &amp; enrollment metrics.
                Click <strong className="text-blue-400">See Analytics Dashboard</strong> for live charts &amp; deep insights.
              </p>
              <div className="ml-5 flex flex-wrap gap-2">
                {["Monthly Charts", "Donut Status", "Pending Alerts", "Collection Gauge", "Net Revenue", "Top Courses"].map((tag, i) => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                    style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.25)", animationDelay: (i * 0.06) + "s" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── CTA BUTTONS ── */}
            <div className="flex flex-col gap-3 lg:shrink-0 lg:min-w-[220px]">
              {/* THE BIG DASHBOARD BUTTON */}
              <Link to="/dashboard/analytics"
                className="big-btn px-6 py-4 text-white font-extrabold rounded-2xl flex items-center justify-center space-x-3 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #0f4c8a 0%, #1d4ed8 55%, #2563eb 100%)", fontSize: "0.95rem" }}>
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span>See Analytics Dashboard</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              <div className="flex gap-3">
                <Link to="/dashboard/admissions"
                  className="flex-1 px-4 py-2.5 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                  <UserPlus className="w-4 h-4 shrink-0" /><span>Admit Student</span>
                </Link>
                <Link to="/dashboard/fees"
                  className="flex-1 px-4 py-2.5 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                  style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
                  <CreditCard className="w-4 h-4 shrink-0" /><span>Collect Fee</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl border border-rose-800 text-rose-300 text-xs flex items-center justify-between"
            style={{ background: "rgba(136,19,55,0.25)" }}>
            <span>&#9888; {errorMsg}</span>
            <button onClick={fetchData}
              className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-xl font-bold text-[11px] ml-3 shrink-0">Retry</button>
          </div>
        )}

        {/* ── QUICK KPI CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((card) => (
            <div key={card.label} className={`${card.cls} glass-c relative overflow-hidden rounded-2xl p-4 sm:p-5 border`}
              style={{ background: card.bg, borderColor: "rgba(59,130,246,0.12)" }}>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: card.accent }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                  <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: card.iconBg, color: card.accent }}>{card.icon}</div>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight mb-1" style={{ color: card.accent }}>{card.value}</div>
                <p className="text-[10px] text-slate-500 font-medium">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── ANALYTICS PROMO CARD ─────────────────────────────────────── */}
        <div className="an6 glass-c rounded-2xl border p-5 sm:p-6"
          style={{ background: "linear-gradient(135deg,#060d1f 0%,#0d1b3e 60%,#0f2255 100%)", borderColor: "rgba(59,130,246,0.22)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-2xl shrink-0" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white mb-1 flex items-center flex-wrap gap-2">
                  <span>Analytics Intelligence Center</span>
                  <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <span className="live-dot" /><span>LIVE</span>
                  </span>
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  View animated monthly revenue trends, enrollment status donut, top courses, high-pending dues alerts,
                  collection efficiency gauge, and net revenue — all driven by live institute data.
                </p>
              </div>
            </div>
            <Link to="/dashboard/analytics"
              className="big-btn px-6 py-3 text-white text-sm font-extrabold rounded-2xl flex items-center space-x-2.5 whitespace-nowrap shrink-0"
              style={{ background: "linear-gradient(135deg,#0f4c8a 0%,#2563eb 100%)" }}>
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>Open Dashboard</span>
            </Link>
          </div>
        </div>

        {/* ── RECENT ADMISSIONS TABLE ──────────────────────────────────── */}
        <div className="an7 glass-c rounded-2xl border border-slate-800 p-5"
          style={{ background: "linear-gradient(160deg,#0d1b3e 0%,#0a0f1e 100%)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" /><span>Recent Student Admissions</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Latest 10 enrollments &middot; Click any row to open student profile</p>
            </div>
            <Link to="/dashboard/students"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 whitespace-nowrap shrink-0 self-start sm:self-auto transition">
              <span>View All Students</span><ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentAdmissions.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">No admissions found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800/60">
              <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
                <thead className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800"
                  style={{ background: "rgba(13,27,62,0.7)" }}>
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">#</th>
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
                  {recentAdmissions.map((adm, i) => {
                    const tid = adm.student?.id || adm.studentId || adm.id;
                    const url = `/dashboard/students/${tid}`;
                    const hasPend = Number(adm.pendingAmount) > 0;
                    const sty = SS[adm.status] || { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "rgba(100,116,139,0.3)" };
                    return (
                      <tr key={adm.id} className="tr-r cursor-pointer" onClick={() => window.open(url, "_blank")}>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap" style={{ color: "#60a5fa" }}>
                          {adm.admissionNumber || `#${i + 1}`}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0"
                              style={{ background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", color: "#93c5fd" }}>
                              {(adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "?")[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "N/A"}</div>
                              <div className="text-[10px] text-slate-500">{adm.student?.studentId || adm.studentId || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-[160px] truncate whitespace-nowrap" title={adm.courseNameSnapshot}>
                          {adm.courseNameSnapshot || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">{fmtINR(adm.paidAmount)}</td>
                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                          {hasPend ? <span className="text-amber-400">{fmtINR(adm.pendingAmount)}</span> : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap"
                            style={{ background: sty.bg, color: sty.color, borderColor: sty.border }}>
                            {adm.status || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono whitespace-nowrap text-[11px]">
                          {formatDate(adm.admissionDate)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                            style={{ background: "rgba(59,130,246,0.18)", color: "#93c5fd" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.4)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.18)"; e.currentTarget.style.color = "#93c5fd"; }}>
                            <Eye className="w-3.5 h-3.5 shrink-0" /><span>View</span>
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

        {/* FOOTER */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-600 pt-2">
          <Zap className="w-3 h-3" />
          <span>AppXwinD Technology ERP &middot; Institute Management System</span>
          <span className="live-dot" />
        </div>

      </div>
    </>
  );
};