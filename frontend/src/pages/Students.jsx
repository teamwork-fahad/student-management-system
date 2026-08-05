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
} from "lucide-react";

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents(1);
  }, [statusFilter]);

  const fetchStudents = async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const response = await api.get("/students", {
        params: {
          page,
          limit: 10,
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-cyan-400" />
            Enrolled Student Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect detailed student profiles and fee histories.
          </p>
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

      {/* Table Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {loading ? (
          <LoadingSpinner label="Fetching student directory..." />
        ) : students.length === 0 ? (
          <EmptyState
            title="No Students Found"
            description="Try adjusting your search criteria or register a new student."
          />
        ) : (
          <>
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
                          ? new Date(student.admission.admissionDate).toLocaleDateString()
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
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Showing page <strong className="text-white">{pagination.page}</strong> of{" "}
                <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} total)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => fetchStudents(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => fetchStudents(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Student Profile Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="🎓 Student Profile Details"
        maxWidth="max-w-3xl"
      >
        {selectedStudent && (
          <div className="space-y-6 text-sm text-slate-200">
            {/* Header Identity Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xl font-black">
                  {selectedStudent.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedStudent.fullName}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono text-cyan-400 font-bold">{selectedStudent.studentId}</span>
                    <span>•</span>
                    <span>Gender: {selectedStudent.gender}</span>
                  </div>
                </div>
              </div>
              <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {selectedStudent.status}
              </span>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Info */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  Contact Details
                </h4>
                <div className="flex items-center space-x-2 text-xs">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Mobile: <strong className="text-white">{selectedStudent.mobile}</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email: <strong className="text-white">{selectedStudent.email || "N/A"}</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Address: <strong className="text-white">{selectedStudent.address || "N/A"}, {selectedStudent.city || ""}</strong></span>
                </div>
              </div>

              {/* Course & Admission Info */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  Enrolled Course
                </h4>
                <p className="text-xs text-slate-300">
                  Course: <strong className="text-white">{selectedStudent.admission?.courseNameSnapshot}</strong>
                </p>
                <p className="text-xs text-slate-300">
                  Admission No: <strong className="text-cyan-400 font-mono">{selectedStudent.admission?.admissionNumber}</strong>
                </p>
                <p className="text-xs text-slate-300">
                  Academic Year: <strong className="text-white">{selectedStudent.admission?.admissionYear}</strong>
                </p>
              </div>
            </div>

            {/* Financial Ledger */}
            {selectedStudent.admission && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Fee Ledger Summary</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Fees</span>
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(selectedStudent.admission.courseFees)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Discount</span>
                    <span className="text-sm font-bold text-slate-300">
                      {formatCurrency(selectedStudent.admission.discount)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Paid</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(selectedStudent.admission.paidAmount)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pending</span>
                    <span className="text-sm font-bold text-amber-400">
                      {formatCurrency(selectedStudent.admission.pendingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
