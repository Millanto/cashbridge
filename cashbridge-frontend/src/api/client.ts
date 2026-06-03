import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Creating a production-ready axios instance
export const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || "https://api.cashbridge.local/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor to automatically append stored JWT tokens to authorization headers
apiClient.interceptors.request.use(
  (config) => {
    // Get current token from hydrated zustand memory
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// MOCK API GATEWAY LAYER FOR CLIENT-ONLY FULL INTERACTION (SINCE NO BACKEND EXISTS YET)
// This intercepts real Axios requests to local domain, matching standard backend specifications.
apiClient.interceptors.request.use(async (config) => {
  const url = config.url || "";
  
  // Only intercept cashbridge routes for local sandboxing when no backend is live
  if (url.includes("/auth/") || url.includes("/business/") || url.includes("/sync/")) {
    // Mock latency to simulate network calls
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Handle Login Mock
    if (url.endsWith("/auth/login")) {
      const { email, password } = JSON.parse(config.data);
      
      // Perform matching with simulated account
      if (email && password) {
        // Simple mock user database from localStorage
        const registeredUsersStr = localStorage.getItem("cb-mock-users") || "[]";
        const registeredUsers = JSON.parse(registeredUsersStr);
        const matched = registeredUsers.find((u: any) => u.email === email && u.password === password) || 
          (email === "kofi@cocoamerchants.com" && password === "Password123" ? { email, password, firstName: "Kofi", lastName: "Mensah", companyName: "Mensah Cocoa Syndicate" } : null);

        if (matched) {
          return {
            ...config,
            adapter: async () => ({
              data: {
                status: "success",
                data: {
                  token: "jwt-token-cb-" + Date.now(),
                  user: {
                    id: "usr-" + Math.floor(Math.random() * 1000),
                    email: matched.email,
                    firstName: matched.firstName || "Kofi",
                    lastName: matched.lastName || "Mensah",
                    companyName: matched.companyName || "Mensah Cocoa Syndicate",
                    role: "merchant",
                  },
                },
              },
              status: 200,
              statusText: "OK",
              headers: {},
              config,
            }),
          } as any;
        } else {
          return {
            ...config,
            adapter: async () => {
              const resErr: any = new Error("Invalid terminal identifier or security pin.");
              resErr.response = {
                status: 401,
                data: { error: "Invalid terminal identifier or security pin." },
              };
              throw resErr;
            },
          } as any;
        }
      }
    }

    // Handle Registration Mock
    if (url.endsWith("/auth/register")) {
      const payload = JSON.parse(config.data);
      const registeredUsersStr = localStorage.getItem("cb-mock-users") || "[]";
      const registeredUsers = JSON.parse(registeredUsersStr);
      
      if (registeredUsers.some((u: any) => u.email === payload.email)) {
        return {
          ...config,
          adapter: async () => {
            const resErr: any = new Error("Account with this email has already been registered.");
            resErr.response = {
              status: 400,
              data: { error: "Account with this email has already been registered." },
            };
            throw resErr;
          },
        } as any;
      }

      registeredUsers.push(payload);
      localStorage.setItem("cb-mock-users", JSON.stringify(registeredUsers));

      return {
        ...config,
        adapter: async () => ({
          data: {
            status: "success",
            message: "Merchant registered successfully.",
            data: { id: "usr-" + Math.floor(Math.random() * 1000) }
          },
          status: 201,
          statusText: "Created",
          headers: {},
          config,
        }),
      } as any;
    }

    // Handle Dashboard Metrics Summary Mock
    if (url.endsWith("/business/dashboard-summary")) {
      // Dynamic loading from local storage state
      const mockSalesStr = localStorage.getItem("cb-mock-sales") || "[]";
      const mockSales = JSON.parse(mockSalesStr);

      const defaultSales = [
        {
          id: "tx-cbd-01",
          description: "3 Large bags Grade A Cocoa Beans",
          amount: 1850.00,
          category: "Sales" as const,
          paymentMethod: "CASH" as const,
          status: "completed" as const,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "tx-cbd-02",
          description: "MTN MoMo Inbound Settlement #920",
          amount: 2450.00,
          category: "Sales" as const,
          paymentMethod: "MOBILE_MONEY" as const,
          status: "completed" as const,
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        },
        {
          id: "tx-cbd-03",
          description: "Advance bags purchase Ama Boatemea",
          amount: 950.00,
          category: "DebtSettle" as const,
          paymentMethod: "DEBT" as const,
          status: "completed" as const,
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        }
      ];

      const allRecentSales = [...mockSales, ...defaultSales];
      const revenueGHS = allRecentSales
        .filter(s => s.category === "Sales" || s.category === "DebtSettle")
        .reduce((sum, s) => sum + s.amount, 0);

      const momoInboundGHS = allRecentSales
        .filter(s => s.paymentMethod === "MOBILE_MONEY")
        .reduce((sum, s) => sum + s.amount, 0);

      const unresolvedSyncBatch = mockSales.filter((s: any) => s.status === "pending").length;

      return {
        ...config,
        adapter: async () => ({
          data: {
            status: "success",
            data: {
              revenueGHS: revenueGHS || 45280.00,
              momoInboundGHS: momoInboundGHS || 28910.45,
              outstandingDebtGHS: 12450.00,
              unresolvedSyncBatch,
              growthPercentage: 14,
              recentSales: allRecentSales,
            },
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      } as any;
    }

    // Handle Transactions Batch Synchronization Mock
    if (url.endsWith("/sync/transactions")) {
      const { batch } = JSON.parse(config.data);
      const mockSalesStr = localStorage.getItem("cb-mock-sales") || "[]";
      const mockSales = JSON.parse(mockSalesStr);

      const newlySynced = batch.map((item: any) => ({
        id: "tx-sync-" + Math.floor(Math.random() * 10000),
        description: item.description,
        amount: item.amount,
        category: item.category || "Sales",
        paymentMethod: item.paymentMethod || "MOBILE_MONEY",
        status: "completed", // Synced so marked completed
        createdAt: item.offlineCreatedAt || new Date().toISOString(),
      }));

      // Add to our localStorage simulated ledger
      localStorage.setItem("cb-mock-sales", JSON.stringify([...newlySynced, ...mockSales]));

      return {
        ...config,
        adapter: async () => ({
          data: {
            status: "success",
            message: `${newlySynced.length} records processed and merged into the central Postgres ledger store successfully.`,
            syncedIds: newlySynced.map((s: any) => s.id)
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      } as any;
    }
  }

  return config;
});
