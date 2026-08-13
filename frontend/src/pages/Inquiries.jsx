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
  Trash2,
  Tag,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  User,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { SearchableSelect } from "../components/common/SearchableSelect";

export const Inquiries = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiryIds, setSelectedInquiryIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  const handleSelectAllInquiries = (e) => {
    if (e.target.checked) {
      setSelectedInquiryIds(inquiries.map((inq) => inq.id));
    } else {
      setSelectedInquiryIds([]);
    }
  };

  const handleToggleSelectInquiry = (id) => {
    setSelectedInquiryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleDeleteInquiry = async (inq) => {
    if (!window.confirm(`Are you sure you want to delete inquiry for "${inq.fullName}"?`)) return;
    try {
      await api.delete(`/inquiries/${inq.id}`);
      setSelectedInquiryIds((prev) => prev.filter((id) => id !== inq.id));
      fetchInquiries();
      alert(`Inquiry for "${inq.fullName}" deleted successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete inquiry");
    }
  };

  const handleBulkDeleteInquiries = async () => {
    if (selectedInquiryIds.length === 0) return;
    if (
      !window.confirm(
        `CAUTION: Are you sure you want to delete ${selectedInquiryIds.length} selected inquiries?`
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    try {
      await api.post("/inquiries/bulk-delete", {
        inquiryIds: selectedInquiryIds,
      });
      alert(`${selectedInquiryIds.length} inquiries deleted successfully.`);
      setSelectedInquiryIds([]);
      fetchInquiries();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete selected inquiries.");
    } finally {
      setBulkDeleting(false);
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

  // Helper for Status Badge Styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "NEW":
        return "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80";
      case "FOLLOW_UP":
        return "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80";
      case "INTERESTED":
        return "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80";
      case "CLOSED":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      case "ADMISSION_DONE":
        return "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Inquiries & Leads Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track prospective student inquiries, follow-ups, and admissions conversion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setIsAddInquiryOpen(true);
              setAddError("");
              setAddSuccess("");
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add New Inquiry</span>
          </button>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-fit">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 px-3 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all duration-200 cursor-pointer ${
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 px-3 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all duration-200 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, phone, email, or inquiry number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-200 outline-none cursor-pointer truncate max-w-full shadow-sm focus:border-blue-500 transition-all"
          >
            <option value="" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">⏳ Active Pending Inquiries (Excl. Admission Done)</option>
            <option value="NEW" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🆕 NEW Inquiries Only</option>
            <option value="FOLLOW_UP" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🔄 FOLLOW_UP</option>
            <option value="INTERESTED" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">⭐ INTERESTED</option>
            <option value="CLOSED" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">❌ CLOSED</option>
            <option value="ADMISSION_DONE" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">✅ ADMISSION_DONE</option>
            <option value="ALL" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🌐 All Inquiries (Inc. Admission Done)</option>
          </select>
        </div>
      </div>

      {/* BULK OPERATIONS TOOLBAR */}
      {isSuperAdmin && selectedInquiryIds.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-blue-50 dark:bg-cyan-950/90 border border-blue-200 dark:border-cyan-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-blue-900 dark:text-cyan-200 bg-blue-100 dark:bg-cyan-900/80 px-3 py-1 rounded-xl whitespace-nowrap border border-blue-200 dark:border-cyan-700">
              {selectedInquiryIds.length} Inquiry(s) Selected
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleBulkDeleteInquiries}
              disabled={bulkDeleting}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{bulkDeleting ? "Deleting..." : `Delete Selected (${selectedInquiryIds.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedInquiryIds([])}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Deselect All"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Inquiries Content Section */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500 font-medium flex items-center justify-center space-x-2 shadow-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-cyan-400" />
          <span>Loading inquiries...</span>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500 font-medium shadow-sm">
          No inquiries found matching criteria.
        </div>
      ) : viewMode === "table" ? (
        /* TABLE LIST VIEW — INSIDE CARD CONTAINER */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  {isSuperAdmin && (
                    <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={
                          inquiries.length > 0 &&
                          inquiries.every((inq) => selectedInquiryIds.includes(inq.id))
                        }
                        onChange={handleSelectAllInquiries}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4 whitespace-nowrap">Inquiry No</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact Details</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Course Interested</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Lead Source</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200 font-medium">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    {isSuperAdmin && (
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedInquiryIds.includes(inq.id)}
                          onChange={() => handleToggleSelectInquiry(inq.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-800/80 text-xs">
                        {inq.inquiryNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                      {inq.fullName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <a href={`tel:${inq.mobile}`} className="hover:underline hover:text-emerald-800 dark:hover:text-emerald-300">
                          {inq.mobile}
                        </a>
                      </div>
                      {inq.email && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] flex items-center space-x-1 mt-0.5 font-normal">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{inq.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {inq.course?.name || "General Course"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded font-semibold text-[10px]">
                        {inq.leadSource?.name || "Direct"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadgeClass(inq.status)}`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenFollowUp(inq)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                        >
                          Follow Up
                        </button>
                        {inq.status !== "ADMISSION_DONE" && (
                          <button
                            onClick={() => handleConvertInquiry(inq.id)}
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                          >
                            Convert
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleSingleDeleteInquiry(inq)}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-all shadow-2xs cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW — DIRECTLY ON PAGE BACKGROUND WITH NO OUTER CARD CONTAINER (4 CARDS PER ROW ON DESKTOP) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {inquiries.map((inq) => {
            const isSelected = selectedInquiryIds.includes(inq.id);

            return (
              <div
                key={inq.id}
                className={`p-4.5 sm:p-5 bg-white dark:bg-slate-900 border rounded-2xl space-y-4 relative flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-blue-500 dark:border-cyan-500 bg-blue-50/40 dark:bg-cyan-950/20 shadow-md ring-1 ring-blue-500/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-cyan-500/50"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: [Checkbox + Inquiry ID] (Left) ... [Lead Source + Status] (Right) */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center space-x-2">
                      {isSuperAdmin && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectInquiry(inq.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 dark:text-cyan-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-cyan-800/80">
                        {inq.inquiryNumber}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 flex-wrap justify-end gap-1">
                      {inq.leadSource?.name && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-semibold">
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          <span>{inq.leadSource.name}</span>
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadgeClass(inq.status)}`}>
                        {inq.status}
                      </span>
                    </div>
                  </div>

                  {/* Student Name & Course */}
                  <div className="pt-0.5">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                      {inq.fullName}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                      {inq.course?.name || "General Course"}
                    </p>
                  </div>

                  {/* Contact Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center space-x-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl px-3 py-2 text-emerald-800 dark:text-emerald-400 font-mono font-bold text-xs shadow-2xs hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <a href={`tel:${inq.mobile}`} className="hover:underline hover:text-emerald-900 dark:hover:text-emerald-300">
                        {inq.mobile}
                      </a>
                    </div>

                    {inq.email && (
                      <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 text-xs px-1 overflow-hidden mt-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="truncate font-medium">{inq.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Inquiry Remarks / Notes */}
                  {inq.remarks && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1 mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-blue-500 dark:text-cyan-400" /> INQUIRY REMARKS
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-wrap">
                        "{inq.remarks}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenFollowUp(inq)}
                    className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Follow Up</span>
                  </button>

                  {inq.status !== "ADMISSION_DONE" && (
                    <button
                      type="button"
                      onClick={() => handleConvertInquiry(inq.id)}
                      className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Convert</span>
                    </button>
                  )}

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleSingleDeleteInquiry(inq)}
                      className="p-2 text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-all shadow-2xs cursor-pointer"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Inquiry Modal */}
      {isAddInquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Inquiry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Admin entry for prospective student lead</p>
              </div>
              <button onClick={() => setIsAddInquiryOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-semibold">
                {addSuccess}
              </div>
            )}

            {addError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddInquirySubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={addMobile}
                    onChange={(e) => setAddMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Department</label>
                  <select
                    value={inqDeptId}
                    onChange={(e) => setInqDeptId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 text-xs font-medium shadow-xs"
                  >
                    <option value="">-- All Departments --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course Interested (Searchable)</label>
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks / Note</label>
                <textarea
                  rows={2}
                  value={addRemarks}
                  onChange={(e) => setAddRemarks(e.target.value)}
                  placeholder="Enter initial counseling remarks..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              {/* Admin Override Checkbox */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowDuplicate"
                  checked={allowDuplicate}
                  onChange={(e) => setAllowDuplicate(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
                <label htmlFor="allowDuplicate" className="text-[11px] text-amber-800 dark:text-amber-200 font-semibold cursor-pointer">
                  Admin Override: Allow duplicate inquiry for existing mobile/email
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddInquiryOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-md flex items-center space-x-2 cursor-pointer transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Inquiry Follow-up</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedInquiry.fullName} ({selectedInquiry.inquiryNumber})</p>
              </div>
              <button onClick={() => setIsFollowUpOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Follow up history */}
            <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] block">History Notes</span>
              {followUpHistory.length === 0 ? (
                <p className="text-slate-400 italic">No previous follow-up notes.</p>
              ) : (
                followUpHistory.map((h, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{h.remarks}</p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      By {h.createdBy?.name || "Staff"} on {new Date(h.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddFollowUp} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Add Follow-up Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  placeholder="Enter notes from phone call or meeting..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFollowUpOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-md cursor-pointer transition"
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

