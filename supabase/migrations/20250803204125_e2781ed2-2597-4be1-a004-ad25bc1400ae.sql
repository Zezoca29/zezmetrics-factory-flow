-- Verificar e corrigir política para aceitar/rejeitar convites
DROP POLICY IF EXISTS "Users can accept or reject invitations" ON public.user_permissions;

-- Criar política mais específica para aceitar/rejeitar convites
CREATE POLICY "Users can accept or reject invitations" 
ON public.user_permissions 
FOR UPDATE 
USING (
  auth.uid() = invited_user_id AND 
  status = 'pending'
)
WITH CHECK (
  auth.uid() = invited_user_id AND
  status IN ('accepted', 'rejected')
);