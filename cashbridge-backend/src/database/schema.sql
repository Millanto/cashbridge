-- ==============================================================================
-- CASHBRIDGE FINTECH SYSTEM - DATABASE SCHEMA (SUPABASE POSTGRESQL 15+)
-- ==============================================================================
-- Description: Production-grade, fully normalized relational database layout.
-- Built with secure foreign key cascades, unique UUID keys, value validation checks,
-- query optimization indices, and Row-Level Security (RLS) policies.
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean Slate (Optional migration teardown - for reference only)
-- DROP TABLE IF EXISTS public.sync_sessions CASCADE;
-- DROP TABLE IF EXISTS public.payment_logs CASCADE;
-- DROP TABLE IF EXISTS public.debts CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;
-- DROP TABLE IF EXISTS public.customers CASCADE;
-- DROP TABLE IF EXISTS public.wallets CASCADE;
-- DROP TABLE IF EXISTS public.businesses CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Cryptographic bcrypt string
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'merchant' NOT NULL CHECK (role IN ('merchant', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. BUSINESSES TABLE
-- ==============================================================================
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS' NOT NULL CHECK (char_length(currency) = 3), -- ISO 4217 code (e.g. GHS, NGN)
    kyc_status VARCHAR(30) DEFAULT 'LEVEL_1_PENDING' NOT NULL CHECK (kyc_status IN ('LEVEL_1_PENDING', 'LEVEL_2_APPROVED', 'REJECTED')),
    phone_number VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. WALLETS (ESCROW / DEPOSIT FLOAT TRACE)
-- ==============================================================================
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    balance NUMERIC(15,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0.00), -- Strictly non-negative balance
    pushed_balance NUMERIC(15,2) DEFAULT 0.00 NOT NULL, -- Pending gateway clearing float
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. CUSTOMERS TABLE (MERCHANTS' CLIENT LEDGER COHORTS)
-- ==============================================================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30),
    debt_active BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. TRANSACTIONS TABLE (LEDGER MUTATIONS FOR BOOKKEEPING)
-- ==============================================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id VARCHAR(100) UNIQUE, -- Client-side generated unique key from IndexedDB to ensure idempotency
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL, -- Linked customer if dealing with debts or sales
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL, -- Positive represents income/sales, Negative is costs/operating expenditures
    category VARCHAR(50) DEFAULT 'Sales' NOT NULL, -- 'Sales', 'Inventory', 'Logistics', 'Rent'
    payment_method VARCHAR(30) DEFAULT 'CASH' NOT NULL, -- 'CASH', 'MOBILE_MONEY', 'CARD', 'DEBT'
    offline_created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- True creation time when trader was offline in market
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. DEBTS TABLE (TRACKS CUSTOMER CREDIT OUTSTANDING balances)
-- ==============================================================================
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount_total NUMERIC(12,2) NOT NULL CHECK (amount_total > 0.00),
    amount_paid NUMERIC(12,2) DEFAULT 0.00 NOT NULL CHECK (amount_paid >= 0.00),
    status VARCHAR(25) DEFAULT 'UNPAID' NOT NULL CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'SETTLED')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_debt_limits CHECK (amount_paid <= amount_total) -- Guarantee paid bounds
);

-- ==============================================================================
-- 7. PAYMENT LOGS (MOBILE MONEY WEBHOOK WEB INTEGRATION DEPOSITS)
-- ==============================================================================
CREATE TABLE public.payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    payment_gateway VARCHAR(30) NOT NULL, -- 'MTN_MOMO', 'PAYSTACK'
    provider_reference VARCHAR(100) UNIQUE NOT NULL, -- Correlation token on Paystack router/sandbox
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0.00),
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED')),
    direction VARCHAR(15) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')), -- Deposit vs Withdrawal push
    payload_raw JSONB, -- Stores full JSON response context for diagnostic auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    finalized_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================================================
-- 8. SYNC SESSIONS (TRACES AND LOGS THE OFFLINE CLIENT SYNCS TO PG)
-- ==============================================================================
CREATE TABLE public.sync_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    device_id VARCHAR(100), -- Browser metadata agent token
    records_synced INTEGER DEFAULT 0 NOT NULL,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ==============================================================================
-- Create index pointers to prevent table-scan bottlenecks on foreign key lookups
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_wallets_business ON public.wallets(business_id);
CREATE INDEX idx_customers_business ON public.customers(business_id);
CREATE INDEX idx_transactions_business ON public.transactions(business_id);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX idx_transactions_offline ON public.transactions(offline_created_at);
CREATE INDEX idx_debts_customer ON public.debts(customer_id);
CREATE INDEX idx_debts_business ON public.debts(business_id);
CREATE INDEX idx_payment_logs_reference ON public.payment_logs(provider_reference);
CREATE INDEX idx_payment_logs_business ON public.payment_logs(business_id);
CREATE INDEX idx_sync_sessions_business ON public.sync_sessions(business_id);

-- ==============================================================================
-- AUTOMATIC WALLET PROVISIONING & TIMESTAMP TRIGGERS
-- ==============================================================================

-- Function updating timestamp column cleanly on updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp watchers
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function automatic wallet creation on business launch
CREATE OR REPLACE FUNCTION public.provision_wallet_for_business()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (business_id, balance, pushed_balance, updated_at)
    VALUES (NEW.id, 0.00, 0.00, timezone('utc'::text, now()));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach wallet trigger to business
CREATE TRIGGER tr_business_provision_wallet
AFTER INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.provision_wallet_for_business();

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS across schemas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Users can view and manage their own user parameters
CREATE POLICY user_ownership_policy ON public.users
    FOR ALL USING (id = auth.uid());

-- 2. Merchants can only access businesses owned by themselves
CREATE POLICY business_ownership_policy ON public.businesses
    FOR ALL USING (owner_id = auth.uid());

-- 3. Merchants can access and manage wallets corresponding to their own businesses
CREATE POLICY wallet_access_policy ON public.wallets
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- 4. Customers are protected based on business affiliations
CREATE POLICY customer_access_policy ON public.customers
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- 5. Transactions are locked down strictly to authorized owners
CREATE POLICY transaction_access_policy ON public.transactions
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- 6. Customers' debts are only accessible by parent trade owners
CREATE POLICY debt_access_policy ON public.debts
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- 7. Payment Webhook Logs security trace filters
CREATE POLICY payment_logs_access_policy ON public.payment_logs
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- 8. Device Session synchronization checks
CREATE POLICY sync_sessions_policy ON public.sync_sessions
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );
