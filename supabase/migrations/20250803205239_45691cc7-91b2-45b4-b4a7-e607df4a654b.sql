-- Verificar se a função get_current_viewing_context existe e funciona corretamente
CREATE OR REPLACE FUNCTION get_current_viewing_context()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT viewing_as_user_id 
     FROM user_context 
     WHERE user_id = auth.uid() 
     LIMIT 1),
    auth.uid()
  );
$$;

-- Criar função para verificar se o usuário tem permissão para visualizar dados de outro usuário
CREATE OR REPLACE FUNCTION has_permission_to_view(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_permissions 
    WHERE admin_user_id = target_user_id 
      AND invited_user_id = auth.uid() 
      AND status = 'accepted'
  );
$$;

-- Atualizar políticas de máquinas para usar o contexto correto
DROP POLICY IF EXISTS "Users can view machines they have access to" ON public.machines;

CREATE POLICY "Users can view machines they have access to"
ON public.machines
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id = get_current_viewing_context()
  OR has_permission_to_view(user_id)
);

-- Atualizar políticas de production_records para usar o contexto correto
DROP POLICY IF EXISTS "Users can view production records they have access to" ON public.production_records;

CREATE POLICY "Users can view production records they have access to"
ON public.production_records
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id = get_current_viewing_context()
  OR has_permission_to_view(user_id)
);