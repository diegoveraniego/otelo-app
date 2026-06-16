-- Migration 027: Prevent cat chores from falling back to the dog calendar

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
    IF (v_chore_name ILIKE '%dar comida%' OR v_chore_name ILIKE '%feed%' OR v_chore_name ILIKE '%alimentar%') THEN
        
        -- STRICT EXCLUSION: If the chore is for cats, DO NOT sync it to the calendar.
        -- The calendar is only for dogs right now.
        IF v_chore_name ILIKE '%gato%' OR v_chore_name ILIKE '%cat%' THEN
            RETURN NEW;
        END IF;

        -- 1. Try to identify pet from chore name
        SELECT id INTO v_pet_id FROM public.pets 
        WHERE home_id = NEW.home_id 
          AND (v_chore_name ILIKE '%' || name || '%' OR name ILIKE '%' || REPLACE(REPLACE(v_chore_name, 'Dar comida y agua a ', ''), 'Dar comida y agua al ', '') || '%')
        LIMIT 1;
        
        IF v_pet_id IS NULL THEN
            IF (SELECT count(*) FROM public.pets WHERE home_id = NEW.home_id) = 1 THEN
                SELECT id INTO v_pet_id FROM public.pets WHERE home_id = NEW.home_id;
            END IF;
        END IF;

        IF v_pet_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- 2. Determine slot based on local time
        v_local_done_at := NEW.done_at AT TIME ZONE 'UTC' - INTERVAL '4 hours';
        v_hour := EXTRACT(HOUR FROM v_local_done_at);
        v_week_start := DATE_TRUNC('week', v_local_done_at)::DATE;
        v_day_of_week := (EXTRACT(DOW FROM v_local_done_at)::INT + 6) % 7;
        
        -- EXPLICIT SLOT via metadata
        IF NEW.metadata IS NOT NULL AND NEW.metadata->>'slot' IS NOT NULL THEN
            v_slot := NEW.metadata->>'slot';
        ELSE
            -- FALLBACK: Time-guessing
            IF v_hour < 12 THEN 
                v_slot := 'morning'; 
            ELSIF v_hour >= 17 THEN
                v_slot := 'evening';
            ELSE
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
        END IF;

        -- 3. Upsert the feeding slot
        INSERT INTO public.feeding_slots (
            pet_id, home_id, week_start, day_of_week, slot, fed_by, fed_at, feedings
        )
        VALUES (
            v_pet_id, NEW.home_id, v_week_start, v_day_of_week, v_slot,
            NEW.member_id, NEW.done_at,
            jsonb_build_array(jsonb_build_object('fed_by', NEW.member_id, 'fed_at', NEW.done_at))
        )
        ON CONFLICT (pet_id, week_start, day_of_week, slot) 
        DO UPDATE SET 
            fed_by = COALESCE(public.feeding_slots.fed_by, EXCLUDED.fed_by),
            fed_at = COALESCE(public.feeding_slots.fed_at, EXCLUDED.fed_at),
            feedings = COALESCE(public.feeding_slots.feedings, 
                                CASE 
                                    WHEN public.feeding_slots.fed_by IS NOT NULL THEN 
                                        jsonb_build_array(jsonb_build_object('fed_by', public.feeding_slots.fed_by, 'fed_at', public.feeding_slots.fed_at))
                                    ELSE '[]'::jsonb 
                                END
                       ) || jsonb_build_array(jsonb_build_object('fed_by', EXCLUDED.fed_by, 'fed_at', EXCLUDED.fed_at));
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
