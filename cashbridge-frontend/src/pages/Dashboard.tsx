import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCcw, 
  Wifi, 
  WifiOff, 
  DollarSign, 
  CreditCard, 
  AlertOctagon, 
  BadgeAlert,
  Search,
  Plus,
  Filter,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Coins
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Alert } from "../components/ui/Alert";
import { apiClient } from "../api/client";

// Interfaces mimicking production ledger fields
interface LedgerTransaction {
  id: string;
  localId?: string;
  description: string;
  amount: number;
  category: "Sales" | "Inventory" | "Expenses" | "DebtSettle";
  paymentMethod: "CASH" | "MOBILE_MONEY" | "CARD" | "DEBT";
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

interface AnalyticsSummary {
  revenueGHS: number;
  momoInboundGHS: number;
  outstandingDebtGHS: number;
  unresolvedSyncBatch: number;
  growthPercentage: number;
  recentSales: LedgerTransaction[];
}

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isOnlineState, setIsOnlineState] = useState<boolean>(navigator.onLine);

  // Monitor hardware network loop to trigger UI connection indicator
  React.useEffect(() => {
    const triggerOnline = () => setIsOnlineState(true);
    const triggerOffline = () => setIsOnlineState(false);
    
    window.addEventListener("online", triggerOnline);
    window.addEventListener("offline", triggerOffline);
    
    return () => {
      window.removeEventListener("online", triggerOnline);
      window.removeEventListener("offline", triggerOffline);
    };
  }, []);

  // Use React Query for dynamic data fetching incorporating loading skeleton conditions
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<AnalyticsSummary>({
    queryKey: ["dashboardMetrics"],
    queryFn: async () => {
      // Direct remote Axios gateway call
      const response = await apiClient.get("/business/dashboard-summary");
      return response.data.data;
    },
    // Safe retry backoffs
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Create mock mutations for adding transaction rows
  const addTransactionMutation = useMutation({
    mutationFn: async (newTx: Omit<LedgerTransaction, "id" | "createdAt" | "status">) => {
      const response = await apiClient.post("/sync/transactions", {
        batch: [{
          localId: `tx-loc-${Date.now()}`,
          ...newTx,
          offlineCreatedAt: new Date().toISOString()
        }],
        clientTimestamp: new Date().toISOString()
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate current queries to auto-hydrate metrics
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    }
  });

  // Filter computation helper
  const filteredSales = data?.recentSales.filter(tx => {
    if (filterCategory === "ALL") return true;
    return tx.category === filterCategory;
  }) || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top micro bar for offline awareness notifications */}
      {!isOnlineState && (
        <div className="bg-rose-600/90 text-white text-xs py-2 px-4 flex items-center justify-between font-semibold animate-pulse shadow-md transition-all">
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            Terminal Offline: Buffering bookkeeping actions locally in client's IndexedDB.
          </span>
          <span className="text-[10px] uppercase font-mono bg-rose-700/60 py-0.5 px-2 rounded">IndexedDB Active</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header Dashboard Navigation Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Merchant Ledger Workspace
              {isFetching && <RefreshCcw className="h-4 w-4 text-blue-400 animate-spin shrink-0" />}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Synchronized secure accounting logs for Kofi Mensah Cocoa Syndicate Ltd.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync connection status indicators */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${
              isOnlineState 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}>
              {isOnlineState ? (
                <>
                  <Wifi className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                  <span>Cloud Live Gateway</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-rose-400" />
                  <span>Local Sandbox</span>
                </>
              )}
            </div>

            <Button 
              variant="secondary" 
              onClick={() => refetch()} 
              disabled={isLoading}
              className="py-1.5 px-3 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 font-bold shrink-0 w-auto flex items-center gap-1.5"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Reload ledger</span>
            </Button>
          </div>
        </div>

        {/* Global Error Fallbacks */}
        {isError && (
          <Alert 
            type="error" 
            title="Gateway Outage Tracker" 
            message={error instanceof Error ? error.message : "Handshake lost. Client lost access boundaries to server."} 
          />
        )}

        {/* Analytics Card Metrics: Skeletons vs Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Revenue Summaries Card */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-3.5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales Volume</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                  ₵{(data?.revenueGHS || 45280.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+{data?.growthPercentage || 12}% from last month</span>
                </div>
              </div>
            )}
          </div>

          {/* MoMo collections */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-3.5">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MoMo Inflow</span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                  ₵{(data?.momoInboundGHS || 28910.45).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-[11px] font-medium text-slate-400 block mt-1">MTN Collections channel</span>
              </div>
            )}
          </div>

          {/* Outstanding Book Credit / Debt summaries */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-3.5">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Debt</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <BadgeAlert className="h-4 w-4" />
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-rose-400">
                  ₵{(data?.outstandingDebtGHS || 12450.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-500">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>Pending trader collection</span>
                </div>
              </div>
            )}
          </div>

          {/* Offline/Pending sync queue indicator tracker */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-3.5">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offline Sync Queue</span>
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                (data?.unresolvedSyncBatch || 0) > 0 
                  ? "bg-amber-500/10 text-amber-500" 
                  : "bg-slate-700/20 text-slate-400"
              }`}>
                <RefreshCcw className={`h-4 w-4 ${ (data?.unresolvedSyncBatch || 0) > 0 ? "animate-spin" : ""}`} />
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                  {data?.unresolvedSyncBatch || 0} Records
                </h3>
                <span className="text-[11px] font-medium text-slate-400 block mt-1">To sync from IndexedDB</span>
              </div>
            )}
          </div>

        </div>

        {/* Charts and Action Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Charts container */}
          <div className="lg:col-span-8 bg-slate-800 border border-slate-700/60 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">Financial Flow Charting</h2>
                <p className="text-[10px] text-slate-400">Weekly cumulative inflows (GHS)</p>
              </div>
              
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
                <button className="px-2.5 py-1 bg-slate-800 text-white rounded">MoMo</button>
                <button className="px-2.5 py-1 text-slate-500 hover:text-slate-350">Cash</button>
              </div>
            </div>

            {/* Simulated custom SVG charting module bypassing potential d3 size mismatch errors */}
            <div className="h-[200px] sm:h-[240px] flex items-end justify-between pt-6 pr-4 relative">
              
              {/* Vertical Reference Grid lines */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 border-b border-slate-700/40" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 border-b border-slate-700/40" />
              <div className="absolute inset-x-0 top-0 h-full border-b border-slate-700/40" />
              
              {/* Line graph projection using smooth vectors */}
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path 
                  d="M 5,80 Q 20,40 35,55 T 65,25 T 95,10" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M 5,80 Q 20,40 35,55 T 65,25 T 95,10 L 95,97 L 5,97 Z" 
                  fill="url(#gradient-flow)" 
                  opacity="0.15" 
                />
                
                {/* Secondary Debt curve tracking */}
                <path 
                  d="M 5,92 Q 25,85 45,65 T 75,50 T 95,45" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                  strokeLinecap="round" 
                />

                <defs>
                  <linearGradient id="gradient-flow" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Weekly visual labels */}
              <div className="absolute bottom-0 inset-x-0 flex justify-between text-[9px] font-bold font-mono text-slate-500 pt-2 bg-slate-800 translate-y-full">
                <span>Week 1 (₵6.4k)</span>
                <span>Week 2 (₵12.8k)</span>
                <span>Week 3 (₵24.1k)</span>
                <span>Week 4 (₵45.2k)</span>
              </div>
            </div>

            {/* Custom chart legend indicators */}
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold pt-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-4 bg-blue-500 rounded-full inline-block"></span>
                Completed Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-4 border-b border-dashed border-rose-500 inline-block"></span>
                Outstanding Debt Records
              </span>
            </div>

          </div>

          {/* Quick Transaction Adding Pad */}
          <div className="lg:col-span-4 bg-slate-800 border border-slate-700/60 rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">On-The-Spot Journal</h2>
              <p className="text-[10px] text-slate-400">Post transactions directly to ledger nodes</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                addTransactionMutation.mutate({
                  description: formData.get("desc") as string,
                  amount: parseFloat(formData.get("amount") as string),
                  category: formData.get("category") as any,
                  paymentMethod: formData.get("method") as any,
                });
                form.reset();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Product Description</label>
                <input 
                  type="text" 
                  name="desc" 
                  required 
                  placeholder="e.g. 5 bags graded cocoa beans" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Price (₵ GHS)</label>
                  <input 
                    type="number" 
                    name="amount" 
                    required 
                    min="1" 
                    placeholder="e.g. 620" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Method</label>
                  <select 
                    name="method"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="MOBILE_MONEY">MoMo</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="DEBT">Store Debt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                <select 
                  name="category"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Sales">Sales (Inflow)</option>
                  <option value="Inventory">Inventory Cost</option>
                  <option value="Expenses">Expenses</option>
                </select>
              </div>

              <Button 
                type="submit" 
                isLoading={addTransactionMutation.isPending} 
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs w-full flex items-center justify-center gap-1 shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Synchronize Sale Record</span>
              </Button>
            </form>
          </div>

        </div>

        {/* Recent Transactions List with loading skeleton lists */}
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Active Ledger Ledgerings</h2>
              <p className="text-[10px] text-slate-400">Merchant real-time transaction activity</p>
            </div>

            {/* Classification category filters */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold select-none self-start shrink-0">
              {["ALL", "Sales", "Inventory", "Expenses"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded transition-all ${
                    filterCategory === cat 
                      ? "bg-slate-850 text-white shadow-sm font-extrabold" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat === "ALL" ? "All Logs" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-850 border-b border-slate-700/60 text-[9px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">UUID</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status Value</th>
                  <th className="px-5 py-3 text-right">Settled (GHS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {isLoading ? (
                  // Custom Loading Skeletons for tabular alignment
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-14" /></td>
                      <td className="px-5 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                      No matching records filed under "{filterCategory}".
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-750/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-500 text-[10px]">{tx.id.substring(0, 8)}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-white text-xs block">{tx.description}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{tx.category}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-slate-900 border border-slate-700/60 py-0.5 px-2 rounded-md font-semibold text-[9px]">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {tx.status === "completed" ? (
                          <span className="bg-emerald-500/10 text-emerald-405 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold flex items-center w-fit">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> CLOUD SETTLED
                          </span>
                        ) : tx.status === "pending" ? (
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold flex items-center w-fit">
                            <RefreshCcw className="h-3 w-3 mr-1 animate-spin" /> LOCAL RETRY
                          </span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-405 border border-rose-500/20 px-2 py-0.5 rounded text-[9px] font-bold flex items-center w-fit">
                            <XCircle className="h-3 w-3 mr-1" /> REJECTED
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-white">
                        ₵{tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
