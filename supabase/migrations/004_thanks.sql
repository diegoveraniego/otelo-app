-- Tabla de agradecimientos
CREATE TABLE public.thanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES public.logs(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un usuario solo puede agradecer una vez por log
  UNIQUE(log_id, from_member_id)
);

ALTER TABLE public.thanks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on thanks" ON public.thanks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on thanks" ON public.thanks FOR INSERT WITH CHECK (true);
