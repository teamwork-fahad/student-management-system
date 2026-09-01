import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import { SearchableSelect } from "../components/common/SearchableSelect";
import { ReceiptModal } from "../components/receipts/ReceiptModal";
import { UpcomingBirthdaysWidget } from "../components/notifications/UpcomingBirthdaysWidget";
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
  Trash2,
  User,
  ExternalLink,
  Cake,
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [students, setStudents] = useState([]);
  const [allStudentsCache, setAllStudentsCache] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || searchParams.get("statusFilter") || "");

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

  const [departmentsList, setDepartmentsList] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState(() => searchParams.get("paymentFilter") || "");
  const [sortBy, setSortBy] = useState("name_asc");
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completedStudents: 0,
    pendingDuesCount: 0,
    totalPendingDuesAmount: 0,
    statusCounts: {},
  });

  const filtersRef = useRef({
    page: 1,
    search: "",
    statusFilter: "",
    departmentFilter: "",
    programFilter: "",
    courseFilter: "",
    paymentFilter: "",
    sortBy: "name_asc",
  });

  useEffect(() => {
    filtersRef.current = {
      page: pagination.page || 1,
      search,
      statusFilter,
      departmentFilter,
      programFilter,
      courseFilter,
      paymentFilter,
      sortBy,
    };
  }, [pagination.page, search, statusFilter, departmentFilter, programFilter, courseFilter, paymentFilter, sortBy]);

  const refreshCurrentView = () => {
    const { page, search: s, statusFilter: st, departmentFilter: dept, programFilter: prog, courseFilter: c, paymentFilter: p, sortBy: sb } = filtersRef.current;
    api.get("/students", {
      params: {
        page,
        limit: 12,
        search: s || undefined,
        status: st || undefined,
        departmentId: dept || undefined,
        category: prog || undefined,
        courseId: c || undefined,
        paymentFilter: p || undefined,
        sortBy: sb || "name_asc",
      },
    })
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setStudents(data.students || []);
          setPagination(data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
          if (data.stats) setStats(data.stats);
        }
      })
      .catch((err) => console.error("Auto refresh error:", err));

    fetchCoursesForFilter();
    fetchDepartmentsForFilter();
  };

  // Auto-refresh student list when returning to tab or when changes occur in child profile tab
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel("student_directory_sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "STUDENT_UPDATED") {
          refreshCurrentView();
        }
      };
    } catch (e) { }

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshCurrentView();
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === "student_directory_last_updated") {
        refreshCurrentView();
      }
    };

    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const queryFromUrl = searchParams.get("search") || searchParams.get("studentId") || "";

  useEffect(() => {
    if (queryFromUrl) {
      setSearch(queryFromUrl);
      fetchStudents(1, queryFromUrl, true);
    } else {
      fetchStudents(1, "", false);
    }
    fetchAllStudentsForSuggestions();
    fetchCoursesForFilter();
    fetchDepartmentsForFilter();
  }, [queryFromUrl, statusFilter, departmentFilter, programFilter, courseFilter, paymentFilter, sortBy]);

  const fetchCoursesForFilter = async () => {
    try {
      const res = await api.get("/courses");
      setCoursesList(res.data?.data || []);
    } catch (err) {
      console.error("Fetch courses for filter error:", err);
    }
  };

  const fetchDepartmentsForFilter = async () => {
    try {
      const res = await api.get("/departments");
      setDepartmentsList(res.data?.data || []);
    } catch (err) {
      console.error("Fetch departments for filter error:", err);
    }
  };

  const handleCourseStatusChange = async (admissionId, newStatus) => {
    try {
      await api.patch(`/admissions/${admissionId}/status`, { status: newStatus });
      if (selectedStudent) {
        fetchFullStudentHistory(selectedStudent.id);
      }
      fetchStudents(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update course status");
    }
  };

  const handleDeleteCourseAdmission = async (admissionId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete / remove course enrollment for "${courseName}"?`)) return;

    try {
      await api.delete(`/admissions/${admissionId}`);
      if (selectedStudent) {
        fetchFullStudentHistory(selectedStudent.id);
      }
      fetchStudents(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete course enrollment");
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`CAUTION: Are you sure you want to completely delete student record for "${studentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/students/${studentId}`);
      setSelectedStudent(null);
      fetchStudents(pagination.page);
      alert(`Student record for ${studentName} deleted successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student record");
    }
  };

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

  const fetchStudents = async (page = 1, searchQuery = search, autoSelect = false) => {
    setLoading(true);
    try {
      let response = await api.get("/students", {
        params: {
          page,
          limit: 12,
          search: searchQuery || undefined,
          status: statusFilter || undefined,
          departmentId: departmentFilter || undefined,
          category: programFilter || undefined,
          courseId: courseFilter || undefined,
          paymentFilter: paymentFilter || undefined,
          sortBy: sortBy || "name_asc",
        },
      });

      let data = response.data?.data;
      let studentList = data?.students || [];

      // Fallback: If active filters return empty for a search query, retry without filter restrictions
      if (searchQuery && studentList.length === 0 && (statusFilter || courseFilter || paymentFilter)) {
        response = await api.get("/students", {
          params: { page: 1, limit: 12, search: searchQuery },
        });
        data = response.data?.data;
        studentList = data?.students || [];
      }

      setStudents(studentList);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
      if (data?.stats) {
        setStats(data.stats);
      }

      if (autoSelect && studentList.length > 0) {
        const cleanQuery = String(searchQuery).replace(/\D/g, "");
        const exactMatch =
          studentList.find((s) => {
            const sMobileClean = (s.mobile || "").replace(/\D/g, "");
            const sWhatsappClean = (s.whatsapp || "").replace(/\D/g, "");
            return (
              s.studentId?.toLowerCase() === String(searchQuery).toLowerCase() ||
              s.fullName?.toLowerCase() === String(searchQuery).toLowerCase() ||
              (cleanQuery.length >= 4 && (sMobileClean.includes(cleanQuery) || sWhatsappClean.includes(cleanQuery))) ||
              s.mobile === searchQuery
            );
          }) || studentList[0];

        if (exactMatch && exactMatch.id) {
          navigate(`/dashboard/students/${exactMatch.id}`);
        }
      }
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
          (s.fullName || "").toLowerCase().includes(q) ||
          (s.studentId || "").toLowerCase().includes(q) ||
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
    setSelectedStudent(s);
    fetchStudents(1, s.fullName, true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchStudents(1, search, true);
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

  // 3-Level Cascading Filter Calculations
  const coursesInDept = coursesList.filter((c) => {
    if (!departmentFilter) return true;
    return (c.departmentId === departmentFilter) || (c.department?.id === departmentFilter);
  });

  const availablePrograms = Array.from(
    new Set(
      coursesInDept
        .map((c) => c.category)
        .filter((cat) => cat && cat !== "IT Course" && cat !== "General")
    )
  ).sort();

  const coursesInProgram = coursesInDept.filter((c) => {
    if (!programFilter) return true;
    return c.category === programFilter;
  });

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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Student Directory & Academic Tracking</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor student enrollments, academic status, tuition fee balances, and payment collections.
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-fit">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${viewMode === "table" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            title="Table List View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${viewMode === "grid" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("birthdays")}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${viewMode === "birthdays" ? "bg-pink-600 text-white shadow-md shadow-pink-500/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            title="Upcoming Birthdays Hub"
          >
            <Cake className="w-4 h-4" />
            <span className="hidden sm:inline">Birthdays 🎂</span>
          </button>
        </div>
      </div>

      {/* RENDER UPCOMING BIRTHDAYS WIDGET WHEN BIRTHDAYS MODE IS ACTIVE */}
      {viewMode === "birthdays" && (
        <div className="mb-6">
          <UpcomingBirthdaysWidget />
        </div>
      )}

      {/* KPI STATS SUMMARY CARDS HEADER */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Registered</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white whitespace-nowrap">{stats.totalStudents || pagination.total || students.length}</h3>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Active Students</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{stats.activeStudents || 0}</h3>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Pending Dues ({stats.pendingDuesCount || 0})</p>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">₹{(stats.totalPendingDuesAmount || 0).toLocaleString("en-IN")}</h3>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Completed Passout</p>
            <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{stats.completedStudents || 0}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Google-Style Search Bar with Multi-Filters & Auto-Complete */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 relative z-20">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
          <div ref={searchContainerRef} className="flex-1 w-full relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  onFocus={() => search.trim().length >= 2 && setShowSuggestions(true)}
                  placeholder="Search student by name, mobile, ID, course or admission number..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-medium shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
              >
                Search
              </button>
            </form>

            {/* AUTO-COMPLETE SUGGESTIONS DROPDOWN */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-blue-800/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Search className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Matching Student Results</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Click student to view profile</span>
                </div>
                {suggestions.map((s) => {
                  const st = s.status || "ACTIVE";
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSuggestion(s)}
                      className="p-3 hover:bg-slate-100 dark:hover:bg-slate-900/80 cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {(s.fullName || "S")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{toTitleCase(s.fullName)}</p>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${st === "ACTIVE"
                                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                  : st === "REVISION"
                                    ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                    : st === "ON_HOLD"
                                      ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                      : st === "COMPLETED"
                                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                        : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                }`}
                            >
                              {st === "ACTIVE"
                                ? "🟢 ACTIVE"
                                : st === "REVISION"
                                  ? "🔄 REVISION"
                                  : st === "ON_HOLD"
                                    ? "🟡 ON HOLD"
                                    : st === "COMPLETED"
                                      ? "🔵 COMPLETED"
                                      : "🔴 INACTIVE"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Mobile: {s.mobile} • Course: {s.admission?.courseNameSnapshot || "N/A"}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-800 shrink-0">
                        {s.studentId}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Multi-Filters & Sorting Controls Organized Grid */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              <Filter className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span>Directory Filters</span>
              {(statusFilter || departmentFilter || programFilter || courseFilter || paymentFilter) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-cyan-950 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800">
                  Filtered
                </span>
              )}
            </div>

            {(statusFilter || departmentFilter || programFilter || courseFilter || paymentFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("");
                  setDepartmentFilter("");
                  setProgramFilter("");
                  setCourseFilter("");
                  setPaymentFilter("");
                }}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition flex items-center space-x-1"
              >
                <span>Reset Filters ✕</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Academic Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-semibold truncate shadow-sm"
            >
              <option value="">All Statuses ({stats.totalStudents || 0})</option>
              <option value="ACTIVE">🟢 ACTIVE ({stats.statusCounts?.ACTIVE ?? stats.activeStudents ?? 0})</option>
              <option value="ON_HOLD">🟡 ON HOLD ({stats.statusCounts?.ON_HOLD ?? 0})</option>
              <option value="COMPLETED">🔵 COMPLETED ({stats.statusCounts?.COMPLETED ?? stats.completedStudents ?? 0})</option>
              <option value="DROPPED">🔴 DROPPED ({stats.statusCounts?.DROPPED ?? 0})</option>
              <option value="TRANSFERRED">TRANSFERRED ({stats.statusCounts?.TRANSFERRED ?? 0})</option>
            </select>

            {/* Level 1: Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setProgramFilter("");
                setCourseFilter("");
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-semibold truncate shadow-sm"
            >
              <option value="">🏛️ All Departments</option>
              {departmentsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Level 2: Program / Degree Filter */}
            <select
              value={programFilter}
              onChange={(e) => {
                setProgramFilter(e.target.value);
                setCourseFilter("");
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-semibold truncate shadow-sm"
            >
              <option value="">🎓 All Programs</option>
              {availablePrograms.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>

            {/* Level 3: Semester / Specific Course Filter */}
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-semibold truncate shadow-sm"
            >
              <option value="">
                📖 All Courses ({coursesInProgram.reduce((acc, c) => acc + (c.stats?.totalStudents || c.stats?.activeStudents || 0), 0)})
              </option>
              {coursesInProgram
                .slice()
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((c) => {
                  const count = c.stats?.totalStudents || c.stats?.activeStudents || 0;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count})
                    </option>
                  );
                })}
            </select>

            {/* Payment / Dues Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-semibold truncate shadow-sm"
            >
              <option value="">All Payment Statuses</option>
              <option value="PENDING">⚠️ Has Pending Dues</option>
              <option value="CLEARED">✓ Fees Fully Cleared</option>
            </select>

            {/* Sort & Fields Customizer */}
            <div className="flex items-center space-x-1.5 w-full">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-blue-600 dark:text-cyan-400 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-bold truncate min-w-0 shadow-sm"
              >
                <option value="name_asc">🟢 Active & Name (A-Z)</option>
                <option value="name_desc">🟢 Active & Name (Z-A)</option>
                <option value="newest">Newest Registrations</option>
                <option value="oldest">Oldest Registrations</option>
                <option value="pending_desc">Highest Pending Dues</option>
                <option value="pending_asc">Lowest Pending Dues</option>
              </select>

              {/* DYNAMIC COLUMN / FIELD CUSTOMIZER POPOVER */}
              <div ref={columnCustomizerRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
                  className={`px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-sm ${showColumnCustomizer ? "border-blue-500 dark:border-cyan-500 text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/40" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  title="Customize Display Columns & Fields"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <span className="hidden min-[400px]:inline">Fields ({Object.values(columns).filter(Boolean).length})</span>
                </button>

                {showColumnCustomizer && (
                  <div className="absolute right-0 top-11 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-cyan-800/80 rounded-2xl shadow-2xl p-4 z-50 space-y-3 font-sans text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-blue-600 dark:text-cyan-400 uppercase text-[10px] tracking-wider">
                        Display Columns / Fields
                      </span>
                      <button onClick={() => setShowColumnCustomizer(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.fullName}
                          onChange={(e) => setColumns({ ...columns, fullName: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 dark:text-cyan-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-bold">Student Name & Contact</span>
                      </label>

                      <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.course}
                          onChange={(e) => setColumns({ ...columns, course: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 dark:text-cyan-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-bold">Enrolled Course(s)</span>
                      </label>

                      <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.pendingAmount}
                          onChange={(e) => setColumns({ ...columns, pendingAmount: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 dark:text-cyan-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Pending Dues Balance (₹)</span>
                      </label>

                      <label className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.status}
                          onChange={(e) => setColumns({ ...columns, status: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 dark:text-cyan-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-bold">Academic Status</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
      {loading ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <LoadingSpinner label="Fetching student directory..." />
        </div>
      ) : students.length === 0 ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <EmptyState
            title="No Students Found"
            description="Try adjusting your search criteria or filter options."
          />
        </div>
      ) : viewMode === "table" ? (
        /* TABLE LIST VIEW — INSIDE CARD CONTAINER */
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left text-sm text-slate-800 dark:text-slate-200 min-w-[850px]">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 w-10 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedStudentIds.length === students.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 whitespace-nowrap">Student Name</th>
                  <th className="p-3.5 whitespace-nowrap">Enrolled Course(s)</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Pending Dues Balance (₹)</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Academic Status</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                {students.map((student) => {
                  const totalFees = Number(student.admission?.finalFees || student.admission?.courseFees || 0);
                  const paidAmount = Number(student.admission?.paidAmount || 0);
                  const pendingAmount = Number(student.admission?.pendingAmount || 0);
                  const isSelected = selectedStudentIds.includes(student.id);
                  const st = student.status || "ACTIVE";

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${isSelected ? "bg-blue-50/70 dark:bg-blue-950/20" : ""
                        }`}
                    >
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleSelect(student.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 dark:text-cyan-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* 1. STUDENT NAME & CONTACT */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-cyan-950 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800 flex items-center justify-center font-bold text-sm shrink-0">
                            {student.fullName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <a
                              href={`/dashboard/students/${student.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm text-left transition inline-flex items-center space-x-1"
                            >
                              <span>{toTitleCase(student.fullName)}</span>
                              <ExternalLink className="w-3 h-3 text-blue-500 dark:text-cyan-400/80 inline shrink-0" />
                            </a>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <a
                                href={`/dashboard/students/${student.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] font-bold text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950 hover:bg-blue-100 dark:hover:bg-cyan-900 px-1.5 py-0.5 rounded border border-blue-200 dark:border-cyan-800/80 transition"
                              >
                                {student.studentId}
                              </a>
                              <span className="text-slate-500 text-xs font-mono">
                                📞 {student.mobile}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. ENROLLED COURSE(S) */}
                      <td className="p-3.5 text-xs whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span
                            className="px-2.5 py-1 bg-blue-50 dark:bg-cyan-950 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800 rounded-xl text-xs font-bold truncate max-w-[220px]"
                          >
                            {student.courseInfo?.primaryCourse || student.admission?.courseNameSnapshot || "General Course"}
                          </span>
                          {student.courseInfo?.extraCoursesCount > 0 && (
                            <a
                              href={`/dashboard/students/${student.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[10px] font-extrabold cursor-pointer transition shadow-sm hover:scale-105 inline-flex items-center space-x-0.5"
                            >
                              <span>+ {student.courseInfo.extraCoursesCount} more</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 3. PENDING DUES BALANCE (₹) */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {pendingAmount > 0 ? (
                          <div>
                            <span className="font-extrabold text-amber-400 text-sm bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg inline-block">
                              ₹{pendingAmount.toLocaleString("en-IN")} Due
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              Paid: ₹{paidAmount.toLocaleString("en-IN")} / Total: ₹{totalFees.toLocaleString("en-IN")}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 font-mono">
                              Total Paid: ₹{paidAmount.toLocaleString("en-IN")}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. ACADEMIC STATUS */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${st === "ACTIVE"
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : st === "ON_HOLD"
                                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : st === "COMPLETED"
                                  ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                  : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                            }`}
                        >
                          {st === "ACTIVE"
                            ? "🟢 ACTIVE"
                            : st === "ON_HOLD"
                              ? "🟡 ON HOLD"
                              : st === "COMPLETED"
                                ? "🔵 COMPLETED"
                                : "🔴 DROPPED"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-3.5 text-center space-x-1.5 whitespace-nowrap">
                        <a
                          href={`/dashboard/students/${student.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white rounded-xl font-bold text-xs inline-flex items-center space-x-1 transition cursor-pointer border border-blue-200 dark:border-blue-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View ↗</span>
                        </a>

                        <button
                          onClick={() => handleOpenCollectFee(student)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg font-bold text-xs inline-flex items-center space-x-1 transition"
                          title="Quick Fee Collection"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Fee</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                          title="Edit Student Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar for Table */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Showing page <strong className="text-slate-900 dark:text-white">{pagination.page}</strong> of{" "}
                <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong> ({pagination.total} unique students)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchStudents(pagination.page - 1)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 font-bold shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchStudents(pagination.page + 1)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 font-bold shadow-sm"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GRID CARDS VIEW — DIRECTLY ON PAGE BACKGROUND WITH NO OUTER CONTAINER CARD */
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {students.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              const st = student.status || "ACTIVE";

              return (
                <div
                  key={student.id}
                  className={`p-5 bg-white dark:bg-slate-900 border rounded-2xl space-y-4 relative flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                    isSelected
                      ? "border-blue-500 dark:border-cyan-500 bg-blue-50/40 dark:bg-cyan-950/20 shadow-md ring-1 ring-blue-500/30"
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-cyan-500/50"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Checkbox + Student ID (Left) ... Status Pill (Right) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(student.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 dark:text-cyan-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-cyan-800/80">
                          {student.studentId}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          st === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80"
                            : st === "COMPLETED"
                              ? "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80"
                              : st === "DROPPED"
                                ? "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/80"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {st}
                      </span>
                    </div>

                    {/* Student Profile & Course Section */}
                    <div className="pt-1">
                      <a
                        href={`/dashboard/students/${student.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug hover:text-blue-600 dark:hover:text-cyan-400 transition-colors inline-flex items-center space-x-1.5"
                      >
                        <span>{toTitleCase(student.fullName)}</span>
                      </a>

                      <div className="flex items-center space-x-1.5 mt-1.5 flex-wrap gap-y-1">
                        <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-md text-[11px] font-semibold truncate max-w-[210px]">
                          {student.courseInfo?.primaryCourse || student.admission?.courseNameSnapshot || "General Course"}
                        </span>
                        {student.courseInfo?.extraCoursesCount > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                            }}
                            className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-md text-[10px] font-extrabold cursor-pointer transition shadow-2xs"
                          >
                            + {student.courseInfo.extraCoursesCount} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold">
                        <Phone className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
                        <a href={`tel:${student.mobile}`} className="hover:underline hover:text-blue-600 dark:hover:text-cyan-400">
                          {student.mobile}
                        </a>
                      </div>
                      {student.email && (
                        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs overflow-hidden">
                          <Mail className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                          <span className="truncate font-medium">{student.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons (Compact, non-stretched Profile button) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap sm:flex-nowrap mt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenCollectFee(student)}
                      className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Fee</span>
                    </button>
                    <a
                      href={`/dashboard/students/${student.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-600 text-blue-700 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile ↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(student)}
                      className="px-3 py-2 bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-600 text-amber-700 dark:text-amber-400 hover:text-white border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Bar for Grid View */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Showing page <strong className="text-slate-900 dark:text-white">{pagination.page}</strong> of{" "}
                <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong> ({pagination.total} unique students)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchStudents(pagination.page - 1)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 font-bold shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchStudents(pagination.page + 1)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 font-bold shadow-sm"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUICK COLLECT FEE MODAL */}
      {collectFeeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 font-sans">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Collect Student Fee</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{toTitleCase(collectFeeStudent.fullName)} ({collectFeeStudent.studentId})</p>
              </div>
              <button onClick={() => setCollectFeeStudent(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feeError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{feeError}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Enrolled Course:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {collectFeeStudent.courseInfo?.primaryCourse || collectFeeStudent.admission?.courseNameSnapshot}
                </span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                <span>Current Pending Balance:</span>
                <span>₹{Number(collectFeeStudent.admission?.pendingAmount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <form onSubmit={handleCollectFeeSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    placeholder="Enter amount paid"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-bold text-base"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={feeForm.paymentDate || ""}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentDate: e.target.value })}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={feeForm.paymentMode}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI / GPAY</option>
                    <option value="CARD">CARD</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Txn Ref / Receipt No</label>
                  <input
                    type="text"
                    value={feeForm.transactionReference}
                    onChange={(e) => setFeeForm({ ...feeForm, transactionReference: e.target.value })}
                    placeholder="Optional ref"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={feeForm.remarks}
                  onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                  placeholder="Installment payment note..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-cyan-950 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{toTitleCase(selectedStudent.fullName)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-blue-600 dark:text-cyan-400 font-bold">
                      {selectedStudent.studentId}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Academic Status: <strong className="text-emerald-600 dark:text-emerald-400">{selectedStudent.status}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <button
                  onClick={() => {
                    const s = selectedStudent;
                    handleOpenAddCourse(s);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition border border-indigo-200 dark:border-transparent"
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
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition border border-emerald-200 dark:border-transparent"
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
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-600 text-amber-700 dark:text-amber-400 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition border border-amber-200 dark:border-transparent"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteStudent(selectedStudent.id, selectedStudent.fullName)}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                    title="Delete student record (Super Admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>
                )}
              </div>
            </div>

            {/* TAB CONTROLS */}
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("courses")}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer active:scale-95 ${activeTab === "courses" ? "bg-cyan-600 text-white shadow-md font-bold" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                  }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Enrolled Courses ({fullStudentData?.allAdmissions?.length || 1})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer active:scale-95 ${activeTab === "payments" ? "bg-emerald-600 text-white shadow-md font-bold" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                  }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Payment Receipts ({fullStudentData?.allPayments?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("attendance")}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer active:scale-95 ${activeTab === "attendance" ? "bg-indigo-600 text-white shadow-md font-bold" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
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
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> Complete Enrolled Courses Timeline
                    </h4>

                    <div className="space-y-3">
                      {(fullStudentData?.allAdmissions || [selectedStudent.admission]).filter(Boolean).map((adm, idx) => {
                        const admStatus = adm.status || "ACTIVE";
                        return (
                          <div key={adm.id || idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {adm.courseNameSnapshot || adm.course?.name || "General Course"}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${admStatus === "ACTIVE"
                                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                    : admStatus === "COMPLETED"
                                      ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                      : admStatus === "DROPPED"
                                        ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                        : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                  }`}>
                                  {admStatus}
                                </span>
                              </div>

                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/80 border border-blue-200 dark:border-cyan-800/80 px-2.5 py-0.5 rounded-full">
                                {adm.admissionNumber}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Joining Date</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{formatDate(adm.admissionDate)}</span>
                              </div>

                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Course Fees</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">₹{Number(adm.finalFees || adm.courseFees).toLocaleString("en-IN")}</span>
                              </div>

                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Paid Fee</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{Number(adm.paidAmount).toLocaleString("en-IN")}</span>
                              </div>

                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Pending Balance</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">₹{Number(adm.pendingAmount).toLocaleString("en-IN")}</span>
                              </div>
                            </div>

                            {/* COURSE ACTION TOOLBAR: STOP/DROP, COMPLETE, DELETE */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-900 flex items-center justify-between text-xs">
                              <span className="text-[10px] text-slate-500 font-semibold">Course Actions:</span>
                              <div className="flex items-center space-x-2">
                                {admStatus === "ACTIVE" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleCourseStatusChange(adm.id, "DROPPED")}
                                      className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-200 dark:border-rose-800 rounded-lg font-bold text-[11px] transition"
                                      title="Stop or Drop this specific course"
                                    >
                                      🛑 Stop / Drop Course
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCourseStatusChange(adm.id, "COMPLETED")}
                                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white border border-blue-200 dark:border-blue-800 rounded-lg font-bold text-[11px] transition"
                                      title="Mark this course completed"
                                    >
                                      ✓ Complete
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleCourseStatusChange(adm.id, "ACTIVE")}
                                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold text-[11px] transition"
                                    title="Re-activate this course"
                                  >
                                    ▶ Re-Activate Course
                                  </button>
                                )}

                                {isSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCourseAdmission(adm.id, adm.courseNameSnapshot || adm.course?.name || "Course")}
                                    className="px-2 py-1 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800 rounded-lg text-[11px] transition font-bold"
                                    title="Delete this course enrollment record"
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 font-bold">
                            <tr>
                              <th className="py-2.5 px-3">Receipt / Ref</th>
                              <th className="py-2.5 px-3">Course</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Mode</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3 text-center">Print</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {fullStudentData.allPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-cyan-400">
                                  {p.transactionReference || `REC-${p.id ? p.id.slice(-6).toUpperCase() : "PAYMENT"}`}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                                  {p.courseName || "Course"}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                                  {formatDate(p.paymentDate || p.createdAt)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded font-bold uppercase text-[10px]">
                                    {p.paymentMode || "CASH"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                  ₹{Number(p.amount).toLocaleString("en-IN")}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={() => setSelectedReceiptPayment(p)}
                                    className="px-2.5 py-1 bg-blue-50 dark:bg-cyan-600/20 hover:bg-blue-600 dark:hover:bg-cyan-600 text-blue-700 dark:text-cyan-300 hover:text-white border border-blue-200 dark:border-cyan-800/80 rounded-lg font-bold text-[11px] inline-flex items-center space-x-1 cursor-pointer active:scale-95 transition shadow-2xs"
                                  >
                                    <Printer className="w-3 h-3" />
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
                )}

                {/* TAB 3: ATTENDANCE HISTORY & STATS */}
                {activeTab === "attendance" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Attendance Rate</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {fullStudentData?.attendanceStats?.attendancePercentage || 100}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Present Days</span>
                        <span className="text-lg font-black text-blue-600 dark:text-cyan-400">
                          {fullStudentData?.attendanceStats?.presentCount || 0} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Absent Days</span>
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                          {fullStudentData?.attendanceStats?.absentCount || 0} Days
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Recent Attendance Log
                    </h4>

                    {(!fullStudentData?.attendanceStats?.recentLogs || fullStudentData.attendanceStats.recentLogs.length === 0) ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No attendance logs recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 font-bold">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {fullStudentData.attendanceStats.recentLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-300">
                                  {formatDate(log.date)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${log.status === "PRESENT"
                                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                      : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                    }`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 italic">
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

            {/* EXPANDED PERSONAL INFO CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">Father / Guardian</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" /> {selectedStudent.fatherName || selectedStudent.guardianName || "N/A"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">Mobile & WhatsApp</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {selectedStudent.mobile} {selectedStudent.whatsapp ? `(${selectedStudent.whatsapp})` : ""}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">Email Address</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" /> {selectedStudent.email || "N/A"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">Gender & DOB</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {selectedStudent.gender || "N/A"} {selectedStudent.dob ? `• ${formatDate(selectedStudent.dob)}` : ""}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">Qualification & School/College</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  {selectedStudent.qualification || "N/A"} {selectedStudent.schoolCollege ? `(${selectedStudent.schoolCollege})` : ""}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">Full Address</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  {[selectedStudent.address, selectedStudent.city, selectedStudent.state].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT STUDENT & FEES MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 my-8 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Student Profile & Fee Structure</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{toTitleCase(editingStudent.fullName)} ({editingStudent.studentId})</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
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
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Academic Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-bold text-blue-600 dark:text-cyan-400"
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
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  Fee Structure Correction
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Course Fee (₹)</label>
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
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Discount (₹)</label>
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
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Net Final Fee (₹)</label>
                    <input
                      type="number"
                      value={editForm.finalFees}
                      onChange={(e) => setEditForm({ ...editForm, finalFees: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-blue-600 dark:text-cyan-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="Reason for edit or fee correction..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700"
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 my-8 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Enroll in New Course
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{toTitleCase(addCourseStudent.fullName)} ({addCourseStudent.studentId})</p>
              </div>
              <button onClick={() => setAddCourseStudent(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addCourseError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{addCourseError}</span>
              </div>
            )}

            <form onSubmit={handleAddCourseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Select New Course *</label>
                <SearchableSelect
                  options={coursesList.map((c) => ({
                    value: c.id,
                    label: `${c.name} (${c.code})`,
                    subLabel: `Fee: ₹${Number(c.fees).toLocaleString("en-IN")}`,
                  }))}
                  value={addCourseForm.courseId}
                  onChange={(_, val) => handleSelectAddCourse(val)}
                  placeholder="-- Search & Choose Course --"
                  searchPlaceholder="Type Python, Web Dev, Code..."
                  required
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Course Fees Breakdown
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Course Fee (₹)</label>
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
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Discount (₹)</label>
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
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Net Final Fee (₹)</label>
                    <input
                      type="number"
                      value={addCourseForm.finalFees}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, finalFees: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-blue-600 dark:text-cyan-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Initial Down Payment (Optional)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Down Payment (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={addCourseForm.paymentAmount}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, paymentAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={addCourseForm.paymentDate}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, paymentDate: e.target.value })}
                      onClick={(e) => e.target.showPicker?.()}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Payment Mode</label>
                    <select
                      value={addCourseForm.paymentMode}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100"
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI / GPAY</option>
                      <option value="CARD">CARD</option>
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Txn Ref / Receipt No</label>
                    <input
                      type="text"
                      value={addCourseForm.transactionReference}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, transactionReference: e.target.value })}
                      placeholder="Optional ref"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={addCourseForm.remarks}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, remarks: e.target.value })}
                  placeholder="Note for second course admission..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCourseStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700"
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
