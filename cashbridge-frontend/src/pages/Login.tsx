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
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-md w-full bg-[#111827] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden self-center transition-all p-1">
        
        {/* Branding header bar */}
        <div className="p-6 sm:p-8 pt-8 pb-4 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 shrink-0">
            <div className="h-5 w-1 bg-white rounded-full mx-0.5 animate-pulse"></div>
            <div className="h-7 w-1 bg-white rounded-full mx-0.5"></div>
            <div className="h-4 w-1 bg-white rounded-full mx-0.5"></div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Welcome back to CashBridge
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed max-w-[320px]">
            Log in to manage your trade, record offline sales, and track client credit balances cleanly.
          </p>
        </div>

        {/* Content canvas */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 pt-2 space-y-6">
          {apiError && (
            <Alert type="error" title="Could Not Sign In" message={apiError} />
          )}

          {success && (
            <Alert 
              type="success" 
              title="Welcome Back" 
              message="Opening your workspace ledger dashboard..." 
            />
          )}

          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Business Email Address"
              placeholder="e.g. kofi@cocoamerchants.com"
              error={errors.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || success}
              icon={<Mail className="h-4 w-4 text-slate-400" />}
            />

            <Input
              id="password"
              type="password"
              label="Secret Pin / Password"
              placeholder="Enter your security pin or password"
              error={errors.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || success}
              icon={<Lock className="h-4 w-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold">
            <label className="flex items-center text-slate-400 select-none cursor-pointer">
              <input 
                type="checkbox" 
                defaultChecked 
                className="mr-2 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer" 
              />
              Remember this device
            </label>
            <a href="#reset-pin" className="text-blue-400 hover:text-blue-300 transition-colors">
              Forgot pin/password?
            </a>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={success} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/10">
            {success ? (
              <span className="flex items-center gap-1.5 justify-center">
                <UserCheck className="h-4.5 w-4.5" /> Entering Workspace...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                Login to Workspace <ArrowRight className="h-4.5 w-4.5" />
              </span>
            )}
          </Button>

          <div className="text-center pt-2 pb-2">
            <p className="text-xs text-slate-400 font-medium">
              First time here?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30">
                Register your business
              </Link>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
};
