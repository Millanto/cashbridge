import React, { useState } from "react";
import { Folder, File, ChevronRight, ChevronDown, Check, Server, Smartphone, Info } from "lucide-react";
import { FileNode } from "../types";
import { frontendFolderStructure, backendFolderStructure } from "../data/architectureData";

export default function FolderStructureTab() {
  const [activeRepo, setActiveRepo] = useState<"frontend" | "backend">("frontend");
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);

  // Keep track of expanded folder paths to build interactive folder collapses
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    "cashbridge-frontend": true,
    "cashbridge-frontend/src": true,
    "cashbridge-frontend/public": true,
    "cashbridge-backend": true,
    "cashbridge-backend/src": true,
  });

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const renderNode = (node: FileNode, currentPath: string): React.ReactNode => {
    const isDirectory = node.type === "directory";
    const path = `${currentPath}/${node.name}`;
    const isExpanded = expandedPaths[path];

    return (
      <div key={path} className="ml-4">
        <div 
          onClick={() => {
            if (isDirectory) {
              togglePath(path);
            }
            setSelectedNode(node);
          }}
          className={`flex items-center space-x-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-xs ${
            selectedNode?.name === node.name 
              ? "bg-blue-50 text-blue-700 font-semibold" 
              : "hover:bg-slate-50 text-slate-700"
          }`}
        >
          {isDirectory ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )}
              <Folder className="h-4 w-4 text-amber-500 fill-amber-100 shrink-0" />
            </>
          ) : (
            <>
              <span className="w-3.5" />
              <File className="h-4 w-4 text-blue-400 shrink-0" />
            </>
          )}
          <span className="font-mono">{node.name}</span>
        </div>

        {isDirectory && isExpanded && node.children && (
          <div className="border-l border-slate-200 ml-4 pl-1">
            {node.children.map((child) => renderNode(child, path))}
          </div>
        )}
      </div>
    );
  };

  const getActiveRoot = () => {
    return activeRepo === "frontend" ? frontendFolderStructure : backendFolderStructure;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Workspace Codebase Folder Structures</h2>
            <p className="text-xs text-slate-500">Fully separate folders protecting business logical isolation</p>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setActiveRepo("frontend");
                setSelectedNode(null);
              }}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                activeRepo === "frontend" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 mr-1" />
              Frontend React
            </button>
            <button
              onClick={() => {
                setActiveRepo("backend");
                setSelectedNode(null);
              }}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                activeRepo === "backend" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Server className="h-3.5 w-3.5 mr-1" />
              Backend Express
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* File Trees Explorer */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-[480px] overflow-y-auto">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Interactive Tree Explorer</h3>
            <div className="select-none">
              {renderNode(getActiveRoot(), "")}
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Inspector</h4>
              </div>

              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Name</span>
                    <span className="font-mono text-sm font-semibold text-slate-800 break-all">{selectedNode.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Element Node Type</span>
                    <span className={`px-2 py-0.5 inline-block text-[10px] rounded mt-1 uppercase font-mono ${
                      selectedNode.type === "directory" 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {selectedNode.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Architectural Purpose</span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 text-justify">
                      {selectedNode.description || "Holds foundational variables and declarations crucial for building standard enterprise pathways."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Folder className="h-8 w-8 text-slate-300 animate-pulse" />
                  <p className="text-xs">Click any file or directory in the explorer tree on the left to inspect its role inside the architecture.</p>
                </div>
              )}
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl space-y-3 mt-6">
              <h4 className="text-xs font-bold text-slate-400 flex items-center shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></span>
                Fintech Repo Guidelines
              </h4>
              <ul className="space-y-2 text-[11px] text-slate-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-1.5 font-bold">•</span>
                  <span>Never add server credentials or `config/` secrets to client bundle directory.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-1.5 font-bold">•</span>
                  <span>PWA updates and scripts inside the `/public` root MUST trigger disk-reloading algorithms.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
