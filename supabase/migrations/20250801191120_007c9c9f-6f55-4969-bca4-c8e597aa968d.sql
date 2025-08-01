-- Atualizar a função handle_new_user para incluir o email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, user_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'user_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Atualizar o email dos perfis existentes que não têm email
UPDATE public.profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;