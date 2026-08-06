import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import { formatDate } from "../utils/formatters";
import {
  Users,
  UserCheck,
  CircleDollarSign,
  Clock,
  UserPlus,
  CreditCard,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Calendar,
  Eye,
} from "lucide-react";

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, admissionsRes] = await Promise.all([
        api.get("/admissions/statistics"),
        api.get("/admissions?limit=10&sortBy=newest"),
      ]);

      setStats(statsRes.data?.data || null);
      setRecentAdmissions(admissionsRes.data?.data?.admissions || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return <LoadingSpinner label="Loading ERP Dashboard metrics..." />;
  }

  const financial = stats?.financialSummary || {};

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Institute Admin Overview
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time student onboarding, fee collections, and enrollment metrics.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/admissions"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950 transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admit New Student</span>
            </Link>
            <Link
              to="/dashboard/fees"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center space-x-2"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Record Fee</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Students
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {stats?.totalAdmissions || 0}
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Active Enrolled
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-cyan-950 border border-cyan-800/40 text-cyan-400">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* Active Admissions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Admissions
            </p>
            <h3 className="text-3xl font-black text-cyan-400 mt-1">
              {stats?.statusBreakdown?.ACTIVE || 0}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Verified Enrollments
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-950 border border-blue-800/40 text-blue-400">
            <UserCheck className="w-7 h-7" />
          </div>
        </div>

        {/* Total Fees Collected */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Fees Collected
            </p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(financial?.totalPaidAmount)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Realized Revenue
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-950 border border-emerald-800/40 text-emerald-400">
            <CircleDollarSign className="w-7 h-7" />
          </div>
        </div>

        {/* Pending Fees */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Fees
            </p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              {formatCurrency(financial?.totalPendingAmount)}
            </h3>
            <p className="text-[11px] text-amber-400/80 font-medium mt-1">
              Outstanding Dues
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-950 border border-amber-800/40 text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Recent Admissions Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Recent Student Admissions</h3>
            <p className="text-xs text-slate-400">Click on any student row to view complete profile and fee structure.</p>
          </div>
          <Link
            to="/dashboard/students"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentAdmissions.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No admissions created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Admission No</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Course</th>
                  <th className="p-3.5 text-right">Paid Amount</th>
                  <th className="p-3.5 text-right">Pending Amount</th>
                  <th className="p-3.5 text-center">Admission Date</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentAdmissions.map((adm) => (
                  <tr
                    key={adm.id}
                    onClick={() => setSelectedStudent(adm.student || { fullName: adm.studentName, admission: adm })}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">
                      {adm.admissionNumber}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {adm.student?.fullName || "N/A"}
                    </td>
                    <td className="p-3.5 text-slate-300">{adm.courseNameSnapshot}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-400">
                      {formatCurrency(adm.paidAmount)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-amber-400">
                      {formatCurrency(adm.pendingAmount)}
                    </td>
                    <td className="p-3.5 text-center text-slate-400 font-mono">
                      {formatDate(adm.admissionDate)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(adm.student || { fullName: adm.studentName, admission: adm });
                        }}
                        className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Info</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT PROFILE POPUP MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title="Student Information Overview"
        >
          <div className="space-y-6 text-sm text-slate-200">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="p-3.5 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedStudent.fullName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-cyan-400 font-bold">
                    {selectedStudent.studentId || selectedStudent.admission?.admissionNumber || "STU-NEW"}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-emerald-400 font-bold">
                    Status: {selectedStudent.status || selectedStudent.admission?.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Mobile Contact</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> {selectedStudent.mobile || selectedStudent.admission?.guardianMobile || "N/A"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Email Address</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> {selectedStudent.email || "N/A"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Address</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {selectedStudent.address || "N/A"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Admission Date</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  {formatDate(selectedStudent.joinedDate || selectedStudent.admission?.admissionDate)}
                </p>
              </div>
            </div>

            {selectedStudent.admission && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Admission & Fee Details
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Enrolled Course</span>
                    <span className="font-bold text-white">
                      {selectedStudent.admission.courseNameSnapshot || selectedStudent.admission.course?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Admission Number</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {selectedStudent.admission.admissionNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Course Fee</span>
                    <span className="font-bold text-slate-200">
                      ₹{Number(selectedStudent.admission.finalFees || selectedStudent.admission.courseFees).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pending Balance</span>
                    <span className="font-bold text-amber-400">
                      ₹{Number(selectedStudent.admission.pendingAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
