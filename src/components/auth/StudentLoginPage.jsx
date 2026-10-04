import { useState } from "react";
import {
  GraduationCap,
  ArrowLeft,
  Mail,
  AlertCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { saveDoc, getUserLookup, saveUserLookup, broadcastLiveEvent } from "../../services/firestoreService";
import AnimatedBackground from "../ui/AnimatedBackground";
import PasswordRequirements, { validatePasswordRules } from "../ui/PasswordRequirements";

const inputCls =
  "w-full bg-[#111726]/90 border border-white/[0.1] text-white placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#111726_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]";

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const { studentLogin } = useAuth();
  const { students, updateStudent } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Set Password flow (first-time) ──
  const [setStep3, setSetStep3] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pendingStudent, setPendingStudent] = useState(null);

  // ── PASSWORD LOGIN: Email ID / Roll No & Password ──
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    const cleanInput = (email || "").trim().toLowerCase();
    if (!cleanInput || !password) {
      setError("Please enter your email or roll number, and your password.");
      return;
    }

    setLoading(true);
    const result = await studentLogin(cleanInput, password, students);
    setLoading(false);

    if (result.success) {
      const found = result.student;
      // If student has default 1234 or no password yet, offer to set a new one
      if (!found.password || found.password === "1234") {
        setPendingStudent(found);
        setSetStep3(true);
        setError("");
        return;
      }
      navigate("/student-dashboard");
    } else {
      setError(result.error || "No registered student found with this email/roll number, or incorrect password.");
    }
  };

  // ── SET NEW PASSWORD FLOW ──
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    const pwCheck = validatePasswordRules(newPw);
    if (!pwCheck.allSatisfied) {
      setError(`Password must satisfy all requirements: missing ${pwCheck.firstMissing?.label?.toLowerCase() || 'requirements'}.`);
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords do not match. Please verify your confirm password.");
      return;
    }

    setLoading(true);
    const targetStudent = pendingStudent || {};
    let targetId = targetStudent.id || targetStudent.entityId;
    let targetCollege = targetStudent.collegeId;

    if (!targetId || !targetCollege) {
      try {
        const lookup = await getUserLookup(email || targetStudent.rollNumber || targetStudent.email);
        if (lookup) {
          targetId = targetId || lookup.entityId || lookup.id;
          targetCollege = targetCollege || lookup.collegeId;
        }
      } catch (err) {
        console.warn("Lookup in handleSetPassword failed:", err);
      }
    }
    targetCollege = targetCollege || 'dps_main';

    const matched = (students || []).find(s => {
      const sId = s.id || s._docId;
      if (targetId && (sId === targetId || s._docId === targetId)) return true;
      if (targetStudent.rollNumber && s.rollNumber && String(s.rollNumber).trim().toLowerCase() === String(targetStudent.rollNumber).trim().toLowerCase()) return true;
      if (targetStudent.email && s.email && s.email.trim().toLowerCase() === targetStudent.email.trim().toLowerCase()) return true;
      if (email && s.email && s.email.trim().toLowerCase() === email.trim().toLowerCase()) return true;
      return false;
    });

    const docId = matched?.id || matched?._docId || targetId || targetStudent.rollNumber || targetStudent.email;

    const payload = {
      ...matched,
      ...targetStudent,
      id: docId,
      password: newPw,
      collegeId: targetCollege,
    };

    if (docId) {
      await updateStudent(docId, payload);
      await saveDoc('students', docId, payload, targetCollege);
      if (targetCollege !== 'dps_main') {
        await saveDoc('students', docId, payload, 'dps_main').catch(() => {});
      }
    }

    const lookupPayload = {
      role: 'student',
      collegeId: targetCollege,
      entityId: docId,
      id: docId,
      name: payload.name || targetStudent.name,
      rollNumber: payload.rollNumber || targetStudent.rollNumber,
      class: payload.class || targetStudent.class,
      section: payload.section || targetStudent.section,
      password: newPw,
    };
    if (payload.email) saveUserLookup(payload.email, lookupPayload).catch(console.warn);
    if (targetStudent.email && targetStudent.email !== payload.email) saveUserLookup(targetStudent.email, lookupPayload).catch(console.warn);
    if (payload.rollNumber) {
      const rawRoll = String(payload.rollNumber).trim();
      saveUserLookup(rawRoll, lookupPayload).catch(console.warn);
      const stripped = rawRoll.replace(/^0+/, '');
      if (stripped && stripped !== rawRoll) {
        saveUserLookup(stripped, lookupPayload).catch(console.warn);
      }
    }

    broadcastLiveEvent('STUDENT_PASSWORD_UPDATED', {
      studentId: docId,
      rollNumber: payload.rollNumber || targetStudent.rollNumber,
      email: payload.email || targetStudent.email,
      name: payload.name || targetStudent.name,
      password: newPw,
      collegeId: targetCollege,
      studentData: payload,
    });

    await studentLogin(targetStudent.rollNumber || targetStudent.email || email, newPw);
    setLoading(false);
    navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden selection:bg-emerald-500/30">
      <AnimatedBackground theme="emerald" />

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-xs font-medium text-slate-200 hover:text-white mb-5 transition-all backdrop-blur-md shadow-lg cursor-pointer"
        >
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
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Student Portal Login
              </h1>
              <p className="text-xs text-slate-400">
                {setStep3
                  ? "Create your personal password"
                  : "Sign in with your Email ID and Password"}
              </p>
            </div>
          </div>

          {/* ── Form: Login with Password ── */}
          {!setStep3 && (
            <form onSubmit={handlePasswordLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student / Parent Email Address or Roll Number *
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10"
                  />
                  <input
                    type="text"
                    className={`${inputCls} pl-10`}
                    placeholder="Enter email address or roll number"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="username"
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
                    type={showPw ? "text" : "password"}
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
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
                className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.35)] text-white font-semibold py-2.5 sm:py-3 text-sm rounded-xl transition-all disabled:opacity-60 active:scale-[0.99] cursor-pointer mt-2"
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

          {/* ── SET NEW PASSWORD (first-time) ── */}
          {setStep3 && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-300">
                    Create your personal password
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Welcome,{" "}
                    <span className="text-white font-semibold">
                      {pendingStudent?.name}
                    </span>
                    ! Set a secure password for your account.
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
                    type={showNewPw ? "text" : "password"}
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Create new password"
                    value={newPw}
                    onChange={(e) => {
                      setNewPw(e.target.value);
                      setError("");
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
                <PasswordRequirements password={newPw} />
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
                    type={showConfirmPw ? "text" : "password"}
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Re-enter password"
                    value={confirmPw}
                    onChange={(e) => {
                      setConfirmPw(e.target.value);
                      setError("");
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
                      confirmPw === newPw ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {confirmPw === newPw
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
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
                className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.35)] text-white font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                Set Password & Sign In →
              </button>
              <button
                type="button"
                onClick={() => {
                  setSetStep3(false);
                  setNewPw("");
                  setConfirmPw("");
                  setError("");
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 cursor-pointer"
              >
                ← Back to login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5 sm:mt-6">
          {setStep3
            ? "Your password will be saved securely. Admin can reset it if needed."
            : "Students are registered by the School/College Administrator."}
        </p>
      </div>
    </div>
  );
}
