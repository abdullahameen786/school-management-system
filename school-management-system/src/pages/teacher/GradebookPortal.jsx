// src/pages/teacher/GradebookPortal.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clipboard, Save, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const GradebookPortal = () => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Selection states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(''); // Stores assignmentId OR 'midterm' OR 'final'
  
  // Scoring states
  const [gradesMap, setGradesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Teacher's Assigned Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyClasses(fetched);
        if (fetched.length > 0) setSelectedClass(fetched[0].id);
      } catch (error) {
        console.error("Error loading classes:", error);
      }
    };
    if (user?.uid) fetchClasses();
  }, [user]);

  // 2. Fetch Assignments for the selected class
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedClass) return;
      try {
        const q = query(collection(db, 'assignments'), where('classId', '==', selectedClass));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssignments(fetched);
        
        // Default assignment selection: 'midterm' is the default view option now
        setSelectedEvaluation('midterm');
      } catch (error) {
        console.error("Error loading assignments:", error);
      }
    };
    fetchAssignments();
  }, [selectedClass]);

  // 3. Fetch Students & Existing Grades matrix
  useEffect(() => {
    const fetchStudentsAndGrades = async () => {
      if (!selectedClass || !selectedEvaluation) {
        setStudents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setSuccessMsg('');
      try {
        // Fetch students list
        const sQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const sSnap = await getDocs(sQuery);
        const fetchedStudents = sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(fetchedStudents);

        // Fetch already saved grades for this evaluation type (assignmentId / midterm / final)
        const gQuery = query(collection(db, 'grades'), where('evaluationId', '==', selectedEvaluation));
        const gSnap = await getDocs(gQuery);
        const fetchedGrades = {};
        gSnap.forEach(doc => {
          const data = doc.data();
          fetchedGrades[data.studentId] = data.obtainedMarks;
        });
        setGradesMap(fetchedGrades);
      } catch (error) {
        console.error("Error pulling grading sheets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndGrades();
  }, [selectedClass, selectedEvaluation]);

  const handleMarkChange = (studentId, value) => {
    setGradesMap(prev => ({ ...prev, [studentId]: value }));
  };

  // 4. Save Entire Gradebook Rows to Firestore
  const handleSaveGrades = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg('');

    try {
      let evaluationTitle = '';
      let maxMarksScale = 100; // Default scale for exams

      if (selectedEvaluation === 'midterm') {
        evaluationTitle = 'Midterm Examination';
        maxMarksScale = 30; // Custom scaling threshold for midterms
      } else if (selectedEvaluation === 'final') {
        evaluationTitle = 'Final Examination';
        maxMarksScale = 50; // Custom scaling threshold for finals
      } else {
        const currentAsg = assignments.find(a => a.id === selectedEvaluation);
        evaluationTitle = currentAsg?.title || 'Assignment Task';
        maxMarksScale = currentAsg?.maxMarks || 10;
      }
      
      const promises = students.map(student => {
        const score = gradesMap[student.id];
        if (score === undefined || score === '') return Promise.resolve();

        // Composite record entry key prevents duplication: studentId_evaluationId
        const recordId = `${student.id}_${selectedEvaluation}`;
        return setDoc(doc(db, 'grades', recordId), {
          studentId: student.id,
          studentName: student.name,
          classId: selectedClass,
          evaluationId: selectedEvaluation, // Can be assignmentId, 'midterm', or 'final'
          evaluationTitle: evaluationTitle,
          maxMarks: maxMarksScale,
          obtainedMarks: parseFloat(score),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await Promise.all(promises);
      setSuccessMsg(`${evaluationTitle} record sheets updated successfully!`);
    } catch (error) {
      console.error("Error saving score tables:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  // Check if current target selection is an assignment and evaluate if locked
  const activeAssignment = assignments.find(a => a.id === selectedEvaluation);
  let isEvaluationLocked = false;
  
  if (activeAssignment && activeAssignment.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    if (today < activeAssignment.dueDate) {
      isEvaluationLocked = true;
    }
  }

  // Determine Max Marks to display for the current selection
  const getMaxMarksDisplay = () => {
    if (selectedEvaluation === 'midterm') return 30;
    if (selectedEvaluation === 'final') return 50;
    return activeAssignment?.maxMarks || 10;
  };

  return (
    <div className="space-y-6">
      {/* Upper Control Bar Layout Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gradebook Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Record structural score tallies across assigned classes.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Class Select Dropdown */}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.className} ({c.section})</option>)}
            </select>
          </div>

          {/* Unified Evaluation Selector Dropdown */}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <Clipboard className="h-4 w-4 text-emerald-600" />
            <select
              value={selectedEvaluation}
              onChange={(e) => setSelectedEvaluation(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              <optgroup label="Institutional Exams">
                <option value="midterm">📝 Midterm Examination</option>
                <option value="final">🏆 Final Examination</option>
              </optgroup>
              
              {assignments.length > 0 && (
                <optgroup label="Coursework Assignments">
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>📋 {a.title}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {successMsg}
        </div>
      )}

      {/* Warning Banner for Locked Assignments */}
      {isEvaluationLocked && activeAssignment && (
        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-900">Evaluation Locked</p>
            <p className="text-amber-700 mt-0.5">You can evaluate this assignment after the due date: <span className="font-bold">{activeAssignment.dueDate}</span>.</p>
          </div>
        </div>
      )}

      {/* Roster Sheet Form Card */}
      <form onSubmit={handleSaveGrades} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Enrolled</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Maximum Scale</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Obtained Evaluation Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"></div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    No students currently cataloged in the registry database.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                          {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-bold ${!isEvaluationLocked ? 'text-slate-800' : 'text-slate-500'}`}>{student.name}</p>
                          <p className="text-xs text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-500">
                      / {getMaxMarksDisplay()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <input
                        type="number"
                        min="0"
                        max={getMaxMarksDisplay()}
                        step="0.5"
                        placeholder="0.0"
                        value={gradesMap[student.id] || ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        disabled={isEvaluationLocked}
                        className="w-24 px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-center font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Action Controls */}
        {students.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saveLoading || isEvaluationLocked}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {saveLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {!isEvaluationLocked ? <Save className="h-4 w-4" /> : <Lock className="h-4 w-4" />} 
                  {!isEvaluationLocked ? 'Save Evaluation Report' : 'Locked'}
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default GradebookPortal;