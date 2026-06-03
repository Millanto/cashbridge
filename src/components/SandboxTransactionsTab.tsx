import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Smartphone, 
  Coins, 
  CreditCard, 
  User, 
  RefreshCcw,
  BookOpen
} from "lucide-react";
import { db, type LocalTransaction, type LocalCustomer } from "../services/db";
import { SyncEngine } from "../services/syncEngine";
import { Button } from "./ui/Button";

export default function SandboxTransactionsTab() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // UI filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [syncFilter, setSyncFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal toggle states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Sales");
  const [newMethod, setNewMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD" | "DEBT">("MOBILE_MONEY");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Track network state changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 1. Fetch Transactions from IndexedDB using React Query
  const { data: transactions = [], isLoading } = useQuery<LocalTransaction[]>({
    queryKey: ["sandboxTransactions"],
    queryFn: async () => {
      const txs = await db.transactions.toArray();
      // Sort newer to older
      return txs.sort((a, b) => b.offlineCreatedAt.localeCompare(a.offlineCreatedAt));
    },
    refetchInterval: 3000 // Polling backup to instantly sync Dexie changes
  });

  // 2. Fetch Customers to link to debts
  const { data: customers = [] } = useQuery<LocalCustomer[]>({
    queryKey: ["customersList"],
    queryFn: async () => {
      return await db.customers.toArray();
    }
  });

  // 3. React Query Mutation to add a record with Optimistic Updates
  const transactionMutation = useMutation({
    mutationFn: async (newTx: {
      description: string;
      amount: number;
      category: string;
      paymentMethod: "CASH" | "MOBILE_MONEY" | "CARD" | "DEBT";
      customerId?: string;
    }) => {
      // Create local transaction record via SyncEngine
      const localId = await SyncEngine.recordTransactionOffline({
        description: newTx.description,
        amount: newTx.amount,
        category: newTx.category,
        paymentMethod: newTx.paymentMethod
      });

      // If method is DEBT and a customer is attached, link it to customer debt
      if (newTx.paymentMethod === "DEBT" && newTx.customerId) {
        const debtId = `debt-${Date.now()}`;
        await db.debts.add({
          debtId,
          customerId: newTx.customerId,
          transactionId: localId,
          amount: newTx.amount,
          remainingAmount: newTx.amount,
          status: "unpaid",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 14 days due
          createdAt: new Date().toISOString()
        });

        // Increment customer debt values
        const customer = await db.customers.where("customerId").equals(newTx.customerId).first();
        if (customer) {
          await db.customers.update(customer.id!, {
            totalDebtGHS: customer.totalDebtGHS + newTx.amount,
            remainingDebtGHS: customer.remainingDebtGHS + newTx.amount
          });
        }
      }

      // Automatically trigger Auto Sync background process when online
      if (navigator.onLine) {
        await SyncEngine.drainQueue();
      }
      return localId;
    },
    // Optimistic cache update before execution finishes
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ["sandboxTransactions"] });
      const previousTxs = queryClient.getQueryData<LocalTransaction[]>(["sandboxTransactions"]) || [];
      
      const tempId = `tx-temp-${Date.now()}`;
      const optimisticTx: LocalTransaction = {
        id: Math.floor(Math.random() * -100000), // temp id
        localId: tempId,
        description: newTx.description,
        amount: newTx.amount,
        category: newTx.category,
        paymentMethod: newTx.paymentMethod,
        offlineCreatedAt: new Date().toISOString(),
        synced: 0,
        syncFailed: 0,
        retryCount: 0
      };

      queryClient.setQueryData(["sandboxTransactions"], [optimisticTx, ...previousTxs]);
      return { previousTxs };
    },
    onError: (err, newTx, context) => {
      if (context?.previousTxs) {
        queryClient.setQueryData(["sandboxTransactions"], context.previousTxs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sandboxTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["customersList"] });
      queryClient.invalidateQueries({ queryKey: ["debtsList"] });
    }
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;

    transactionMutation.mutate({
      description: newDesc,
      amount: parseFloat(newAmount),
      category: newCategory,
      paymentMethod: newMethod,
      customerId: selectedCustomerId || undefined
    });

    // Reset states and close modal
    setNewDesc("");
    setNewAmount("");
    setSelectedCustomerId("");
    setIsModalOpen(false);
  };

  // 4. Client Side Search, Filter & Pagination computes
  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.localId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "ALL" || tx.category === categoryFilter;
    
    let matchesSync = true;
    if (syncFilter === "SYNCED") matchesSync = tx.synced === 1;
    if (syncFilter === "UNSYNCED") matchesSync = tx.synced === 0;

    return matchesSearch && matchesCategory && matchesSync;
  });

  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage) || 1;
  const paginatedTxs = filteredTxs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const triggerSyncDrain = async () => {
    await SyncEngine.drainQueue();
    queryClient.invalidateQueries({ queryKey: ["sandboxTransactions"] });
  };

  return (
    <div className="space-y-6">
      {/* Upper overview status panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit mb-1.5">
            Module Prototype
          </span>
          <h2 className="text-lg font-bold text-slate-800">Journal Transactions & Sales Ledger</h2>
          <p className="text-xs text-slate-500">Live offline-first ledger simulation mapping out MTN MoMo, cash sales and customer book-debts.</p>
        </div>

        <div className="flex gap-2.5 w-full md:w-auto self-stretch md:self-auto justify-end">
          <Button 
            variant="secondary" 
            onClick={triggerSyncDrain}
            className="w-auto px-4.5 py-2.5 bg-slate-900 border-none hover:bg-slate-850 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Synchronize Sync-Queue</span>
          </Button>

          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-auto px-4.5 py-2.5 bg-blue-600 border-none hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Main filter, list card columns */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search sales desc, UUID codes or inputs..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter dropdown */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-2">
              <Filter className="h-3.5 w-3.5 text-slate-400 mr-2" />
              <select 
                value={categoryFilter} 
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="text-xs bg-transparent border-none font-bold text-slate-650 focus:outline-none outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Sales">Sales (Inbound)</option>
                <option value="Inventory">Inventory Cost</option>
                <option value="Expenses">Expenses</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>

            {/* Sync State Filter dropdown */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2">
              <select 
                value={syncFilter} 
                onChange={(e) => { setSyncFilter(e.target.value); setCurrentPage(1); }}
                className="text-xs bg-transparent border-none font-bold text-slate-650 focus:outline-none outline-none"
              >
                <option value="ALL">All Sync States</option>
                <option value="SYNCED">Synced with Cloud</option>
                <option value="UNSYNCED">IndexedDB Queued</option>
              </select>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-150 text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Date Created</th>
                <th className="px-5 py-3.5">Local Queue UUID</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Network Sync Status</th>
                <th className="px-5 py-3.5 text-right">Amt (₵ GHS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, id) => (
                  <tr key={id} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-10 py-3.5"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No active transaction logs found matching current parameters.
                  </td>
                </tr>
              ) : (
                paginatedTxs.map((tx) => {
                  const methodColors = {
                    CASH: "bg-emerald-50 text-emerald-800 border-emerald-150",
                    MOBILE_MONEY: "bg-blue-50 text-blue-800 border-blue-150",
                    CARD: "bg-purple-50 text-purple-800 border-purple-150",
                    DEBT: "bg-amber-50 text-amber-800 border-amber-150"
                  };

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-mono text-[10.5px] text-slate-400">
                        {new Date(tx.offlineCreatedAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-500 text-[10px] max-w-[130px] truncate">
                        {tx.localId}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800 text-xs block">{tx.description}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{tx.category}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 border rounded-md font-bold text-[9px] ${methodColors[tx.paymentMethod] || "bg-slate-100"}`}>
                          {tx.paymentMethod === "MOBILE_MONEY" ? "MoMo" : tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {tx.synced === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                            CLOUD SETTLED
                          </span>
                        ) : tx.syncFailed === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="h-3 w-3 mr-1 text-rose-500" />
                            SYNC LOCKED (RETRYING)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3 mr-1 text-amber-500 animate-pulse" />
                            INDEXEDDB QUEUED
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-slate-800">
                        ₵{tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>
            Showing <span className="text-slate-800">{filteredTxs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{" "}
            <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredTxs.length)}</span> of{" "}
            <span className="text-slate-800">{filteredTxs.length}</span> journals
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* CREATE TRANSACTION MODAL WRAPPER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Record Trade Transaction
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Description / Product</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Graded organic robusta cocoa"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Amount (₵ GHS)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 1950"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Category</label>
                  <select 
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Sales">Sales (Inbound)</option>
                    <option value="Inventory">Inventory Cost</option>
                    <option value="Expenses">Expenses</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>
              </div>

              {/* Payment Method selectors */}
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Payment Settlement Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMethod("MOBILE_MONEY")}
                    className={`p-3 border rounded-xl flex items-center justify-start gap-2 text-xs transition-all ${
                      newMethod === "MOBILE_MONEY" 
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" 
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Smartphone className="h-4 w-4 shrink-0" />
                    <span>MoMo Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMethod("CASH")}
                    className={`p-3 border rounded-xl flex items-center justify-start gap-2 text-xs transition-all ${
                      newMethod === "CASH" 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold" 
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Coins className="h-4 w-4 shrink-0" />
                    <span>Liquid Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMethod("CARD")}
                    className={`p-3 border rounded-xl flex items-center justify-start gap-2 text-xs transition-all ${
                      newMethod === "CARD" 
                        ? "border-purple-500 bg-purple-50 text-purple-700 font-bold" 
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span>Visa / Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMethod("DEBT")}
                    className={`p-3 border rounded-xl flex items-center justify-start gap-2 text-xs transition-all ${
                      newMethod === "DEBT" 
                        ? "border-amber-500 bg-amber-50 text-amber-700 font-bold" 
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span>Book Credit</span>
                  </button>
                </div>
              </div>

              {/* Conditional Customer linkage for Debts */}
              {newMethod === "DEBT" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-1.5 duration-150">
                  <label className="text-[9px] font-bold text-amber-800 uppercase block">Assign Debtor Profile</label>
                  <select 
                    required={newMethod === "DEBT"}
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.name} ({c.companyName || "Solo"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button 
                type="submit" 
                isLoading={transactionMutation.isPending}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white block rounded-xl font-bold w-full text-xs shadow-md mt-6"
              >
                Commit Journal Receipt
              </Button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
