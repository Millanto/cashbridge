import React, { useState } from "react";
import { 
  Folder, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Server, 
  Layers, 
  Flame, 
  Pocket, 
  Cpu,
  CornerDownRight,
  Database
} from "lucide-react";
import { backendCodefiles, frontendCodefiles, SourceFile } from "../data/codebaseData";

export default function CodebaseTab() {
  const [selectedProject, setSelectedProject] = useState<"backend" | "frontend">("backend");
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const activeFiles = selectedProject === "backend" ? backendCodefiles : frontendCodefiles;
  const currentFile: SourceFile = activeFiles[activeFileIndex] || activeFiles[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="codebase-explorer">
      {/* Banner */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Terminal className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              CashBridge Codebase Registry
            </h3>
            <p className="text-xs text-slate-400">
              Browse fully deployable, production-ready backend & frontend files. No mocks.
            </p>
          </div>
        </div>
        <div className="bg-blue-600/10 text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-mono border border-blue-500/20">
          v1.0.0 Stable
        </div>
      </div>

      {/* Selector of Projects */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-2 space-x-2">
        <button
          onClick={() => {
            setSelectedProject("backend");
            setActiveFileIndex(0);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            selectedProject === "backend"
              ? "bg-white text-slate-800 border border-slate-200 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Server className="h-3.5 w-3.5 text-indigo-500" />
          <span>Backend (cashbridge-backend)</span>
        </button>
        <button
          onClick={() => {
            setSelectedProject("frontend");
            setActiveFileIndex(0);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            selectedProject === "frontend"
              ? "bg-white text-slate-800 border border-slate-200 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-blue-500" />
          <span>Frontend (cashbridge-frontend)</span>
        </button>
      </div>

      {/* Main Container Split: Browser Left / Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
        {/* Left Bar File Explorer */}
        <div className="lg:col-span-4 border-r border-slate-200 p-4 bg-slate-50/50 overflow-y-auto max-h-[600px]">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            <span>Project Files</span>
            <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
              {activeFiles.length} files
            </span>
          </div>

          <div className="space-y-1.5">
            {activeFiles.map((file, idx) => {
              const isActive = activeFileIndex === idx;
              return (
                <button
                  key={file.path}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg border text-xs font-semibold flex items-start space-x-3 transition-all ${
                    isActive
                      ? "bg-white border-blue-500/30 text-blue-700 shadow-sm ring-1 ring-blue-500/10"
                      : "bg-white/40 border-slate-200 text-slate-650 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <FileCode className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                  <div className="min-w-0">
                    <p className="font-mono font-bold truncate tracking-tight text-slate-800">
                      {file.filename}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {file.path}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3">
              <h5 className="text-[10px] uppercase font-bold text-blue-800 tracking-wider flex items-center mb-1">
                <Cpu className="h-3 w-3 mr-1" /> Core Purpose
              </h5>
              <p className="text-[10px] leading-relaxed text-blue-700">
                To fulfill a production specification, files have zero fallback mocks. Paste into your text editor, supply valid credentials in `.env`, and trigger startup processes.
              </p>
            </div>
          </div>
        </div>

        {/* Right Code Display Canvas */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950 text-slate-100 overflow-hidden max-h-[600px]">
          {/* File Header */}
          <div className="bg-slate-900 border-b border-slate-850 px-4 py-3 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-300">
              <CornerDownRight className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-semibold text-slate-100">{currentFile?.path}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyCode}
                className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center space-x-1 border border-slate-700 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownloadFile}
                className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center space-x-1 border border-slate-700 hover:text-white cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-indigo-950/40 border-b border-indigo-950 px-5 py-2.5">
            <p className="text-[11px] font-semibold text-indigo-200">
              💡 <span className="font-bold text-white">Why this file exists:</span> {currentFile?.description}
            </p>
          </div>

          {/* Line Numbers + Content Code Pre */}
          <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed select-text min-h-[300px]">
            <pre className="grid grid-cols-[30px_1fr] gap-4">
              <span className="text-slate-600 text-right select-none opacity-50 pr-1">
                {currentFile?.content.split("\n").map((_, i) => `${i + 1}\n`)}
              </span>
              <code className="text-emerald-400 whitespace-pre scrollbar-thin scrollbar-thumb-slate-800">
                {currentFile?.content}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
