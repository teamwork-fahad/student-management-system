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
  LayoutGrid,
  List,
  AlertTriangle,
} from "lucide-react";
import api from "../api/axios";
import { SearchableSelect } from "../components/common/SearchableSelect";

export const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [inqDeptId, setInqDeptId] = useState("");
  const [leadSources, setLeadSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState("table");

  // Follow-up modal states
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [followUpHistory, setFollowUpHistory] = useState([]);

  // Add New Inquiry Modal states
  const [isAddInquiryOpen, setIsAddInquiryOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addMobile, setAddMobile] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addCourseId, setAddCourseId] = useState("");
  const [addLeadSourceId, setAddLeadSourceId] = useState("");
  const [addRemarks, setAddRemarks] = useState("");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  useEffect(() => {
    fetchInquiries();
    fetchDropdowns();
  }, [search, statusFilter]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/inquiries", { params });
      const list = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.inquiries || [];
      setInquiries(list);
    } catch (err) {
      console.error("Failed to fetch inquiries", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchDropdowns = async () => {
    try {
      const [cRes, lRes, dRes] = await Promise.all([
        api.get("/courses"),
        api.get("/inquiries/lead-sources"),
        api.get("/departments"),
      ]);
      setCourses(cRes.data.data?.courses || cRes.data.data || []);
      setLeadSources(lRes.data.data || []);
      setDepartments(dRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch dropdown options", err);
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
    if (!window.confirm("Convert this inquiry into an active Admission? (Requires Admin Authorization)")) return;
    try {
      await api.post(`/inquiries/${inqId}/convert`);
      fetchInquiries();
      alert("Inquiry marked as Admission Done! Admin can now assign student details.");
    } catch (err) {
      alert(err.response?.data?.message || "Conversion failed");
    }
  };

  const handleAddInquirySubmit = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    if (!addName || !addMobile) {
      setAddError("Student name and mobile number are required");
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const defaultCourse = courses[0]?.id;
      const defaultLeadSource = leadSources[0]?.id;

      await api.post("/inquiries", {
        fullName: addName,
        mobile: addMobile,
        email: addEmail || null,
        courseId: addCourseId || defaultCourse,
        leadSourceId: addLeadSourceId || defaultLeadSource,
        remarks: addRemarks || "Direct Admin Created Inquiry",
        allowDuplicate,
      });

      setAddSuccess("Inquiry created successfully and Admin notified!");
      setTimeout(() => {
        setIsAddInquiryOpen(false);
        setAddName("");
        setAddMobile("");
        setAddEmail("");
        setAddCourseId("");
        setAddLeadSourceId("");
        setAddRemarks("");
        setAllowDuplicate(false);
        setAddSuccess("");
        fetchInquiries();
      }, 1200);
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to create inquiry.");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inquiries & Leads Management</h1>
          <p className="text-xs text-slate-400">Track prospective student inquiries, follow-ups, and admissions conversion.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              setIsAddInquiryOpen(true);
              setAddError("");
              setAddSuccess("");
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Inquiry</span>
          </button>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === "table" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === "grid" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid View</span>
            </button>
          </div>
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

      {/* Inquiries Content Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No inquiries found matching criteria.</div>
        ) : viewMode === "table" ? (
          /* TABLE LIST VIEW */
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
        ) : (
          /* GRID CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inquiries.map((inq) => (
              <div key={inq.id} className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400">{inq.inquiryNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    inq.status === "ADMISSION_DONE"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : (inq.status === "INTERESTED"
                        ? "bg-blue-950 text-blue-300 border border-blue-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800")
                  }`}>
                    {inq.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{inq.fullName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{inq.course?.name || "General Course"}</p>
                </div>

                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-900">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{inq.mobile}</span>
                  </div>
                  {inq.email && (
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate">{inq.email}</span>
                    </div>
                  )}
                  {inq.remarks && (
                    <p className="text-[11px] text-slate-400 italic pt-1 truncate">"{inq.remarks}"</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => handleOpenFollowUp(inq)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition"
                  >
                    Follow Up
                  </button>
                  {inq.status !== "ADMISSION_DONE" && (
                    <button
                      onClick={() => handleConvertInquiry(inq.id)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold transition"
                    >
                      Convert
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Inquiry Modal */}
      {isAddInquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Create New Inquiry</h3>
                <p className="text-xs text-slate-400">Admin entry for prospective student lead</p>
              </div>
              <button onClick={() => setIsAddInquiryOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-semibold">
                {addSuccess}
              </div>
            )}

            {addError && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded-xl font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddInquirySubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={addMobile}
                    onChange={(e) => setAddMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select Department</label>
                  <select
                    value={inqDeptId}
                    onChange={(e) => setInqDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 text-xs font-medium"
                  >
                    <option value="">-- All Departments --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Course Interested (Searchable)</label>
                  <SearchableSelect
                    options={courses
                      .filter((c) => !inqDeptId || c.departmentId === inqDeptId || c.department?.id === inqDeptId)
                      .map((c) => ({
                        value: c.id,
                        label: `${c.name} (${c.code})`,
                        subLabel: `Fee: ₹${Number(c.fees).toLocaleString("en-IN")}`,
                        departmentName: c.department?.name || c.category,
                      }))}
                    value={addCourseId}
                    onChange={(_, val) => setAddCourseId(val)}
                    placeholder="-- Select / Search Course --"
                    searchPlaceholder="Type to search course..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Remarks / Note</label>
                <textarea
                  rows={2}
                  value={addRemarks}
                  onChange={(e) => setAddRemarks(e.target.value)}
                  placeholder="Enter initial counseling remarks..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Admin Override Checkbox */}
              <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowDuplicate"
                  checked={allowDuplicate}
                  onChange={(e) => setAllowDuplicate(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="allowDuplicate" className="text-[11px] text-amber-200 font-semibold cursor-pointer">
                  Admin Override: Allow duplicate inquiry for existing mobile/email
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddInquiryOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-500 shadow-md flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingInquiry ? "Saving..." : "Create Inquiry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
