-- Supabase PostgreSQL Schema for LocalStorage Key-Value Syncing

-- Create a table specifically designed to hold your app's localStorage state
CREATE TABLE IF NOT EXISTS public.app_state (
    store_key TEXT PRIMARY KEY,
    store_value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Create default policies (Can be adjusted based on exact security needs)
-- For a single-school generic setup, granting all authenticated and anon access temporarily 
-- to allow the application to sync. In production, this should be restricted by auth.uid().
CREATE POLICY "Allow read access for all" ON public.app_state FOR SELECT USING (true);
CREATE POLICY "Allow ALL access for all" ON public.app_state FOR ALL USING (true);
