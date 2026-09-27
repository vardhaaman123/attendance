import { useState, useRef } from 'react';
import { Users, ArrowLeft, Mail, AlertCircle, CheckCircle, BookOpen, Layers, Sparkles, RefreshCw, KeyRound, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import emailjs from '@emailjs/browser';
import CustomSelect from '../ui/CustomSelect';
import AnimatedBackground from '../ui/AnimatedBackground';

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));
const inputCls = 'w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]';

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-500',     textColor: 'text-red-400'     };
  if (score <= 2) return { score, label: 'Fair',   color: 'bg-amber-500',   textColor: 'text-amber-400'   };
  if (score <= 3) return { score, label: 'Good',   color: 'bg-blue-500',    textColor: 'text-blue-400'    };
  return             { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
}

export default function TeacherLoginPage() {
  const navigate = useNavigate();
  const { teacherLogin } = useAuth();
  const { teachers, saveTeachers, settings, setSelectedClass, setSelectedSection } = useApp();

  // ── Shared fields ──
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [selectedClass, setClassVal]  = useState('10');
  const [selectedDivision, setDivision] = useState('A');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  // ── Tab: "otp" | "password" ──
  const [loginMode, setLoginMode] = useState('otp');

  // ── OTP flow ──
  const [step, setStep]               = useState(1);
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [otpValue, setOtpValue]       = useState('');
  const [otpExpiry, setOtpExpiry]     = useState(null);
  const [matchedTeacher, setMatchedTeacher] = useState(null);
  const [timeLeft, setTimeLeft]       = useState(300);
  const timerRef                      = useRef(null);

  // ── Password flow ──
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);

  // ── Set Password flow (first-time) ──
  const [setStep3, setSetStep3]       = useState(false);
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showNewPw, setShowNewPw]     = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pendingTeacher, setPendingTeacher] = useState(null);

  const classOptions    = Array.from(new Set((teachers || []).map(t => String(t.class)))).sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
  const divisionOptions = Array.from(new Set((teachers || []).map(t => t.section?.toUpperCase()))).sort();
  const allClasses      = classOptions.length ? classOptions : ['8','9','10'];
  const allSections     = divisionOptions.length ? divisionOptions : ['A','B'];

  const findTeacher = (n, em, cls, sec) => {
    const src = (teachers && teachers.length > 0) ? teachers : JSON.parse(localStorage.getItem('attendify_teachers') || '[]');
    return src.find(t =>
      (t.name||'').trim().toLowerCase() === n.trim().toLowerCase() &&
      (t.email||'').trim().toLowerCase() === em.trim().toLowerCase() &&
      String(t.class||'').trim() === String(cls).trim() &&
      (t.section||'').trim().toUpperCase() === sec.trim().toUpperCase()
    );
  };

  // ── OTP FLOW ──
  const handleSendOTP = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!name.trim() || !email.trim() || !selectedClass || !selectedDivision) { setError('Please fill in all fields.'); return; }
    const found = findTeacher(name, email, selectedClass, selectedDivision);
    if (!found) { setError('No registered teacher found with these details. Please verify your Name, Gmail, Class, and Division.'); return; }
    setLoading(true);
    const code = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000;
    if (settings?.emailjsServiceId && settings?.emailjsTemplateId && settings?.emailjsPublicKey) {
      try {
        await emailjs.send(settings.emailjsServiceId, settings.emailjsTemplateId, {
          parent_name: found.name, student_name: `${found.name} (Teacher)`,
          date: `Your Teacher Login OTP is: ${code} (valid for 5 minutes)`,
          school_name: settings.schoolName || 'Attendify School', parent_email: found.email,
        }, settings.emailjsPublicKey);
      } catch (err) { console.warn('EmailJS failed:', err); }
    }
    console.log(`Teacher OTP for ${found.name}: ${code}`);
    setOtpValue(code); setOtpExpiry(expiry); setMatchedTeacher(found);
    setLoading(false); setStep(2); setTimeLeft(300);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }); }, 1000);
    setSuccess(`OTP sent to ${found.email}. Please check your inbox!`);
  };

  const otpRefs = useRef([]);
  const handleOtpChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[index] = val.slice(-1); setOtp(n); setError('');
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => { if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus(); };

  const handleVerifyOTP = async (e) => {
    e.preventDefault(); setError('');
    const entered = otp.join('');
    if (entered.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    if (Date.now() > otpExpiry) { setError('OTP has expired. Please request a new one.'); return; }
    if (entered !== otpValue) { setError('Incorrect OTP. Please check the code sent to your Gmail.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = teacherLogin({ name: matchedTeacher.name, email: matchedTeacher.email, class: matchedTeacher.class, section: matchedTeacher.section }, teachers);
    setLoading(false);
    if (result.success) { setSelectedClass(matchedTeacher.class); setSelectedSection(matchedTeacher.section); navigate('/dashboard'); }
    else { setError(result.error || 'Failed to authenticate teacher.'); }
  };

  const handleResend = () => { setStep(1); setOtp(['','','','','','']); setError(''); setSuccess(''); clearInterval(timerRef.current); };

  // ── PASSWORD FLOW ──
  const handlePasswordLogin = (e) => {
    e.preventDefault(); setError('');
    if (!name.trim() || !email.trim() || !selectedClass || !selectedDivision || !password) { setError('Please fill in all fields.'); return; }
    const found = findTeacher(name, email, selectedClass, selectedDivision);
    if (!found) { setError('No registered teacher found with these details. Please verify your Name, Gmail, Class, and Division.'); return; }

    // First-time: no custom password set
    if (!found.password || found.password === 'teacher123') {
      setPendingTeacher(found); setSetStep3(true); setError(''); return;
    }
    if (found.password !== password) { setError('Incorrect password. Please try again.'); return; }

    // Login success
    const result = teacherLogin({ name: found.name, email: found.email, class: found.class, section: found.section }, teachers);
    if (result.success) { setSelectedClass(found.class); setSelectedSection(found.section); navigate('/dashboard'); }
    else { setError(result.error || 'Login failed.'); }
  };

  // ── SET PASSWORD FLOW ──
  const pwStrength = getStrength(newPw);
  const handleSetPassword = (e) => {
    e.preventDefault(); setError('');
    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }

    // Save password to teachers array — visible in admin side
    const src = (teachers && teachers.length > 0) ? teachers : JSON.parse(localStorage.getItem('attendify_teachers') || '[]');
    const updated = src.map(t => t.id === pendingTeacher.id ? { ...t, password: newPw } : t);
    saveTeachers(updated);

    // Update session
    localStorage.setItem('attendify_teacher_session', JSON.stringify({ ...pendingTeacher, password: newPw }));

    const result = teacherLogin({ name: pendingTeacher.name, email: pendingTeacher.email, class: pendingTeacher.class, section: pendingTeacher.section }, updated);
    if (result.success) { setSelectedClass(pendingTeacher.class); setSelectedSection(pendingTeacher.section); navigate('/dashboard'); }
    else { setError('Login failed after setting password.'); }
  };

  const sampleTeacher = (teachers && teachers.length > 0) ? teachers[0] : { name: 'Mrs. Anjali Sharma', email: 'anjali.sharma@school.edu', class: '10', section: 'A' };
  const handleFillDemo = (t) => { setName(t.name); setEmail(t.email); setClassVal(t.class); setDivision(t.section); setError(''); };
  const handleAutoFillOTP = () => { if (otpValue?.length === 6) { setOtp(otpValue.split('')); setError(''); } };
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const totalSteps = loginMode === 'otp' ? 2 : (setStep3 ? 2 : 1);
  const currentStep = loginMode === 'otp' ? step : (setStep3 ? 2 : 1);

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center px-4 py-6 sm:py-10 relative overflow-hidden selection:bg-blue-500/30">
      {/* Clean static background */}
      <AnimatedBackground theme="blue" />

      <div className="w-full max-w-md relative z-10">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-xs font-medium text-slate-200 hover:text-white mb-5 sm:mb-6 transition-all backdrop-blur-md shadow-lg">
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
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Teacher Portal Login</h1>
              <p className="text-xs text-slate-400">
                {setStep3 ? 'Create your secure password' : loginMode === 'otp' ? (step === 1 ? 'Enter your name, Gmail & assigned class' : 'Enter the 6-digit OTP sent to your Gmail') : 'Login with your password'}
              </p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < currentStep ? 'bg-blue-500' : 'bg-white/[0.08]'}`} />
            ))}
          </div>

          {/* ── LOGIN MODE TAB ── */}
          {!setStep3 && ((loginMode === 'otp' && step === 1) || loginMode === 'password') && (
            <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl mb-5">
              {[{ id: 'otp', icon: Mail, label: 'Email OTP' }, { id: 'password', icon: Lock, label: 'Password' }].map(({ id, icon: Icon, label }) => (
                <button key={id} type="button" onClick={() => { setLoginMode(id); setError(''); setSuccess(''); setPassword(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${loginMode === id ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:text-white'}`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Shared fields: Name + Gmail + Class + Section */}
          {!setStep3 && (loginMode === 'password' || (loginMode === 'otp' && step === 1)) && (
            <form onSubmit={loginMode === 'otp' ? handleSendOTP : handlePasswordLogin} className="space-y-3.5 sm:space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teacher Full Name *</label>
                <input type="text" className={inputCls} placeholder="Enter your full name" value={name} onChange={e => { setName(e.target.value); setError(''); }} autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teacher's Gmail Address *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <input type="email" className={`${inputCls} pl-10`} placeholder="Enter your email address" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoComplete="new-password" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1"><BookOpen size={13} className="text-blue-400" /> Class *</label>
                  <CustomSelect className={`${inputCls} cursor-pointer`} value={selectedClass} onChange={e => { setClassVal(e.target.value); setError(''); }}>
                    {allClasses.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                  </CustomSelect>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1"><Layers size={13} className="text-blue-400" /> Section *</label>
                  <CustomSelect className={`${inputCls} cursor-pointer`} value={selectedDivision} onChange={e => { setDivision(e.target.value); setError(''); }}>
                    {allSections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                  </CustomSelect>
                </div>
              </div>

              {/* Password field — only in password mode */}
              {loginMode === 'password' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                    <input type={showPw ? 'text' : 'password'} className={`${inputCls} pl-10 pr-10`} placeholder="Enter your password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400"><AlertCircle size={15} className="flex-shrink-0" /><p>{error}</p></div>}

              <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(59,130,246,0.35)] text-white font-semibold text-sm transition-all disabled:opacity-60 mt-2 active:scale-[0.99] cursor-pointer">
                {loading ? 'Sending Verification Code...' : loginMode === 'otp' ? 'Send OTP to Gmail →' : 'Sign In with Password →'}
              </button>
            </form>
          )}

          {/* ── OTP STEP 2 ── */}
          {loginMode === 'otp' && step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-5">
              {success && <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2.5"><CheckCircle size={15} className="text-blue-400 flex-shrink-0" /><p className="text-xs text-blue-300">{success}</p></div>}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-3 text-center">Enter 6-Digit Verification Code</label>
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-10 sm:w-11 h-12 text-center text-lg font-bold bg-[#111726] border border-white/[0.12] text-white rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  ))}
                </div>
              </div>
              {otpValue && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                  <span className="text-blue-300 flex items-center gap-1.5"><KeyRound size={13} className="text-blue-400" /> Code: <strong className="font-mono text-white tracking-widest">{otpValue}</strong></span>
                  <button type="button" onClick={handleAutoFillOTP} className="text-[11px] text-blue-400 hover:underline font-semibold cursor-pointer">Auto-paste OTP</button>
                </div>
              )}
              <div className="text-center">
                {timeLeft > 0
                  ? <p className="text-xs text-slate-400">OTP expires in <span className="text-blue-400 font-mono font-bold">{formatTime(timeLeft)}</span></p>
                  : <p className="text-xs text-red-400 font-semibold">OTP expired. Please request a new code.</p>}
              </div>
              {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400"><AlertCircle size={15} className="flex-shrink-0" /><p>{error}</p></div>}
              <button type="submit" disabled={loading || timeLeft === 0} className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(59,130,246,0.35)] text-white font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.99] cursor-pointer">
                {loading ? 'Verifying OTP...' : 'Verify OTP & Sign In →'}
              </button>
              <button type="button" onClick={handleResend} className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors py-2 cursor-pointer">
                <RefreshCw size={13} /> Try different email / Resend OTP
              </button>
            </form>
          )}

          {/* ── SET PASSWORD (first-time) ── */}
          {setStep3 && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="flex items-center gap-2.5 p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl">
                <ShieldCheck size={16} className="text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-300">Create your personal password</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Welcome, <span className="text-white font-semibold">{pendingTeacher?.name}</span>! Set a secure password for future logins.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <input type={showNewPw ? 'text' : 'password'} className={`${inputCls} pl-10 pr-10`} placeholder="Min. 6 characters" value={newPw} onChange={e => { setNewPw(e.target.value); setError(''); }} />
                  <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= pwStrength.score ? pwStrength.color : 'bg-white/10'}`} />)}</div>
                    <div className="flex justify-between">
                      <p className="text-[11px] text-slate-500">Use A-Z, 0-9, symbols (!@#$%)</p>
                      <p className={`text-[11px] font-semibold ${pwStrength.textColor}`}>{pwStrength.label}</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <input type={showConfirmPw ? 'text' : 'password'} className={`${inputCls} pl-10 pr-10`} placeholder="Re-enter password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setError(''); }} />
                  <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPw && newPw && <p className={`text-[11px] mt-1.5 font-medium ${confirmPw === newPw ? 'text-emerald-400' : 'text-red-400'}`}>{confirmPw === newPw ? '✓ Passwords match' : '✗ Passwords do not match'}</p>}
              </div>
              {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400"><AlertCircle size={15} className="flex-shrink-0" /><p>{error}</p></div>}
              <button type="submit" className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(59,130,246,0.35)] text-white font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer">
                Set Password & Sign In →
              </button>
              <button type="button" onClick={() => { setSetStep3(false); setNewPw(''); setConfirmPw(''); setError(''); }} className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 cursor-pointer">
                ← Back to login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          {setStep3 ? 'Your password will be saved securely. Admin can reset it if needed.' : 'Teachers must be registered by the School Administrator.'}
        </p>
      </div>
    </div>
  );
}
