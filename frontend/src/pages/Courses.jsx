import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const COURSE_CATEGORIES = [
  "School Course",
  "IT Course",
  "AI Related",
  "Basic Course",
  "Professional Course",
  "Other",
];

export const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  // Default View Mode: 'table' (List View by default)
  const [viewMode, setViewMode] = useState("table");

  // Create Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [category, setCategory] = useState("IT Course");
  const [duration, setDuration] = useState(3);
  const [durationType, setDurationType] = useState("MONTHS");
  const [fees, setFees] = useState(5000);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Course Modal State (Super Admin)
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    category: "IT Course",
    duration: 3,
    durationType: "MONTHS",
    fees: 5000,
    description: "",
  });

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
  }, [sortBy, categoryFilter]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses", {
        params: {
          sortBy,
          category: categoryFilter || undefined,
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
    setFees(5000);
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
      setFees(5000);
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

  const filteredCourses = courses
    .filter((c) => {
      const matchesSearch =
        (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.code || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.category || "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        !categoryFilter || (c.category || "IT Course") === categoryFilter;

      return matchesSearch && matchesCategory;
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

  const filteredModalStudents = courseStudents.filter((s) => {
    // Strictly filter by tab status (ACTIVE | COMPLETED | DROPPED | CANCELLED | ALL)
    const matchesStatus =
      studentsModalFilter === "ALL" || s.status === studentsModalFilter;
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
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "AI Related":
        return "bg-purple-950 text-purple-300 border-purple-800";
      case "Basic Course":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "Professional Course":
        return "bg-indigo-950 text-indigo-300 border-indigo-800";
      case "IT Course":
      default:
        return "bg-cyan-950 text-cyan-300 border-cyan-800";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Course Catalog & Department Categories
          </h1>
          <p className="text-xs text-slate-400">
            Manage academic programs, department categories, tuition fees, and duration.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle Switch (Table View Default) */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === "table" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Table List View (Default)"
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

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-cyan-950/80 border border-cyan-800/80 rounded-xl text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Courses</p>
            <h3 className="text-xl font-black text-white">{totalCourses}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Students</p>
            <h3 className="text-xl font-black text-emerald-400">{totalActiveStudents}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-purple-950/80 border border-purple-800/80 rounded-xl text-purple-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed / Passout</p>
            <h3 className="text-xl font-black text-purple-300">{totalCompletedStudents}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-blue-950/80 border border-blue-800/80 rounded-xl text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
            <h3 className="text-xl font-black text-blue-400">{totalEnrolledStudents}</h3>
          </div>
        </div>
      </div>

      {/* Search & Department Category Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course by name, code or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-bold cursor-pointer"
            >
              <option value="name_asc" className="bg-slate-950">🔤 Name (A to Z) [Default]</option>
              <option value="name_desc" className="bg-slate-950">🔤 Name (Z to A)</option>
              <option value="students_desc" className="bg-slate-950">👥 Most Enrolled Students</option>
              <option value="students_asc" className="bg-slate-950">👥 Least Enrolled Students</option>
              <option value="fee_desc" className="bg-slate-950">💰 Highest Tuition Fee</option>
              <option value="fee_asc" className="bg-slate-950">💰 Lowest Tuition Fee</option>
              <option value="newest" className="bg-slate-950">🕒 Newest Added First</option>
              <option value="oldest" className="bg-slate-950">🕒 Oldest Added First</option>
              <option value="duration_desc" className="bg-slate-950">⏱️ Longest Duration</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-bold cursor-pointer"
            >
              <option value="" className="bg-slate-950">All Categories / Departments</option>
              {COURSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-950">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BULK COURSE OPERATIONS TOOLBAR */}
      {isSuperAdmin && selectedCourseIds.length > 0 && (
        <div className="p-4 bg-cyan-950/90 border border-cyan-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white bg-cyan-900 px-3 py-1 rounded-xl">
              {selectedCourseIds.length} Course(s) Selected
            </span>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {/* Change Department / Category */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Department:</span>
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none font-bold cursor-pointer"
              >
                {COURSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-950">
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkCategorySubmit}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-[11px] transition shadow"
              >
                Apply Department
              </button>
            </div>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={handleBulkDeleteCoursesSubmit}
              className="px-3.5 py-2 bg-rose-950 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 rounded-xl font-bold transition shadow flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedCourseIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCourseIds([])}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
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
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  {isSuperAdmin && (
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredCourses.length > 0 &&
                          filteredCourses.every((c) => selectedCourseIds.includes(c.id))
                        }
                        onChange={handleSelectAllCourses}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4">Course Details</th>
                  <th className="py-3.5 px-4 text-center">Enrolled Breakdown</th>
                  <th className="py-3.5 px-4 text-center">Total Students</th>
                  <th className="py-3.5 px-4 text-right">Tuition Fees</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCourses.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-800/30 transition ${
                      selectedCourseIds.includes(c.id) ? "bg-cyan-950/20" : ""
                    }`}
                  >
                    {isSuperAdmin && (
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.includes(c.id)}
                          onChange={() => handleToggleSelectCourse(c.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm">{c.name}</div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                            {c.code}
                          </span>
                          <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold ${getCategoryBadgeClass(c.category || "IT Course")}`}>
                            {c.category || "IT Course"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[260px] mx-auto">
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "ACTIVE")}
                          className="px-2 py-0.5 rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-sm"
                          title="View Active Students"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Active: {c.stats?.activeStudents || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "COMPLETED")}
                          className="px-2 py-0.5 rounded-md bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/80 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-sm"
                          title="View Completed Students"
                        >
                          <GraduationCap className="w-3 h-3" />
                          <span>Done: {c.stats?.completedStudents || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "DROPPED")}
                          className="px-2 py-0.5 rounded-md bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-sm"
                          title="View Dropped Students"
                        >
                          <span>Dropped: {c.stats?.droppedStudents || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCourseStudentsModal(c, "CANCELLED")}
                          className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer hover:scale-105 shadow-sm"
                          title="View Cancelled Students"
                        >
                          <span>Cancel: {c.stats?.cancelledStudents || 0}</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => openCourseStudentsModal(c, "ALL")}
                        className="px-3 py-1 bg-slate-950 hover:bg-cyan-950/80 text-white hover:text-cyan-300 border border-slate-800 hover:border-cyan-800 rounded-xl font-extrabold text-xs transition cursor-pointer inline-flex items-center space-x-1 shadow"
                        title="Click to view all enrolled students"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{c.stats?.totalStudents || 0}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm">
                      ₹{Number(c.fees).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.isActive
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-1.5">
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                        title="Edit Course Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteCourse(c)}
                          className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-cyan-500/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {c.code}
                  </span>
                  <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${getCategoryBadgeClass(c.category || "IT Course")}`}>
                    {c.category || "IT Course"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{c.name}</h3>
                {c.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                )}
              </div>

              {/* Student Stats Summary for Card */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 my-2">
                <button
                  type="button"
                  onClick={() => openCourseStudentsModal(c, "ACTIVE")}
                  className="w-full flex items-center justify-between text-xs p-1 rounded-lg hover:bg-slate-900/90 transition cursor-pointer group"
                  title="Click to view Active Students list"
                >
                  <span className="text-slate-300 group-hover:text-white font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Active Students
                  </span>
                  <span className="font-extrabold text-emerald-400 bg-emerald-950/80 group-hover:bg-emerald-900 px-2 py-0.5 rounded border border-emerald-800/80 text-xs shadow-sm">
                    {c.stats?.activeStudents || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openCourseStudentsModal(c, "COMPLETED")}
                  className="w-full flex items-center justify-between text-xs p-1 rounded-lg hover:bg-slate-900/90 transition cursor-pointer group"
                  title="Click to view Completed Students list"
                >
                  <span className="text-slate-300 group-hover:text-white font-semibold flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    Completed Passout
                  </span>
                  <span className="font-extrabold text-purple-300 bg-purple-950/80 group-hover:bg-purple-900 px-2 py-0.5 rounded border border-purple-800/80 text-xs shadow-sm">
                    {c.stats?.completedStudents || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openCourseStudentsModal(c, "ALL")}
                  className="w-full flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title="Click to view All Enrolled Students"
                >
                  <span>Total Admissions:</span>
                  <span className="font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{c.stats?.totalStudents || 0}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {c.duration} {c.durationType.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-400 font-extrabold text-sm">
                    <span>₹{Number(c.fees).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="flex-1 py-2 bg-slate-950 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
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

      {/* CREATE COURSE MODAL WITH AUTO-GENERATED CODE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" /> Create New Academic Course
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={handleCourseNameChange}
                  placeholder="e.g. Master in Python & AI Development"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-300">Course Code (Auto-Generated) *</label>
                  <button
                    type="button"
                    onClick={() => setCourseCode(generateCourseCode(courseName))}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
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
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 outline-none focus:border-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category / Department *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-semibold"
                >
                  {COURSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration Unit</label>
                  <select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Course summary and subjects..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 shadow-md flex items-center space-x-1 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" /> Edit Course Details
              </h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-300">Course Code *</label>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, code: generateCourseCode(editForm.name) })}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
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
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category / Department *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-semibold"
                  >
                    {COURSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration Unit</label>
                  <select
                    value={editForm.durationType}
                    onChange={(e) => setEditForm({ ...editForm, durationType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editForm.fees}
                  onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Course summary and subjects..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 shadow-md flex items-center space-x-1 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedCourseForStudents.code}
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {selectedCourseForStudents.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Enrolled Students Listing & Status Overview
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseForStudents(null)}
                className="self-end sm:self-center p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs Row (Row 1 - Full Width) */}
            <div className="flex items-center space-x-1.5 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => handleStatusFilterChange("ACTIVE")}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  studentsModalFilter === "ACTIVE"
                    ? "bg-emerald-600 text-white shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Active ({selectedCourseForStudents.stats?.activeStudents || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusFilterChange("COMPLETED")}
                className={`flex-1 min-w-[110px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  studentsModalFilter === "COMPLETED"
                    ? "bg-purple-600 text-white shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Completed ({selectedCourseForStudents.stats?.completedStudents || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusFilterChange("DROPPED")}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  studentsModalFilter === "DROPPED"
                    ? "bg-rose-600 text-white shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <span>Dropped ({selectedCourseForStudents.stats?.droppedStudents || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusFilterChange("ALL")}
                className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  studentsModalFilter === "ALL"
                    ? "bg-cyan-600 text-white shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
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
                className="w-full sm:w-auto px-3 py-2 bg-slate-950 hover:bg-cyan-950 text-cyan-400 border border-slate-800 hover:border-cyan-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                title="Select all active students in 1 click"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Select Active ({filteredModalStudents.filter((s) => s.status === "ACTIVE").length})</span>
              </button>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={modalStudentSearch}
                  onChange={(e) => setModalStudentSearch(e.target.value)}
                  placeholder="Search student name, ID or mobile..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-medium placeholder-slate-500"
                />
              </div>
            </div>

            {/* BULK ACTION TOOLBAR FOR SUPER ADMIN / FACULTY */}
            {selectedAdmissionIds.length > 0 && (
              <div className="p-3 bg-cyan-950/90 border border-cyan-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white bg-cyan-900 px-2.5 py-1 rounded-lg">
                    {selectedAdmissionIds.length} Selected
                  </span>
                  <span className="text-slate-300 hidden sm:inline font-semibold">Bulk change course status:</span>
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <button
                    type="button"
                    onClick={() => handleBulkStatusSubmit("COMPLETED")}
                    disabled={bulkSubmitting}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition shadow flex items-center space-x-1 disabled:opacity-50"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Mark Completed ({selectedAdmissionIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkStatusSubmit("ACTIVE")}
                    disabled={bulkSubmitting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow flex items-center space-x-1 disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Mark Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkStatusSubmit("DROPPED")}
                    disabled={bulkSubmitting}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 rounded-xl font-bold transition disabled:opacity-50"
                  >
                    <span>Mark Dropped</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAdmissionIds([])}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Deselect All"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Students List Table */}
            {loadingStudents ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading student details...</div>
            ) : filteredModalStudents.length === 0 ? (
              <div className="text-center py-10 px-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-300">
                  No {studentsModalFilter !== "ALL" ? studentsModalFilter.toLowerCase() : ""} students found.
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
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
                    className="px-4 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>View Completed Passout Students ({selectedCourseForStudents.stats.completedStudents})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredModalStudents.length > 0 &&
                            filteredModalStudents.every((s) => selectedAdmissionIds.includes(s.admissionId || s.id))
                          }
                          onChange={handleSelectAllModalStudents}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
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
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredModalStudents.map((s) => (
                      <tr
                        key={s.admissionId || s.id}
                        className={`hover:bg-slate-800/40 transition ${
                          selectedAdmissionIds.includes(s.admissionId || s.id) ? "bg-cyan-950/30" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedAdmissionIds.includes(s.admissionId || s.id)}
                            onChange={() => handleToggleSelectAdmission(s.admissionId || s.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {(s.fullName || "S").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{s.fullName}</div>
                              <div className="font-mono text-[10px] text-cyan-400">{s.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 space-y-0.5">
                          <div className="flex items-center space-x-1 text-slate-300 font-mono text-xs">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{s.mobile}</span>
                          </div>
                          {s.email && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {s.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
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
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              s.status === "ACTIVE"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : s.status === "COMPLETED"
                                ? "bg-purple-950 text-purple-300 border border-purple-800"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-emerald-400 text-xs">
                            Paid: ₹{Number(s.paidAmount || 0).toLocaleString("en-IN")}
                          </div>
                          {Number(s.pendingAmount || 0) > 0 ? (
                            <div className="text-[10px] text-rose-400 font-medium">
                              Due: ₹{Number(s.pendingAmount).toLocaleString("en-IN")}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-500 font-medium">
                              Cleared
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedCourseForStudents(null);
                              navigate(`/dashboard/students/${s.id}`);
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition inline-flex items-center gap-1 text-[11px] font-bold"
                            title="View Full Student Profile & History Page"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Profile</span>
                          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" /> Create New Academic Course
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={handleCourseNameChange}
                  placeholder="e.g. Master in Python & AI Development"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-300">Course Code (Auto-Generated) *</label>
                  <button
                    type="button"
                    onClick={() => setCourseCode(generateCourseCode(courseName))}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
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
                  placeholder="e.g. CRS-PYT-AI-69"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 outline-none focus:border-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category / Department *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-semibold"
                >
                  {COURSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration Unit</label>
                  <select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Course summary and subjects..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 shadow-md flex items-center space-x-1 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" /> Edit Course & Department
              </h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-300">Course Code *</label>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, code: generateCourseCode(editForm.name) })}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
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
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category / Department *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-semibold"
                  >
                    {COURSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration Unit</label>
                  <select
                    value={editForm.durationType}
                    onChange={(e) => setEditForm({ ...editForm, durationType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tuition Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editForm.fees}
                  onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Course summary and subjects..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 shadow-md flex items-center space-x-1 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? "Updating..." : "Save Course Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
