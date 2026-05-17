-- Add threshold_days to chores
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS threshold_days INTEGER DEFAULT 3;

-- Update existing chores with the specific thresholds requested
UPDATE public.chores SET threshold_days = 7 WHERE name = 'Ir a comprar';
UPDATE public.chores SET threshold_days = 30 WHERE name = 'Cortar Pasto';
UPDATE public.chores SET threshold_days = 7 WHERE name = 'Limpiar Living';
UPDATE public.chores SET threshold_days = 1 WHERE name = 'Sacar popó perro';
UPDATE public.chores SET threshold_days = 1 WHERE name = 'Pasear perro';
UPDATE public.chores SET threshold_days = 1 WHERE name = 'Barrer cocina';
UPDATE public.chores SET threshold_days = 7 WHERE name = 'Limpiar patio';
UPDATE public.chores SET threshold_days = 2 WHERE name = 'Regar plantas';

-- Create proposals table
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    category TEXT NOT NULL,
    threshold_days INTEGER NOT NULL DEFAULT 3,
    created_by UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'approved', 'rejected'
);

-- Create votes table
CREATE TABLE public.proposal_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(proposal_id, member_id)
);

-- RLS for proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on proposals" ON public.proposals FOR SELECT USING (created_at > now() - interval '7 days');
CREATE POLICY "Allow members to insert proposals" ON public.proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update proposals" ON public.proposals FOR UPDATE USING (true);

-- RLS for votes
ALTER TABLE public.proposal_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on votes" ON public.proposal_votes FOR SELECT USING (true);
CREATE POLICY "Allow members to vote" ON public.proposal_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to delete their vote" ON public.proposal_votes FOR DELETE USING (true);
