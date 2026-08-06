import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
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
} from "lucide-react";

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

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

  useEffect(() => {
    fetchStudents(1);
  }, [statusFilter]);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(1, search);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditError("");
    const adm = student.admission;
    setEditForm({
      fullName: student.fullName || "",
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
      await api.put(`/students/${editingStudent.id}`, editForm);
      setEditingStudent(null);
      fetchStudents(pagination.page);
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update student details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-400">
            Search, filter, edit student profiles, update fees, and change academic status.
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Student ID, Name, Mobile, Email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DROPPED">DROPPED</option>
            <option value="TRANSFERRED">TRANSFERRED</option>
          </select>
        </div>
      </div>

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
          /* TABLE LIST VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Course</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-xs font-bold text-cyan-400">
                      {student.studentId}
                    </td>
                    <td className="p-3.5 font-bold text-slate-100">
                      {student.fullName}
                    </td>
                    <td className="p-3.5 text-slate-300 text-xs">{student.mobile}</td>
                    <td className="p-3.5 text-xs text-slate-300">
                      {student.admission?.courseNameSnapshot || "N/A"}
                    </td>
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
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                        title="View Full Profile"
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 hover:border-cyan-500/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400">{student.studentId}</span>
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
                  <h4 className="text-sm font-bold text-white">{student.fullName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {student.admission?.courseNameSnapshot || "General Course"}
                  </p>
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
                    onClick={() => setSelectedStudent(student)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
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
              <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} total)
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

      {/* VIEW PROFILE MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title="Student Profile Overview"
        >
          <div className="space-y-6 text-sm text-slate-200">
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3.5 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudent.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-cyan-400 font-bold">
                      {selectedStudent.studentId}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">
                      Status: <strong className="text-emerald-400">{selectedStudent.status}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenEdit(s);
                }}
                className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Student</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Joined Date</span>
                <p className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  {selectedStudent.joinedDate ? new Date(selectedStudent.joinedDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            {selectedStudent.admission && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Linked Admission Details
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Course Name</span>
                    <span className="font-bold text-white">
                      {selectedStudent.admission.courseNameSnapshot || selectedStudent.admission.course?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Admission Number</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {selectedStudent.admission.admissionNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Course Fee</span>
                    <span className="font-bold text-slate-200">
                      ₹{Number(selectedStudent.admission.finalFees || selectedStudent.admission.courseFees).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pending Balance</span>
                    <span className="font-bold text-amber-400">
                      ₹{Number(selectedStudent.admission.pendingAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                <p className="text-xs text-slate-400">{editingStudent.fullName} ({editingStudent.studentId})</p>
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
    </div>
  );
};
