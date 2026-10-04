import { useState, useMemo, useEffect } from "react";
import {
  BookOpen, Plus, Edit2, Trash2, Save,
  Search, Users, GraduationCap, Award, TrendingUp,
  BarChart3, Check, AlertCircle
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";

const SUBJECTS = ["Mathematics","Science","English","Hindi","Social Studies","Computer Science","Sanskrit","Physical Education"];
const EXAM_TYPES = ["Unit Test 1","Unit Test 2","Mid-term","Final Exam","Class Test","Assignment"];

function getGrade(pct) {
  if (pct >= 90) return { grade: "A+", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" };
  if (pct >= 80) return { grade: "A",  color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30" };
  if (pct >= 70) return { grade: "B+", color: "text-indigo-400",  bg: "bg-indigo-500/15 border-indigo-500/30" };
  if (pct >= 60) return { grade: "B",  color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30" };
  if (pct >= 50) return { grade: "C",  color: "text-orange-400",  bg: "bg-orange-500/15 border-orange-500/30" };
  if (pct >= 33) return { grade: "D",  color: "text-red-400",     bg: "bg-red-500/15 border-red-500/30" };
  return               { grade: "F",  color: "text-rose-500",     bg: "bg-rose-500/20 border-rose-500/40" };
}

function ExamModal({ open, exam, students, onSave, onClose }) {
  const [form, setForm] = useState({ name: "", subject: SUBJECTS[0], examType: EXAM_TYPES[0], maxMarks: 100, classFilter: "all", sectionFilter: "all", date: new Date().toISOString().split("T")[0], marks: {} });
  const [studentSearch, setStudentSearch] = useState("");
  const [nameError, setNameError] = useState("");
  const availableClasses = useMemo(() => Array.from(new Set(students.map(s => String(s.class || '').trim()))).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [students]);
  const availableSections = useMemo(() => Array.from(new Set(students.filter(s => form.classFilter === "all" || String(s.class || '').trim() === String(form.classFilter || '').trim()).map(s => String(s.section || '').trim().toUpperCase()))).filter(Boolean).sort(), [students, form.classFilter]);
  const filteredStudents = useMemo(() => students.filter(s => (form.classFilter === "all" || String(s.class || '').trim() === String(form.classFilter || '').trim()) && (form.sectionFilter === "all" || String(s.section || '').trim().toUpperCase() === String(form.sectionFilter || '').trim().toUpperCase())).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))), [students, form.classFilter, form.sectionFilter]);
  const displayedStudents = useMemo(() => {
    if (!studentSearch.trim()) return filteredStudents;
    const q = studentSearch.trim().toLowerCase();
    return filteredStudents.filter(s => String(s.name || '').toLowerCase().includes(q) || String(s.rollNumber || '').includes(q));
  }, [filteredStudents, studentSearch]);

  useEffect(() => {
    if (!open) return;
    setStudentSearch("");
    setNameError("");
    if (exam) { setForm({ ...exam }); }
    else { const fc = availableClasses[0] || "all"; setForm({ name: "", subject: SUBJECTS[0], examType: EXAM_TYPES[0], maxMarks: 100, classFilter: fc, sectionFilter: "all", date: new Date().toISOString().split("T")[0], marks: {} }); }
  }, [open, exam]);

  const setMark = (id, val) => { const num = val === "" ? "" : Math.min(Number(val), form.maxMarks); setForm(f => ({ ...f, marks: { ...f.marks, [id]: num } })); };
  const fillAll = (val) => { const m = {}; filteredStudents.forEach(s => { m[s.id] = val === "" ? "" : Math.min(Number(val), form.maxMarks); }); setForm(f => ({ ...f, marks: { ...f.marks, ...m } })); };
  const enteredCount = filteredStudents.filter(s => form.marks[s.id] !== "" && form.marks[s.id] !== undefined).length;

  return (
    <Modal open={open} onClose={onClose} title={exam ? "Edit Exam Marks" : "Add New Exam"} maxWidth="max-w-xl">
      <div className="space-y-4 p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (nameError) setNameError(""); }}
              placeholder="e.g. Mid-term Mathematics"
              className={`input-field ${nameError ? "border-red-400" : ""}`}
            />
            {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
          </div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Type</label><select value={form.examType} onChange={e => setForm(f => ({ ...f, examType: e.target.value }))} className="input-field">{EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label><select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Marks</label><input type="number" min={1} max={500} value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: Number(e.target.value) || 100 }))} className="input-field" /></div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class</label><select value={form.classFilter} onChange={e => setForm(f => ({ ...f, classFilter: e.target.value, sectionFilter: "all" }))} className="input-field"><option value="all">All Classes</option>{availableClasses.map(c => <option key={c} value={c}>Class {c}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section</label><select value={form.sectionFilter} onChange={e => setForm(f => ({ ...f, sectionFilter: e.target.value }))} className="input-field"><option value="all">All Sections</option>{availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}</select></div>
          </div>
        </div>
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-[#111726]/80 border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">Enter Marks ({enteredCount}/{filteredStudents.length} entered)</span>
              <div className="flex items-center gap-1.5"><span className="text-[11px] text-slate-400">Fill:</span><button type="button" onClick={() => fillAll(form.maxMarks)} className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 cursor-pointer transition-colors">Max</button><button type="button" onClick={() => fillAll("")} className="text-[11px] px-2 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/10 hover:bg-white/[0.12] cursor-pointer transition-colors">Clear</button></div>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search student by name or roll number..."
                className="w-full bg-[#0B0F19] border border-white/[0.08] text-xs text-white placeholder-slate-500 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
          </div>
          {filteredStudents.length === 0 ? <div className="py-8 text-center text-slate-500 text-sm">No students match the selected filters.</div> : displayedStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No student found for "<span className="text-slate-300">{studentSearch}</span>".</div>
          ) : (
            <div className="max-h-60 overflow-y-auto custom-scrollbar"><table className="w-full text-sm"><thead className="sticky top-0 bg-[#0E1422]"><tr><th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-400">Student</th><th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-400">Class</th><th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-400">Marks / {form.maxMarks}</th></tr></thead><tbody>{displayedStudents.map((s, i) => { const val = form.marks[s.id]; const pct = val !== "" && val !== undefined ? Math.round((Number(val) / form.maxMarks) * 100) : null; const gi = pct !== null ? getGrade(pct) : null; return (<tr key={s.id} className={`border-t border-white/[0.05] ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}><td className="px-3 py-2"><p className="text-xs font-semibold text-slate-200">{s.name}</p><p className="text-[10px] text-slate-500">Roll #{s.rollNumber}</p></td><td className="px-3 py-2 text-center"><span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">{s.class}-{s.section}</span></td><td className="px-3 py-2"><div className="flex items-center justify-center gap-2"><input type="number" min={0} max={form.maxMarks} value={val !== undefined ? val : ""} onChange={e => setMark(s.id, e.target.value)} placeholder="-" className="w-16 text-center bg-[#111726] border border-white/[0.08] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />{gi && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gi.bg} ${gi.color}`}>{gi.grade}</span>}</div></td></tr>); })}</tbody></table></div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 sm:justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto min-h-[40px]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!form.name.trim()) {
                setNameError("Exam name is required");
                return;
              }
              onSave({ ...form, name: form.name.trim() });
            }}
            className="btn-primary w-full sm:w-auto min-h-[40px] cursor-pointer"
          >
            <Save size={15} /> {exam ? "Update Exam" : "Save Exam"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Marks() {
  const { students, addToast, exams = [], saveExams, deleteExam, clearAllExams, refreshStudents } = useApp();
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "teacher";
  const [examModal, setExamModal] = useState({ open: false, exam: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterExamType, setFilterExamType] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [viewExam, setViewExam] = useState(null);
  const [viewSearch, setViewSearch] = useState("");

  // Auto-fetch students if empty on mount without requiring page reload
  useEffect(() => {
    if (students.length === 0 && refreshStudents) {
      refreshStudents();
    }
  }, [students.length, refreshStudents]);

  const availableClasses = useMemo(() => Array.from(new Set(students.map(s => String(s.class || '').trim()))).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [students]);
  const filteredExams = useMemo(() => exams.filter(e => { const ms = !search || String(e.name || '').toLowerCase().includes(search.toLowerCase()) || String(e.subject || '').toLowerCase().includes(search.toLowerCase()); const msu = filterSubject === "all" || e.subject === filterSubject; const mt = filterExamType === "all" || e.examType === filterExamType; const mc = filterClass === "all" || e.classFilter === filterClass || e.classFilter === "all"; return ms && msu && mt && mc; }).sort((a, b) => new Date(b.date) - new Date(a.date)), [exams, search, filterSubject, filterExamType, filterClass]);
  const handleSaveExam = async (form) => {
    try {
      if (examModal.exam) {
        const u = exams.map(e => e.id === examModal.exam.id ? { ...e, ...form } : e);
        await saveExams(u);
        if (viewExam?.id === examModal.exam.id) setViewExam({ ...examModal.exam, ...form });
        addToast("Exam marks updated.", "success");
      } else {
        const ne = { ...form, id: `EXAM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, createdAt: new Date().toISOString() };
        await saveExams([ne, ...exams]);
        addToast("Exam added.", "success");
      }
    } catch (err) {
      console.error('Failed to save exam:', err);
      addToast('Failed to save exam. Please try again.', 'error');
    }
    setExamModal({ open: false, exam: null });
  };
  const handleDelete = async (exam) => {
    try {
      if (deleteExam) {
        await deleteExam(exam.id || exam._docId);
      } else {
        await saveExams(exams.filter(e => e.id !== exam.id));
      }
      addToast(`"${exam.name}" deleted.`, "info");
    } catch (err) {
      console.error('Failed to delete exam:', err);
      addToast('Failed to delete exam.', 'error');
    }
    setDeleteTarget(null);
    if (viewExam?.id === exam.id) setViewExam(null);
  };
  const handleClearAll = async () => {
    try {
      if (clearAllExams) {
        await clearAllExams();
      } else {
        await saveExams([]);
      }
      addToast("All exam records deleted successfully.", "info");
    } catch (err) {
      console.error('Failed to clear exams:', err);
      addToast('Failed to delete all exams.', 'error');
    }
    setClearAllOpen(false);
    if (viewExam) setViewExam(null);
  };
  const examStats = (exam) => { const arr = Object.values(exam.marks || {}).filter(m => m !== "" && m !== undefined && !isNaN(m)).map(Number); if (!arr.length) return { avg: 0, highest: 0, lowest: 0, passRate: 0, appeared: 0 }; const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length); const thr = exam.maxMarks * 0.33; return { avg, highest: Math.max(...arr), lowest: Math.min(...arr), passRate: Math.round((arr.filter(m => m >= thr).length / arr.length) * 100), appeared: arr.length }; };
  const viewStudents = useMemo(() => !viewExam ? [] : students.filter(s => { const hm = viewExam.marks?.[s.id] !== undefined && viewExam.marks?.[s.id] !== ""; const mc = viewExam.classFilter === "all" || String(s.class || '').trim() === String(viewExam.classFilter || '').trim(); const ms = viewExam.sectionFilter === "all" || String(s.section || '').trim().toUpperCase() === String(viewExam.sectionFilter || '').trim().toUpperCase(); const mq = !viewSearch || String(s.name || '').toLowerCase().includes(viewSearch.toLowerCase()) || String(s.rollNumber).includes(viewSearch); return hm && mc && ms && mq; }).sort((a, b) => Number(viewExam.marks[b.id] ?? -1) - Number(viewExam.marks[a.id] ?? -1)), [viewExam, students, viewSearch]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={22} className="text-blue-400 shrink-0" /> Marks
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exams.length} exam{exams.length !== 1 ? "s" : ""} recorded</p>
        </div>
        {canEdit && !viewExam && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {exams.length > 0 && (
              <button
                type="button"
                onClick={() => setClearAllOpen(true)}
                className="btn-secondary text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20 min-h-[40px] justify-center flex-1 sm:flex-initial cursor-pointer"
                title="Delete all exams"
              >
                <Trash2 size={15} />
                <span>Delete All</span>
              </button>
            )}
            <button onClick={() => setExamModal({ open: true, exam: null })} className="btn-primary w-full sm:w-auto min-h-[40px] justify-center flex-1 sm:flex-initial">
              <Plus size={15} /> Add Exam
            </button>
          </div>
        )}
      </div>
      {!viewExam && (
        <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-3.5 sm:p-4 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.3)] relative z-30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
            <div className="relative w-full sm:col-span-2 lg:col-span-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exam name or subject..." className="input-field pl-10 w-full" />
            </div>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="input-field w-full"><option value="all">All Classes</option>{availableClasses.map(c => <option key={c} value={c}>Class {c}</option>)}</select>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="input-field w-full"><option value="all">All Subjects</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select value={filterExamType} onChange={e => setFilterExamType(e.target.value)} className="input-field w-full"><option value="all">All Exam Types</option>{EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
            {canEdit && (
              <button
                type="button"
                onClick={() => setClearAllOpen(true)}
                disabled={exams.length === 0}
                className="btn-secondary text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[42px] justify-center w-full"
                title="Delete all recorded exams"
              >
                <Trash2 size={15} />
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>
      )}
      {viewExam ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button onClick={() => { setViewExam(null); setViewSearch(""); }} className="btn-secondary text-blue-400 border-blue-500/20 self-start min-h-[38px]">&#8592; Back to Exams</button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white break-words">{viewExam.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 break-words mt-0.5">{viewExam.examType} &bull; {viewExam.subject} &bull; {viewExam.date ? new Date(viewExam.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""} &bull; Class {viewExam.classFilter === "all" ? "All" : viewExam.classFilter}{viewExam.sectionFilter !== "all" ? `-${viewExam.sectionFilter}` : ""}</p>
            </div>
            {canEdit && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button onClick={() => setExamModal({ open: true, exam: viewExam })} className="btn-secondary flex-1 sm:flex-initial min-h-[38px] justify-center"><Edit2 size={14} /> Edit Marks</button>
                <button onClick={() => setDeleteTarget(viewExam)} className="btn-secondary text-rose-400 border-rose-500/20 flex-1 sm:flex-initial min-h-[38px] justify-center"><Trash2 size={14} /> Delete</button>
              </div>
            )}
          </div>
          {(() => { const s = examStats(viewExam); const ap = s.appeared > 0 ? Math.round((s.avg / viewExam.maxMarks) * 100) : 0; const hp = s.appeared > 0 ? Math.round((s.highest / viewExam.maxMarks) * 100) : 0; return (<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[{ label: "Class Average", value: `${s.avg}/${viewExam.maxMarks}`, sub: `${ap}%`, icon: TrendingUp, cc: "text-blue-400", bc: "bg-blue-500/10 border-blue-500/20" },{ label: "Highest Score", value: `${s.highest}/${viewExam.maxMarks}`, sub: `${hp}%`, icon: Award, cc: "text-emerald-400", bc: "bg-emerald-500/10 border-emerald-500/20" },{ label: "Students Appeared", value: s.appeared, sub: "students", icon: Users, cc: "text-violet-400", bc: "bg-violet-500/10 border-violet-500/20" },{ label: "Pass Rate", value: `${s.passRate}%`, sub: "33% to pass", icon: BarChart3, cc: "text-amber-400", bc: "bg-amber-500/10 border-amber-500/20" }].map(({ label, value, sub, icon: Icon, cc, bc }) => (<div key={label} className={`rounded-2xl border p-4 ${bc}`}><div className="flex items-center gap-2 mb-1"><Icon size={14} className={cc} /><span className="text-[11px] text-slate-400 font-medium">{label}</span></div><p className={`text-xl font-bold ${cc}`}>{value}</p><p className="text-[10px] text-slate-500">{sub}</p></div>))}</div>); })()}
          <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Student Results</h3>
              <div className="relative w-full sm:w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input type="text" value={viewSearch} onChange={e => setViewSearch(e.target.value)} placeholder="Search student..." className="w-full bg-[#111726] border border-white/[0.08] text-xs text-white placeholder-slate-500 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#111726]/80 border-b border-slate-100 dark:border-white/10">
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Rank</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Student</th>
                    <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Class</th>
                    <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Marks</th>
                    <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">%</th>
                    <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Status</th>
                    <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {viewStudents.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">No students found.</td></tr>
                  ) : (
                    viewStudents.map((s, idx) => {
                      const mark = Number(viewExam.marks[s.id]);
                      const pct = Math.round((mark / viewExam.maxMarks) * 100);
                      const { grade, color, bg } = getGrade(pct);
                      const passed = pct >= 33;
                      return (
                        <tr key={s.id} className="border-b border-slate-100 dark:border-white/[0.06] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center ${idx === 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : idx === 1 ? "bg-slate-400/20 text-slate-300 border border-slate-400/30" : idx === 2 ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-white/[0.04] text-slate-400 border border-white/[0.06]"}`}>{idx + 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{ background: `hsl(${(String(s.rollNumber).charCodeAt(0) * 47) % 360}, 60%, 55%)` }}>{s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
                                <p className="text-[10px] text-slate-400">Roll #{s.rollNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center"><span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">{s.class}-{s.section}</span></td>
                          <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-slate-900 dark:text-white">{mark}</span><span className="text-xs text-slate-500">/{viewExam.maxMarks}</span></td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">{pct}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444" }} /></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{passed ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><Check size={10} /> Pass</span> : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> Fail</span>}</td>
                          <td className="px-4 py-3 text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded border ${bg} ${color}`}>{grade}</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
              {viewStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No students found.</div>
              ) : (
                viewStudents.map((s, idx) => {
                  const mark = Number(viewExam.marks[s.id]);
                  const pct = Math.round((mark / viewExam.maxMarks) * 100);
                  const { grade, color, bg } = getGrade(pct);
                  const passed = pct >= 33;
                  return (
                    <div key={s.id} className="p-3.5 space-y-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            idx === 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            idx === 1 ? "bg-slate-400/20 text-slate-300 border border-slate-400/30" :
                            idx === 2 ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" :
                            "bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{ background: `hsl(${(String(s.rollNumber).charCodeAt(0) * 47) % 360}, 60%, 55%)` }}>
                            {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-400">Roll #{s.rollNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${bg} ${color}`}>{grade}</span>
                          {passed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <Check size={10} /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                              <AlertCircle size={10} /> Fail
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                          Class {s.class}-{s.section}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{mark}</span>
                            <span className="text-slate-500">/{viewExam.maxMarks}</span>
                            <span className="ml-1.5 text-[11px] text-slate-400 font-semibold">({pct}%)</span>
                          </div>
                          <div className="w-14 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#111726]/80"><p className="text-xs text-slate-500 dark:text-slate-400">Showing {viewStudents.length} students &bull; Max Marks: {viewExam.maxMarks}</p></div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden relative z-10">
          {filteredExams.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center px-4"><div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400"><BookOpen size={26} /></div><h3 className="text-base font-bold text-slate-900 dark:text-white">{exams.length === 0 ? "No exams recorded yet" : "No exams match the filters"}</h3><p className="text-xs text-slate-500 max-w-xs">{canEdit && exams.length === 0 ? "Click Add Exam to record the first set of exam marks." : "Try adjusting the filters."}</p>{canEdit && exams.length === 0 && <button onClick={() => setExamModal({ open: true, exam: null })} className="btn-primary mt-2"><Plus size={15} /> Add First Exam</button>}</div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#111726]/80 border-b border-slate-100 dark:border-white/10">
                      <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Exam</th>
                      <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Subject</th>
                      <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden md:table-cell">Class</th>
                      <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden lg:table-cell">Date</th>
                      <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Students</th>
                      <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden md:table-cell">Avg %</th>
                      <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map(exam => {
                      const s = examStats(exam);
                      const ap = s.appeared > 0 ? Math.round((s.avg / exam.maxMarks) * 100) : null;
                      const gi = ap !== null ? getGrade(ap) : null;
                      return (
                        <tr key={exam.id} onClick={() => setViewExam(exam)} className="border-b border-slate-100 dark:border-white/[0.06] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0"><BookOpen size={16} className="text-blue-400" /></div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{exam.name}</p>
                                <p className="text-[10px] text-slate-400">{exam.examType} &bull; Max {exam.maxMarks}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center"><span className="text-xs text-slate-600 dark:text-slate-300">{exam.subject}</span></td>
                          <td className="px-4 py-3 text-center hidden md:table-cell"><span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{exam.classFilter === "all" ? "All" : `Class ${exam.classFilter}`}{exam.sectionFilter !== "all" ? `-${exam.sectionFilter}` : ""}</span></td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            <div>
                              <span className="text-xs text-slate-600 dark:text-slate-300">
                                {exam.date ? new Date(exam.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><Users size={12} className="text-slate-400" /><span className="text-xs font-semibold text-slate-900 dark:text-white">{s.appeared}</span></div></td>
                          <td className="px-4 py-3 text-center hidden md:table-cell">{gi ? <span className={`text-xs font-bold px-2 py-0.5 rounded border ${gi.bg} ${gi.color}`}>{ap}%</span> : <span className="text-xs text-slate-400">-</span>}</td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setViewExam(exam)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-blue-400 transition-colors cursor-pointer" title="View Results"><GraduationCap size={15} /></button>
                              {canEdit && (
                                <>
                                  <button onClick={() => setExamModal({ open: true, exam })} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer" title="Edit Marks"><Edit2 size={15} /></button>
                                  <button onClick={() => setDeleteTarget(exam)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Delete Exam"><Trash2 size={15} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
                {filteredExams.map(exam => {
                  const s = examStats(exam);
                  const ap = s.appeared > 0 ? Math.round((s.avg / exam.maxMarks) * 100) : null;
                  const gi = ap !== null ? getGrade(ap) : null;
                  return (
                    <div
                      key={exam.id}
                      onClick={() => setViewExam(exam)}
                      className="p-3.5 space-y-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={16} className="text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{exam.name}</p>
                            <p className="text-[10px] text-slate-400">{exam.examType} &bull; Max {exam.maxMarks} marks</p>
                          </div>
                        </div>
                        {gi && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 ${gi.bg} ${gi.color}`}>
                            {ap}% avg
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] px-2 py-0.5 rounded text-[10px]">
                          {exam.subject}
                        </span>
                        <span className="font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[10px]">
                          {exam.classFilter === "all" ? "All Classes" : `Class ${exam.classFilter}`}{exam.sectionFilter !== "all" ? `-${exam.sectionFilter}` : ""}
                        </span>
                        {exam.date && (
                          <span className="text-slate-500 text-[10px]">
                            {new Date(exam.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.04]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Users size={13} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{s.appeared}</span>
                          <span>students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewExam(exam)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold hover:bg-blue-500/20 transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                            title="View Results"
                          >
                            <GraduationCap size={14} />
                            <span>Results</span>
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => setExamModal({ open: true, exam })}
                                className="p-2 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Edit Marks"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(exam)}
                                className="p-2 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Delete Exam"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#111726]/80"><p className="text-xs text-slate-500 dark:text-slate-400">Showing {filteredExams.length} of {exams.length} exam{exams.length !== 1 ? "s" : ""}</p></div>
            </>
          )}
        </div>
      )}
      <ExamModal open={examModal.open} exam={examModal.exam} students={students} onSave={handleSaveExam} onClose={() => setExamModal({ open: false, exam: null })} />
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Exam"><div className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{deleteTarget?.name}"</span>? All marks data will be permanently removed.</p><div className="flex gap-3 justify-end"><button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button><button onClick={() => handleDelete(deleteTarget)} className="btn-danger">Delete Exam</button></div></div></Modal>
      <Modal open={clearAllOpen} onClose={() => setClearAllOpen(false)} title="Delete All Exams">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <span className="font-bold text-rose-500">all {exams.length} exam records</span>?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This will permanently remove all exams and recorded marks across all classes and subjects for both Admin and Teacher portals. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setClearAllOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleClearAll} className="btn-danger flex items-center gap-1.5">
              <Trash2 size={14} /> Delete All Exams
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
