import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import { ReceiptModal } from "../components/receipts/ReceiptModal";
import { formatDate } from "../utils/formatters";
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Calendar,
  CreditCard,
  X,
  LayoutGrid,
  List,
  Save,
  AlertCircle,
  Sparkles,
  BookOpen,
  Receipt,
  CheckCircle2,
  Clock,
  Printer,
  History,
  PlusCircle,
  SlidersHorizontal,
} from "lucide-react";

export const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [allStudentsCache, setAllStudentsCache] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Bulk selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Google-style Auto-complete Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullStudentData, setFullStudentData] = useState(null);
  const [loadingFullData, setLoadingFullData] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [collectFeeStudent, setCollectFeeStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [feeError, setFeeError] = useState("");

  // Quick Fee Collection Form state
  const [feeForm, setFeeForm] = useState({
    amount: "",
    paymentMode: "CASH",
    transactionReference: "",
    remarks: "",
  });

  // Printable Receipt Modal State
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  // Profile Modal Tab state: 'courses' | 'payments' | 'attendance'
  const [activeTab, setActiveTab] = useState("courses");

  // Edit Form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    status: "ACTIVE",
    courseFees: "",
    discount: "",
    finalFees: "",
    remarks: "",
  });

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState("table");

  // Dynamic Visible Columns Customizer state
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const columnCustomizerRef = useRef(null);
  const [columns, setColumns] = useState({
    studentId: true,
    fullName: true,
    mobile: true,
    course: true,
    totalFees: true,
    paidAmount: true,
    pendingAmount: true,
    joiningDate: true,
    guardian: false,
    status: true,
  });

  // Add Course Modal State
  const [addCourseStudent, setAddCourseStudent] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [addCourseError, setAddCourseError] = useState("");
  const [addCourseForm, setAddCourseForm] = useState({
    courseId: "",
    courseFees: "",
    discount: "0",
    finalFees: "",
    paymentAmount: "0",
    paymentMode: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionReference: "",
    remarks: "",
  });

  useEffect(() => {
    fetchStudents(1);
    fetchAllStudentsForSuggestions();
  }, [statusFilter]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch full student history when a student is selected for Profile Modal
  useEffect(() => {
    if (selectedStudent) {
      fetchFullStudentHistory(selectedStudent.id);
    } else {
      setFullStudentData(null);
    }
  }, [selectedStudent]);

  const fetchFullStudentHistory = async (studentId) => {
    setLoadingFullData(true);
    try {
      const res = await api.get(`/students/${studentId}`);
      setFullStudentData(res.data?.data || null);
    } catch (err) {
      console.error("Fetch student history error:", err);
    } finally {
      setLoadingFullData(false);
    }
  };

  const fetchAllStudentsForSuggestions = async () => {
    try {
      const res = await api.get("/students?limit=200");
      setAllStudentsCache(res.data?.data?.students || []);
    } catch (err) {
      console.error("Cache error:", err);
    }
  };

  const fetchStudents = async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const response = await api.get("/students", {
        params: {
          page,
          limit: 12,
          search: searchQuery || undefined,
          status: statusFilter || undefined,
        },
      });

      const data = response.data?.data;
      setStudents(data?.students || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);

    if (val.trim().length >= 2) {
      const q = val.toLowerCase().trim();
      const matches = allStudentsCache.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.mobile || "").includes(q) ||
          (s.admission?.courseNameSnapshot || "").toLowerCase().includes(q)
      ).slice(0, 6);

      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (s) => {
    setSearch(s.fullName);
    setShowSuggestions(false);
    fetchStudents(1, s.fullName);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchStudents(1, search);
  };

  const handleOpenCollectFee = (student) => {
    setCollectFeeStudent(student);
    setFeeError("");
    setFeeForm({
      amount: "",
      paymentMode: "CASH",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionReference: "",
      remarks: "",
    });
  };

  const handleCollectFeeSubmit = async (e) => {
    e.preventDefault();
    setFeeError("");

    if (!feeForm.amount || Number(feeForm.amount) <= 0) {
      setFeeError("Please enter a valid payment amount.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/fees/collect", {
        studentId: collectFeeStudent.id,
        amount: Number(feeForm.amount),
        paymentMode: feeForm.paymentMode,
        paymentDate: feeForm.paymentDate || undefined,
        transactionReference: feeForm.transactionReference,
        remarks: feeForm.remarks,
      });

      const payment = response.data?.data?.payment;
      setCollectFeeStudent(null);
      setSelectedReceiptPayment(payment);
      fetchStudents(pagination.page);
    } catch (err) {
      console.error("Collect fee error:", err);
      setFeeError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditError("");
    const adm = student.admission;
    setEditForm({
      fullName: toTitleCase(student.fullName || ""),
      mobile: student.mobile || "",
      email: student.email || "",
      address: student.address || "",
      status: student.status || "ACTIVE",
      courseFees: adm?.courseFees || adm?.courseFeesSnapshot || 5000,
      discount: adm?.discount || 0,
      finalFees: adm?.finalFees || 5000,
      remarks: adm?.remarks || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError("");

    if (!editForm.fullName || !editForm.mobile) {
      setEditError("Full Name and Mobile number are required.");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/students/${editingStudent.id}`, {
        ...editForm,
        fullName: toTitleCase(editForm.fullName),
      });
      setEditingStudent(null);
      fetchStudents(pagination.page);
      fetchAllStudentsForSuggestions();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update student details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedStudentIds.length === 0) return;
    setSubmitting(true);
    try {
      await api.patch("/students/bulk-status", {
        studentIds: selectedStudentIds,
        status,
      });
      setSelectedStudentIds([]);
      fetchStudents(pagination.page);
      fetchAllStudentsForSuggestions();
    } catch (err) {
      console.error("Bulk status error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddCourse = async (student) => {
    setAddCourseStudent(student);
    setAddCourseError("");
    setAddCourseForm({
      courseId: "",
      courseFees: "",
      discount: "0",
      finalFees: "",
      paymentAmount: "0",
      paymentMode: "CASH",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionReference: "",
      remarks: "",
    });
    try {
      const res = await api.get("/courses");
      setCoursesList(res.data?.data || []);
    } catch (err) {
      console.error("Fetch courses error:", err);
    }
  };

  const handleSelectAddCourse = (courseId) => {
    const c = coursesList.find((item) => item.id === courseId);
    if (c) {
      const fees = Number(c.fees || 0);
      const disc = Number(addCourseForm.discount || 0);
      setAddCourseForm({
        ...addCourseForm,
        courseId,
        courseFees: fees,
        finalFees: Math.max(0, fees - disc),
      });
    } else {
      setAddCourseForm({
        ...addCourseForm,
        courseId,
      });
    }
  };

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault();
    setAddCourseError("");

    if (!addCourseForm.courseId) {
      setAddCourseError("Please select a course to enroll.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/students/${addCourseStudent.id}/courses`, {
        ...addCourseForm,
        courseFees: Number(addCourseForm.courseFees),
        discount: Number(addCourseForm.discount),
        paymentAmount: Number(addCourseForm.paymentAmount),
      });
      setAddCourseStudent(null);
      fetchStudents(pagination.page);
      fetchAllStudentsForSuggestions();
      if (selectedStudent && selectedStudent.id === addCourseStudent.id) {
        fetchFullStudentHistory(selectedStudent.id);
      }
    } catch (err) {
      console.error("Add course error:", err);
      setAddCourseError(err.response?.data?.message || "Failed to add new course.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Printable Receipt Modal */}
      {selectedReceiptPayment && (
        <ReceiptModal
          payment={selectedReceiptPayment}
          student={fullStudentData || selectedStudent}
          admission={selectedReceiptPayment.admission || selectedStudent?.admission}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-400">
            Search, filter, edit student profiles, collect tuition fees, and change academic status.
          </p>
        </div>

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

      {/* Filter and Google-Style Search Bar with Auto-Complete Dropdown */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center relative z-20">
        <div ref={searchContainerRef} className="flex-1 w-full relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                onFocus={() => search.trim().length >= 2 && setShowSuggestions(true)}
                placeholder="Type name, mobile or student ID (e.g. Krishna, 9825...)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              Search
            </button>
          </form>

          {/* GOOGLE-STYLE AUTO-COMPLETE SUGGESTIONS DROPDOWN */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-slate-950 border border-cyan-800/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60">
              <div className="px-3 py-1.5 bg-slate-900 text-[10px] uppercase font-bold text-cyan-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Google-style Student Suggestions</span>
              </div>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSuggestion(s)}
                  className="p-3 hover:bg-slate-900/80 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-xs">
                      {s.fullName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{toTitleCase(s.fullName)}</p>
                      <p className="text-[10px] text-slate-400">
                        Mobile: {s.mobile} • Course: {s.admission?.courseNameSnapshot || "N/A"}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {s.studentId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DROPPED">DROPPED</option>
            <option value="TRANSFERRED">TRANSFERRED</option>
          </select>

          {/* DYNAMIC COLUMN / FIELD CUSTOMIZER POPOVER */}
          <div ref={columnCustomizerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
              className={`px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                showColumnCustomizer ? "border-cyan-500 text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
              }`}
              title="Customize Display Columns & Fields"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show Fields ({Object.values(columns).filter(Boolean).length})</span>
            </button>

            {showColumnCustomizer && (
              <div className="absolute right-0 top-12 w-64 bg-slate-950 border border-cyan-800/80 rounded-2xl shadow-2xl p-4 z-50 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">
                    Display Columns / Fields
                  </span>
                  <button onClick={() => setShowColumnCustomizer(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.studentId}
                      onChange={(e) => setColumns({ ...columns, studentId: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Student ID</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.fullName}
                      onChange={(e) => setColumns({ ...columns, fullName: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Student Name</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.mobile}
                      onChange={(e) => setColumns({ ...columns, mobile: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Mobile Number</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.course}
                      onChange={(e) => setColumns({ ...columns, course: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Enrolled Course(s)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.totalFees}
                      onChange={(e) => setColumns({ ...columns, totalFees: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Total Course Fees (₹)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.paidAmount}
                      onChange={(e) => setColumns({ ...columns, paidAmount: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-emerald-400 font-bold">Paid Fees Amount (₹)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.pendingAmount}
                      onChange={(e) => setColumns({ ...columns, pendingAmount: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-amber-400 font-bold">Pending Dues Balance (₹)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.joiningDate}
                      onChange={(e) => setColumns({ ...columns, joiningDate: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Joined / Admission Date</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.guardian}
                      onChange={(e) => setColumns({ ...columns, guardian: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Guardian Contact</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns.status}
                      onChange={(e) => setColumns({ ...columns, status: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200 font-bold">Academic Status</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING BULK ACTIONS BAR */}
      {selectedStudentIds.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-700/80 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-cyan-600 text-white font-black text-xs flex items-center justify-center">
              {selectedStudentIds.length}
            </span>
            <span className="text-xs font-bold text-white tracking-wide">Student(s) Selected</span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
            <button
              onClick={() => handleBulkStatusUpdate("ACTIVE")}
              disabled={submitting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Activate Selected ({selectedStudentIds.length})</span>
            </button>

            <button
              onClick={() => handleBulkStatusUpdate("ON_HOLD")}
              disabled={submitting}
              className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-800 rounded-xl transition disabled:opacity-50"
            >
              Mark On Hold
            </button>

            <button
              onClick={() => handleBulkStatusUpdate("COMPLETED")}
              disabled={submitting}
              className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-800 rounded-xl transition disabled:opacity-50"
            >
              Mark Completed
            </button>

            <button
              onClick={() => handleBulkStatusUpdate("DROPPED")}
              disabled={submitting}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 rounded-xl transition disabled:opacity-50"
            >
              Mark Dropped
            </button>

            <button
              onClick={() => setSelectedStudentIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-2"
              title="Deselect All"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {loading ? (
          <LoadingSpinner label="Fetching student directory..." />
        ) : students.length === 0 ? (
          <EmptyState
            title="No Students Found"
            description="Try adjusting your search criteria or register a new student."
          />
        ) : viewMode === "table" ? (
          /* TABLE LIST VIEW WITH QUICK COLLECT FEE BUTTON */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedStudentIds.length === students.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                  </th>
                  {columns.studentId && <th className="p-3.5">Student ID</th>}
                  {columns.fullName && <th className="p-3.5">Student Name</th>}
                  {columns.mobile && <th className="p-3.5">Mobile</th>}
                  {columns.course && <th className="p-3.5">Enrolled Course(s)</th>}
                  {columns.totalFees && <th className="p-3.5 text-right">Total Fees</th>}
                  {columns.paidAmount && <th className="p-3.5 text-right">Paid Fees</th>}
                  {columns.pendingAmount && <th className="p-3.5 text-right">Pending Dues</th>}
                  {columns.joiningDate && <th className="p-3.5">Joined Date</th>}
                  {columns.guardian && <th className="p-3.5">Guardian Contact</th>}
                  {columns.status && <th className="p-3.5">Status</th>}
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  const totalFees = Number(student.admission?.finalFees || student.admission?.courseFees || 0);
                  const paidAmount = Number(student.admission?.paidAmount || 0);
                  const pendingAmount = Number(student.admission?.pendingAmount || 0);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        selectedStudentIds.includes(student.id) ? "bg-cyan-950/30" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleSelect(student.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>

                      {columns.studentId && (
                        <td className="p-3.5 font-mono text-xs font-bold text-cyan-400">
                          {student.studentId}
                        </td>
                      )}

                      {columns.fullName && (
                        <td className="p-3.5 font-bold text-slate-100">
                          {toTitleCase(student.fullName)}
                        </td>
                      )}

                      {columns.mobile && (
                        <td className="p-3.5 text-slate-300 text-xs">{student.mobile}</td>
                      )}

                      {columns.course && (
                        <td className="p-3.5 text-xs">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span
                              className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-bold truncate max-w-[210px]"
                              title={student.courseInfo?.primaryCourse || student.admission?.courseNameSnapshot}
                            >
                              {student.courseInfo?.primaryCourse || student.admission?.courseNameSnapshot || "General Course"}
                            </span>
                            {student.courseInfo?.extraCoursesCount > 0 && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudent(student);
                                }}
                                className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg text-[10px] font-extrabold cursor-pointer transition shadow hover:scale-105 inline-flex items-center space-x-0.5"
                                title="Click to view all enrolled courses"
                              >
                                <span>+ {student.courseInfo.extraCoursesCount} more</span>
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {columns.totalFees && (
                        <td className="p-3.5 text-right font-extrabold text-white text-xs">
                          ₹{totalFees.toLocaleString("en-IN")}
                        </td>
                      )}

                      {columns.paidAmount && (
                        <td className="p-3.5 text-right font-extrabold text-emerald-400 text-xs">
                          ₹{paidAmount.toLocaleString("en-IN")}
                        </td>
                      )}

                      {columns.pendingAmount && (
                        <td className="p-3.5 text-right font-extrabold text-amber-400 text-xs">
                          ₹{pendingAmount.toLocaleString("en-IN")}
                        </td>
                      )}

                      {columns.joiningDate && (
                        <td className="p-3.5 font-mono text-slate-400 text-xs">
                          {formatDate(student.joinedDate || student.createdAt)}
                        </td>
                      )}

                      {columns.guardian && (
                        <td className="p-3.5 text-slate-300 text-xs">
                          {student.admission?.guardianName || "N/A"}{" "}
                          {student.admission?.guardianMobile && `(${student.admission.guardianMobile})`}
                        </td>
                      )}

                      {columns.status && (
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                                : student.status === "COMPLETED"
                                ? "bg-blue-950 text-blue-300 border border-blue-800/60"
                                : student.status === "DROPPED"
                                ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                      )}
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenCollectFee(student)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold transition-colors inline-flex items-center space-x-1"
                        title="Collect Fee & Issue Receipt"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Fee</span>
                      </button>
                      <button
                        onClick={() => handleOpenAddCourse(student)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                        title="Enroll in New Course & Set Fees"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                        title="View Full History & Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white transition-colors"
                        title="Edit Details, Fees & Status"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className={`p-5 bg-slate-950/80 border rounded-2xl space-y-3 hover:border-cyan-500/40 transition relative ${
                  selectedStudentIds.includes(student.id) ? "border-cyan-500 bg-cyan-950/20" : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => handleToggleSelect(student.id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-cyan-400">{student.studentId}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      student.status === "ACTIVE"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                        : student.status === "COMPLETED"
                        ? "bg-blue-950 text-blue-300 border border-blue-800/60"
                        : student.status === "DROPPED"
                        ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{toTitleCase(student.fullName)}</h4>
                  <div className="flex items-center space-x-1.5 mt-1.5 flex-wrap gap-y-1">
                    <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[11px] font-bold truncate max-w-[170px]">
                      {student.courseInfo?.primaryCourse || student.admission?.courseNameSnapshot || "General Course"}
                    </span>
                    {student.courseInfo?.extraCoursesCount > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                        }}
                        className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded text-[10px] font-extrabold cursor-pointer transition shadow"
                      >
                        + {student.courseInfo.extraCoursesCount} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-900">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{student.mobile}</span>
                  </div>
                  {student.email && (
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => handleOpenCollectFee(student)}
                    className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Fee</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(student)}
                    className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">
              Showing page <strong className="text-white">{pagination.page}</strong> of{" "}
              <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} unique students)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchStudents(pagination.page - 1)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchStudents(pagination.page + 1)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK COLLECT FEE MODAL */}
      {collectFeeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Collect Student Fee</h3>
                <p className="text-xs text-slate-400">{toTitleCase(collectFeeStudent.fullName)} ({collectFeeStudent.studentId})</p>
              </div>
              <button onClick={() => setCollectFeeStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feeError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{feeError}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Enrolled Course:</span>
                <span className="font-bold text-white">
                  {collectFeeStudent.courseInfo?.primaryCourse || collectFeeStudent.admission?.courseNameSnapshot}
                </span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Current Pending Balance:</span>
                <span>₹{Number(collectFeeStudent.admission?.pendingAmount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <form onSubmit={handleCollectFeeSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    placeholder="Enter amount paid"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-emerald-500 font-bold text-base"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={feeForm.paymentDate || ""}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentDate: e.target.value })}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-emerald-500 cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={feeForm.paymentMode}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-emerald-500"
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
                    value={feeForm.transactionReference}
                    onChange={(e) => setFeeForm({ ...feeForm, transactionReference: e.target.value })}
                    placeholder="Optional ref"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={feeForm.remarks}
                  onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                  placeholder="Installment payment note..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectFeeStudent(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{submitting ? "Recording..." : "Record & Issue Receipt"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE VIEW PROFILE & HISTORY MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student History Overview - ${toTitleCase(selectedStudent.fullName)}`}
        >
          <div className="space-y-5 text-sm text-slate-200 font-sans max-h-[80vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3.5 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{toTitleCase(selectedStudent.fullName)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-cyan-400 font-bold">
                      {selectedStudent.studentId}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">
                      Academic Status: <strong className="text-emerald-400">{selectedStudent.status}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const s = selectedStudent;
                    handleOpenAddCourse(s);
                  }}
                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                  title="Enroll in another course"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Add Course</span>
                </button>
                <button
                  onClick={() => {
                    const s = selectedStudent;
                    setSelectedStudent(null);
                    handleOpenCollectFee(s);
                  }}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect Fee</span>
                </button>
                <button
                  onClick={() => {
                    const s = selectedStudent;
                    setSelectedStudent(null);
                    handleOpenEdit(s);
                  }}
                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* TAB CONTROLS */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("courses")}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  activeTab === "courses" ? "bg-cyan-600 text-white shadow-lg" : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Enrolled Courses ({fullStudentData?.allAdmissions?.length || 1})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  activeTab === "payments" ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Payment Receipts ({fullStudentData?.allPayments?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("attendance")}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  activeTab === "attendance" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Attendance Log ({fullStudentData?.attendanceStats?.attendancePercentage || 100}%)</span>
              </button>
            </div>

            {loadingFullData ? (
              <div className="text-center py-12 text-xs text-slate-500">Loading complete student history...</div>
            ) : (
              <>
                {/* TAB 1: ENROLLED COURSES TIMELINE */}
                {activeTab === "courses" && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-cyan-400" /> Complete Enrolled Courses Timeline
                    </h4>

                    <div className="space-y-3">
                      {(fullStudentData?.allAdmissions || [selectedStudent.admission]).filter(Boolean).map((adm, idx) => (
                        <div key={adm.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">
                              {adm.courseNameSnapshot || adm.course?.name || "General Course"}
                            </span>
                            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 rounded-full">
                              {adm.admissionNumber}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">Joining Date</span>
                              <span className="font-mono text-slate-200 font-semibold">{formatDate(adm.admissionDate)}</span>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">Course Fees</span>
                              <span className="font-bold text-slate-200">₹{Number(adm.finalFees || adm.courseFees).toLocaleString("en-IN")}</span>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">Paid Fee</span>
                              <span className="font-bold text-emerald-400">₹{Number(adm.paidAmount).toLocaleString("en-IN")}</span>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">Pending Balance</span>
                              <span className="font-bold text-amber-400">₹{Number(adm.pendingAmount).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: COMPLETE FEE PAYMENT RECEIPTS */}
                {activeTab === "payments" && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-400" /> Fee Payment Receipts History
                    </h4>

                    {(!fullStudentData?.allPayments || fullStudentData.allPayments.length === 0) ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No payment receipts recorded for this student.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Receipt / Ref</th>
                              <th className="py-2.5 px-3">Course</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Mode</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3 text-center">Print</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {fullStudentData.allPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                                  {p.transactionReference || `REC-${p.id.slice(-6).toUpperCase()}`}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[150px]">
                                  {p.courseName || "Course"}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-400">
                                  {formatDate(p.paymentDate || p.createdAt)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded font-bold uppercase text-[10px]">
                                    {p.paymentMode || "CASH"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400">
                                  ₹{Number(p.amount).toLocaleString("en-IN")}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={() => setSelectedReceiptPayment(p)}
                                    className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded font-semibold text-[10px] inline-flex items-center space-x-1"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>Receipt</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ATTENDANCE HISTORY & STATS */}
                {activeTab === "attendance" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Attendance Rate</span>
                        <span className="text-lg font-black text-emerald-400">
                          {fullStudentData?.attendanceStats?.attendancePercentage || 100}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Present Days</span>
                        <span className="text-lg font-black text-cyan-400">
                          {fullStudentData?.attendanceStats?.presentCount || 0} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Absent Days</span>
                        <span className="text-lg font-black text-rose-400">
                          {fullStudentData?.attendanceStats?.absentCount || 0} Days
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-400" /> Recent Attendance Log
                    </h4>

                    {(!fullStudentData?.attendanceStats?.recentLogs || fullStudentData.attendanceStats.recentLogs.length === 0) ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No attendance logs recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {fullStudentData.attendanceStats.recentLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-mono text-slate-300">
                                  {formatDate(log.date)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    log.status === "PRESENT"
                                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                      : "bg-rose-950 text-rose-400 border border-rose-800"
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 italic">
                                  {log.remarks || "Regular session"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* PERSONAL INFO CARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Mobile Contact</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> {selectedStudent.mobile}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Email Address</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> {selectedStudent.email || "N/A"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Address</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {selectedStudent.address || "N/A"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Registration Date</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  {formatDate(selectedStudent.joinedDate || selectedStudent.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT STUDENT & FEES MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Edit Student Profile & Fee Structure</h3>
                <p className="text-xs text-slate-400">{toTitleCase(editingStudent.fullName)} ({editingStudent.studentId})</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Academic Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold text-cyan-400"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DROPPED">DROPPED</option>
                    <option value="TRANSFERRED">TRANSFERRED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Fee Structure Correction
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Course Fee (₹)</label>
                    <input
                      type="number"
                      value={editForm.courseFees}
                      onChange={(e) => {
                        const cf = Number(e.target.value);
                        const disc = Number(editForm.discount);
                        setEditForm({
                          ...editForm,
                          courseFees: e.target.value,
                          finalFees: Math.max(0, cf - disc),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      value={editForm.discount}
                      onChange={(e) => {
                        const disc = Number(e.target.value);
                        const cf = Number(editForm.courseFees);
                        setEditForm({
                          ...editForm,
                          discount: e.target.value,
                          finalFees: Math.max(0, cf - disc),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Net Final Fee (₹)</label>
                    <input
                      type="number"
                      value={editForm.finalFees}
                      onChange={(e) => setEditForm({ ...editForm, finalFees: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-cyan-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="Reason for edit or fee correction..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLL NEW COURSE & FEES MODAL */}
      {addCourseStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" /> Enroll in New Course
                </h3>
                <p className="text-xs text-slate-400">{toTitleCase(addCourseStudent.fullName)} ({addCourseStudent.studentId})</p>
              </div>
              <button onClick={() => setAddCourseStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addCourseError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{addCourseError}</span>
              </div>
            )}

            <form onSubmit={handleAddCourseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select New Course *</label>
                <select
                  required
                  value={addCourseForm.courseId}
                  onChange={(e) => handleSelectAddCourse(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="">Choose Course...</option>
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - Fee: ₹{Number(c.fees).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Course Fees Breakdown
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Course Fee (₹)</label>
                    <input
                      type="number"
                      required
                      value={addCourseForm.courseFees}
                      onChange={(e) => {
                        const cf = Number(e.target.value);
                        const disc = Number(addCourseForm.discount);
                        setAddCourseForm({
                          ...addCourseForm,
                          courseFees: e.target.value,
                          finalFees: Math.max(0, cf - disc),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      value={addCourseForm.discount}
                      onChange={(e) => {
                        const disc = Number(e.target.value);
                        const cf = Number(addCourseForm.courseFees);
                        setAddCourseForm({
                          ...addCourseForm,
                          discount: e.target.value,
                          finalFees: Math.max(0, cf - disc),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Net Final Fee (₹)</label>
                    <input
                      type="number"
                      value={addCourseForm.finalFees}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, finalFees: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-cyan-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Initial Down Payment (Optional)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Down Payment (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={addCourseForm.paymentAmount}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, paymentAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={addCourseForm.paymentDate}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, paymentDate: e.target.value })}
                      onClick={(e) => e.target.showPicker?.()}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Payment Mode</label>
                    <select
                      value={addCourseForm.paymentMode}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI / GPAY</option>
                      <option value="CARD">CARD</option>
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Txn Ref / Receipt No</label>
                    <input
                      type="text"
                      value={addCourseForm.transactionReference}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, transactionReference: e.target.value })}
                      placeholder="Optional ref"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={addCourseForm.remarks}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, remarks: e.target.value })}
                  placeholder="Note for second course admission..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCourseStudent(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? "Enrolling..." : "Enroll & Save Course Fees"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
