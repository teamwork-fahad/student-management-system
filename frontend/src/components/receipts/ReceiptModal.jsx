import React, { useState } from "react";
import { X, Printer, Download, CheckCircle2, ShieldCheck, CreditCard, Calendar, Receipt, FileText } from "lucide-react";
import { formatDate } from "../../utils/formatters";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const ReceiptModal = ({ payment, student, admission, onClose }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!payment) return null;

  const currentAdm = admission || payment.admission || student?.admission;
  const pastPayments = currentAdm?.payments || student?.allPayments || [];

  const totalCourseFee = Number(currentAdm?.finalFees || currentAdm?.courseFees || 0);
  const totalPaidToDate = Number(currentAdm?.paidAmount || payment.amount || 0);
  const pendingBalance = Math.max(0, totalCourseFee - totalPaidToDate);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const studentName = student?.fullName || currentAdm?.student?.fullName || payment.studentName || "Student";
      const studentId = student?.studentId || currentAdm?.admissionNumber || "N/A";
      const courseName = currentAdm?.courseNameSnapshot || currentAdm?.course?.name || "General Course";
      const receiptRef = payment.transactionReference || `REC-${payment.id?.slice(-6).toUpperCase()}`;
      const paymentDateStr = formatDate(payment.paymentDate || payment.createdAt);
      const paymentModeStr = (payment.paymentMode || "CASH").toUpperCase();

      // 1. Deep Blue Header Banner
      doc.setFillColor(30, 58, 138); // #1e3a8a
      doc.rect(0, 0, 210, 32, "F");

      // Title & Subtitle
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("EduMaster Academy", 14, 16);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Official Fee Payment Receipt", 14, 23);

      // Receipt Ref & Date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Receipt No: ${receiptRef}`, 196, 16, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${paymentDateStr}`, 196, 23, { align: "right" });

      // 2. Student & Course Info Grid Table
      autoTable(doc, {
        startY: 38,
        head: [["Student Name", "Student ID / Adm No", "Enrolled Course", "Payment Mode"]],
        body: [[studentName, studentId, courseName, paymentModeStr]],
        theme: "plain",
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { textColor: [15, 23, 42], fontSize: 10, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
      });

      let currentY = doc.lastAutoTable.finalY + 8;

      // 3. Amount Paid Box (Green Box)
      doc.setFillColor(236, 253, 245); // Emerald-50
      doc.setDrawColor(167, 243, 208); // Emerald-200
      doc.roundedRect(14, currentY, 182, 22, 3, 3, "FD");

      doc.setTextColor(6, 95, 70);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("AMOUNT PAID IN THIS RECEIPT", 20, currentY + 8);

      doc.setFontSize(18);
      doc.text(`Rs. ${Number(payment.amount).toLocaleString("en-IN")}`, 20, currentY + 17);

      doc.setFillColor(5, 150, 105); // Emerald-600
      doc.roundedRect(145, currentY + 6, 45, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("PAID & VERIFIED", 167.5, currentY + 12.5, { align: "center" });

      currentY += 30;

      // 4. Financial Ledger Summary Table
      autoTable(doc, {
        startY: currentY,
        head: [["Total Course Fee", "Total Paid to Date", "Remaining Pending Dues"]],
        body: [[`Rs. ${totalCourseFee.toLocaleString("en-IN")}`, `Rs. ${totalPaidToDate.toLocaleString("en-IN")}`, `Rs. ${pendingBalance.toLocaleString("en-IN")}`]],
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 10, fontStyle: "bold", textColor: [15, 23, 42] },
        columnStyles: {
          0: { textColor: [15, 23, 42] },
          1: { textColor: [5, 150, 105] },
          2: { textColor: [217, 119, 6] },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = doc.lastAutoTable.finalY + 8;

      // 5. Payment Receipts History for this Course
      if (pastPayments && pastPayments.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("Payment Receipts History for this Course", 14, currentY);
        currentY += 4;

        const historyRows = pastPayments.slice(0, 6).map((p) => [
          p.transactionReference || `REC-${p.id?.slice(-6).toUpperCase()}`,
          formatDate(p.paymentDate || p.createdAt),
          (p.paymentMode || "CASH").toUpperCase(),
          `Rs. ${Number(p.amount).toLocaleString("en-IN")}`,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["Receipt / Ref", "Date", "Mode", "Amount Paid"]],
          body: historyRows,
          theme: "striped",
          headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: "bold", fontSize: 8 },
          bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
          margin: { left: 14, right: 14 },
        });

        currentY = doc.lastAutoTable.finalY + 8;
      }

      // 6. Remarks if present
      if (payment.remarks) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`Remarks: ${payment.remarks}`, 14, currentY);
      }

      // 7. Footer / Authorized Signature
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 270, 196, 270);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Authorized Signature", 14, 276);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("EduMaster Accounts Office - Computer Generated Document", 14, 281);

      // Save PDF file
      const sanitizeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`Fee_Receipt_${receiptRef}_${sanitizeName}.pdf`);
    } catch (err) {
      console.error("Native PDF Error:", err);
      alert("Failed to generate PDF. Triggering print...");
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };



  const formattedDate = formatDate(payment.paymentDate || payment.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto font-sans print:p-0 print:bg-white print:static">
      {/* CSS @media print rules to print clean receipt without blank page */}
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            visibility: hidden !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          #printable-receipt-card {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          #printable-receipt-card * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>


      <div
        id="printable-receipt-card"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800 my-6"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 print:bg-blue-800">
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
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition no-print"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content Body */}
        <div className="p-6 space-y-5">
          {/* Status & Receipt Number */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Receipt No</span>
              <p className="font-mono text-sm font-bold text-slate-900">
                {payment.transactionReference || `REC-${payment.id?.slice(-6).toUpperCase()}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Date</span>
              <p className="font-mono text-sm font-bold text-slate-900">{formattedDate}</p>
            </div>
          </div>

          {/* Student & Course Info Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Student Name</span>
              <p className="font-bold text-slate-900 text-sm">
                {student?.fullName || currentAdm?.student?.fullName || payment.studentName || "Student"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Student ID</span>
              <p className="font-mono font-bold text-slate-900">
                {student?.studentId || currentAdm?.admissionNumber || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Enrolled Course</span>
              <p className="font-semibold text-slate-800">
                {currentAdm?.courseNameSnapshot || currentAdm?.course?.name || "General Course"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Payment Mode</span>
              <p className="font-bold text-blue-700 uppercase">{payment.paymentMode || "CASH"}</p>
            </div>
          </div>

          {/* Current Payment Amount Box */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Amount Paid in this Receipt</span>
              <span className="text-3xl font-black text-emerald-700">₹{Number(payment.amount).toLocaleString("en-IN")}</span>
            </div>
            <div className="px-3 py-1 bg-emerald-600 text-white rounded-full font-bold text-xs flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>PAID & VERIFIED</span>
            </div>
          </div>

          {/* FINANCIAL LEDGER SUMMARY: TOTAL COURSE FEE, TOTAL PAID, PENDING DUES */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Course Fee</span>
              <span className="text-base font-extrabold text-white">
                ₹{totalCourseFee.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-emerald-400 text-[10px] uppercase font-bold block">Total Paid to Date</span>
              <span className="text-base font-extrabold text-emerald-400">
                ₹{totalPaidToDate.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-amber-400 text-[10px] uppercase font-bold block">Remaining Pending</span>
              <span className="text-base font-extrabold text-amber-400">
                ₹{pendingBalance.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* PAST PAYMENTS HISTORY FOR THIS COURSE */}
          {pastPayments.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-blue-600" /> Payment Receipts History for this Course
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Receipt / Ref</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                    {pastPayments.slice(0, 5).map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">
                          {p.transactionReference || `REC-${p.id?.slice(-6).toUpperCase() || idx}`}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {formatDate(p.paymentDate || p.createdAt)}
                        </td>
                        <td className="py-2 px-3 uppercase font-semibold">
                          {p.paymentMode || "CASH"}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-emerald-600">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {payment.remarks && (
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <strong className="text-slate-800">Remarks:</strong> {payment.remarks}
            </div>
          )}

          {/* Footer Signature Box & Action Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-800">Authorized Signature</p>
              <p className="text-[10px] text-slate-400">EduMaster Accounts Office</p>
            </div>

            <div className="flex items-center space-x-2 no-print">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>

              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handleDownloadPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg flex items-center space-x-1.5 transition disabled:opacity-50"
                title="Download high quality PDF file directly"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? "Generating PDF..." : "Download PDF Receipt"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg flex items-center space-x-1.5 transition"
                title="Print clean receipt using browser print"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
