import React, { useState } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { 
  Briefcase, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRightLeft 
} from "lucide-react";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, clearSession } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protected Route Auth Guard
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearSession();
  };

  const navItems = [
    { label: "Dashboard Ledger", path: "/dashboard", icon: LayoutDashboard },
    { label: "Client Debts", path: "/customers", icon: Users },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 font-sans text-slate-100">
      
      {/* Sidebar - Desktop Layout */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-950 border-r border-slate-800/80 shrink-0">
        
        {/* Sidebar Header branding */}
        <div className="flex h-16 items-center px-6 border-b border-slate-850 justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <div className="h-4.5 w-1 bg-white rounded-full mx-0.5 animate-pulse"></div>
              <div className="h-6 w-1 bg-white rounded-full mx-0.5"></div>
              <div className="h-3 w-1 bg-white rounded-full mx-0.5"></div>
            </div>
            <span className="text-base font-bold tracking-tight text-white">CashBridge</span>
          </div>
          <span className="text-[9.5px] bg-blue-505/10 text-blue-400 font-mono font-bold px-1.5 py-0.5 rounded border border-blue-500/10">v1.0</span>
        </div>

        {/* Client business info */}
        <div className="p-4.5 bg-slate-900/50 border-b border-slate-850 shrink-0">
          <div className="flex items-center gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800/40">
            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.companyName || "Merchant Syndicate"}
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar menu items */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/15 shadow-sm shadow-blue-500/5"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-205 border border-transparent"
                }`}
              >
                <Icon className={`mr-3 h-4.5 w-4.5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout trigger */}
        <div className="p-4 border-t border-slate-850 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-450 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Container viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Mobile Header bar */}
        <header className="md:hidden flex h-16 items-center justify-between px-5 bg-slate-950 border-b border-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <div className="h-4 w-1 bg-white rounded-full mx-0.5"></div>
              <div className="h-6 w-1 bg-white rounded-full mx-0.5"></div>
            </div>
            <span className="text-sm font-bold tracking-tight text-white">CashBridge</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile menu expanded state drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 top-16 bg-slate-950 flex flex-col p-5 border-t border-slate-850 animate-fadeIn">
            {/* Business tag info */}
            <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 shrink-0">
              <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {user?.companyName || "Merchant Syndicate"}
                </div>
                <div className="text-xs text-slate-450 mt-0.5">
                  ID: {user?.id} • {user?.firstName} {user?.lastName}
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="flex-grow space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center px-4 py-3 text-xs font-bold rounded-xl border transition-all ${
                      isActive
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/20"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white border-transparent"
                    }`}
                  >
                    <Icon className="mr-3.5 h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 mb-6 text-xs font-bold text-slate-400 bg-rose-550/10 hover:bg-rose-500/15 border border-rose-500/10 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5 text-rose-450" />
              <span>Terminate Terminal Session</span>
            </button>
          </div>
        )}

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
export default Layout;
