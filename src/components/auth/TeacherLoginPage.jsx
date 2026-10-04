import { useState } from 'react';
import {
  Users,
  ArrowLeft,
  Mail,
  AlertCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { broadcastLiveEvent } from '../../services/firestoreService';
import AnimatedBackground from '../ui/AnimatedBackground';
import { validatePasswordRules } from '../ui/PasswordRequirements';

const inputCls =
  'w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]';

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-400' };
  return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
}

export default function TeacherLoginPage() {
  const navigate = useNavigate();
  const { teacherLogin } = useAuth();
  const { teachers, updateTeacher, setSelectedClass, setSelectedSection } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── First-time Set Password flow ──
  const [setStep3, setSetStep3] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pendingTeacher, setPendingTeacher] = useState(null);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    // 1. Try teacherLogin (checks users_lookup global index, then local teachers)
    const result = await teacherLogin(cleanEmail, teachers, password);
    setLoading(false);

    if (result.success) {
      const found = result.teacher;
      // First-time: default password requires setting a custom one
      if (!found.password || found.password === 'teacher123') {
        setPendingTeacher(found);
        setSetStep3(true);
        setError('');
        return;
      }
      if (found.class) setSelectedClass(String(found.class));
      if (found.section) setSelectedSection(String(found.section));
      navigate('/dashboard');
    } else {
      setError(result.error || 'No registered teacher found with this email or invalid password.');
    }
  };

  const pwStrength = getStrength(newPw);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    const pwCheck = validatePasswordRules(newPw);
    if (!pwCheck.allSatisfied) {
      setError(`Password must satisfy all requirements: missing ${pwCheck.firstMissing?.label?.toLowerCase() || 'requirements'}.`);
      return;
    }
    if (newPw !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const teacherToUpdate = pendingTeacher || {};
    const targetId = teacherToUpdate.id;
    const targetCollege = teacherToUpdate.collegeId || 'dps_main';

    if (targetId) {
      await updateTeacher(targetId, {
        ...teacherToUpdate,
        password: newPw,
        collegeId: targetCollege,
      });

      broadcastLiveEvent('TEACHER_PASSWORD_UPDATED', {
        teacherId: targetId,
        email: teacherToUpdate.email,
        name: teacherToUpdate.name,
        password: newPw,
        collegeId: targetCollege,
      });
    }

    const result = await teacherLogin(
      teacherToUpdate.email,
      teachers,
      newPw
    );
    setLoading(false);

    if (result.success) {
      if (pendingTeacher.class) setSelectedClass(String(pendingTeacher.class));
      if (pendingTeacher.section) setSelectedSection(String(pendingTeacher.section));
      navigate('/dashboard');
    } else {
      setError('Login failed after setting password.');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden selection:bg-blue-500/30">
      <AnimatedBackground theme="blue" />

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-xs font-medium text-slate-200 hover:text-white mb-5 transition-all backdrop-blur-md shadow-lg cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Role Selection
        </button>

        <div className="bg-[#0C101A]/95 border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5 sm:mb-6">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Teacher Portal Login
              </h1>
              <p className="text-xs text-slate-400">
                {setStep3
                  ? 'Create your personal password'
                  : 'Sign in with your Email ID and Password'}
              </p>
            </div>
          </div>

          {/* ── Form: Login with Password ── */}
          {!setStep3 && (
            <form onSubmit={handlePasswordLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teacher's Email Address *
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10"
                  />
                  <input
                    type="email"
                    className={`${inputCls} pl-10`}
                    placeholder="Enter your registered email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <KeyRound
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10"
                  />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(59,130,246,0.35)] text-white font-semibold py-2.5 sm:py-3 text-sm rounded-xl transition-all disabled:opacity-60 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── SET PASSWORD (first-time) ── */}
          {setStep3 && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="flex items-center gap-2.5 p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl">
                <ShieldCheck size={16} className="text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-300">
                    Create your personal password
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Welcome,{' '}
                    <span className="text-white font-semibold">
                      {pendingTeacher?.name}
                    </span>
                    ! Set a secure password for future logins.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10"
                  />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Min. 6 characters"
                    value={newPw}
                    onChange={(e) => {
                      setNewPw(e.target.value);
                      setError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all ${
                            i <= pwStrength.score
                              ? pwStrength.color
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <p className="text-[11px] text-slate-500">
                        Use A-Z, 0-9, symbols (!@#$%)
                      </p>
                      <p
                        className={`text-[11px] font-semibold ${pwStrength.textColor}`}
                      >
                        {pwStrength.label}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10"
                  />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Re-enter password"
                    value={confirmPw}
                    onChange={(e) => {
                      setConfirmPw(e.target.value);
                      setError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPw && newPw && (
                  <p
                    className={`text-[11px] mt-1.5 font-medium ${
                      confirmPw === newPw ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {confirmPw === newPw
                      ? '✓ Passwords match'
                      : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(59,130,246,0.35)] text-white font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                Set Password & Sign In →
              </button>
              <button
                type="button"
                onClick={() => {
                  setSetStep3(false);
                  setNewPw('');
                  setConfirmPw('');
                  setError('');
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 cursor-pointer"
              >
                ← Back to login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          {setStep3
            ? 'Your password will be saved securely. Admin can reset it if needed.'
            : 'Teachers are registered by the School/College Administrator.'}
        </p>
      </div>
    </div>
  );
}
