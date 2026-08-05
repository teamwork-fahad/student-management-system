import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  Users,
  UserCheck,
  CircleDollarSign,
  Clock,
  UserPlus,
  CreditCard,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, admissionsRes] = await Promise.all([
        api.get("/admissions/statistics"),
        api.get("/admissions?limit=5&sortBy=newest"),
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
    <div className="space-y-6">
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
              to="/admissions"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950 transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admit New Student</span>
            </Link>
            <Link
              to="/fees"
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

        {/* Today's Admissions */}
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
            <p className="text-xs text-slate-400">Latest student registrations and onboarding logs</p>
          </div>
          <Link
            to="/students"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All Students</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentAdmissions.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No admissions created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Pending Amount</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-cyan-400 text-xs font-semibold">
                      {adm.admissionNumber}
                    </td>
                    <td className="p-3 font-semibold text-slate-100">
                      {adm.student?.fullName || "N/A"}
                    </td>
                    <td className="p-3 text-slate-300">{adm.courseNameSnapshot}</td>
                    <td className="p-3 font-medium text-emerald-400">
                      {formatCurrency(adm.paidAmount)}
                    </td>
                    <td className="p-3 font-medium text-amber-400">
                      {formatCurrency(adm.pendingAmount)}
                    </td>
                    <td className="p-3 text-xs text-slate-400">
                      {new Date(adm.admissionDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
