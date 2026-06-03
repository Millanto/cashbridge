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
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-xl w-full bg-[#111827] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden self-center transition-all p-1">
        
        {/* Branding header */}
        <div className="p-6 sm:p-8 pt-8 pb-4 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/10 mb-4">
            Start Bookkeeping in Minutes
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Register your business with CashBridge
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-[420px] mx-auto leading-relaxed">
            Create your free merchant profile to record transactions, trade offline, and manage customer credit offsets cleanly.
          </p>
        </div>

        {/* Content Canvas */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 pt-2 space-y-6">
          {apiError && (
            <Alert type="error" title="Could Not Register" message={apiError} />
          )}

          {success && (
            <Alert
              type="success"
              title="Business Registered!"
              message="Your business profile was successfully created. Redirecting you to login..."
            />
          )}

          {/* Double column name row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="firstName"
              label="Your First Name"
              placeholder="e.g. Kofi"
              error={errors.firstName}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading || success}
              icon={<User className="h-4 w-4 text-slate-400" />}
            />

            <Input
              id="lastName"
              label="Your Last Name"
              placeholder="e.g. Mensah"
              error={errors.lastName}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading || success}
              icon={<User className="h-4 w-4 text-slate-400" />}
            />
          </div>

          <Input
            id="companyName"
            label="Business Name / Shop Name"
            placeholder="e.g. Kofi Mensah Cocoa Syndicate or Ama's Provisions"
            error={errors.companyName}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isLoading || success}
            icon={<Briefcase className="h-4 w-4 text-slate-400" />}
          />

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div className="w-full">
              <Input
                id="password"
                type="password"
                label="Choose Pin / Password"
                placeholder="Choose a password"
                error={errors.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || success}
                icon={<Lock className="h-4 w-4 text-slate-400" />}
              />
            </div>

            {/* Password security checklist grid */}
            <div className="bg-[#182235]/40 p-4 rounded-2xl border border-slate-800/60 text-xs text-slate-400 space-y-2.5 mt-2 md:mt-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Password Strength Checklist
              </span>
              <ul className="space-y-2 font-medium transition-colors text-[11px]">
                <li className={`flex items-center gap-2 ${isMinLength ? "text-emerald-400" : "text-slate-400"}`}>
                  {isMinLength ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 opacity-40 text-slate-500" />}
                  <span>At least 8 characters long</span>
                </li>
                <li className={`flex items-center gap-2 ${hasLowercase ? "text-emerald-400" : "text-slate-400"}`}>
                  {hasLowercase ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 opacity-40 text-slate-500" />}
                  <span>At least one lowercase (a-z)</span>
                </li>
                <li className={`flex items-center gap-2 ${hasUppercase ? "text-emerald-400" : "text-slate-400"}`}>
                  {hasUppercase ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 opacity-40 text-slate-500" />}
                  <span>At least one uppercase (A-Z)</span>
                </li>
                <li className={`flex items-center gap-2 ${hasDigit ? "text-emerald-400" : "text-slate-400"}`}>
                  {hasDigit ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 opacity-40 text-slate-500" />}
                  <span>At least one number (0-9)</span>
                </li>
              </ul>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={success} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/10 mt-2">
            {success ? (
              <span className="flex items-center gap-1.5 justify-center">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 animate-bounce" /> Registration Complete!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                Create Free Account <ArrowRight className="h-4.5 w-4.5" />
              </span>
            )}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-200 font-bold underline decoration-blue-500/30">
                Log in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
