-- Create color_trades table
CREATE TABLE public.color_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    to_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.color_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on color_trades" ON public.color_trades FOR SELECT USING (true);
CREATE POLICY "Allow members to insert trade requests" ON public.color_trades FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update their own trade requests" ON public.color_trades FOR UPDATE USING (true);

-- RPC to swap colors safely
CREATE OR REPLACE FUNCTION swap_member_colors(member_a_id UUID, member_b_id UUID)
RETURNS VOID AS $$
DECLARE
    color_a TEXT;
    color_b TEXT;
BEGIN
    SELECT color INTO color_a FROM members WHERE id = member_a_id;
    SELECT color INTO color_b FROM members WHERE id = member_b_id;

    UPDATE members SET color = color_b WHERE id = member_a_id;
    UPDATE members SET color = color_a WHERE id = member_b_id;
END;
$$ LANGUAGE plpgsql;
