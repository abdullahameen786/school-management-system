// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLocalLoading(true);

    const typedEmail = email.trim().toLowerCase();

    try {
      console.log("Submitting credentials for:", typedEmail);
      await signInWithEmailAndPassword(auth, typedEmail, password);
      
      // 🚀 DIRECT NAVIGATION CONTROL (No useEffect looping)
      if (typedEmail === 'admin@school.com') {
        console.log("Admin override active. Routing to /admin immediately.");
        setLocalLoading(false);
        navigate('/admin', { replace: true });
        return;
      }

      // If it's a teacher or student, query the database once
      const q = query(collection(db, 'users'), where('email', '==', typedEmail));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const role = snap.docs[0].data().role;
        console.log("User role verified from DB:", role);
        setLocalLoading(false);
        navigate(`/${role}`, { replace: true });
      } else {
        setError('User record not found in system database.');
        setLocalLoading(false);
      }

    } catch (err) {
      console.error("Operational catch branch active:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password credentials.');
      } else {
        setError('Authentication server error. Please try again.');
      }
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold tracking-wider shadow-md shadow-indigo-200 text-lg">
            NSES
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            NSES Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            National Standard Education System
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 border border-rose-100 font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="emailInput" className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="emailInput"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm transition-colors"
                  placeholder="admin@school.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="passwordInput" className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="passwordInput"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={localLoading}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 transition-colors cursor-pointer"
            >
              {localLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;