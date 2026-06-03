import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Smartphone, 
  Coins, 
  CreditCard, 
  Calendar,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import { db, type LocalTransaction, type LocalDebt, type LocalRepayment } from "../services/db";

export default function SandboxAnalyticsTab() {
  // 1. Fetch source live queues
  const { data: transactions = [] } = useQuery<LocalTransaction[]>({
    queryKey: ["sandboxTransactions"],
    queryFn: () => db.transactions.toArray()
  });

  const { data: debts = [] } = useQuery<LocalDebt[]>({
    queryKey: ["debtsList"],
    queryFn: () => db.debts.toArray()
  });

  const { data: repayments = [] } = useQuery<LocalRepayment[]>({
    queryKey: ["repaymentsList"],
    queryFn: () => db.repayments.toArray()
  });

  // 2. Compute financial summary indicators
  const stats = useMemo(() => {
    let salesTotal = 0;
    let expenseTotal = 0;
    let momoTotal = 0;
    let cashTotal = 0;
    let cardTotal = 0;

    transactions.forEach(tx => {
      if (tx.category === "Sales") {
        salesTotal += tx.amount;
      } else if (tx.category === "Expenses" || tx.category === "Inventory" || tx.category === "Logistics") {
        expenseTotal += tx.amount;
      }

      if (tx.paymentMethod === "MOBILE_MONEY") momoTotal += tx.amount;
      if (tx.paymentMethod === "CASH") cashTotal += tx.amount;
      if (tx.paymentMethod === "CARD") cardTotal += tx.amount;
    });

    const outstandingDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const settledDebt = repayments.reduce((sum, r) => sum + r.amount, 0);

    const netCashflow = (salesTotal + settledDebt) - expenseTotal;

    return {
      salesTotal,
      expenseTotal,
      outstandingDebt,
      settledDebt,
      netCashflow,
      momoTotal,
      cashTotal,
      cardTotal
    };
  }, [transactions, debts, repayments]);

  // 3. Generate Weekly Revenue Trend points
  const weeklyTrends = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayData = days.map(day => ({
      name: day.substring(0, 3),
      Revenue: 0,
      Expenses: 0
    }));

    transactions.forEach(tx => {
      const date = new Date(tx.offlineCreatedAt);
      const dayIndex = date.getDay();
      
      if (tx.category === "Sales" || tx.category === "DebtSettle") {
        dayData[dayIndex].Revenue += tx.amount;
      } else {
        dayData[dayIndex].Expenses += tx.amount;
      }
    });

    // Rotate so standard Monday is on top
    const monToSun = [...dayData.slice(1), dayData[0]];
    return monToSun;
  }, [transactions]);

  // 4. Generate Debt vs Repayment collection trendline Over Date
  const debtCollectionTrend = useMemo(() => {
    // Generate date array for last 7 days
    const dateMap: { [key: string]: { date: string, CreditIssued: number, Repayments: number } } = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const displayStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      dateMap[dateStr] = {
        date: displayStr,
        CreditIssued: 0,
        Repayments: 0
      };
    }

    // Accumulate Debts issued offline
    debts.forEach(d => {
      const dateStr = d.createdAt.split("T")[0];
      if (dateMap[dateStr]) {
        dateMap[dateStr].CreditIssued += d.amount;
      }
    });

    // Accumulate Repayments recovered offline
    repayments.forEach(r => {
      const dateStr = r.createdAt.split("T")[0];
      if (dateMap[dateStr]) {
        dateMap[dateStr].Repayments += r.amount;
      }
    });

    return Object.values(dateMap);
  }, [debts, repayments]);

  // 5. Generate Payment Gateway Method Proportions
  const paymentProportions = useMemo(() => {
    const total = stats.momoTotal + stats.cashTotal + stats.cardTotal;
    if (total === 0) {
      return [
        { name: "MTN MoMo", value: 0 },
        { name: "Liquid Cash", value: 0 },
        { name: "Cards/Visa", value: 0 }
      ];
    }

    return [
      { name: "MTN MoMo", value: Number(stats.momoTotal.toFixed(2)) },
      { name: "Liquid Cash", value: Number(stats.cashTotal.toFixed(2)) },
      { name: "Cards/Visa", value: Number(stats.cardTotal.toFixed(2)) }
    ];
  }, [stats]);

  const COLORS = ["#2563eb", "#10b981", "#8b5cf6"];

  return (
    <div className="space-y-6">
      
      {/* Top dashboard intro banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit mb-1.5">
            Merchant Intelligence
          </span>
          <h2 className="text-lg font-bold text-slate-800">Operational Cashflow Intelligence</h2>
          <p className="text-xs text-slate-500">Dual-ledger reporting of cash, mobile money collections, and local-book debtor trends.</p>
        </div>

        <span className="hidden md:flex items-center text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Calendar className="h-4 w-4 text-indigo-500 mr-2 animate-pulse" />
          Real-time Local Calculations
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Gross Trade Sales</span>
            <div className="h-7 w-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-mono text-slate-800">₵{stats.salesTotal.toFixed(2)}</h3>
            <span className="text-[10.5px] font-semibold text-emerald-500">Inbound sales ledger</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Outstanding Book Debts</span>
            <div className="h-7 w-7 rounded bg-red-50 text-red-650 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-mono text-rose-600">₵{stats.outstandingDebt.toFixed(2)}</h3>
            <span className="text-[10.5px] font-semibold text-amber-500">Unsettled credit lines</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Collected Liabilities</span>
            <div className="h-7 w-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-mono text-emerald-600">₵{stats.settledDebt.toFixed(2)}</h3>
            <span className="text-[10.5px] font-semibold text-slate-500">Recovered debt cash</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Available Trading Cashflow</span>
            <div className="h-7 w-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-mono text-slate-800">
              {stats.netCashflow >= 0 ? `₵${stats.netCashflow.toFixed(2)}` : `-₵${Math.abs(stats.netCashflow).toFixed(2)}`}
            </h3>
            <span className={`text-[10.5px] font-semibold ${stats.netCashflow >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {stats.netCashflow >= 0 ? "Liquidity Net positive" : "Capital constrained"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Revenue & Expense Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-tight">
              <Activity className="h-4.5 w-4.5 text-blue-500" />
              Weekly trading cash flow
            </h3>
            <p className="text-[10.5px] text-slate-400 font-medium">Comparison between inbound trade volumes and operating expenditures</p>
          </div>

          <div className="h-[260px] w-full text-xs font-medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "0", color: "#f8fafc" }} 
                  cursor={{ fill: "#f8fafc" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "10px" }} />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Inflow Sales & Repay" />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Outflow Expenditures" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* payment gateway proportion Pie chart */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-tight">
              <Smartphone className="h-4.5 w-4.5 text-emerald-500" />
              MoMo VS cash analytics
            </h3>
            <p className="text-[10.5px] text-slate-400 font-medium">Breakdown of gross transaction volumes by client payment channel</p>
          </div>

          <div className="h-[180px] w-full flex items-center justify-center text-xs">
            {stats.momoTotal + stats.cashTotal + stats.cardTotal === 0 ? (
              <p className="text-slate-400">Post records under Sandbox to see proportions.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentProportions}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentProportions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₵${value}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                MTN Mobile Money
              </span>
              <span className="font-bold text-slate-800">₵{stats.momoTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Physical Cash
              </span>
              <span className="font-bold text-slate-800">₵{stats.cashTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Cards & Visa
              </span>
              <span className="font-bold text-slate-800">₵{stats.cardTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Debt Accumulation vs Debt Repayments recovery rates over date */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-tight">
            <TrendingDown className="h-4.5 w-4.5 text-indigo-500" />
            Credit book extensions VS recoveries
          </h3>
          <p className="text-[10.5px] text-slate-400 font-medium">Tracing the cumulative extension of credit versus actual liquidated repayment trends over time</p>
        </div>

        <div className="h-[250px] w-full text-xs font-medium">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={debtCollectionTrend}>
              <defs>
                <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRepay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="90%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" />
              <YAxis tickLine={false} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "0", color: "#f8fafc" }} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Area type="monotone" dataKey="CreditIssued" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCredit)" name="Debt Issued (Credit)" />
              <Area type="monotone" dataKey="Repayments" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRepay)" name="Credit Recovery (Settle)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
