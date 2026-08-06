import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { X, UserCheck, GraduationCap, ShieldCheck, User, Lock, Phone, Mail, MapPin, AlertCircle, CheckCircle2, BookOpen } from "lucide-react";
import api from "../../api/axios";

export const AuthModal = ({ isOpen, onClose, initialRole = "STUDENT", initialMode = "login" }) => {
  const { login, registerStudent, loading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(initialRole); // "STUDENT" | "FACULTY" | "SUPER_ADMIN"
  const [mode, setMode] = useState(initialMode); // "login" | "register"

  // Login Form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register Form state
  const [regFullName, setRegFullName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCourseId, setRegCourseId] = useState("");
  const [regAddress, setRegAddress] = useState("");

  // Courses dropdown list
  const [courses, setCourses] = useState([]);

  // Alert feedback
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/public");
      setCourses(res.data.data || []);
    } catch {
      // ignore course fetch error
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!identifier || !password) {
      setErrorMessage("Please enter Email / Mobile / Student ID and Password");
      return;
    }

    const res = await login(identifier, password);
    if (res.success) {
      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => {
        onClose();
        if (res.user?.role === "STUDENT") {
          navigate("/student/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 600);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!regFullName.trim()) {
      setErrorMessage("Full Name is required");
      return;
    }
    if (!/^\d{10}$/.test(regMobile.trim())) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    const res = await registerStudent({
      fullName: regFullName,
      mobile: regMobile,
      email: regEmail,
      password: regPassword,
      courseId: regCourseId,
      address: regAddress,
    });

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        onClose();
        navigate("/student/dashboard");
      }, 1000);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-xl text-white">
              E
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">EduMaster Account</h2>
              <p className="text-xs text-blue-200">Role-Based Student & Staff Portal</p>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 bg-black/20 rounded-xl backdrop-blur">
            <button
              type="button"
              onClick={() => { setRole("STUDENT"); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
                role === "STUDENT"
                  ? "bg-white text-blue-800 shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => { setRole("FACULTY"); setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
                role === "FACULTY"
                  ? "bg-white text-indigo-800 shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => { setRole("SUPER_ADMIN"); setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition ${
                role === "SUPER_ADMIN"
                  ? "bg-white text-purple-800 shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher (Login / Register) for Students */}
        {role === "STUDENT" && (
          <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex-1 py-3 text-center transition border-b-2 ${
                mode === "login"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent hover:text-slate-800"
              }`}
            >
              Existing Student Login
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex-1 py-3 text-center transition border-b-2 ${
                mode === "register"
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent hover:text-slate-800"
              }`}
            >
              New Student Register
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {role === "STUDENT" ? "Email, Mobile, or Student ID (e.g. STU-2025-001)" : "Email Address"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      role === "STUDENT"
                        ? "Enter Email, Mobile or STU-2025-XXX"
                        : "admin@appxwind.com"
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : `Login as ${role.replace("_", " ")}`}
              </button>

              {role === "STUDENT" && (
                <p className="text-center text-xs text-slate-500 pt-2">
                  Are you a student from the old system?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setErrorMessage(""); }}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Click here to register & link account
                  </button>
                </p>
              )}
            </form>
          )}

          {/* REGISTER FORM (Student) */}
          {mode === "register" && role === "STUDENT" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Enter student full name"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@gmail.com"
                      className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Selection</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <select
                    value={regCourseId}
                    onChange={(e) => setRegCourseId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
                  >
                    <option value="">Select Interested Course (Optional)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (₹{Number(c.fees).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Create Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address (Optional)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="City / Area address"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition disabled:opacity-50 mt-2"
              >
                {loading ? "Registering..." : "Complete Student Registration"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
