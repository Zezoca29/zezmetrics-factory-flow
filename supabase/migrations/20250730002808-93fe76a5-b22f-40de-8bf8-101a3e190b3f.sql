-- Atualizar políticas RLS para permitir acesso correto aos dados

-- Primeiro, atualizar os dados existentes para permitir acesso público temporário
-- (Isso é necessário porque os dados existentes não têm user_id)

-- Remover as políticas restritivas temporariamente
DROP POLICY IF EXISTS "Permitir acesso público a turnos" ON public.shifts;

-- Criar nova política para turnos (acesso público já que são dados compartilhados)
CREATE POLICY "Anyone can view shifts"
ON public.shifts
FOR ALL
USING (true);

-- Atualizar políticas de máquinas para permitir acesso aos dados existentes
DROP POLICY IF EXISTS "Users can view their own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can create their own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can update their own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can delete their own machines" ON public.machines;

CREATE POLICY "Users can view machines"
ON public.machines
FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own machines"
ON public.machines
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update machines"
ON public.machines
FOR UPDATE
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete machines"
ON public.machines
FOR DELETE
USING (user_id IS NULL OR auth.uid() = user_id);

-- Atualizar políticas de registros de produção
DROP POLICY IF EXISTS "Users can view their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can create their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can update their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can delete their own production records" ON public.production_records;

CREATE POLICY "Users can view production records"
ON public.production_records
FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own production records"
ON public.production_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update production records"
ON public.production_records
FOR UPDATE
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete production records"
ON public.production_records
FOR DELETE
USING (user_id IS NULL OR auth.uid() = user_id);