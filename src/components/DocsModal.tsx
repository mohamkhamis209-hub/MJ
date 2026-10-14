/**
 * MJ Studio - Arabic Language Documentation Hub
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import React, { useState } from 'react';
import { X, Book, Code, Terminal, Cpu, Award, Copy, Check } from 'lucide-react';
import { MJ_FORMAL_SPECIFICATION } from '../lang/spec';
import { Language } from '../i18n/translations';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'overview' | 'ebnf' | 'syntax' | 'stdlib' | 'roadmap'>('overview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEbnf = () => {
    navigator.clipboard.writeText(MJ_FORMAL_SPECIFICATION.ebnfGrammar);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
              MJ
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">توثيق ومواصفات لغة إم جي (MJ)</h2>
              <p className="text-[11px] text-zinc-400">ابتكار: محمد خميس — "فكر بما وراء الصيغة البرمجية."</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="h-10 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setTab('overview')}
            className={`h-full border-b-2 flex items-center gap-1.5 transition ${
              tab === 'overview'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>نظرة عامة</span>
          </button>
          <button
            onClick={() => setTab('ebnf')}
            className={`h-full border-b-2 flex items-center gap-1.5 transition ${
              tab === 'ebnf'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>قواعد EBNF الرسمية</span>
          </button>
          <button
            onClick={() => setTab('syntax')}
            className={`h-full border-b-2 flex items-center gap-1.5 transition ${
              tab === 'syntax'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Book className="w-3.5 h-3.5" />
            <span>الصيغة والأنواع</span>
          </button>
          <button
            onClick={() => setTab('stdlib')}
            className={`h-full border-b-2 flex items-center gap-1.5 transition ${
              tab === 'stdlib'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>المكتبة القياسية</span>
          </button>
          <button
            onClick={() => setTab('roadmap')}
            className={`h-full border-b-2 flex items-center gap-1.5 transition ${
              tab === 'roadmap'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>خارطة طريق المترجم</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-zinc-300 space-y-4">
          {tab === 'overview' && (
            <div className="space-y-4 leading-relaxed">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-900/40">
                <h3 className="text-base font-bold text-white mb-1">حول لغة إم جي البرمجية (MJ)</h3>
                <p className="text-xs text-zinc-400 mb-3">
                  الاسم الرسمي: <strong className="text-emerald-300">لغة إم جي البرمجية</strong> | الشعار:{' '}
                  <strong className="text-cyan-300">"فكر بما وراء الصيغة البرمجية."</strong> | المبتكر والمصمم:{' '}
                  <strong className="text-white">محمد خميس</strong>
                </p>
                <p className="text-xs text-zinc-300">
                  إم جي هي لغة برمجة عربية عامة الأغراض، مستقلة القواعد والتنفيذ. تحتوي على معجم عربي كامل، ونظام أنواع
                  متزن، وتحليل دلالي دقيق للنطاقات، ومحركي تنفيذ حقيقيين: مفسر شجرة البناء والآلة الافتراضية للبايت كود (MJ-VM).
                </p>
              </div>

              <h4 className="font-semibold text-white text-sm">أبرز الركائز المعمارية</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <li className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
                  <strong className="text-emerald-400 block mb-1">1. التمييز الصارم بين المتغير والثابت</strong>
                  <code className="text-zinc-400">ثابت س = 10</code> يمنع التعديل نهائياً، بينما <code className="text-zinc-400">متغير ص = 20</code> يتيح إعادة التعيين.
                </li>
                <li className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
                  <strong className="text-cyan-400 block mb-1">2. دوال ومغلقات من الدرجة الأولى</strong>
                  تُعرف بالصيغة <code className="text-zinc-400">دالة اسم(معاملات):</code> مع دعم الإرجاع والاستدعاء الذاتي.
                </li>
                <li className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
                  <strong className="text-purple-400 block mb-1">3. بنى التحكم العربية الأصلية</strong>
                  <code className="text-zinc-400">إذا / وإلا</code>، <code className="text-zinc-400">طالما</code>، <code className="text-zinc-400">لكل في</code>، و حلقة إم جي المميزة <code className="text-zinc-400">كرر (عدد)</code>.
                </li>
                <li className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
                  <strong className="text-amber-400 block mb-1">4. محرك تنفيذ ثنائي متطابق</strong>
                  إمكانية التنفيذ عبر مفسر شجرة البناء أو الآلة الافتراضية MJ-VM مع فك شفرة البايت كود فورياً.
                </li>
              </ul>
            </div>
          )}

          {tab === 'ebnf' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">الصياغة الرسمية الكاملة للغة إم جي بنظام EBNF القياسي.</p>
                <button
                  onClick={handleCopyEbnf}
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ القواعد'}</span>
                </button>
              </div>
              <pre dir="ltr" className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre text-left">
                {MJ_FORMAL_SPECIFICATION.ebnfGrammar.trim()}
              </pre>
            </div>
          )}

          {tab === 'syntax' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm font-sans">تعريف المتغيرات والثوابت</h4>
                <pre dir="ltr" className="p-3 bg-zinc-900/80 rounded border border-zinc-800 text-zinc-300 text-left">
{`متغير العداد = 0          // متغير قابل للتعديل
ثابت الاسم: نص = "محمد"   // ثابت غير قابل للتعديل مع تحديد النوع`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm font-sans">الدوال (دالة)</h4>
                <pre dir="ltr" className="p-3 bg-zinc-900/80 rounded border border-zinc-800 text-zinc-300 text-left">
{`دالة مربع(س):
    أرجع س * س

اطبع(مربع(10)) // 100`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm font-sans">الشروط والتكرار</h4>
                <pre dir="ltr" className="p-3 bg-zinc-900/80 rounded border border-zinc-800 text-zinc-300 text-left">
{`إذا س > 5:
    اطبع("كبير")
وإلا:
    اطبع("صغير")

كرر (3):
    اطبع("تكرار")`}
                </pre>
              </div>
            </div>
          )}

          {tab === 'stdlib' && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-white text-sm">وحدات المكتبة القياسية</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-1">
                  <h5 className="font-semibold text-emerald-400">الطباعة والإدخال</h5>
                  <ul className="text-zinc-400 space-y-0.5 font-mono">
                    <li>اطبع(...قيم)</li>
                    <li>اقرأ(نص_الطلب)</li>
                    <li>نوع(قيمة)</li>
                    <li>تأكد(شرط، رسالة)</li>
                  </ul>
                </div>

                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-1">
                  <h5 className="font-semibold text-cyan-400">وحدة الرياضيات</h5>
                  <ul className="text-zinc-400 space-y-0.5 font-mono">
                    <li>الرياضيات.جذر(س)، الرياضيات.قوة(أ، ب)</li>
                    <li>الرياضيات.مطلق(س)، الرياضيات.أدنى(أ، ب)</li>
                    <li>الرياضيات.ط (Pi)، الرياضيات.هـ (Euler)</li>
                    <li>الرياضيات.عشوائي()</li>
                  </ul>
                </div>

                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-1">
                  <h5 className="font-semibold text-purple-400">وحدة النصوص</h5>
                  <ul className="text-zinc-400 space-y-0.5 font-mono">
                    <li>النصوص.طول(نص)</li>
                    <li>النصوص.تقسيم(نص، فاصل)</li>
                    <li>النصوص.دمج(قائمة، فاصل)</li>
                    <li>النصوص.يحتوي(نص، كلمة)</li>
                  </ul>
                </div>

                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-1">
                  <h5 className="font-semibold text-amber-400">وحدة القوائم</h5>
                  <ul className="text-zinc-400 space-y-0.5 font-mono">
                    <li>القوائم.طول(قائمة)، القوائم.أضف(ق، ع)</li>
                    <li>القوائم.احذف(قائمة)، القوائم.رتب(قائمة)</li>
                    <li>القوائم.طبق(ق، دالة)، القوائم.رشح(ق، دالة)</li>
                    <li>القوائم.اختزل(ق، دالة، قيمة_أولية)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {tab === 'roadmap' && (
            <div className="space-y-3 font-mono text-xs whitespace-pre-wrap bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
              {MJ_FORMAL_SPECIFICATION.roadmap.trim()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
