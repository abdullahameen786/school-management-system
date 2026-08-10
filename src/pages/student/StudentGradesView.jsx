// src/pages/student/StudentGradesView.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Award, BookOpen, AlertCircle, FileText, Trophy } from 'lucide-react';

const StudentGradesView = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGradesAndCourses = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        // 1. Fetch student profile to get gradeClass and section
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const studentData = userSnap.exists() ? userSnap.data() : {};
        const studentGrade = studentData.gradeClass || studentData.className;
        const studentSection = studentData.section;

        // 2. Fetch assigned courses/classes for this student's grade and section
        const classesSnap = await getDocs(collection(db, 'classes'));
        const allClasses = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const studentClasses = allClasses.filter(cls => {
          const clsGrade = cls.gradeClass || cls.className;
          const matchGrade = studentGrade ? clsGrade === studentGrade : true;
          const matchSection = studentSection ? cls.section === studentSection : true;
          return matchGrade && matchSection;
        });

        // 3. Fetch grades published for this student
        const q = query(
          collection(db, 'grades'),
          where('studentId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedGrades = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        fetchedGrades.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setGrades(fetchedGrades);

        // 4. Extract unique course/subject options strictly from student's classes and grades
        const courseSet = new Set();
        studentClasses.forEach(cls => {
          const sub = cls.subjectName || cls.subject || cls.course || cls.className;
          if (sub) courseSet.add(sub.trim());
        });

        fetchedGrades.forEach(g => {
          const sub = g.subjectName || g.subject || g.course || g.className;
          if (sub) courseSet.add(sub.trim());
        });

        const coursesList = Array.from(courseSet);
        setUniqueCourses(coursesList);

        if (coursesList.length > 0) {
          setSelectedCourse(coursesList[0]);
        }

      } catch (error) {
        console.error("Error fetching student grades and courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGradesAndCourses();
  }, [user]);

  // Filter grades based on selected course dropdown value
  const filteredGrades = selectedCourse 
    ? grades.filter(item => {
        const itemSub = (item.subjectName || item.subject || item.course || item.className || '').trim();
        return itemSub.toLowerCase() === selectedCourse.trim().toLowerCase();
      })
    : [];

  // Calculate stats for filtered course
  const totalEvaluations = filteredGrades.length;
  const averagePercentage = totalEvaluations > 0 
    ? (filteredGrades.reduce((acc, curr) => acc + ((curr.obtainedMarks / curr.maxMarks) * 100), 0) / totalEvaluations).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Grades & Evaluations</h1>
          <p className="text-slate-500 text-sm mt-1">Review your scores across coursework assignments, midterms, and finals.</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluations Recorded</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalEvaluations}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Performance</p>
            <h3 className="text-2xl font-bold text-sky-600 mt-1">{averagePercentage}%</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Trophy className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluation Title</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Subject</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Score Obtained</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Percentage</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600"></div>
                  </td>
                </tr>
              ) : uniqueCourses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No courses assigned to your class yet.
                  </td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No grade records published for {selectedCourse} yet.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((item) => {
                  const percentage = ((item.obtainedMarks / item.maxMarks) * 100).toFixed(1);
                  const displaySub = item.subjectName || item.subject || item.course || item.className || 'General Course';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-800">{item.evaluationTitle || 'Task Evaluation'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-700">
                          {displaySub}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-slate-700">
                          {item.obtainedMarks} <span className="text-slate-400 font-normal">/ {item.maxMarks}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          percentage >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-400 font-medium">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
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

export default StudentGradesView;