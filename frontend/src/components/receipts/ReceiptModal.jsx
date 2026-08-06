import React from "react";
import { X, Printer, CheckCircle2, ShieldCheck } from "lucide-react";

export const ReceiptModal = ({ payment, student, admission, onClose }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.paymentDate || payment.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
              <p className="text-sm font-semibold text-slate-800">{formattedDate}</p>
            </div>
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Paid</span>
            </div>
          </div>

          {/* Student & Admission Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-medium border border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5">Student Name</span>
              <span className="text-slate-900 font-bold text-sm block">{student?.fullName || "Student"}</span>
              <span className="text-slate-500">ID: {student?.studentId || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Course / Batch</span>
              <span className="text-slate-900 font-bold text-sm block">
                {admission?.courseNameSnapshot || admission?.course?.name || "Enrolled Course"}
              </span>
              <span className="text-slate-500">Adm No: {admission?.admissionNumber || "N/A"}</span>
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-center">Payment Mode</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">Tuition Fee Installment</span>
                    {payment.remarks && <p className="text-[11px] text-slate-500">{payment.remarks}</p>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold uppercase text-[10px]">
                      {payment.paymentMode || "CASH"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-sm text-slate-900">
                    ₹{Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fees Balance Summary */}
          {admission && (
            <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Course Fees:</span>
                <span className="font-semibold text-slate-900">
                  ₹{Number(admission.finalFees || admission.courseFees).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Amount Paid:</span>
                <span className="font-bold">
                  ₹{Number(admission.paidAmount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200 text-slate-900 font-bold text-sm">
                <span>Remaining Pending Balance:</span>
                <span className={Number(admission.pendingAmount) > 0 ? "text-amber-600" : "text-emerald-600"}>
                  ₹{Number(admission.pendingAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {/* Stamp / Verification footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Computer Generated Official Digital Receipt</span>
            </div>
            <span>EduMaster Management System</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end space-x-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-2 shadow-md transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
