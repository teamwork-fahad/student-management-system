import React, { useState, useEffect } from "react";
import { Plus, BookOpen, Clock, CreditCard, Search, Edit, CheckCircle, XCircle, X } from "lucide-react";
import api from "../api/axios";

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [duration, setDuration] = useState(3);
  const [durationType, setDurationType] = useState("MONTHS");
  const [fees, setFees] = useState(5000);
  const [description, setDescription] = useState("");

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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseName || !courseCode || !fees) return;

    try {
      await api.post("/courses", {
        name: courseName,
        code: courseCode,
        duration: Number(duration),
        durationType: durationType,
        fees: Number(fees),
        description: description,
      });
      setIsModalOpen(false);
      fetchCourses();
      setCourseName("");
      setCourseCode("");
      setFees(5000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create course");
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Course Catalog & Fee Management</h1>
          <p className="text-xs text-slate-400">Manage academic programs, duration, and tuition fee structures.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 w-fit transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center">
        <Search className="w-4 h-4 text-slate-400 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search course by name or code..."
          className="w-full bg-transparent text-xs font-medium text-slate-100 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-16 text-xs text-slate-500">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-slate-500">No courses found.</div>
        ) : (
          filteredCourses.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-md font-mono font-bold text-[10px]">
                    {c.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{c.duration} {c.durationType}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{c.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{c.description || "Active academic program."}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tuition Fees</span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    ₹{Number(c.fees).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Academic Course</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Master in Web Development"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CRS-MERN"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration Unit</label>
                  <select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Course summary and subjects..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500 resize-none"
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
                  className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-500 shadow-md"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
