-- Atualizar a função handle_new_user para atribuir papel de admin automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, user_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'user_name',
    NEW.email,
    'admin'
  );
  RETURN NEW;
END;
$$;

-- Atualizar usuários existentes para serem administradores se ainda não têm papel definido
UPDATE public.profiles 
SET role = 'admin' 
WHERE role = 'operator' OR role IS NULL;

-- Função para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Remover política existente
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Criar política para permitir que usuários atualizem seu perfil, exceto o papel
CREATE POLICY "Users can update their own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Criar política para permitir que administradores alterem papéis de usuários convidados
CREATE POLICY "Admins can update roles of invited users" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() != id AND 
  EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE admin_user_id = auth.uid() 
    AND invited_user_id = profiles.id 
    AND status = 'accepted'
  )
);