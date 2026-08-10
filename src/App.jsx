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

// 🚀 Placeholder Components for Teacher Module (To prevent import crashes)
const TeacherLayout = () => (
  <div className="p-8">
    <h1 className="text-xl font-bold mb-4 text-slate-800">Teacher Portal Base</h1>
    <p className="text-slate-500 text-sm">Dashboard pages will inject inside this container context dynamically.</p>
  </div>
);

// 🔒 Foolproof Protected Route Component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  // 1. Agar global login content check loading mein ho, spinner dikhayein
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-indigo-600">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  // 2. Agar user logged in hi nahi hai, safely login page par bhejein
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Agar user logged in hai par role matched nahi hai, root par clear karein
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

          {/* 🔐 🚀 New Secure Teacher Dashboard Flow */}
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            {/* Teacher layouts pages layout context updates will map down here */}
            <Route index element={<div className="text-sm font-semibold text-slate-700">Teacher Overview Panel Live</div>} />
          </Route>

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;