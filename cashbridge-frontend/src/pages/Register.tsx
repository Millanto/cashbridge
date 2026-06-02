import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Briefcase, ArrowRight, ShieldCheck, CheckCircle2, Circle } from "lucide-react";
import { apiClient } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

export const Register: React.FC = () => {
  const navigate = useNavigate();

  // Field states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Validation feedback
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password structural checklist tracking (aligned with auth.validator.ts rules)
  const isMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Input a valid email address.";
    }

    if (!firstName || firstName.length < 2) {
      newErrors.firstName = "First name is too short.";
    }

    if (!lastName || lastName.length < 2) {
      newErrors.lastName = "Last name is too short.";
    }

    if (!companyName || companyName.length < 2) {
      newErrors.companyName = "Business name requires at least 2 letters.";
    }

    if (!password) {
      newErrors.password = "Pin credentials are required.";
    } else if (!isMinLength || !hasLowercase || !hasUppercase || !hasDigit) {
      newErrors.password = "Pin fails password complexity requirements.";
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
      await apiClient.post("/auth/register", {
        email,
        password,
        firstName,
        lastName,
        companyName,
        role: "merchant"
      });

      setSuccess(true);
      
      // Auto-negotiate session redirect to login panel
      setTimeout(() => {
        navigate("/login?registered=true");
      }, 2000);
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to set up account. Please confirm your entries and try again.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-xl w-full bg-slate-800 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden self-center transition-all">
        
        {/* Branding header */}
        <div className="p-6 sm:p-8 border-b border-slate-700/40 bg-slate-850 text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
            Merchants & Traders Gateway
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Register your Business Onboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[340px] mx-auto leading-relaxed">
            Create an owner profile to secure settlements, activate card routers, and sync ledger rows.
          </p>
        </div>

        {/* Content Canvas */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {apiError && (
            <Alert type="error" title="Registration Halt" message={apiError} />
          )}

          {success && (
            <Alert
              type="success"
              title="Onboard Profile Created!"
              message="Your merchant identity has been saved securely on Postgres. Moving to key authorization screen..."
            />
          )}

          {/* Double column name row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="firstName"
              label="First Name"
              placeholder="e.g. Kofi"
              error={errors.firstName}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading || success}
              icon={<User className="h-4 w-4" />}
            />

            <Input
              id="lastName"
              label="Last Name"
              placeholder="e.g. Mensah"
              error={errors.lastName}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading || success}
              icon={<User className="h-4 w-4" />}
            />
          </div>

          <Input
            id="companyName"
            label="Registered Trading Name (Company)"
            placeholder="e.g. Mensah Cocoa Syndicate Ltd"
            error={errors.companyName}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isLoading || success}
            icon={<Briefcase className="h-4 w-4" />}
          />

          <Input
            id="email"
            type="email"
            label="Primary Accounting Email Address"
            placeholder="mensah@cocoatrade.com"
            error={errors.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || success}
            icon={<Mail className="h-4 w-4" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <Input
              id="password"
              type="password"
              label="Password (Security Code)"
              placeholder="Min 8 characters"
              error={errors.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || success}
              icon={<Lock className="h-4 w-4" />}
            />

            {/* Password security checklist grid */}
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/30 text-[11px] text-slate-400 space-y-2 mt-4 md:mt-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Pin Security Parameters
              </span>
              <ul className="space-y-1.5 font-medium transition-colors">
                <li className={`flex items-center gap-1.5 ${isMinLength ? "text-emerald-400" : "text-slate-400"}`}>
                  {isMinLength ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                  <span>8+ character density</span>
                </li>
                <li className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-400" : "text-slate-400"}`}>
                  {hasLowercase ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                  <span>At least one lowercase letter (a-z)</span>
                </li>
                <li className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-400" : "text-slate-400"}`}>
                  {hasUppercase ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                  <span>At least one uppercase letter (A-Z)</span>
                </li>
                <li className={`flex items-center gap-1.5 ${hasDigit ? "text-emerald-400" : "text-slate-400"}`}>
                  {hasDigit ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                  <span>At least one integer digit (0-9)</span>
                </li>
              </ul>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={success}>
            {success ? (
              <span className="flex items-center gap-1.5 justify-center">
                <ShieldCheck className="h-4 w-4" /> Account Registered!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                Create Owner Profile <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="text-center pt-1.5">
            <p className="text-xs text-slate-400 font-medium">
              Already registered?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-200 font-bold underline decoration-blue-500/30">
                Log in with credentials
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
