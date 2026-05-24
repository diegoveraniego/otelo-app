-- Add feedings JSONB column to feeding_slots to support multiple feedings per slot
ALTER TABLE public.feeding_slots ADD COLUMN IF NOT EXISTS feedings JSONB;

-- Reconstruct feedings from historical logs
DO $$
DECLARE
    r RECORD;
    v_pet_id UUID;
    v_local_done_at TIMESTAMPTZ;
    v_hour INT;
    v_week_start DATE;
    v_day_of_week INT;
    v_slot TEXT;
BEGIN
    -- Clear feedings for clean rebuild
    UPDATE public.feeding_slots SET feedings = NULL;

    FOR r IN 
        SELECT l.id, l.member_id, l.home_id, l.done_at, c.name AS chore_name, c.category AS chore_category
        FROM public.logs l
        JOIN public.chores c ON l.chore_id = c.id
        WHERE c.category = 'Mascotas' OR c.name ILIKE '%dar comida%' OR c.name ILIKE '%feed%'
        ORDER BY l.done_at ASC
    LOOP
        -- 1. Try to identify pet from chore name
        SELECT id INTO v_pet_id FROM public.pets 
        WHERE home_id = r.home_id 
          AND (r.chore_name ILIKE '%' || name || '%' OR name ILIKE '%' || REPLACE(REPLACE(r.chore_name, 'Dar comida y agua a ', ''), 'Dar comida y agua al ', '') || '%')
        LIMIT 1;
        
        -- Fallback: If only one pet exists in the home, use that
        IF v_pet_id IS NULL THEN
            IF (SELECT count(*) FROM public.pets WHERE home_id = r.home_id) = 1 THEN
                SELECT id INTO v_pet_id FROM public.pets WHERE home_id = r.home_id;
            END IF;
        END IF;

        IF v_pet_id IS NOT NULL THEN
            -- 2. Determine slot based on local time (estimating UTC-4)
            v_local_done_at := r.done_at AT TIME ZONE 'UTC' - INTERVAL '4 hours';
            v_hour := EXTRACT(HOUR FROM v_local_done_at);
            v_week_start := DATE_TRUNC('week', v_local_done_at)::DATE;
            v_day_of_week := (EXTRACT(DOW FROM v_local_done_at)::INT + 6) % 7;
            
            -- Smart Slot Selection
            IF v_hour < 12 THEN 
                v_slot := 'morning'; 
            ELSIF v_hour >= 17 THEN
                v_slot := 'evening';
            ELSE
                -- In the gap (12:00 - 16:59)
                -- Check if morning slot is already fed in this run
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
                fed_at,
                feedings
            )
            VALUES (
                v_pet_id,
                r.home_id,
                v_week_start,
                v_day_of_week,
                v_slot,
                r.member_id,
                r.done_at,
                jsonb_build_array(jsonb_build_object('fed_by', r.member_id, 'fed_at', r.done_at))
            )
            ON CONFLICT (pet_id, week_start, day_of_week, slot) 
            DO UPDATE SET 
                fed_by = COALESCE(public.feeding_slots.fed_by, EXCLUDED.fed_by),
                fed_at = COALESCE(public.feeding_slots.fed_at, EXCLUDED.fed_at),
                feedings = COALESCE(public.feeding_slots.feedings, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('fed_by', EXCLUDED.fed_by, 'fed_at', EXCLUDED.fed_at));
        END IF;
    END LOOP;
END $$;

-- Update the sync_feeding_slot_on_log function to support appending feedings on conflict
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

        -- 3. Update or Insert the feeding slot, appending to feedings on conflict
        INSERT INTO public.feeding_slots (
            pet_id, 
            home_id, 
            week_start, 
            day_of_week, 
            slot, 
            fed_by, 
            fed_at,
            feedings
        )
        VALUES (
            v_pet_id,
            NEW.home_id,
            v_week_start,
            v_day_of_week,
            v_slot,
            NEW.member_id,
            NEW.done_at,
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
