// src/pages/student/StudentAnnouncementsView.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Calendar, Megaphone, AlertCircle } from 'lucide-react';

const StudentAnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // UPGRADED: Robust filter checking all target fields with trim and includes
        const studentAnnouncements = fetched.filter(item => {
          const target = String(
            item.targetGroup || 
            item.targetRole || 
            item.audience || 
            item.role || 
            ''
          ).trim().toLowerCase();

          // Exclude if target explicitly mentions teacher(s)
          if (target.includes('teacher')) {
            return false;
          }
          return true;
        });

        studentAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncements(studentAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notice Board Hub</h1>
        <p className="text-slate-500 text-sm mt-1">Stay updated with institutional announcements and notices.</p>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No announcements posted on the notice board yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" /> 
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent Notice'}
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pl-13">{item.message || item.content || item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncementsView;