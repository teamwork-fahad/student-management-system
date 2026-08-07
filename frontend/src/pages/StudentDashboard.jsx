import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ReceiptModal } from "../components/receipts/ReceiptModal";
import { formatDate } from "../utils/formatters";
import {
  GraduationCap,
  CreditCard,
  User,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Printer,
  LogOut,
  Send,
  Sparkles,
  ShieldAlert,
  LayoutGrid,
  List,
} from "lucide-react";
import api from "../api/axios";

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // View Mode for fee receipts: 'table' | 'grid'
  const [viewMode, setViewMode] = useState("table");

  // Selected receipt for print modal
  const [selectedPayment, setSelectedPayment] = useState(null);

  // New inquiry modal / state for student
  const [inqCourseId, setInqCourseId] = useState("");
  const [inqRemarks, setInqRemarks] = useState("");
  const [inqMsg, setInqMsg] = useState("");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchStudentProfile();
    fetchCourses();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const res = await api.get("/auth/student-profile");
      setStudentData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/public");
      setCourses(res.data.data || []);
    } catch {
      // ignore
    }
  };

  const handleStudentInquiry = async (e) => {
    e.preventDefault();
    setInqMsg("");

    if (!studentData) return;

    try {
      await api.post("/inquiries/public", {
        fullName: studentData.fullName,
        mobile: studentData.mobile,
        email: studentData.email,
        courseId: inqCourseId,
        remarks: inqRemarks || "Inquiry from Student Portal",
      });

      setInqMsg("Inquiry submitted successfully! Our counseling team will contact you.");
      setInqCourseId("");
      setInqRemarks("");
    } catch (err) {
      setInqMsg(err.response?.data?.message || "Failed to submit inquiry.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Student Portal...</span>
        </div>
      </div>
    );
  }

  const admission = studentData?.admission;
  const payments = admission?.payments || [];
  const course = admission?.course;

  const totalPaid = Number(admission?.paidAmount || 0);
  const pendingFees = Number(admission?.pendingAmount || 0);
  const finalFees = Number(admission?.finalFees || admission?.courseFees || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Printable Receipt Modal */}
      {selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          student={studentData}
          admission={admission}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {/* Top Portal Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
              E
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white">Student Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-extrabold uppercase">
                  {studentData?.studentId || "Student"}
                </span>
              </div>
              <p className="text-xs text-slate-400">Welcome, {studentData?.fullName || user?.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/")}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Main Website
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-xl transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Portal Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-800 text-red-300 rounded-2xl text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Enrolled Course</span>
              <span className="text-sm font-bold text-white block truncate max-w-[160px]">
                {admission?.courseNameSnapshot || course?.name || "General Course"}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Final Course Fees</span>
              <span className="text-lg font-extrabold text-white">
                ₹{finalFees.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Paid</span>
              <span className="text-lg font-extrabold text-emerald-400">
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              pendingFees > 0 ? "bg-amber-600/20 text-amber-400" : "bg-emerald-600/20 text-emerald-400"
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Pending Balance</span>
              <span className={`text-lg font-extrabold ${pendingFees > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                ₹{pendingFees.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID: PROFILE & ADMISSION INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PROFILE CARD */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                {studentData?.fullName?.[0] || "S"}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{studentData?.fullName}</h3>
                <span className="text-xs text-slate-400">Student ID: {studentData?.studentId}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-3 text-slate-300">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{studentData?.mobile}</span>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">{studentData?.email || "No email provided"}</span>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <User className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Gender: {studentData?.gender || "Male"}</span>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{studentData?.address || "Address not specified"}</span>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Joined Date: {studentData?.joinedDate ? new Date(studentData.joinedDate).toLocaleDateString("en-IN") : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* ADMISSION DETAILS CARD */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Course Admission Details</h3>
                  <p className="text-xs text-slate-400">Official Enrolled Academic Record</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                admission?.status === "ACTIVE"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-slate-800 text-slate-300"
              }`}>
                {admission?.status || "ACTIVE"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Primary Course Admission</span>
                <span className="text-sm font-bold text-white block">
                  {admission?.courseNameSnapshot || course?.name || "General Course"} ({admission?.admissionNumber || "N/A"})
                </span>
                <span className="text-slate-400 block">Date: {admission?.admissionDate ? new Date(admission.admissionDate).toLocaleDateString("en-IN") : "N/A"}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Fee Structure Breakdown</span>
                <div className="flex justify-between text-slate-300">
                  <span>Base Fees:</span>
                  <span className="font-semibold">₹{Number(admission?.courseFees || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Allowed:</span>
                  <span className="font-semibold">- ₹{Number(admission?.discount || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white text-xs">
                  <span>Net Final Fees:</span>
                  <span>₹{finalFees.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* MULTIPLE ENROLLED COURSES LIST */}
            {studentData?.allAdmissions && studentData.allAdmissions.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  My Enrolled Courses ({studentData.allAdmissions.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {studentData.allAdmissions.map((adm) => (
                    <div key={adm.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span className="truncate pr-2">{adm.courseNameSnapshot || adm.course?.name}</span>
                        <span className="text-cyan-400 font-mono text-[10px] bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded-full shrink-0">
                          {adm.admissionNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                        <span>Fee: ₹{Number(adm.finalFees || adm.courseFees).toLocaleString("en-IN")}</span>
                        <span className="text-amber-400 font-semibold">Pending: ₹{Number(adm.pendingAmount).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FEE RECEIPTS & PAYMENTS LEDGER TABLE WITH VIEW MODE TOGGLE */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Fee Payment Receipts Ledger</h3>
                <p className="text-xs text-slate-400">History of payments & digital receipts</p>
              </div>
            </div>

            {/* Grid vs List View Toggle */}
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

          {payments.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No fee payments recorded yet.
            </div>
          ) : viewMode === "table" ? (
            /* LIST / TABLE VIEW */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Receipt / Txn Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {formatDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-blue-950 text-blue-300 rounded-md font-bold uppercase text-[10px]">
                          {p.paymentMode || "CASH"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm">
                        ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{p.remarks || "Fee payment"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {payments.map((p) => (
                <div key={p.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-950 text-blue-300 rounded font-bold uppercase text-[10px]">
                      {p.paymentMode || "CASH"}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-slate-900">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Date Paid</span>
                      <span className="text-xs text-slate-300 font-semibold">
                        {new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Amount</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPayment(p)}
                    className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print Receipt</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ATTENDANCE LOG & PERFORMANCE HISTORY */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Attendance Log & History</h3>
                <p className="text-xs text-slate-400">Classroom attendance record & presence percentage</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Attendance Rate:</span>
              <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-black text-xs">
                {studentData?.attendanceStats?.attendancePercentage || 100}%
              </span>
            </div>
          </div>

          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Total Conducted Sessions</span>
              <span className="text-xl font-extrabold text-white">
                {studentData?.attendanceStats?.totalClasses || 0} Days
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-emerald-500 uppercase font-bold text-[10px] block">Present Sessions</span>
              <span className="text-xl font-extrabold text-emerald-400">
                {studentData?.attendanceStats?.presentCount || 0} Days
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-rose-500 uppercase font-bold text-[10px] block">Absent Sessions</span>
              <span className="text-xl font-extrabold text-rose-400">
                {studentData?.attendanceStats?.absentCount || 0} Days
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-cyan-500 uppercase font-bold text-[10px] block">Presence Score</span>
              <span className="text-xl font-extrabold text-cyan-400">
                {studentData?.attendanceStats?.attendancePercentage || 100}%
              </span>
            </div>
          </div>

          {/* Attendance Logs Table */}
          {(!studentData?.attendanceStats?.recentLogs || studentData.attendanceStats.recentLogs.length === 0) ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No daily attendance records marked yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {studentData.attendanceStats.recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {formatDate(log.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                          log.status === "PRESENT"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : log.status === "LATE"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">
                        {log.remarks || "Regular session marked by instructor"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* QUICK COURSE INQUIRY HELPDESK */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">Course Inquiry & Helpdesk</h3>
              <p className="text-xs text-slate-400">Want to enroll in additional courses or request information?</p>
            </div>
          </div>

          {inqMsg && (
            <div className="p-3 bg-blue-950/80 border border-blue-800 text-blue-300 rounded-xl text-xs">
              {inqMsg}
            </div>
          )}

          <form onSubmit={handleStudentInquiry} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Course</label>
              <select
                value={inqCourseId}
                onChange={(e) => setInqCourseId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none transition"
              >
                <option value="">Select Interested Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (₹{Number(c.fees).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Message / Note</label>
              <input
                type="text"
                value={inqRemarks}
                onChange={(e) => setInqRemarks(e.target.value)}
                placeholder="Ask a question or select batch..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Student Inquiry</span>
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
};
