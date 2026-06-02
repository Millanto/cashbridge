import React, { useState } from "react";
import { Signal, SignalHigh, WifiOff, FileText, Plus, RefreshCcw, Send, CheckCircle, Database } from "lucide-react";

interface LocalLedger {
  local_id: string;
  description: string;
  amount: number;
  offline_created_at: string;
  synced: boolean;
}

export default function OfflineSyncTab() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Sales");
  const [localDB, setLocalDB] = useState<LocalLedger[]>([
    { local_id: "tx-local-1", description: "Baskets of Tomatoes", amount: 120.00, offline_created_at: "2026-06-02T19:40:00Z", synced: false },
    { local_id: "tx-local-2", description: "Cassava Sacks (Bulk)", amount: 350.00, offline_created_at: "2026-06-02T19:55:00Z", synced: false }
  ]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const addOfflineRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newRecord: LocalLedger = {
      local_id: `tx-local-${Date.now()}`,
      description,
      amount: parseFloat(amount),
      offline_created_at: new Date().toISOString(),
      synced: isOnline // If already online, it can go direct (simulated) but usually goes to DB
    };

    setLocalDB(prev => [...prev, newRecord]);
    setDescription("");
    setAmount("");
  };

  const triggerSync = () => {
    if (!isOnline) {
      setSyncLogs(["[SYNC BLOCKED] Connection status is currently set to OFFLINE. Cannot contact API endpoints."]);
      return;
    }

    const unsyncedItems = localDB.filter(x => !x.synced);
    if (unsyncedItems.length === 0) {
      setSyncLogs(["[SYNC SYSTEM] All items inside IndexedDB match cloud database schemas. No updates necessary."]);
      return;
    }

    setIsSyncing(true);
    setSyncLogs([
      `[SYNC START] Extracting ${unsyncedItems.length} unsynced items from IndexedDB database...`,
      "Enqueuing payload data to server endpoint `/api/sync`...",
      "Postgres server checking merge duplicates..."
    ]);

    setTimeout(() => {
      setLocalDB(prev => prev.map(item => ({ ...item, synced: true })));
      setSyncLogs(prev => [
        ...prev,
        "[DATABASE BLOCK SUCCESS] No conflict IDs found. Batch inserting values...",
        `[SYNC COMPLETE] ${unsyncedItems.length} bookkeeping records merged to profiles dashboard successfully. Status changed to SYNCED.`
      ]);
      setIsSyncing(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden col-span-12">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">IndexedDB Local Offline Sync Simulator</h2>
            <p className="text-xs text-slate-500">Live-simulates African trader operations in highly unstable network arenas</p>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            {/* Toggle Status bar */}
            <button
              type="button"
              onClick={() => {
                setIsOnline(false);
                setSyncLogs(prev => [...prev, "[SYSTEM WARNING] Connection state shifted to OFFLINE."]);
              }}
              className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                !isOnline
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-650 hover:text-slate-900"
              }`}
            >
              <WifiOff className="h-4 w-4 mr-1.5" />
              Slow / Offline Port (Cell Tower Cut)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOnline(true);
                setSyncLogs(prev => [...prev, "[SYSTEM NOTIFICATION] Cellular grid connected. Cloud API pathways active."]);
              }}
              className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                isOnline
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-650 hover:text-slate-900"
              }`}
            >
              <SignalHigh className="h-4 w-4 mr-1.5" />
              Online / Base Network Active
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick inputs form */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-700 flex items-center">
                <FileText className="h-4 w-4 text-blue-500 mr-1.5" />
                Add Bookkeeping Journal
              </h3>
              
              <form onSubmit={addOfflineRecord} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sale Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    placeholder="e.g. wholesale plantains"
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">GHS Price Volume</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      placeholder="e.g. 250"
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Classification Type</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Sales">Sales (Sale Credit)</option>
                      <option value="Debt Pay">Debt Payment</option>
                      <option value="Inventory Cost">Inventory Cost</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-lg transition-transform flex items-center justify-center space-x-1 shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record {isOnline ? "Directly" : "Offline in IndexedDB"}</span>
                </button>
              </form>
            </div>

            {/* Sync trigger button */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Local Memory Sync Control</span>
              
              <button
                disabled={isSyncing}
                onClick={triggerSync}
                className="w-full py-2 bg-slate-900 text-slate-100 hover:bg-slate-850 disabled:bg-slate-400 font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow"
              >
                {isSyncing ? (
                  <>
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Draining Queue to Cloud...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Trigger Background Sync Worker</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Local storage simulator display queue */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <Database className="h-4 w-4 mr-1.5 text-blue-500" />
                  Live IndexedDB Client Memory Store (Mock)
                </span>
                <span className="text-[9px] bg-amber-100 font-mono text-amber-800 px-2 py-0.5 rounded">
                  {localDB.filter(x => !x.synced).length} Pending Syncs
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9.5px] uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Local UUID Key</th>
                      <th className="px-4 py-3 font-semibold">Item Ledger Description</th>
                      <th className="px-4 py-3 font-semibold">GHS Amount</th>
                      <th className="px-4 py-3 font-semibold">Device Timestamp</th>
                      <th className="px-4 py-3 font-semibold">Status Sync Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localDB.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                          IndexedDB is empty. Create some bookkeeping items offline utilizing the form.
                        </td>
                      </tr>
                    ) : (
                      localDB.map((item) => (
                        <tr key={item.local_id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10.5px]">{item.local_id}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{item.description}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 font-semibold">{item.amount.toFixed(2)} GHS</td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-[10.5px]">
                            {item.offline_created_at.split("T")[1].substring(0, 8)}
                          </td>
                          <td className="px-4 py-3">
                            {item.synced ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center w-fit border border-emerald-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                SYNCED CLOUD
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center w-fit border border-amber-200 animate-pulse">
                                <RefreshCcw className="h-3 w-3 mr-1 text-amber-600 animate-spin" />
                                QUEUE WAITING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Debug logs output of synchronization algorithm */}
            {syncLogs.length > 0 && (
              <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950 text-slate-100 font-mono text-[10px] p-4 h-[120px] overflow-y-auto space-y-1.5 shrink-0">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Queue Synchronization Logs:</span>
                {syncLogs.map((log, id) => (
                  <div key={id} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
