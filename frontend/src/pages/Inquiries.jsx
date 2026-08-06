import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  UserCheck,
  CheckCircle,
  Clock,
  ChevronRight,
  X,
  Send,
} from "lucide-react";
import api from "../api/axios";

export const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [followUpHistory, setFollowUpHistory] = useState([]);

  useEffect(() => {
    fetchInquiries();
  }, [search, statusFilter]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/inquiries", { params });
      setInquiries(res.data.data?.inquiries || []);
    } catch (err) {
      console.error("Failed to fetch inquiries", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFollowUp = async (inq) => {
    setSelectedInquiry(inq);
    setIsFollowUpOpen(true);
    setFollowUpRemarks("");
    try {
      const res = await api.get(`/inquiries/${inq.id}/follow-ups`);
      setFollowUpHistory(res.data.data || []);
    } catch {
      setFollowUpHistory([]);
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpRemarks) return;

    try {
      await api.post(`/inquiries/${selectedInquiry.id}/follow-up`, {
        remarks: followUpRemarks,
        nextFollowUpDate: nextDate || new Date(Date.now() + 3 * 86400000).toISOString(),
      });
      setIsFollowUpOpen(false);
      fetchInquiries();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add follow-up");
    }
  };

  const handleConvertInquiry = async (inqId) => {
    if (!window.confirm("Convert this inquiry into an active Admission?")) return;
    try {
      await api.post(`/inquiries/${inqId}/convert`);
      fetchInquiries();
      alert("Inquiry successfully marked as Admission Done!");
    } catch (err) {
      alert(err.response?.data?.message || "Conversion failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inquiries & Leads Management</h1>
          <p className="text-xs text-slate-400">Track prospective student inquiries, follow-ups, and admissions conversion.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, phone, email, or inquiry number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="FOLLOW_UP">FOLLOW_UP</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="ADMISSION_DONE">ADMISSION_DONE</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No inquiries found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Inquiry No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Course Interested</th>
                  <th className="py-3.5 px-4">Lead Source</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {inq.inquiryNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {inq.fullName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{inq.mobile}</div>
                      {inq.email && <div className="text-[10px] text-slate-400">{inq.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {inq.course?.name || "General Course"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium text-[10px]">
                        {inq.leadSource?.name || "Direct"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        inq.status === "ADMISSION_DONE"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : (inq.status === "INTERESTED"
                            ? "bg-blue-950 text-blue-300 border border-blue-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800")
                      }`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenFollowUp(inq)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition"
                      >
                        Follow Up
                      </button>
                      {inq.status !== "ADMISSION_DONE" && (
                        <button
                          onClick={() => handleConvertInquiry(inq.id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[11px] font-semibold transition"
                        >
                          Convert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Follow Up Modal */}
      {isFollowUpOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Inquiry Follow-up</h3>
                <p className="text-xs text-slate-400">{selectedInquiry.fullName} ({selectedInquiry.inquiryNumber})</p>
              </div>
              <button onClick={() => setIsFollowUpOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Follow up history */}
            <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
              <span className="font-semibold text-slate-400 uppercase text-[10px] block">History Notes</span>
              {followUpHistory.length === 0 ? (
                <p className="text-slate-500 italic">No previous follow-up notes.</p>
              ) : (
                followUpHistory.map((h, i) => (
                  <div key={i} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <p className="text-slate-200 font-medium">{h.remarks}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      By {h.createdBy?.name || "Staff"} on {new Date(h.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddFollowUp} className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Add Follow-up Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  placeholder="Enter notes from phone call or meeting..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFollowUpOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-500 shadow-md"
                >
                  Save Follow-up Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
