-- ========================================================
-- ISZA FAMILY - Schema Database: planning (Rencana Anggaran & Transaksi)
-- ========================================================
-- Jalankan query ini di Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'expense', -- 'expense' | 'income'
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    target_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    is_realized BOOLEAN DEFAULT FALSE,
    realized_at TIMESTAMPTZ,
    realized_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa query cepat
CREATE INDEX IF NOT EXISTS idx_planning_user_id ON public.planning(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_realized ON public.planning(is_realized);
CREATE INDEX IF NOT EXISTS idx_planning_target_date ON public.planning(target_date);
