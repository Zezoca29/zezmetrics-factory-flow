-- Criar tabela de perfis de usuário para ZezMetrics
-- Esta tabela armazenará informações adicionais dos usuários industriais

CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  user_name TEXT,
  role TEXT DEFAULT 'operator',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Função para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, user_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'user_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar políticas das tabelas existentes para filtrar por usuário
-- Primeiro, vamos adicionar user_id às tabelas existentes

-- Adicionar user_id às máquinas
ALTER TABLE public.machines ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Adicionar user_id aos registros de produção  
ALTER TABLE public.production_records ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Atualizar máquinas existentes com um usuário padrão (temporário para migração)
UPDATE public.machines SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Atualizar registros existentes com um usuário padrão (temporário para migração)
UPDATE public.production_records SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Tornar user_id obrigatório após a migração
ALTER TABLE public.machines ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.production_records ALTER COLUMN user_id SET NOT NULL;

-- Atualizar políticas existentes para filtrar por usuário
DROP POLICY IF EXISTS "Permitir acesso público a máquinas" ON public.machines;
DROP POLICY IF EXISTS "Permitir acesso público a registros de produção" ON public.production_records;

-- Novas políticas baseadas em usuário
CREATE POLICY "Users can view their own machines"
ON public.machines
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own machines"
ON public.machines
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own machines"
ON public.machines
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own machines"
ON public.machines
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own production records"
ON public.production_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own production records"
ON public.production_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own production records"
ON public.production_records
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own production records"
ON public.production_records
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at nos profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();