// src/pages/student/StudentAttendanceView.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, Check, X, Clock, AlertCircle, Calendar, BookOpen } from 'lucide-react';

const StudentAttendanceView = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        // 1. Fetch student profile to get gradeClass and section
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const studentData = userSnap.exists() ? userSnap.data() : {};
        const studentGrade = studentData.gradeClass || studentData.className;
        const studentSection = studentData.section;

        // 2. Fetch all classes and filter strictly by Grade and Section assigned to this student
        const classesSnap = await getDocs(collection(db, 'classes'));
        const allClasses = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const studentClasses = allClasses.filter(cls => {
          const clsGrade = cls.gradeClass || cls.className;
          const matchGrade = studentGrade ? clsGrade === studentGrade : true;
          const matchSection = studentSection ? cls.section === studentSection : true;
          return matchGrade && matchSection;
        });

        // 3. Fetch attendance records for this student first so we can map courses accurately
        const q = query(
          collection(db, 'attendance'),
          where('targetId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAttendanceRecords(records);

        // 4. Extract unique courses from both assigned classes and attendance records
        const courseSet = new Set();
        
        studentClasses.forEach(cls => {
          const sub = cls.subjectName || cls.subject || cls.course || cls.className;
          if (sub) courseSet.add(sub.trim());
        });

        records.forEach(r => {
          const sub = r.subjectName || r.subject || r.course || r.className;
          if (sub) courseSet.add(sub.trim());
        });

        const coursesList = Array.from(courseSet);
        setUniqueCourses(coursesList);

        // Auto-select the first assigned course by default if available
        if (coursesList.length > 0) {
          setSelectedCourse(coursesList[0]);
        }

      } catch (error) {
        console.error("Error fetching student attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Robust filtering records based on selected course dropdown value
  const filteredRecords = selectedCourse 
    ? attendanceRecords.filter(r => {
        const recordSub = (r.subjectName || r.subject || r.course || r.className || '').trim();
        return recordSub.toLowerCase() === selectedCourse.trim().toLowerCase();
      })
    : [];

  const totalRecords = filteredRecords.length;
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;
  const attendancePercentage = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Attendance Records</h1>
          <p className="text-slate-500 text-sm mt-1">Review your daily attendance history and overall percentage.</p>
        </div>

        {/* Course Filter Dropdown */}
        {uniqueCourses.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <BookOpen className="h-4 w-4 text-sky-600 shrink-0" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              {uniqueCourses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Course Rate</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{attendancePercentage}%</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <CalendarCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present Days</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Check className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Late Days</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Absent Days</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <X className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Subject</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded Timestamp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600"></div>
                  </td>
                </tr>
              ) : uniqueCourses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No courses assigned to your class and section yet.
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No attendance records found for {selectedCourse}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const displaySub = record.subjectName || record.subject || record.course || record.className || 'General Course';
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-slate-800">{record.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-800">
                          {displaySub}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {record.status === 'present' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><Check className="h-3.5 w-3.5"/> Present</span>}
                        {record.status === 'absent' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700"><X className="h-3.5 w-3.5"/> Absent</span>}
                        {record.status === 'late' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="h-3.5 w-3.5"/> Late</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-400 font-medium">
                        {record.timestamp ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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

export default StudentAttendanceView;