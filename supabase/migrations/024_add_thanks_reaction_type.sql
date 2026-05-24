-- Add reaction_type column to thanks table to support micro-reactions
ALTER TABLE public.thanks ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'heart';

-- Allow update and delete access for thanks reactions
DROP POLICY IF EXISTS "Allow anonymous update on thanks" ON public.thanks;
CREATE POLICY "Allow anonymous update on thanks" ON public.thanks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on thanks" ON public.thanks;
CREATE POLICY "Allow anonymous delete on thanks" ON public.thanks FOR DELETE USING (true);
