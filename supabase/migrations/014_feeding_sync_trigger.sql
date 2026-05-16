CREATE OR REPLACE FUNCTION public.sync_feeding_slot_on_log()
RETURNS TRIGGER AS $$
DECLARE
    chore_category TEXT;
    chore_name TEXT;
BEGIN
    SELECT category, name INTO chore_category, chore_name FROM public.chores WHERE id = NEW.chore_id;
    
    IF chore_category = 'Mascotas' OR chore_name ILIKE '%dar comida%' OR chore_name ILIKE '%feed%' THEN
        UPDATE public.feeding_slots
        SET fed_by = NEW.member_id,
            fed_at = NEW.done_at
        WHERE DATE(week_start + day_of_week) = DATE(NEW.done_at)
          AND assigned_to = NEW.member_id
          AND fed_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_feeding_slot ON public.logs;
CREATE TRIGGER trigger_sync_feeding_slot
AFTER INSERT ON public.logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_feeding_slot_on_log();
