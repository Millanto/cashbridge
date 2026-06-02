import React, { useState, useEffect } from "react";
import { Signal, SignalHigh, WifiOff, FileText, Plus, RefreshCcw, Send, CheckCircle, Database, Trash2, AlertCircle } from "lucide-react";
import { db, type LocalTransaction } from "../services/db";
import { SyncEngine } from "../services/syncEngine";

export default function OfflineSyncTab() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Sales");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD" | "DEBT">("CASH");
  
  // Real layout state synced with Dexie tables
  const [localDB, setLocalDB] = useState<LocalTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // 1. Setup Live listeners to SyncEngine telemetry and Dexie
  useEffect(() => {
    // Sync status connection
    const handleStateChange = (status: boolean) => {
      setIsOnline(status);
    };

    // Capture sync telemetry output
    const handleLog = (message: string) => {
      setSyncLogs((prev) => [message, ...prev].slice(0, 50)); // limit log output to 50
    };

    SyncEngine.addStateListener(handleStateChange);
    SyncEngine.addLogListener(handleLog);
    SyncEngine.init();

    // Load initial records
    refreshLocalRecords();

    // Log initialization trace
    setSyncLogs([
      `[DATABASE READY] CashBridge IndexedDB (Dexie) is online & tracking.`,
      `[CONNECTION STATUS] Running in ${navigator.onLine ? "ONLINE" : "OFFLINE"} state.`
    ]);

    return () => {
      SyncEngine.removeStateListener(handleStateChange);
      SyncEngine.removeLogListener(handleLog);
    };
  }, []);

  // Hydrate UI state from IndexedDB
  const refreshLocalRecords = async () => {
    const records = await db.transactions.toArray();
    // Sort so newer items are on top
    records.sort((a, b) => b.offlineCreatedAt.localeCompare(a.offlineCreatedAt));
    setLocalDB(records);
  };

  // 2. Handle adding offline entries
  const addOfflineRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      await SyncEngine.recordTransactionOffline({
        description,
        amount: parseFloat(amount),
        category,
        paymentMethod
      });

      // Clear state and refresh layout records
      setDescription("");
      setAmount("");
      refreshLocalRecords();
    } catch (err: any) {
      setSyncLogs((prev) => [`❌ IndexedDB Insert aborted: ${err.message}`, ...prev]);
    }
  };

  // 3. Trigger live background sync flow
  const triggerSync = async () => {
    setIsSyncing(true);
    setSyncLogs((prev) => ["🔄 Initializing manual batch queue synchronization request...", ...prev]);

    try {
      // Temporarily override navigator.onLine for offline simulation support
      const originalOnLine = navigator.onLine;
      if (!isOnline) {
        setSyncLogs((prev) => [
          "[SYNC BLOCKED] Connection status is currently toggled to OFFLINE. Cannot establish connection to server gateways.",
          ...prev
        ]);
        setIsSyncing(false);
        return;
      }

      const success = await SyncEngine.drainQueue();
      if (success) {
        await refreshLocalRecords();
      }
    } catch (err: any) {
      setSyncLogs((prev) => [`⚠️ Handshake failed during manual queue sync: ${err.message}`, ...prev]);
    } finally {
      setIsSyncing(false);
    }
  };

  // Connection override toggles to mock real market conditions
  const setSimulatedConnection = (onlineState: boolean) => {
    setIsOnline(onlineState);
    
    // Dispatch fake browser events so the engine catches state changes
    setSyncLogs((prev) => [
      `[SIMULATOR TRACE] Network connection toggled to: ${onlineState ? "ONLINE" : "OFFLINE"}`,
      ...prev
    ]);

    // Force call engine to drain if shifting to online state
    if (onlineState) {
      setTimeout(() => {
        SyncEngine.triggerAutoSync();
        refreshLocalRecords();
      }, 500);
    }
  };

  // Delete matching index item
  const deleteRecord = async (id?: number) => {
    if (!id) return;
    await db.transactions.delete(id);
    setSyncLogs((prev) => [`🗑️ Row deleted from IndexedDB table [id: ${id}]`, ...prev]);
    refreshLocalRecords();
  };

  // Truncate whole local index table
  const truncateStore = async () => {
    await SyncEngine.resetLocalStore();
    setSyncLogs((prev) => ["🧹 Safely cleared all local records stored in browser IndexedDB.", ...prev]);
    refreshLocalRecords();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden col-span-12">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">IndexedDB Dexie.js Core Sync Architecture</h2>
            <p className="text-xs text-slate-500">Dual-state queuing engine facilitating offline journaling for low-bandwidth traders</p>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            {/* Toggle Connectivity modes */}
            <button
              type="button"
              onClick={() => setSimulatedConnection(false)}
              className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                !isOnline
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <WifiOff className="h-4 w-4 mr-1.5" />
              Slow / Offline Mode
            </button>
            <button
              type="button"
              onClick={() => setSimulatedConnection(true)}
              className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
                isOnline
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <SignalHigh className="h-4 w-4 mr-1.5" />
              Online Cloud Activated
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-50 border border-slate-150 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-700 flex items-center">
                <FileText className="h-4 w-4 text-blue-500 mr-1.5" />
                Add Bookkeeping Journal (Offline-Safe)
              </h3>
              
              <form onSubmit={addOfflineRecord} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sale Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    placeholder="e.g. bulk raw cocoa beans"
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
                      step="any"
                      value={amount}
                      placeholder="e.g. 450"
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
                      <option value="Sales">Sales (Inbound)</option>
                      <option value="Inventory">Inventory Cost</option>
                      <option value="Logistics">Logistics Expense</option>
                      <option value="Rent">Rent & Utilities</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Liquid Cash</option>
                    <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                    <option value="CARD">Visa / Mastercard</option>
                    <option value="DEBT">Store Book Credit (Debt)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-lg transition-all flex items-center justify-center space-x-1 shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Offline to IndexedDB</span>
                </button>
              </form>
            </div>

            {/* Sync control & diagnostics dashboard */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Local Memory Sync Control</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={isSyncing}
                  onClick={triggerSync}
                  className="py-2.5 px-3 bg-slate-900 text-slate-100 hover:bg-slate-850 disabled:bg-slate-400 font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1 shadow-sm"
                >
                  {isSyncing ? (
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{isSyncing ? "Syncing..." : "Sync Handshake"}</span>
                </button>

                <button
                  onClick={truncateStore}
                  className="py-2.5 px-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Truncate DB</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table display & Logs terminal */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <Database className="h-4 w-4 mr-1.5 text-blue-500" />
                  Active Dexie.js Client Database Queue
                </span>
                <span className="text-[9px] bg-amber-100 font-mono text-amber-800 px-2 py-0.5 rounded font-bold">
                  {localDB.filter((x) => x.synced === 0).length} Unsynced Logs
                </span>
              </div>
              <div className="overflow-x-auto max-h-[280px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-150 text-[9.5px] uppercase text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Local UUID Identifier</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">GHS Amount</th>
                      <th className="px-4 py-3 font-semibold">Method</th>
                      <th className="px-4 py-3 font-semibold">Sync Status Value</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localDB.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                          Browser's IndexedDB is currently empty. Insert high-value sales using the form on the left.
                        </td>
                      </tr>
                    ) : (
                      localDB.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10px] truncate max-w-[120px]">{item.localId}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.description}</td>
                          <td className="px-4 py-3 font-mono text-slate-700 font-bold">{item.amount.toFixed(2)} GHS</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-[9px] font-mono bg-slate-100 text-slate-600 rounded font-semibold">{item.paymentMethod}</span>
                          </td>
                          <td className="px-4 py-3">
                            {item.synced === 1 ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center w-fit border border-emerald-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                SYNCED CLOUD
                              </span>
                            ) : item.syncFailed === 1 ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 flex items-center w-fit border border-rose-200" title={item.syncError}>
                                <AlertCircle className="h-3 w-3 mr-1 text-rose-600" />
                                FAILURE (RETRYING)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center w-fit border border-amber-200">
                                <RefreshCcw className="h-3 w-3 mr-1 text-amber-600 animate-spin" />
                                QUEUE PENDING
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteRecord(item.id)}
                              className="text-slate-400 hover:text-rose-650 transition-colors p-1"
                              title="Delete local row record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terminal logs interface */}
            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950 text-slate-100 font-mono text-[10px] p-4 h-[140px] overflow-y-auto space-y-1">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-1 border-b border-slate-800 pb-1">Real-Time Dexie Sync telemetry loops:</span>
              {syncLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-6">Waiting for Dexie.js action inputs...</div>
              ) : (
                syncLogs.map((log, id) => (
                  <div key={id} className={`${log.includes("❌") || log.includes("🛑") ? "text-rose-400" : log.includes("✅") || log.includes("✨") ? "text-emerald-400" : "text-slate-300"}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
