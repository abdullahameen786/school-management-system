// src/pages/student/StudentDashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, User, MapPin, Layers, CalendarDays, AlertCircle } from 'lucide-react';

const StudentDashboardHome = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentClasses = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        // 1. Fetch student's profile to get their section (e.g. "8C")
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const studentSection = userSnap.exists() ? userSnap.data().section : null;

        // 2. Fetch all classes from database
        const querySnapshot = await getDocs(collection(db, 'classes'));
        const allClasses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 3. Filter classes matching student's section (if section is assigned)
        // If studentSection is not set yet, fallback to showing all or empty
        const filteredClasses = studentSection 
          ? allClasses.filter(cls => cls.section === studentSection)
          : allClasses; // Fallback if section isn't specified on profile yet

        setClasses(filteredClasses);
      } catch (error) {
        console.error("Error fetching classes for student:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentClasses();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Enrolled Classes</h1>
        <p className="text-slate-500 text-sm mt-1">Here is your active course schedule and classroom details.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Enrolled Classes Found</h3>
          <p className="text-slate-500 mt-1 text-sm">You are not currently assigned to any active class section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  {cls.section && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                      <Layers className="h-3.5 w-3.5" />
                      Section {cls.section}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{cls.className}</h3>
              </div>

              <div className="p-6 bg-slate-50/50 flex-1 space-y-3.5">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Teacher: <span className="font-semibold text-slate-800">{cls.teacherName || 'TBA'}</span></span>
                </div>
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
                  <span>Room: <span className="font-semibold text-slate-800">{cls.room || 'TBA'}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboardHome;