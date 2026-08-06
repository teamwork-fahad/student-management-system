import React from "react";
import { X, Printer, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export const ReceiptModal = ({ payment, student, admission, onClose }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = formatDate(payment.paymentDate || payment.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:w-full">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 print:bg-blue-800 print:text-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-xl text-white">
                E
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">EduMaster Academy</h2>
                <p className="text-xs text-blue-200 font-medium">Official Fee Payment Receipt</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content Body */}
        <div className="p-6 space-y-6 text-slate-800">
          {/* Status Badge & Receipt No */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Receipt No</span>
              <p className="font-mono text-sm font-bold text-slate-900">
                {payment.transactionReference || `REC-${payment.id.slice(-6).toUpperCase()}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date</span>
              <p className="font-mono text-sm font-bold text-slate-900">{formattedDate}</p>
            </div>
          </div>

          {/* Student & Course Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Student Name</span>
              <p className="font-bold text-slate-900 text-sm">{student?.fullName || admission?.student?.fullName || "Student Name"}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Student ID</span>
              <p className="font-mono font-bold text-slate-900">{student?.studentId || "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Course Name</span>
              <p className="font-semibold text-slate-800">{admission?.courseNameSnapshot || "Course"}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Payment Mode</span>
              <p className="font-bold text-blue-700 uppercase">{payment.paymentMode || "CASH"}</p>
            </div>
          </div>

          {/* Payment Breakdown Box */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Amount Paid Today</span>
              <span className="text-3xl font-black text-emerald-700">₹{Number(payment.amount).toLocaleString("en-IN")}</span>
            </div>
            <div className="px-3 py-1 bg-emerald-600 text-white rounded-full font-bold text-xs flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>PAID & VERIFIED</span>
            </div>
          </div>

          {payment.remarks && (
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <strong className="text-slate-700">Remarks:</strong> {payment.remarks}
            </div>
          )}

          {/* Footer Signature Box */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="font-medium text-slate-500">Authorized Signature</p>
              <p className="text-[10px] mt-0.5">EduMaster Accounts Office</p>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
