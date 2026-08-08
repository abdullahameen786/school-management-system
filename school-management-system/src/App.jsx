// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import TeacherLayout from "./components/layout/TeacherLayout";
import UserManagement from "./pages/admin/UserManagement";
import AnalyticsOverview from "./pages/admin/AnalyticsOverview";
import TeacherAttendance from "./pages/admin/TeacherAttendance";
import ClassScheduling from "./pages/admin/ClassScheduling";
import Announcements from './pages/admin/Announcements';
import Login from "./pages/auth/Login";

// General Placeholders
const Unauthorized = () => (
  <div className="flex h-screen items-center justify-center bg-red-50">
    <h2 className="text-2xl font-bold text-red-600">401 - Unauthorized Access</h2>
  </div>
);
const StudentHome = () => (
  <div className="p-8"><h1 className="text-3xl font-bold text-sky-700">Student Dashboard Home</h1></div>
);

// 🛠️ 1. ADMIN SUB-ROUTER
const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AnalyticsOverview />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/schedule" element={<ClassScheduling />} />
        <Route path="/attendance" element={<TeacherAttendance />} />
        <Route path="/announcements" element={<Announcements />} />
      </Routes>
    </AdminLayout>
  );
};

// 🛠️ 2. TEACHER SUB-ROUTER (Fixed Sub-Routes Structure)
const TeacherDashboard = () => {
  return (
    <TeacherLayout>
      <Routes>
        {/* Index path "/" represents the baseline root page for the teacher, which is "/teacher" */}
        <Route path="/" element={
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800">My Assigned Classes</h1>
            <p className="text-slate-500 mt-1 text-sm">Real-time scheduled assigned roster courses array matching your account.</p>
          </div>
        } />
        <Route path="/attendance" element={
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800">Student Attendance Hub</h1>
          </div>
        } />
        <Route path="/grades" element={
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800">Gradebook Module</h1>
          </div>
        } />
        <Route path="/assignments" element={
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800">Assignments Hub</h1>
          </div>
        } />
      </Routes>
    </TeacherLayout>
  );
};

// 🗺️ MAIN GLOBAL ROUTER HUB
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Root Level Paths */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Boundary Group */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Teacher Boundary Group */}
          <Route path="/teacher/*" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          {/* Student Boundary Group */}
          <Route path="/student/*" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentHome />
            </ProtectedRoute>
          } />

          {/* Fallback Redirection Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;