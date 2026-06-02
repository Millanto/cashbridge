import { useState } from "react";
import { Smartphone, RefreshCcw, Lock, ArrowRight, ShieldCheck, MailWarning, CheckCircle } from "lucide-react";

export default function PaymentFlowsTab() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  const flowSteps = [
    { title: "Invoice Input", desc: "Merchant triggers deposit request GHS 150.00 via MoMo on React frontend." },
    { title: "Express Pending Trx", desc: "Server allocates unique reference, records status=PENDING, and posts callback token to MTN partner gateway." },
    { title: "USSD PIN Push Dialog", desc: "Telecom sends interactive PIN request on trader's mobile screen." },
    { title: "Encrypted Webhook Web", desc: "Trader enters PIN. MTN router hits Express endpoint /api/callbacks/momo with validation signature." },
    { title: "Atomically Lock & Settle", desc: "Express confirms HMAC header, triggers DB transaction, credits wallet balance, and resolves success status!" }
  ];

  const runSimulation = () => {
    setIsRunning(true);
    setCurrentStep(1);
    setLogs(["[STEP 1] User inputs amount GHS 150.00. Clicking Submit..."]);

    setTimeout(() => {
      setCurrentStep(2);
      setLogs(l => [...l, "[STEP 2] Dispatching payload to server routes. Posting transactions profiles to sandbox database. Balance remains unaffected, transaction allocated status 'PENDING'."]);
    }, 1500);

    setTimeout(() => {
      setCurrentStep(3);
      setLogs(l => [...l, "[STEP 3] Calling MTN Partner MoMo API Gateway. Push notification issued to Subscriber mobile network (Device SIM GHS-0244123456). Awaiting user interaction."]);
    }, 3000);

    setTimeout(() => {
      setCurrentStep(4);
      setLogs(l => [...l, "[STEP 4] Subscriber entered terminal lock validation. MTN gateway generated callback payload. Post request fired to callback hook: `/api/callbacks/momo` with signature header HMAC-SHA512."]);
    }, 4500);

    setTimeout(() => {
      setCurrentStep(5);
      setLogs(l => [...l, "[STEP 5] Webhook verified! Initiating database transactional block. Balance atomically increased by 150.00 GHS! Finalizing logs. Complete!"]);
      setIsRunning(false);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Telecom & Credit Payment Flows</h2>
            <p className="text-xs text-slate-500">How MTN Mobile Money Sandbox webhooks and Paystack resolve securely</p>
          </div>
          <span className="px-2.5 py-1 text-xs bg-orange-100 text-orange-850 rounded font-bold font-mono">HMAC Secure webhooks</span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Diagrams panel */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">MTN MoMo API Webhook Walkthrough</h3>
            
            <div className="space-y-4">
              {flowSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCurrent = currentStep === stepNum;
                const isPast = currentStep > stepNum;
                return (
                  <div 
                    key={idx}
                    className={`p-4 border-2 rounded-xl transition-all flex items-start space-x-4 ${
                      isCurrent 
                        ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-50" 
                        : isPast 
                          ? "border-emerald-200 bg-emerald-50/20" 
                          : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCurrent 
                        ? "bg-blue-600 text-white" 
                        : isPast 
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-200 text-slate-600"
                    }`}>
                      {isPast ? <CheckCircle className="h-4 w-4" /> : stepNum}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isCurrent ? "text-blue-900" : isPast ? "text-emerald-900" : "text-slate-800"}`}>
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive widget */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100 flex items-center">
                <Smartphone className="h-4 w-4 mr-1 text-slate-500" />
                Webhook Runner Widget
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click below to trigger a live visual sandbox walkthrough simulation tracking the API callback loop from Telecom to database balance settling.
              </p>

              <button
                onClick={runSimulation}
                disabled={isRunning}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Webhook Simulator...</span>
                  </>
                ) : (
                  <span>Initiate Webhook Simulator</span>
                )}
              </button>
            </div>

            {logs.length > 0 && (
              <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950 text-slate-100 font-mono text-[9px] leading-relaxed p-4 h-[200px] overflow-y-auto space-y-2">
                <span className="text-[9px] text-slate-400 font-bold block mb-1 uppercase">Sandbox Logs Output:</span>
                {logs.map((log, i) => (
                  <div key={i} className="border-b border-slate-900 pb-1.5 pt-0.5 text-slate-300 break-words">
                    {log}
                  </div>
                ))}
              </div>
            )}

            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 flex items-center shrink-0">
                <Lock className="h-4 w-4 mr-1.5 text-amber-700" />
                Disbursement Security Rule
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Withdrawal Safety Lock:</strong> To block race-conditions, ledger insertions and withdrawals must always enforce PostgreSQL <code>SELECT FOR UPDATE</code> line queries to lock rows atomically before deducting balances.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
