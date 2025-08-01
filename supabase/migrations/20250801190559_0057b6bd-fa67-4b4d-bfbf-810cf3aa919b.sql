-- Adicionar campo email na tabela profiles para facilitar busca por email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Função para buscar usuário por email
CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE email = user_email LIMIT 1;
$$;