-- Migration 028: Add proposal type and target chore for changing points

-- Add new columns to proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'new_chore';
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS target_chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS proposed_points INTEGER CHECK (proposed_points >= 1 AND proposed_points <= 5);

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS trigger_proposal_approval ON public.proposals;

CREATE OR REPLACE FUNCTION public.handle_proposal_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        IF NEW.type = 'new_chore' THEN
            INSERT INTO public.chores (name, emoji, category, threshold_days, home_id)
            VALUES (NEW.name, NEW.emoji, NEW.category, NEW.threshold_days, NEW.home_id);
        ELSIF NEW.type = 'update_chore_points' THEN
            UPDATE public.chores 
            SET points = NEW.proposed_points 
            WHERE id = NEW.target_chore_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposal_approval
AFTER UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.handle_proposal_approval();
