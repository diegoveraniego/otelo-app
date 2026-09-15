-- Migration for Disputes system (Voting with quorum of 4)

CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES public.logs(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    disputed_by UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved_accepted', 'resolved_rejected'
    votes JSONB DEFAULT '{}'::jsonb, -- Store votes as { "member_id": "accept" | "reject" }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- RLS policies
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view disputes in their home" 
    ON public.disputes FOR SELECT 
    USING (home_id IN (SELECT home_id FROM public.members WHERE id = auth.uid()));

CREATE POLICY "Users can create disputes in their home" 
    ON public.disputes FOR INSERT 
    WITH CHECK (home_id IN (SELECT home_id FROM public.members WHERE id = auth.uid()));

CREATE POLICY "Users can update disputes in their home" 
    ON public.disputes FOR UPDATE 
    USING (home_id IN (SELECT home_id FROM public.members WHERE id = auth.uid()));

-- Add a dispute flag to logs for fast querying
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS has_dispute BOOLEAN DEFAULT FALSE;
