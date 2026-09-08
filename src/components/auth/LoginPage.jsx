import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(email, password, remember);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-navy-900 dark:via-navy-800 dark:to-navy-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 
        Container constraints:
        - max-w scales up smoothly up to 1400px
        - min-h is 550px to ensure it doesn't get too small
        - max-h-[90vh] ensures it NEVER exceeds 90% of the screen height, preventing outer scrolling
      */}
      <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-[1400px] min-h-[550px] max-h-[90vh] grid lg:grid-cols-2 gap-0 bg-white dark:bg-navy-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Left panel - Illustration */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-navy-900 to-[#1e3a8a] p-8 xl:p-12 2xl:p-16 text-white overflow-hidden">
          <div className="flex items-center gap-3 xl:gap-4">
            <div className="w-10 h-10 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 rounded-xl xl:rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="text-white w-5 h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
            </div>
            <div>
              <p className="text-base xl:text-lg 2xl:text-2xl font-bold">Attendify</p>
              <p className="text-xs xl:text-sm 2xl:text-base text-blue-300">Smart School Attendance</p>
            </div>
          </div>

          <div className="space-y-6 xl:space-y-8 flex-1 flex flex-col justify-center my-6">
            {/* Illustration */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="w-full h-40 xl:h-48 2xl:h-56 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-5 xl:p-6">
                <div className="space-y-2.5 xl:space-y-3 w-full">
                  {[
                    { name: 'Aarav Kumar', status: 'present' },
                    { name: 'Ananya Sharma', status: 'present' },
                    { name: 'Rahul Patil', status: 'absent' },
                    { name: 'Sneha Kulkarni', status: 'late' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] xl:text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 h-8 xl:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center px-3 xl:px-4">
                        <span className="text-[11px] xl:text-sm text-white/90">{s.name}</span>
                      </div>
                      <div className={`px-2 py-0.5 xl:px-3 xl:py-1 rounded-md text-[10px] xl:text-xs font-semibold ${
                        s.status === 'present' ? 'bg-green-500/20 text-green-300' :
                        s.status === 'absent' ? 'bg-red-500/20 text-red-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-3 -right-3 xl:-top-4 xl:-right-4 bg-green-500 rounded-xl px-3 py-1.5 shadow-lg">
                <p className="text-[11px] xl:text-xs font-bold text-white">92% Attendance ✓</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl xl:text-4xl 2xl:text-5xl font-bold leading-tight mb-2 xl:mb-4">
                Attendance made simple for every classroom.
              </h2>
              <p className="text-blue-200 text-sm xl:text-base 2xl:text-lg leading-relaxed">
                Take attendance in seconds, track student progress, and generate insightful reports — all in one place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 xl:gap-5">
              {[
                { label: 'Students', value: '180+' },
                { label: 'Classes', value: '6' },
                { label: 'Accuracy', value: '99%' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 xl:p-4 text-center">
                  <p className="text-lg xl:text-2xl 2xl:text-3xl font-bold text-white mb-0.5">{s.value}</p>
                  <p className="text-[10px] xl:text-xs 2xl:text-sm text-blue-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] xl:text-xs 2xl:text-sm text-blue-300">© 2026 Attendify · Delhi Public School</p>
        </div>

        {/* Right panel - Login form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 xl:p-16 2xl:p-20 overflow-y-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-navy-900 dark:text-white">Attendify</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">School Attendance Portal</p>
            </div>
          </div>

          <div className="mb-6 xl:mb-8 2xl:mb-10">
            <h1 className="text-2xl xl:text-4xl 2xl:text-5xl font-bold text-navy-900 dark:text-white mb-1.5 xl:mb-3">Welcome back 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg 2xl:text-xl">Sign in to your teacher account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 xl:space-y-6">
            <div>
              <label className="block text-xs xl:text-sm 2xl:text-base font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 xl:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 xl:w-5 xl:h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="input-field pl-10 xl:pl-12 xl:py-3.5 2xl:py-4 xl:text-base rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs xl:text-sm 2xl:text-base font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 xl:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 xl:w-5 xl:h-5" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10 xl:pl-12 xl:pr-12 xl:py-3.5 2xl:py-4 xl:text-base rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 xl:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4 xl:w-5 xl:h-5" /> : <Eye className="w-4 h-4 xl:w-5 xl:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRemember(r => !r)}
                className="flex items-center gap-2 text-xs xl:text-sm 2xl:text-base text-slate-600 dark:text-slate-400"
              >
                {remember
                  ? <CheckSquare className="text-brand-blue w-4 h-4 xl:w-5 xl:h-5" />
                  : <Square className="text-slate-400 w-4 h-4 xl:w-5 xl:h-5" />
                }
                Remember me
              </button>
              <button type="button" className="text-xs xl:text-sm 2xl:text-base text-brand-blue hover:underline font-medium">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm xl:text-base text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 xl:py-3.5 2xl:py-4 text-sm xl:text-lg rounded-xl disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 xl:h-5 xl:w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 xl:w-5 xl:h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 xl:mt-8 p-3.5 xl:p-5 bg-slate-50 dark:bg-navy-700 rounded-xl border border-slate-100 dark:border-navy-600">
            <p className="text-xs xl:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Secure Login</p>
            <p className="text-[11px] xl:text-sm text-slate-600 dark:text-slate-300">
              Authentication is now securely powered by Firebase. Ensure your Firebase configuration is added in the <span className="font-mono bg-slate-200 dark:bg-navy-600 px-1 py-0.5 rounded">.env</span> file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
