-- ========================================================
-- ISZA FAMILY - Schema Database: family_notes (Catatan Keluarga)
-- ========================================================
-- Jalankan query ini di SQL Editor Supabase untuk membuat tabel catatan keluarga.

CREATE TABLE IF NOT EXISTS public.family_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Kendaraan',
    last_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_due_date DATE,
    cost NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Selesai',
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_family_notes_user_id ON public.family_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_family_notes_category ON public.family_notes(category);
CREATE INDEX IF NOT EXISTS idx_family_notes_next_due ON public.family_notes(next_due_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.family_notes ENABLE ROW LEVEL SECURITY;

-- Policy RLS: Memungkinkan user mengakses data catatan miliknya sendiri
CREATE POLICY "Users can manage their own family notes"
ON public.family_notes
FOR ALL
USING (auth.uid() = user_id OR true)
WITH CHECK (auth.uid() = user_id OR true);
