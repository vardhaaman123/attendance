import { useMemo } from "react";
import { BookOpen, Award, TrendingUp, BarChart3, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { filterValidExams } from "../../utils/marksUtils";

function getGrade(pct) {
  if (pct >= 90) return { grade: "A+", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" };
  if (pct >= 80) return { grade: "A",  color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30" };
  if (pct >= 70) return { grade: "B+", color: "text-indigo-400",  bg: "bg-indigo-500/15 border-indigo-500/30" };
  if (pct >= 60) return { grade: "B",  color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30" };
  if (pct >= 50) return { grade: "C",  color: "text-orange-400",  bg: "bg-orange-500/15 border-orange-500/30" };
  if (pct >= 33) return { grade: "D",  color: "text-red-400",     bg: "bg-red-500/15 border-red-500/30" };
  return               { grade: "F",  color: "text-rose-500",     bg: "bg-rose-500/20 border-rose-500/40" };
}

export default function StudentMarks() {
  const { currentStudent } = useAuth();
  const { exams: contextExams } = useApp();

  const allExams = useMemo(() => {
    // Always read from AppContext (loaded from Firestore via real-time listener)
    return filterValidExams(Array.isArray(contextExams) ? contextExams : []);
  }, [contextExams]);

  const myExams = useMemo(() => {
    if (!currentStudent) return [];
    const studentKeys = [
      currentStudent.id,
      currentStudent.entityId,
      currentStudent._docId,
      currentStudent.rollNumber,
      currentStudent.rollNumber ? String(currentStudent.rollNumber).trim() : null,
      currentStudent.rollNumber ? String(currentStudent.rollNumber).trim().replace(/^0+/, '') : null,
    ].filter(Boolean);

    return allExams
      .map((e) => {
        let markVal;
        for (const k of studentKeys) {
          if (e.marks?.[k] !== undefined && e.marks?.[k] !== '') {
            markVal = e.marks[k];
            break;
          }
        }
        if (markVal === undefined) return null;
        return {
          ...e,
          myMark: Number(markVal),
          pct: Math.round((Number(markVal) / e.maxMarks) * 100),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allExams, currentStudent]);

  const displayed = myExams;


  // Overall stats
  const stats = useMemo(() => {
    if (!myExams.length) return null;
    const pcts = myExams.map(e => e.pct);
    const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    const highest = Math.max(...pcts);
    const lowest = Math.min(...pcts);
    const passed = myExams.filter(e => e.pct >= 33).length;
    return { avg, highest, lowest, passed, total: myExams.length };
  }, [myExams]);

  if (!currentStudent) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen size={22} className="text-blue-400" /> My Marks
          </h1>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
            <Award size={11} /> Official Academic Record
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {myExams.length} exam{myExams.length !== 1 ? "s" : ""} recorded for {currentStudent.name}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Average %", value: `${stats.avg}%`, icon: TrendingUp, cc: "text-blue-400", bc: "bg-blue-500/10 border-blue-500/20" },
            { label: "Highest %", value: `${stats.highest}%`, icon: Award, cc: "text-emerald-400", bc: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Exams Taken", value: stats.total, icon: BarChart3, cc: "text-violet-400", bc: "bg-violet-500/10 border-violet-500/20" },
            { label: "Exams Passed", value: `${stats.passed}/${stats.total}`, icon: Check, cc: "text-amber-400", bc: "bg-amber-500/10 border-amber-500/20" },
          ].map(({ label, value, icon: Icon, cc, bc }) => (
            <div key={label} className={`rounded-2xl border p-4 ${bc}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={cc} />
                <span className="text-[11px] text-slate-400 font-medium">{label}</span>
              </div>
              <p className={`text-xl font-bold ${cc}`}>{value}</p>
            </div>
          ))}
        </div>
      )}


      {/* Table */}

      <div className="rounded-2xl bg-[#0B0F19]/80 border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden">
        {displayed.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen size={26} />
            </div>
            <h3 className="text-base font-bold text-white">
              {myExams.length === 0 ? "No marks recorded yet" : "No exams match the filters"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs">
              {myExams.length === 0 ? "Your teacher has not entered marks for you yet. Check back later." : "Try adjusting the filters above."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#111726]/80 border-b border-white/10">
                    <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Exam</th>
                    <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3 hidden sm:table-cell">Subject</th>
                    <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3 hidden md:table-cell">Date</th>
                    <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3">Marks</th>
                    <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3">%</th>
                    <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3">Status</th>
                    <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((exam, idx) => {
                    const { grade, color, bg } = getGrade(exam.pct);
                    const passed = exam.pct >= 33;
                    return (
                      <tr key={exam.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <BookOpen size={14} className="text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white leading-tight">{exam.name}</p>
                              <p className="text-[10px] text-slate-500">{exam.examType} &bull; Max {exam.maxMarks}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="text-xs text-slate-300">{exam.subject}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <div>
                            <span className="text-xs text-slate-400">
                              {exam.date ? new Date(exam.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-white">{exam.myMark}</span>
                          <span className="text-xs text-slate-500">/{exam.maxMarks}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-white">{exam.pct}%</span>
                            <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${exam.pct}%`, background: exam.pct >= 75 ? "#10B981" : exam.pct >= 50 ? "#F59E0B" : "#EF4444" }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {passed
                            ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><Check size={10} /> Pass</span>
                            : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> Fail</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${bg} ${color}`}>{grade}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (visible on < sm) */}
            <div className="sm:hidden divide-y divide-white/[0.06]">
              {displayed.map((exam) => {
                const { grade, color, bg } = getGrade(exam.pct);
                const passed = exam.pct >= 33;
                return (
                  <div key={exam.id} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white leading-tight break-words">{exam.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-[11px] text-slate-400">{exam.subject} • {exam.examType}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 ${bg} ${color}`}>{grade}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">Score: <strong className="text-white">{exam.myMark}</strong>/{exam.maxMarks} ({exam.pct}%)</span>
                      {passed
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><Check size={10} /> Pass</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> Fail</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-white/10 bg-[#111726]/80">
              <p className="text-xs text-slate-500">Showing {displayed.length} of {myExams.length} exam{myExams.length !== 1 ? "s" : ""}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
