/**
 * MJ Studio - Header Component
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
 */

import React from 'react';
import {
  Play,
  Square,
  Cpu,
  BookOpen,
  CheckCircle2,
  Download,
  Moon,
  Sun,
  Globe,
  Code2,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  backend: 'ast' | 'vm';
  onBackendChange: (b: 'ast' | 'vm') => void;
  onOpenDocs: () => void;
  onOpenTests: () => void;
  onExport: () => void;
  lang: Language;
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onRun,
  onStop,
  backend,
  onBackendChange,
  onOpenDocs,
  onOpenTests,
  onExport,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
}) => {
  const t = translations[lang];

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between select-none">
      {/* Brand & Creator */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-950/40">
          MJ
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-white tracking-tight text-sm sm:text-base">
              {t.appName}
            </h1>
            <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            {t.tagline} <span className="text-zinc-500">|</span> <span className="text-emerald-400/90 font-medium">{t.creatorBadge}</span>
          </p>
        </div>
      </div>

      {/* Center Controls: Run, Backend Engine */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => onBackendChange('ast')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              backend === 'ast'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Tree-walk AST Interpreter"
          >
            AST
          </button>
          <button
            onClick={() => onBackendChange('vm')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              backend === 'vm'
                ? 'bg-zinc-800 text-cyan-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Stack-based Bytecode VM"
          >
            MJ-VM
          </button>
        </div>

        {/* Run / Stop Button */}
        <button
          onClick={isRunning ? onStop : onRun}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
            isRunning
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 hover:shadow-emerald-900/60'
          }`}
          title="Run (Ctrl+Enter or Cmd+Enter)"
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{t.stop}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.run}</span>
            </>
          )}
        </button>
      </div>

      {/* Right Actions: Test Suite, Docs, Language, Export, Theme */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Test Suite */}
        <button
          onClick={onOpenTests}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
          title="Automated Test Suite"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">{t.testSuite}</span>
        </button>

        {/* Docs & Spec */}
        <button
          onClick={onOpenDocs}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
          title="Language Documentation & EBNF"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">{t.docs}</span>
        </button>

        {/* Language Toggle (EN / AR) */}
        <button
          onClick={onToggleLang}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-xs font-medium flex items-center gap-1"
          title="Switch Language / تغيير اللغة"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="uppercase">{lang}</span>
        </button>

        {/* Export Project */}
        <button
          onClick={onExport}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title={t.exportProject}
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title={theme === 'dark' ? t.themeLight : t.themeDark}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
