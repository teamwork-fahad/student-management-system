import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usePin } from "../context/PinContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "../components/auth/AuthModal";
import {
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Send,
  Sparkles,
  ShieldCheck,
  Building,
  PhoneCall,
  LogIn,
  LayoutDashboard,
  CheckCircle2,
  Clock,
} from "lucide-react";
import api from "../api/axios";

export const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { requestPinUnlock } = usePin();

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState("STUDENT");
  const [authMode, setAuthMode] = useState("login");

  // Courses data
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Inquiry Form state
  const [inqName, setInqName] = useState("");
  const [inqMobile, setInqMobile] = useState("");
  const [inqEmail, setInqEmail] = useState("");
  const [inqCourseId, setInqCourseId] = useState("");
  const [inqRemarks, setInqRemarks] = useState("");
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqSuccess, setInqSuccess] = useState("");
  const [inqError, setInqError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/public");
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const openAuth = (role = "STUDENT", mode = "login") => {
    setAuthRole(role);
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInqSuccess("");
    setInqError("");

    if (!inqName || !inqMobile) {
      setInqError("Please provide your name and mobile number");
      return;
    }

    setInqSubmitting(true);
    try {
      const res = await api.post("/inquiries/public", {
        fullName: inqName,
        mobile: inqMobile,
        email: inqEmail,
        courseId: inqCourseId,
        remarks: inqRemarks,
      });

      setInqSuccess(res.data.message || "Inquiry submitted successfully!");
      setInqName("");
      setInqMobile("");
      setInqEmail("");
      setInqCourseId("");
      setInqRemarks("");
    } catch (err) {
      setInqError(err.response?.data?.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setInqSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialRole={authRole}
        initialMode={authMode}
      />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-blue-400">
                E
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
                EduMaster
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-bold text-blue-400">
                Academy Portal
              </span>
            </div>
          </div>

          {/* Quick Nav links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#hero" className="hover:text-blue-400 transition">Home</a>
            <a href="#courses" className="hover:text-blue-400 transition">Courses</a>
            <a href="#features" className="hover:text-blue-400 transition">Features</a>
            <a href="#inquiry" className="hover:text-blue-400 transition">Inquiry</a>
          </nav>

          {/* User Auth Buttons */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  if (user?.role === "STUDENT") {
                    navigate("/student/dashboard");
                  } else {
                    // 🔐 PIN guard for Admin ERP
                    requestPinUnlock(() => navigate("/dashboard"));
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{user?.role === "STUDENT" ? "Student Portal" : "Admin ERP Dashboard"}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuth("STUDENT", "login")}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition flex items-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Student Login</span>
                </button>

                <button
                  onClick={() => openAuth("STUDENT", "register")}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition"
                >
                  Register Now
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-16 pb-24 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-purple-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Next-Gen Student Management & Learning Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] text-white">
            Smart Education Management for <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">EduMaster</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Manage course admissions, digital fee receipts, student ledger, inquiry tracking, and role-based portals in one seamless system.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openAuth("STUDENT", "register")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 hover:scale-105"
            >
              <span>Student Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#courses"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl font-semibold text-sm transition flex items-center justify-center space-x-2"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Explore Courses</span>
            </a>
          </div>

          {/* Key Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur text-center">
              <div className="text-3xl font-black text-white mb-1">80+</div>
              <div className="text-xs text-slate-400 font-medium">Enrolled Students</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur text-center">
              <div className="text-3xl font-black text-blue-400 mb-1">35+</div>
              <div className="text-xs text-slate-400 font-medium">Certified Courses</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur text-center">
              <div className="text-3xl font-black text-indigo-400 mb-1">100%</div>
              <div className="text-xs text-slate-400 font-medium">Digital Receipts</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur text-center">
              <div className="text-3xl font-black text-emerald-400 mb-1">99.8%</div>
              <div className="text-xs text-slate-400 font-medium">Student Satisfaction</div>
            </div>
          </div>

        </div>
      </section>

      {/* COURSES SHOWCASE SECTION */}
      <section id="courses" className="py-20 bg-slate-900/50 border-t border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Featured Courses & Programs</h2>
            <p className="mt-3 text-slate-400 text-sm">Select from our industry-oriented technology, computer, and academic programs.</p>
          </div>

          {loadingCourses ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading available courses...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 9).map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-950 rounded-2xl p-6 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-950 text-blue-300 border border-blue-800/60 rounded-lg text-[11px] font-bold tracking-wide uppercase">
                        {c.code}
                      </span>
                      <div className="flex items-center space-x-1 text-slate-400 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>{c.duration} {c.durationType}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 font-normal">
                      {c.description || "Comprehensive course covering practical and theoretical fundamentals."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Tuition Fee</span>
                      <span className="text-lg font-extrabold text-emerald-400">
                        ₹{Number(c.fees).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setInqCourseId(c.id);
                        document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-semibold transition"
                    >
                      Enquire Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Comprehensive Platform Features</h2>
            <p className="mt-3 text-slate-400 text-sm">Designed specifically to cater to Students, Faculty, and Academy Management.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Student Self-Service Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Students can log in to view course enrollment, track pending fees, and download official payment receipts anytime.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Fee Receipt Generation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated payment receipts with digital signatures, printable format, and clear breakdown of paid vs pending fees.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Role-Based Auth Security</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict permission control isolating Super Admin ERP, Faculty controls, and Student personal dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INQUIRY SECTION */}
      <section id="inquiry" className="py-20 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Have Questions? Send Course Inquiry</h2>
              <p className="text-xs text-slate-400 mt-2">Fill out this quick form and our counseling team will get in touch with you.</p>
            </div>

            {inqSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{inqSuccess}</span>
              </div>
            )}

            {inqError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-700/80 text-red-300 text-xs">
                {inqError}
              </div>
            )}

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inqName}
                    onChange={(e) => setInqName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={inqMobile}
                    onChange={(e) => setInqMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inqEmail}
                    onChange={(e) => setInqEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Interested Course</label>
                  <select
                    value={inqCourseId}
                    onChange={(e) => setInqCourseId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none transition"
                  >
                    <option value="">Select Course (Optional)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-slate-300 mb-1">Message / Remarks</label>
                <textarea
                  rows={3}
                  value={inqRemarks}
                  onChange={(e) => setInqRemarks(e.target.value)}
                  placeholder="Tell us about your batch preference or questions..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={inqSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{inqSubmitting ? "Submitting..." : "Submit Inquiry"}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-slate-950 border-t border-slate-900 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} EduMaster Student Management System. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};
