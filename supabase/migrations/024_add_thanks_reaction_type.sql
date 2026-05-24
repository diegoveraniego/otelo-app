-- Add reaction_type column to thanks table to support micro-reactions
ALTER TABLE public.thanks ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'heart';
