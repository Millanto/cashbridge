# 🏦 CashBridge Sandbox Portal

> **Production-Ready Offline-First Wallet & Bookkeeping App for African Informal Markets**
>
> CashBridge bridges Ghanaian market women, informal traders, and mobile money agents with stable payment rails (MTN MoMo, Paystack) and local-first data indexing, surviving any internet disruption gracefully.

---

## 🏗️ Core Architecture Overview

CashBridge is structured intentionally into two completely independent projects to preserve separation of concerns, allow clean horizontal autoscaling, and target distinct deployment runtimes:

```
                  ┌──────────────────────────────────────────────┐
                  │          CASHBRIDGE CLIENT DESKTOP / PWA     │
                  │  (React 19 + Zustand state + IndexedDB local)│
                  └──────────────────────┬───────────────────────┘
                                         │
                         [Pushes Queued Local Transactions]
                       [Retrieves Real-time Mobile Balance]
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             EXPRESS.JS BACKEND RUNTIME       │
                  │     (Secured by Helmet, Rate-Limit & JWT)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  ▼                                             ▼
┌──────────────────────────────────┐          ┌──────────────────────────────────┐
│      SUPABASE POSTGRES DB        │          │    THIRD-PARTY PAYMENT INGRESS   │
│  (RLS protection, triggers)      │          │     (MTN MoMo Sandbox, Paystack)  │
└──────────────────────────────────┘          └──────────────────────────────────┘
```

---

## 📂 Separated Directory Layouts

### 🟢 1. CashBridge Frontend (`cashbridge-frontend`)
A lightweight, mobile-first PWA serving interface components instantly.

```
cashbridge-frontend/
├── public/
│   ├── sw.js                 # PWA Service Worker caching core assets & shell
│   └── manifest.json         # Webapp installation parameters for mobile screens
├── src/
│   ├── db/
│   │   └── localDb.ts        # IndexedDB wrapper for local transaction queues
│   ├── hooks/
│   │   └── useOfflineSync.ts # Network status listener draining client queues
│   ├── store/
│   │   └── useWalletStore.ts # Lightweight reactive Zustand wallet state machine
│   ├── components/
│   │   └── CodebaseTab.tsx   # Interactive full-stack source file explorer
│   ├── App.tsx               # Primary interface orchestrator
│   └── main.tsx              # Web Client Bootstrapper
```

### 🔵 2. CashBridge Backend (`cashbridge-backend`)
A production-grade, highly-secured Express.js MVC engine proxying payment gates.

```
cashbridge-backend/
├── src/
│   ├── controllers/
│   │   └── sync.controller.ts  # Handles atomic batches & prevents duplicates
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # Decodes Supabase JWT signatures
│   │   └── error.middleware.ts # Standardizes global error structures
│   ├── services/
│   │   ├── momo.service.ts     # Triggers MTN requested payment push sequences
│   │   └── paystack.service.ts # Configures payment forms & deposits
│   ├── routes/
│   │   └── sync.routes.ts      # Sync router gates
│   └── server.ts               # Primary Express bootstrapper
```

---

## ⚡ Setup & Launch Instructions

### Backend Local Launch
1. Enter the backend directory and install dependencies:
   ```bash
   cd cashbridge-backend
   npm install
   ```
2. Configure environment parameters `.env`:
   ```env
   PORT=3000
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   MTN_MOMO_API_BASE=https://sandbox.momodeveloper.mtn.com
   MTN_MOMO_SUBSCRIPTION_KEY=your-subscription-key
   PAYSTACK_SECRET_KEY=your-paystack-secret-key
   ```
3. Boot the environment in developer hot-reload mode:
   ```bash
   npm run dev
   ```

### Frontend Client Setup
1. Move to the frontend, install dependencies, and register PWA:
   ```bash
   cd cashbridge-frontend
   npm install
   ```
2. Run Vite local dev sever:
   ```bash
   npm run dev
   ```

---

## 🔐 Database Security & Schema Details

### Tables
1. **`users`** & **`businesses`**: Handles merchant identities and KYC levels.
2. **`ledger_entries`**: Stores sales journals, synchronized using unique `local_id` to enforce transaction idempotency.
3. **`payment_logs`**: Logs MoMo callbacks to guarantee settlement tracing.

### Postgres Row-Level Security Rules
```sql
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow matching query operations" 
ON ledger_entries FOR ALL 
TO authenticated 
USING (profile_id = auth.uid());
```

---

## 📞 Integrated REST Endpoints

| Verb | Endpoint | Authentication | Purpose |
|------|----------|----------------|---------|
| `POST` | `/api/sync` | Bearer Token Required | Sync offline IndexedDB queue to cloud PostgreSQL |
| `POST` | `/api/wallets/request-payout` | Bearer Token Required | Dispatch push collection notification over MTN MoMo |
| `POST` | `/api/callbacks/momo` | Signature Required | Webhook trigger logging settled balance alterations |
