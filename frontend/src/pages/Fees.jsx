import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { ReceiptModal } from "../components/receipts/ReceiptModal";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Receipt,
  PlusCircle,
  Printer,
  TrendingUp,
  PieChart,
} from "lucide-react";

export const Fees = () => {
  const [students, setStudents] = useState([]);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [transactionReference, setTransactionReference] = useState("");
  const [remarks, setRemarks] = useState("");

  const selectedStudentObj = students.find(
    (s) => s.id === selectedStudentId || s.studentId === selectedStudentId
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentsRes, historyRes] = await Promise.all([
        api.get("/students?limit=100"),
        api.get("/fees?limit=50"),
      ]);

      setStudents(studentsRes.data?.data?.students || []);
      setFeeHistory(historyRes.data?.data?.payments || []);
    } catch (err) {
      console.error("Fee data fetch error:", err);
      setError("Failed to load fee configuration data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentId || !amount || Number(amount) <= 0) {
      setError("Please select a student and enter a valid payment amount.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/fees/collect", {
        studentId: selectedStudentId,
        amount: Number(amount),
        paymentMode,
        transactionReference,
        remarks,
      });

      const payment = response.data?.data?.payment;
      setSelectedReceiptPayment(payment);

      // Reset form & reload list
      setAmount("");
      setTransactionReference("");
      setRemarks("");
      setSelectedStudentId("");
      fetchInitialData();
    } catch (err) {
      console.error("Fee collection error:", err);
      setError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate analytics
  const totalExpected = students.reduce(
    (acc, s) => acc + Number(s.admission?.finalFees || s.admission?.courseFees || 0),
    0
  );
  const totalCollected = students.reduce(
    (acc, s) => acc + Number(s.admission?.paidAmount || 0),
    0
  );
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const efficiencyRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Printable Receipt Modal */}
      {selectedReceiptPayment && (
        <ReceiptModal
          payment={selectedReceiptPayment}
          student={students.find((s) => s.admission?.id === selectedReceiptPayment.admissionId)}
          admission={selectedReceiptPayment.admission}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Fees & Financial Revenue Analytics</h1>
        <p className="text-xs text-slate-400">Collect tuition payments, view financial efficiency, and print receipts.</p>
      </div>

      {/* REVENUE ANALYTICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Expected Revenue</span>
          <span className="text-xl font-extrabold text-white">₹{totalExpected.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Total Collected</span>
          <span className="text-xl font-extrabold text-emerald-400">₹{totalCollected.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Pending Balance</span>
          <span className="text-xl font-extrabold text-amber-400">₹{totalPending.toLocaleString("en-IN")}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Collection Efficiency</span>
          <span className="text-xl font-extrabold text-cyan-400">{efficiencyRate}%</span>
        </div>
      </div>

      {/* TWO COLUMN GRID: COLLECT FEE FORM & HISTORY TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLLECT FEE FORM */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Collect Student Fee</h3>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCollectFee} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Student *</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="">Select Enrolled Student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentId}) - Pending: ₹{Number(s.admission?.pendingAmount || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            {selectedStudentObj && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Course:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedStudentObj.admission?.courseNameSnapshot || selectedStudentObj.admission?.course?.name}
                  </span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Current Pending Fees:</span>
                  <span>₹{Number(selectedStudentObj.admission?.pendingAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount paid"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / GPAY</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Txn Ref / Receipt No</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Optional reference"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Remarks / Installment Note</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Installment payment note..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{submitting ? "Processing..." : "Record Payment & Print Receipt"}</span>
            </button>
          </form>
        </div>

        {/* FEE HISTORY TABLE */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Recent Fee Payment Receipts</h3>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500">Loading fee history...</div>
          ) : feeHistory.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500">No payment receipts recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Receipt / Ref</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {feeHistory.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {p.admission?.student?.fullName || "Student"}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded font-bold uppercase text-[10px]">
                          {p.paymentMode || "CASH"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-400 text-sm">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedReceiptPayment(p)}
                          className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
