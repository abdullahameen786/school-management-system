// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';

// Admin Layout & Pages
import AdminLayout from "./components/layout/AdminLayout";
import AnalyticsOverview from './pages/admin/AnalyticsOverview';
import UserManagement from './pages/admin/UserManagement';
import ClassScheduling from './pages/admin/ClassScheduling';
import TeacherAttendance from './pages/admin/TeacherAttendance';
import Announcements from './pages/admin/Announcements';

// Teacher Layout & Pages
import TeacherLayout from './components/layout/TeacherLayout';
import TeacherClasses from './pages/teacher/TeacherClasses';
import StudentAttendance from './pages/teacher/StudentAttendance';
import GradebookPortal from './pages/teacher/GradebookPortal';

// Placeholder Components for Remaining Teacher Sub-Pages
const AssignmentsHub = () => <div className="text-xl font-bold text-slate-800">Assignments Hub</div>;
const TeacherAnnouncements = () => <div className="text-xl font-bold text-slate-800">Teacher Notice Board</div>;

// 🔒 Foolproof Protected Route Component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-indigo-600">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Access Entry Point */}
          <Route path="/login" element={<Login />} />

          {/* 🔐 Secure Admin Dashboard Flow */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AnalyticsOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="scheduling" element={<ClassScheduling />} /> 
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="announcements" element={<Announcements />} />
          </Route>

          {/* 🔐 Secure Teacher Dashboard Flow */}
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherClasses />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="grades" element={<GradebookPortal />} />
            <Route path="assignments" element={<AssignmentsHub />} />
            <Route path="announcements" element={<TeacherAnnouncements />} />
          </Route>

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;