import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { Dashboard } from "./pages/Dashboard";
import { Inquiries } from "./pages/Inquiries";
import { Admissions } from "./pages/Admissions";
import { Students } from "./pages/Students";
import { Courses } from "./pages/Courses";
import { Attendance } from "./pages/Attendance";
import { Fees } from "./pages/Fees";

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (user?.role === "STUDENT") {
    return <Navigate to="/student/dashboard" replace />;
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
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page at root http://localhost:5173/ */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />

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
            <Route path="courses" element={<Courses />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="fees" element={<Fees />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
