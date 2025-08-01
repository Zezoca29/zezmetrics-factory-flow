-- Criar tabela para gerenciar convites e permissões entre usuários
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL, -- ID do usuário administrador
  invited_user_id UUID NOT NULL, -- ID do usuário convidado
  role TEXT NOT NULL DEFAULT 'viewer', -- função atribuída (viewer, operator, supervisor)
  status TEXT NOT NULL DEFAULT 'pending', -- status do convite (pending, accepted, rejected)
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint para evitar convites duplicados
  UNIQUE(admin_user_id, invited_user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para admins verem seus convites enviados
CREATE POLICY "Admins can view their sent invitations"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = admin_user_id);

-- Políticas para usuários verem convites recebidos
CREATE POLICY "Users can view received invitations"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = invited_user_id);

-- Políticas para admins criarem convites
CREATE POLICY "Admins can create invitations"
ON public.user_permissions
FOR INSERT
WITH CHECK (auth.uid() = admin_user_id);

-- Políticas para admins atualizarem seus convites
CREATE POLICY "Admins can update their invitations"
ON public.user_permissions
FOR UPDATE
USING (auth.uid() = admin_user_id);

-- Políticas para usuários aceitarem/rejeitarem convites
CREATE POLICY "Users can accept or reject invitations"
ON public.user_permissions
FOR UPDATE
USING (auth.uid() = invited_user_id AND status = 'pending');

-- Políticas para admins deletarem seus convites
CREATE POLICY "Admins can delete their invitations"
ON public.user_permissions
FOR DELETE
USING (auth.uid() = admin_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_user_permissions_admin ON public.user_permissions(admin_user_id);
CREATE INDEX idx_user_permissions_invited ON public.user_permissions(invited_user_id);
CREATE INDEX idx_user_permissions_status ON public.user_permissions(status);

-- Criar tabela para gerenciar contexto atual do usuário (qual dashboard está visualizando)
CREATE TABLE public.user_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE, -- ID do usuário logado
  viewing_as_user_id UUID NOT NULL, -- ID do usuário cujos dados está visualizando
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários gerenciarem seu próprio contexto
CREATE POLICY "Users can manage their own context"
ON public.user_context
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_context_updated_at
BEFORE UPDATE ON public.user_context
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();