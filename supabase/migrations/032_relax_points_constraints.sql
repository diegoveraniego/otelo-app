DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Drop all constraints on chores.points
    FOR r IN (
        SELECT con.conname 
        FROM pg_constraint con 
        INNER JOIN pg_class rel ON rel.oid = con.conrelid 
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace 
        INNER JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY(con.conkey)
        WHERE nsp.nspname = 'public' 
        AND rel.relname = 'chores' 
        AND a.attname = 'points'
        AND con.contype = 'c'
    ) LOOP 
        EXECUTE 'ALTER TABLE public.chores DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;

    -- Drop all constraints on proposals.proposed_points
    FOR r IN (
        SELECT con.conname 
        FROM pg_constraint con 
        INNER JOIN pg_class rel ON rel.oid = con.conrelid 
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace 
        INNER JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY(con.conkey)
        WHERE nsp.nspname = 'public' 
        AND rel.relname = 'proposals' 
        AND a.attname = 'proposed_points'
        AND con.contype = 'c'
    ) LOOP 
        EXECUTE 'ALTER TABLE public.proposals DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE public.chores ADD CONSTRAINT chores_points_check CHECK (points >= 1 AND points <= 20);
ALTER TABLE public.proposals ADD CONSTRAINT proposals_proposed_points_check CHECK (proposed_points >= 1 AND proposed_points <= 20);

UPDATE public.chores SET points = 9 WHERE name = 'Limpiar Living';
