-- 1. Create homes table
CREATE TABLE IF NOT EXISTS public.homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create home_members table
CREATE TABLE IF NOT EXISTS public.home_members (
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (home_id, member_id)
);

-- 3. Add home_id to various tables (initially nullable for backfill)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL;
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL;
ALTER TABLE public.feeding_slots ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL;
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL;

-- 4. Enable RLS on new tables
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on homes" ON public.homes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access on home_members" ON public.home_members FOR SELECT USING (true);

-- 5. Backfill existing data into a default home
DO $$
DECLARE
    default_home_id UUID;
BEGIN
    -- Only backfill if there are members but no homes
    IF EXISTS (SELECT 1 FROM public.members WHERE home_id IS NULL) AND NOT EXISTS (SELECT 1 FROM public.homes) THEN
        INSERT INTO public.homes (name) VALUES ('Hogar Inicial') RETURNING id INTO default_home_id;
        
        -- Assign all current members to this home
        UPDATE public.members SET home_id = default_home_id WHERE home_id IS NULL;
        
        -- Fill home_members
        INSERT INTO public.home_members (home_id, member_id)
        SELECT home_id, id FROM public.members;
        
        -- Update all other tables
        UPDATE public.chores SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.pets SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.feeding_slots SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.logs SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.proposals SET home_id = default_home_id WHERE home_id IS NULL;
        UPDATE public.push_subscriptions SET home_id = default_home_id WHERE home_id IS NULL;
    END IF;
END $$;

-- 6. Make home_id NOT NULL where appropriate
-- Note: In a production environment with existing data, ensure backfill was successful before this step.
-- We use a DO block to safely apply NOT NULL only if we managed to backfill or if the table is empty.
DO $$
BEGIN
    -- members
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE home_id IS NULL) THEN
        ALTER TABLE public.members ALTER COLUMN home_id SET NOT NULL;
    END IF;
    -- chores
    IF NOT EXISTS (SELECT 1 FROM public.chores WHERE home_id IS NULL) THEN
        ALTER TABLE public.chores ALTER COLUMN home_id SET NOT NULL;
    END IF;
    -- pets
    IF NOT EXISTS (SELECT 1 FROM public.pets WHERE home_id IS NULL) THEN
        ALTER TABLE public.pets ALTER COLUMN home_id SET NOT NULL;
    END IF;
    -- logs
    IF NOT EXISTS (SELECT 1 FROM public.logs WHERE home_id IS NULL) THEN
        ALTER TABLE public.logs ALTER COLUMN home_id SET NOT NULL;
    END IF;
    -- proposals
    IF NOT EXISTS (SELECT 1 FROM public.proposals WHERE home_id IS NULL) THEN
        ALTER TABLE public.proposals ALTER COLUMN home_id SET NOT NULL;
    END IF;
    -- push_subscriptions
    IF NOT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE home_id IS NULL) THEN
        ALTER TABLE public.push_subscriptions ALTER COLUMN home_id SET NOT NULL;
    END IF;
END $$;
