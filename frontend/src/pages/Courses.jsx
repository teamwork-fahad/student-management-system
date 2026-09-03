import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Clock,
  CreditCard,
  Search,
  Edit,
  CheckCircle,
  XCircle,
  X,
  LayoutGrid,
  List,
  Filter,
  Save,
  Tag,
  Zap,
  Users,
  UserCheck,
  GraduationCap,
  Phone,
  ExternalLink,
  Trash2,
  Building2,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export const COURSE_CATEGORIES = [
  "College Syllabus",
  "School Course",
  "IT Course",
  "AI Related",
  "Basic Course",
  "Professional Course",
  "Other",
];

const STATIC_COURSE_CATEGORIES = COURSE_CATEGORIES;

export const Courses = ({ defaultTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const isDepartmentsRoute = defaultTab === "departments" || location.pathname.includes("/departments");
  const [activeTab, setActiveTab] = useState(isDepartmentsRoute ? "departments" : "courses");

  useEffect(() => {
    if (defaultTab === "departments" || location.pathname.includes("/departments")) {
      setActiveTab("departments");
    }
  }, [location.pathname, defaultTab]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  // Default View Mode: 'table' (List View by default)
  const [viewMode, setViewMode] = useState("table");

  // Pagination State (10 courses per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Create Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [category, setCategory] = useState("IT Course");
  const [duration, setDuration] = useState(3);
  const [durationType, setDurationType] = useState("MONTHS");
  const [fees, setFees] = useState(15000);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Course Modal State (Super Admin)
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    category: "IT Course",
    departmentId: "",
    duration: 3,
    durationType: "MONTHS",
    fees: 5000,
    description: "",
  });

  // Department Management Modal State (Super Admin CRUD)
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
  const [deptError, setDeptError] = useState("");
  const [submittingDept, setSubmittingDept] = useState(false);

  // Course Students Detail Modal State
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [studentsModalFilter, setStudentsModalFilter] = useState("ACTIVE"); // 'ACTIVE' | 'COMPLETED' | 'ALL'
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [modalStudentSearch, setModalStudentSearch] = useState("");
  const [selectedAdmissionIds, setSelectedAdmissionIds] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, [sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter, programFilter, courseFilter, sortBy]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments?includeInactive=true");
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setDeptError("");
    setSubmittingDept(true);
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, deptForm);
      } else {
        await api.post("/departments", deptForm);
      }
      setDeptForm({ name: "", code: "", description: "" });
      setEditingDept(null);
      fetchDepartments();
      fetchCourses();
    } catch (err) {
      setDeptError(err.response?.data?.message || "Failed to save department");
    } finally {
      setSubmittingDept(false);
    }
  };

  const handleToggleDeptStatus = async (dept) => {
    try {
      await api.put(`/departments/${dept.id}`, { isActive: !dept.isActive });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update department status");
    }
  };

  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete department "${dept.name}"?`)) return;
    try {
      await api.delete(`/departments/${dept.id}`);
      fetchDepartments();
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete department");
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses", {
        params: {
          sortBy,
          search: search || undefined,
        },
      });
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  const openCourseStudentsModal = async (course, initialFilter = "ACTIVE") => {
    setSelectedCourseForStudents(course);
    setStudentsModalFilter(initialFilter);
    setModalStudentSearch("");
    setSelectedAdmissionIds([]);
    fetchCourseStudents(course.id, initialFilter);
  };

  const fetchCourseStudents = async (courseId, statusFilter) => {
    setLoadingStudents(true);
    try {
      const res = await api.get(`/courses/${courseId}/students`, {
        params: { status: statusFilter },
      });
      setCourseStudents(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch course students", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStatusFilterChange = (newStatus) => {
    setStudentsModalFilter(newStatus);
    setSelectedAdmissionIds([]);
    if (selectedCourseForStudents) {
      fetchCourseStudents(selectedCourseForStudents.id, newStatus);
    }
  };

  const handleToggleSelectAdmission = (admissionId) => {
    setSelectedAdmissionIds((prev) =>
      prev.includes(admissionId)
        ? prev.filter((id) => id !== admissionId)
        : [...prev, admissionId]
    );
  };

  const handleSelectAllModalStudents = () => {
    const visibleIds = filteredModalStudents.map((s) => s.admissionId || s.id);
    const allSelected = visibleIds.every((id) => selectedAdmissionIds.includes(id));
    if (allSelected) {
      setSelectedAdmissionIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedAdmissionIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkStatusSubmit = async (newStatus) => {
    if (selectedAdmissionIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to update course status to "${newStatus}" for ${selectedAdmissionIds.length} selected students?`
      )
    ) {
      return;
    }

    setBulkSubmitting(true);
    try {
      await api.post("/admissions/bulk-status", {
        admissionIds: selectedAdmissionIds,
        status: newStatus,
      });

      setSelectedAdmissionIds([]);
      if (selectedCourseForStudents) {
        fetchCourseStudents(selectedCourseForStudents.id, studentsModalFilter);
      }
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update bulk course status.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    // Front-end Pre-validation Guard
    const studentCount = course.stats?.totalStudents || 0;
    if (studentCount > 0) {
      alert(
        `CANNOT DELETE COURSE!\n\nThere are ${studentCount} student(s) currently enrolled under "${course.name}".\n\nPlease transfer or reassign these students to another course before deleting.`
      );
      openCourseStudentsModal(course, "ALL");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete course "${course.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/courses/${course.id}`);
      alert(`Course "${course.name}" deleted successfully.`);
      fetchCourses();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete course.";
      alert(msg);
    }
  };

  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState("IT Course");

  const handleToggleSelectCourse = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAllCourses = () => {
    const visibleIds = filteredCourses.map((c) => c.id);
    const allSelected = visibleIds.every((id) => selectedCourseIds.includes(id));
    if (allSelected) {
      setSelectedCourseIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDeleteCoursesSubmit = async () => {
    if (selectedCourseIds.length === 0) return;

    // Front-end validation guard: Check if any selected course has enrolled students
    const blockedCourses = courses.filter(
      (c) => selectedCourseIds.includes(c.id) && (c.stats?.totalStudents || 0) > 0
    );

    if (blockedCourses.length > 0) {
      const names = blockedCourses.map((c) => c.name).join(", ");
      alert(
        `CANNOT DELETE SELECTED COURSES!\n\nThe following course(s) have active enrolled students:\n[ ${names} ]\n\nPlease transfer or reassign students to another course before deleting.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedCourseIds.length} selected courses?`)) {
      return;
    }

    try {
      await api.post("/courses/bulk-delete", { courseIds: selectedCourseIds });
      alert(`${selectedCourseIds.length} courses deleted successfully.`);
      setSelectedCourseIds([]);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete selected courses.");
    }
  };

  const handleBulkCategorySubmit = async () => {
    if (selectedCourseIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to change Department / Category to "${bulkCategoryTarget}" for ${selectedCourseIds.length} selected courses?`
      )
    ) {
      return;
    }

    try {
      await api.post("/courses/bulk-category", {
        courseIds: selectedCourseIds,
        category: bulkCategoryTarget,
      });
      alert(`Department category updated to "${bulkCategoryTarget}" for ${selectedCourseIds.length} courses.`);
      setSelectedCourseIds([]);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update course categories.");
    }
  };

  // Smart Auto-Generator for Course Code
  const generateCourseCode = (nameStr = courseName) => {
    const nextNum = (courses.length || 0) + 1;
    if (!nameStr || !nameStr.trim()) {
      return `CRS-${nextNum}`;
    }

    const cleanWords = nameStr
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    let prefix = "CRS";
    if (cleanWords.length === 1) {
      prefix = `CRS-${cleanWords[0].slice(0, 6)}`;
    } else if (cleanWords.length > 1) {
      prefix = `CRS-${cleanWords.map((w) => w.slice(0, 3)).join("-").slice(0, 10)}`;
    }

    return `${prefix}-${nextNum}`;
  };

  const handleCourseNameChange = (e) => {
    const nameVal = e.target.value;
    setCourseName(nameVal);
    // Auto-update course code in real-time
    setCourseCode(generateCourseCode(nameVal));
  };

  const openCreateModal = () => {
    setCourseName("");
    setCourseCode(generateCourseCode(""));
    setCategory("IT Course");
    setDuration(3);
    setDurationType("MONTHS");
    setFees(15000);
    setDescription("");
    setIsModalOpen(true);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const finalCode = courseCode.trim() || generateCourseCode(courseName);

    if (!courseName || !finalCode || !fees) return;

    setSubmitting(true);
    try {
      await api.post("/courses", {
        name: courseName,
        code: finalCode,
        category: category || "IT Course",
        duration: Number(duration),
        durationType: durationType,
        fees: Number(fees),
        description: description,
      });
      setIsModalOpen(false);
      fetchCourses();
      setCourseName("");
      setCourseCode("");
      setCategory("IT Course");
      setFees(15000);
      setDescription("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (c) => {
    setEditingCourse(c);
    setEditForm({
      name: c.name,
      code: c.code,
      category: c.category || "IT Course",
      duration: c.duration,
      durationType: c.durationType,
      fees: c.fees,
      description: c.description || "",
    });
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    setSubmitting(true);
    try {
      await api.put(`/courses/${editingCourse.id}`, {
        name: editForm.name,
        code: editForm.code,
        category: editForm.category,
        duration: Number(editForm.duration),
        durationType: editForm.durationType,
        fees: Number(editForm.fees),
        description: editForm.description,
      });
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update course");
    } finally {
      setSubmitting(false);
    }
  };

  // 3-Level Cascading Calculations for Courses page
  const coursesInDept = courses.filter((c) => {
    if (!departmentFilter) return true;
    return (
      c.departmentId === departmentFilter ||
      c.department?.id === departmentFilter ||
      c.department?.name === departmentFilter
    );
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

  const filteredCourses = courses
    .filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q) ||
        (c.department?.name || "").toLowerCase().includes(q);

      const matchesDept =
        !departmentFilter ||
        c.departmentId === departmentFilter ||
        c.department?.id === departmentFilter ||
        c.department?.name === departmentFilter;

      const matchesProgram =
        !programFilter || (c.category || "") === programFilter;

      const matchesCourse = !courseFilter || c.id === courseFilter;

      return matchesSearch && matchesDept && matchesProgram && matchesCourse;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortBy === "students_desc") {
        return (b.stats?.totalStudents || 0) - (a.stats?.totalStudents || 0);
      }
      if (sortBy === "students_asc") {
        return (a.stats?.totalStudents || 0) - (b.stats?.totalStudents || 0);
      }
      if (sortBy === "fee_desc") {
        return Number(b.fees || 0) - Number(a.fees || 0);
      }
      if (sortBy === "fee_asc") {
        return Number(a.fees || 0) - Number(b.fees || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "duration_desc") {
        return Number(b.duration || 0) - Number(a.duration || 0);
      }
      return (a.name || "").localeCompare(b.name || "");
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

  const filteredModalStudents = courseStudents.filter((s) => {
    // Filter by tab status (ACTIVE | COMPLETED | DROPPED | CANCELLED | ALL)
    const matchesStatus =
      studentsModalFilter === "ALL" ||
      s.status === studentsModalFilter ||
      s.studentStatus === studentsModalFilter;
    if (!matchesStatus) return false;

    if (!modalStudentSearch.trim()) return true;
    const q = modalStudentSearch.toLowerCase().trim();
    return (
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.studentId || "").toLowerCase().includes(q) ||
      (s.mobile || "").toLowerCase().includes(q) ||
      (s.admissionNumber || "").toLowerCase().includes(q)
    );
  });

  const totalCourses = courses.length;
  const totalActiveStudents = courses.reduce(
    (sum, c) => sum + (c.stats?.activeStudents || 0),
    0
  );
  const totalCompletedStudents = courses.reduce(
    (sum, c) => sum + (c.stats?.completedStudents || 0),
    0
  );
  const totalEnrolledStudents = courses.reduce(
    (sum, c) => sum + (c.stats?.totalStudents || 0),
    0
  );

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case "School Course":
        return "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80";
      case "AI Related":
        return "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80";
      case "Basic Course":
        return "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80";
      case "Professional Course":
        return "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80";
      case "IT Course":
      default:
        return "bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/80";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Main Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("courses");
            if (location.pathname.includes("/departments")) {
              navigate("/dashboard/courses");
            }
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === "courses"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>All Courses List</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "courses" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
            {totalCourses}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("departments");
            if (!location.pathname.includes("/departments")) {
              navigate("/dashboard/courses/departments");
            }
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === "departments"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "departments" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
            {departments.length}
          </span>
        </button>
      </div>

      {activeTab === "courses" ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Course Catalog & Department Categories
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage academic programs, department categories, tuition fees, and duration.
              </p>
            </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle Switch (Table View Default) */}
          <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === "table" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Table List View (Default)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === "grid" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid View</span>
            </button>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setDeptForm({ name: "", code: "", description: "" });
                setEditingDept(null);
                setDeptError("");
                setIsDeptModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl shadow-sm flex items-center space-x-2 transition"
            >
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Manage Departments</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Courses</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white whitespace-nowrap">{totalCourses}</h3>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Active Students</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{totalActiveStudents}</h3>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-2.5 sm:p-3 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/80 rounded-2xl text-purple-600 dark:text-purple-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Completed / Passout</p>
            <h3 className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-300 whitespace-nowrap">{totalCompletedStudents}</h3>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
          <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Enrolled</p>
            <h3 className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">{totalEnrolledStudents}</h3>
          </div>
        </div>
      </div>

      {/* Search & Department Category Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm">
        {/* Search Bar Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course by name, code or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-medium shadow-sm"
          />
        </div>

        {/* Organized Filter Controls Grid */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              <Filter className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span>Catalog Filters</span>
              {(departmentFilter || programFilter || courseFilter || sortBy !== "name_asc") && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-cyan-950 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800">
                  Filtered
                </span>
              )}
            </div>

            {(departmentFilter || programFilter || courseFilter || sortBy !== "name_asc") && (
              <button
                type="button"
                onClick={() => {
                  setDepartmentFilter("");
                  setProgramFilter("");
                  setCourseFilter("");
                  setSortBy("name_asc");
                }}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition flex items-center space-x-1"
              >
                <span>Reset Filters ✕</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Sort By Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-semibold truncate shadow-xs cursor-pointer"
            >
              <option value="name_asc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🔤 Name (A to Z)</option>
              <option value="name_desc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🔤 Name (Z to A)</option>
              <option value="students_desc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">👥 Most Enrolled Students</option>
              <option value="students_asc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">👥 Least Enrolled Students</option>
              <option value="fee_desc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">💰 Highest Tuition Fee</option>
              <option value="fee_asc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">💰 Lowest Tuition Fee</option>
              <option value="newest" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🕒 Newest Added First</option>
              <option value="oldest" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🕒 Oldest Added First</option>
              <option value="duration_desc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">⏱️ Longest Duration</option>
            </select>

            {/* Level 1: Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setProgramFilter("");
                setCourseFilter("");
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-semibold truncate shadow-xs cursor-pointer"
            >
              <option value="" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🏛️ All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-semibold truncate shadow-xs cursor-pointer"
            >
              <option value="" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">🎓 All Programs</option>
              {availablePrograms.map((prog) => (
                <option key={prog} value={prog} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
                  {prog}
                </option>
              ))}
            </select>

            {/* Level 3: Semester / Specific Course Filter */}
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-semibold truncate shadow-xs cursor-pointer"
            >
              <option value="" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
                📖 All Courses ({coursesInProgram.length})
              </option>
              {coursesInProgram
                .slice()
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
                    {c.name} ({c.stats?.totalStudents || 0})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* BULK COURSE OPERATIONS TOOLBAR */}
      {isSuperAdmin && selectedCourseIds.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-blue-50 dark:bg-cyan-950/90 border border-blue-200 dark:border-cyan-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-blue-900 dark:text-cyan-200 bg-blue-100 dark:bg-cyan-900/80 px-3 py-1 rounded-xl border border-blue-200 dark:border-cyan-700">
              {selectedCourseIds.length} Course(s) Selected
            </span>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {/* Change Department / Category */}
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Department:</span>
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-bold cursor-pointer"
              >
                {COURSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkCategorySubmit}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer"
              >
                Apply Department
              </button>
            </div>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={handleBulkDeleteCoursesSubmit}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedCourseIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCourseIds([])}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Deselect All"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-500">Loading course catalog...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500">No courses matching your criteria.</div>
      ) : viewMode === "table" ? (
        /* TABLE LIST VIEW (DEFAULT VIEW) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  {isSuperAdmin && (
                    <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={
                          filteredCourses.length > 0 &&
                          filteredCourses.every((c) => selectedCourseIds.includes(c.id))
                        }
                        onChange={handleSelectAllCourses}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4 whitespace-nowrap">Course Details</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Enrolled Breakdown</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Total Students</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Tuition Fees</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200 font-medium">
                {paginatedCourses.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                      selectedCourseIds.includes(c.id) ? "bg-blue-50/70 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    {isSuperAdmin && (
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.includes(c.id)}
                          onChange={() => handleToggleSelectCourse(c.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{c.name}</div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-800/80">
                            {c.code}
                          </span>
                          <span className={`px-2 py-0.5 border rounded-md text-[10px] font-semibold ${getCategoryBadgeClass(c.category || "IT Course")}`}>
                            {c.category || "IT Course"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap max-w-full mx-auto">
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "ACTIVE")}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-2xs whitespace-nowrap"
                          title="View Active Students"
                        >
                          <UserCheck className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>Active: {c.stats?.activeStudents || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "COMPLETED")}
                          className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-2xs whitespace-nowrap"
                          title="View Completed Students"
                        >
                          <GraduationCap className="w-3 h-3 shrink-0 text-purple-600 dark:text-purple-400" />
                          <span>Done: {c.stats?.completedStudents || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "DROPPED")}
                          className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-2xs whitespace-nowrap"
                          title="View Dropped Students"
                        >
                          <span>Dropped: {c.stats?.droppedStudents || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "CANCELLED")}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-2xs whitespace-nowrap"
                          title="View Cancelled Students"
                        >
                          <span>Cancel: {c.stats?.cancelledStudents || 0}</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openCourseStudentsModal(c, "ALL")}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 rounded-xl font-extrabold text-xs transition cursor-pointer inline-flex items-center space-x-1 shadow-2xs whitespace-nowrap"
                        title="Click to view all enrolled students"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{c.stats?.totalStudents || 0}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm whitespace-nowrap">
                      ₹{Number(c.fees).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          c.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-600 text-amber-700 dark:text-amber-400 hover:text-white border border-amber-200 dark:border-amber-800 rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition whitespace-nowrap cursor-pointer shadow-2xs"
                        title="Edit Course Details"
                      >
                        <Edit className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit</span>
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteCourse(c)}
                          className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-600 text-rose-700 dark:text-rose-400 hover:text-white border border-rose-200 dark:border-rose-900/50 rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition whitespace-nowrap cursor-pointer shadow-2xs"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-blue-400 dark:hover:border-cyan-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-800">
                    {c.code}
                  </span>
                  <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${getCategoryBadgeClass(c.category || "IT Course")}`}>
                    {c.category || "IT Course"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.name}</h3>
                {c.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                )}
              </div>

              {/* Student Stats Summary for Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 my-2">
                <button
                  type="button"
                  onClick={() => openCourseStudentsModal(c, "ACTIVE")}
                  className="w-full flex items-center justify-between text-xs p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/90 transition cursor-pointer group"
                  title="Click to view Active Students list"
                >
                  <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Active Students
                  </span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/80 text-xs shadow-sm">
                    {c.stats?.activeStudents || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openCourseStudentsModal(c, "COMPLETED")}
                  className="w-full flex items-center justify-between text-xs p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/90 transition cursor-pointer group"
                  title="Click to view Completed Students list"
                >
                  <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-semibold flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Completed Passout
                  </span>
                  <span className="font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/80 text-xs shadow-sm">
                    {c.stats?.completedStudents || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openCourseStudentsModal(c, "ALL")}
                  className="w-full flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Click to view All Enrolled Students"
                >
                  <span>Total Admissions:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">{c.stats?.totalStudents || 0}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {c.duration} {c.durationType.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                    <span>₹{Number(c.fees).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="flex-1 py-2 bg-amber-50 dark:bg-slate-950 hover:bg-amber-600 dark:hover:bg-amber-600/20 text-amber-700 dark:text-slate-300 hover:text-white border border-amber-200 dark:border-slate-800 hover:border-amber-600 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteCourse(c)}
                      className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS BAR (10 COURSES PER PAGE) */}
      {filteredCourses.length > 0 && (
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-3 py-1.5 font-bold focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value={10} className="bg-white dark:bg-slate-950">10 courses per page</option>
              <option value={20} className="bg-white dark:bg-slate-950">20 courses per page</option>
              <option value={50} className="bg-white dark:bg-slate-950">50 courses per page</option>
              <option value={100} className="bg-white dark:bg-slate-950">100 courses per page</option>
            </select>
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-black">{indexOfFirstItem + 1}</strong> to{" "}
              <strong className="text-slate-900 dark:text-white font-black">{Math.min(indexOfLastItem, filteredCourses.length)}</strong> of{" "}
              <strong className="text-blue-600 dark:text-blue-400 font-black">{filteredCourses.length}</strong> courses
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-blue-500 font-bold transition disabled:opacity-40 shadow-sm cursor-pointer"
            >
              ◀ Prev
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                .map((p, idx, arr) => {
                  const prevP = arr[idx - 1];
                  const showEllipsis = prevP && p - prevP > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400 font-bold">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`px-3.5 py-1.5 rounded-2xl font-black text-xs transition cursor-pointer ${
                          p === validCurrentPage
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500 shadow-sm"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-blue-500 font-bold transition disabled:opacity-40 shadow-sm cursor-pointer"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
        </>
      ) : (
        /* DEPARTMENT MANAGEMENT VIEW */
        <div className="space-y-6">
          {/* Top Action & Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Academic Department Categories
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage academy streams, department codes, active statuses, and linked course programs.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setDeptForm({ name: "", code: "", description: "" });
                  setEditingDept(null);
                  setDeptError("");
                  setIsDeptModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 flex items-center space-x-2 transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Department</span>
              </button>
            )}
          </div>

          {/* Department KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Departments</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{departments.length}</h3>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Departments</p>
                <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {departments.filter((d) => d.isActive !== false).length}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 rounded-2xl text-purple-600 dark:text-purple-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Linked Courses</p>
                <h3 className="text-xl font-black text-purple-600 dark:text-purple-300">{courses.length}</h3>
              </div>
            </div>
          </div>

          {/* Departments Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => {
              const deptCourses = courses.filter(
                (c) => c.departmentId === dept.id || c.department?.id === dept.id || c.department?.name === dept.name || c.category === dept.name
              );
              const isActive = dept.isActive !== false;

              return (
                <div
                  key={dept.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          {dept.name}
                        </span>
                        {dept.code && (
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold rounded-lg uppercase">
                            {dept.code}
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      }`}>
                        {isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {dept.description || "Academic department stream for associated course programs."}
                    </p>

                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>{deptCourses.length} Course(s) Linked</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDepartmentFilter(dept.id);
                        setActiveTab("courses");
                        navigate("/dashboard/courses");
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/60 dark:hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>View Courses</span>
                    </button>

                    {isSuperAdmin && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDept(dept);
                            setDeptForm({ name: dept.name, code: dept.code || "", description: dept.description || "" });
                            setDeptError("");
                            setIsDeptModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDeptStatus(dept)}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                          title={isActive ? "Deactivate Department" : "Activate Department"}
                        >
                          {isActive ? <XCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDept(dept)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department-wise Courses Table Breakdown */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Department Course Breakdown</span>
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
              {departments.map((dept) => {
                const deptCourses = courses.filter(
                  (c) => c.departmentId === dept.id || c.department?.id === dept.id || c.department?.name === dept.name || c.category === dept.name
                );

                return (
                  <div key={dept.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          🏢 {dept.name}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg">
                          {deptCourses.length} course(s)
                        </span>
                      </div>
                    </div>

                    {deptCourses.length === 0 ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl text-xs text-slate-400 italic">
                        No active courses currently assigned to this department.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {deptCourses.map((c) => (
                          <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">{c.code}</span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{c.name}</h4>
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                ₹{Number(c.fees).toLocaleString("en-IN")} • {c.duration} {c.durationType}
                              </span>
                            </div>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(c)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                                title="Edit Course"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL WITH AUTO-GENERATED CODE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-cyan-400" /> Create New Academic Course
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={handleCourseNameChange}
                  placeholder="e.g. Master in Python & AI Development"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-bold placeholder-slate-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Course Code (Auto-Generated) *</label>
                  <button
                    type="button"
                    onClick={() => setCourseCode(generateCourseCode(courseName))}
                    className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-blue-600 dark:text-cyan-400 outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category / Department *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 font-semibold"
                >
                  {COURSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration Unit</label>
                  <select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  >
                    <option value="DAYS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Days</option>
                    <option value="WEEKS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Weeks</option>
                    <option value="MONTHS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Months</option>
                    <option value="YEARS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Course summary and subjects..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 resize-none placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? "Creating..." : "Save Course"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Edit Course Details
              </h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">Course Code *</label>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, code: generateCourseCode(editForm.name) })}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Re-Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-amber-700 dark:text-amber-400 outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category / Department *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-semibold"
                  >
                    {COURSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration Unit</label>
                  <select
                    value={editForm.durationType}
                    onChange={(e) => setEditForm({ ...editForm, durationType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                  >
                    <option value="DAYS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Days</option>
                    <option value="WEEKS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Weeks</option>
                    <option value="MONTHS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Months</option>
                    <option value="YEARS" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editForm.fees}
                  onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Course summary and subjects..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 resize-none placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 shadow-md flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? "Updating..." : "Save Course Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE ENROLLED STUDENTS LIST MODAL */}
      {selectedCourseForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 backdrop-blur-sm p-3 sm:p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-3xl max-h-[calc(100vh-24px)] overflow-y-auto bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 space-y-5 my-auto shadow-[0_20px_50px_rgba(15,23,42,0.18)] text-[#0F172A]">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {selectedCourseForStudents.code}
                  </span>
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    {selectedCourseForStudents.name}
                  </h3>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Enrolled Students Listing & Status Overview
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseForStudents(null)}
                className="self-end sm:self-center p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs Row (Row 1 - Full Width) */}
            <div className="flex items-center space-x-1.5 p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => handleStatusFilterChange("ACTIVE")}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-[8px] text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  studentsModalFilter === "ACTIVE"
                    ? "bg-[#059669] text-white shadow-xs font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Active ({selectedCourseForStudents.stats?.activeStudents || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusFilterChange("COMPLETED")}
                className={`flex-1 min-w-[110px] px-3 py-2 rounded-[8px] text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  studentsModalFilter === "COMPLETED"
                    ? "bg-[#7C3AED] text-white shadow-xs font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Completed ({selectedCourseForStudents.stats?.completedStudents || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusFilterChange("DROPPED")}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-[8px] text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  studentsModalFilter === "DROPPED"
                    ? "bg-[#E11D48] text-white shadow-xs font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
                }`}
              >
                <span>Dropped ({selectedCourseForStudents.stats?.droppedStudents || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusFilterChange("ALL")}
                className={`flex-1 min-w-[90px] px-3 py-2 rounded-[8px] text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  studentsModalFilter === "ALL"
                    ? "bg-[#2563EB] text-white shadow-xs font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All ({selectedCourseForStudents.stats?.totalStudents || 0})</span>
              </button>
            </div>

            {/* Quick Action & Search Row (Row 2) */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const activeIds = filteredModalStudents
                    .filter((s) => s.status === "ACTIVE")
                    .map((s) => s.admissionId || s.id);
                  setSelectedAdmissionIds(activeIds);
                }}
                className="w-full sm:w-auto px-3 py-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] rounded-[8px] text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                title="Select all active students in 1 click"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Select Active ({filteredModalStudents.filter((s) => s.status === "ACTIVE").length})</span>
              </button>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={modalStudentSearch}
                  onChange={(e) => setModalStudentSearch(e.target.value)}
                  placeholder="Search student name, ID or mobile..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] text-xs focus:outline-none focus:border-[#2563EB] font-medium placeholder-[#94A3B8]"
                />
              </div>
            </div>

            {/* BULK ACTION TOOLBAR */}
            {selectedAdmissionIds.length > 0 && (
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#2563EB] bg-white px-2.5 py-1 rounded-[6px] border border-[#BFDBFE]">
                    {selectedAdmissionIds.length} Selected
                  </span>
                  <span className="text-[#334155] hidden sm:inline font-semibold">Bulk change course status:</span>
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <button
                    type="button"
                    onClick={() => handleBulkStatusSubmit("COMPLETED")}
                    disabled={bulkSubmitting}
                    className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-[8px] font-bold transition shadow-xs flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Mark Completed ({selectedAdmissionIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkStatusSubmit("ACTIVE")}
                    disabled={bulkSubmitting}
                    className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] font-bold transition shadow-xs flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Mark Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkStatusSubmit("DROPPED")}
                    disabled={bulkSubmitting}
                    className="px-3 py-1.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-[8px] font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>Mark Dropped</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAdmissionIds([])}
                    className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-white transition cursor-pointer"
                    title="Deselect All"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Students List Table */}
            {loadingStudents ? (
              <div className="text-center py-12 text-xs text-[#64748B]">Loading student details...</div>
            ) : filteredModalStudents.length === 0 ? (
              <div className="text-center py-10 px-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-3">
                <div className="w-12 h-12 rounded-full bg-white border border-[#E2E8F0] text-[#94A3B8] flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-[#0F172A]">
                  No {studentsModalFilter !== "ALL" ? studentsModalFilter.toLowerCase() : ""} students found.
                </div>
                <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                  {studentsModalFilter === "ACTIVE"
                    ? "There are currently 0 active students enrolled in this course. Click the 'Completed' or 'All' tab above to view passout/previous student records."
                    : studentsModalFilter === "COMPLETED"
                    ? "There are 0 completed passout students recorded for this course."
                    : "No student records found under this course."}
                </p>
                {studentsModalFilter === "ACTIVE" && (selectedCourseForStudents.stats?.completedStudents || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleStatusFilterChange("COMPLETED")}
                    className="px-4 py-2 bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] border border-[#DDD6FE] rounded-[8px] text-xs font-bold transition inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>View Completed Passout Students ({selectedCourseForStudents.stats.completedStudents})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] sticky top-0 z-10 font-bold">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredModalStudents.length > 0 &&
                            filteredModalStudents.every((s) => selectedAdmissionIds.includes(s.admissionId || s.id))
                          }
                          onChange={handleSelectAllModalStudents}
                          className="w-4 h-4 rounded border-[#CBD5E1] bg-white text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Student Details</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Admission Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Fee Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F7] text-[#334155] font-medium">
                    {filteredModalStudents.map((s) => (
                      <tr
                        key={s.admissionId || s.id}
                        className={`hover:bg-[#F8FAFC] transition-colors ${
                          selectedAdmissionIds.includes(s.admissionId || s.id) ? "bg-[#EFF6FF]" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedAdmissionIds.includes(s.admissionId || s.id)}
                            onChange={() => handleToggleSelectAdmission(s.admissionId || s.id)}
                            className="w-4 h-4 rounded border-[#CBD5E1] bg-white text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                              {(s.fullName || "S").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F172A] text-sm">{s.fullName}</div>
                              <div className="font-mono text-[10px] text-[#2563EB] font-bold">{s.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 space-y-0.5">
                          <div className="flex items-center space-x-1 text-[#334155] font-mono text-xs">
                            <Phone className="w-3 h-3 text-[#64748B]" />
                            <span>{s.mobile}</span>
                          </div>
                          {s.email && (
                            <div className="text-[10px] text-[#64748B] truncate max-w-[150px]">
                              {s.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#64748B] text-xs">
                          {s.admissionDate
                            ? new Date(s.admissionDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              s.status === "ACTIVE"
                                ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                                : s.status === "COMPLETED"
                                ? "bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE]"
                                : "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-extrabold text-[#059669] text-xs">
                            Paid: ₹{Number(s.paidAmount || 0).toLocaleString("en-IN")}
                          </div>
                          {Number(s.pendingAmount || 0) > 0 ? (
                            <div className="text-[10px] text-[#E11D48] font-semibold">
                              Due: ₹{Number(s.pendingAmount).toLocaleString("en-IN")}
                            </div>
                          ) : (
                            <div className="text-[10px] text-[#059669] font-semibold">
                              Cleared
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={`/dashboard/students/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-lg border border-[#BFDBFE] transition inline-flex items-center gap-1 text-[11px] font-bold shadow-xs"
                            title="Open Full Student Profile & History Page in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Profile ↗</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL WITH AUTO-GENERATED CODE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 backdrop-blur-sm p-3 sm:p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-[480px] max-h-[calc(100vh-24px)] overflow-y-auto bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 space-y-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] text-[#0F172A] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0891B2]" /> Create New Academic Course
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] transition p-1 rounded-lg hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={handleCourseNameChange}
                  placeholder="e.g. Master in Python & AI Development"
                  className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 placeholder-[#94A3B8] font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-[#334155]">Course Code (Auto-Generated) *</label>
                  <button
                    type="button"
                    onClick={() => setCourseCode(generateCourseCode(courseName))}
                    className="text-[11px] font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center space-x-1 transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CRS-PYT-AI-69"
                  className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#2563EB] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 placeholder-[#94A3B8] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Category / Department *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-medium cursor-pointer"
                >
                  {COURSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Duration Unit</label>
                  <select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-medium cursor-pointer"
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 placeholder-[#94A3B8] font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Course summary and subjects..."
                  className="w-full p-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 placeholder-[#94A3B8] font-medium resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-[8px] font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0891B2] hover:bg-[#0e7490] text-white rounded-[8px] font-bold text-xs shadow-xs flex items-center space-x-1 disabled:opacity-50 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : "Create Course"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL (SUPER ADMIN) */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 backdrop-blur-sm p-3 sm:p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-[480px] max-h-[calc(100vh-24px)] overflow-y-auto bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 space-y-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] text-[#0F172A] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#D97706]" /> Edit Course & Department
              </h3>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] transition p-1 rounded-lg hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-[#334155]">Course Code *</label>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, code: generateCourseCode(editForm.name) })}
                      className="text-[11px] font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center space-x-1 transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Re-Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#2563EB] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Category / Department *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-medium cursor-pointer"
                  >
                    {COURSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Duration Unit</label>
                  <select
                    value={editForm.durationType}
                    onChange={(e) => setEditForm({ ...editForm, durationType: e.target.value })}
                    className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-medium cursor-pointer"
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editForm.fees}
                  onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                  className="w-full h-[40px] px-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Course summary and subjects..."
                  className="w-full p-3 bg-white border border-[#CBD5E1] rounded-[9px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 placeholder-[#94A3B8] font-medium resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-[8px] font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-[8px] font-bold text-xs shadow-xs flex items-center space-x-1 disabled:opacity-50 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? "Updating..." : "Save Course Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN DEPARTMENT MANAGEMENT MODAL */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 max-w-2xl w-full shadow-[0_20px_50px_rgba(15,23,42,0.18)] space-y-4 text-[#0F172A] my-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#0F172A] text-base">Department Management (Super Admin)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deptError && (
              <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] rounded-[10px] text-xs">
                {deptError}
              </div>
            )}

            {/* Department Form (Create / Edit) */}
            <form onSubmit={handleSaveDepartment} className="p-4 bg-[#F8FAFC] rounded-[12px] border border-[#E2E8F0] space-y-3">
              <h4 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                {editingDept ? `Edit Department: ${editingDept.name}` : "Create New Department"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Artificial Intelligence"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full h-[38px] px-3 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">Department Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AI"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    className="w-full h-[38px] px-3 bg-white border border-[#CBD5E1] rounded-[8px] text-[#2563EB] text-xs outline-none focus:border-[#2563EB] font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#334155] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short description of department..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full h-[38px] px-3 bg-white border border-[#CBD5E1] rounded-[8px] text-[#0F172A] text-xs outline-none focus:border-[#2563EB]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                {editingDept && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDept(null);
                      setDeptForm({ name: "", code: "", description: "" });
                    }}
                    className="px-3 py-1.5 bg-[#F1F5F9] text-[#475569] rounded-[8px] text-xs font-semibold hover:bg-[#E2E8F0]"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingDept}
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submittingDept ? "Saving..." : editingDept ? "Update Department" : "Create Department"}</span>
                </button>
              </div>
            </form>

            {/* Department List Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Existing Departments ({departments.length})
              </h4>
              <div className="max-h-60 overflow-y-auto border border-[#E2E8F0] rounded-[12px] divide-y divide-[#EEF2F7] bg-white">
                {departments.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#64748B]">No departments found.</div>
                ) : (
                  departments.map((d) => (
                    <div key={d.id} className="p-3 flex items-center justify-between hover:bg-[#F8FAFC] text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0F172A]">{d.name}</span>
                          {d.code && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-mono rounded font-bold">
                              {d.code}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                            d.isActive ? "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]" : "bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]"
                          }`}>
                            {d.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {d.description && <p className="text-[11px] text-[#64748B]">{d.description}</p>}
                        <p className="text-[10px] text-[#94A3B8]">
                          {d._count?.courses || 0} associated course(s)
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDept(d);
                            setDeptForm({ name: d.name, code: d.code || "", description: d.description || "" });
                          }}
                          className="p-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] rounded-lg border border-[#FDE68A]"
                          title="Edit Department"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDeptStatus(d)}
                          className={`p-1.5 rounded-lg text-xs font-semibold border ${
                            d.isActive ? "bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7] border-[#FDE68A]" : "bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5] border-[#A7F3D0]"
                          }`}
                          title={d.isActive ? "Deactivate" : "Activate"}
                        >
                          {d.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDept(d)}
                          className="p-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] rounded-lg border border-[#FECDD3]"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-[8px] text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
