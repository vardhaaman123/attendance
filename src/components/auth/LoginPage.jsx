import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckSquare,
  Square,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AnimatedBackground from '../ui/AnimatedBackground';
import PasswordRequirements, { validatePasswordRules } from '../ui/PasswordRequirements';

export default function LoginPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  // Create Admin Account state
  const [collegeName, setCollegeName] = useState('');
  const [principleName, setPrincipleName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, createAdminAccount } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your admin email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(cleanEmail, password, remember);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!collegeName.trim()) {
      setError('Please enter College Name.');
      return;
    }
    if (!principleName.trim()) {
      setError('Please enter Principle Name.');
      return;
    }
    const cleanEmail = signupEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter Email id.');
      return;
    }
    if (!signupPassword) {
      setError('Please enter Password.');
      return;
    }
    const pwValidation = validatePasswordRules(signupPassword);
    if (!pwValidation.allSatisfied) {
      setError(`Password does not satisfy all requirements: missing ${pwValidation.firstMissing?.label?.toLowerCase() || 'requirements'}.`);
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoading(true);
    const result = await createAdminAccount({
      collegeName: collegeName.trim(),
      principleName: principleName.trim(),
      email: cleanEmail,
      password: signupPassword,
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden selection:bg-purple-500/30">
      {/* Background visual effects */}
      <AnimatedBackground theme="purple" />

      <div className="w-full max-w-lg relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-xs font-medium text-slate-200 hover:text-white mb-5 transition-all backdrop-blur-md shadow-lg cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Role Selection
        </button>

        <div className="bg-[#0C101A]/95 border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden">
          {/* Top subtle glow */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/25 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              {mode === 'signin' ? <ShieldCheck size={22} className="sm:w-6 sm:h-6" /> : <UserPlus size={22} className="sm:w-6 sm:h-6" />}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {mode === 'signin' ? 'Admin Console Login' : 'Create Admin Account'}
              </h1>
              <p className="text-xs text-slate-400">
                {mode === 'signin'
                  ? 'Sign in with your Email ID and Password'
                  : 'Register your college & principal administrator credentials'}
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#111726] p-1 rounded-xl mb-5 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-purple-600 text-white shadow-[0_2px_12px_rgba(168,85,247,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={14} />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-purple-600 text-white shadow-[0_2px_12px_rgba(168,85,247,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={14} />
              Create Admin Account
            </button>
          </div>

          {/* Security Notice Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs mb-4 shadow-sm">
            <ShieldCheck size={16} className="text-purple-400 flex-shrink-0" />
            <p className="leading-snug">
              {mode === 'signin'
                ? 'Protected Console • School & College Administrator Access Only'
                : 'Institution Registration • Sets up College Name & Principal in Firestore'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400 mb-4 animate-fade-in">
              {error}
            </div>
          )}

          {/* ── Form: Sign In Mode ── */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email id *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email address"
                    className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                    required
                    autoComplete="email"
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 pr-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {remember ? (
                    <CheckSquare className="text-purple-400 w-4 h-4" />
                  ) : (
                    <Square className="text-slate-600 w-4 h-4" />
                  )}
                  Remember me
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
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
                  <>
                    Sign In <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-xs text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  Don't have an admin account?{' '}
                  <span className="font-semibold text-purple-400 hover:underline">
                    Create Admin Account
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* ── Form: Create Admin Account Mode ── */
            <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-3.5" autoComplete="off">
              {/* College Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  College Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Oxford Engineering College"
                    className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                    required
                  />
                </div>
              </div>

              {/* Principle Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Principle Name *
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                  <input
                    type="text"
                    value={principleName}
                    onChange={(e) => setPrincipleName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                    required
                  />
                </div>
              </div>

              {/* Email id */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email id *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. principal@college.edu"
                    className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                  <input
                    type={showSignupPw ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 pr-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordRequirements password={signupPassword} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 pl-10 pr-10 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && signupPassword && (
                  <p className={`text-[11px] mt-1.5 font-semibold ${signupPassword === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {signupPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 sm:py-3 text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(168,85,247,0.35)] disabled:opacity-70 disabled:cursor-not-allowed mt-3 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating Admin Account...
                  </>
                ) : (
                  <>
                    Create Admin Account <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-xs text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  Already have an admin account?{' '}
                  <span className="font-semibold text-purple-400 hover:underline">
                    Sign In
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          Admin portal secured with Firebase Authentication & Firestore
        </p>
      </div>
    </div>
  );
}
