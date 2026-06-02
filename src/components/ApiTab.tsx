import { useState } from "react";
import { Server, Globe, KeyRound, Play, Terminal, CircleCheck, RefreshCcw } from "lucide-react";
import { clientEndpoints, publicEndpoints } from "../data/architectureData";
import { ApiEndpoint } from "../types";

export default function ApiTab() {
  const [endpointType, setEndpointType] = useState<"client" | "public">("client");
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint>(clientEndpoints[0]);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const endpoints = endpointType === "client" ? clientEndpoints : publicEndpoints;

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "POST":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETE":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const executeApiCall = () => {
    setIsLoading(true);
    setTestOutput(null);
    
    setTimeout(() => {
      setIsLoading(false);
      const timestamp = new Date().toISOString();
      const headersAndLogs = `[HTTP REQUEST ENQUEUE] - ${selectedApi.method} ${selectedApi.route}
[HEADERS] Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5c...
[HEADERS] Content-Type: application/json
[SECURE AUTH MIDDLEWARE] Verifying JWT token via Supabase micro-auth...
[SECURE AUTH MIDDLEWARE] Token validated successfully! User operator profile: uuid-4892
[ROUTE SYSTEM ENGINE] Executing controller logic...
[DATABASE ACTION] Synchronizing local logs securely inside Postgres transactional block...
[SUCCESS CALLBACK] Server code returned healthy status 200 OK.

[RESPONSE OUTPUT BODY]:
${selectedApi.responseBody}`;
      
      setTestOutput(headersAndLogs);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">REST API Architecture Specs</h2>
            <p className="text-xs text-slate-500">Documented and simulated Express routes routing wallet actions</p>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setEndpointType("client");
                setSelectedApi(clientEndpoints[0]);
                setTestOutput(null);
              }}
              className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                endpointType === "client"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 mr-1" />
              Client Authed Routes
            </button>
            <button
              onClick={() => {
                setEndpointType("public");
                setSelectedApi(publicEndpoints[0]);
                setTestOutput(null);
              }}
              className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                endpointType === "public"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              External Gateway Webhooks
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Routes list column */}
          <div className="lg:col-span-5 space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">API Endpoints</h3>
            {endpoints.map((api, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedApi(api);
                  setTestOutput(null);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col space-y-2 ${
                  selectedApi.route === api.route && selectedApi.method === api.method
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold border ${getMethodColor(api.method)}`}>
                    {api.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 break-all">{api.route}</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal line-clamp-2">{api.description}</p>
              </button>
            ))}
          </div>

          {/* Tester and Sandbox column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">ENDPOINT METADATA</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Authorization Requirement</span>
                  <span className={`px-2 py-0.5 inline-block text-[10px] rounded mt-1.5 font-semibold ${
                    selectedApi.authRequired ? "bg-amber-100 text-amber-800 text-xs" : "bg-emerald-100 text-emerald-800 text-xs"
                  }`}>
                    {selectedApi.authRequired ? "Header: Bearer JWT Required" : "Public - Sandbox Callback Signature"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Controller Codebase Handler</span>
                  <span className="font-mono text-[10px] block mt-2 text-slate-600">
                    {selectedApi.route.includes("sync") ? "sync.controller.ts" : selectedApi.route.includes("momo") || selectedApi.route.includes("callbacks") ? "momo.controller.ts" : "wallet.controller.ts"}
                  </span>
                </div>
              </div>

              {selectedApi.requestBody && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1.5">Request Sample Body (JSON)</span>
                  <pre className="bg-slate-50 text-slate-700 text-[10px] font-mono p-3 border border-slate-200 rounded-lg overflow-x-auto">
                    {selectedApi.requestBody}
                  </pre>
                </div>
              )}

              <div className="pt-2">
                <button
                  disabled={isLoading}
                  onClick={executeApiCall}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                      <span>Sending Secure Mock Request...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Execute Sandbox Endpoint Simulator</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Simulated server response logs */}
            {(isLoading || testOutput) && (
              <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950 text-slate-100">
                <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Terminal className="h-3.5 w-3.5 mr-1" />
                    Sandbox Stream Output Console
                  </span>
                  {isLoading && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                <div className="p-4 font-mono text-[10px] leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre">
                  {isLoading ? (
                    <div className="text-slate-400 animate-pulse">Running full-stack mock operations, contacting MTN Sandbox platform websockets...</div>
                  ) : (
                    testOutput
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
