CREATE OR REPLACE FUNCTION public.onboard_home(
    p_home_name TEXT,
    p_members JSONB,
    p_pets JSONB,
    p_chores JSONB
) RETURNS UUID AS $$
DECLARE
    v_home_id UUID;
    v_member RECORD;
    v_pet RECORD;
    v_chore RECORD;
    v_member_id UUID;
BEGIN
    -- 1. Create home
    INSERT INTO public.homes (name) VALUES (p_home_name) RETURNING id INTO v_home_id;

    -- 2. Create members and link to home
    FOR v_member IN SELECT * FROM jsonb_to_recordset(p_members) AS x(name TEXT, color TEXT, pin TEXT, role TEXT) LOOP
        INSERT INTO public.members (name, color, pin, role, home_id)
        VALUES (v_member.name, v_member.color, v_member.pin, v_member.role, v_home_id)
        RETURNING id INTO v_member_id;

        INSERT INTO public.home_members (home_id, member_id)
        VALUES (v_home_id, v_member_id);
    END LOOP;

    -- 3. Create pets
    FOR v_pet IN SELECT * FROM jsonb_to_recordset(p_pets) AS x(name TEXT, type TEXT) LOOP
        INSERT INTO public.pets (name, type, home_id)
        VALUES (v_pet.name, v_pet.type, v_home_id);
    END LOOP;

    -- 4. Create chores
    FOR v_chore IN SELECT * FROM jsonb_to_recordset(p_chores) AS x(name TEXT, emoji TEXT, category TEXT, threshold_days INT) LOOP
        INSERT INTO public.chores (name, emoji, category, threshold_days, home_id)
        VALUES (v_chore.name, v_chore.emoji, v_chore.category, v_chore.threshold_days, v_home_id);
    END LOOP;

    RETURN v_home_id;
END;
$$ LANGUAGE plpgsql;
