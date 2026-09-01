import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Search,
  Filter,
  AlertCircle,
  RotateCcw,
  Zap,
  ExternalLink,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../api/axios";


export const Attendance = () => {

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [attendanceTab, setAttendanceTab] = useState("UNMARKED"); // 'UNMARKED' | 'MARKED' | 'ALL'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [sundayOverride, setSundayOverride] = useState(false); // allow marking even on Sunday

  // ── Sunday detection ────────────────────────────────────────────────────────
  // date string is YYYY-MM-DD; new Date(date) parses as UTC midnight,
  // so we manually extract the day to avoid timezone shift
  const isSunday = useMemo(() => {
    if (!date) return false;
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 0; // 0 = Sunday
  }, [date]);

  // ── Day label (Mon, Tue … Sun) shown next to date ─────────────────────────
  const dayLabel = useMemo(() => {
    if (!date) return "";
    const [y, m, d] = date.split("-").map(Number);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date(y, m - 1, d).getDay()];
  }, [date]);

  // ── Navigate date by ±1 day ───────────────────────────────────────────────
  const navigateDay = (delta) => {
    const [y, m, d] = date.split("-").map(Number);
    const next = new Date(y, m - 1, d + delta);
    const pad = (n) => String(n).padStart(2, "0");
    setDate(`${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`);
  };

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Map of studentId -> attendance status ('PRESENT' | 'ABSENT' | 'LATE' | 'EXEMPTED' | 'UNMARKED')
  const [attendanceState, setAttendanceState] = useState({});

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchStats();
    setSelectedStudentIds([]);
    setSundayOverride(false); // reset override when date changes
  }, [date, selectedCourseId, selectedDeptId]);


  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.studentId));
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedStudentIds.length === 0) return;

    const nextState = { ...attendanceState };
    const records = selectedStudentIds.map((studentId) => {
      nextState[studentId] = status;
      return { studentId, status };
    });
    setAttendanceState(nextState);

    setSaving(true);
    try {
      await api.post("/attendance", {
        date,
        records,
      });
      setMsg(`Updated ${selectedStudentIds.length} student(s) to ${status}!`);
      setSelectedStudentIds([]);
      fetchStats();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Bulk status error:", err);
      setMsg("Failed to update bulk attendance.");
    } finally {
      setSaving(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [dRes, cRes] = await Promise.all([
        api.get("/departments"),
        api.get("/courses"),
      ]);
      setDepartments(dRes.data.data || []);
      setCourses(cRes.data.data || []);
    } catch (err) {
      console.error("Failed to load filter dropdowns", err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `/attendance?date=${date}`;
      if (selectedCourseId) {
        url += `&courseId=${selectedCourseId}`;
      }
      const res = await api.get(url);
      let list = res.data.data || [];

      // Filter locally by department if selected and no specific course chosen.
      // ✅ FIX: Match by courseId (reliable) not courseName (unreliable/duplicate-prone).
      if (selectedDeptId && !selectedCourseId) {
        // Build a set of courseIds that belong to this department
        const deptCourseIds = new Set(
          courses
            .filter((c) => c.departmentId === selectedDeptId || c.department?.id === selectedDeptId)
            .map((c) => c.id)
        );

        // Also keep a set of course names as fallback for students whose
        // admission.courseId doesn't directly match but name does
        const deptCourseNames = new Set(
          courses
            .filter((c) => c.departmentId === selectedDeptId || c.department?.id === selectedDeptId)
            .map((c) => c.name)
        );

        list = list.filter((s) => {
          // ✅ PRIMARY: Match by courseId — reliable, no duplicate issue
          if (s.courseId) return deptCourseIds.has(s.courseId);
          // Fallback: match by courseName if courseId not available
          return deptCourseNames.has(s.courseName);
        });

      }

      setStudents(list);

      const state = {};
      list.forEach((s) => {
        state[s.studentId] = s.status || "UNMARKED";
      });
      setAttendanceState(state);
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchStats = async () => {
    try {
      const res = await api.get(`/attendance/stats?date=${date}`);
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const markedCount = Object.values(attendanceState).filter((s) => s && s !== "UNMARKED").length;
  const unmarkedCount = Math.max(0, students.length - markedCount);

  const filteredStudents = students.filter((s) => {
    const currentStatus = attendanceState[s.studentId] || "UNMARKED";

    if (attendanceTab === "UNMARKED" && currentStatus !== "UNMARKED") {
      return false;
    }
    if (attendanceTab === "MARKED" && currentStatus === "UNMARKED") {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.displayId || "").toLowerCase().includes(q) ||
      (s.courseName || "").toLowerCase().includes(q)
    );
  });

  const handleShareWhatsAppReport = async () => {
    try {
      const res = await api.get(`/attendance/whatsapp-report?date=${date}`);
      const whatsappUrl = res.data.data?.whatsappUrl;
      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank");
      }
    } catch (err) {
      alert("Failed to generate WhatsApp attendance report");
    }
  };

  const handleOpenPublicReport = () => {
    const url = `${window.location.origin}/public/attendance?range=15days`;
    window.open(url, "_blank");
  };

  // Instant save on individual button click
  const handleStatusChange = async (studentId, status) => {
    const updatedState = {
      ...attendanceState,
      [studentId]: status,
    };
    setAttendanceState(updatedState);

    // Auto-save to database immediately
    try {
      await api.post("/attendance", {
        date,
        records: [{ studentId, status }],
      });
      setMsg(`Saved ${status} for student.`);
      fetchStats();
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error("Auto save error:", err);
      setMsg(err.response?.data?.message || "Failed to auto-save status.");
    }
  };

  const handleMarkAll = async (status) => {
    const nextState = {};
    const records = students.map((s) => {
      nextState[s.studentId] = status;
      return { studentId: s.studentId, status };
    });
    setAttendanceState(nextState);

    setSaving(true);
    try {
      await api.post("/attendance", {
        date,
        records,
      });
      setMsg(`Marked all students as ${status} and saved!`);
      fetchStats();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Batch mark error:", err);
      setMsg("Failed to save batch attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttendance = async () => {
    const markedRecords = Object.entries(attendanceState)
      .filter(([_, status]) => status && status !== "UNMARKED")
      .map(([studentId, status]) => ({
        studentId,
        status,
      }));

    if (markedRecords.length === 0) {
      setMsg("Please mark attendance for at least one student before saving.");
      return;
    }

    setSaving(true);
    setMsg("");
    try {
      await api.post("/attendance", {
        date,
        records: markedRecords,
      });

      setMsg(`Daily attendance saved successfully in Database! (${markedRecords.length} students)`);
      fetchStats();
      fetchAttendance();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Daily Student Attendance</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              Live Tracker
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Attendance changes auto-save instantly to database ⚡. Refresh anytime!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenPublicReport}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-blue-800/60 font-bold text-xs rounded-2xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap"
            title="Open 15-Day Public Attendance Report Link"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>🔗 Public Attendance URL</span>
          </button>

          <button
            onClick={handleShareWhatsAppReport}
            className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs rounded-2xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap"
            title="Generate & Share WhatsApp Attendance Report"
          >
            <span>💬 WhatsApp Report</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || students.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{saving ? "Saving..." : "Save Sheet"}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 border rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
          msg.includes("successfully") || msg.includes("Saved") || msg.includes("Marked all")
            ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
            : "bg-amber-950/80 border-amber-800 text-amber-300"
        }`}>
          <Zap className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <span>{msg}</span>
        </div>
      )}
      {/* ── SUNDAY BANNER ──────────────────────────────────────────────────── */}
      {isSunday && (
        <div className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 ${
          sundayOverride
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50"
            : "bg-amber-50/90 dark:bg-gradient-to-r dark:from-amber-950/80 dark:via-orange-950/80 dark:to-amber-950/80 border-amber-200 dark:border-amber-700/60"
        }`}>
          {/* Glow blobs */}
          {!sundayOverride && (
            <>
              <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />
            </>
          )}

          <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              {/* Icon */}
              <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                sundayOverride
                  ? "bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40"
                  : "bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30"
              }`}>
                🌴
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-black tracking-tight ${sundayOverride ? "text-amber-800 dark:text-amber-400" : "text-amber-900 dark:text-amber-300"}`}>
                    {sundayOverride ? "Sunday Override — Marking Active" : "Today is Sunday — Institute Closed 🏖️"}
                  </span>
                  {sundayOverride && (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded-full text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                      Rare Case Mode
                    </span>
                  )}
                </div>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${sundayOverride ? "text-slate-600 dark:text-slate-400" : "text-amber-700 dark:text-amber-400/80"}`}>
                  {sundayOverride
                    ? "Sheet is open. Mark only the students who came in. Leave the rest unmarked."
                    : "Sundays are usually off. If a few students came in, click override to mark their attendance."}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              {!sundayOverride ? (
                <>
                  {/* Mark All Holiday */}
                  <button
                    onClick={() => handleMarkAll("HOLIDAY")}
                    disabled={saving || students.length === 0}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    🌴 Mark All as Holiday
                  </button>

                  {/* Override */}
                  <button
                    onClick={() => setSundayOverride(true)}
                    className="px-3.5 py-2 bg-amber-100 dark:bg-amber-800/60 hover:bg-amber-200 dark:hover:bg-amber-700/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Some Students Came In...
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSundayOverride(false)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Back to Sunday View
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. FILTER & DATE CONTROL GRID */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Attendance Filters & Date Selector</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Department Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-2xl text-xs w-full shadow-sm">
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedCourseId(""); // reset course when dept changes
              }}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer text-xs w-full truncate"
            >
              <option value="" className="bg-white dark:bg-slate-950">🏛️ All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-950">
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-2xl text-xs w-full shadow-sm">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-transparent text-blue-600 dark:text-blue-400 font-bold outline-none cursor-pointer text-xs w-full truncate"
            >
              <option value="" className="bg-white dark:bg-slate-950">📖 All Courses</option>
              {courses
                .filter((c) => !selectedDeptId || c.departmentId === selectedDeptId || c.department?.id === selectedDeptId)
                .map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-950">
                    {c.name} ({c.code})
                  </option>
                ))}
            </select>
          </div>

          {/* Date Selector with Prev / Next navigation */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-2xl text-xs w-full shadow-sm">
            {/* Prev day */}
            <button
              onClick={() => navigateDay(-1)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />

            <div className="flex-1 flex flex-col min-w-0">
              {/* Day label */}
              <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5 ${
                isSunday ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
              }`}>
                {dayLabel}{isSunday ? " — Holiday" : ""}
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer w-full"
              />
            </div>

            {/* Next day */}
            <button
              onClick={() => navigateDay(1)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. STATS OVERVIEW CARDS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block whitespace-nowrap">Total Active</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white whitespace-nowrap">{stats.totalStudents}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">Present</span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{stats.todayPresent}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block whitespace-nowrap">Absent</span>
            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">{stats.todayAbsent}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block whitespace-nowrap">Late</span>
            <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">{stats.todayLate}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block whitespace-nowrap">No Class ☕</span>
            <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">{stats.todayNoClass || 0}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block whitespace-nowrap">Unmarked / Holiday</span>
            <span className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">{(stats.todayUnmarked || 0) + (stats.todayHoliday || 0)}</span>
          </div>
        </div>
      )}

      {/* 4. WORKFLOW TABS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-1.5 p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setAttendanceTab("UNMARKED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              attendanceTab === "UNMARKED"
                ? "bg-amber-500 text-white shadow-sm font-black"
                : "bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950 border border-amber-200 dark:border-amber-800/80"
            }`}
          >
            <span>⏳ Unmarked Pending</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${attendanceTab === "UNMARKED" ? "bg-amber-600/60 text-white" : "bg-amber-100 dark:bg-slate-900/60 text-amber-800 dark:text-amber-300"}`}>
              {unmarkedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceTab("MARKED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              attendanceTab === "MARKED"
                ? "bg-emerald-600 text-white shadow-sm font-black"
                : "bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 border border-emerald-200 dark:border-emerald-800/80"
            }`}
          >
            <span>✅ Marked Done</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${attendanceTab === "MARKED" ? "bg-emerald-700/60 text-white" : "bg-emerald-100 dark:bg-slate-900/60 text-emerald-800 dark:text-emerald-300"}`}>
              {markedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              attendanceTab === "ALL"
                ? "bg-blue-600 text-white shadow-sm font-black"
                : "bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950 border border-blue-200 dark:border-blue-800/80"
            }`}
          >
            <span>🌐 All Students</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${attendanceTab === "ALL" ? "bg-blue-700/60 text-white" : "bg-blue-100 dark:bg-slate-900/60 text-blue-800 dark:text-blue-300"}`}>
              {students.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2">
          {attendanceTab === "UNMARKED"
            ? "Showing students pending attendance. Marking student moves them out of list ⚡"
            : attendanceTab === "MARKED"
            ? "Showing students already marked today. Click Unmark to move back to pending 🔄"
            : "Showing all enrolled active students."}
        </div>
      </div>

      {/* 5. SEARCH & QUICK ACTION TOOLS BAR */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student by name, ID or course..."
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <span className="text-[10px] px-3 py-1.5 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-xl font-extrabold shrink-0 shadow-2xs">
              {markedCount}/{students.length} Marked
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto">
            {/* View Mode Toggle Switch */}
            <div className="flex items-center space-x-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer ${
                  viewMode === "table" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Table List View"
              >
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer ${
                  viewMode === "cards" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Mobile Touch Cards View"
              >
                <span>📱 Mobile Cards</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => handleMarkAll("PRESENT")}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap cursor-pointer shadow-2xs"
              >
                ✓ All Present
              </button>
              <button
                onClick={() => handleMarkAll("ABSENT")}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap cursor-pointer shadow-2xs"
              >
                ✗ All Absent
              </button>
              <button
                onClick={() => handleMarkAll("UNMARKED")}
                className="p-2 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer shadow-2xs"
                title="Reset to Unmarked"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BULK SELECTION ACTION BAR */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-cyan-950/90 border border-blue-200 dark:border-cyan-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md text-xs">
          <div className="flex items-center space-x-2 text-blue-900 dark:text-white font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse"></span>
            <span>{selectedStudentIds.length} Student(s) Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange("PRESENT")}
              disabled={saving}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              ✓ Mark Present
            </button>
            <button
              onClick={() => handleBulkStatusChange("ABSENT")}
              disabled={saving}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              ✗ Mark Absent
            </button>
            <button
              onClick={() => handleBulkStatusChange("LATE")}
              disabled={saving}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              ⏳ Mark Late
            </button>
            <button
              onClick={() => handleBulkStatusChange("EARLY_LEAVE")}
              disabled={saving}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Student left before class ended"
            >
              🟤 Mark Early Leave
            </button>
            <button
              onClick={() => handleBulkStatusChange("NO_CLASS")}
              disabled={saving}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="No class scheduled for student today"
            >
              ☕ Mark No Class
            </button>
            <button
              onClick={() => handleBulkStatusChange("HOLIDAY")}
              disabled={saving}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Institute / batch official holiday"
            >
              🌴 Mark Holiday
            </button>
            <button
              onClick={() => handleBulkStatusChange("UNMARKED")}
              disabled={saving}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              🔄 Unmark / Reset
            </button>
          </div>
        </div>
      )}

      {/* Attendance Sheet Section */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
          Loading student attendance list...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
          No active students found matching search.
        </div>
      ) : viewMode === "cards" ? (
        /* MOBILE TOUCH CARDS VIEW — TRANSPARENT GRID CONTAINER (4 COLUMNS ON DESKTOP) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4 bg-transparent border-none shadow-none p-0">
          {filteredStudents.map((s) => {
            const currentStatus = attendanceState[s.studentId] || "UNMARKED";
            const isSelected = selectedStudentIds.includes(s.studentId);
            const profileUrl = `/dashboard/students/${s.studentId}`;

            return (
              <div
                key={s.studentId}
                className={`p-[14px] bg-white border rounded-[14px] transition-all duration-150 hover:-translate-y-[1px] ${
                  isSelected
                    ? "border-[#3B82F6] ring-2 ring-blue-500/20 shadow-[0_4px_14px_rgba(37,99,235,0.12)]"
                    : "border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:border-[#BFDBFE] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)]"
                }`}
              >
                {/* Card Header: Checkbox + Soft Blue Student ID + Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectStudent(s.studentId)}
                      className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]">
                      {s.displayId}
                    </span>
                  </div>

                  {currentStatus === "PRESENT" ? (
                    <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] rounded-full font-bold text-[10px] tracking-wider">
                      PRESENT
                    </span>
                  ) : currentStatus === "ABSENT" ? (
                    <span className="px-2 py-0.5 bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] rounded-full font-bold text-[10px] tracking-wider">
                      ABSENT
                    </span>
                  ) : currentStatus === "LATE" ? (
                    <span className="px-2 py-0.5 bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] rounded-full font-bold text-[10px] tracking-wider">
                      LATE
                    </span>
                  ) : currentStatus === "EARLY_LEAVE" ? (
                    <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] rounded-full font-bold text-[10px] tracking-wider">
                      EARLY LEAVE
                    </span>
                  ) : currentStatus === "NO_CLASS" ? (
                    <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-full font-bold text-[10px] tracking-wider">
                      NO CLASS
                    </span>
                  ) : currentStatus === "HOLIDAY" ? (
                    <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-full font-bold text-[10px] tracking-wider">
                      HOLIDAY
                    </span>
                  ) : currentStatus === "EXEMPTED" ? (
                    <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-full font-bold text-[10px] tracking-wider">
                      EXEMPT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] rounded-full font-bold text-[10px] tracking-wider">
                      UNMARKED
                    </span>
                  )}
                </div>

                {/* Student Information */}
                <div className="mt-2.5 space-y-0.5">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[14px] text-[#0F172A] hover:text-[#2563EB] hover:underline flex items-center space-x-1 transition"
                    >
                      <span className="truncate max-w-[180px] sm:max-w-none">{s.fullName}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 inline shrink-0" />
                    </a>
                    {s.studentStatus === "REVISION" && (
                      <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-[8.5px]">
                        🔄 REVISION
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#64748B] font-normal leading-snug truncate">{s.courseName}</p>
                </div>

                {/* Divider */}
                <div className="my-2.5 border-t border-[#EEF2F7]"></div>

                {/* Attendance Action Buttons Responsive 3-Column Grid */}
                <div className="grid grid-cols-3 gap-[6px]">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(s.studentId, currentStatus === "PRESENT" ? "UNMARKED" : "PRESENT")}
                    className={`w-full min-h-[32px] py-1.5 px-1 text-[10.5px] font-semibold rounded-[8px] whitespace-nowrap box-border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                      currentStatus === "PRESENT"
                        ? "bg-[#10B981] text-white border border-[#059669] font-bold shadow-xs"
                        : "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] hover:bg-[#D1FAE5] hover:border-[#6EE7B7] hover:shadow-2xs hover:-translate-y-[1px]"
                    }`}
                  >
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(s.studentId, currentStatus === "ABSENT" ? "UNMARKED" : "ABSENT")}
                    className={`w-full min-h-[32px] py-1.5 px-1 text-[10.5px] font-semibold rounded-[8px] whitespace-nowrap box-border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                      currentStatus === "ABSENT"
                        ? "bg-[#EF4444] text-white border border-[#DC2626] font-bold shadow-xs"
                        : "bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] hover:bg-[#FFE4E6] hover:border-[#FDA4AF] hover:shadow-2xs hover:-translate-y-[1px]"
                    }`}
                  >
                    <span>Absent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(s.studentId, currentStatus === "LATE" ? "UNMARKED" : "LATE")}
                    className={`w-full min-h-[32px] py-1.5 px-1 text-[10.5px] font-semibold rounded-[8px] whitespace-nowrap box-border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                      currentStatus === "LATE"
                        ? "bg-[#F59E0B] text-white border border-[#D97706] font-bold shadow-xs"
                        : "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] hover:bg-[#FFEDD5] hover:border-[#FDBA74] hover:shadow-2xs hover:-translate-y-[1px]"
                    }`}
                  >
                    <span>Late</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(s.studentId, currentStatus === "EARLY_LEAVE" ? "UNMARKED" : "EARLY_LEAVE")}
                    title="Student left before class ended"
                    className={`w-full min-h-[32px] py-1.5 px-0.5 text-[10px] font-semibold rounded-[8px] whitespace-nowrap overflow-hidden text-ellipsis box-border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                      currentStatus === "EARLY_LEAVE"
                        ? "bg-[#D97706] text-white border border-[#B45309] font-bold shadow-xs"
                        : "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] hover:bg-[#FEF3C7] hover:border-[#FCD34D] hover:shadow-2xs hover:-translate-y-[1px]"
                    }`}
                  >
                    <span className="truncate">Early Leave</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(s.studentId, currentStatus === "NO_CLASS" ? "UNMARKED" : "NO_CLASS")}
                    title="No class scheduled for student today"
                    className={`w-full min-h-[32px] py-1.5 px-1 text-[10.5px] font-semibold rounded-[8px] whitespace-nowrap box-border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                      currentStatus === "NO_CLASS"
                        ? "bg-[#64748B] text-white border border-[#334155] font-bold shadow-xs"
                        : "bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] hover:bg-[#E2E8F0] hover:border-[#94A3B8] hover:shadow-2xs hover:-translate-y-[1px]"
                    }`}
                  >
                    <span>No Class</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(s.studentId, currentStatus === "HOLIDAY" ? "UNMARKED" : "HOLIDAY")}
                    title="Institute / batch official holiday"
                    className={`w-full min-h-[32px] py-1.5 px-1 text-[10.5px] font-semibold rounded-[8px] whitespace-nowrap box-border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                      currentStatus === "HOLIDAY"
                        ? "bg-[#16A34A] text-white border border-[#15803D] font-bold shadow-xs"
                        : "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] hover:bg-[#DCFCE7] hover:border-[#86EFAC] hover:shadow-2xs hover:-translate-y-[1px]"
                    }`}
                  >
                    <span>Holiday</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Course Name</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Current Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200 font-medium">
                {filteredStudents.map((s) => {
                  const currentStatus = attendanceState[s.studentId] || "UNMARKED";
                  const isSelected = selectedStudentIds.includes(s.studentId);
                  const profileUrl = `/dashboard/students/${s.studentId}`;

                  return (
                    <tr key={s.studentId} className={`transition-colors ${isSelected ? "bg-blue-50/70 dark:bg-cyan-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"}`}>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(s.studentId)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-cyan-400 whitespace-nowrap">
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center space-x-1"
                          title="Open student profile in new tab"
                        >
                          <span>{s.displayId}</span>
                          <ExternalLink className="w-3 h-3 text-blue-600/80 dark:text-cyan-400/80 inline shrink-0" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 dark:hover:text-cyan-400 hover:underline transition flex items-center space-x-1.5"
                            title="Open student profile in new tab"
                          >
                            <span>{s.fullName}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 inline shrink-0" />
                          </a>
                          {s.studentStatus === "REVISION" && (
                            <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full font-bold text-[10px] shrink-0" title="Student is taking Revision/Practice classes">
                              🔄 REVISION
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{s.courseName}</td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {currentStatus === "PRESENT" ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full font-bold text-[10px]">
                            PRESENT
                          </span>
                        ) : currentStatus === "ABSENT" ? (
                          <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-full font-bold text-[10px]">
                            ABSENT
                          </span>
                        ) : currentStatus === "LATE" ? (
                          <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full font-bold text-[10px]">
                            LATE
                          </span>
                        ) : currentStatus === "EARLY_LEAVE" ? (
                          <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-full font-bold text-[10px]">
                            🟤 EARLY LEAVE
                          </span>
                        ) : currentStatus === "NO_CLASS" ? (
                          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-bold text-[10px]">
                            ☕ NO CLASS
                          </span>
                        ) : currentStatus === "HOLIDAY" ? (
                          <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-full font-bold text-[10px]">
                            🌴 HOLIDAY
                          </span>
                        ) : currentStatus === "EXEMPTED" ? (
                          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-bold text-[10px]">
                            ☕ EXEMPT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-[10px]">
                            UNMARKED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "PRESENT")}
                            className={`px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-2xs font-bold"
                                : "bg-emerald-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 border border-emerald-200 dark:border-slate-800 font-semibold"
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "ABSENT")}
                            className={`px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${
                              currentStatus === "ABSENT"
                                ? "bg-rose-600 text-white shadow-2xs font-bold"
                                : "bg-rose-50 dark:bg-slate-950 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 border border-rose-200 dark:border-slate-800 font-semibold"
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "LATE")}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${
                              currentStatus === "LATE"
                                ? "bg-amber-600 text-white shadow-2xs font-bold"
                                : "bg-amber-50 dark:bg-slate-950 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950 border border-amber-200 dark:border-slate-800 font-semibold"
                            }`}
                          >
                            Late
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "EARLY_LEAVE")}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${
                              currentStatus === "EARLY_LEAVE"
                                ? "bg-amber-700 text-white shadow-2xs font-bold"
                                : "bg-amber-50 dark:bg-slate-950 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950 border border-amber-200 dark:border-slate-800 font-semibold"
                            }`}
                            title="Student class khatam hone se pehle chala gaya"
                          >
                            🟤 Early Leave
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "NO_CLASS")}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${
                              currentStatus === "NO_CLASS"
                                ? "bg-indigo-600 text-white shadow-2xs font-bold"
                                : "bg-indigo-50 dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 border border-indigo-200 dark:border-slate-800 font-semibold"
                            }`}
                            title="No class scheduled for student today"
                          >
                            ☕ No Class
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "HOLIDAY")}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${
                              currentStatus === "HOLIDAY"
                                ? "bg-teal-600 text-white shadow-2xs font-bold"
                                : "bg-teal-50 dark:bg-slate-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950 border border-teal-200 dark:border-slate-800 font-semibold"
                            }`}
                            title="Institute/class holiday"
                          >
                            🌴 Holiday
                          </button>

                          {currentStatus !== "UNMARKED" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, "UNMARKED")}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold transition cursor-pointer"
                              title="Unmark attendance (Reset back to pending)"
                            >
                              🔄 Unmark
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
