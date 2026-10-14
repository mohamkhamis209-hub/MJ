/**
 * MJ Studio - Console & Telemetry Output Component
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
 */

import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Trash2, CheckCircle, AlertTriangle, ArrowRight, Activity, Gauge } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface ConsoleProps {
  stdout: string[];
  stderr: string[];
  isRunning: boolean;
  onClear: () => void;
  metrics?: {
    instructions: number;
    durationMs: number;
    stackPeak?: number;
    success?: boolean;
    backend: 'ast' | 'vm';
  };
  onSendStdin?: (input: string) => void;
  lang: Language;
}

export const Console: React.FC<ConsoleProps> = ({
  stdout,
  stderr,
  isRunning,
  onClear,
  metrics,
  onSendStdin,
  lang,
}) => {
  const t = translations[lang];
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [stdinValue, setStdinValue] = useState('');

  // Auto-scroll on new output
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stdout, stderr]);

  const handleStdinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSendStdin) {
      onSendStdin(stdinValue);
      setStdinValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-mono text-xs select-none">
      {/* Console Header Bar */}
      <div className="h-9 border-b border-zinc-800 bg-zinc-900/60 px-3 flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-zinc-200">{t.console}</span>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {t.running}
            </span>
          )}
        </div>

        {/* Telemetry pill */}
        {metrics && (
          <div className="flex items-center gap-3 text-[11px]">
            <div className="hidden sm:flex items-center gap-1 text-zinc-400">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>{metrics.instructions.toLocaleString()} steps</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>{metrics.durationMs.toFixed(2)} ms</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                metrics.success
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {metrics.backend === 'ast' ? 'AST' : 'MJ-VM'} : {metrics.success ? t.success : t.error}
            </span>
            <button
              onClick={onClear}
              className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
              title={t.clearConsole}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Output Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 select-text">
        {stdout.length === 0 && stderr.length === 0 && (
          <div className="text-zinc-600 italic py-2">
            {t.consoleEmpty}
          </div>
        )}

        {stdout.map((text, idx) => (
          <div key={`out-${idx}`} className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {text}
          </div>
        ))}

        {stderr.map((text, idx) => (
          <div
            key={`err-${idx}`}
            className="text-rose-400 bg-rose-950/20 border border-rose-900/40 p-2 rounded whitespace-pre-wrap leading-relaxed flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">{text}</div>
          </div>
        ))}

        <div ref={consoleEndRef} />
      </div>

      {/* Interactive Stdin Bar */}
      {onSendStdin && (
        <form
          onSubmit={handleStdinSubmit}
          className="h-8 border-t border-zinc-800 bg-zinc-900/40 px-3 flex items-center gap-2"
        >
          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={stdinValue}
            onChange={(e) => setStdinValue(e.target.value)}
            placeholder={t.enterInput}
            className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-zinc-600"
          />
          <button
            type="submit"
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition"
          >
            {t.sendInput}
          </button>
        </form>
      )}
    </div>
  );
};
