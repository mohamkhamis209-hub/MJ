/**
 * MJ Studio - Dedicated Arabic-Aware Code Editor
 * Features syntax highlighting, line numbers, error indicators, tab handling, and cursor coordinates
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import React, { useRef, useState } from 'react';

interface EditorProps {
  filename: string;
  code: string;
  onChange: (newCode: string) => void;
  errorLine?: number;
}

export const Editor: React.FC<EditorProps> = ({
  filename,
  code,
  onChange,
  errorLine,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const lines = code.split('\n');

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;

    const sub = text.substring(0, selStart);
    const lineIndex = (sub.match(/\n/g) || []).length + 1;
    const lastNewline = sub.lastIndexOf('\n');
    const colIndex = selStart - lastNewline;

    setCursorPos({ line: lineIndex, col: colIndex });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        updateCursorPosition();
      }, 0);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-sm relative">
      {/* File Tab Header */}
      <div className="h-9 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center justify-between text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-zinc-200 font-medium font-mono">{filename}</span>
          <span className="text-zinc-600">({lines.length} سطر)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
          <span>UTF-8</span>
          <span>MJ عربي</span>
          <span>السطر {cursorPos.line}، العمود {cursorPos.col}</span>
        </div>
      </div>

      {/* Editor Body: Kept in LTR for proper code/operator indentation order */}
      <div dir="ltr" className="flex-1 flex overflow-hidden relative text-left">
        {/* Line Numbers Gutter */}
        <div className="w-12 py-3 bg-zinc-950/80 border-r border-zinc-900 text-right pr-3 select-none text-xs text-zinc-600 shrink-0 overflow-hidden font-mono">
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isError = lineNum === errorLine;
            return (
              <div
                key={idx}
                className={`h-5 leading-5 ${
                  isError ? 'text-rose-500 font-bold bg-rose-500/10 -mr-3 pr-3' : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Text Area & Syntax Overlay Container */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Syntax Highlighted Background */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 p-3 m-0 font-mono text-xs md:text-sm leading-5 overflow-hidden pointer-events-none whitespace-pre select-none text-zinc-300"
            style={{ fontFamily: "'Cairo', 'Fira Code', 'JetBrains Mono', monospace" }}
            dangerouslySetInnerHTML={{ __html: highlightMJSyntax(code) }}
          />

          {/* Interactive Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            style={{ fontFamily: "'Cairo', 'Fira Code', 'JetBrains Mono', monospace" }}
            className="absolute inset-0 p-3 m-0 font-mono text-xs md:text-sm leading-5 bg-transparent text-transparent caret-emerald-400 resize-none outline-none overflow-auto whitespace-pre selection:bg-emerald-500/30 selection:text-transparent"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Syntax highlighter for Arabic and English MJ source code
 */
function highlightMJSyntax(rawCode: string): string {
  let text = rawCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Comments
  text = text.replace(/(\/\/[^\n]*)/g, '<span class="text-zinc-500 italic">$1</span>');
  text = text.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-zinc-500 italic">$1</span>');

  // 2. Strings & String interpolation
  text = text.replace(/(".*?")/g, (match) => {
    const withInterp = match.replace(
      /@\{([^}]+)\}/g,
      '<span class="text-amber-400 font-bold">@{<span class="text-white">$1</span>}</span>'
    );
    return `<span class="text-amber-300">${withInterp}</span>`;
  });

  // 3. Arabic & English Keywords
  const arabicKeywords = [
    'متغير', 'ثابت', 'دالة', 'أرجع', 'ارجع', 'إذا', 'اذا', 'لو',
    'وإلا', 'والا', 'طالما', 'بينما', 'لكل', 'في', 'كرر',
    'طابق', 'اختر', 'توقف', 'استمر', 'استورد', 'باسم', 'كنوع', 'نوع'
  ];
  const englishKeywords = [
    'val', 'var', 'func', 'return', 'when', 'else', 'while',
    'for', 'in', 'repeat', 'match', 'break', 'continue',
    'import', 'as', 'type', 'if'
  ];

  const allKw = [...arabicKeywords, ...englishKeywords];
  const kwRegex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${allKw.join('|')})([^\\p{L}\\p{N}_]|$)`, 'gu');
  text = text.replace(kwRegex, '$1<span class="text-emerald-400 font-semibold">$2</span>$3');

  // 4. Built-in Modules & Functions
  const builtins = [
    'اطبع', 'اطبع_سطر', 'اقرأ', 'الطباعة', 'الرياضيات', 'النصوص', 'القوائم', 'النظام',
    'نوع', 'تأكد', 'io', 'math', 'str', 'list', 'sys', 'typeOf', 'assert'
  ];
  const builtinRegex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${builtins.join('|')})([^\\p{L}\\p{N}_]|$)`, 'gu');
  text = text.replace(builtinRegex, '$1<span class="text-cyan-400 font-medium">$2</span>$3');

  // 5. Types
  const types = [
    'عدد', 'عدد_عشري', 'نص', 'منطقي', 'قائمة', 'قاموس',
    'Int', 'Float', 'Str', 'Bool', 'Null', 'List', 'Map', 'Fn'
  ];
  const typeRegex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${types.join('|')})([^\\p{L}\\p{N}_]|$)`, 'gu');
  text = text.replace(typeRegex, '$1<span class="text-purple-400 font-medium">$2</span>$3');

  // 6. Booleans and Nil
  const bools = ['صحيح', 'خطأ', 'خطا', 'فارغ', 'عدم', 'true', 'false', 'nil', 'null'];
  const boolRegex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${bools.join('|')})([^\\p{L}\\p{N}_]|$)`, 'gu');
  text = text.replace(boolRegex, '$1<span class="text-rose-400 font-medium">$2</span>$3');

  // 7. Numbers (Western and Arabic-Indic ٠-٩)
  text = text.replace(/([0-9\u0660-\u0669]+(\.[0-9\u0660-\u0669]+)?)/g, '<span class="text-sky-300 font-mono">$1</span>');

  // 8. Arrow operators
  text = text.replace(/(-&gt;|=&gt;)/g, '<span class="text-amber-400 font-bold">$1</span>');

  return text;
}
