// src/components/layout/StudentLayout.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, CalendarCheck, Award, FileText, 
  LogOut, Menu, X, GraduationCap, Bell 
} from 'lucide-react';

const StudentLayout = ({ children }) => {
  const { userData } = useAuth();
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
    { name: 'My Dashboard', path: '/student', icon: BookOpen },
    { name: 'My Attendance', path: '/student/attendance', icon: CalendarCheck },
    { name: 'My Grades', path: '/student/grades', icon: Award },
    { name: 'Assignments Hub', path: '/student/assignments', icon: FileText },
    { name: 'Notice Board', path: '/student/announcements', icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sky-950 text-sky-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:block'}`}>
        <div className="flex h-16 items-center justify-between px-6 bg-sky-950 border-b border-sky-900/50">
          <div className="flex items-center gap-2 text-white">
            <GraduationCap className="h-6 w-6 text-sky-400" />
            <span className="font-bold text-lg tracking-wider">EduPortal</span>
          </div>
          <button className="lg:hidden text-sky-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

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
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30' 
                    : 'text-sky-300/70 hover:bg-sky-900/50 hover:text-sky-100'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sky-900 bg-sky-950">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm z-10">
          <button className="text-slate-600 hover:text-sky-600 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{userData?.name || 'Student Name'}</p>
              <p className="text-xs font-semibold text-sky-600 capitalize">Student Portal</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-sm">
              {userData?.name ? userData.name.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;