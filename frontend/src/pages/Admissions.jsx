import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UserCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { SearchableSelect } from "../components/common/SearchableSelect";
export const Admissions = () => {
  const [inquiries, setInquiries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successModal, setSuccessModal] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    inquiryId: "",
    courseId: "",
    batchId: "",
    studentCategory: "COLLEGE",
    fullName: "",
    fatherName: "",
    motherName: "",
    gender: "Male",
    dob: "",
    mobile: "",
    whatsapp: "",
    email: "",
    guardianName: "",
    guardianMobile: "",
    guardianRelation: "FATHER",
    address: "",
    city: "",
    state: "",
    pincode: "",
    discount: "0",
    referredBy: "",
    remarks: "",
    paymentAmount: "0",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "CASH",
    transactionReference: "",
    paymentRemarks: "",
  });

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    setLoading(true);
    try {
      const [inquiriesRes, coursesRes, deptsRes] = await Promise.all([
        api.get("/inquiries?status=INTERESTED"),
        api.get("/courses"),
        api.get("/departments"),
      ]);

      setInquiries(inquiriesRes.data?.data || []);
      setCourses(coursesRes.data?.data || []);
      setDepartments(deptsRes.data?.data || []);
    } catch (err) {
      console.error("Prerequisites fetch error:", err);
      setError("Failed to load inquiries and courses. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill student fields when inquiry is selected
  const handleInquiryChange = (inquiryId) => {
    const selectedInquiry = inquiries.find((i) => i.id === inquiryId);
    if (selectedInquiry) {
      setFormData((prev) => ({
        ...prev,
        inquiryId,
        courseId: selectedInquiry.courseId || prev.courseId,
        fullName: selectedInquiry.fullName || prev.fullName,
        mobile: selectedInquiry.mobile || prev.mobile,
        whatsapp: selectedInquiry.whatsapp || selectedInquiry.mobile || prev.whatsapp,
        email: selectedInquiry.email || prev.email,
        gender: selectedInquiry.gender || prev.gender,
        guardianName: selectedInquiry.fullName ? `Guardian of ${selectedInquiry.fullName}` : prev.guardianName,
        guardianMobile: selectedInquiry.mobile || prev.guardianMobile,
      }));
    } else {
      setFormData((prev) => ({ ...prev, inquiryId }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.inquiryId) {
      setError("Please select an Inquiry to proceed with Admission.");
      return;
    }

    if (!formData.guardianName || !formData.guardianMobile) {
      setError("Guardian Name and Guardian Mobile are required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        inquiryId: formData.inquiryId,
        courseId: formData.courseId || undefined,
        batchId: formData.batchId || undefined,
        studentCategory: formData.studentCategory,
        guardianName: formData.guardianName,
        guardianMobile: formData.guardianMobile,
        guardianRelation: formData.guardianRelation,
        discount: Number(formData.discount || 0),
        referredBy: formData.referredBy || undefined,
        remarks: formData.remarks || undefined,
        studentDetails: {
          fullName: formData.fullName,
          fatherName: formData.fatherName || undefined,
          motherName: formData.motherName || undefined,
          gender: formData.gender,
          dob: formData.dob ? new Date(formData.dob) : undefined,
          mobile: formData.mobile,
          whatsapp: formData.whatsapp || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          pincode: formData.pincode || undefined,
        },
        userCredentials: {
          email: formData.email || undefined,
        },
        payments:
          Number(formData.paymentAmount || 0) > 0
            ? [
                {
                  amount: Number(formData.paymentAmount),
                  paymentMode: formData.paymentMode,
                  paymentDate: formData.paymentDate || undefined,
                  transactionReference: formData.transactionReference || undefined,
                  remarks: formData.paymentRemarks || "Admission Down Payment",
                },
              ]
            : [],
      };

      const response = await api.post("/admissions", payload);
      const createdData = response.data?.data;

      setSuccessModal(createdData);
      fetchPrerequisites(); // Refresh inquiries list

      // Reset form
      setFormData({
        inquiryId: "",
        courseId: "",
        batchId: "",
        studentCategory: "COLLEGE",
        fullName: "",
        fatherName: "",
        motherName: "",
        gender: "Male",
        dob: "",
        mobile: "",
        whatsapp: "",
        email: "",
        guardianName: "",
        guardianMobile: "",
        guardianRelation: "FATHER",
        address: "",
        city: "",
        state: "",
        pincode: "",
        discount: "0",
        referredBy: "",
        remarks: "",
        paymentAmount: "0",
        paymentMode: "CASH",
        transactionReference: "",
        paymentRemarks: "",
      });
    } catch (err) {
      console.error("Admission creation error:", err);
      const msg = err.response?.data?.message || "Failed to process admission. Please check input details.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading admission configuration..." />;
  }

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UserPlus className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Student Admission Onboarding
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Convert lead inquiries to admitted students with auto-generated IDs and fee snapshots.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Section 1: Inquiry & Course Selection */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 w-full">
          <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> 1. Inquiry & Course Mapping
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Inquiry <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={inquiries.map((inq) => ({
                  value: inq.id,
                  label: `${inq.inquiryNumber} - ${inq.fullName}`,
                  subLabel: `Mobile: ${inq.mobile}`,
                }))}
                value={formData.inquiryId}
                onChange={(_, val) => handleInquiryChange(val)}
                placeholder="-- Search & Choose Lead Inquiry --"
                searchPlaceholder="Type name, mobile or inquiry no..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Filter Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-2xs cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Enrolled Course (Searchable)
              </label>
              <SearchableSelect
                options={(() => {
                  const selDept = departments.find((d) => d.id === selectedDeptId || d.name === selectedDeptId);
                  const selDeptName = selDept ? selDept.name : selectedDeptId;

                  return courses
                    .filter((c) => {
                      if (!selectedDeptId) return true;
                      return (
                        c.departmentId === selectedDeptId ||
                        c.department?.id === selectedDeptId ||
                        c.department?.name === selectedDeptId ||
                        c.category === selectedDeptId ||
                        (selDeptName && (c.category === selDeptName || c.department?.name === selDeptName))
                      );
                    })
                    .map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.code})`,
                      subLabel: c.department?.name || c.category || "",
                    }));
                })()}
                value={formData.courseId}
                onChange={(_, val) => setFormData((prev) => ({ ...prev, courseId: val }))}
                placeholder="-- Search & Select Course --"
                searchPlaceholder="Type course name or code..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Batch Code (Optional)
              </label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleInputChange}
                placeholder="e.g. BATCH-2026-A"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Student Demographic Profile */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 w-full">
          <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            2. Student Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Father's Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mother's Name</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Student Mobile <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                required
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Student Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Student Category</label>
              <select
                name="studentCategory"
                value={formData.studentCategory}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              >
                <option value="SCHOOL">SCHOOL</option>
                <option value="COLLEGE">COLLEGE</option>
                <option value="WORKING">WORKING</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Guardian Details */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 w-full">
          <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            3. Guardian Contact Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Guardian Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleInputChange}
                required
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Guardian Mobile <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="guardianMobile"
                value={formData.guardianMobile}
                onChange={handleInputChange}
                required
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Guardian Relation</label>
              <select
                name="guardianRelation"
                value={formData.guardianRelation}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              >
                <option value="FATHER">FATHER</option>
                <option value="MOTHER">MOTHER</option>
                <option value="BROTHER">BROTHER</option>
                <option value="SISTER">SISTER</option>
                <option value="SPOUSE">SPOUSE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Discount & Initial Fee Payment */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 w-full">
          <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 4. Fees Discount & Down Payment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fee Discount (₹)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Down Payment (₹)</label>
              <input
                type="number"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleInputChange}
                min="0"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Date</label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                onClick={(e) => e.target.showPicker?.()}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reference / UTR</label>
              <input
                type="text"
                name="transactionReference"
                value={formData.transactionReference}
                onChange={handleInputChange}
                placeholder="e.g. UPI/123456789"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Admission Remarks</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="e.g. Scholarship discount approved by Director"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing Transaction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-blue-200" />
                <span>Complete Admission Onboarding</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={!!successModal}
        onClose={() => setSuccessModal(null)}
        title="🎉 Admission Successfully Processed!"
      >
        {successModal && (
          <div className="space-y-5 text-slate-800 dark:text-slate-200">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-bold text-sm">Admission & Student Onboarded!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/80">
                  Transaction committed across Admission, Student, User, and Payment tables.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Admission No</span>
                <span className="text-lg font-black text-blue-600 dark:text-cyan-400 font-mono">
                  {successModal.admission?.admissionNumber}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Generated Student ID</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {successModal.student?.studentId}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Student Name</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{successModal.student?.fullName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Course</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{successModal.admission?.courseNameSnapshot}</span>
              </div>
            </div>

            {successModal.user && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-800/40 space-y-1">
                <p className="text-xs font-bold text-blue-600 dark:text-cyan-400 uppercase">Auto-Generated User Account</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Email: <span className="font-mono text-slate-900 dark:text-white font-bold">{successModal.user.email}</span>
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Initial Password: <span className="font-mono text-blue-600 dark:text-cyan-300 font-bold">{successModal.user.initialPassword}</span>
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSuccessModal(null)}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Close & Continue
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
