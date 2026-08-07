import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "../api/axios";

const COURSE_CATEGORIES = [
  "School Course",
  "IT Course",
  "AI Related",
  "Basic Course",
  "Professional Course",
  "Other",
];

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses");
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
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

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.category || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !categoryFilter || (c.category || "IT Course") === categoryFilter;

    return matchesSearch && matchesCategory;
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-semibold w-full md:w-auto"
          >
            <option value="">All Categories / Departments</option>
            {COURSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

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
                  <th className="py-3.5 px-4">Course Code</th>
                  <th className="py-3.5 px-4">Course Name</th>
                  <th className="py-3.5 px-4">Category / Department</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                  <th className="py-3.5 px-4 text-right">Tuition Fees</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{c.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">{c.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 border rounded-md text-[10px] font-bold ${getCategoryBadgeClass(c.category || "IT Course")}`}>
                        {c.category || "IT Course"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold">
                      {c.duration} {c.durationType.toLowerCase()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold inline-flex items-center gap-1" title="Active Students">
                          <UserCheck className="w-3 h-3" />
                          {c.stats?.activeStudents || 0} Active
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/80 text-[10px] font-bold inline-flex items-center gap-1" title="Completed Students">
                          <GraduationCap className="w-3 h-3" />
                          {c.stats?.completedStudents || 0} Done
                        </span>
                      </div>
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
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
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
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 my-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Active Students
                  </span>
                  <span className="font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 text-xs">
                    {c.stats?.activeStudents || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    Completed Passout
                  </span>
                  <span className="font-extrabold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/80 text-xs">
                    {c.stats?.completedStudents || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60 text-slate-400">
                  <span>Total Admissions:</span>
                  <span className="font-bold text-slate-200">{c.stats?.totalStudents || 0}</span>
                </div>
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

                <button
                  onClick={() => handleOpenEditModal(c)}
                  className="w-full py-2 bg-slate-950 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Course Details</span>
                </button>
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
