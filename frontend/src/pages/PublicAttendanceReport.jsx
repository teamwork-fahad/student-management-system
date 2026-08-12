import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Users,
  TrendingUp,
  Coffee,
  ShieldCheck,
  Award,
  Sparkles,
  Share2,
  Check,
  CalendarDays,
  CheckCheck,
} from "lucide-react";
import api from "../api/axios";

export const PublicAttendanceReport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRange = searchParams.get("range") || "15days";

  const [range, setRange] = useState(initialRange);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReport(range);
  }, [range]);

  const fetchReport = async (targetRange) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/public-report?range=${targetRange}`);
      setReport(res.data.data);
    } catch (err) {
      console.error("Failed to load public attendance report", err);
    } fontally {
      setLoading(false);
    }
  };

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    setSearchParams({ range: newRange });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const filteredStudents = (report?.students || []).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.displayId || "").toLowerCase().includes(q) ||
      (s.courseName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 sm:p-6 lg:p-8 selection:bg-cyan-500 selection:text-white">
      {/* Container */}
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. BRANDING HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Official Student Report Portal
                </span>
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Student Attendance Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                Public Attendance Summary & Trends. Track attendance logs, present rates, and daily schedules for your institute batches.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 font-bold text-xs rounded-2xl shadow-lg flex items-center space-x-2 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
                <span>{copied ? "Link Copied!" : "Share Report Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. TIMEFRAME SELECTOR BAR */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 px-2">
            <CalendarDays className="w-4 h-4 text-cyan-400" />
            <span>Select Attendance Window:</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => handleRangeChange("7days")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold transition ${
                range === "7days"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📅 Last 7 Days (Week)
            </button>

            <button
              onClick={() => handleRangeChange("15days")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold transition ${
                range === "15days"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🗓️ Last 15 Days
            </button>

            <button
              onClick={() => handleRangeChange("30days")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold transition ${
                range === "30days"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📆 Last 30 Days (Month)
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Loading public attendance report data...</p>
          </div>
        ) : report ? (
          <>
            {/* 3. OVERALL SUMMARY METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block whitespace-nowrap">Active Students</span>
                <span className="text-2xl font-black text-white">{report.summary?.totalStudents || 0}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block whitespace-nowrap">Overall Rate %</span>
                <span className="text-2xl font-black text-emerald-400">{report.summary?.overallAttendanceRate || 100}%</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block whitespace-nowrap">Total Present</span>
                <span className="text-2xl font-black text-emerald-400">{report.summary?.overallPresent || 0}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <span className="text-[10px] uppercase font-bold text-rose-400 block whitespace-nowrap">Total Absent</span>
                <span className="text-2xl font-black text-rose-400">{report.summary?.overallAbsent || 0}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <span className="text-[10px] uppercase font-bold text-amber-400 block whitespace-nowrap">Total Late</span>
                <span className="text-2xl font-black text-amber-400">{report.summary?.overallLate || 0}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block whitespace-nowrap">No Class ☕</span>
                <span className="text-2xl font-black text-cyan-400">{report.summary?.overallNoClass || 0}</span>
              </div>
            </div>

            {/* 4. DAILY BREAKDOWN CHART MATRIX */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-200 text-sm font-bold">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Daily Attendance Breakdown ({report.numDays} Days Window)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {report.startDate} to {report.endDate}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {(report.dailyBreakdown || []).map((day) => {
                  const total = day.PRESENT + day.ABSENT + day.LATE + day.NO_CLASS + day.HOLIDAY;
                  const presPercent = total > 0 ? Math.round((day.PRESENT / (total || 1)) * 100) : 0;

                  return (
                    <div key={day.date} className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl space-y-2 hover:border-cyan-800/50 transition">
                      <div className="text-[11px] font-bold text-cyan-300 truncate">{day.dayLabel}</div>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-400">P: {day.PRESENT}</span>
                        <span className="text-rose-400">A: {day.ABSENT}</span>
                        <span className="text-cyan-400">NC: {day.NO_CLASS}</span>
                      </div>
                      {/* Mini bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                        <div style={{ width: `${presPercent}%` }} className="bg-emerald-400 h-full" />
                        <div style={{ width: `${100 - presPercent}%` }} className="bg-rose-500 h-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. STUDENT ROSTER LIST & SEARCH */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-slate-200 text-sm font-bold w-full sm:w-auto">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Student Attendance Roster ({filteredStudents.length})</span>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search student name, ID or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <th className="p-3.5">Student ID & Name</th>
                      <th className="p-3.5">Course</th>
                      <th className="p-3.5 text-center">Present</th>
                      <th className="p-3.5 text-center">Absent</th>
                      <th className="p-3.5 text-center">Late</th>
                      <th className="p-3.5 text-center">No Class ☕</th>
                      <th className="p-3.5 text-center">Rate %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-semibold">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No student attendance records match your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.studentId} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white text-sm">{s.fullName}</div>
                            <div className="text-[10px] font-mono text-cyan-400">{s.displayId}</div>
                          </td>
                          <td className="p-3.5 text-slate-300 max-w-[180px] truncate">
                            {s.courseName}
                          </td>
                          <td className="p-3.5 text-center font-bold text-emerald-400">
                            {s.PRESENT}
                          </td>
                          <td className="p-3.5 text-center font-bold text-rose-400">
                            {s.ABSENT}
                          </td>
                          <td className="p-3.5 text-center font-bold text-amber-400">
                            {s.LATE}
                          </td>
                          <td className="p-3.5 text-center font-bold text-cyan-400">
                            {s.NO_CLASS}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              s.attendanceRate >= 80
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : s.attendanceRate >= 60
                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                : "bg-rose-950 text-rose-400 border border-rose-800"
                            }`}>
                              {s.attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. FOOTER NOTICE */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-center text-xs text-slate-400">
              <span>Verified Official Student Management Report • Powered by Student Management System</span>
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
};

export default PublicAttendanceReport;
