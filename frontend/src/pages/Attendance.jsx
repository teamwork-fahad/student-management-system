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
} from "lucide-react";
import api from "../api/axios";

export const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Map of studentId -> attendance status ('PRESENT' | 'ABSENT' | 'LATE')
  const [attendanceState, setAttendanceState] = useState({});

  useEffect(() => {
    fetchAttendance();
    fetchStats();
  }, [date]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?date=${date}`);
      const list = res.data.data || [];
      setStudents(list);

      const state = {};
      list.forEach((s) => {
        state[s.studentId] = s.status === "UNMARKED" ? "PRESENT" : s.status;
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

  const handleStatusChange = (studentId, status) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const next = {};
    students.forEach((s) => {
      next[s.studentId] = status;
    });
    setAttendanceState(next);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMsg("");
    try {
      const records = Object.entries(attendanceState).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await api.post("/attendance", {
        date,
        records,
      });

      setMsg("Daily attendance saved successfully!");
      fetchStats();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Daily Student Attendance</h1>
          <p className="text-xs text-slate-400">Mark daily attendance for enrolled students and track statistics.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            <CalendarIcon className="w-4 h-4 text-cyan-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none"
            />
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold">
          {msg}
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

      {/* Mark All Quick Actions */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <span className="text-xs font-bold text-slate-300">Mark All Batch As:</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleMarkAll("PRESENT")}
            className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 rounded-lg text-xs font-bold transition"
          >
            All Present
          </button>
          <button
            onClick={() => handleMarkAll("ABSENT")}
            className="px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 rounded-lg text-xs font-bold transition"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading student attendance list...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No active students found to mark.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Course Name</th>
                  <th className="py-3.5 px-4 text-center">Mark Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {students.map((s) => {
                  const currentStatus = attendanceState[s.studentId] || "PRESENT";
                  return (
                    <tr key={s.studentId} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{s.displayId}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{s.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-400">{s.courseName}</td>
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
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                              currentStatus === "LATE"
                                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                            }`}
                          >
                            Late
                          </button>
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
