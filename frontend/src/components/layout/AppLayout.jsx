import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  CreditCard,
  LogOut,
  GraduationCap,
  Menu,
  X,
  ShieldCheck,
  Calendar,
  MessageSquare,
  BookOpen,
  CalendarCheck,
} from "lucide-react";

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inquiries & Leads", href: "/dashboard/inquiries", icon: MessageSquare },
    { name: "Admissions", href: "/dashboard/admissions", icon: UserPlus },
    { name: "Students", href: "/dashboard/students", icon: Users },
    { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
    { name: "Fees & Analytics", href: "/dashboard/fees", icon: CreditCard },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-900">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-950">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-wide block">EduMaster ERP</span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase block">Enterprise Admin</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white shadow-lg shadow-cyan-950/50"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center space-x-3 mb-3 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Admin User"}</p>
              <div className="flex items-center space-x-1 text-[10px] text-cyan-400">
                <ShieldCheck className="w-3 h-3" />
                <span className="truncate">{user?.role || "SUPER_ADMIN"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-xs font-semibold text-rose-400 rounded-xl bg-rose-950/30 border border-rose-900/40 hover:bg-rose-900/50 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between px-6 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>{currentDate}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Public Website
            </button>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              Super Admin ERP Active
            </span>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
