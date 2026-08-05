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

export const Admissions = () => {
  const [inquiries, setInquiries] = useState([]);
  const [courses, setCourses] = useState([]);
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
      const [inquiriesRes, coursesRes] = await Promise.all([
        api.get("/inquiries?status=INTERESTED"),
        api.get("/courses"),
      ]);

      setInquiries(inquiriesRes.data?.data || []);
      setCourses(coursesRes.data?.data || []);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-cyan-400" />
            Student Admission Onboarding
          </h1>
          <p className="text-xs text-slate-400 mt-1">
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Inquiry & Course Selection */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> 1. Inquiry & Course Mapping
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Inquiry <span className="text-rose-400">*</span>
              </label>
              <select
                name="inquiryId"
                value={formData.inquiryId}
                onChange={(e) => handleInquiryChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="">-- Choose Lead Inquiry --</option>
                {inquiries.map((inq) => (
                  <option key={inq.id} value={inq.id}>
                    {inq.inquiryNumber} - {inq.fullName} ({inq.mobile})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enrolled Course
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="">-- Use Course From Inquiry --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - ₹{c.fees}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Batch Code (Optional)
              </label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleInputChange}
                placeholder="e.g. BATCH-2026-A"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Student Demographic Profile */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            2. Student Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Father's Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mother's Name</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Student Mobile <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Student Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Student Category</label>
              <select
                name="studentCategory"
                value={formData.studentCategory}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
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
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            3. Guardian Contact Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guardian Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guardian Mobile <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="guardianMobile"
                value={formData.guardianMobile}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Guardian Relation</label>
              <select
                name="guardianRelation"
                value={formData.guardianRelation}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
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
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" /> 4. Fees Discount & Down Payment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fee Discount (₹)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Down Payment (₹)</label>
              <input
                type="number"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reference / UTR</label>
              <input
                type="text"
                name="transactionReference"
                value={formData.transactionReference}
                onChange={handleInputChange}
                placeholder="e.g. UPI/123456789"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Admission Remarks</label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="e.g. Scholarship discount approved by Director"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-cyan-950 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing Transaction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-cyan-200" />
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
          <div className="space-y-5 text-slate-200">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center space-x-3 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold text-sm">Admission & Student Onboarded!</p>
                <p className="text-xs text-emerald-400/80">
                  Transaction committed across Admission, Student, User, and Payment tables.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block uppercase font-semibold">Admission No</span>
                <span className="text-lg font-black text-cyan-400 font-mono">
                  {successModal.admission?.admissionNumber}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block uppercase font-semibold">Generated Student ID</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {successModal.student?.studentId}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block uppercase font-semibold">Student Name</span>
                <span className="text-sm font-bold text-slate-100">{successModal.student?.fullName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block uppercase font-semibold">Course</span>
                <span className="text-sm font-bold text-slate-100">{successModal.admission?.courseNameSnapshot}</span>
              </div>
            </div>

            {successModal.user && (
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 space-y-1">
                <p className="text-xs font-bold text-cyan-400 uppercase">Auto-Generated User Account</p>
                <p className="text-xs text-slate-300">
                  Email: <span className="font-mono text-white">{successModal.user.email}</span>
                </p>
                <p className="text-xs text-slate-300">
                  Initial Password: <span className="font-mono text-cyan-300">{successModal.user.initialPassword}</span>
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
