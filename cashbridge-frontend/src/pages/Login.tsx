import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";
import { apiClient } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  
  // Local Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Validation, Loading & Error states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Client-side quick checks
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please supply a valid email address.";
    }
    
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must capture at least 8 characters.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      
      const { user, token } = response.data.data;
      
      // Persist to store (and localStorage implicitly via authStore)
      setSession(user, token);
      setSuccess(true);
      
      // Redirect to main terminal overview
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      // Parse custom error structures received from the backend controllers
      const message = err.response?.data?.error || err.response?.data?.message || "Service unavailable. Verify mobile internet connectivity and retry.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden self-center transition-all">
        
        {/* Branding header bar */}
        <div className="p-6 sm:p-8 border-b border-slate-700/40 bg-slate-850 flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10 mb-4 shrink-0">
            <div className="h-5 w-1 bg-white rounded-full mx-0.5 animate-pulse"></div>
            <div className="h-7 w-1 bg-white rounded-full mx-0.5"></div>
            <div className="h-4 w-1 bg-white rounded-full mx-0.5"></div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome to CashBridge
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-[280px]">
            Log in to manage transactions, buffer offline sales, and settle settlements securely.
          </p>
        </div>

        {/* Content canvas */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {apiError && (
            <Alert type="error" title="Credential Handshake Rejected" message={apiError} />
          )}

          {success && (
            <Alert 
              type="success" 
              title="Secure Session Established" 
              message="Access keys authorized successfully. Routing to ledger boards..." 
            />
          )}

          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Merchant Account ID (Email)"
              placeholder="e.g. kofi@cocoamerchants.com"
              error={errors.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || success}
              icon={<Mail className="h-4 w-4" />}
            />

            <Input
              id="password"
              type="password"
              label="Security Pin (Password)"
              placeholder="••••••••"
              error={errors.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || success}
              icon={<Lock className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold">
            <label className="flex items-center text-slate-400 select-none">
              <input 
                type="checkbox" 
                defaultChecked 
                className="mr-2 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" 
              />
              Keep terminal authorized
            </label>
            <a href="#reset-pin" className="text-blue-400 hover:text-blue-300 transition-colors">
              Reset Security Pin?
            </a>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={success}>
            {success ? (
              <span className="flex items-center gap-1.5 justify-center">
                <UserCheck className="h-4 w-4" /> Synchronized
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                Authorize Terminal Node <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 font-medium">
              New merchant trader?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30">
                Register a new business account
              </Link>
            </p>
          </div>
        </form>

        {/* Status indicator footer */}
        <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-t border-slate-700/30 text-[9.5px] font-mono text-slate-500 uppercase tracking-wider">
          <span className="flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></span>
            Node ID: CB-TERM-3000
          </span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-slate-650" />
            256-Bit SSL Secured
          </span>
        </div>

      </div>
    </div>
  );
};
