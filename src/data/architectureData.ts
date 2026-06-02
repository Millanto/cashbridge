import { FileNode, DbTable, ApiEndpoint, RoadmapPhase } from "../types";

export const frontendFolderStructure: FileNode = {
  name: "cashbridge-frontend",
  type: "directory",
  description: "Client-side React SPA containing offline PWA capabilities",
  children: [
    {
      name: "public",
      type: "directory",
      description: "Static assets, offline icons, service worker script, and PWA manifest",
      children: [
        { name: "manifest.json", type: "file", description: "PWA manifest configuring mobile standalone mode and branding themes" },
        { name: "sw.js", type: "file", description: "Service Worker script caching shell assets and handling offline routes" },
        { name: "icon-192.png", type: "file", description: "PWA launcher icon (192x192)" },
        { name: "icon-512.png", type: "file", description: "PWA launcher icon (512x512)" }
      ]
    },
    {
      name: "src",
      type: "directory",
      description: "React source files",
      children: [
        {
          name: "components",
          type: "directory",
          description: "Reusable UI structures built with Tailwind utility classes",
          children: [
            { name: "WalletCard.tsx", type: "file", description: "Widget visualizing balance in GHS/NGN/KES with deposit/withdrawal buttons" },
            { name: "LedgerList.tsx", type: "file", description: "Renders merchant sales/debts record list with sync badges" },
            { name: "SyncStatusIndicator.tsx", type: "file", description: "Visual flag toggling connection status with custom visual pulses" },
            { name: "OfflineQueueViewer.tsx", type: "file", description: "Displays offline local mutations queued in IndexedDB waiting to sync" }
          ]
        },
        {
          name: "db",
          type: "directory",
          description: "Local database persistence engine for offline-first operations",
          children: [
            { name: "localDb.ts", type: "file", description: "IndexedDB wrapper (using dexie.js or native) managing offline storage safely" }
          ]
        },
        {
          name: "hooks",
          type: "directory",
          description: "Custom React hooks encapsulating business workflows",
          children: [
            { name: "useOfflineSync.ts", type: "file", description: "Orchestrator monitoring navigator.onLine and draining local IndexedDB queue" },
            { name: "useAuth.ts", type: "file", description: "Access token receiver and Supabase Client session hook wrapper" }
          ]
        },
        {
          name: "services",
          type: "directory",
          description: "State layer and standard server API wrappers",
          children: [
            { name: "api.ts", type: "file", description: "Axios client configured with interceptors attaching Auth header automatically" },
            { name: "payments.ts", type: "file", description: "Paystack SDK bridge and checkout gateway initiator" }
          ]
        },
        { name: "App.tsx", type: "file", description: "Root component coordinating route switches and global sync state" },
        { name: "index.css", type: "file", description: "Tailwind global rules including custom Inter and JetBrains Mono variables" },
        { name: "main.tsx", type: "file", description: "Vite build initiator binding DOM" }
      ]
    },
    { name: "index.html", type: "file", description: "Primary HTML5 canvas shell" },
    { name: "vite.config.ts", type: "file", description: "Bundling configuration optimized for lightweight mobile downloads" },
    { name: "package.json", type: "file", description: "Frontend dependencies container (React, Lucide, Tailwind 4, Motion)" }
  ]
};

