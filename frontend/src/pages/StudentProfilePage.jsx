import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import { ReceiptModal } from "../components/receipts/ReceiptModal";
import { SearchableSelect } from "../components/common/SearchableSelect";
import {
  ArrowLeft,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  PlusCircle,
  Edit,
  Trash2,
  Printer,
  BookOpen,
  Receipt,
  CheckCircle2,
  User,
  Clock,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Save,
  X,
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

export const StudentProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab State: 'courses' | 'payments' | 'attendance' | 'personal'
  const [activeTab, setActiveTab] = useState("courses");

  // Printable Receipt Modal
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    fatherName: "",
    gender: "MALE",
    qualification: "",
    schoolCollege: "",
    address: "",
    status: "ACTIVE",
  });

  // Collect Fee Drawer/Modal State
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [feeError, setFeeError] = useState("");
  const [feeForm, setFeeForm] = useState({
    admissionId: "",
    amount: "",
    paymentMode: "CASH",
    transactionReference: "",
    remarks: "",
  });

  // Add Course Modal State
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [coursesList, setCoursesList] = useState([]);
  const [addCourseSubmitting, setAddCourseSubmitting] = useState(false);
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

  const [departments, setDepartments] = useState([]);
  const [addCourseDeptId, setAddCourseDeptId] = useState("");
  const [editCourseDeptId, setEditCourseDeptId] = useState("");

  useEffect(() => {
    fetchStudentProfile();
    fetchCourses();
    fetchDepartments();
  }, [id]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchStudentProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/students/${id}`);
      setStudentData(res.data?.data || null);
    } catch (err) {
      console.error("Error fetching student profile:", err);
      setError(err.response?.data?.message || "Failed to load student profile.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCoursesList(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  // Course Status Update
  const handleCourseStatusChange = async (admissionId, newStatus) => {
    try {
      await api.patch(`/admissions/${admissionId}/status`, { status: newStatus });
      fetchStudentProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update course status");
    }
  };

  // Delete Course Admission with detailed fee info loss warning
  const handleDeleteCourseAdmission = async (admissionId, courseName, admDetails = {}) => {
    const studentName = studentData?.fullName || "Student";
    const paidAmt = admDetails.paidAmount ? Number(admDetails.paidAmount).toLocaleString("en-IN") : "0";
    const pendingAmt = admDetails.pendingAmount ? Number(admDetails.pendingAmount).toLocaleString("en-IN") : "0";

    const confirmMsg =
      `⚠️ WARNING: ARE YOU SURE YOU WANT TO DELETE THIS COURSE ENROLLMENT?\n\n` +
      `Student Name: ${studentName}\n` +
      `Course Name: "${courseName}"\n` +
      `Paid Amount Recorded: ₹${paidAmt}\n` +
      `Pending Dues Balance: ₹${pendingAmt}\n\n` +
      `Deleting this course enrollment will ERASE all fee information, discount data, and payment receipt history recorded for "${courseName}"!\n\n` +
      `Do you want to proceed and permanently remove this course entry from the database?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/admissions/${admissionId}`);
      alert(`Course enrollment for "${courseName}" has been deleted from the database.`);
      fetchStudentProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete course enrollment");
    }
  };

  // Edit Enrolled Course Modal State & Handlers (Super Admin)
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({
    courseId: "",
    courseFees: "",
    discount: "0",
    finalFees: "",
    remarks: "",
  });
  const [editCourseSubmitting, setEditCourseSubmitting] = useState(false);
  const [editCourseError, setEditCourseError] = useState("");

  const handleOpenEditCourseModal = (adm) => {
    setEditingAdmission(adm);
    const initialFees = adm.courseFees !== undefined ? String(adm.courseFees) : String(adm.course?.fees || 0);
    const initialDiscount = adm.discount !== undefined ? String(adm.discount) : "0";
    const initialFinal = adm.finalFees !== undefined ? String(adm.finalFees) : String(Math.max(0, Number(initialFees) - Number(initialDiscount)));

    setEditCourseForm({
      courseId: adm.courseId || adm.course?.id || "",
      courseFees: initialFees,
      discount: initialDiscount,
      finalFees: initialFinal,
      remarks: adm.remarks || "",
    });
    setEditCourseError("");
  };

  const handleEditCourseSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmission) return;

    setEditCourseSubmitting(true);
    setEditCourseError("");
    try {
      await api.put(`/admissions/${editingAdmission.id}`, {
        courseId: editCourseForm.courseId,
        courseFees: Number(editCourseForm.courseFees),
        discount: Number(editCourseForm.discount),
        finalFees: Number(editCourseForm.finalFees),
        remarks: editCourseForm.remarks,
      });

      setEditingAdmission(null);
      fetchStudentProfile();
    } catch (err) {
      setEditCourseError(err.response?.data?.message || "Failed to update course details.");
    } finally {
      setEditCourseSubmitting(false);
    }
  };

  // Delete Student Record (Super Admin)
  const handleDeleteStudent = async () => {
    if (!studentData) return;
    if (
      !window.confirm(
        `CAUTION: Are you sure you want to completely delete student record for "${studentData.fullName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/students/${studentData.id}`);
      alert(`Student record for ${studentData.fullName} deleted successfully.`);
      navigate(-1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student record");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!studentData) return;
    setEditForm({
      fullName: studentData.fullName || "",
      mobile: studentData.mobile || "",
      whatsapp: studentData.whatsapp || "",
      email: studentData.email || "",
      fatherName: studentData.fatherName || "",
      gender: studentData.gender || "MALE",
      qualification: studentData.qualification || "",
      schoolCollege: studentData.schoolCollege || "",
      address: studentData.address || "",
      status: studentData.status || "ACTIVE",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError("");
    try {
      await api.patch(`/students/${studentData.id}`, editForm);
      setShowEditModal(false);
      fetchStudentProfile();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update student profile.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Fee Collection Modal
  const handleOpenFeeModal = (admObj = null) => {
    if (!studentData) return;
    // Guard against React SyntheticEvent being passed as admObj
    const targetAdm = (admObj && typeof admObj === "object" && admObj.id)
      ? admObj
      : (studentData.allAdmissions?.[0] || studentData.admission);

    setFeeForm({
      admissionId: targetAdm?.id || "",
      amount: targetAdm?.pendingAmount ? String(targetAdm.pendingAmount) : "",
      paymentMode: "CASH",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionReference: "",
      remarks: "",
    });
    setFeeError("");
    setShowFeeModal(true);
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    if (!feeForm.admissionId || !feeForm.amount || Number(feeForm.amount) <= 0) {
      setFeeError("Please select an enrolled course and enter a valid payment amount.");
      return;
    }

    setFeeSubmitting(true);
    setFeeError("");
    try {
      await api.post("/fees/collect", {
        admissionId: feeForm.admissionId,
        amount: Number(feeForm.amount),
        paymentMode: feeForm.paymentMode,
        paymentDate: feeForm.paymentDate,
        transactionReference: feeForm.transactionReference,
        remarks: feeForm.remarks,
      });
      setShowFeeModal(false);
      fetchStudentProfile();
    } catch (err) {
      setFeeError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setFeeSubmitting(false);
    }
  };

  // Open Add Course Modal
  const handleOpenAddCourseModal = () => {
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
    setAddCourseError("");
    setShowAddCourseModal(true);
  };

  const handleCourseSelectionChange = (selectedId) => {
    const course = coursesList.find((c) => c.id === selectedId);
    const fees = course ? String(course.fees) : "";
    setAddCourseForm((prev) => ({
      ...prev,
      courseId: selectedId,
      courseFees: fees,
      finalFees: fees,
    }));
  };

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault();
    if (!addCourseForm.courseId) {
      setAddCourseError("Please select a course to enroll.");
      return;
    }

    setAddCourseSubmitting(true);
    setAddCourseError("");
    try {
      await api.post(`/students/${studentData.id}/courses`, {
        courseId: addCourseForm.courseId,
        courseFees: Number(addCourseForm.courseFees),
        discount: Number(addCourseForm.discount),
        paymentAmount: Number(addCourseForm.paymentAmount),
        paymentMode: addCourseForm.paymentMode,
        paymentDate: addCourseForm.paymentDate,
        transactionReference: addCourseForm.transactionReference,
        remarks: addCourseForm.remarks,
      });
      setShowAddCourseModal(false);
      fetchStudentProfile();
    } catch (err) {
      setAddCourseError(err.response?.data?.message || "Failed to add course.");
    } finally {
      setAddCourseSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner label="Loading student profile & complete history..." />
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="p-8 space-y-4 max-w-xl mx-auto text-center font-sans">
        <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-sm font-semibold">
          {error || "Student record not found."}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const admissions = studentData.allAdmissions || (studentData.admission ? [studentData.admission] : []);
  const totalFees = admissions.reduce((sum, a) => sum + Number(a.finalFees || a.courseFees || 0), 0);
  const totalPaid = admissions.reduce((sum, a) => sum + Number(a.paidAmount || 0), 0);
  const totalPending = admissions.reduce((sum, a) => sum + Number(a.pendingAmount || 0), 0);

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Printable Receipt Modal */}
      {selectedReceiptPayment && (
        <ReceiptModal
          payment={selectedReceiptPayment}
          student={studentData}
          admission={selectedReceiptPayment.admission || studentData.admission}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}

      {/* TOP NAVIGATION & HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 bg-slate-950 hover:bg-cyan-950 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-800 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow"
            title="Go back to previous page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-950 to-slate-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-black text-lg shadow-lg">
              {studentData.fullName[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-tight">{toTitleCase(studentData.fullName)}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    studentData.status === "ACTIVE"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : studentData.status === "ON_HOLD"
                      ? "bg-amber-950 text-amber-300 border-amber-800"
                      : studentData.status === "COMPLETED"
                      ? "bg-blue-950 text-blue-300 border-blue-800"
                      : "bg-rose-950 text-rose-400 border-rose-800"
                  }`}
                >
                  {studentData.status === "ACTIVE"
                    ? "🟢 ACTIVE"
                    : studentData.status === "ON_HOLD"
                    ? "🟡 ON HOLD"
                    : studentData.status === "COMPLETED"
                    ? "🔵 COMPLETED"
                    : "🔴 DROPPED"}
                </span>
              </div>
              <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400 font-mono">
                <span className="font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                  {studentData.studentId}
                </span>
                <span>📞 {studentData.mobile}</span>
                {studentData.email && <span>• ✉️ {studentData.email}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* SUPER ADMIN MANAGEMENT ACTION TOOLBAR */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={handleOpenAddCourseModal}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl border border-indigo-700/60 flex items-center space-x-1.5 transition shadow"
            title="Enroll student in another course"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Course</span>
          </button>

          <button
            onClick={() => handleOpenFeeModal()}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl border border-emerald-700/60 flex items-center space-x-1.5 transition shadow"
            title="Collect tuition fee"
          >
            <CreditCard className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>

          <button
            onClick={handleOpenEdit}
            className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl border border-amber-700/60 flex items-center space-x-1.5 transition shadow"
            title="Edit student profile & status"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleDeleteStudent}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-800 flex items-center space-x-1.5 transition shadow"
              title="Delete student record (Super Admin)"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Record</span>
            </button>
          )}
        </div>
      </div>

      {/* OVERVIEW KPI METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-cyan-950/80 border border-cyan-800/80 rounded-xl text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Enrolled Courses</p>
            <h3 className="text-xl font-black text-white">{admissions.length}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-indigo-950/80 border border-indigo-800/80 rounded-xl text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Course Fees</p>
            <h3 className="text-xl font-black text-slate-200">₹{totalFees.toLocaleString("en-IN")}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fees Paid</p>
            <h3 className="text-xl font-black text-emerald-400">₹{totalPaid.toLocaleString("en-IN")}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Dues</p>
            <h3 className="text-xl font-black text-amber-400">₹{totalPending.toLocaleString("en-IN")}</h3>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === "courses" ? "bg-cyan-600 text-white shadow-lg font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Enrolled Courses ({admissions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === "payments" ? "bg-emerald-600 text-white shadow-lg font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Receipts ({studentData.allPayments?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === "attendance" ? "bg-indigo-600 text-white shadow-lg font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance Log ({studentData.attendanceStats?.attendancePercentage || 100}%)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === "personal" ? "bg-purple-600 text-white shadow-lg font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Full Personal Info</span>
        </button>
      </div>

      {/* TAB CONTENT SECTIONS */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* TAB 1: ENROLLED COURSES TIMELINE */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" /> Complete Enrolled Courses Timeline
            </h3>

            <div className="space-y-4">
              {admissions.map((adm, idx) => {
                const admStatus = adm.status || "ACTIVE";
                const admFees = Number(adm.finalFees || adm.courseFees || 0);
                const admPaid = Number(adm.paidAmount || 0);
                const admPending = Number(adm.pendingAmount || 0);

                return (
                  <div key={adm.id || idx} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-xl font-black text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base">
                            {adm.courseNameSnapshot || adm.course?.name || "General Course"}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Course Code: <span className="font-mono text-cyan-400 font-bold">{adm.course?.code || "CRS-GENERAL"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                          admStatus === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : admStatus === "COMPLETED"
                            ? "bg-blue-950 text-blue-300 border-blue-800"
                            : admStatus === "DROPPED"
                            ? "bg-rose-950 text-rose-400 border-rose-800"
                            : "bg-amber-950 text-amber-300 border-amber-800"
                        }`}>
                          {admStatus}
                        </span>

                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-xl">
                          {adm.admissionNumber}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-slate-900">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Joining / Admission Date</span>
                        <span className="font-mono text-slate-200 font-semibold">{formatDate(adm.admissionDate)}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Course Fees</span>
                        <span className="font-bold text-slate-200 text-sm">₹{admFees.toLocaleString("en-IN")}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Paid Fee Amount</span>
                        <span className="font-extrabold text-emerald-400 text-sm">₹{admPaid.toLocaleString("en-IN")}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pending Balance</span>
                        <span className="font-extrabold text-amber-400 text-sm">₹{admPending.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* COURSE ACTION TOOLBAR: STOP/DROP, COMPLETE, DELETE */}
                    <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400 font-semibold">Course Controls:</span>
                      <div className="flex items-center space-x-2">
                        {admStatus === "ACTIVE" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCourseStatusChange(adm.id, "DROPPED")}
                              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl font-bold transition"
                              title="Stop or Drop this specific course"
                            >
                              🛑 Stop / Drop Course
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCourseStatusChange(adm.id, "COMPLETED")}
                              className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-xl font-bold transition"
                              title="Mark this course completed"
                            >
                              ✓ Mark Completed
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCourseStatusChange(adm.id, "ACTIVE")}
                            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl font-bold transition"
                            title="Re-activate this course"
                          >
                            ▶ Re-Activate Course
                          </button>
                        )}

                        {isSuperAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCourseModal(adm)}
                              className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-xl font-bold transition flex items-center space-x-1"
                              title="Edit course fees, discount or transfer course"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit Course</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCourseAdmission(adm.id, adm.courseNameSnapshot || adm.course?.name || "Course", adm)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800 rounded-xl transition font-bold"
                              title="Delete this course enrollment record"
                            >
                              🗑️ Delete Course
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FEE PAYMENT RECEIPTS */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" /> Fee Payment Receipts History
            </h3>

            {(!studentData.allPayments || studentData.allPayments.length === 0) ? (
              <p className="text-xs text-slate-500 py-12 text-center">No payment receipts recorded for this student.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Receipt / Ref</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-center">Print Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {studentData.allPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                          {p.transactionReference || `REC-${p.id ? p.id.slice(-6).toUpperCase() : "PAYMENT"}`}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white truncate max-w-[180px]">
                          {p.courseName || "Course"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {formatDate(p.paymentDate || p.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-blue-950 text-blue-300 rounded-lg font-bold uppercase text-[10px]">
                            {p.paymentMode || "CASH"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-400 text-sm">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedReceiptPayment(p)}
                            className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg font-semibold text-xs inline-flex items-center space-x-1 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Receipt</span>
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

        {/* TAB 3: ATTENDANCE LOG & STATS */}
        {activeTab === "attendance" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4 p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Attendance Rate</span>
                <span className="text-2xl font-black text-emerald-400">
                  {studentData.attendanceStats?.attendancePercentage || 100}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Present Days</span>
                <span className="text-2xl font-black text-cyan-400">
                  {studentData.attendanceStats?.presentCount || 0} Days
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Absent Days</span>
                <span className="text-2xl font-black text-rose-400">
                  {studentData.attendanceStats?.absentCount || 0} Days
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" /> Recent Attendance Log
            </h3>

            {(!studentData.attendanceStats?.recentLogs || studentData.attendanceStats.recentLogs.length === 0) ? (
              <p className="text-xs text-slate-500 py-12 text-center">No attendance logs recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Session Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {studentData.attendanceStats.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono text-slate-300 font-semibold">
                          {formatDate(log.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                            log.status === "PRESENT"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 italic">
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

        {/* TAB 4: FULL PERSONAL INFO */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" /> Full Personal & Academic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Father / Guardian Name</span>
                <p className="font-bold text-white text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" /> {studentData.fatherName || studentData.guardianName || "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Mobile & Contact</span>
                <p className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                  <Phone className="w-4 h-4 text-emerald-400" /> {studentData.mobile}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">WhatsApp Number</span>
                <p className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                  <Phone className="w-4 h-4 text-cyan-400" /> {studentData.whatsapp || studentData.mobile}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Email Address</span>
                <p className="font-bold text-white text-sm flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-cyan-400" /> {studentData.email || "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Gender & DOB</span>
                <p className="font-bold text-white text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {studentData.gender || "N/A"} {studentData.dob ? `• ${formatDate(studentData.dob)}` : ""}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Qualification & College</span>
                <p className="font-bold text-white text-sm flex items-center gap-2 truncate">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  {studentData.qualification || "N/A"} {studentData.schoolCollege ? `(${studentData.schoolCollege})` : ""}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Full Address</span>
                <p className="font-bold text-white text-sm flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  {[studentData.address, studentData.city, studentData.state].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Aadhaar / ID</span>
                <p className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {studentData.aadhaarNumber || "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Registration / Joined Date</span>
                <p className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  {formatDate(studentData.joinedDate || studentData.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Student Profile">
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-sans">
            {editError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Father / Guardian Name</label>
                <input
                  type="text"
                  value={editForm.fatherName}
                  onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">WhatsApp Number</label>
                <input
                  type="text"
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Academic Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="ACTIVE">🟢 ACTIVE</option>
                  <option value="ON_HOLD">🟡 ON HOLD</option>
                  <option value="COMPLETED">🔵 COMPLETED</option>
                  <option value="DROPPED">🔴 DROPPED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Full Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>{editSubmitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* COLLECT FEE MODAL */}
      {showFeeModal && (
        <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="Collect Tuition Fee">
          <form onSubmit={handleFeeSubmit} className="space-y-4 text-xs font-sans">
            {feeError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300">
                {feeError}
              </div>
            )}

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Select Course</label>
              <select
                value={feeForm.admissionId}
                onChange={(e) => {
                  const selId = e.target.value;
                  const adm = admissions.find((a) => a.id === selId);
                  setFeeForm({
                    ...feeForm,
                    admissionId: selId,
                    amount: adm?.pendingAmount ? String(adm.pendingAmount) : feeForm.amount,
                  });
                }}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
              >
                {!feeForm.admissionId && <option value="">-- Select an Enrolled Course --</option>}
                {admissions.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.courseNameSnapshot || adm.course?.name} (Pending Dues: ₹{Number(adm.pendingAmount).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                  required
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Payment Date *</label>
                <input
                  type="date"
                  value={feeForm.paymentDate || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFeeForm({ ...feeForm, paymentDate: e.target.value })}
                  onClick={(e) => e.target.showPicker?.()}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Payment Mode</label>
                <select
                  value={feeForm.paymentMode}
                  onChange={(e) => setFeeForm({ ...feeForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Transaction Reference / UTR</label>
                <input
                  type="text"
                  value={feeForm.transactionReference}
                  onChange={(e) => setFeeForm({ ...feeForm, transactionReference: e.target.value })}
                  placeholder="UPI Ref / Receipt Number"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFeeModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={feeSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow flex items-center space-x-1"
              >
                <CreditCard className="w-4 h-4" />
                <span>{feeSubmitting ? "Recording..." : "Record Payment & Issue Receipt"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD COURSE MODAL */}
      {showAddCourseModal && (
        <Modal isOpen={showAddCourseModal} onClose={() => setShowAddCourseModal(false)} title="Enroll in Additional Course">
          <form onSubmit={handleAddCourseSubmit} className="space-y-4 text-xs font-sans">
            {addCourseError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300">
                {addCourseError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">1. Select Department</label>
                <select
                  value={addCourseDeptId}
                  onChange={(e) => setAddCourseDeptId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-medium text-xs"
                >
                  <option value="">-- All Departments --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">2. Select Course (Searchable) *</label>
                <SearchableSelect
                  options={coursesList
                    .filter((c) => !addCourseDeptId || c.departmentId === addCourseDeptId || c.department?.id === addCourseDeptId)
                    .map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.code})`,
                      subLabel: `Fee: ₹${Number(c.fees).toLocaleString("en-IN")}`,
                      departmentName: c.department?.name || c.category,
                      fees: c.fees,
                    }))}
                  value={addCourseForm.courseId}
                  onChange={(_, val) => handleCourseSelectionChange(val)}
                  placeholder="-- Search Course --"
                  searchPlaceholder="Search by course name or code..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Course Fees (₹)</label>
                <input
                  type="number"
                  value={addCourseForm.courseFees}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, courseFees: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Initial Payment (₹)</label>
                <input
                  type="number"
                  value={addCourseForm.paymentAmount}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, paymentAmount: e.target.value })}
                  placeholder="Down Payment"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addCourseSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow flex items-center space-x-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{addCourseSubmitting ? "Enrolling..." : "Enroll Student"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT ENROLLED COURSE MODAL (SUPER ADMIN) */}
      {editingAdmission && (
        <Modal
          isOpen={!!editingAdmission}
          onClose={() => setEditingAdmission(null)}
          title={`Edit Course Details & Fee Info`}
        >
          <form onSubmit={handleEditCourseSubmit} className="space-y-4 text-xs font-sans">
            {editCourseError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300">
                {editCourseError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  1. Filter by Department
                </label>
                <select
                  value={editCourseDeptId}
                  onChange={(e) => setEditCourseDeptId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-medium text-xs"
                >
                  <option value="">-- All Departments --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  2. Transfer / Reassign Course (Search Box)
                </label>
                <SearchableSelect
                  options={coursesList
                    .filter((c) => !editCourseDeptId || c.departmentId === editCourseDeptId || c.department?.id === editCourseDeptId)
                    .map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.code})`,
                      subLabel: `Fee: ₹${Number(c.fees).toLocaleString("en-IN")}`,
                      departmentName: c.department?.name || c.category,
                      fees: c.fees,
                    }))}
                  value={editCourseForm.courseId}
                  onChange={(_, targetCourseId) => {
                    const foundCourse = coursesList.find((c) => c.id === targetCourseId);
                    const newBaseFees = foundCourse ? String(foundCourse.fees) : editCourseForm.courseFees;
                    const discountVal = Number(editCourseForm.discount || 0);
                    const finalVal = Math.max(0, Number(newBaseFees) - discountVal);
                    setEditCourseForm({
                      ...editCourseForm,
                      courseId: targetCourseId,
                      courseFees: newBaseFees,
                      finalFees: String(finalVal),
                    });
                  }}
                  placeholder="-- Search Course --"
                  searchPlaceholder="Search course name or code..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Course Fees (₹)</label>
                <input
                  type="number"
                  value={editCourseForm.courseFees}
                  onChange={(e) => {
                    const newFees = e.target.value;
                    const discountVal = Number(editCourseForm.discount || 0);
                    const finalVal = Math.max(0, Number(newFees) - discountVal);
                    setEditCourseForm({
                      ...editCourseForm,
                      courseFees: newFees,
                      finalFees: String(finalVal),
                    });
                  }}
                  required
                  min={0}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Discount (₹)</label>
                <input
                  type="number"
                  value={editCourseForm.discount}
                  onChange={(e) => {
                    const newDiscount = e.target.value;
                    const baseFeesVal = Number(editCourseForm.courseFees || 0);
                    const finalVal = Math.max(0, baseFeesVal - Number(newDiscount));
                    setEditCourseForm({
                      ...editCourseForm,
                      discount: newDiscount,
                      finalFees: String(finalVal),
                    });
                  }}
                  min={0}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-bold text-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Final Agreed Fees (₹)</label>
                <input
                  type="number"
                  value={editCourseForm.finalFees}
                  onChange={(e) =>
                    setEditCourseForm({ ...editCourseForm, finalFees: e.target.value })
                  }
                  required
                  min={0}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-extrabold text-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Remarks / Batch Notes</label>
              <textarea
                rows={2}
                value={editCourseForm.remarks}
                onChange={(e) =>
                  setEditCourseForm({ ...editCourseForm, remarks: e.target.value })
                }
                placeholder="Fee installment plan, transfer reason..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Already Paid Amount:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{Number(editingAdmission.paidAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 font-bold pt-1 border-t border-slate-900">
                <span>Updated Dues Balance:</span>
                <span className="font-mono text-amber-400">
                  ₹{Math.max(0, Number(editCourseForm.finalFees || 0) - Number(editingAdmission.paidAmount || 0)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAdmission(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editCourseSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow flex items-center space-x-1 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editCourseSubmitting ? "Updating..." : "Save Course & Fee Changes"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
