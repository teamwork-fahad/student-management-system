import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PinProvider } from "./context/PinContext";
import { usePin } from "./context/PinContext";
import { PinLockModal } from "./components/auth/PinLockModal";
import { AppLayout } from "./components/layout/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { Dashboard } from "./pages/Dashboard";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import { Inquiries } from "./pages/Inquiries";
import { Admissions } from "./pages/Admissions";
import { Students } from "./pages/Students";
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { Courses } from "./pages/Courses";
import { Attendance } from "./pages/Attendance";
import { PublicAttendanceReport } from "./pages/PublicAttendanceReport";
import { Fees } from "./pages/Fees";
import { Expenses } from "./pages/Expenses";

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { isPinUnlocked, requestPinUnlock } = usePin();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (user?.role === "STUDENT") {
    return <Navigate to="/student/dashboard" replace />;
  }
  // If PIN is not unlocked (e.g. direct URL access or auto-lock), redirect to home
  // The home page will show the PIN modal via requestPinUnlock
  if (!isPinUnlocked) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const StudentProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (user?.role !== "STUDENT") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <PinProvider>
        <BrowserRouter>
          <PinLockModal />
          <Routes>
          {/* Public Landing Page & Reports */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/public/attendance" element={<PublicAttendanceReport />} />


          {/* Student Portal Protected Route */}
          <Route
            path="/student/dashboard"
            element={
              <StudentProtectedRoute>
                <StudentDashboard />
              </StudentProtectedRoute>
            }
          />

          {/* Admin ERP Layout Routes */}
          <Route
            path="/dashboard"
            element={
              <AdminProtectedRoute>
                <AppLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="admissions" element={<Admissions />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfilePage />} />
            <Route path="courses" element={<Courses />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="fees" element={<Fees />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
          </Route>

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PinProvider>
    </AuthProvider>
  );
};

export default App;
