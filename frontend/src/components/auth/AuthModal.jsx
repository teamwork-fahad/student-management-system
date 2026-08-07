import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { X, UserCheck, GraduationCap, ShieldCheck, User, Lock, Phone, Mail, MapPin, AlertCircle, CheckCircle2, BookOpen, KeyRound, ArrowRight, Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";

export const AuthModal = ({ isOpen, onClose, initialRole = "STUDENT", initialMode = "login" }) => {
  const { login, registerStudent, loading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(initialRole); // "STUDENT" | "FACULTY" | "SUPER_ADMIN"
  const [mode, setMode] = useState(initialMode); // "login" | "register" | "forgot-password"

  // Password visibility states
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

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

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState(1); // 1: Identifier input, 2: OTP & New Password input
  const [forgotId, setForgotId] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);


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
      setForgotStep(1);
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/public");
      setCourses(res.data.data || []);
    } catch {
      // ignore
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

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!forgotId) {
      setErrorMessage("Please enter your Email, Mobile, or Student ID.");
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { identifier: forgotId });
      setSuccessMessage(res.data.message || "OTP code sent to your email! Please check your email inbox.");
      setForgotStep(2);
      setForgotOtp("");
    } catch (err) {

      setErrorMessage(err.response?.data?.message || "Failed to generate OTP.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!forgotOtp || !forgotNewPass || !forgotConfirmPass) {
      setErrorMessage("Please enter the 6-digit OTP code, New Password, and Confirm Password.");
      return;
    }

    if (forgotNewPass !== forgotConfirmPass) {
      setErrorMessage("New Password and Confirm Password do not match! Please check again.");
      return;
    }

    if (forgotNewPass.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setForgotSubmitting(true);

    try {
      const res = await api.post("/auth/reset-password", {
        identifier: forgotId,
        otpCode: forgotOtp,
        newPassword: forgotNewPass,
      });
      setSuccessMessage(res.data.message || "Password reset successful! You can now login.");
      setTimeout(() => {
        setMode("login");
        setIdentifier(forgotId);
        setErrorMessage("");
      }, 1200);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const isAlreadyRegisteredError = errorMessage.toLowerCase().includes("already registered");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto font-sans">
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
              <h2 className="text-xl font-bold tracking-tight">EduMaster Portal</h2>
              <p className="text-xs text-blue-200">Role-Based Student & Staff System</p>
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

        {/* Mode Switcher (Login vs Register vs Forgot Password) */}
        {role === "STUDENT" && (
          <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                mode === "login"
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent hover:text-blue-600"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                mode === "register"
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent hover:text-blue-600"
              }`}
            >
              Register Account
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6">
          
          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>

              {/* Special Action Buttons if Already Registered */}
              {isAlreadyRegisteredError && (
                <div className="pt-2 flex items-center space-x-2 border-t border-rose-200/60">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setErrorMessage(""); }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-[11px] hover:bg-blue-700 shadow"
                  >
                    Go to Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot-password"); setForgotId(regEmail || regMobile); setErrorMessage(""); }}
                    className="px-3 py-1.5 bg-slate-800 text-slate-100 rounded-xl font-bold text-[11px] hover:bg-slate-700 shadow"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {mode === "forgot-password" ? (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Reset Account Password</h3>
                <p className="text-xs text-slate-500">Enter your identifier to receive a password reset OTP.</p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email, Mobile, or Student ID *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={forgotId}
                        onChange={(e) => setForgotId(e.target.value)}
                        placeholder="e.g. STU-2025-001 or 9876543210 or email@domain.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{forgotSubmitting ? "Generating OTP..." : "Get Reset OTP"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full text-center text-xs text-blue-600 font-semibold hover:underline block pt-2"
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Enter 6-Digit OTP Code *</label>
                    <input
                      type="text"
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP code"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-center font-mono font-bold text-lg outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        minLength={6}
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        placeholder="Enter new strong password"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                        title={showNewPass ? "Hide password" : "Show password"}
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        required
                        minLength={6}
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        placeholder="Re-enter new password to confirm"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                        title={showConfirmPass ? "Hide password" : "Show password"}
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{forgotSubmitting ? "Updating..." : "Reset & Set New Password"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-full text-center text-xs text-slate-500 font-semibold hover:underline block pt-1"
                  >
                    Resend OTP or Change Identifier
                  </button>
                </form>
              )}
            </div>
          ) : mode === "login" ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {role === "STUDENT" ? "Email / Mobile / Student ID *" : "Email Address *"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      role === "STUDENT"
                        ? "STU-2025-001 or 9876543210 or email"
                        : "admin@appxwind.com"
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Password *</label>
                  {role === "STUDENT" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot-password"); setForgotId(identifier); setErrorMessage(""); }}
                      className="text-[11px] text-blue-600 hover:underline font-bold"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                    title={showLoginPass ? "Hide password" : "Show password"}
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? "Authenticating..." : `Sign In as ${role.replace("_", " ")}`}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Enter full legal name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Set Password *</label>
                <div className="relative">
                  <input
                    type={showRegPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                    title={showRegPass ? "Hide password" : "Show password"}
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>


              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enrolled / Interested Course</label>
                <select
                  value={regCourseId}
                  onChange={(e) => setRegCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="">Select Academic Program...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - ₹{Number(c.fees).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / City</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Residential address"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-50 mt-2"
              >
                {loading ? "Creating Account..." : "Create Student Account"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
