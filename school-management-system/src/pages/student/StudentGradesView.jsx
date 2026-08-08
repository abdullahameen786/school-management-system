// src/pages/student/StudentGradesView.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Award, BookOpen, AlertCircle, CheckCircle2, FileText, Trophy } from 'lucide-react';

const StudentGradesView = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
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
      } catch (error) {
        console.error("Error fetching student grades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user]);

  // Calculate stats
  const totalEvaluations = grades.length;
  const averagePercentage = totalEvaluations > 0 
    ? (grades.reduce((acc, curr) => acc + ((curr.obtainedMarks / curr.maxMarks) * 100), 0) / totalEvaluations).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Grades & Evaluations</h1>
        <p className="text-slate-500 text-sm mt-1">Review your scores across coursework assignments, midterms, and finals.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Evaluations Recorded</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalEvaluations}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Average Performance</p>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluation Title</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Score Obtained</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600"></div>
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No grades have been published for your account yet.
                  </td>
                </tr>
              ) : (
                grades.map((item) => {
                  const percentage = ((item.obtainedMarks / item.maxMarks) * 100).toFixed(1);
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