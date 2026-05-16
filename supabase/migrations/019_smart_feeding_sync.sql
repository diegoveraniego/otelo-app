CREATE OR REPLACE FUNCTION public.sync_feeding_slot_on_log()
RETURNS TRIGGER AS $$
DECLARE
    v_chore_category TEXT;
    v_chore_name TEXT;
    v_pet_id UUID;
    v_slot TEXT;
    v_hour INT;
    v_local_done_at TIMESTAMPTZ;
BEGIN
    -- Get chore details
    SELECT category, name INTO v_chore_category, v_chore_name FROM public.chores WHERE id = NEW.chore_id;
    
    -- Check if it's a pet feeding chore
    IF v_chore_category = 'Mascotas' OR v_chore_name ILIKE '%dar comida%' OR v_chore_name ILIKE '%feed%' THEN
        
        -- 1. Try to identify pet from chore name (matching pet name in chore name)
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

        -- If we still don't have a pet, we can't sync accurately
        IF v_pet_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- 2. Determine slot (morning/evening) based on local time (estimating GMT-4)
        -- Using UTC-4 as a heuristic for the user's region
        v_local_done_at := NEW.done_at AT TIME ZONE 'UTC' - INTERVAL '4 hours';
        v_hour := EXTRACT(HOUR FROM v_local_done_at);
        
        IF v_hour < 15 THEN 
            v_slot := 'morning'; 
        ELSE 
            v_slot := 'evening'; 
        END IF;

        -- 3. Update or Insert the feeding slot
        -- We UPSERT here because the slot might be "virtual" (doesn't exist in DB yet)
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
            DATE_TRUNC('week', v_local_done_at)::DATE,
            (EXTRACT(DOW FROM v_local_done_at)::INT + 6) % 7, -- Convert to 0=Mon
            v_slot,
            NEW.member_id,
            NEW.done_at
        )
        ON CONFLICT (pet_id, week_start, day_of_week, slot) 
        DO UPDATE SET 
            fed_by = EXCLUDED.fed_by,
            fed_at = EXCLUDED.fed_at
        WHERE public.feeding_slots.fed_at IS NULL; -- Only update if not already fed
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_feeding_slot ON public.logs;
CREATE TRIGGER trigger_sync_feeding_slot
AFTER INSERT OR UPDATE ON public.logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_feeding_slot_on_log();
