/**
 * MJ Studio - Multi-Inspector Tabs
 * 1. Diagnostics (Errors & Warnings with code pointers)
 * 2. AST Explorer (Visual Abstract Syntax Tree)
 * 3. Bytecode Disassembler (Opcodes & Constants)
 * 4. Lexer Tokens (Token stream table)
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Binary,
  Layers,
  ListTree,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Program } from '../lang/ast';
import { Token } from '../lang/tokens';
import { FormattedDiagnostic } from '../lang/diagnostics';
import { Language, translations } from '../i18n/translations';

interface InspectorTabsProps {
  diagnostics: FormattedDiagnostic[];
  ast: Program | null;
  bytecodeDisassembly: string;
  tokens: Token[];
  lang: Language;
}

export const InspectorTabs: React.FC<InspectorTabsProps> = ({
  diagnostics,
  ast,
  bytecodeDisassembly,
  tokens,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'ast' | 'bytecode' | 'tokens'>('diagnostics');

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-t border-zinc-800 text-xs font-mono select-none">
      {/* Tab Navigation Header */}
      <div className="h-9 border-b border-zinc-800 bg-zinc-900/60 px-2 flex items-center gap-1 overflow-x-auto">
        {/* Diagnostics Tab */}
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'diagnostics'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <AlertCircle className={`w-3.5 h-3.5 ${diagnostics.length > 0 ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span>{t.diagnostics}</span>
          {diagnostics.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px]">
              {diagnostics.length}
            </span>
          )}
        </button>

        {/* Bytecode Disassembly Tab */}
        <button
          onClick={() => setActiveTab('bytecode')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'bytecode'
              ? 'bg-zinc-800 text-cyan-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Binary className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.bytecodeViewer}</span>
        </button>

        {/* AST Explorer Tab */}
        <button
          onClick={() => setActiveTab('ast')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'ast'
              ? 'bg-zinc-800 text-emerald-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ListTree className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.astExplorer}</span>
        </button>

        {/* Tokens Tab */}
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'tokens'
              ? 'bg-zinc-800 text-purple-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>{t.tokensViewer}</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-auto p-3">
        {/* 1. Diagnostics View */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-3">
            {diagnostics.length === 0 ? (
              <div className="flex items-center gap-2 text-zinc-500 py-3">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{t.noDiagnostics}</span>
              </div>
            ) : (
              diagnostics.map((diag, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/80 border border-rose-900/50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{diag.message}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {diag.file}:{diag.line}:{diag.column}
                    </span>
                  </div>

                  {/* Code snippet with pointer */}
                  {diag.codeSnippet && (
                    <div className="bg-black/50 p-2 rounded border border-zinc-800 text-[11px] text-zinc-300 font-mono whitespace-pre overflow-x-auto">
                      {diag.codeSnippet}
                    </div>
                  )}

                  {/* Actionable Suggestion */}
                  {diag.suggestion && (
                    <div className="flex items-start gap-2 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded text-emerald-300 text-[11px]">
                      <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{t.suggestion}: </span>
                        {diag.suggestion}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. Bytecode Disassembly View */}
        {activeTab === 'bytecode' && (
          <div className="font-mono text-[11px] text-cyan-300/90 whitespace-pre leading-relaxed select-text bg-black/40 p-3 rounded border border-zinc-900">
            {bytecodeDisassembly || '// Click "Run Program" or compile to inspect MJ-VM bytecode.'}
          </div>
        )}

        {/* 3. AST Visualizer View */}
        {activeTab === 'ast' && (
          <div className="space-y-1 select-text">
            {ast ? (
              <ASTNodeItem label="Program" node={ast} isRoot />
            ) : (
              <div className="text-zinc-600 italic">No AST available.</div>
            )}
          </div>
        )}

        {/* 4. Tokens View */}
        {activeTab === 'tokens' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-1 px-2">Type</th>
                  <th className="py-1 px-2">Lexeme</th>
                  <th className="py-1 px-2">Literal</th>
                  <th className="py-1 px-2">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {tokens.map((tok, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/50">
                    <td className="py-1 px-2 text-purple-400 font-medium">{tok.type}</td>
                    <td className="py-1 px-2 text-zinc-200">"{tok.lexeme}"</td>
                    <td className="py-1 px-2 text-amber-300">
                      {tok.literal !== undefined ? String(tok.literal) : '-'}
                    </td>
                    <td className="py-1 px-2 text-zinc-500">
                      {tok.loc.line}:{tok.loc.column}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Recursive AST Tree View Node
const ASTNodeItem: React.FC<{ label: string; node: any; isRoot?: boolean }> = ({
  label,
  node,
  isRoot = false,
}) => {
  const [expanded, setExpanded] = useState(isRoot);

  if (node === null || node === undefined) {
    return (
      <div className="pl-4 text-zinc-600">
        <span className="text-zinc-500">{label}:</span> null
      </div>
    );
  }

  if (typeof node !== 'object') {
    return (
      <div className="pl-4 text-zinc-400">
        <span className="text-zinc-500">{label}:</span>{' '}
        <span className="text-emerald-400">{JSON.stringify(node)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(node);
  const keys = Object.keys(node).filter((k) => k !== 'loc');
  const typeStr = node.type || (isArray ? `List[${node.length}]` : 'Object');

  return (
    <div className="pl-2">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:text-white transition group"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
        ) : (
          <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
        )}
        <span className="text-zinc-400 font-medium">{label}:</span>
        <span className="px-1 py-0.2 bg-zinc-900 text-emerald-400 rounded text-[10px] border border-zinc-800">
          {typeStr}
        </span>
      </div>

      {expanded && (
        <div className="border-l border-zinc-800/80 ml-2.5 my-0.5">
          {isArray
            ? node.map((item: any, i: number) => (
                <ASTNodeItem key={i} label={`[${i}]`} node={item} />
              ))
            : keys.map((key) => (
                <ASTNodeItem key={key} label={key} node={node[key]} />
              ))}
        </div>
      )}
    </div>
  );
};
