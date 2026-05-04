-- Añadir la columna avatar_url a la tabla members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Crear el storage bucket 'avatars' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir a cualquier persona (anónimo) ver los avatares
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Permitir a cualquier persona subir avatares (basado en app auth)
CREATE POLICY "Anyone can upload an avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- Permitir actualizar avatares existentes
CREATE POLICY "Anyone can update an avatar"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'avatars');
