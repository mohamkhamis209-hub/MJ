/**
 * MJ Studio - Project & Files Sidebar
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
 */

import React, { useState } from 'react';
import {
  FileCode,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { CODE_EXAMPLES, CodeExample } from '../data/examples';
import { Language, translations } from '../i18n/translations';

interface SidebarProps {
  files: string[];
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onCreateFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onLoadExample: (example: CodeExample) => void;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onLoadExample,
  lang,
}) => {
  const t = translations[lang];
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [examplesOpen, setExamplesOpen] = useState(true);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileName.trim();
    if (!name) return;
    if (!name.endsWith('.mj')) name += '.mj';
    onCreateFile(name);
    setNewFileName('');
    setIsCreating(false);
  };

  const handleRenameSubmit = (e: React.FormEvent, oldName: string) => {
    e.preventDefault();
    let name = editFileName.trim();
    if (!name) return;
    if (!name.endsWith('.mj')) name += '.mj';
    onRenameFile(oldName, name);
    setEditingFile(null);
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full text-xs select-none">
      {/* File Explorer Section */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-zinc-300">
          <FolderOpen className="w-4 h-4 text-emerald-400" />
          <span>{t.files}</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          title={t.newFile}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New File Inline Input */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-zinc-800 bg-zinc-900/50">
          <input
            type="text"
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="filename.mj"
            className="w-full bg-zinc-950 border border-emerald-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
            onBlur={() => setIsCreating(false)}
          />
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.map((file) => {
          const isActive = file === activeFile;
          const isEditing = file === editingFile;

          if (isEditing) {
            return (
              <form
                key={file}
                onSubmit={(e) => handleRenameSubmit(e, file)}
                className="px-2 py-1"
              >
                <input
                  type="text"
                  autoFocus
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="w-full bg-zinc-900 border border-emerald-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                  onBlur={() => setEditingFile(null)}
                />
              </form>
            );
          }

          return (
            <div
              key={file}
              onClick={() => onSelectFile(file)}
              className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500 font-medium'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className="truncate">{file}</span>
              </div>

              {/* Action buttons on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFile(file);
                    setEditFileName(file);
                  }}
                  className="p-1 hover:text-white hover:bg-zinc-800 rounded"
                  title={t.renameFile}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file);
                    }}
                    className="p-1 hover:text-rose-400 hover:bg-zinc-800 rounded"
                    title={t.deleteFile}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Example Programs Accordion */}
        <div className="mt-4 border-t border-zinc-800/80 pt-2">
          <button
            onClick={() => setExamplesOpen(!examplesOpen)}
            className="w-full px-3 py-1.5 flex items-center justify-between text-zinc-400 hover:text-zinc-200 transition"
          >
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.examples}</span>
            </div>
            {examplesOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </button>

          {examplesOpen && (
            <div className="px-2 py-1 space-y-1">
              {CODE_EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onLoadExample(ex)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-900 transition flex flex-col gap-0.5 group"
                >
                  <span className="text-zinc-300 group-hover:text-cyan-300 font-medium text-[11px]">
                    {ex.title}
                  </span>
                  <span className="text-zinc-500 text-[10px] line-clamp-1">
                    {ex.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>MJ Lang v1.0</span>
        <span className="text-emerald-500/80">Mohamed Khamis</span>
      </div>
    </aside>
  );
};
