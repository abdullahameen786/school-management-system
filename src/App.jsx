// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
//admin
import AdminLayout from "./components/layout/AdminLayout";;
import AnalyticsOverview from './pages/admin/AnalyticsOverview';

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
            {/* Default Admin View Element */}
            <Route index element={<AnalyticsOverview />} />
            {/* Baqi child admin routes yahan aayenge, jaise: */}
            {/* <Route path="users" element={<UserManagement />} /> */}
          </Route>

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;