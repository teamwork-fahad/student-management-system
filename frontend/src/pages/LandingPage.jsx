import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usePin } from "../context/PinContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "../components/auth/AuthModal";
import {
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Send,
  Sparkles,
  ShieldCheck,
  Clock,
  LayoutDashboard,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import api from "../api/axios";

export const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { requestPinUnlock } = usePin();
  const { theme, toggleTheme, isDark } = useTheme();

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialRole={authRole}
        initialMode={authMode}
      />

      {/* Glassy Floating Navbar */}
      <div className="sticky top-3 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-md shadow-slate-900/5 dark:shadow-black/20 flex items-center justify-between px-5 sm:px-6 transition-all duration-300">

          {/* Brand Logo */}
          <div className="flex items-center space-x-3.5 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-blue-600 dark:text-blue-400">
                E
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                EduMaster
              </span>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-600 dark:text-blue-400 block -mt-0.5">
                Academy Portal
              </span>
            </div>
          </div>

          {/* Quick Nav links with Premium Animated Underline */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#hero" className="group relative py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer">
              <span>Home</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
            <a href="#courses" className="group relative py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer">
              <span>Courses</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
            <a href="#features" className="group relative py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer">
              <span>Features</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
            <a href="#inquiry" className="group relative py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer">
              <span>Inquiry</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
            </a>
          </nav>

          {/* Controls & Theme Toggle */}
          <div className="flex items-center">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
              title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 dark:bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Next-Gen Student Management & Learning Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] text-slate-900 dark:text-white">
            Smart Education Management for <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">EduMaster</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
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
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Explore Courses</span>
            </a>
          </div>

          {/* Key Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur text-center">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">80+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enrolled Students</div>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur text-center">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">35+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certified Courses</div>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur text-center">
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital Receipts</div>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur text-center">
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">99.8%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Satisfaction Rate</div>
            </div>
          </div>

        </div>
      </section>

      {/* COURSES SHOWCASE SECTION */}
      <section id="courses" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-t border-b border-slate-200 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Featured Courses & Programs</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">Select from our industry-oriented technology, computer, and academic programs.</p>
          </div>

          {loadingCourses ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading available courses...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 9).map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-xl text-[11px] font-bold tracking-wide uppercase">
                        {c.code}
                      </span>
                      <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{c.duration} {c.durationType}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 font-normal leading-relaxed">
                      {c.description || "Comprehensive course covering practical and theoretical fundamentals."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tuition Fee</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ₹{Number(c.fees).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setInqCourseId(c.id);
                        document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/60 dark:hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 rounded-xl text-xs font-bold transition"
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
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Comprehensive Platform Features</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">Designed specifically to cater to Students, Faculty, and Academy Management.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Student Self-Service Portal</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Students can log in to view course enrollment, track pending fees, and download official payment receipts anytime.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Instant Fee Receipt Generation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated payment receipts with digital signatures, printable format, and clear breakdown of paid vs pending fees.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Role-Based Auth Security</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Strict permission control isolating Super Admin ERP, Faculty controls, and Student personal dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INQUIRY SECTION */}
      <section id="inquiry" className="py-20 bg-slate-100/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Have Questions? Send Course Inquiry</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Fill out this quick form and our counseling team will get in touch with you.</p>
            </div>

            {inqSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{inqSuccess}</span>
              </div>
            )}

            {inqError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-700/80 text-rose-800 dark:text-rose-300 text-xs">
                {inqError}
              </div>
            )}

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inqName}
                    onChange={(e) => setInqName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={inqMobile}
                    onChange={(e) => setInqMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inqEmail}
                    onChange={(e) => setInqEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Interested Course</label>
                  <select
                    value={inqCourseId}
                    onChange={(e) => setInqCourseId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 focus:border-blue-600 outline-none transition"
                  >
                    <option value="">Select Course (Optional)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Message / Remarks</label>
                <textarea
                  rows={3}
                  value={inqRemarks}
                  onChange={(e) => setInqRemarks(e.target.value)}
                  placeholder="Tell us about your batch preference or questions..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={inqSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{inqSubmitting ? "Submitting..." : "Submit Inquiry"}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} EduMaster Student Management System. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};
