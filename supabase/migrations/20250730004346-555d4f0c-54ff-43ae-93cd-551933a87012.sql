-- Corrigir políticas RLS para isolamento completo de dados por usuário

-- Atualizar políticas de máquinas para isolamento completo
DROP POLICY IF EXISTS "Users can view machines" ON public.machines;
DROP POLICY IF EXISTS "Users can create their own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can update machines" ON public.machines;
DROP POLICY IF EXISTS "Users can delete machines" ON public.machines;

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

-- Atualizar políticas de registros de produção para isolamento completo
DROP POLICY IF EXISTS "Users can view production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can create their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can update production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can delete production records" ON public.production_records;

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

-- Remover dados órfãos (sem user_id) para evitar confusão
DELETE FROM public.production_records WHERE user_id IS NULL;
DELETE FROM public.machines WHERE user_id IS NULL;