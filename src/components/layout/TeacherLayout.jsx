// src/components/layout/TeacherLayout.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, CheckSquare, ClipboardList, BookOpen, 
  LogOut, Menu, X, GraduationCap, Megaphone, 
  Key, Eye, EyeOff, ShieldCheck, AlertCircle 
} from 'lucide-react';

const TeacherLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    existingPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showExisting, setShowExisting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found.');
      }

      // 1. Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.existingPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Update password in Firebase Auth
      await updatePassword(currentUser, passwordForm.newPassword);

      // 3. Update Firestore users collection password field for admin sync
      await updateDoc(doc(db, 'users', currentUser.uid), {
        password: passwordForm.newPassword,
        updatedAt: new Date().toISOString()
      });

      setPasswordSuccess('Password updated successfully in database!');
      setPasswordForm({ existingPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 2000);

    } catch (error) {
      console.error("Password update error:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPasswordError('Incorrect existing password entered.');
      } else {
        setPasswordError(error.message || 'Failed to update password.');
      }
    } finally {
      setPasswordLoading(false);
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
      
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-emerald-950 text-emerald-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* 🚀 Updated Brand Header with School Subtitle */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4 bg-emerald-950 border-b border-emerald-900/50">
          <div className="flex items-center gap-3 text-white">
            <div className="h-10 w-10 rounded-xl bg-emerald-900/50 border border-emerald-800/60 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide block leading-tight">NSES Portal</span>
              <span className="text-[11px] text-emerald-400/80 font-medium tracking-wide block mt-0.5">National Standard Edu System</span>
            </div>
          </div>
          <button className="lg:hidden text-emerald-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(false)}>
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

        <div className="p-4 shrink-0 border-t border-emerald-900/80 bg-emerald-950 space-y-2">
          <button 
            onClick={() => {
              setIsPasswordModalOpen(true);
              setSidebarOpen(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-300/80 hover:bg-emerald-900 hover:text-emerald-100 rounded-xl transition-colors cursor-pointer"
          >
            <Key className="h-5 w-5 shrink-0 text-emerald-400" />
            Update Password
          </button>

          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 my-8">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Key className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
              
              {passwordError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" /> {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" /> {passwordSuccess}
                </div>
              )}

              <div>
                <label htmlFor="existingPasswordInput" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Existing Password</label>
                <div className="relative">
                  <input
                    id="existingPasswordInput"
                    name="existingPassword"
                    type={showExisting ? "text" : "password"}
                    required
                    value={passwordForm.existingPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, existingPassword: e.target.value })}
                    className="block w-full pl-3 pr-10 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Enter existing password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowExisting(!showExisting)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showExisting ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPasswordInput" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <input
                    id="newPasswordInput"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="block w-full pl-3 pr-10 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Min 6 characters"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPasswordInput" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="confirmPasswordInput"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="block w-full pl-3 pr-10 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Re-type new password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 shadow-sm flex items-center justify-center min-w-[120px] cursor-pointer"
                >
                  {passwordLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Save Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherLayout;