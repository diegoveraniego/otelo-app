-- Fix the feeding sync trigger to be smarter about the 15:00 threshold
-- If a feeding happens between 12:00 and 17:00, it should prefer the morning slot if it's not yet filled.

CREATE OR REPLACE FUNCTION public.sync_feeding_slot_on_log()
RETURNS TRIGGER AS $$
DECLARE
    v_chore_category TEXT;
    v_chore_name TEXT;
    v_pet_id UUID;
    v_slot TEXT;
    v_hour INT;
    v_local_done_at TIMESTAMPTZ;
    v_week_start DATE;
    v_day_of_week INT;
BEGIN
    -- Get chore details
    SELECT category, name INTO v_chore_category, v_chore_name FROM public.chores WHERE id = NEW.chore_id;
    
    -- Check if it's a pet feeding chore
    IF v_chore_category = 'Mascotas' OR v_chore_name ILIKE '%dar comida%' OR v_chore_name ILIKE '%feed%' THEN
        
        -- 1. Try to identify pet from chore name
        SELECT id INTO v_pet_id FROM public.pets 
        WHERE home_id = NEW.home_id 
          AND (v_chore_name ILIKE '%' || name || '%' OR name ILIKE '%' || REPLACE(REPLACE(v_chore_name, 'Dar comida y agua a ', ''), 'Dar comida y agua al ', '') || '%')
        LIMIT 1;
        
        -- Fallback: If only one pet exists in the home, use that
        IF v_pet_id IS NULL THEN
            IF (SELECT count(*) FROM public.pets WHERE home_id = NEW.home_id) = 1 THEN
                SELECT id INTO v_pet_id FROM public.pets WHERE home_id = NEW.home_id;
            END IF;
        END IF;

        IF v_pet_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- 2. Determine slot based on local time (estimating UTC-4 for Chile/regions with this setup)
        v_local_done_at := NEW.done_at AT TIME ZONE 'UTC' - INTERVAL '4 hours';
        v_hour := EXTRACT(HOUR FROM v_local_done_at);
        v_week_start := DATE_TRUNC('week', v_local_done_at)::DATE;
        v_day_of_week := (EXTRACT(DOW FROM v_local_done_at)::INT + 6) % 7;
        
        -- Smart Slot Selection:
        IF v_hour < 12 THEN 
            v_slot := 'morning'; 
        ELSIF v_hour >= 17 THEN
            v_slot := 'evening';
        ELSE
            -- In the gap (12:00 - 16:59)
            -- Check if morning slot is already fed
            IF EXISTS (
                SELECT 1 FROM public.feeding_slots 
                WHERE pet_id = v_pet_id 
                  AND week_start = v_week_start
                  AND day_of_week = v_day_of_week
                  AND slot = 'morning'
                  AND fed_at IS NOT NULL
            ) THEN
                v_slot := 'evening';
            ELSE
                v_slot := 'morning';
            END IF;
        END IF;

        -- 3. Update or Insert the feeding slot
        INSERT INTO public.feeding_slots (
            pet_id, 
            home_id, 
            week_start, 
            day_of_week, 
            slot, 
            fed_by, 
            fed_at
        )
        VALUES (
            v_pet_id,
            NEW.home_id,
            v_week_start,
            v_day_of_week,
            v_slot,
            NEW.member_id,
            NEW.done_at
        )
        ON CONFLICT (pet_id, week_start, day_of_week, slot) 
        DO UPDATE SET 
            fed_by = EXCLUDED.fed_by,
            fed_at = EXCLUDED.fed_at
        WHERE public.feeding_slots.fed_at IS NULL;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
