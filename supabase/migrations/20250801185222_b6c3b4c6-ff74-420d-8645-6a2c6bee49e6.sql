-- Atualizar políticas para suportar visualização de dados por usuários convidados

-- Função auxiliar para verificar se um usuário tem permissão para ver dados de outro usuário
CREATE OR REPLACE FUNCTION public.has_permission_to_view(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_permissions 
    WHERE invited_user_id = auth.uid() 
    AND admin_user_id = target_user_id 
    AND status = 'accepted'
  );
$$;

-- Função para obter o contexto atual do usuário (qual dashboard está visualizando)
CREATE OR REPLACE FUNCTION public.get_current_viewing_context()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT viewing_as_user_id FROM public.user_context WHERE user_id = auth.uid()),
    auth.uid()
  );
$$;

-- Atualizar políticas das máquinas para permitir visualização por usuários convidados
DROP POLICY IF EXISTS "Users can view their own machines" ON public.machines;
CREATE POLICY "Users can view machines they have access to"
ON public.machines
FOR SELECT
USING (
  user_id = auth.uid() OR 
  user_id = public.get_current_viewing_context() OR
  public.has_permission_to_view(user_id)
);

-- Atualizar políticas dos registros de produção
DROP POLICY IF EXISTS "Users can view their own production records" ON public.production_records;
CREATE POLICY "Users can view production records they have access to"
ON public.production_records
FOR SELECT
USING (
  user_id = auth.uid() OR 
  user_id = public.get_current_viewing_context() OR
  public.has_permission_to_view(user_id)
);

-- Políticas para criação/edição/exclusão permanecem apenas para o próprio usuário
-- (usuários convidados só podem visualizar, não modificar)

-- Permitir que usuários vejam perfis de administradores que os convidaram
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles they have access to"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR 
  public.has_permission_to_view(id)
);