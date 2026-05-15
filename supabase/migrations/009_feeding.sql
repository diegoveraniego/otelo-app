-- ============================================================
-- 009_feeding.sql — Pet Feeding Schedule
-- ============================================================

-- Main schedule table: one row per (week, day, slot)
CREATE TABLE public.feeding_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start    DATE NOT NULL,        -- Always the Monday of the week (YYYY-MM-DD)
  day_of_week   INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  slot          TEXT NOT NULL CHECK (slot IN ('morning', 'evening')),
  assigned_to   UUID REFERENCES public.members(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ,          -- When the member signed up
  fed_at        TIMESTAMPTZ,          -- NULL = not fed yet, filled = already done
  fed_by        UUID REFERENCES public.members(id) ON DELETE SET NULL,
  UNIQUE (week_start, day_of_week, slot)
);

-- RLS
ALTER TABLE public.feeding_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read feeding_slots"   ON public.feeding_slots FOR SELECT USING (true);
CREATE POLICY "insert feeding_slots" ON public.feeding_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "update feeding_slots" ON public.feeding_slots FOR UPDATE USING (true);

-- ============================================================
-- Slot trade requests (same pattern as color_trades)
-- ============================================================
CREATE TABLE public.feeding_trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         UUID NOT NULL REFERENCES public.feeding_slots(id) ON DELETE CASCADE,
  from_member_id  UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  to_member_id    UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feeding_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read feeding_trades"   ON public.feeding_trades FOR SELECT USING (true);
CREATE POLICY "insert feeding_trades" ON public.feeding_trades FOR INSERT WITH CHECK (true);
CREATE POLICY "update feeding_trades" ON public.feeding_trades FOR UPDATE USING (true);
