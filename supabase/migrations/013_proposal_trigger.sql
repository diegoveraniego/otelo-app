CREATE OR REPLACE FUNCTION public.handle_proposal_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO public.chores (name, emoji, category, threshold_days, home_id)
        VALUES (NEW.name, NEW.emoji, NEW.category, NEW.threshold_days, NEW.home_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposal_approval ON public.proposals;
CREATE TRIGGER trigger_proposal_approval
AFTER UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.handle_proposal_approval();
