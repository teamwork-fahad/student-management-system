import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { formatDate } from "../../utils/formatters";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Edit,
  Trash2,
} from "lucide-react";

export const PartyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartyDetails();
  }, [id]);

  const fetchPartyDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/expenses/parties/${id}`);
      setData(res.data?.data || null);
    } catch (err) {
      console.error("Fetch party details error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-500">Loading party information...</div>;
  }

  if (!data || !data.party) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Party not found.</p>
        <Link to="/dashboard/finance/parties" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-block">
          Back to Parties
        </Link>
      </div>
    );
  }

  const { party, summary, expenses, recurringExpenses, recurringInstances } = data;

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Back button & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/dashboard/finance/parties")}
          className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-200 transition border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{party.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              party.status === "ACTIVE"
                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
            }`}>
              {party.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Party financial breakdown & transaction history.</p>
        </div>
      </div>

      {/* PARTY CONTACT HEADER CARD */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Contact Person</span>
            <p className="font-bold text-slate-900 dark:text-white">{party.contactPerson || "Not specified"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Phone / Mobile</span>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{party.mobile || "N/A"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email Address</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{party.email || "N/A"}</p>
          </div>
        </div>

        {party.address && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{party.address}</span>
          </div>
        )}
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase block mb-1">Total Expenses</span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            ₹{Number(summary.totalExpenses || 0).toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Total Paid</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{Number(summary.totalPaid || 0).toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase block mb-1">Pending Dues</span>
          <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            ₹{Number(summary.totalPending || 0).toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">Total Transactions</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {summary.totalTransactions || 0} Records
          </h3>
        </div>
      </div>

      {/* TRANSACTION HISTORY TABLE */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Complete Expense History
        </h3>

        {expenses.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">No expense records found for this party.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {exp.expenseNumber || `EXP-${exp.id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">{formatDate(exp.expenseDate)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{exp.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold">
                        {exp.category?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[10px] uppercase whitespace-nowrap">{exp.paymentMode}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">{exp.referenceNumber || "N/A"}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
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

export default PartyDetails;
