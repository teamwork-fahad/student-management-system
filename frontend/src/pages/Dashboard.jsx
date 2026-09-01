import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { UpcomingBirthdaysWidget } from "../components/notifications/UpcomingBirthdaysWidget";
import { formatDate } from "../utils/formatters";
import {
  Users, CircleDollarSign, Clock, UserPlus,
  CreditCard, ArrowRight, Eye,
  LayoutDashboard, GraduationCap, BarChart3, Zap, TrendingUp, AlertTriangle,
} from "lucide-react";

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(1) + "Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(0) + "K";
  return "₹" + Math.round(v);
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
    setLoading(true);
    setErrorMsg("");
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

  useEffect(() => {
    fetchData();
  }, []);

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
    ACTIVE: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    COMPLETED: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    DROPPED: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    CANCELLED: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900",
    ON_HOLD: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  };

  const kpis = [
    {
      label: "Total Unique Students",
      value: totalUniqueS.toLocaleString("en-IN"),
      sub: `${totalS} course enrollments (${activeC} active)`,
      icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
      accent: "text-blue-600 dark:text-blue-400",
      link: "/dashboard/students",
    },
    {
      label: "Fees Collected",
      value: fmtK(totalRev),
      sub: `${collRate}% collection rate`,
      icon: <CircleDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
      accent: "text-emerald-600 dark:text-emerald-400",
      link: "/dashboard/fees",
    },
    {
      label: "Pending Dues",
      value: fmtK(pendingAmt),
      sub: "Click to view student-wise pending dues list",
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
      accent: "text-amber-600 dark:text-amber-400",
      link: "/dashboard/students?paymentFilter=PENDING",
    },
    {
      label: "Graduated Students",
      value: completedC.toLocaleString("en-IN"),
      sub: "Successfully completed",
      icon: <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800",
      accent: "text-indigo-600 dark:text-indigo-400",
      link: "/dashboard/students?status=COMPLETED",
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans animate-fade-in">
      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-sm">
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none bg-blue-500" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-3xl opacity-15 pointer-events-none bg-purple-500" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Institute Admin Overview
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  &nbsp;&middot;&nbsp;EduMaster Academy ERP
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed ml-4 mb-4">
              Real-time student onboarding, fee collections &amp; enrollment metrics.
              Click <strong className="text-blue-600 dark:text-blue-400 font-bold">See Analytics Dashboard</strong> for live charts &amp; deep insights.
            </p>
            <div className="ml-4 flex flex-wrap gap-2">
              {["Monthly Trends", "Status Breakdown", "Dues Alerts", "Collection Efficiency", "Net Revenue"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              to="/dashboard/analytics"
              className="px-6 py-3.5 text-white font-extrabold rounded-2xl flex items-center justify-center space-x-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-transform hover:-translate-y-0.5 text-sm"
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>See Analytics Dashboard</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
            <div className="flex gap-2">
              <Link
                to="/dashboard/admissions"
                className="flex-1 px-4 py-2.5 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 transition shadow"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Admit Student</span>
              </Link>
              <Link
                to="/dashboard/fees"
                className="flex-1 px-4 py-2.5 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 transition shadow"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Collect Fee</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-[11px] ml-3 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── QUICK KPI CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="glass-card relative overflow-hidden rounded-3xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md block group cursor-pointer"
            title={`Click to view ${card.label} details`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">{card.label}</p>
              <div className={`p-2.5 rounded-2xl border ${card.iconBg}`}>{card.icon}</div>
            </div>
            <div className={`text-3xl font-black tracking-tight mb-1 ${card.accent}`}>{card.value}</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{card.sub}</span>
              <span className="font-bold text-blue-600 dark:text-cyan-400 group-hover:translate-x-1 transition flex items-center gap-0.5">
                View &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── ANALYTICS PROMO CARD ─────────────────────────────────────── */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1 flex items-center flex-wrap gap-2">
                <span>Analytics Intelligence Center</span>
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE</span>
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                View animated monthly revenue trends, enrollment status donut, top courses, high-pending dues alerts,
                and collection efficiency gauge — all driven by live institute data.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/analytics"
            className="px-6 py-3 text-white text-xs font-extrabold rounded-2xl flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition whitespace-nowrap shrink-0"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Open Dashboard</span>
          </Link>
        </div>
      </div>

      {/* ── UPCOMING BIRTHDAYS HUB ──────────────────────────────────── */}
      <UpcomingBirthdaysWidget />

      {/* ── RECENT ADMISSIONS SECTION (With Table & Mobile Cards) ─────── */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Recent Student Admissions</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Latest 10 enrollments &middot; Click any entry to open student profile
            </p>
          </div>
          <Link
            to="/dashboard/students"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <span>View All Students</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentAdmissions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">No admissions found.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
                <thead className="text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4 text-right">Paid</th>
                    <th className="py-3.5 px-4 text-right">Pending</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Date</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {recentAdmissions.map((adm, i) => {
                    const tid = adm.student?.id || adm.studentId || adm.id;
                    const url = `/dashboard/students/${tid}`;
                    const hasPend = Number(adm.pendingAmount) > 0;
                    const statusClass = SS[adm.status] || "bg-slate-100 text-slate-700 border-slate-200";
                    return (
                      <tr
                        key={adm.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {adm.admissionNumber || `#${i + 1}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-xs text-blue-600 dark:text-blue-400 shrink-0">
                              {(adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "?")[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">
                                {adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "N/A"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{adm.student?.studentId || adm.studentId || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[160px] truncate" title={adm.courseNameSnapshot}>
                          {adm.courseNameSnapshot || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtINR(adm.paidAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          {hasPend ? (
                            <span className="text-amber-600 dark:text-amber-400">{fmtINR(adm.pendingAmount)}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                            {adm.status || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                          {formatDate(adm.admissionDate)}
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-[11px] font-bold bg-blue-50 hover:bg-blue-600 dark:bg-blue-950 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-800 transition cursor-pointer active:scale-95 shadow-2xs"
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

            {/* Mobile Card Transformation View */}
            <div className="md:hidden space-y-3">
              {recentAdmissions.map((adm, i) => {
                const tid = adm.student?.id || adm.studentId || adm.id;
                const url = `/dashboard/students/${tid}`;
                const hasPend = Number(adm.pendingAmount) > 0;
                const statusClass = SS[adm.status] || "bg-slate-100 text-slate-700 border-slate-200";
                return (
                  <div
                    key={adm.id}
                    onClick={() => window.open(url, "_blank")}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 space-y-3 cursor-pointer hover:border-blue-500 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-xs text-blue-600 dark:text-blue-400 shrink-0">
                          {(adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {adm.student?.fullName || adm.inquiry?.fullName || adm.guardianName || adm.studentName || "N/A"}
                          </h4>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                            {adm.admissionNumber || `#${i + 1}`}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                        {adm.status || "—"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Course:</span> {adm.courseNameSnapshot || "—"}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Paid Amount</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(adm.paidAmount)}</span>
                      </div>
                      {hasPend && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Pending</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{fmtINR(adm.pendingAmount)}</span>
                        </div>
                      )}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 rounded-xl text-[11px] font-bold bg-blue-600 text-white shadow transition flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 dark:text-slate-500 pt-2 font-medium">
        <Zap className="w-3 h-3 text-blue-500" />
        <span>EduMaster Academy ERP &middot; Institute Management System</span>
      </div>
    </div>
  );
};