import { useState } from "react";
import { Database, ShieldAlert, Code2, Clipboard, Check, Table } from "lucide-react";
import { databaseSchema } from "../data/architectureData";
import { DbTable } from "../types";

export default function DatabaseTab() {
  const [selectedTable, setSelectedTable] = useState<DbTable>(databaseSchema[0]);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const copyDdl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => {
      setCopiedText(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Database Schema (Supabase PostgreSQL 15)</h2>
            <p className="text-xs text-slate-500">Atomic ledger designs, RLS, and secure transaction tracking</p>
          </div>
          <span className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center">
            <Database className="h-3.5 w-3.5 mr-1" />
            Supabase DB
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Tables Selection */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Relational Tables</h3>
            {databaseSchema.map((table) => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                  selectedTable.name === table.name
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Table className={`h-4 w-4 mt-0.5 shrink-0 ${selectedTable.name === table.name ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <span className="font-mono text-xs font-bold block">{table.name}</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">{table.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Table Columns Schema */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-800">SCHEMA: {selectedTable.name}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 text-slate-600 font-mono rounded">
                  {selectedTable.columns.length} Fields
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Field Name</th>
                      <th className="px-4 py-2.5 font-bold">Data Type</th>
                      <th className="px-4 py-2.5 font-bold">Constraints</th>
                      <th className="px-4 py-2.5 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {selectedTable.columns.map((column) => (
                      <tr key={column.name} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{column.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{column.type}</td>
                        <td className="px-4 py-3">
                          {column.constraints ? (
                            <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-600 font-mono rounded">
                              {column.constraints}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[9px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 leading-normal max-w-xs">{column.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Row Level Security (RLS) policies */}
            <div className="border border-red-100 bg-red-50/30 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-red-800 flex items-center">
                <ShieldAlert className="h-4 w-4 mr-1.5 text-red-600" />
                Row-Level Security (RLS) Rules
              </h4>
              <ul className="space-y-1 text-[11px] text-red-700 leading-relaxed font-medium">
                {selectedTable.rlsPolicies.map((policy, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-1.5 font-mono">•</span>
                    <span>{policy}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SQL / DDL generation code */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100">
              <div className="p-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 flex items-center">
                  <Code2 className="h-3.5 w-3.5 mr-1" />
                  Supabase Migration SQL DDL
                </span>
                <button
                  onClick={() => copyDdl(selectedTable.ddl)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] text-slate-300 flex items-center space-x-1 border border-slate-700 transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-3 w-3" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-[10.5px] font-mono leading-relaxed overflow-x-auto max-h-[220px]">
                {selectedTable.ddl}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
