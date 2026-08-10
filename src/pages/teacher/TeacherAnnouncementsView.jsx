// src/pages/teacher/TeacherAnnouncementsView.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Megaphone, AlertCircle, Plus, X, Loader2, BookOpen, Trash2, Layers, GraduationCap } from 'lucide-react';

const TeacherAnnouncementsView = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form States using classId to track exact class, section, and course
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    content: ''
  });

  // 1. Fetch Teacher's Assigned Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyClasses(fetched);
        if (fetched.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            classId: fetched[0].id 
          }));
        }
      } catch (error) {
        console.error("Error loading classes:", error);
      }
    };
    if (user?.uid) fetchClasses();
  }, [user]);

  // 2. Fetch Announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const teacherAnnouncements = fetched.filter(item => {
        const target = String(item.targetGroup || item.targetRole || item.audience || item.role || '').trim().toLowerCase();
        if (target.includes('teacher') || target === 'all' || target === '' || item.teacherId === user.uid) {
          return true;
        }
        return false;
      });

      teacherAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnnouncements(teacherAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchAnnouncements();
    }
  }, [user]);

  // 3. Handle Publishing Student Announcement targeting exact class & section
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.classId) {
      alert("Please select a target assigned class and section.");
      return;
    }

    setSubmitLoading(true);
    try {
      const selectedClassObj = myClasses.find(c => c.id === formData.classId);
      if (!selectedClassObj) throw new Error("Selected class not found.");

      await addDoc(collection(db, 'announcements'), {
        title: formData.title.trim(),
        content: formData.content.trim(),
        teacherId: user.uid,
        teacherName: user.name || 'Instructor',
        classId: formData.classId,
        className: selectedClassObj.gradeClass || selectedClassObj.className || 'Class',
        section: selectedClassObj.section || 'A',
        subjectName: selectedClassObj.subjectName || selectedClassObj.className || 'General',
        targetGroup: 'student', 
        createdAt: new Date().toISOString()
      });

      setIsModalOpen(false);
      setFormData({ 
        classId: myClasses[0]?.id || '', 
        title: '', 
        content: '' 
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 4. Delete Teacher's Own Announcement
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
        fetchAnnouncements();
      } catch (error) {
        console.error("Error deleting announcement:", error);
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teacher Notice Board</h1>
          <p className="text-slate-500 text-sm mt-1">Review administrative notices and broadcast updates to your students.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={myClasses.length === 0}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:bg-emerald-400 cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" /> Create Announcement
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No announcements available.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((item) => {
            const isMyPost = item.teacherId === user.uid;
            return (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                {isMyPost && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete Notice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <div className="space-y-3 pr-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                        {item.className && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <GraduationCap className="h-3 w-3" /> {item.className} {item.section ? `- Sec ${item.section}` : ''}
                          </span>
                        )}
                        {item.subjectName && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                            <BookOpen className="h-3 w-3" /> {item.subjectName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5" /> 
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'} 
                        {item.createdBy ? ` • Admin: ${item.createdBy}` : isMyPost ? ' • Posted by You' : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pl-13">{item.message || item.content || item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating Student Announcement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Broadcast Student Notice</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              
              {/* Dropdown showing exact Assigned Class and Section */}
              <div>
                <label htmlFor="targetClassSelect" className="block text-sm font-semibold text-slate-700 mb-1">Select Assigned Class & Section</label>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 border border-slate-200 rounded-xl">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <select
                    id="targetClassSelect"
                    name="classId"
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
                  >
                    {myClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.gradeClass || cls.className || 'Class'} {cls.section ? `- Section ${cls.section}` : ''} {cls.subjectName ? `(${cls.subjectName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="noticeTitleInput" className="block text-sm font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  id="noticeTitleInput"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="e.g. Quiz Schedule Change / Lecture Notes"
                />
              </div>

              <div>
                <label htmlFor="noticeContentTextarea" className="block text-sm font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  id="noticeContentTextarea"
                  name="content"
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  placeholder="Write your announcement details here..."
                />
              </div>

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
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 shadow-sm flex items-center justify-center min-w-[140px] cursor-pointer"
                >
                  {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAnnouncementsView;