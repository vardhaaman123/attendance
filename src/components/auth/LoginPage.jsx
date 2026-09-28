import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, CheckSquare, Square, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth, ALLOWED_ADMIN_EMAIL } from '../../context/AuthContext';
import AnimatedBackground from '../ui/AnimatedBackground';

export default function LoginPage() {
  const [email, setEmail] = useState(ALLOWED_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ALLOWED_ADMIN_EMAIL) {
      setError(`Access Denied: Only ${ALLOWED_ADMIN_EMAIL} is authorized to sign in.`);
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await login(cleanEmail, password, remember);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center px-4 py-6 sm:py-10 relative overflow-hidden selection:bg-purple-500/30">
      {/* Clean static background */}
      <AnimatedBackground theme="purple" />

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-xs font-medium text-slate-200 hover:text-white mb-5 sm:mb-6 transition-all backdrop-blur-md shadow-lg"
        >
          <ArrowLeft size={14} /> Back to Role Selection
        </button>

        <div className="bg-[#0C101A]/95 border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top inner glow */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-4 sm:mb-5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <ShieldCheck size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Admin Console Login</h1>
              <p className="text-xs text-slate-400">Sign in to your school admin account</p>
            </div>
          </div>

          {/* Security Policy Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs mb-4 shadow-sm">
            <ShieldCheck size={16} className="text-purple-400 flex-shrink-0" />
            <p className="leading-snug">
              {ALLOWED_ADMIN_EMAIL
                ? <>Protected Console • Only <span className="font-semibold text-white">{ALLOWED_ADMIN_EMAIL}</span> is authorized.</>
                : <>Admin Console • Sign in with your Google account or email.</>
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter admin email address"
                  className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 pr-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setRemember(r => !r)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {remember
                  ? <CheckSquare className="text-purple-400 w-4 h-4" />
                  : <Square className="text-slate-600 w-4 h-4" />
                }
                Remember me
              </button>
              <button type="button" className="text-xs text-purple-400 hover:underline font-medium cursor-pointer">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 sm:py-3 text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(168,85,247,0.35)] disabled:opacity-70 disabled:cursor-not-allowed mt-2 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0C101A] px-3 text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 border border-white/[0.1] rounded-xl bg-[#111726] hover:bg-[#161E30] text-slate-200 hover:text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {googleLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5 sm:mt-6">
          Admin portal secured with Firebase Authentication
        </p>
      </div>
    </div>
  );
}
