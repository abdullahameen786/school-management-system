// src/pages/admin/AnalyticsOverview.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Users, GraduationCap, BookOpen, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const AnalyticsOverview = () => {
  const [stats, setStats] = useState({ teachers: 0, students: 0, courses: 0, fees: 'Rs. 450K' });
  const [loading, setLoading] = useState(true);

  // Sample static charting data for visual presentation
  const financialData = [
    { month: 'Jan', Collections: 340000 },
    { month: 'Feb', Collections: 380000 },
    { month: 'Mar', Collections: 410000 },
    { month: 'Apr', Collections: 390000 },
    { month: 'May', Collections: 450000 },
    { month: 'Jun', Collections: 480000 },
  ];

  const distributionData = [
    { name: 'CS Dept', Students: 120, Teachers: 8 },
    { name: 'Eng Dept', Students: 98, Teachers: 6 },
    { name: 'Math Dept', Students: 75, Teachers: 4 },
    { name: 'Sci Dept', Students: 110, Teachers: 7 },
  ];

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch teachers count
        const teacherQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const teacherSnap = await getDocs(teacherQuery);
        
        // Fetch students count
        const studentQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentSnap = await getDocs(studentQuery);

        setStats({
          teachers: teacherSnap.size,
          students: studentSnap.size,
          courses: 12, // Placeholder static value until classes collection builds out
          fees: 'Rs. 480K'
        });
      } catch (error) {
        console.error("Error reading collection statistics: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const cardItems = [
    { title: 'Total Students', value: stats.students, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { title: 'Total Teachers', value: stats.teachers, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { title: 'Active Courses', value: stats.courses, icon: BookOpen, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
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
    <div className="space-y-8">
      {/* Title greeting row */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Here is the active summary data matrix for your institution.</p>
      </div>

      {/* Grid Dashboard Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardItems.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-bold text-slate-800">{card.value}</h3>
              </div>
              <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${card.bg}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Flow Line Graph Component */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Fee Collection Streams</h3>
              <p className="text-slate-400 text-xs">Monthly cash inflows review</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <TrendingUp className="h-3.5 w-3.5" /> +14.2%
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `Rs.${v/1000}k`} />
                <Tooltip formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Collected']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="Collections" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFees)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Distribution Bar chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Department Ratios</h3>
            <p className="text-slate-400 text-xs">Strength distribution array</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
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