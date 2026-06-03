import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Coins, 
  UserPlus, 
  DollarSign, 
  Calendar, 
  Smartphone, 
  TrendingDown, 
  BadgeAlert, 
  X, 
  UserCheck, 
  ChevronRight, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertTriangle,
  History,
  FileMinus,
  MessageSquare
} from "lucide-react";
import { db, type LocalCustomer, type LocalDebt, type LocalRepayment } from "../services/db";
import { Button } from "./ui/Button";

export default function SandboxCustomersTab() {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modal toggle states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);

  // Form states - Customer creation
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custCompany, setCustCompany] = useState("");
  const [initialDebt, setInitialDebt] = useState("");

  // Form states - Repayment posting
  const [repaymentAmt, setRepaymentAmt] = useState("");
  const [repayMethod, setRepayMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD">("MOBILE_MONEY");

  // Load Customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery<LocalCustomer[]>({
    queryKey: ["customersList"],
    queryFn: async () => {
      return await db.customers.toArray();
    }
  });

  // Load Debts
  const { data: debts = [] } = useQuery<LocalDebt[]>({
    queryKey: ["debtsList"],
    queryFn: async () => {
      return await db.debts.toArray();
    }
  });

  // Load Repayments
  const { data: repayments = [] } = useQuery<LocalRepayment[]>({
    queryKey: ["repaymentsList"],
    queryFn: async () => {
      return await db.repayments.toArray();
    }
  });

  // Derived Analytics stats
  const totalDebtorsCount = customers.filter(c => c.remainingDebtGHS > 0).length;
  const cumulativeOutstandingDebt = customers.reduce((sum, c) => sum + c.remainingDebtGHS, 0);
  const totalRecoveredDebt = repayments.reduce((sum, r) => sum + r.amount, 0);

  // Mutation 1: Create Customer
  const addCustomerMutation = useMutation({
    mutationFn: async (newCust: {
      name: string;
      phone: string;
      email: string;
      companyName?: string;
      initialDebtGHS?: number;
    }) => {
      const customerId = `cust-${Date.now()}`;
      const debtGHS = newCust.initialDebtGHS || 0;

      // Call Dexie table
      await db.customers.add({
        customerId,
        name: newCust.name,
        phone: newCust.phone,
        email: newCust.email,
        companyName: newCust.companyName,
        registeredOffline: true,
        totalDebtGHS: debtGHS,
        remainingDebtGHS: debtGHS
      });

      // Optional initial debt row link
      if (debtGHS > 0) {
        const debtId = `debt-${Date.now()}`;
        const localTxId = `tx-local-debt-${Date.now()}`;

        await db.debts.add({
          debtId,
          customerId,
          transactionId: localTxId,
          amount: debtGHS,
          remainingAmount: debtGHS,
          status: "unpaid",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          createdAt: new Date().toISOString()
        });

        // Register default accompanying journal row
        await db.transactions.add({
          localId: localTxId,
          description: `Initial outstanding credit balance on set up [${newCust.name}]`,
          amount: debtGHS,
          category: "Sales",
          paymentMethod: "DEBT",
          offlineCreatedAt: new Date().toISOString(),
          synced: 0,
          syncFailed: 0,
          retryCount: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customersList"] });
      queryClient.invalidateQueries({ queryKey: ["debtsList"] });
      queryClient.invalidateQueries({ queryKey: ["sandboxTransactions"] });
      setIsCustomerModalOpen(false);
      // Clean inputs
      setCustName("");
      setCustPhone("");
      setCustEmail("");
      setCustCompany("");
      setInitialDebt("");
    }
  });

  // Mutation 2: Record Repayment Incrementally (Deducting oldest remaining debts first)
  const repaymentMutation = useMutation({
    mutationFn: async (pay: {
      customerId: string;
      amount: number;
      method: "CASH" | "MOBILE_MONEY" | "CARD";
    }) => {
      let targetRepayGHS = pay.amount;
      const activeDebtorId = pay.customerId;

      // Load unpaid / partial debts for this customer
      const debtorDebts = await db.debts
        .where("customerId")
        .equals(activeDebtorId)
        .toArray();

      // Sort by earliest checkout date (oldest first)
      debtorDebts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      // 1. Process target repayment across remaining debt structures
      for (const debt of debtorDebts) {
        if (targetRepayGHS <= 0) break;
        if (debt.status === "paid") continue;

        const currentClaim = debt.remainingAmount;
        if (targetRepayGHS >= currentClaim) {
          // Fully pay this debt line
          await db.debts.update(debt.id!, {
            remainingAmount: 0,
            status: "paid"
          });

          // Add single companion repayment logs
          await db.repayments.add({
            repaymentId: `repay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            debtId: debt.debtId,
            amount: currentClaim,
            paymentMethod: pay.method,
            createdAt: new Date().toISOString()
          });

          targetRepayGHS -= currentClaim;
        } else {
          // Offsets partially
          await db.debts.update(debt.id!, {
            remainingAmount: currentClaim - targetRepayGHS,
            status: "partial"
          });

          await db.repayments.add({
            repaymentId: `repay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            debtId: debt.debtId,
            amount: targetRepayGHS,
            paymentMethod: pay.method,
            createdAt: new Date().toISOString()
          });

          targetRepayGHS = 0;
        }
      }

      // 2. Decrement remaining debt on the Customer Profile
      const customer = await db.customers.where("customerId").equals(activeDebtorId).first();
      if (customer) {
        const nextRem = Math.max(0, customer.remainingDebtGHS - pay.amount);
        await db.customers.update(customer.id!, {
          remainingDebtGHS: nextRem
        });
      }

      // 3. Log a positive inflow Cash/MoMo transaction in our transactions bookkeeping list
      await db.transactions.add({
        localId: `tx-repay-${Date.now()}`,
        description: `Debt settlement repayment from merchant - ${customer?.name || "Customer"}`,
        amount: pay.amount,
        category: "DebtSettle",
        paymentMethod: pay.method,
        offlineCreatedAt: new Date().toISOString(),
        synced: 0,
        syncFailed: 0,
        retryCount: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customersList"] });
      queryClient.invalidateQueries({ queryKey: ["debtsList"] });
      queryClient.invalidateQueries({ queryKey: ["repaymentsList"] });
      queryClient.invalidateQueries({ queryKey: ["sandboxTransactions"] });
      setIsRepaymentModalOpen(false);
      setRepaymentAmt("");
    }
  });

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) return;

    addCustomerMutation.mutate({
      name: custName,
      phone: custPhone,
      email: custEmail,
      companyName: custCompany || undefined,
      initialDebtGHS: initialDebt ? parseFloat(initialDebt) : undefined
    });
  };

  const handlePostRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !repaymentAmt) return;

    repaymentMutation.mutate({
      customerId: selectedCustomerId,
      amount: parseFloat(repaymentAmt),
      method: repayMethod
    });
  };

  // Find detailed history context of active selected customer
  const activeCustomer = customers.find(c => c.customerId === selectedCustomerId);
  const activeCustomerDebts = debts.filter(d => d.customerId === selectedCustomerId);
  const activeCustomerRepayments = repayments.filter(r => 
    activeCustomerDebts.some(d => d.debtId === r.debtId)
  );

  return (
    <div className="space-y-6">
      {/* Top statistical deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Debtors</span>
            <h3 className="text-2xl font-bold font-mono text-slate-800">{totalDebtorsCount} Accounts</h3>
            <span className="text-[11px] font-semibold text-rose-500 block">Out of {customers.length} total profiles</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cumulative Debt Value</span>
            <h3 className="text-2xl font-bold font-mono text-rose-600">₵{cumulativeOutstandingDebt.toFixed(2)}</h3>
            <span className="text-[11px] font-semibold text-slate-500 block">Awaiting merchant settlement</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Recovered Book Credits</span>
            <h3 className="text-2xl font-bold font-mono text-emerald-600">₵{totalRecoveredDebt.toFixed(2)}</h3>
            <span className="text-[11px] font-semibold text-emerald-500 block">Offsetted from ledger books</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Coins className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Debtor Grid list */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Debtors Ledger Roll</h3>
                <p className="text-[10px] text-slate-500 font-medium">Click a customer to trace their full history ledger</p>
              </div>
              <Button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="w-auto px-3 py-1.5 bg-blue-600 border-none hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shrink-0 shadow"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Customer</span>
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {loadingCustomers ? (
                Array.from({ length: 4 }).map((_, id) => (
                  <div key={id} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="h-9 w-9 bg-slate-100 rounded-full shrink-0"></div>
                    <div className="space-y-2 flex-grow">
                      <div className="h-3.5 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : customers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  No active customer profiles logged.
                </div>
              ) : (
                customers.map((c) => {
                  const hasDebt = c.remainingDebtGHS > 0;
                  const isCurSelected = selectedCustomerId === c.customerId;

                  return (
                    <div 
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.customerId)}
                      className={`p-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors ${
                        isCurSelected ? "bg-blue-50/40 border-l-4 border-blue-600 pl-3" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                          hasDebt ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>

                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-xs block truncate">{c.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400 block truncate uppercase tracking-tight">
                            {c.companyName || "Independent Trader"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-mono font-extrabold block ${
                          hasDebt ? "text-rose-600" : "text-slate-500"
                        }`}>
                          ₵{c.remainingDebtGHS.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">
                          debt remaining
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-150 text-[10px] text-slate-400 font-bold uppercase text-center block tracking-wide">
            {customers.length} ledger logs compiled
          </div>
        </div>

        {/* Selected Customer Detailed history */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {activeCustomer ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5 flex-grow">
              
              {/* Profile Card Summary */}
              <div className="border-b border-slate-150 pb-4.5 flex justify-between items-start">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Client Dossier</h3>
                  <h2 className="text-base font-extrabold text-slate-800 truncate">{activeCustomer.name}</h2>
                  
                  <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {activeCustomer.phone}
                    </span>
                    <span className="text-slate-400 lowercase">{activeCustomer.email}</span>
                  </div>
                </div>

                {activeCustomer.remainingDebtGHS > 0 && (
                  <Button 
                    onClick={() => setIsRepaymentModalOpen(true)}
                    className="w-auto px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shrink-0 flex items-center justify-center gap-1 shadow-md"
                  >
                    <Coins className="h-4 w-4" />
                    <span>Pay Debt</span>
                  </Button>
                )}
              </div>

              {/* Debt aging categories */}
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Credit Claimed</span>
                  <span className="text-sm font-bold font-mono text-slate-700">₵{activeCustomer.totalDebtGHS.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Pending Settlement</span>
                  <span className="text-sm font-bold font-mono text-rose-600">₵{activeCustomer.remainingDebtGHS.toFixed(2)}</span>
                </div>
              </div>

              {/* In-view debt structures list */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <BadgeAlert className="h-4 w-4 text-orange-500" />
                  Due Debt Line Items
                </span>

                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {activeCustomerDebts.length === 0 ? (
                    <div className="text-[11px] font-medium text-slate-400 p-3 text-center">
                      No active line credit is registered under this profile.
                    </div>
                  ) : (
                    activeCustomerDebts.map(d => {
                      const isOverdue = new Date(d.dueDate) < new Date() && d.status !== "paid";
                      return (
                        <div key={d.debtId} className="p-3 border border-slate-150 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50/40">
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] block text-left">GHS {d.amount.toFixed(2)}</span>
                            <span className="text-[9.5px] font-medium text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Due date: {d.dueDate} 
                              {isOverdue && <span className="bg-rose-50 text-rose-700 text-[8.5px] font-bold px-1 rounded">OVERDUE</span>}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-slate-650 font-bold block">Left: ₵{d.remainingAmount.toFixed(2)}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              d.status === "paid" 
                                ? "bg-emerald-50 text-emerald-700" 
                                : d.status === "partial" 
                                ? "bg-purple-50 text-purple-700" 
                                : "bg-rose-50 text-rose-700"
                            }`}>
                              {d.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Repayment History logs */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 border-t border-slate-100 pt-3">
                  <History className="h-4 w-4 text-blue-500" />
                  Repayments Received Logs
                </span>

                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {activeCustomerRepayments.length === 0 ? (
                    <div className="text-[11px] font-medium text-slate-400 p-3 text-center">
                      No repayments offsets received on this trader portfolio yet.
                    </div>
                  ) : (
                    [...activeCustomerRepayments].reverse().map(r => (
                      <div key={r.repaymentId} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-emerald-600 block text-left">+₵{r.amount.toFixed(2)}</span>
                          <span className="text-[9px] font-mono text-slate-400 block h-fit text-left">
                            {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-slate-200 text-slate-705 rounded-md uppercase">
                          {r.paymentMethod}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center text-slate-400 flex-grow">
              <Users className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-xs font-bold uppercase tracking-tight">Trace Debt Analytics</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                Highlight any active customer debtor profile from the ledger board grid on the left to reveal aging credits.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL / DIALOG 1: ADD CUSTOMER */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Onboard Debtor Customer</h3>
              <button 
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors"
                type="button"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Debtor Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ama Serwaa"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Phone Number (MoMo)</label>
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. +233 241 234 567"
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Email Address (Optional)</label>
                <input 
                  type="email" 
                  placeholder="e.g. ama@serwaaagri.com"
                  value={custEmail}
                  onChange={e => setCustEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Trading Name (Company)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Serwaa Provisions Board"
                  value={custCompany}
                  onChange={e => setCustCompany(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 space-y-1.5">
                <label className="text-[9px] font-bold text-rose-800 uppercase block">Initial Credit Ledger (GHS) (Optional)</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 1500"
                  value={initialDebt}
                  onChange={e => setInitialDebt(e.target.value)}
                  className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <Button 
                type="submit" 
                isLoading={addCustomerMutation.isPending}
                className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold block rounded-xl w-full text-xs shadow-md mt-6"
              >
                Onboard Debtor Customer
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / DIALOG 2: RECORD PAYMENT */}
      {isRepaymentModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Post Debt Repayment</h3>
              <button 
                onClick={() => setIsRepaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors"
                type="button"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handlePostRepaymentSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl space-y-1">
                <span className="text-[9px] font-extrabold uppercase uppercase tracking-wide block">Customer Debt Remaining</span>
                <h4 className="text-xl font-bold font-mono">₵{activeCustomer.remainingDebtGHS.toFixed(2)}</h4>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Repayment Amount (₵ GHS)</label>
                <input 
                  type="number" 
                  required
                  step="any"
                  max={activeCustomer.remainingDebtGHS}
                  min="1"
                  placeholder="e.g. 500"
                  value={repaymentAmt}
                  onChange={e => setRepaymentAmt(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Offset payment type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepayMethod("MOBILE_MONEY")}
                    className={`p-2.5 border rounded-lg text-center font-bold text-[10.5px] tracking-tight block ${
                      repayMethod === "MOBILE_MONEY" 
                        ? "border-blue-500 bg-blue-50 text-blue-700" 
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    MoMo
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepayMethod("CASH")}
                    className={`p-2.5 border rounded-lg text-center font-bold text-[10.5px] tracking-tight block ${
                      repayMethod === "CASH" 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepayMethod("CARD")}
                    className={`p-2.5 border rounded-lg text-center font-bold text-[10.5px] tracking-tight block ${
                      repayMethod === "CARD" 
                        ? "border-purple-500 bg-purple-50 text-purple-700" 
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    Card
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                isLoading={repaymentMutation.isPending}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold block rounded-xl w-full text-xs shadow-md mt-6"
              >
                Commit Repayment Receipt
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
