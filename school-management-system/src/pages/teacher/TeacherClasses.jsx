// src/pages/teacher/TeacherClasses.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, Users, MapPin, Layers, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyClasses = async () => {
      setLoading(true);
      try {
        // Fetch ONLY classes assigned to this specific logged-in teacher
        const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedClasses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setClasses(fetchedClasses);
      } catch (error) {
        console.error("Error fetching assigned classes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchMyClasses();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Assigned Classes</h1>
        <p className="text-slate-500 text-sm mt-1">Here is your active teaching roster and schedule.</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
        </div>
      ) : classes.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Classes Assigned</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            You currently don't have any classes assigned to your profile. Please contact the system administrator.
          </p>
        </div>
      ) : (
        /* Class Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group relative flex flex-col">
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Layers className="h-3.5 w-3.5" />
                    Section {cls.section || 'N/A'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{cls.className}</h3>
              </div>

              {/* Card Details */}
              <div className="p-6 bg-slate-50/50 flex-1 space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {Array.isArray(cls.days) ? cls.days.join(', ') : cls.days}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{cls.scheduleTime}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>Room: <span className="font-medium text-slate-700">{cls.room || 'TBA'}</span></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 mt-auto">
                <Link 
                  to="/teacher/attendance"
                  className="py-2.5 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl text-center hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                >
                  Attendance
                </Link>
                <Link 
                  to="/teacher/assignments"
                  className="py-2.5 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-xl text-center hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  Assignments
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;