import React, { useState } from "react";
import { Check, ArrowRight, Server, Database, Smartphone, ShieldCheck, Link2 } from "lucide-react";

export default function SystemArchTab() {
  const [activeNode, setActiveNode] = useState<string | null>("local-first");

  const nodes = [
    {
      id: "pwa",
      title: "React PWA (Client)",
      tech: "Vite + Tailwind 4",
      description: "Serves rich, high-frame-rate UI optimized for lightweight mobile downloads. Stores cache assets on disk via Service Workers for absolute server-failure independence.",
      icon: Smartphone,
      color: "border-blue-500 bg-blue-50/50 text-blue-700"
    },
    {
      id: "local-first",
      title: "IndexedDB Memory Shell",
      tech: "Dexie.js API Store",
      description: "Caches offline bookkeeping journal ledger records directly inside the browser's persistent IndexedDB layer to support trader workflows in non-connected regional markets.",
      icon: Database,
      color: "border-teal-500 bg-teal-50/50 text-teal-700"
    },
    {
      id: "express-server",
      title: "Express Core (API Router)",
      tech: "Node.js (TypeScript)",
      description: "Hosted in server containers (GCP Cloud Run). Coordinates authentication sessions, executes secure payouts, and acts as secure gateway for merchant funds.",
      icon: Server,
      color: "border-indigo-500 bg-indigo-50/50 text-indigo-700"
    },
    {
      id: "postgress-db",
      title: "Supabase DB Core",
      tech: "PostgreSQL 15",
      description: "Relational structured database managing multi-merchant ledgers. Runs secure row level security (RLS) constraints to guarantee profile isolation.",
      icon: Database,
      color: "border-emerald-500 bg-emerald-50/50 text-emerald-700"
    },
    {
      id: "payments-gateways",
      title: "African Mobile Money Gateways",
      tech: "MTN MoMo Sandbox + Paystack API",
      description: "Integrates directly with regional mobile money standard protocols (e.g., MTN’s Mobile Money API) and bank card payments via Paystack's unified router.",
      icon: Link2,
      color: "border-orange-500 bg-orange-50/50 text-orange-700"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Core Hybrid System Architecture</h2>
            <p className="text-xs text-slate-500">Dual-layer client-server topology designed to combat connection loss in local markets</p>
          </div>
          <span className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-mono font-bold">100% Isolated Repos</span>
        </div>

        <div className="p-6">
          {/* Visual Architecture Map */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 mb-6 relative">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8 text-center">Interactive Data Flow Diagram</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative z-10">
              {/* React PWA */}
              <div 
                onClick={() => setActiveNode("pwa")}
                className={`cursor-pointer group p-4 border-2 rounded-xl transition-all duration-200 text-center ${activeNode === "pwa" ? "border-blue-600 ring-4 ring-blue-50 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="h-10 w-10 mx-auto rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-105 transition-transform">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">React PWA</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Vite SPA</p>
                <div className="mt-2 text-[9px] text-blue-600 font-semibold">Client UI Layer</div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center justify-center text-slate-300">
                <span className="text-[9px] font-mono text-slate-400 mb-1">Local Writes</span>
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
                <span className="text-[9px] font-mono text-slate-400 mt-1">IndexedDB</span>
              </div>

              {/* Local Storage */}
              <div 
                onClick={() => setActiveNode("local-first")}
                className={`cursor-pointer group p-4 border-2 rounded-xl transition-all duration-200 text-center ${activeNode === "local-first" ? "border-teal-600 ring-4 ring-teal-50 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="h-10 w-10 mx-auto rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-2 group-hover:scale-105 transition-transform">
                  <Database className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">IndexedDB Local Queue</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Dexie.js Offline Cache</p>
                <div className="mt-2 text-[9px] text-teal-600 font-semibold">Local-First Storage</div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center justify-center text-slate-300">
                <span className="text-[9px] font-mono text-slate-400 mb-1">Sync Workers</span>
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
                <span className="text-[9px] font-mono text-slate-400 mt-1">Express API</span>
              </div>

              {/* Express Server */}
              <div 
                onClick={() => setActiveNode("express-server")}
                className={`cursor-pointer group p-4 border-2 rounded-xl transition-all duration-200 text-center ${activeNode === "express-server" ? "border-indigo-600 ring-4 ring-indigo-50 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="h-10 w-10 mx-auto rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-105 transition-transform">
                  <Server className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Express Backend</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Node.js API Route</p>
                <div className="mt-2 text-[9px] text-indigo-600 font-semibold">Security & API Gateway</div>
              </div>
            </div>

            {/* Connecting visual arrows below (vertical) */}
            <div className="grid grid-cols-5 gap-4 items-start mt-6 text-center select-none">
              <div className="col-span-2"></div>
              <div className="col-span-1 flex flex-col items-center justify-center text-slate-300">
                {/* Visual arrow indicator */}
                <div className="h-12 w-0.5 bg-slate-200 relative">
                  <div className="absolute -bottom-1 -left-1 border-4 border-transparent border-t-slate-300"></div>
                </div>
              </div>
              <div className="col-span-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-2 relative z-10">
              {/* Supabase Box */}
              <div 
                onClick={() => setActiveNode("postgress-db")}
                className={`cursor-pointer group p-4 border-2 rounded-xl transition-all duration-200 flex items-center space-x-4 ${activeNode === "postgress-db" ? "border-emerald-600 ring-4 ring-emerald-50 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Supabase DB (PostgreSQL 15)</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Holds absolute merchant profiles, transaction ledgers, security row limits, and financial keys.</p>
                </div>
              </div>

              {/* Payments Box */}
              <div 
                onClick={() => setActiveNode("payments-gateways")}
                className={`cursor-pointer group p-4 border-2 rounded-xl transition-all duration-200 flex items-center space-x-4 ${activeNode === "payments-gateways" ? "border-orange-600 ring-4 ring-orange-50 bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Link2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">MTN MoMo + Paystack Gateways</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Executes instant merchant cash-ins and secure disbursements directly into telecom profiles.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Node metadata info card */}
          {activeNode && (
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 mt-1">
                  {React.createElement(nodes.find(n => n.id === activeNode)?.icon || Server, { className: "h-6 w-6" })}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center space-x-2">
                    <span>{nodes.find(n => n.id === activeNode)?.title}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                      {nodes.find(n => n.id === activeNode)?.tech}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                    {nodes.find(n => n.id === activeNode)?.description}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Architectural Standard</span>
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Production-Grade Protection</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <span className="h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            Strict isolated-Repo Separation
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In compliance with enterprise fintech standards, the <strong>CashBridge Codebase</strong> is segmented into two distinct configurations. This keeps client deployment files perfectly distinct from server API keys and secret gateway credentials:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 pt-1">
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2 font-bold">✔</span>
              <span><strong>Separate CI/CD Pipelines:</strong> Deploy the frontend securely directly to CDN networks (e.g. Firebase Hosting or Vercel static router) with absolute near-zero latencies across African operators.</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2 font-bold">✔</span>
              <span><strong>Confined Server Environment:</strong> Express executes isolated on secure VMs behind proxy load balancers protecting MTN sandbox credential routes.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <span className="h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            Local-First Performance Strategy
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            African markets pose extreme network latency constraints due to power shortages or cell tower congestion. CashBridge overcomes this with local offline buffers:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 pt-1">
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2 font-bold">●</span>
              <span><strong>0ms Input Latency:</strong> Sales registers instantly write locally. The operator never sees raw loading bars.</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2 font-bold">●</span>
              <span><strong>Graceful Dual Status Sync:</strong> Transactions remain queued until networks resume. Clear indicator badges notify traders of successful cloud persistence.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
