import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Search, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  ArrowDownRight, 
  UserPlus, 
  ShieldAlert,
  Coins
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  lastPaymentDate: string;
  agingCategory: "0-30 days" | "31-60 days" | "61-90 days" | "90+ days";
}

export const Customers: React.FC = () => {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "c-1",
      name: "Ama Boatemaa",
      phone: "+233 24 112 0392",
      totalDebt: 2450.00,
      lastPaymentDate: "2026-05-15",
      agingCategory: "0-30 days",
    },
    {
      id: "c-2",
      name: "Kojo Owusu",
      phone: "+233 20 445 9291",
      totalDebt: 4500.00,
      lastPaymentDate: "2026-04-10",
      agingCategory: "31-60 days",
    },
    {
      id: "c-3",
      name: "Akosua Serwaa",
      phone: "+233 27 555 1204",
      totalDebt: 5500.00,
      lastPaymentDate: "2026-02-18",
      agingCategory: "90+ days",
    },
  ]);

  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", initialDebt: "" });
  const [toggleForm, setToggleForm] = useState(false);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    const item: Customer = {
      id: "c-" + Date.now(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      totalDebt: parseFloat(newCustomer.initialDebt) || 0,
      lastPaymentDate: new Date().toISOString().split("T")[0],
      agingCategory: "0-30 days",
    };
    setCustomers([item, ...customers]);
    setNewCustomer({ name: "", phone: "", initialDebt: "" });
    setToggleForm(false);
  };

  const handleOffsetDebt = (id: string, amount: number) => {
    setCustomers(customers.map(c => {
      if (c.id === id) {
        return {
          ...c,
          totalDebt: Math.max(0, c.totalDebt - amount),
          lastPaymentDate: new Date().toISOString().split("T")[0],
        };
      }
      return c;
    }));
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const overallDebtSum = customers.reduce((sum, c) => sum + c.totalDebt, 0);

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Client Creditors & Debts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compute aging debt matrix structures and settle balance offsets.
          </p>
        </div>

        <button
          onClick={() => setToggleForm(!toggleForm)}
          className="px-3.5 py-1.5 bg-blue-600 outline-none border-none hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>{toggleForm ? "Close Panel" : "Register Debtor Client"}</span>
        </button>
      </div>

      {toggleForm && (
        <form onSubmit={handleAddCustomer} className="bg-slate-800 border border-slate-700/60 p-5 rounded-2xl max-w-md space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Add Creditor Portfolio</h3>
          <input
            placeholder="Client Registered Name (e.g. Ama Boatemaa)"
            value={newCustomer.name}
            onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 rounded-xl outline-none"
            required
          />
          <input
            placeholder="Mobile Phone Number (e.g. +233 24 112 0392)"
            value={newCustomer.phone}
            onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 rounded-xl outline-none"
            required
          />
          <input
            placeholder="Outstanding Debt Balance (GHS ₵)"
            type="number"
            value={newCustomer.initialDebt}
            onChange={e => setNewCustomer({ ...newCustomer, initialDebt: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 rounded-xl outline-none"
          />
          <Button type="submit" className="py-2.5">
            Add Client Portfolio row
          </Button>
        </form>
      )}

      {/* Aggregate overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Book Credit</span>
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-rose-450 mt-2">
            ₵{overallDebtSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] font-medium text-slate-400 block mt-1">Sum of active creditors</span>
        </div>

        <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aging At Risk (90+ Days)</span>
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-rose-500 mt-2">
            ₵{customers.filter(c => c.agingCategory === "90+ days").reduce((sum, c) => sum + c.totalDebt, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] font-medium text-amber-500 block mt-1 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 animate-pulse text-amber-500" />
            Requires active collection
          </span>
        </div>

        <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Debtor Count</span>
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-white mt-2">
            {customers.filter(c => c.totalDebt > 0).length} Traded
          </h3>
          <span className="text-[10px] font-medium text-slate-400 block mt-1">Traders with pending accounts</span>
        </div>
      </div>

      {/* Main filterable list */}
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">Debtor ledgerings list</h2>
            <p className="text-[10px] text-slate-400">Merchant real-time client records</p>
          </div>
          
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
            <input
              placeholder="Search trader..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-705 p-2 pl-9 text-xs text-white placeholder-slate-500 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-850 border-b border-slate-700/60 text-[9px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-5 py-3">Client Trader</th>
                <th className="px-5 py-3">Phone Line</th>
                <th className="px-5 py-3">Last Active Settle</th>
                <th className="px-5 py-3">Aging category</th>
                <th className="px-5 py-3 text-right">Balance Due (₵)</th>
                <th className="px-5 py-3 text-center">Settlement offset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-75Q/20 transition-colors">
                  <td className="px-5 py-4 font-bold text-white text-xs">{c.name}</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{c.phone}</td>
                  <td className="px-5 py-4 text-slate-400">{c.lastPaymentDate}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      c.agingCategory === "0-30 days" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" :
                      c.agingCategory === "31-60 days" ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" :
                      "bg-rose-500/10 text-rose-450 border border-rose-500/15"
                    }`}>
                      {c.agingCategory}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-white text-xs">
                    ₵{c.totalDebt.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={() => handleOffsetDebt(c.id, 500)}
                        disabled={c.totalDebt <= 0}
                        className="p-1 px-2.5 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px] font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                      >
                        Settle -₵500
                      </button>
                      <button
                        onClick={() => handleOffsetDebt(c.id, c.totalDebt)}
                        disabled={c.totalDebt <= 0}
                        className="p-1 px-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded border border-blue-500/10 text-[10px] font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                      >
                        Clear Full
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default Customers;
