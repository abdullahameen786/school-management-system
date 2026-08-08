// src/pages/admin/ClassScheduling.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Search, BookOpen, Clock, User, X, Trash2, Edit2, Layers, MapPin } from 'lucide-react';

const ClassScheduling = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  
  const [formData, setFormData] = useState({
    className: '',
    section: '',
    room: '', // NEW: State field for Room/Lab
    teacherId: '',
    teacherName: '',
    scheduleTime: '',
    days: []
  });

  const availableDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const classSnap = await getDocs(collection(db, 'classes'));
      const fetchedClasses = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(fetchedClasses);

      const tQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const tSnap = await getDocs(tQuery);
      const fetchedTeachers = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(fetchedTeachers);
    } catch (error) {
      console.error("Error fetching scheduling data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClassId(null);
    setFormData({ className: '', section: '', room: '', teacherId: '', teacherName: '', scheduleTime: '', days: [] });
  };

  const handleEditClick = (cls) => {
    setEditingClassId(cls.id);
    setFormData({
      className: cls.className,
      section: cls.section || '',
      room: cls.room || '', // NEW: Pre-fills room state on edit
      teacherId: cls.teacherId,
      teacherName: cls.teacherName,
      scheduleTime: cls.scheduleTime,
      days: Array.isArray(cls.days) ? cls.days : (cls.days ? cls.days.split(', ') : [])
    });
    setIsModalOpen(true);
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const isSelected = prev.days.includes(day);
      const updatedDays = isSelected 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days: updatedDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.days.length === 0) {
      alert("Please select at least one day for the schedule.");
      return;
    }

    setSubmitLoading(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      const payload = {
        className: formData.className,
        section: formData.section.trim(),
        room: formData.room.trim(), // NEW: Save room payload
        teacherId: formData.teacherId,
        teacherName: selectedTeacher?.name || 'Unknown',
        scheduleTime: formData.scheduleTime,
        days: formData.days,
      };

      if (editingClassId) {
        await updateDoc(doc(db, 'classes', editingClassId), { 
          ...payload, 
          updatedAt: new Date().toISOString() 
        });
      } else {
        await addDoc(collection(db, 'classes'), { 
          ...payload, 
          createdAt: new Date().toISOString() 
        });
      }
      
      closeModal();
      fetchData(); 
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm("Are you sure you want to remove this class? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'classes', classId));
        fetchData();
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Class Scheduling</h1>
          <p className="text-slate-500 text-sm mt-1">Manage active courses and teacher assignments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create New Class
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search classes, grades or subjects..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Class / Subject Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Section & Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Teacher</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No classes have been scheduled yet.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-slate-800">{cls.className}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 w-fit">
                          <Layers className="h-3 w-3 text-slate-400" /> {cls.section || 'N/A'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 w-fit">
                          <MapPin className="h-3 w-3 text-indigo-400" /> {cls.room || 'TBA'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="h-4 w-4 text-slate-400" />
                        {cls.teacherName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          {Array.isArray(cls.days) ? cls.days.join(', ') : cls.days}
                        </span>
                        <span className="text-slate-400">at {cls.scheduleTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(cls)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">
                {editingClassId ? 'Edit Class Schedule' : 'Create New Class'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Class / Subject Name</label>
                <input
                  type="text"
                  required
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Computer Science"
                />
              </div>

              {/* NEW: Clean 2-column grid for Section and Room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Section / Grade</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. 3-B or 8th"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Room / Lab No.</label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Lab-3 or R-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Teacher</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>Select a teacher...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Days</label>
                  <div className="flex flex-wrap gap-2">
                    {availableDays.map((day) => {
                      const isSelected = formData.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Class Timing</label>
                  <input
                    type="time"
                    required
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                    className="block w-full max-w-[200px] px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 shadow-sm flex items-center justify-center min-w-[120px] cursor-pointer"
                >
                  {submitLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : (editingClassId ? 'Save Changes' : 'Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassScheduling;