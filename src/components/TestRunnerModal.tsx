/**
 * MJ Studio - Arabic Automated Test Runner Modal
 * Executes test suite and displays genuine pass/fail reports
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { MJTestSuite, TestSuiteSummary } from '../lang/test_suite';
import { Language } from '../i18n/translations';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const executeTests = async () => {
    setRunning(true);
    try {
      const res = await MJTestSuite.runAll();
      setSummary(res);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !summary && !running) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = summary
    ? ['all', ...Array.from(new Set(summary.results.map((r) => r.category)))]
    : ['all'];

  const filteredResults = summary
    ? activeCategory === 'all'
      ? summary.results
      : summary.results.filter((r) => r.category === activeCategory)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[80vh] bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">حزمة الاختبارات المؤتمتة للغة إم جي (MJ)</h2>
              <p className="text-[11px] text-zinc-400">تحقق حقيقي وشامل من المحلل المعجمي والنحوي والدلالي والمفسر والآلة الافتراضية</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-md"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'جارٍ الفحص...' : 'إعادة تشغيل الاختبارات'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Summary Strip */}
        {summary && (
          <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/30 text-xs">
            <div className="p-3 border-l border-zinc-800 flex flex-col items-center">
              <span className="text-zinc-500 text-[10px]">إجمالي الاختبارات</span>
              <span className="text-base font-bold text-white">{summary.total}</span>
            </div>
            <div className="p-3 border-l border-zinc-800 flex flex-col items-center">
              <span className="text-zinc-500 text-[10px]">ناجح</span>
              <span className="text-base font-bold text-emerald-400">{summary.passed}</span>
            </div>
            <div className="p-3 border-l border-zinc-800 flex flex-col items-center">
              <span className="text-zinc-500 text-[10px]">فاشل</span>
              <span className={`text-base font-bold ${summary.failed > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {summary.failed}
              </span>
            </div>
            <div className="p-3 flex flex-col items-center">
              <span className="text-zinc-500 text-[10px]">زمن التنفيذ الكلي</span>
              <span className="text-base font-bold text-cyan-400">{summary.durationMs.toFixed(1)} مللي ثانية</span>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="px-6 py-2 border-b border-zinc-800 bg-zinc-950 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                activeCategory === cat
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat === 'all' ? 'الكل' : cat}
            </button>
          ))}
        </div>

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {running && !summary && (
            <div className="text-center py-12 text-zinc-500 text-xs">
              جارٍ تشغيل حزمة اختبارات لغة إم جي الحقيقية...
            </div>
          )}

          {filteredResults.map((tc) => (
            <div
              key={tc.id}
              className={`p-3 rounded-lg border text-xs flex items-start justify-between ${
                tc.passed
                  ? 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300'
                  : 'bg-rose-950/20 border-rose-900/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {tc.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-500 font-semibold">{tc.id}</span>
                    <span className="font-medium text-white">{tc.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400">
                      {tc.category}
                    </span>
                  </div>
                  {tc.errorMessage && (
                    <div className="text-rose-400 font-mono text-[11px] pt-1">
                      {tc.errorMessage}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">{tc.durationMs.toFixed(2)} ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
