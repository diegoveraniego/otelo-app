-- Create tables
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    role TEXT NOT NULL DEFAULT 'member'
);

CREATE TABLE public.chores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    category TEXT
);

CREATE TABLE public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    chore_id UUID NOT NULL REFERENCES public.chores(id) ON DELETE CASCADE,
    done_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies (Assuming Anon access is allowed for now, since auth is managed at application level)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access on chores" ON public.chores FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access on logs" ON public.logs FOR SELECT USING (true);

-- Allow inserts on logs for anyone (app handles auth)
CREATE POLICY "Allow anonymous insert on logs" ON public.logs FOR INSERT WITH CHECK (true);

-- Seed Data

-- Members
INSERT INTO public.members (name, color, pin, role) VALUES
('Cecilia', '#ef4444', '1234', 'admin'),
('Luis', '#3b82f6', '1234', 'admin'),
('Florencia', '#10b981', '1234', 'member'),
('Josefa', '#f59e0b', '1234', 'member'),
('Pablo', '#8b5cf6', '1234', 'member'),
('Gonzalo', '#ec4899', '1234', 'member'),
('Diego', '#06b6d4', '1234', 'admin');

-- Chores
INSERT INTO public.chores (name, emoji, category) VALUES
('Lavar loza', '🍽️', 'Cocina'),
('Guardar loza', '🫙', 'Cocina'),
('Dar comida y agua a Otelo', '🐕', 'Mascotas'),
('Dar comida y agua a Gatos', '🐈', 'Mascotas'),
('Lavar Ropa', '👕', 'Limpieza'),
('Colgar Ropa', '🪢', 'Limpieza'),
('Doblar Ropa', '📦', 'Limpieza'),
('Limpiar Living', '🧹', 'Limpieza'),
('Cortar Pasto', '🌿', 'Jardín'),
('Cocinar para todos', '🍳', 'Cocina'),
('Ir a comprar', '🛒', 'Compras'),
('Sacar popó perro', '💩', 'Mascotas'),
('Sacar la basura', '🗑️', 'Limpieza'),
('Pasear perro', '🦮', 'Mascotas'),
('Barrer cocina', '🧹', 'Cocina'),
('Limpiar cocina', '🧼', 'Cocina'),
('Limpiar patio', '🍂', 'Jardín'),
('Regar plantas', '🪴', 'Jardín');
