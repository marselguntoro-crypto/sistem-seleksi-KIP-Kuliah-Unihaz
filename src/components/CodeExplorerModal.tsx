import React, { useState } from 'react';
import { LARAVEL_PHASE1_FILES } from '../data/mockData';
import { LaravelFile } from '../types';
import { Code, Copy, Check, FileText, Download, X } from 'lucide-react';

interface CodeExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExplorerModal: React.FC<CodeExplorerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<LaravelFile>(LARAVEL_PHASE1_FILES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([selectedFile.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = selectedFile.path.split('/').pop() || 'file.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-[#071326] text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Arsip Source Code Laravel 12 & MySQL - Phase 1</h2>
              <p className="text-[11px] text-slate-400">File lengkap siap pakai untuk direktori project Laravel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Directory Sidebar */}
          <div className="w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto p-3 space-y-1 text-xs shrink-0">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              File Phase 1 ({LARAVEL_PHASE1_FILES.length} Files)
            </div>
            {LARAVEL_PHASE1_FILES.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg font-mono text-xs transition-colors flex items-center gap-2 ${
                  selectedFile.path === file.path
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer Area */}
          <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
            {/* File Path & Actions Bar */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-amber-400 font-bold truncate">{selectedFile.path}</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">&mdash; {selectedFile.description}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-emerald-300 leading-relaxed bg-[#0c1322]">
              <pre>
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
