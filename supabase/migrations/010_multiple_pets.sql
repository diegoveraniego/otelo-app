-- ============================================================
-- 010_multiple_pets.sql — Support for multiple pets
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT, -- dog, cat, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read pets"   ON public.pets FOR SELECT USING (true);
CREATE POLICY "insert pets" ON public.pets FOR INSERT WITH CHECK (true);
CREATE POLICY "update pets" ON public.pets FOR UPDATE USING (true);
CREATE POLICY "delete pets" ON public.pets FOR DELETE USING (true);

-- Add pet_id to feeding_slots
ALTER TABLE public.feeding_slots ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE;

-- If there are existing slots, create a default pet and assign them
DO $$
DECLARE
  default_pet_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.feeding_slots WHERE pet_id IS NULL) THEN
    INSERT INTO public.pets (name, type) VALUES ('Mascota', 'dog') RETURNING id INTO default_pet_id;
    UPDATE public.feeding_slots SET pet_id = default_pet_id WHERE pet_id IS NULL;
  END IF;
END $$;

-- Make pet_id NOT NULL after migration
-- ALTER TABLE public.feeding_slots ALTER COLUMN pet_id SET NOT NULL; -- Let's keep it nullable for now just in case, but unique constraint will handle it

-- Update UNIQUE constraint
ALTER TABLE public.feeding_slots DROP CONSTRAINT IF EXISTS feeding_slots_week_start_day_of_week_slot_key;
-- First ensure no null pet_ids if we want a strong constraint, but for now we allow multiple pets
ALTER TABLE public.feeding_slots ADD CONSTRAINT feeding_slots_pet_week_day_slot_key UNIQUE (pet_id, week_start, day_of_week, slot);
