-- Update role constraint for members
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE public.members ADD CONSTRAINT members_role_check CHECK (role IN ('admin', 'member', 'organizator'));

-- Also update proposals and other relevant tables if they had role checks (none found in previous files)
