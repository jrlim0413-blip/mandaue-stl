-- ==============================================================================
-- LUCKY BETPLAY CORPORATION (STL MANDAUE OPERATIONS)
-- TICKET VERIFICATION & CLAIM MESSAGING DATABASE SCHEMA
-- Purpose: Ephemeral & audit-ready 1-on-1 verification requests between Outlets/Tellers
--          and the Authorized Claim Cashier.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: claim_verification_threads
-- Tracks each ticket verification / claim session (ephemeral lifecycle)
CREATE TABLE IF NOT EXISTS public.claim_verification_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id TEXT,                          -- e.g. '081628-OIIIRA0CN'
    outlet_name TEXT NOT NULL,                    -- e.g. 'Subangdaku #01'
    outlet_user_id TEXT,                          -- user/teller who requested verification
    outlet_user_name TEXT,
    verifier_username TEXT DEFAULT 'main_cashier', -- designated authorized cashier
    verifier_name TEXT DEFAULT 'Maria Elena Santos',
    bet_no TEXT,                                  -- e.g. '784'
    draw_date DATE,
    draw_time TEXT,                               -- e.g. '5:00 PM'
    win_amount NUMERIC(12, 2),                    -- e.g. 5000.00
    claim_status TEXT DEFAULT 'PENDING'           -- 'PENDING', 'VERIFIED_CLAIMED', 'REJECTED', 'EXPIRED'
        CHECK (claim_status IN ('PENDING', 'VERIFIED_CLAIMED', 'REJECTED', 'EXPIRED', 'CLOSED')),
    notes TEXT,                                   -- cashier verification remarks
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,                      -- timestamp when payout was authorized
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 HOURS'), -- auto-expiry window for temporary verification
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3. TABLE: claim_verification_messages
-- Stores the temporary chat messages & attached receipt photos for the thread
CREATE TABLE IF NOT EXISTS public.claim_verification_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES public.claim_verification_threads(id) ON DELETE CASCADE,
    sender_username TEXT NOT NULL,                -- who sent the message
    sender_name TEXT NOT NULL,
    sender_role TEXT DEFAULT 'staff',             -- 'teller', 'cashier', 'supervisor', 'admin'
    message_text TEXT,                            -- chat text
    receipt_image_url TEXT,                       -- Supabase storage URL or base64 photo of physical receipt
    is_system_message BOOLEAN DEFAULT FALSE,      -- true for automated validation logs
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_claim_threads_status ON public.claim_verification_threads(claim_status);
CREATE INDEX IF NOT EXISTS idx_claim_threads_trans_id ON public.claim_verification_threads(transaction_id);
CREATE INDEX IF NOT EXISTS idx_claim_threads_created_at ON public.claim_verification_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_messages_thread_id ON public.claim_verification_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_claim_messages_created_at ON public.claim_verification_messages(created_at ASC);

-- 5. ENABLE SUPABASE REALTIME
-- Allows instant messaging without page reloads
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_verification_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_verification_messages;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.claim_verification_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_verification_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access on claim_verification_threads"
    ON public.claim_verification_threads FOR SELECT USING (true);

CREATE POLICY "Allow insert on claim_verification_threads"
    ON public.claim_verification_threads FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on claim_verification_threads"
    ON public.claim_verification_threads FOR UPDATE USING (true);

CREATE POLICY "Allow read access on claim_verification_messages"
    ON public.claim_verification_messages FOR SELECT USING (true);

CREATE POLICY "Allow insert on claim_verification_messages"
    ON public.claim_verification_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on claim_verification_messages"
    ON public.claim_verification_messages FOR UPDATE USING (true);

-- 7. SUPABASE STORAGE BUCKET FOR RECEIPT PHOTOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('claim-receipts', 'claim-receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public uploads to claim-receipts bucket"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'claim-receipts');

CREATE POLICY "Allow public read from claim-receipts bucket"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'claim-receipts');