export const backendFolderStructure: FileNode = {
  name: "cashbridge-backend",
  type: "directory",
  description: "Server-side Express app interfacing with Supabase DB and payment gateways",
  children: [
    {
      name: "src",
      type: "directory",
      description: "TypeScript back-end program container",
      children: [
        {
          name: "config",
          type: "directory",
          description: "Server setups, environment parsing, and SDK configurations",
          children: [
            { name: "supabase.ts", type: "file", description: "Supabase Admin Client initialization for verifying JWTs and secure operations" },
            { name: "payments.ts", type: "file", description: "Gateway configurations (MTN MoMo Sandbox secrets and Paystack API key setups)" }
          ]
        },
        {
          name: "controllers",
          type: "directory",
          description: "Request coordinators mapping routes to core logical actions",
          children: [
            { name: "wallet.controller.ts", type: "file", description: "Executes transactions, updates safe-balances, and triggers disbursements" },
            { name: "sync.controller.ts", type: "file", description: "Handles incoming local journal buffers, resolves merge conflicts, performs bulk writes" },
            { name: "momo.controller.ts", type: "file", description: "Coordinates MTN MoMo pre-authorizations, collections, and callback payloads" }
          ]
        },
        {
          name: "middlewares",
          type: "directory",
          description: "Express filter layers enforcing security rules and signatures",
          children: [
            { name: "auth.middleware.ts", type: "file", description: "Verifies Supabase user JWT and loads current operator profile metadata" },
            { name: "signature.middleware.ts", type: "file", description: "Validates payment webhook headers using cryptographic HMAC tokens to prevent spoofing" }
          ]
        },
        {
          name: "routes",
          type: "directory",
          description: "HTTP endpoint index mapping",
          children: [
            { name: "wallets.ts", type: "file", description: "Sub-routes for wallet balances and ledger entries" },
            { name: "sync.ts", type: "file", description: "Bulk synchronization endpoint facilitating journal merge-resolutions" },
            { name: "callbacks.ts", type: "file", description: "Public webhooks exposing callback listeners for MTN MoMo and Paystack" }
          ]
        },
        { name: "server.ts", type: "file", description: "Express server runner binding port 3000 and starting dev system" }
      ]
    },
    { name: "Dockerfile", type: "file", description: "Multi-stage Docker container specification optimal for GCP Cloud Run deployment" },
    { name: "tsconfig.json", type: "file", description: "TypeScript strict-typing layout" },
    { name: "package.json", type: "file", description: "State of server libraries (Express, @supabase/supabase-js, crypto-js)" }
  ]
};

export const databaseSchema: DbTable[] = [
  {
    name: "profiles",
    description: "Merchant demographics and merchant branding settings. Linked with auth.users via Supabase Auth.",
    columns: [
      { name: "id", type: "uuid", constraints: "PRIMARY KEY REFERENCES auth.users", description: "Unique identifier linked directly to Supabase Auth" },
      { name: "merchant_name", type: "varchar(100)", constraints: "NOT NULL", description: "Trading name of business displayed to customers" },
      { name: "phone_number", type: "varchar(20)", constraints: "UNIQUE, NOT NULL", description: "Mobile operator number used for wallet interactions and logins" },
      { name: "currency", type: "varchar(3)", constraints: "DEFAULT 'GHS'", description: "Base trade currency (GHS, NGN, KES, USD)" },
      { name: "created_at", type: "timestamp", constraints: "DEFAULT now()", description: "Profile registration date" }
    ],
    rlsPolicies: [
      "Profiles can only be selected by the owner: (auth.uid() = id)",
      "Profiles can only be edited by the owner: (auth.uid() = id)"
    ],
    ddl: `CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);`
  },
  {
    name: "wallets",
    description: "Main escrow wallets holding live liquidity processed via MTN MoMo or card. Strictly managed server-side.",
    columns: [
      { name: "id", type: "uuid", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()", description: "Primary wallet ID" },
      { name: "profile_id", type: "uuid", constraints: "REFERENCES public.profiles(id) UNIQUE", description: "Associated merchant account ID" },
      { name: "balance", type: "numeric(15,2)", constraints: "NOT NULL DEFAULT 0.00 CHECK (balance >= 0)", description: "Liquid float balance available for payout" },
      { name: "pushed_balance", type: "numeric(15,2)", constraints: "NOT NULL DEFAULT 0.00", description: "Uncleared funds currently pending gateway confirmations" },
      { name: "updated_at", type: "timestamp", constraints: "DEFAULT now()", description: "Timestamp of last ledger mutation" }
    ],
    rlsPolicies: [
      "Wallets are readable by legal owners: (auth.uid() = profile_id)",
      "Strict No-Direct-Write Access: Balance manipulation is ONLY permissible via server-side database triggers triggered by verified transactions"
    ],
    ddl: `CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
  pushed_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet" 
  ON public.wallets FOR SELECT 
  USING (auth.uid() = profile_id);
-- Note: No UPDATE/INSERT policies are opened to the clients. Mutations are locked server-side only.`
  },
  {
    name: "ledger_entries",
    description: "Bookkeeping journals including local transactions added while offline. Offline items carry a local identifier to resolve merges.",
    columns: [
      { name: "id", type: "uuid", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()", description: "Global unique database key" },
      { name: "local_id", type: "varchar(100)", constraints: "UNIQUE", description: "ID generated client-side by IndexedDB while recording while offline" },
      { name: "profile_id", type: "uuid", constraints: "REFERENCES public.profiles(id)", description: "Owner of the ledger record" },
      { name: "description", type: "text", constraints: "NOT NULL", description: "Details of sale, debt description or customer name" },
      { name: "amount", type: "numeric(12,2)", constraints: "NOT NULL", description: "Positive for credit/sales, negative for debit/payments/claims" },
      { name: "category", type: "varchar(50)", constraints: "NOT NULL DEFAULT 'Sales'", description: "Sales, Debt payment, Purchase, Inventory cost" },
      { name: "offline_created_at", type: "timestamp", constraints: "NOT NULL", description: "True timestamp when the trader added the item on their phone" },
      { name: "synced_at", type: "timestamp", constraints: "DEFAULT now()", description: "Server merge timestamp when synchronized" }
    ],
    rlsPolicies: [
      "Traders can select and read their own journals: (auth.uid() = profile_id)",
      "Traders can upload/mutate records: (auth.uid() = profile_id)"
    ],
    ddl: `CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id VARCHAR(100) UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category VARCHAR(50) DEFAULT 'Sales' NOT NULL,
  offline_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traders read own ledger" 
  ON public.ledger_entries FOR SELECT 
  USING (auth.uid() = profile_id);

CREATE POLICY "Traders insert own ledger" 
  ON public.ledger_entries FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);`
  },
  {
    name: "transactions",
    description: "Secure record of liquid flow into or out of CashBridge wallets (deposits & disbursements). Linked securely to external webhook states.",
    columns: [
      { name: "id", type: "uuid", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()", description: "Secure token corresponding to transaction batch" },
      { name: "wallet_id", type: "uuid", constraints: "REFERENCES public.wallets(id)", description: "Target wallet being affected" },
      { name: "provider", type: "varchar(20)", constraints: "NOT NULL", description: "MTN, Orange, Airtel, Paystack" },
      { name: "provider_reference", type: "varchar(100)", constraints: "UNIQUE", description: "Gateway correlation transaction reference" },
      { name: "amount", type: "numeric(15,2)", constraints: "NOT NULL", description: "Absolute money float amount processed" },
      { name: "type", type: "varchar(15)", constraints: "NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL'))", description: "Cash-in or Cash-out" },
      { name: "status", type: "varchar(15)", constraints: "NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'))", description: "Process cycle indicator" },
      { name: "created_at", type: "timestamp", constraints: "DEFAULT now()", description: "Initiation epoch" },
      { name: "finalized_at", type: "timestamp", constraints: "NULL", description: "Webhook callback timestamp confirming settling" }
    ],
    rlsPolicies: [
      "Access only: (auth.uid() = (SELECT profile_id FROM wallets WHERE id = wallet_id))",
      "No client-side insert permitted. Transactions are strictly generated by server-side wallet requests."
    ],
    ddl: `CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_reference VARCHAR(100) UNIQUE,
  amount NUMERIC(15,2) NOT NULL,
  type VARCHAR(15) NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL')),
  status VARCHAR(15) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  finalized_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traders read own transaction history" 
  ON public.transactions FOR SELECT 
  USING (
    auth.uid() = (SELECT profile_id FROM public.wallets WHERE wallets.id = wallet_id)
  );`
}
];

export const clientEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    route: "/api/sync",
    description: "Receives queued offline journal ledger logs, merges with target database, detects overlaps.",
    requestBody: `{
  "entries": [
    {
      "local_id": "client-uuid-9842",
      "description": "Sale of Plantains (Bulk)",
      "amount": 250.00,
      "category": "Sales",
      "offline_created_at": "2026-06-02T18:12:00Z"
    }
  ]
}`,
    responseBody: `{
  "synced_count": 1,
  "errors": [],
  "current_server_time": "2026-06-02T20:01:58Z"
}`,
    authRequired: true
  },
  {
    method: "POST",
    route: "/api/wallets/deposit",
    description: "Initiates a mobile money collection (MTN MoMo API / Paystack) from client phone to server wallet. Instructs payment processor to send push notification PIN request.",
    requestBody: `{
  "amount": 100.00,
  "currency": "GHS",
  "phone_number": "0244123456",
  "provider": "MTN"
}`,
    responseBody: `{
  "transaction_id": "tx-cb-8849c-33b0",
  "status": "PENDING",
  "message": "Verify PIN prompt sent to device. Awaiting callback confirmation.",
  "provider_ref": "momo-uuid-88741"
}`,
    authRequired: true
  },
  {
    method: "POST",
    route: "/api/wallets/withdraw",
    description: "Disburses wallet funds to merchant's registered MTN MoMo profile. Safely checks balance limits inside a PostgreSQL database transaction to prevent double disbursement threats.",
    requestBody: `{
  "amount": 500.00,
  "currency": "GHS",
  "recipient_phone": "0244123456"
}`,
    responseBody: `{
  "withdrawal_id": "tx-cb-5532a-5900",
  "status": "PROCESSING",
  "new_pending_balance": 500.00,
  "msg": "Withdrawal processing initiated. Funds will route instantly upon operator clearance."
}`,
    authRequired: true
  },
  {
    method: "GET",
    route: "/api/wallets/balance",
    description: "Extracts validated merchant accounting records with live clear balance and uncleared processing deposits.",
    responseBody: `{
  "wallet_id": "wallet-uuid-398",
  "available_balance": 1820.50,
  "uncleared_float": 150.00,
  "currency": "GHS"
}`,
    authRequired: true
  }
];

export const publicEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    route: "/api/callbacks/momo",
    description: "Public callback destination webhook for MTN Mobile Money gateway to declare success or failure of prompted pin deposits.",
    requestBody: `{
  "financialTransactionId": "9933827110",
  "externalId": "tx-cb-8849c-33b0",
  "amount": "100.00",
  "status": "SUCCESSFUL",
  "payer": {
    "partyIdType": "MSISDN",
    "partyId": "233244123456"
  }
}`,
    responseBody: `{ "status": "acknowledged", "code": 200 }`,
    authRequired: false
  },
  {
    method: "POST",
    route: "/api/callbacks/paystack",
    description: "Encrypted webhook endpoint capturing realcheck card or bank transfers processed via Paystack terminal client.",
    requestBody: `{
  "event": "charge.success",
  "data": {
    "reference": "tx-cb-card-993",
    "amount": 25000,
    "currency": "GHS",
    "status": "success",
    "metadata": {
      "wallet_id": "wallet-uuid-398"
    }
  }
}`,
    responseBody: `{ "status": "processed" }`,
    authRequired: false
  }
];

