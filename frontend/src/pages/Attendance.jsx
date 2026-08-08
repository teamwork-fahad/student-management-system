import React, { useState, useEffect } from "react";
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

      // Filter locally by department if selected and course not explicitly picked
      if (selectedDeptId && !selectedCourseId) {
        const deptCourseIds = new Set(
          courses
            .filter((c) => c.departmentId === selectedDeptId || c.department?.id === selectedDeptId)
            .map((c) => c.id)
        );
        const deptCourseNames = new Set(
          courses
            .filter((c) => c.departmentId === selectedDeptId || c.department?.id === selectedDeptId)
            .map((c) => c.name)
        );
        list = list.filter((s) => deptCourseNames.has(s.courseName));
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
      const res = await api.get("/attendance/stats");
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const markedCount = Object.values(attendanceState).filter((s) => s && s !== "UNMARKED").length;
  const unmarkedCount = students.length - markedCount;

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
      setMsg("Failed to auto-save status.");
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

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Daily Student Attendance</h1>
          <p className="text-xs text-slate-400">
            Attendance changes auto-save instantly to database ⚡. Refresh anytime!
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* Department Filter */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedCourseId(""); // reset course when dept changes
              }}
              className="bg-transparent text-slate-100 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="" className="bg-slate-950">-- All Departments --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-950">
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-transparent text-cyan-400 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="" className="bg-slate-950">-- All Courses --</option>
              {courses
                .filter((c) => !selectedDeptId || c.departmentId === selectedDeptId || c.department?.id === selectedDeptId)
                .map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-950">
                    {c.name} ({c.code})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            <CalendarIcon className="w-4 h-4 text-cyan-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button
            onClick={handleShareWhatsAppReport}
            className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5 transition"
            title="Generate & Share WhatsApp Attendance Report"
          >
            <span>💬 WhatsApp Report</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || students.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
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

      {/* STATS OVERVIEW CARDS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Active</span>
            <span className="text-xl font-extrabold text-white">{stats.totalStudents} Students</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Present Today</span>
            <span className="text-xl font-extrabold text-emerald-400">{stats.todayPresent}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Absent Today</span>
            <span className="text-xl font-extrabold text-rose-400">{stats.todayAbsent}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Late Today</span>
            <span className="text-xl font-extrabold text-amber-400">{stats.todayLate}</span>
          </div>
        </div>
      )}

      {/* ATTENDANCE STATUS TABS (UNMARKED PENDING vs MARKED DONE vs ALL) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setAttendanceTab("UNMARKED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              attendanceTab === "UNMARKED"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>⏳ Unmarked Pending</span>
            <span className="px-1.5 py-0.2 bg-slate-900/60 rounded-full font-mono text-[10px]">
              {unmarkedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceTab("MARKED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              attendanceTab === "MARKED"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>✅ Marked Done</span>
            <span className="px-1.5 py-0.2 bg-slate-900/60 rounded-full font-mono text-[10px]">
              {markedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              attendanceTab === "ALL"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌐 All Students</span>
            <span className="px-1.5 py-0.2 bg-slate-900/60 rounded-full font-mono text-[10px]">
              {students.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-semibold px-2">
          {attendanceTab === "UNMARKED"
            ? "Showing students pending attendance. Marking student moves them out of list ⚡"
            : attendanceTab === "MARKED"
            ? "Showing students already marked today. Click Unmark to move back to pending 🔄"
            : "Showing all enrolled active students."}
        </div>
      </div>

      {/* Mark All Quick Actions & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name, ID or course..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <span className="text-[10px] px-2.5 py-1 bg-slate-800 text-cyan-300 rounded-xl font-bold shrink-0">
            {markedCount}/{students.length} Marked
          </span>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === "table" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Table List View"
            >
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === "cards" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Mobile Touch Cards View"
            >
              <span>📱 Mobile Cards</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleMarkAll("PRESENT")}
              className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 rounded-xl text-xs font-bold transition shrink-0"
            >
              ✓ All Present
            </button>
            <button
              onClick={() => handleMarkAll("ABSENT")}
              className="px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 rounded-xl text-xs font-bold transition shrink-0"
            >
              ✗ All Absent
            </button>
            <button
              onClick={() => handleMarkAll("UNMARKED")}
              className="p-2 bg-slate-950 text-slate-400 border border-slate-800 hover:text-white rounded-xl text-xs font-semibold transition shrink-0"
              title="Reset to Unmarked"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* BULK SELECTION ACTION BAR */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-slate-900 border border-cyan-500/40 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center space-x-2 text-xs text-slate-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{selectedStudentIds.length} Student(s) Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange("PRESENT")}
              disabled={saving}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              ✓ Mark Present
            </button>
            <button
              onClick={() => handleBulkStatusChange("ABSENT")}
              disabled={saving}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              ✗ Mark Absent
            </button>
            <button
              onClick={() => handleBulkStatusChange("LATE")}
              disabled={saving}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              ⏳ Mark Late
            </button>
            <button
              onClick={() => handleBulkStatusChange("EARLY_LEAVE")}
              disabled={saving}
              className="px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-amber-100 rounded-xl text-xs font-bold transition shadow"
              title="Student left before class ended"
            >
              🟤 Mark Early Leave
            </button>
            <button
              onClick={() => handleBulkStatusChange("NO_CLASS")}
              disabled={saving}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
              title="No class scheduled for student today"
            >
              ☕ Mark No Class
            </button>
            <button
              onClick={() => handleBulkStatusChange("HOLIDAY")}
              disabled={saving}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow"
              title="Institute / batch official holiday"
            >
              🌴 Mark Holiday
            </button>
            <button
              onClick={() => handleBulkStatusChange("UNMARKED")}
              disabled={saving}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition shadow"
            >
              🔄 Unmark / Reset
            </button>
          </div>
        </div>
      )}

      {/* Attendance Sheet Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading student attendance list...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No active students found matching search.</div>
        ) : viewMode === "cards" ? (
          /* MOBILE TOUCH CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => {
              const currentStatus = attendanceState[s.studentId] || "UNMARKED";
              const isSelected = selectedStudentIds.includes(s.studentId);
              const profileUrl = `/dashboard/students/${s.studentId}`;

              return (
                <div key={s.studentId} className={`p-4 bg-slate-950/90 border rounded-2xl space-y-3 shadow-lg transition ${isSelected ? "border-cyan-500/80 bg-cyan-950/20" : "border-slate-800"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectStudent(s.studentId)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-cyan-400">{s.displayId}</span>
                    </div>
                    {currentStatus === "PRESENT" ? (
                      <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold text-[10px]">PRESENT</span>
                    ) : currentStatus === "ABSENT" ? (
                      <span className="px-2.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-bold text-[10px]">ABSENT</span>
                    ) : currentStatus === "LATE" ? (
                      <span className="px-2.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded-full font-bold text-[10px]">LATE</span>
                    ) : currentStatus === "EARLY_LEAVE" ? (
                      <span className="px-2.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-700 rounded-full font-bold text-[10px]">🟤 EARLY LEAVE</span>
                    ) : currentStatus === "NO_CLASS" ? (
                      <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full font-bold text-[10px]">☕ NO CLASS</span>
                    ) : currentStatus === "HOLIDAY" ? (
                      <span className="px-2.5 py-0.5 bg-teal-950 text-teal-300 border border-teal-800 rounded-full font-bold text-[10px]">🌴 HOLIDAY</span>
                    ) : currentStatus === "EXEMPTED" ? (
                      <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full font-bold text-[10px]">☕ EXEMPT</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-950 text-slate-500 border border-slate-800 rounded-full font-bold text-[10px]">UNMARKED</span>
                    )}
                  </div>

                  <div>
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-cyan-400 hover:underline text-sm flex items-center space-x-1">
                      <span>{s.fullName}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 inline" />
                    </a>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-xs text-slate-400">{s.courseName}</p>
                      {s.studentStatus === "REVISION" && (
                        <span className="px-2 py-0.2 bg-purple-950 text-purple-300 border border-purple-800 rounded-full font-bold text-[9px]">
                          🔄 REVISION
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile 1-Tap Touch Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.studentId, "PRESENT")}
                      className={`flex-1 py-2 rounded-xl font-bold text-[11px] transition active:scale-95 ${
                        currentStatus === "PRESENT"
                          ? "bg-emerald-600 text-white shadow border border-emerald-400"
                          : "bg-slate-900 text-emerald-400 hover:bg-emerald-950 border border-slate-800"
                      }`}
                    >
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.studentId, "ABSENT")}
                      className={`flex-1 py-2 rounded-xl font-bold text-[11px] transition active:scale-95 ${
                        currentStatus === "ABSENT"
                          ? "bg-rose-600 text-white shadow border border-rose-400"
                          : "bg-slate-900 text-rose-400 hover:bg-rose-950 border border-slate-800"
                      }`}
                    >
                      <span>Absent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.studentId, "LATE")}
                      className={`px-2.5 py-2 rounded-xl font-bold text-[11px] transition active:scale-95 ${
                        currentStatus === "LATE"
                          ? "bg-amber-600 text-white shadow border border-amber-400"
                          : "bg-slate-900 text-amber-400 hover:bg-amber-950 border border-slate-800"
                      }`}
                    >
                      <span>Late</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.studentId, "EARLY_LEAVE")}
                      className={`px-2.5 py-2 rounded-xl font-bold text-[11px] transition active:scale-95 ${
                        currentStatus === "EARLY_LEAVE"
                          ? "bg-amber-900 text-white shadow border border-amber-600"
                          : "bg-slate-900 text-amber-300 hover:bg-amber-950 border border-slate-800"
                      }`}
                      title="Student left before class ended"
                    >
                      <span>🟤 Early Leave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.studentId, "NO_CLASS")}
                      className={`px-2.5 py-2 rounded-xl font-bold text-[11px] transition active:scale-95 ${
                        currentStatus === "NO_CLASS"
                          ? "bg-indigo-600 text-white shadow border border-indigo-400"
                          : "bg-slate-900 text-indigo-300 hover:bg-indigo-950 border border-slate-800"
                      }`}
                      title="Us din class scheduled hi nahi thi"
                    >
                      <span>☕ No Class</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.studentId, "HOLIDAY")}
                      className={`px-2.5 py-2 rounded-xl font-bold text-[11px] transition active:scale-95 ${
                        currentStatus === "HOLIDAY"
                          ? "bg-teal-600 text-white shadow border border-teal-400"
                          : "bg-slate-900 text-teal-300 hover:bg-teal-950 border border-slate-800"
                      }`}
                      title="Institute/class holiday"
                    >
                      <span>🌴 Holiday</span>
                    </button>

                    {currentStatus !== "UNMARKED" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(s.studentId, "UNMARKED")}
                        className="px-2.5 py-2 rounded-xl font-bold text-[11px] bg-slate-900 text-cyan-400 border border-slate-700 hover:bg-slate-800 transition active:scale-95"
                        title="Unmark attendance (Reset back to pending)"
                      >
                        🔄 Unmark
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE LIST VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Course Name</th>
                  <th className="py-3.5 px-4 text-center">Current Status</th>
                  <th className="py-3.5 px-4 text-center">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStudents.map((s) => {
                  const currentStatus = attendanceState[s.studentId] || "UNMARKED";
                  const isSelected = selectedStudentIds.includes(s.studentId);
                  const profileUrl = `/dashboard/students/${s.studentId}`;

                  return (
                    <tr key={s.studentId} className={`transition ${isSelected ? "bg-cyan-950/30" : "hover:bg-slate-800/30"}`}>
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(s.studentId)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center space-x-1"
                          title="Open student profile in new tab"
                        >
                          <span>{s.displayId}</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400/80 inline" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center space-x-2">
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-cyan-400 hover:underline transition flex items-center space-x-1.5"
                            title="Open student profile in new tab"
                          >
                            <span>{s.fullName}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 inline" />
                          </a>
                          {s.studentStatus === "REVISION" && (
                            <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded-full font-bold text-[10px]" title="Student is taking Revision/Practice classes">
                              🔄 REVISION
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{s.courseName}</td>

                      <td className="py-3.5 px-4 text-center">
                        {currentStatus === "PRESENT" ? (
                          <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold text-[10px]">
                            PRESENT
                          </span>
                        ) : currentStatus === "ABSENT" ? (
                          <span className="px-2.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-bold text-[10px]">
                            ABSENT
                          </span>
                        ) : currentStatus === "LATE" ? (
                          <span className="px-2.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded-full font-bold text-[10px]">
                            LATE
                          </span>
                        ) : currentStatus === "EARLY_LEAVE" ? (
                          <span className="px-2.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-700 rounded-full font-bold text-[10px]">
                            🟤 EARLY LEAVE
                          </span>
                        ) : currentStatus === "NO_CLASS" ? (
                          <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full font-bold text-[10px]">
                            ☕ NO CLASS
                          </span>
                        ) : currentStatus === "HOLIDAY" ? (
                          <span className="px-2.5 py-0.5 bg-teal-950 text-teal-300 border border-teal-800 rounded-full font-bold text-[10px]">
                            🌴 HOLIDAY
                          </span>
                        ) : currentStatus === "EXEMPTED" ? (
                          <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full font-bold text-[10px]">
                            ☕ EXEMPT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-950 text-slate-500 border border-slate-800 rounded-full font-bold text-[10px]">
                            UNMARKED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "PRESENT")}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "ABSENT")}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                              currentStatus === "ABSENT"
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "LATE")}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition ${
                              currentStatus === "LATE"
                                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                            }`}
                          >
                            Late
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "EARLY_LEAVE")}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition ${
                              currentStatus === "EARLY_LEAVE"
                                ? "bg-amber-900 text-white shadow-md shadow-amber-900/30"
                                : "bg-slate-950 text-amber-300 hover:text-amber-100 border border-slate-800"
                            }`}
                            title="Student class khatam hone se pehle chala gaya"
                          >
                            🟤 Early Leave
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "NO_CLASS")}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition ${
                              currentStatus === "NO_CLASS"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "bg-slate-950 text-indigo-300 hover:text-indigo-100 border border-slate-800"
                            }`}
                            title="Us din class scheduled hi nahi thi"
                          >
                            ☕ No Class
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, "HOLIDAY")}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition ${
                              currentStatus === "HOLIDAY"
                                ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                                : "bg-slate-950 text-teal-300 hover:text-teal-100 border border-slate-800"
                            }`}
                            title="Institute/class holiday"
                          >
                            🌴 Holiday
                          </button>

                          {currentStatus !== "UNMARKED" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, "UNMARKED")}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-[11px] bg-slate-950 text-cyan-400 border border-slate-700 hover:bg-slate-800 transition"
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
        )}
      </div>
    </div>
  );
};
