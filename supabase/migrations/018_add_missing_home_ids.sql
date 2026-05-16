-- Add home_id to tables that were missed
ALTER TABLE public.thanks ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE;
ALTER TABLE public.feeding_trades ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE;
ALTER TABLE public.color_trades ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE;
ALTER TABLE public.proposal_votes ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE;

-- Backfill these new columns
DO $$
DECLARE
    default_home_id UUID;
BEGIN
    SELECT id INTO default_home_id FROM public.homes LIMIT 1;
    
    IF default_home_id IS NOT NULL THEN
        UPDATE public.thanks SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.feeding_trades SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.color_trades SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.proposal_votes SET home_id = default_home_id WHERE home_id IS NULL;
    END IF;
END $$;

-- Make them NOT NULL where it makes sense (all of them should belong to a home)
ALTER TABLE public.thanks ALTER COLUMN home_id SET NOT NULL;
ALTER TABLE public.feeding_trades ALTER COLUMN home_id SET NOT NULL;
ALTER TABLE public.color_trades ALTER COLUMN home_id SET NOT NULL;
ALTER TABLE public.proposal_votes ALTER COLUMN home_id SET NOT NULL;
