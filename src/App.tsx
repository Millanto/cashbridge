import { useState } from "react";
import { 
  Compass, 
  FolderTree, 
  Database, 
  Wallet, 
  WifiOff, 
  LayoutList, 
  FileDown, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  MessageSquare,
  Server,
  Terminal,
  Send,
  FileCode
} from "lucide-react";

// Import modular spec tabs
import SystemArchTab from "./components/SystemArchTab";
import FolderStructureTab from "./components/FolderStructureTab";
import DatabaseTab from "./components/DatabaseTab";
import ApiTab from "./components/ApiTab";
import PaymentFlowsTab from "./components/PaymentFlowsTab";
import OfflineSyncTab from "./components/OfflineSyncTab";
import DeploymentTab from "./components/DeploymentTab";
import RoadmapTab from "./components/RoadmapTab";
import CodebaseTab from "./components/CodebaseTab";

type TabType = "system-arch" | "folders" | "database" | "api" | "payments" | "offline-sync" | "deployment" | "roadmap" | "codebase";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("system-arch");
  const [downloadingSpec, setDownloadingSpec] = useState(false);

  const menuItems = [
    { id: "system-arch", label: "System Architecture", icon: Layers, group: "Project Spec" },
    { id: "folders", label: "Folder Structures", icon: FolderTree, group: "Project Spec" },
    { id: "database", label: "Database & Schema", icon: Database, group: "Project Spec" },
    { id: "api", label: "REST Api Specifications", icon: Terminal, group: "Project Spec" },
    { id: "payments", label: "Payment Flows", icon: Wallet, group: "Project Spec" },
    { id: "offline-sync", label: "Offline Sync Engine", icon: WifiOff, group: "Project Spec" },
    { id: "deployment", label: "Deployment Settings", icon: Server, group: "Project Spec" },
    { id: "codebase", label: "Production Source Code", icon: FileCode, group: "Planning" },
    { id: "roadmap", label: "Development Roadmap", icon: LayoutList, group: "Planning" },
  ];

  const handleExportSpec = () => {
    setDownloadingSpec(true);
    
    // Gather system DDL and architectural parameters to export
    const exportData = `--- CASHBRIDGE FINTECH BLUEPRINT SPECIFICATION ---
Generated on: ${new Date().toISOString()}
Target Market: African Market Traders & Small Businesses
Frontend Stack: React 19 + Vite + Tailwind CSS 4
Backend Stack: Express + Node.js + Supabase Admin SDK
Primary Gateways: MTN MoMo Collections Gateway & Paystack Cards Router
State Layer: Local-First IndexedDB Buffering Core with conflict-resolution
Persistence: Supabase PostgreSQL 15 secure cluster

For implementation and deployment guidelines, review the fully interactive UI control board.
===================================================`;

    const blob = new Blob([exportData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cashbridge_architecture_blueprint.txt";
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadingSpec(false);
    }, 1000);
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "system-arch":
        return <SystemArchTab />;
      case "folders":
        return <FolderStructureTab />;
      case "database":
        return <DatabaseTab />;
      case "api":
        return <ApiTab />;
      case "payments":
        return <PaymentFlowsTab />;
      case "offline-sync":
        return <OfflineSyncTab />;
      case "deployment":
        return <DeploymentTab />;
      case "codebase":
        return <CodebaseTab />;
      case "roadmap":
        return <RoadmapTab />;
      default:
        return <SystemArchTab />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <div className="h-4 w-1 bg-white rounded-full mx-0.5 animate-pulse"></div>
            <div className="h-6 w-1 bg-white rounded-full mx-0.5"></div>
            <div className="h-3 w-1 bg-white rounded-full mx-0.5"></div>
          </div>
          <span className="ml-3 text-lg font-bold tracking-tight text-slate-800">CashBridge</span>
        </div>

        {/* Dynamic navigation menu */}
        <nav className="flex-grow overflow-y-auto p-4 space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Project Spec
            </div>
            <div className="space-y-1">
              {menuItems
                .filter((item) => item.group === "Project Spec")
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`mr-3 h-4 w-4 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Planning
            </div>
            <div className="space-y-1">
              {menuItems
                .filter((item) => item.group === "Planning")
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`mr-3 h-4 w-4 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
            </div>
          </div>
        </nav>

        {/* Floating branding panel */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="bg-slate-900 rounded-lg p-3 text-white">
            <div className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Target Market</div>
            <div className="text-xs font-bold flex items-center justify-between">
              <span>African Market Traders</span>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 lines-clamp-2">Optimized lightweight interface running local offline databases.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header bar */}
        <header className="flex h-16 items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-sm border-r border-slate-200 pr-3 font-bold text-slate-800 uppercase tracking-tight">
              CashBridge Blueprint Center
            </h1>
            <span className="hidden sm:flex items-center text-slate-400 text-xs font-mono">
              <Compass className="h-4 w-4 mr-1 text-slate-350" />
              {menuItems.find((m) => m.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mr-2 animate-ping"></span>
              Production Ready Specs
            </span>
            <button
              onClick={handleExportSpec}
              disabled={downloadingSpec}
              className="px-3.5 py-1.5 bg-blue-600 outline-none border-none hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{downloadingSpec ? "Exporting..." : "Download Blueprint Spec"}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mobile Tab Swapper Header */}
          <div className="md:hidden flex overflow-x-auto space-x-2 pb-2 scrollbar-none border-b border-slate-200 shrink-0">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight shrink-0 transition-colors ${
                  activeTab === item.id 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-slate-650 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Active workspace content view */}
          <div className="max-w-7xl mx-auto">
            {renderActiveTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
