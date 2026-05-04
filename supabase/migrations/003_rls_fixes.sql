-- Permitir a cualquier persona (anónimo) actualizar su perfil en members
CREATE POLICY "Allow anonymous update on members" ON public.members FOR UPDATE USING (true);

-- Permitir a cualquier persona (anónimo) eliminar sus registros de tareas
CREATE POLICY "Allow anonymous delete on logs" ON public.logs FOR DELETE USING (true);
