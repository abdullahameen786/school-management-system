// src/pages/admin/Announcements.jsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Trash2, Users, Calendar, Send, ShieldAlert } from 'lucide-react';

const Announcements = () => {
  const { user, userData } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetGroup: 'all' // all | teacher | student
  });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedNotices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotices(fetchedNotices);
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      await addDoc(collection(db, 'announcements'), {
        title: formData.title,
        content: formData.content,
        targetGroup: formData.targetGroup,
        createdBy: userData?.name || 'Admin',
        createdAt: new Date().toISOString()
      });

      setFormData({ title: '', content: '', targetGroup: 'all' });
      fetchNotices();
    } catch (error) {
      console.error("Error posting announcement:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this notice permanently?")) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
        fetchNotices();
      } catch (error) {
        console.error("Error dropping notice:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Announcements Board</h1>
        <p className="text-slate-500 text-sm mt-1">Broadcast official news and notifications system-wide.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Creation Form Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-indigo-600" /> Draft Notice
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notice Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                placeholder="e.g. Midterm Examination Schedule"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Audience</label>
              <select
                value={formData.targetGroup}
                onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="all">Broadcast to All Users</option>
                <option value="teacher">Teachers Only</option>
                <option value="student">Students Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Message Body</label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                placeholder="Type the message contents here..."
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:bg-indigo-400"
            >
              {submitLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="h-4 w-4" /> Post Notice
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Active Feed Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-md font-bold text-slate-800">Active Notice Feed</h3>

          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
              <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              No announcements have been broadcasted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow">
                  <button 
                    onClick={() => handleDelete(notice.id)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete Announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-bold text-slate-800">{notice.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        notice.targetGroup === 'all' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        notice.targetGroup === 'teacher' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-sky-50 text-sky-700 border border-sky-100'
                      }`}>
                        Target: {notice.targetGroup}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                    
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/> By: {notice.createdBy}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5"/> 
                        {new Date(notice.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Announcements;