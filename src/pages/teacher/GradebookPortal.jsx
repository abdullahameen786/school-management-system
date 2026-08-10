// src/pages/teacher/GradebookPortal.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clipboard, Save, AlertCircle, CheckCircle2, Lock, Plus, X, ExternalLink, FileText, Paperclip, MessageSquare } from 'lucide-react';

const GradebookPortal = () => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]); 
  const [students, setStudents] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(''); 
  
  const [gradesMap, setGradesMap] = useState({});
  const [submissionsMap, setSubmissionsMap] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examSubmitLoading, setExamSubmitLoading] = useState(false);
  const [examFormData, setExamFormData] = useState({ title: '', maxMarks: '100' });

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

  // 2. Fetch Evaluations (Assignments & Custom Exams)
  const fetchEvaluations = async () => {
    if (!selectedClass) return;
    try {
      const activeClassObj = myClasses.find(c => c.id === selectedClass);
      if (!activeClassObj) return;

      const gradeToCheck = activeClassObj.gradeClass || activeClassObj.className;
      const sectionToCheck = activeClassObj.section;

      const qA = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
      const snapA = await getDocs(qA);
      
      const fetchedAssignments = snapA.docs
        .map(doc => ({ id: doc.id, ...doc.data(), type: 'assignment' }))
        .filter(a => {
          const matchesGrade = (a.gradeClass === gradeToCheck);
          const matchesSec = (a.section === sectionToCheck);
          const matchesClassId = (a.classId === selectedClass);
          return matchesClassId || (matchesGrade && matchesSec);
        });

      setAssignments(fetchedAssignments);
      
      const qE = query(collection(db, 'exams'), where('classId', '==', selectedClass));
      const snapE = await getDocs(qE);
      const fetchedExams = snapE.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'exam' }));
      setExams(fetchedExams);

      const allEvals = [...fetchedExams, ...fetchedAssignments];
      if (allEvals.length > 0 && !allEvals.find(e => e.id === selectedEvaluation)) {
        setSelectedEvaluation(allEvals[0].id);
      } else if (allEvals.length === 0) {
        setSelectedEvaluation('');
      }
    } catch (error) {
      console.error("Error loading evaluations:", error);
    }
  };

  useEffect(() => {
    if (myClasses.length > 0) {
      fetchEvaluations();
    }
  }, [selectedClass, myClasses]);

  // 3. Fetch Enrolled Students, Existing Grades & Submissions
  useEffect(() => {
    const fetchStudentsGradesAndSubmissions = async () => {
      if (!selectedClass) {
        setStudents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setSuccessMsg('');
      try {
        const activeClassObj = myClasses.find(c => c.id === selectedClass);
        const targetGrade = activeClassObj?.gradeClass || activeClassObj?.className;
        const targetSection = activeClassObj?.section;

        const sQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const sSnap = await getDocs(sQuery);
        const allStudents = sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const enrolledStudents = allStudents.filter(student => {
          const studentGrade = student.gradeClass || student.className;
          if (!targetGrade || !targetSection) return true;
          return studentGrade === targetGrade && student.section === targetSection;
        });

        setStudents(enrolledStudents);

        if (selectedEvaluation) {
          // Fetch Grades
          const gQuery = query(collection(db, 'grades'), where('evaluationId', '==', selectedEvaluation));
          const gSnap = await getDocs(gQuery);
          const fetchedGrades = {};
          gSnap.forEach(doc => {
            const data = doc.data();
            fetchedGrades[data.studentId] = data.obtainedMarks; 
          });
          setGradesMap(fetchedGrades);

          // Fetch Student Submissions
          const activeEvalObj = [...exams, ...assignments].find(e => e.id === selectedEvaluation);
          if (activeEvalObj?.type === 'assignment') {
            const subQuery = query(collection(db, 'submissions'), where('assignmentId', '==', selectedEvaluation));
            const subSnap = await getDocs(subQuery);
            const fetchedSubmissions = {};
            subSnap.forEach(doc => {
              const data = doc.data();
              fetchedSubmissions[data.studentId] = data; 
            });
            setSubmissionsMap(fetchedSubmissions);
          } else {
            setSubmissionsMap({});
          }
        } else {
          setGradesMap({});
          setSubmissionsMap({});
        }
      } catch (error) {
        console.error("Error pulling records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsGradesAndSubmissions();
  }, [selectedClass, selectedEvaluation, myClasses]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setExamSubmitLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'exams'), {
        classId: selectedClass,
        teacherId: user.uid,
        title: examFormData.title.trim(),
        maxMarks: parseInt(examFormData.maxMarks),
        createdAt: new Date().toISOString()
      });
      
      setIsExamModalOpen(false);
      setExamFormData({ title: '', maxMarks: '100' });
      setSelectedEvaluation(docRef.id);
      fetchEvaluations();
      setSuccessMsg('Custom Exam created successfully!');
    } catch (error) {
      console.error("Error creating exam:", error);
    } finally {
      setExamSubmitLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    setGradesMap(prev => ({ ...prev, [studentId]: value }));
  };

  const activeEval = [...exams, ...assignments].find(e => e.id === selectedEvaluation);

  const handleSaveGrades = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg('');

    try {
      const activeClassObj = myClasses.find(c => c.id === selectedClass);
      const subjectName = activeClassObj?.subjectName || activeClassObj?.subject || activeClassObj?.course || activeClassObj?.className || 'General Course';

      const promises = students.map(student => {
        const score = gradesMap[student.id];
        if (score === undefined || score === '') return Promise.resolve();
        const parsedScore = parseFloat(score);
        if (isNaN(parsedScore)) return Promise.resolve(); 

        const recordId = `${student.id}_${selectedEvaluation}`;
        return setDoc(doc(db, 'grades', recordId), {
          studentId: student.id,
          studentName: student.name,
          classId: selectedClass,
          evaluationId: selectedEvaluation,
          evaluationTitle: activeEval?.title || 'Evaluation',
          subjectName: subjectName,
          maxMarks: activeEval?.maxMarks || 100,
          obtainedMarks: parsedScore, 
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await Promise.all(promises);
      setSuccessMsg(`${activeEval?.title || 'Evaluation'} records updated successfully!`);
    } catch (error) {
      console.error("Error saving score tables:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  let isEvaluationLocked = false;
  if (activeEval?.type === 'assignment' && activeEval.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    if (today < activeEval.dueDate) {
      isEvaluationLocked = true;
    }
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gradebook Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Record score tallies & review submitted student work.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              {myClasses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.gradeClass || 'Class'} - {c.subjectName || c.className} (Sec {c.section || 'A'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <Clipboard className="h-4 w-4 text-emerald-600" />
            <select
              value={selectedEvaluation}
              onChange={(e) => setSelectedEvaluation(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
              disabled={assignments.length === 0 && exams.length === 0}
            >
              {assignments.length === 0 && exams.length === 0 ? (
                <option value="">No Active Tasks</option>
              ) : (
                <>
                  {exams.length > 0 && (
                    <optgroup label="Custom Exams / Tests">
                      {exams.map(e => (
                        <option key={e.id} value={e.id}>📝 {e.title}</option>
                      ))}
                    </optgroup>
                  )}
                  {assignments.length > 0 && (
                    <optgroup label="Coursework Assignments">
                      {assignments.map(a => (
                        <option key={a.id} value={a.id}>📋 {a.title}</option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>
          </div>

          <button
            onClick={() => setIsExamModalOpen(true)}
            disabled={!selectedClass}
            className="flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Exam
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {successMsg}
        </div>
      )}

      {isEvaluationLocked && activeEval?.type === 'assignment' && (
        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-amber-900">Evaluation Locked</p>
            <p className="text-amber-700 mt-0.5">You can evaluate this assignment after the due date: <span className="font-bold">{activeEval.dueDate}</span>.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveGrades} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Enrolled</th>
                {activeEval?.type === 'assignment' && (
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted Work Details</th>
                )}
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Maximum Scale</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Obtained Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={activeEval?.type === 'assignment' ? 4 : 3} className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"></div>
                  </td>
                </tr>
              ) : (!activeEval) ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    Create a new exam or publish an assignment to configure grade sheets.
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    No students currently enrolled in this class section.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const currentMark = gradesMap[student.id];
                  const maxMarks = activeEval?.maxMarks || 100;
                  const submission = submissionsMap[student.id]; 

                  const percentage = (currentMark !== undefined && currentMark !== '' && !isNaN(parseFloat(currentMark)))
                    ? ((parseFloat(currentMark) / maxMarks) * 100).toFixed(0)
                    : null;

                  return (
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

                      {/* 🚀 Dynamic Multiple Submission Format Section */}
                      {activeEval?.type === 'assignment' && (
                        <td className="px-6 py-4 text-sm max-w-xs sm:max-w-md">
                          {submission ? (
                            <div className="space-y-1.5 flex flex-col">
                              {/* 1. Attached document file (fileUrl) */}
                              {submission.fileUrl && (
                                <a
                                  href={submission.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors cursor-pointer w-fit"
                                >
                                  <FileText className="h-4 w-4 shrink-0" />
                                  <span>{submission.fileName || 'Attached Document'}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              )}

                              {/* 2. Custom Reference link/Repository URL (submissionUrl) */}
                              {submission.submissionUrl && (
                                <a
                                  href={submission.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold transition-colors cursor-pointer w-fit break-all"
                                >
                                  <Paperclip className="h-4 w-4 shrink-0" />
                                  <span className="truncate max-w-[200px]">{submission.submissionUrl}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              )}

                              {/* 3. Text description/notes notes (comment) */}
                              {submission.comment && (
                                <div className="inline-flex items-start gap-1.5 bg-slate-50 border border-slate-100 p-2 rounded-xl text-slate-600 text-xs mt-0.5 leading-relaxed">
                                  <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span className="whitespace-pre-wrap">"{submission.comment}"</span>
                                </div>
                              )}

                              {/* Fallback if record somehow contains empty properties */}
                              {!submission.fileUrl && !submission.submissionUrl && !submission.comment && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 w-fit">
                                  Empty Hand-in
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100 w-fit">
                              Not Submitted
                            </span>
                          )}
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-500">
                        / {maxMarks}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          {percentage !== null && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 shadow-sm border border-slate-200">
                              {percentage}%
                            </span>
                          )}
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            placeholder="0.0"
                            value={currentMark !== undefined ? currentMark : ''} 
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            disabled={isEvaluationLocked}
                            className="w-24 px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-center font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {students.length > 0 && activeEval && (
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

      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Create Custom Exam</h3>
              <button type="button" onClick={() => setIsExamModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={examFormData.title}
                  onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="e.g. Mid-1, Quiz 3..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Maximum Marks</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={examFormData.maxMarks}
                  onChange={(e) => setExamFormData({ ...examFormData, maxMarks: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={examSubmitLoading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 flex items-center gap-2 cursor-pointer"
                >
                  {examSubmitLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradebookPortal;