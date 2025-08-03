-- Atualizar política para permitir que usuários vejam perfis de admins que os convidaram
DROP POLICY IF EXISTS "Users can view profiles they have access to" ON public.profiles;

CREATE POLICY "Users can view profiles they have access to" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() OR 
  has_permission_to_view(id) OR
  -- Permitir que usuários vejam perfis de admins que os convidaram
  EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE admin_user_id = profiles.id 
    AND invited_user_id = auth.uid()
  )
);