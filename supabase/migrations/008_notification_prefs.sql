ALTER TABLE public.members ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"thanks": true, "chores": true, "summary": true, "trade": true}'::jsonb;
