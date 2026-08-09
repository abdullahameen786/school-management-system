// src/pages/admin/AnalyticsOverview.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AnalyticsOverview = () => {
  const [stats, setStats] = useState({ teachers: 0, students: 0, courses: 0, fees: 'Rs. 480K' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const financialData = [
    { month: 'Jan', Collections: 340000 },
    { month: 'Feb', Collections: 380000 },
    { month: 'Mar', Collections: 410000 },
    { month: 'Apr', Collections: 390000 },
    { month: 'May', Collections: 450000 },
    { month: 'Jun', Collections: 480000 },
  ];

  const distributionData = [
    { name: 'Class 8', Students: 120, Teachers: 8 },
    { name: 'Class 9', Students: 98, Teachers: 6 },
    { name: 'Class 10', Students: 75, Teachers: 4 },
  ];

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        let teacherCount = 0;
        try {
          const teacherQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
          const teacherSnap = await getDocs(teacherQuery);
          teacherCount = teacherSnap.size;
        } catch (err) {
          console.warn("Could not fetch teachers:", err);
        }
        
        let studentCount = 0;
        try {
          const studentQuery = query(collection(db, 'users'), where('role', '==', 'student'));
          const studentSnap = await getDocs(studentQuery);
          studentCount = studentSnap.size;
        } catch (err) {
          console.warn("Could not fetch students:", err);
        }

        let classCount = 0;
        try {
          const classesSnap = await getDocs(collection(db, 'classes'));
          classCount = classesSnap.size;
        } catch (err) {
          console.warn("Could not fetch classes:", err);
        }

        setStats({
          teachers: teacherCount,
          students: studentCount,
          courses: classCount, 
          fees: 'Rs. 480K'
        });
      } catch (error) {
        console.error("Error reading analytics overview: ", error);
        setErrorMsg('Failed to load dashboard metrics. Please check Firestore rules.');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const cardItems = [
    { title: 'Total Students', value: stats.students, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { title: 'Total Teachers', value: stats.teachers, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { title: 'Active Classes', value: stats.courses, icon: BookOpen, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
    { title: 'Fee Collection', value: stats.fees, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">NSES Analytics Overview</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Active institutional summary data matrix for National Standard Education System.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cardItems.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1.5">
                <p className="text-[11px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider">{card.title}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{card.value}</h3>
              </div>
              <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border flex items-center justify-center shrink-0 ${card.bg}`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Fee Collection Streams</h3>
              <p className="text-slate-400 text-xs">Monthly cash inflows review</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 w-fit">
              <TrendingUp className="h-3.5 w-3.5" /> +14.2%
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `Rs.${v/1000}k`} />
                <Tooltip formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Collected']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Collections" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFees)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Grade Level Ratios</h3>
            <p className="text-slate-400 text-xs">Strength distribution array</p>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Teachers" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;