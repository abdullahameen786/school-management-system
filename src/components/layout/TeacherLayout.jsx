// src/components/layout/TeacherLayout.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, CheckSquare, ClipboardList, BookOpen, 
  LogOut, Menu, X, GraduationCap, Megaphone 
} from 'lucide-react';

const TeacherLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    { name: 'My Classes', path: '/teacher', icon: BookOpen },
    { name: 'Student Attendance', path: '/teacher/attendance', icon: CheckSquare },
    { name: 'Gradebook Portal', path: '/teacher/grades', icon: ClipboardList },
    { name: 'Assignments Hub', path: '/teacher/assignments', icon: Users },
    { name: 'Notice Board', path: '/teacher/announcements', icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-emerald-950 text-emerald-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-emerald-950 border-b border-emerald-900/50">
          <div className="flex items-center gap-2 text-white">
            <GraduationCap className="h-6 w-6 text-emerald-400" />
            <span className="font-bold text-lg tracking-wider">NSES Portal</span>
          </div>
          <button className="lg:hidden text-emerald-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                    : 'text-emerald-300/70 hover:bg-emerald-900 hover:text-emerald-100'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Pinned Sign Out Section at the Absolute Bottom */}
        <div className="p-4 shrink-0 border-t border-emerald-900/80 bg-emerald-950">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main App Canvas Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm z-10">
          <button className="p-2 -ml-2 text-slate-600 hover:text-emerald-600 lg:hidden rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 tracking-tight">{user?.name || 'Instructor'}</p>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">{user?.role || 'Teacher'} Portal</p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-sm text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
            </div>
          </div>
        </header>

        {/* Main Dynamic Viewport Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;