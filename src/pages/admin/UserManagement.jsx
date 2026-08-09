// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig } from '../../firebase/config';
import { Plus, Search, Edit2, Trash2, ShieldAlert, X, Mail, User, Layers, BookOpen, Lock } from 'lucide-react';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('teacher');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', // Default blank rakhein gey starting mein
    className: 'Class 8',
    section: 'A'
  });

  const schoolClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  const sections = ['A', 'B', 'C', 'D'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', activeTab));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setSearchQuery(''); 
  }, [activeTab]);

  const filteredUsers = users.filter(user => {
    const nameMatch = user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: 'school123', className: 'Class 8', section: 'A' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: user.password || '', // 🚀 Existing plain text password load karein gey edit modal mein
      className: user.className || 'Class 8',
      section: user.section || 'A'
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      let targetId = editingUserId;

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: activeTab,
      };

      if (activeTab === 'student') {
        payload.className = formData.className;
        payload.section = formData.section;
      }

      // If password field has text, add it to the sync payload
      if (formData.password) {
        payload.password = formData.password.trim();
      }

      if (editingUserId) {
        // 🚀 Existing profile update including new password string replacement
        await updateDoc(doc(db, 'users', editingUserId), payload);
      } else {
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthApp");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          formData.email.trim(), 
          formData.password || 'school123'
        );
        
        targetId = userCredential.user.uid; 
        await deleteApp(secondaryApp); 

        payload.createdAt = new Date().toISOString();
        payload.password = formData.password || 'school123'; 

        await setDoc(doc(db, 'users', targetId), payload);
      }

      setFormData({ name: '', email: '', password: '', className: 'Class 8', section: 'A' });
      setEditingUserId(null);
      setIsModalOpen(false);
      fetchUsers(); 
    } catch (error) {
      console.error("Error saving record: ", error);
      alert("Error: " + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to remove this user profile?")) {
      try {
        await deleteDoc(doc(db, 'users', id));
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">View, add, edit, and manage school personnel and student enrollments.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add New {activeTab === 'teacher' ? 'Teacher' : 'Student'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-200 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 sm:px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'teacher' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Teachers
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 sm:px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'student' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Students
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="userSearchInput"
              name="userSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}s by name or email...`}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role / Group</th>
                {activeTab === 'student' && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Class & Section</th>
                )}
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'student' ? '5' : '4'} className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? ( 
                <tr>
                  <td colSpan={activeTab === 'student' ? '5' : '4'} className="px-6 py-12 text-center text-slate-500">
                    <ShieldAlert className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No {activeTab}s found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 capitalize">
                        {user.role}
                      </span>
                    </td>
                    {activeTab === 'student' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                          <Layers className="h-3.5 w-3.5" />
                          {user.className || 'Unassigned'} {user.section ? `(Sec ${user.section})` : ''}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUserId ? `Edit ${activeTab === 'teacher' ? 'Teacher' : 'Student'}` : `Add New ${activeTab === 'teacher' ? 'Teacher' : 'Student'}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label htmlFor="fullNameInput" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User className="h-4 w-4" /></div>
                  <input
                    id="fullNameInput"
                    name="fullName"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="userEmailInput" className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail className="h-4 w-4" /></div>
                  <input
                    id="userEmailInput"
                    name="userEmail"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="user@school.com"
                  />
                </div>
              </div>

              {/* 🚀 Changed logic: password option will now show up during BOTH creating and editing profiles */}
              <div>
                <label htmlFor="tempPasswordInput" className="block text-sm font-semibold text-slate-700 mb-1">
                  {editingUserId ? 'Update Password' : 'Temporary Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock className="h-4 w-4" /></div>
                  <input
                    id="tempPasswordInput"
                    name="tempPassword"
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder={editingUserId ? "Enter new password" : "e.g. school123"}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {editingUserId ? 'Leave it or modify to change the user login credentials.' : 'User will use this password to sign in for the first time.'}
                </p>
              </div>

              {activeTab === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classSelectInput" className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 border border-slate-200 rounded-xl">
                      <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                      <select
                        id="classSelectInput"
                        name="classSelect"
                        value={formData.className}
                        onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                        className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
                      >
                        {schoolClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sectionSelectInput" className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 border border-slate-200 rounded-xl">
                      <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                      <select
                        id="sectionSelectInput"
                        name="sectionSelect"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
                      >
                        {sections.map(sec => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 shadow-sm flex items-center justify-center min-w-[100px] cursor-pointer"
                >
                  {submitLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : (editingUserId ? 'Update Profile' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;