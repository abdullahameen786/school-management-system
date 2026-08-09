// src/pages/admin/TeacherAttendance.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Calendar as CalendarIcon, Check, X, Clock, AlertCircle } from 'lucide-react';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default to today's date (YYYY-MM-DD format for input)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Store attendance status map: { teacherId: 'present' | 'absent' | 'late' }
  const [attendanceMap, setAttendanceMap] = useState({});

  // Fetch Teachers and Their Attendance for the selected date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all teachers
        const tQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const tSnap = await getDocs(tQuery);
        const fetchedTeachers = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeachers(fetchedTeachers);

        // 2. Fetch existing attendance for this specific date
        const aQuery = query(
            collection(db, 'attendance'),
            where('date', '==', selectedDate),
            where('targetRole', '==', 'teacher')
        );
        const aSnap = await getDocs(aQuery);
        
        const fetchedAttendance = {};
        aSnap.forEach(doc => {
          const data = doc.data();
          fetchedAttendance[data.targetId] = data.status;
        });
        
        setAttendanceMap(fetchedAttendance);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  // Handle marking individual status instantly
  const markStatus = async (teacherId, status) => {
    // Optimistic UI update: change color instantly on screen before DB confirms
    setAttendanceMap(prev => ({ ...prev, [teacherId]: status }));
    
    try {
      // Document ID strategy: "teacherId_YYYY-MM-DD" prevents duplicate entries per day
      const recordId = `${teacherId}_${selectedDate}`;
      await setDoc(doc(db, 'attendance', recordId), {
        targetId: teacherId,
        targetRole: 'teacher',
        date: selectedDate,
        status: status,
        markedBy: user.uid,
        timestamp: new Date().toISOString()
      }, { merge: true }); // Merge ensures we update if they change their mind
    } catch (error) {
      console.error("Failed to save attendance:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teacher Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">Track daily staff presence and availability.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <CalendarIcon className="h-5 w-5 text-indigo-600" />
          <input 
            type="date" 
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]} // Block future dates
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 cursor-pointer"
          />
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher Profile</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Mark Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No teachers found in the system.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const currentStatus = attendanceMap[teacher.id];
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{teacher.name}</div>
                            <div className="text-xs text-slate-500">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {currentStatus === 'present' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><Check className="h-3.5 w-3.5"/> Present</span>}
                        {currentStatus === 'absent' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700"><X className="h-3.5 w-3.5"/> Absent</span>}
                        {currentStatus === 'late' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="h-3.5 w-3.5"/> Late</span>}
                        {!currentStatus && <span className="text-xs text-slate-400 font-medium italic">Unmarked</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => markStatus(teacher.id, 'present')}
                            className={`p-2 rounded-lg transition-colors border cursor-pointer ${currentStatus === 'present' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'}`}
                            title="Mark Present"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => markStatus(teacher.id, 'late')}
                            className={`p-2 rounded-lg transition-colors border cursor-pointer ${currentStatus === 'late' ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600'}`}
                            title="Mark Late"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => markStatus(teacher.id, 'absent')}
                            className={`p-2 rounded-lg transition-colors border cursor-pointer ${currentStatus === 'absent' ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'}`}
                            title="Mark Absent"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;