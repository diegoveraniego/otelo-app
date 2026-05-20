-- Create member_achievements table
CREATE TABLE IF NOT EXISTS public.member_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(member_id, achievement_id)
);

-- RLS
ALTER TABLE public.member_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on member_achievements" 
ON public.member_achievements FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous insert on member_achievements" 
ON public.member_achievements FOR INSERT 
WITH CHECK (true);
