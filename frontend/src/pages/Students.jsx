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
} from "lucide-react";

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

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

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-400">
            Search, filter, and inspect detailed student profiles and fee histories.
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
                  <th className="p-3.5">Admission Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
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
                    <td className="p-3.5 text-xs text-slate-400">
                      {student.admission?.admissionDate
                        ? new Date(student.admission.admissionDate).toLocaleDateString("en-IN")
                        : "N/A"}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
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
                onClick={() => setSelectedStudent(student)}
                className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 cursor-pointer hover:border-cyan-500/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400">{student.studentId}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      student.status === "ACTIVE"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStudent(student);
                  }}
                  className="w-full py-1.5 bg-slate-900 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
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

      {/* Student Profile Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title="Student Profile Overview"
        >
          <div className="space-y-6 text-sm text-slate-200">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
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

            {/* Profile fields */}
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

            {/* Admission details */}
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
    </div>
  );
};
