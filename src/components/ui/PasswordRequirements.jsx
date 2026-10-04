import React from 'react';
import { Check, ShieldCheck, ShieldAlert } from 'lucide-react';

export const PASSWORD_CRITERIA = [
  { id: 'min8', label: 'At least 8 characters', test: (pw) => (pw || '').length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw || '') },
  { id: 'lower', label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw || '') },
  { id: 'number', label: 'One number (0-9)', test: (pw) => /[0-9]/.test(pw || '') },
  { id: 'special', label: 'One special character (@, #, $, !, %, *, ?, &)', test: (pw) => /[@#$!%*?&]/.test(pw || '') || /[^A-Za-z0-9\s]/.test(pw || '') },
];

export function validatePasswordRules(pw = '') {
  const results = PASSWORD_CRITERIA.map((c) => ({
    ...c,
    satisfied: c.test(pw),
  }));
  const allSatisfied = results.every((r) => r.satisfied);
  return {
    allSatisfied,
    results,
    firstMissing: results.find((r) => !r.satisfied),
  };
}

export default function PasswordRequirements({ password = '', className = '', showHeader = false, alwaysShow = false }) {
  const { results, allSatisfied } = validatePasswordRules(password);
  if (!password && !alwaysShow) return null;

  return (
    <div className={`mt-2 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60 dark:border-white/10">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            Password Conditions:
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
              allSatisfied
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}
          >
            {allSatisfied ? (
              <>
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>Conditions Passed</span>
              </>
            ) : (
              <>
                <ShieldAlert size={11} className="text-amber-500" />
                <span>Requirements Missing</span>
              </>
            )}
          </span>
        </div>
      )}
      <ul className="space-y-1.5">
        {results.map((r) => (
          <li
            key={r.id}
            className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${
              r.satisfied
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                r.satisfied
                  ? 'bg-emerald-500 text-white shadow-xs scale-105'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-400'
              }`}
            >
              {r.satisfied ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
              )}
            </span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}