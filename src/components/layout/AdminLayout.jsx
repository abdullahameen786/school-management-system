// src/components/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { LayoutDashboard, Users, Calendar, ClipboardCheck, Megaphone, LogOut, Menu, X, KeyRound, Eye, EyeOff } from 'lucide-react';

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🔐 Password Change States
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles for fields
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [modalLoading, setModalLoading] = useState(false);
  const [modalStatus, setModalStatus] = useState({ type: '', msg: '' });

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setModalStatus({ type: '', msg: '' });

    // 1. Basic Validations
    if (newPassword.length < 6) {
      setModalStatus({ type: 'error', msg: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalStatus({ type: 'error', msg: 'New password and confirm password do not match.' });
      return;
    }

    setModalLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Session expired. Please log in again.');
      }

      // 2. Re-authenticate User using Current Password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      console.log("Re-authentication successful.");

      // 3. Update Password in Firebase Auth Core
      await updatePassword(currentUser, newPassword);
      console.log("Firebase Auth password updated.");

      // 4. Update Password in Firestore User Document (Search by email to find doc ID)
      const q = query(collection(db, 'users'), where('email', '==', currentUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);
        // Storing plain text password in database if explicitly required, 
        // though standard is just keeping it in Auth. Here we update/replace it.
        await updateDoc(userDocRef, {
          password: newPassword 
        });
        console.log("Firestore backup record updated.");
      }

      setModalStatus({ type: 'success', msg: 'Password updated and replaced successfully!' });
      
      // Reset Form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal after success visual delay
      setTimeout(() => setIsPassModalOpen(false), 2000);

    } catch (error) {
      console.error("Password change lifecycle failure:", error);
      if (error.code === 'auth/wrong-password') {
        setModalStatus({ type: 'error', msg: 'Current password you entered is incorrect.' });
      } else {
        setModalStatus({ type: 'error', msg: error.message || 'An error occurred. Please try again.' });
      }
    } finally {
      setModalLoading(false);
    }
  };

  const navItems = [
    { name: 'Analytics Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Class Scheduling', path: '/admin/scheduling', icon: Calendar },
    { name: 'Teacher Attendance', path: '/admin/attendance', icon: ClipboardCheck },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* 📱 Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-40 flex items-center justify-between px-4 border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              NSES
            </div>
            <span className="font-bold tracking-tight text-base">Admin Portal</span>
          </div>
        </div>
        <div className="text-xs font-semibold bg-slate-800 text-indigo-400 px-2.5 py-1 rounded-md border border-slate-700">
          Admin
        </div>
      </div>

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden" />
      )}

      {/* 🖥️ Sidebar Component */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col justify-between h-full border-r border-slate-800 shrink-0
        transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-base tracking-wider">
                NSES
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">NSES Portal</h1>
                <p className="text-xs text-slate-400">National Standard Edu System</p>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-240px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-900 space-y-1">
          <button
            onClick={() => { setIsPassModalOpen(true); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <KeyRound className="h-4 w-4 shrink-0" />
            <span>Update Password</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 bg-slate-100 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* 🔐 Advanced Password Update Modal Overlay */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <KeyRound className="h-5 w-5 text-indigo-600" />
                Change Password
              </div>
              <button 
                onClick={() => { setIsPassModalOpen(false); setModalStatus({ type: '', msg: '' }); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalStatus.msg && (
              <div className={`p-3.5 text-xs font-semibold border rounded-xl ${
                modalStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {modalStatus.msg}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              
              {/* 1. Current Password Field */}
              <div>
                <label htmlFor="currentPasswordInput" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Existing Password
                </label>
                <div className="relative">
                  <input
                    id="currentPasswordInput"
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 2. New Password Field */}
              <div>
                <label htmlFor="newPasswordInput" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPasswordInput"
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 3. Confirm Password Field */}
              <div>
                <label htmlFor="confirmPasswordInput" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPasswordInput"
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsPassModalOpen(false); setModalStatus({ type: '', msg: '' }); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {modalLoading ? "Processing..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;