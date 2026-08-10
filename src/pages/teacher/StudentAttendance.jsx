// src/pages/teacher/StudentAttendance.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Clock,
  AlertCircle,
  BookOpen,
} from "lucide-react";

// Helper function to get correct local date string (YYYY-MM-DD)
const getLocalDateString = () => {
  const localDate = new Date();
  const offset = localDate.getTimezoneOffset();
  const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split("T")[0];
};

const StudentAttendance = () => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch Teacher's Assigned Classes for the Dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(
          collection(db, "classes"),
          where("teacherId", "==", user.uid),
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMyClasses(fetched);
        if (fetched.length > 0) {
          setSelectedClass(fetched[0].id); // Auto-select the first class
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    if (user?.uid) fetchClasses();
  }, [user]);

  // 2. Fetch Students and their Attendance for the selected class and date
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedClass) {
        setStudents([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        // Fetch all students from users collection
        const sQuery = query(
          collection(db, "users"),
          where("role", "==", "student"),
        );
        const sSnap = await getDocs(sQuery);

        // Get the currently selected class object to check its grade and section
        const currentClassObj = myClasses.find((c) => c.id === selectedClass);
        const targetGrade = currentClassObj?.gradeClass || currentClassObj?.className;
        const targetSection = currentClassObj?.section;

        // Properly filter students matching class grade and section + update state
        const fetchedStudents = sSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((student) => {
            const studentGrade = student.gradeClass || student.className;
            const matchesClass = !targetGrade || studentGrade === targetGrade;
            const matchesSection = !targetSection || student.section === targetSection;
            return matchesClass && matchesSection;
          });

        setStudents(fetchedStudents);

        // Fetch existing attendance for this class and date
        const aQuery = query(
          collection(db, "attendance"),
          where("date", "==", selectedDate),
          where("classId", "==", selectedClass),
          where("targetRole", "==", "student"),
        );
        const aSnap = await getDocs(aQuery);

        const fetchedAttendance = {};
        aSnap.forEach((doc) => {
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

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate, myClasses]);

  // 3. Mark Student Status with Subject/Course Name included in database payload
  const markStatus = async (student, status) => {
    const studentId = student.id;

    // Optimistic UI update
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));

    try {
      // Get the currently selected class object to retrieve its subject name
      const currentClassObj = myClasses.find((c) => c.id === selectedClass);
      const subjectName = currentClassObj?.subjectName || currentClassObj?.subject || currentClassObj?.course || currentClassObj?.className || 'General Course';

      // Document ID: studentId_classId_YYYY-MM-DD
      const recordId = `${studentId}_${selectedClass}_${selectedDate}`;
      await setDoc(
        doc(db, "attendance", recordId),
        {
          targetId: studentId,
          targetName: student.name || 'Student',
          targetRole: "student",
          classId: selectedClass,
          subjectName: subjectName, // 🚀 Stored course/subject name in attendance collection
          date: selectedDate,
          status: status,
          markedBy: user.uid,
          timestamp: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Failed to save student attendance:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Student Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Mark daily presence for your assigned class rosters.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Class Selector Dropdown */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <label htmlFor="classSelectDropdown" className="text-emerald-600 cursor-pointer">
              <BookOpen className="h-5 w-5" />
            </label>
            <select
              id="classSelectDropdown"
              name="selectedClass"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 cursor-pointer w-full"
            >
              {myClasses.length === 0 ? (
                <option value="">No Classes Assigned</option>
              ) : (
                myClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.subjectName || cls.className} - {cls.gradeClass || cls.className} {cls.section ? `(Sec ${cls.section})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <label htmlFor="attendanceDatePicker" className="text-emerald-600 cursor-pointer">
              <CalendarIcon className="h-5 w-5" />
            </label>
            <input
              id="attendanceDatePicker"
              name="attendanceDate"
              type="date"
              value={selectedDate}
              max={getLocalDateString()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student Profile
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current Status
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mark Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"></div>
                  </td>
                </tr>
              ) : !selectedClass ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    Please select a class to view the student roster.
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No students found enrolled in this class/section.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const currentStatus = attendanceMap[student.id];
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                            {student.name
                              ? student.name.charAt(0).toUpperCase()
                              : "S"}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-800">
                              {student.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {currentStatus === "present" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <Check className="h-3.5 w-3.5" /> Present
                          </span>
                        )}
                        {currentStatus === "absent" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                            <X className="h-3.5 w-3.5" /> Absent
                          </span>
                        )}
                        {currentStatus === "late" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Clock className="h-3.5 w-3.5" /> Late
                          </span>
                        )}
                        {!currentStatus && (
                          <span className="text-xs text-slate-400 font-medium italic">
                            Unmarked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => markStatus(student, "present")}
                            className={`p-2 rounded-lg transition-colors border cursor-pointer ${currentStatus === "present" ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" : "border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600"}`}
                            title="Mark Present"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => markStatus(student, "late")}
                            className={`p-2 rounded-lg transition-colors border cursor-pointer ${currentStatus === "late" ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" : "border-slate-200 text-slate-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600"}`}
                            title="Mark Late"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => markStatus(student, "absent")}
                            className={`p-2 rounded-lg transition-colors border cursor-pointer ${currentStatus === "absent" ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm" : "border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"}`}
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

export default StudentAttendance;