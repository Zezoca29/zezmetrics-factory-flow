-- Tornar user_id obrigatório e garantir isolamento completo

-- Primeiro, tornar user_id NOT NULL nas tabelas
ALTER TABLE public.machines 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.production_records 
ALTER COLUMN user_id SET NOT NULL;

-- Remover qualquer política que permita acesso público
DROP POLICY IF EXISTS "Permitir acesso público a máquinas" ON public.machines;
DROP POLICY IF EXISTS "Permitir acesso público a registros de produção" ON public.production_records;

-- Verificar se as políticas estão corretas (re-criar para garantir)
DROP POLICY IF EXISTS "Users can view their own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can create their own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can update their own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can delete their own machines" ON public.machines;

-- Políticas para máquinas - apenas dados do próprio usuário
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

-- Verificar políticas de produção
DROP POLICY IF EXISTS "Users can view their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can create their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can update their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can delete their own production records" ON public.production_records;

-- Políticas para registros de produção - apenas dados do próprio usuário  
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