export const roadmapData: RoadmapPhase[] = [
  {
    phaseNumber: 1,
    title: "Project Setup & Foundations",
    objective: "Establish database instances, configure JWT authority policies, and boot frontend / backend boilerplates.",
    tasks: [
      { id: "p1-1", title: "Supabase Project Registration", description: "Register project instance in Supabase Dashboard. Create auth profiles schema handles, hook profiles to trigger new custom wallets automatically on registration.", estimatedTime: "1 Day", difficulty: "Medium", status: "completed" },
      { id: "p1-2", title: "API Boilerplate Configuration", description: "Design an Express template with TypeScript, CORS filters, and security parameters supporting JWT verification.", estimatedTime: "1 Day", difficulty: "Low", status: "completed" },
      { id: "p1-3", title: "Client Router & Tailwind 4 Init", description: "Scaffold Vite + React, setup routing, and write standard stylesheet structure using CSS custom @theme rules.", estimatedTime: "1 Day", difficulty: "Low", status: "completed" }
    ]
  },
  {
    phaseNumber: 2,
    title: "Offline Storage & Local Ledger Layout",
    objective: "Implement native IndexedDB persistence and standard ledger logic to enable trading recording in high-latency zones.",
    tasks: [
      { id: "p2-1", title: "IndexedDB Transaction Store Engine", description: "Integrate a local storage catalog layer in React to record sales, cost descriptors, and offline stamps securely in IndexedDB.", estimatedTime: "2 Days", difficulty: "Medium", status: "pending" },
      { id: "p2-2", title: "Reactive Connection Indicator", description: "Write client hook tracking connection latency to warn merchant operators gracefully about status shifts.", estimatedTime: "1 Day", difficulty: "Low", status: "pending" },
      { id: "p2-3", title: "Double-Sync Queue Swallower", description: "Build background scheduler polling server to drain IndexedDB entries to PostgreSQL database with merge conflict adapters.", estimatedTime: "3 Days", difficulty: "High", status: "pending" }
    ]
  },
  {
    phaseNumber: 3,
    title: "Secure Escrow Wallets & Core Banking API",
    objective: "Develop atomic balance management inside PostgreSQL databases using transactions to protect against concurrency race conditions.",
    tasks: [
      { id: "p3-1", title: "Atomic Balance Ledger Trigger", description: "Deploy high-safety PG SQL triggers automatically computing available wallet balances based on cleared cash inputs.", estimatedTime: "2 Days", difficulty: "High", status: "pending" },
      { id: "p3-2", title: "Secure Disbursement Guard Checks", description: "Configure API checks verifying ledger values and holding withdraw limits to avoid over-disbursing float reserves.", estimatedTime: "2 Days", difficulty: "Critical", status: "pending" }
    ]
  },
  {
    phaseNumber: 4,
    title: "MTN MoMo Sandbox & Paystack Integrations",
    objective: "Hook external payment networks into the backend with callback confirmation security layers.",
    tasks: [
      { id: "p4-1", title: "MoMo API Sandbox Client Orchestrator", description: "Incorporate MTN Mobile Money API protocol layers for payment prompting (Collections Client).", estimatedTime: "3 Days", difficulty: "High", status: "pending" },
      { id: "p4-2", title: "SHA512 Webhook Signature Guard", description: "Deploy strict HMAC verification verifying incoming payload tokens from payment providers.", estimatedTime: "2 Days", difficulty: "Medium", status: "pending" },
      { id: "p4-3", title: "Disbursement Cash-Out Integration", description: "Connect Transfer APIs on MTN/Paystack to allow merchants to withdraw clear balances securely as real money.", estimatedTime: "3 Days", difficulty: "High", status: "pending" }
    ]
  },
  {
    phaseNumber: 5,
    title: "PWA Optimizations & Production Audit",
    objective: "Deploy assets in isolated containers on GCP and configure PWA service worker offline caching configurations.",
    tasks: [
      { id: "p5-1", title: "PWA Asset Worker caching layouts", description: "Configure cache parameters in Service Worker sw.js to hold client packages offline, serving from disk on weak networks.", estimatedTime: "2 Days", difficulty: "Medium", status: "pending" },
      { id: "p5-2", title: "Multi-Stage Docker Spec Deployment", description: "Build final container layouts for GCP Cloud Run and mount Cloud DNS routing links with HTTPS protection.", estimatedTime: "1 Day", difficulty: "Medium", status: "pending" }
    ]
  }
];
