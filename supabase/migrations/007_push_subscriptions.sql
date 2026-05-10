CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on push_subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete on push_subscriptions" ON public.push_subscriptions FOR DELETE USING (true);
