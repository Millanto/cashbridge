import React from "react";
import { Routes, Route, Navigate, HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { Layout } from "./components/Layout";

// Standard production-ready QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes standard caching
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RouteHelper mode="register" />} />

          {/* Protected Application Layout endpoints */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/customers"
            element={
              <Layout>
                <Customers />
              </Layout>
            }
          />

          {/* Root redirect switches based on auth session status */}
          <Route path="/" element={<RouteHelper mode="root" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
};

// Route redirection helper
interface RouteHelperProps {
  mode: "root" | "register";
}

const RouteHelper: React.FC<RouteHelperProps> = ({ mode }) => {
  // Leverage localStorage directly to prevent temporary hydration flashing
  const storageStr = localStorage.getItem("cashbridge-auth-storage");
  let isAuthenticated = false;
  if (storageStr) {
    try {
      const parsed = JSON.parse(storageStr);
      if (parsed.state?.isAuthenticated) {
        isAuthenticated = true;
      }
    } catch {
      // safe fallback
    }
  }

  if (mode === "register") {
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default App;
