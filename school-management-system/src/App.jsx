// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
// Admin
import AdminLayout from "./components/layout/AdminLayout";
import UserManagement from "./pages/admin/UserManagement";
import AnalyticsOverview from "./pages/admin/AnalyticsOverview";
import TeacherAttendance from "./pages/admin/TeacherAttendance";
import ClassScheduling from "./pages/admin/ClassScheduling";
import Announcements from "./pages/admin/Announcements";
// Teacher
import TeacherLayout from "./components/layout/TeacherLayout";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import StudentAttendance from "./pages/teacher/StudentAttendance";
import AssignmentsHub from "./pages/teacher/AssignmentsHub";
import GradebookPortal from "./pages/teacher/GradebookPortal";
import TeacherAnnouncementsView from './pages/teacher/TeacherAnnouncementsView';
// Student
import StudentLayout from "./components/layout/StudentLayout";
import StudentDashboardHome from "./pages/student/StudentDashboardHome";
import StudentAttendanceView from "./pages/student/StudentAttendanceView";
import StudentAssignmentsView from "./pages/student/StudentAssignmentsView";
import StudentGradesView from "./pages/student/StudentGradesView";
import StudentAnnouncementsView from "./pages/student/StudentAnnouncementsView";
//auth/login
import Login from "./pages/auth/Login";

// General Placeholders
const Unauthorized = () => (
  <div className="flex h-screen items-center justify-center bg-red-50">
    <h2 className="text-2xl font-bold text-red-600">
      401 - Unauthorized Access
    </h2>
  </div>
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

// 🛠️ 2. TEACHER SUB-ROUTER
const TeacherDashboard = () => {
  return (
    <TeacherLayout>
      <Routes>
        <Route path="/" element={<TeacherClasses />} />
        <Route path="/attendance" element={<StudentAttendance />} />
        <Route path="/grades" element={<GradebookPortal />} />
        <Route path="/assignments" element={<AssignmentsHub />} />
        <Route path="/announcements" element={<TeacherAnnouncementsView />} />
      </Routes>
    </TeacherLayout>
  );
};

// 🛠️ 3. STUDENT SUB-ROUTER (Fixed Sub-Routes Structure)
const StudentDashboard = () => {
  return (
    <StudentLayout>
      <Routes>
        {/* Baseline Root Page for Student */}
        <Route path="/" element={<StudentDashboardHome />} />
        <Route path="/attendance" element={<StudentAttendanceView />} />
        <Route path="/grades" element={<StudentGradesView />} />
        <Route path="/assignments" element={<StudentAssignmentsView />} />
        <Route path="/announcements" element={<StudentAnnouncementsView />} />
      </Routes>
    </StudentLayout>
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
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Teacher Boundary Group */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Boundary Group */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirection Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
