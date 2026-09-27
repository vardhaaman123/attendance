import { useState, useRef } from "react";
import {
  GraduationCap, ArrowLeft, Mail, AlertCircle, CheckCircle,
  RefreshCw, Lock, Eye, EyeOff, KeyRound, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import emailjs from "@emailjs/browser";
import CustomSelect from "../ui/CustomSelect";
import AnimatedBackground from "../ui/AnimatedBackground";

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const inputCls = "w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]";

// Password strength checker
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const { studentLogin } = useAuth();
  const { students, saveStudents, settings } = useApp();

  // ── Tab: "otp" | "password" ──
  const [loginMode, setLoginMode] = useState("otp");

  // ── Shared fields ──
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [division, setDivision] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── OTP flow ──
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1=details, 2=otp
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpValue, setOtpValue] = useState("");
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const timerRef = useRef(null);

  // ── Password flow ──
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // ── Set Password flow (step 3) ──
  const [setStep3, setSetStep3] = useState(false); // true = show set-password screen
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pendingStudent, setPendingStudent] = useState(null);

  const divisionOptions = Array.from(new Set(students.map(s => `${s.class}-${s.section}`))).sort((a, b) => {
    const [ac, as_] = a.split("-"); const [bc, bs_] = b.split("-");
    const nc = ac.localeCompare(bc, undefined, { numeric: true });
    return nc !== 0 ? nc : as_.localeCompare(bs_);
  });

  // ─────────────────────────────────────────────────────────
  // OTP FLOW
  // ─────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !studentName || !rollNumber || !division) { setError("Please fill in all fields."); return; }
    const [cls, sec] = division.split("-");
    const found = students.find(s =>
      s.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
      s.name.toLowerCase().trim() === studentName.toLowerCase().trim() &&
      String(s.rollNumber).trim() === String(rollNumber).trim() &&
      s.class === cls && s.section === sec && s.status === "active"
    );
    if (!found) { setError("No student found with these details. Please check your name, roll number, division, and parent email."); return; }
    setLoading(true);
    const code = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000;
    if (settings?.emailjsServiceId && settings?.emailjsTemplateId && settings?.emailjsPublicKey) {
      try {
        await emailjs.send(settings.emailjsServiceId, settings.emailjsTemplateId, {
          parent_name: found.parentName || "Parent/Guardian",
          student_name: found.name,
          date: `Your OTP is: ${code} (valid for 5 minutes)`,
          school_name: settings.schoolName || "School",
          parent_email: found.email,
        }, settings.emailjsPublicKey);
      } catch (err) { console.warn("EmailJS OTP send failed:", err); }
    }
    console.log(`OTP for ${found.name}: ${code}`);
    setOtpValue(code); setOtpExpiry(expiry); setMatchedStudent(found);
    setLoading(false); setStep(2); setTimeLeft(300);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }); }, 1000);
    setSuccess(`OTP sent to ${email}. Check your inbox!`);
  };

  const otpRefs = useRef([]);
  const handleOtpChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[index] = val.slice(-1); setOtp(n); setError("");
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => { if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus(); };

  const handleVerifyOTP = async (e) => {
    e.preventDefault(); setError("");
    const entered = otp.join("");
    if (entered.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    if (Date.now() > otpExpiry) { setError("OTP has expired. Please request a new one."); return; }
    if (entered !== otpValue) { setError("Incorrect OTP. Please try again."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    localStorage.setItem("attendify_role", "student");
    localStorage.setItem("attendify_student_session", JSON.stringify(matchedStudent));
    setLoading(false);
    window.location.href = "/student-dashboard";
  };

  const handleResend = () => { setStep(1); setOtp(["","","","","",""]); setError(""); setSuccess(""); clearInterval(timerRef.current); };
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─────────────────────────────────────────────────────────
  // PASSWORD FLOW
  // ─────────────────────────────────────────────────────────
  const handlePasswordLogin = (e) => {
    e.preventDefault(); setError("");
    if (!studentName || !rollNumber || !division || !password) { setError("Please fill in all fields."); return; }
    const [cls, sec] = division.split("-");
    const found = students.find(s =>
      s.name.toLowerCase().trim() === studentName.toLowerCase().trim() &&
      String(s.rollNumber).trim() === String(rollNumber).trim() &&
      s.class === cls && s.section === sec && s.status === "active"
    );
    if (!found) { setError("No student found with these details. Please check your name, roll number, and class."); return; }

    // If student has no password yet (or default 1234), offer to set a new one
    if (!found.password || found.password === "1234") {
      setPendingStudent(found);
      setSetStep3(true);
      setError("");
      return;
    }

    // Verify password
    if (found.password !== password) { setError("Incorrect password. Please try again."); return; }

    // Success
    localStorage.setItem("attendify_role", "student");
    localStorage.setItem("attendify_student_session", JSON.stringify(found));
    window.location.href = "/student-dashboard";
  };

  // ─────────────────────────────────────────────────────────
  // SET NEW PASSWORD FLOW
  // ─────────────────────────────────────────────────────────
  const pwStrength = getStrength(newPw);

  const handleSetPassword = (e) => {
    e.preventDefault(); setError("");
    if (newPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }

    // Save password back to student record (admin can see it too)
    const updated = students.map(s => s.id === pendingStudent.id ? { ...s, password: newPw } : s);
    saveStudents(updated);

    const updatedStudent = { ...pendingStudent, password: newPw };
    localStorage.setItem("attendify_role", "student");
    localStorage.setItem("attendify_student_session", JSON.stringify(updatedStudent));
    window.location.href = "/student-dashboard";
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  const totalSteps = loginMode === "otp" ? 2 : (setStep3 ? 2 : 1);
  const currentStep = loginMode === "otp" ? step : (setStep3 ? 2 : 1);

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center px-4 py-6 sm:py-10 relative overflow-hidden selection:bg-emerald-500/30">
      {/* Clean static background */}
      <AnimatedBackground theme="emerald" />

      <div className="w-full max-w-md relative z-10">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-xs font-medium text-slate-200 hover:text-white mb-5 sm:mb-6 transition-all backdrop-blur-md shadow-lg">
          <ArrowLeft size={14} /> Back to Role Selection
        </button>

        <div className="bg-[#0C101A]/95 border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl relative">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl" />

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5 sm:mb-6">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Student Portal Login</h1>
              <p className="text-xs text-slate-400">
                {setStep3 ? "Create your secure password" : loginMode === "otp" ? (step === 1 ? "Enter your parent's email & division" : "Enter the OTP sent to your email") : "Login with your password"}
              </p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < currentStep ? "bg-emerald-500" : "bg-white/[0.08]"}`} />
            ))}
          </div>

          {/* ── LOGIN MODE TAB (only on step 1) ── */}
          {!setStep3 && ((loginMode === "otp" && step === 1) || loginMode === "password") && (
            <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl mb-5">
              {[
                { id: "otp", icon: Mail, label: "Email OTP" },
                { id: "password", icon: Lock, label: "Password" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setLoginMode(id); setError(""); setSuccess(""); setPassword(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    loginMode === id
                      ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* ── OTP STEP 1 ── */}
          {loginMode === "otp" && step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student Full Name *</label>
                <input type="text" className={inputCls} placeholder="e.g. Aakash Mehta" value={studentName} onChange={e => { setStudentName(e.target.value); setError(""); }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Roll Number *</label>
                  <input type="text" className={inputCls} placeholder="e.g. 01" value={rollNumber} onChange={e => { setRollNumber(e.target.value); setError(""); }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class & Division *</label>
                  <CustomSelect className={`${inputCls} cursor-pointer`} value={division} onChange={e => { setDivision(e.target.value); setError(""); }} placeholder="Select your class">
                    <option value="">Select your class</option>
                    {divisionOptions.map(d => <option key={d} value={d}>Class {d}</option>)}
                  </CustomSelect>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parent's Gmail *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <input type="email" className={`${inputCls} pl-10`} placeholder="parent@gmail.com" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} />
                </div>
              </div>
              {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400"><AlertCircle size={15} className="flex-shrink-0" /><p>{error}</p></div>}
              <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.35)] text-white font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.99] cursor-pointer mt-2">
                {loading ? "Sending Verification Code..." : "Send OTP to Parent's Gmail →"}
              </button>
            </form>
          )}

          {/* ── OTP STEP 2 ── */}
          {loginMode === "otp" && step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-5">
              {success && <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5"><CheckCircle size={15} className="text-emerald-400 flex-shrink-0" /><p className="text-xs text-emerald-300">{success}</p></div>}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-3 text-center">Enter 6-digit Verification Code</label>
                <div className="flex justify-center gap-1 sm:gap-2">
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-9 sm:w-11 h-11 sm:h-12 text-center text-base sm:text-lg font-bold bg-[#111726] border border-white/[0.12] text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/10 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  ))}
                </div>
              </div>
              <div className="text-center">
                {timeLeft > 0
                  ? <p className="text-xs text-slate-400">OTP expires in <span className="text-emerald-400 font-mono font-bold">{formatTime(timeLeft)}</span></p>
                  : <p className="text-xs text-red-400 font-semibold">OTP expired. Please request a new code.</p>}
              </div>
              {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400"><AlertCircle size={15} className="flex-shrink-0" /><p>{error}</p></div>}
              <button type="submit" disabled={loading || timeLeft === 0} className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.35)] text-white font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.99] cursor-pointer">
                {loading ? "Verifying OTP..." : "Verify OTP & Sign In →"}
              </button>
              <button type="button" onClick={handleResend} className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-emerald-400 transition-colors py-2 cursor-pointer">
                <RefreshCw size={13} /> Try different email / Resend OTP
              </button>
            </form>
          )}

          {/* ── PASSWORD LOGIN ── */}
          {loginMode === "password" && !setStep3 && (
            <form onSubmit={handlePasswordLogin} className="space-y-3.5 sm:space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student Full Name *</label>
                <input type="text" className={inputCls} placeholder="Enter your full name" value={studentName} onChange={e => { setStudentName(e.target.value); setError(""); }} autoComplete="off" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Roll Number *</label>
                  <input type="text" className={inputCls} placeholder="e.g. 01" value={rollNumber} onChange={e => { setRollNumber(e.target.value); setError(""); }} autoComplete="off" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class & Division *</label>
                  <CustomSelect className={`${inputCls} cursor-pointer`} value={division} onChange={e => { setDivision(e.target.value); setError(""); }} placeholder="Select your class">
                    <option value="">Select your class</option>
                    {divisionOptions.map(d => <option key={d} value={d}>Class {d}</option>)}
                  </CustomSelect>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <input type={showPw ? "text" : "password"} className={`${inputCls} pl-10 pr-10`} placeholder="Enter your password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400"><AlertCircle size={15} className="flex-shrink-0" /><p>{error}</p></div>}
              <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.35)] text-white font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.99] cursor-pointer mt-2">
                Sign In with Password →
              </button>
            </form>
          )}

          {/* ── SET NEW PASSWORD (first-time) ── */}
          {setStep3 && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-300">Create your personal password</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Welcome, <span className="text-white font-semibold">{pendingStudent?.name}</span>! Set a secure password for your account.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <input type={showNewPw ? "text" : "password"} className={`${inputCls} pl-10 pr-10`} placeholder="Min. 6 characters" value={newPw} onChange={e => { setNewPw(e.target.value); setError(""); }} />
                  <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPw && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= pwStrength.score ? pwStrength.color : "bg-white/10"}`} />
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <p className="text-[11px] text-slate-500">Use letters (A-Z), numbers (0-9) and symbols (!@#)</p>
                      <p className={`text-[11px] font-semibold ${pwStrength.score >= 4 ? "text-emerald-400" : pwStrength.score >= 3 ? "text-blue-400" : pwStrength.score >= 2 ? "text-amber-400" : "text-red-400"}`}>{pwStrength.label}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <input type={showConfirmPw ? "text" : "password"} className={`${inputCls} pl-10 pr-10`} placeholder="Re-enter password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setError(""); }} />
                  <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPw && newPw && (
                  <p className={`text-[11px] mt-1.5 font-medium ${confirmPw === newPw ? "text-emerald-400" : "text-red-400"}`}>
                    {confirmPw === newPw ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400"><AlertCircle size={15} className="flex-shrink-0" /><p>{error}</p></div>}

              <button type="submit" className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.35)] text-white font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer">
                Set Password & Sign In →
              </button>
              <button type="button" onClick={() => { setSetStep3(false); setNewPw(""); setConfirmPw(""); setError(""); }} className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 cursor-pointer">
                ← Back to login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5 sm:mt-6">
          {loginMode === "otp" && step === 1 && !setStep3 ? "The OTP is sent to the parent's registered Gmail address" :
           setStep3 ? "Your password will be saved securely. Admin can reset it if needed." :
           "Your account is managed by your school admin."}
        </p>
      </div>
    </div>
  );
}
