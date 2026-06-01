-- Add points to chores
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;

-- Create chore_votes table
CREATE TABLE IF NOT EXISTS public.chore_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chore_id UUID NOT NULL REFERENCES public.chores(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points >= 1 AND points <= 5),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(chore_id, member_id)
);

-- Enable RLS
ALTER TABLE public.chore_votes ENABLE ROW LEVEL SECURITY;

-- Policies for chore_votes
CREATE POLICY "Allow anonymous read access on chore_votes" ON public.chore_votes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on chore_votes" ON public.chore_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on chore_votes" ON public.chore_votes FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on chore_votes" ON public.chore_votes FOR DELETE USING (true);
