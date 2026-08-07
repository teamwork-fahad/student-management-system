import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
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
  ExternalLink,
} from "lucide-react";


export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [statsRes, admissionsRes] = await Promise.all([
        api.get("/admissions/statistics"),
        api.get("/admissions?limit=10&sortBy=newest"),
      ]);

      setStats(statsRes.data?.data || null);
      setRecentAdmissions(admissionsRes.data?.data?.admissions || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Unable to connect to backend server. Please verify backend server is running and accessible."
      );
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

      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <span>⚠️ {errorMsg}</span>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px]"
          >
            Retry Connection
          </button>
        </div>
      )}

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
                {recentAdmissions.map((adm) => {
                  const targetStudentId = adm.student?.id || adm.studentId || adm.id;
                  const profileUrl = `/dashboard/students/${targetStudentId}`;

                  return (
                    <tr
                      key={adm.id}
                      onClick={() => window.open(profileUrl, "_blank")}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      title="Click to view full student profile in new tab"
                    >
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center space-x-1"
                        >
                          <span>{adm.admissionNumber}</span>
                        </a>
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-cyan-400 hover:underline transition inline-flex items-center space-x-1"
                        >
                          <span>{adm.student?.fullName || "N/A"}</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400/80 inline" />
                        </a>
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
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
                          title="Open Full Student Profile Page in new tab"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile ↗</span>
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
    </div>
  );
};
