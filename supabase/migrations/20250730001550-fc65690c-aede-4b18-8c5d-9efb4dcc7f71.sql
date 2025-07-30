-- Corrigir política que estava referenciando user_id incorretamente

-- Remover política incorreta
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recriar política correta
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);