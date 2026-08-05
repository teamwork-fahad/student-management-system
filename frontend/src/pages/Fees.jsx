import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Receipt,
  RefreshCw,
  PlusCircle,
} from "lucide-react";

export const Fees = () => {
  const [students, setStudents] = useState([]);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [transactionReference, setTransactionReference] = useState("");
  const [remarks, setRemarks] = useState("");

  // Derived selected student summary
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
        api.get("/students?limit=50"),
        api.get("/fees?limit=15"),
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

    if (!selectedStudentId) {
      setError("Please select a student to collect fee payment.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        studentId: selectedStudentObj?.studentId || selectedStudentId,
        amount: Number(amount),
        paymentMode,
        transactionReference: transactionReference || undefined,
        remarks: remarks || "Fee Installment Collection",
      };

      const response = await api.post("/fees", payload);
      const result = response.data?.data;

      setSuccessReceipt(result);
      fetchInitialData(); // Refresh history and balances

      // Reset form
      setSelectedStudentId("");
      setAmount("");
      setPaymentMode("CASH");
      setTransactionReference("");
      setRemarks("");
    } catch (err) {
      console.error("Collect fee error:", err);
      setError(err.response?.data?.message || "Failed to record fee payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return <LoadingSpinner label="Loading fee collection module..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            Fee Collection & Payment Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Record installment payments, issue receipts, and view real-time student payment logs.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Fee Collection Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Collect Fee Payment
        </h3>

        <form onSubmit={handleCollectFee} className="space-y-5">
          {/* Student Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Enrolled Student <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.studentId} - {st.fullName} ({st.admission?.courseNameSnapshot})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Student Balance Badge */}
            {selectedStudentObj && selectedStudentObj.admission && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Pending Dues:</span>
                  <span className="text-lg font-black text-amber-400">
                    {formatCurrency(selectedStudentObj.admission.pendingAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium">Already Paid:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(selectedStudentObj.admission.paidAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Amount (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                min="1"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Mode <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reference / UTR
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. UPI/123456789"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Month 2 installment"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Recording Fee...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Save Fee Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Fee History Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100">Recent Fee Payment History</h3>

        {feeHistory.length === 0 ? (
          <EmptyState
            title="No Fee Payments Recorded"
            description="Fee payments collected will appear here in chronological order."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Payment Date</th>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Reference / Receipt</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {feeHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-xs text-slate-400">
                      {new Date(item.paymentDate || item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-mono text-xs font-bold text-cyan-400">
                      {item.admission?.student?.studentId || "N/A"}
                    </td>
                    <td className="p-3.5 font-bold text-slate-100">
                      {item.admission?.student?.fullName || "N/A"}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.paymentMode}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-300">
                      {item.transactionReference || "N/A"}
                    </td>
                    <td className="p-3.5 text-xs text-slate-400">{item.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fee Success Modal */}
      <Modal
        isOpen={!!successReceipt}
        onClose={() => setSuccessReceipt(null)}
        title="🧾 Fee Payment Receipt Issued"
      >
        {successReceipt && (
          <div className="space-y-4 text-slate-200">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center space-x-3 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold text-sm">Fee Collection Recorded Successfully!</p>
                <p className="text-xs text-emerald-400/80">
                  Receipt generated and admission balance updated.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {successReceipt.payment?.receiptNumber || successReceipt.payment?.transactionReference || "REC-2026-OK"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Paid Amount:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatCurrency(successReceipt.payment?.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-bold text-white">{successReceipt.payment?.paymentMode}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Remaining Dues:</span>
                <span className="font-bold text-amber-400">
                  {formatCurrency(successReceipt.admission?.pendingAmount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSuccessReceipt(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
