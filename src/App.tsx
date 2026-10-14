/**
 * MJ Studio — The Official Arabic-First IDE for MJ Programming Language
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Console } from './components/Console';
import { InspectorTabs } from './components/InspectorTabs';
import { DocsModal } from './components/DocsModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { CODE_EXAMPLES, CodeExample } from './data/examples';
import { Language } from './i18n/translations';

// Language Engine Subsystems
import { Lexer } from './lang/lexer';
import { Parser } from './lang/parser';
import { SemanticAnalyzer } from './lang/semantics';
import { Interpreter } from './lang/interpreter';
import { BytecodeCompiler } from './lang/compiler';
import { disassembleChunk } from './lang/bytecode';
import { VirtualMachine } from './lang/vm';
import { DiagnosticEngine, FormattedDiagnostic } from './lang/diagnostics';
import { ModuleResolver } from './lang/module_resolver';
import { Program } from './lang/ast';
import { Token } from './lang/tokens';

const STORAGE_KEY = 'mj_studio_arabic_files_v1';

export default function App() {
  // Virtual Filesystem with persistence
  const [files, setFiles] = useState<Map<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const map = new Map<string, string>();
        for (const [k, v] of Object.entries(parsed)) {
          map.set(k, String(v));
        }
        if (map.size > 0) return map;
      }
    } catch {}

    const map = new Map<string, string>();
    const defaultProg = CODE_EXAMPLES[0]; // hello.mj (المثال الأساسي)
    map.set(defaultProg.filename, defaultProg.code);
    return map;
  });

  const [activeFile, setActiveFile] = useState<string>('hello.mj');

  // Sync to localStorage
  useEffect(() => {
    try {
      const obj: Record<string, string> = {};
      files.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }, [files]);

  // IDE Settings & State: Arabic by default!
  const [backend, setBackend] = useState<'ast' | 'vm'>('ast');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Active execution handle for cancellation
  const activeExecutionRef = useRef<{ cancel: () => void } | null>(null);

  // User input prompt state
  const pendingInputResolverRef = useRef<((value: string) => void) | null>(null);
  const pendingInputRejecterRef = useRef<((reason?: any) => void) | null>(null);
  const currentRunIdRef = useRef<number>(0);

  // Compilation & Execution State
  const [stdout, setStdout] = useState<string[]>([]);
  const [stderr, setStderr] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<FormattedDiagnostic[]>([]);
  const [ast, setAst] = useState<Program | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [bytecodeDisassembly, setBytecodeDisassembly] = useState<string>('');
  const [metrics, setMetrics] = useState<{
    instructions: number;
    durationMs: number;
    stackPeak?: number;
    success?: boolean;
    backend: 'ast' | 'vm';
  } | undefined>(undefined);

  // Modals
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);

  // Active code getter
  const currentCode = files.get(activeFile) || '';

  const updateCurrentCode = (newCode: string) => {
    setFiles((prev) => {
      const next = new Map(prev);
      next.set(activeFile, newCode);
      return next;
    });
  };

  // Stop running execution
  const stopProgram = useCallback(() => {
    currentRunIdRef.current++;
    if (activeExecutionRef.current) {
      activeExecutionRef.current.cancel();
      activeExecutionRef.current = null;
    }
    if (pendingInputRejecterRef.current) {
      pendingInputRejecterRef.current(new Error("تم إلغاء تنفيذ البرنامج يدوياً."));
      pendingInputRejecterRef.current = null;
      pendingInputResolverRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Handle user input from console
  const handleSendStdin = useCallback((input: string) => {
    if (pendingInputResolverRef.current) {
      const resolve = pendingInputResolverRef.current;
      pendingInputResolverRef.current = null;
      pendingInputRejecterRef.current = null;
      setStdout((prev) => [...prev, `${input}\n`]);
      resolve(input);
    }
  }, []);

  // Compile and run the active Arabic MJ program
  const runProgram = useCallback(async () => {
    // If already running, stop previous
    if (isRunning) {
      stopProgram();
    }

    const runId = ++currentRunIdRef.current;

    setIsRunning(true);
    setStdout([]);
    setStderr([]);
    setDiagnostics([]);

    try {
      // 1. Lexer Tokenization
      const lexer = new Lexer(currentCode, activeFile);
      const { tokens: scannedTokens, errors: lexErrors } = lexer.tokenize();
      if (runId !== currentRunIdRef.current) return;
      setTokens(scannedTokens);

      if (lexErrors.length > 0) {
        const formatted = lexErrors.map((e) =>
          DiagnosticEngine.parseDiagnosticString(e, files)
        );
        if (runId !== currentRunIdRef.current) return;
        setDiagnostics(formatted);
        setStderr(lexErrors);
        setIsRunning(false);
        return;
      }

      // 2. Parsing into AST
      const parser = new Parser(scannedTokens, activeFile);
      const { program, errors: parseErrors } = parser.parse();
      if (runId !== currentRunIdRef.current) return;
      setAst(program);

      if (parseErrors.length > 0) {
        const formatted = parseErrors.map((e) =>
          DiagnosticEngine.parseDiagnosticString(e, files)
        );
        if (runId !== currentRunIdRef.current) return;
        setDiagnostics(formatted);
        setStderr(parseErrors);
        setIsRunning(false);
        return;
      }

      // 3. Semantic Analysis
      const analyzer = new SemanticAnalyzer();
      const { errors: semErrors } = analyzer.analyze(program);

      if (semErrors.length > 0) {
        const formatted = semErrors.map((e) =>
          DiagnosticEngine.parseDiagnosticString(e, files)
        );
        if (runId !== currentRunIdRef.current) return;
        setDiagnostics(formatted);
        setStderr(semErrors);
        setIsRunning(false);
        return;
      }

      // 4. Update live Bytecode Disassembly
      try {
        const previewCompiler = new BytecodeCompiler();
        const { chunk: previewChunk } = previewCompiler.compile(program);
        if (runId === currentRunIdRef.current) {
          setBytecodeDisassembly(disassembleChunk(previewChunk, activeFile));
        }
      } catch {}

      // 5. Resolve multi-file project dependencies
      const resolver = new ModuleResolver(files);
      const { moduleEnvs } = resolver.resolveAll();

      // 6. Execution based on selected backend
      if (backend === 'ast') {
        const interpreter = new Interpreter({
          customModules: moduleEnvs,
          onPrint: (t) => {
            if (runId !== currentRunIdRef.current) return;
            setStdout((prev) => [...prev, t]);
          },
          onPrintln: (t) => {
            if (runId !== currentRunIdRef.current) return;
            setStdout((prev) => [...prev, t + '\n']);
          },
          onInputRequest: (promptText?: string) => {
            if (runId !== currentRunIdRef.current) {
              return Promise.reject(new Error("تم إلغاء التنفيذ."));
            }
            return new Promise<string>((resolve, reject) => {
              pendingInputResolverRef.current = resolve;
              pendingInputRejecterRef.current = reject;
              if (promptText) {
                setStdout((prev) => [...prev, promptText]);
              }
            });
          },
        });

        activeExecutionRef.current = interpreter;
        const result = await interpreter.interpretAsync(program);

        if (runId !== currentRunIdRef.current) return;

        setStderr([...result.stderr]);

        if (!result.success) {
          const formatted = result.stderr.map((e) =>
            DiagnosticEngine.parseDiagnosticString(e, files)
          );
          setDiagnostics(formatted);
        }

        setMetrics({
          instructions: result.instructionsExecuted,
          durationMs: result.durationMs,
          success: result.success,
          backend: 'ast',
        });
      } else {
        // Backend 2: Bytecode Compiler & Virtual Machine (MJ-VM)
        const compiler = new BytecodeCompiler();
        const { chunk, errors: compErrors } = compiler.compile(program);

        if (compErrors.length > 0) {
          if (runId !== currentRunIdRef.current) return;
          setStderr(compErrors);
          setIsRunning(false);
          return;
        }

        const vm = new VirtualMachine({
          onPrint: (t) => {
            if (runId !== currentRunIdRef.current) return;
            setStdout((prev) => [...prev, t]);
          },
          onPrintln: (t) => {
            if (runId !== currentRunIdRef.current) return;
            setStdout((prev) => [...prev, t + '\n']);
          },
          onInputRequest: (promptText?: string) => {
            if (runId !== currentRunIdRef.current) {
              return Promise.reject(new Error("تم إلغاء التنفيذ."));
            }
            return new Promise<string>((resolve, reject) => {
              pendingInputResolverRef.current = resolve;
              pendingInputRejecterRef.current = reject;
              if (promptText) {
                setStdout((prev) => [...prev, promptText]);
              }
            });
          },
        });

        activeExecutionRef.current = vm;
        const vmResult = await vm.runAsync(chunk, activeFile);

        if (runId !== currentRunIdRef.current) return;

        setBytecodeDisassembly(vmResult.disassembly);
        setStderr([...vmResult.stderr]);

        if (!vmResult.success) {
          const formatted = vmResult.stderr.map((e) =>
            DiagnosticEngine.parseDiagnosticString(e, files)
          );
          setDiagnostics(formatted);
        }

        setMetrics({
          instructions: vmResult.instructionsExecuted,
          durationMs: vmResult.durationMs,
          stackPeak: vmResult.stackPeak,
          success: vmResult.success,
          backend: 'vm',
        });
      }
    } catch (err: any) {
      if (runId === currentRunIdRef.current) {
        setStderr([err.message || String(err)]);
      }
    } finally {
      if (runId === currentRunIdRef.current) {
        setIsRunning(false);
        activeExecutionRef.current = null;
        pendingInputResolverRef.current = null;
        pendingInputRejecterRef.current = null;
      }
    }
  }, [currentCode, activeFile, files, backend, isRunning, stopProgram]);

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to Run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runProgram();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runProgram]);

  // Run initial program on mount once
  useEffect(() => {
    runProgram();
  }, []);

  // Handle Example Template Loading
  const handleLoadExample = (example: CodeExample) => {
    setFiles((prev) => {
      const next = new Map(prev);
      next.set(example.filename, example.code);
      if (example.extraFiles) {
        for (const [name, content] of Object.entries(example.extraFiles)) {
          next.set(name, content);
        }
      }
      return next;
    });
    setActiveFile(example.filename);
  };

  // Export Virtual Project
  const handleExport = () => {
    const projectData: Record<string, string> = {};
    files.forEach((content, filename) => {
      projectData[filename] = content;
    });

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mj-arabic-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Error line indicator in editor
  const primaryErrorLine = useMemo(() => {
    const firstErr = diagnostics.find((d) => d.file === activeFile);
    return firstErr ? firstErr.line : undefined;
  }, [diagnostics, activeFile]);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`h-screen w-screen flex flex-col overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
      }`}
    >
      {/* Top Navigation & Controls */}
      <Header
        isRunning={isRunning}
        onRun={runProgram}
        onStop={stopProgram}
        backend={backend}
        onBackendChange={setBackend}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onExport={handleExport}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'ar' : 'en')}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: File Tree & Arabic Templates */}
        <Sidebar
          files={Array.from(files.keys())}
          activeFile={activeFile}
          onSelectFile={setActiveFile}
          onCreateFile={(newFilename) => {
            setFiles((prev) => {
              const next = new Map(prev);
              next.set(
                newFilename,
                `// ${newFilename}\n// لغة إم جي البرمجية\n\nاطبع("مرحباً بك في ${newFilename}!")\n`
              );
              return next;
            });
            setActiveFile(newFilename);
          }}
          onDeleteFile={(filenameToDelete) => {
            if (files.size <= 1) return;
            setFiles((prev) => {
              const next = new Map(prev);
              next.delete(filenameToDelete);
              return next;
            });
            const remaining = Array.from(files.keys()).filter((k) => k !== filenameToDelete);
            setActiveFile(remaining[0] || 'hello.mj');
          }}
          onRenameFile={(oldName, newName) => {
            setFiles((prev) => {
              const next = new Map();
              prev.forEach((val, key) => {
                if (key === oldName) {
                  next.set(newName, val);
                } else {
                  next.set(key, val);
                }
              });
              return next;
            });
            if (activeFile === oldName) {
              setActiveFile(newName);
            }
          }}
          onLoadExample={handleLoadExample}
          lang={lang}
        />

        {/* Center & Right Work Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Center Pane: Editor */}
          <div className="flex-1 flex flex-col h-full border-r border-zinc-800">
            <Editor
              filename={activeFile}
              code={currentCode}
              onChange={updateCurrentCode}
              errorLine={primaryErrorLine}
            />
          </div>

          {/* Right Pane: Console Output & Compiler Inspectors */}
          <div className="w-full md:w-[480px] lg:w-[540px] flex flex-col h-full bg-zinc-950">
            {/* Upper Half: Console */}
            <div className="h-1/2 flex flex-col overflow-hidden">
              <Console
                stdout={stdout}
                stderr={stderr}
                isRunning={isRunning}
                onClear={() => {
                  setStdout([]);
                  setStderr([]);
                }}
                metrics={metrics}
                onSendStdin={handleSendStdin}
                lang={lang}
              />
            </div>

            {/* Lower Half: Diagnostics, AST, Bytecode, Tokens */}
            <div className="h-1/2 flex flex-col overflow-hidden">
              <InspectorTabs
                diagnostics={diagnostics}
                ast={ast}
                bytecodeDisassembly={bytecodeDisassembly}
                tokens={tokens}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Docs & Spec Modal */}
      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        lang={lang}
      />

      {/* Automated Test Suite Modal */}
      <TestRunnerModal
        isOpen={isTestsOpen}
        onClose={() => setIsTestsOpen(false)}
        lang={lang}
      />
    </div>
  );
}
