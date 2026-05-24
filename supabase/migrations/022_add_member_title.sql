-- Add selected_title column to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS selected_title TEXT;
