import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePin } from "../../context/PinContext";
import { useTheme } from "../../context/ThemeContext";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
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
  Wallet,
  BarChart3,
  Lock,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
} from "lucide-react";

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const { lockPin } = usePin();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Inquiries & Leads", href: "/dashboard/inquiries", icon: MessageSquare },
    { name: "Admissions", href: "/dashboard/admissions", icon: UserPlus },
    { name: "Students", href: "/dashboard/students", icon: Users },
    { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
    { name: "Fees & Revenue", href: "/dashboard/fees", icon: CreditCard },
    { name: "Expenses ERP", href: "/dashboard/expenses", icon: Wallet },
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out md:static md:translate-x-0 shadow-xl md:shadow-none ${
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Brand Header */}
        <div className={`flex items-center justify-between h-20 px-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 ${collapsed ? "md:justify-center md:px-2" : ""}`}>
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight block">
                  EduMaster
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase block">
                  Academy ERP
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={`flex items-center ${collapsed ? "md:justify-center md:px-0" : "px-4"} py-3 text-xs font-semibold rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"} ${collapsed ? "md:mr-0" : "mr-3"}`} />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Quick Actions Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          {(!collapsed || mobileOpen) ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name || "Admin User"}</p>
                  <div className="flex items-center space-x-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="truncate">{user?.role || "SUPER_ADMIN"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { lockPin(); navigate("/"); }}
                  className="flex items-center justify-center py-2 px-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                  title="Lock ERP and require PIN to re-enter"
                >
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  <span>Lock</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center py-2 px-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                  title="Logout Session"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3 py-1">
              <button
                onClick={() => { lockPin(); navigate("/"); }}
                className="p-2 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
                title="Lock ERP"
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Glassy Floating Top Navbar */}
        <div className="px-3 sm:px-6 pt-3 shrink-0">
          <header className="h-16 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl rounded-2xl flex items-center justify-between px-4 shadow-sm z-30">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"
                title="Open Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Quick Search visual input */}
              <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 w-64">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 flex-1">Search ERP...</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">⌘K</kbd>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Date pill */}
              <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="whitespace-nowrap">{currentDate}</span>
              </div>

              {/* Notification Dropdown */}
              <NotificationDropdown />

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400 animate-scale-in" /> : <Moon className="w-4 h-4 text-slate-700 animate-scale-in" />}
              </button>

              {/* Public Website Button */}
              <button
                onClick={() => navigate("/")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition whitespace-nowrap border border-slate-200 dark:border-slate-700/60"
              >
                Public Site
              </button>

              {/* Status Badge */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shrink-0" />
                <span className="hidden min-[420px]:inline">ERP Active</span>
              </span>
            </div>
          </header>
        </div>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
