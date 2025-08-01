import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Permission {
  id: string;
  admin_user_id: string;
  invited_user_id: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at?: string;
}

interface UserProfile {
  id: string;
  user_name: string;
  company_name: string;
  role: string;
}

interface PermissionsContextType {
  currentViewingUserId: string | null;
  availableDashboards: UserProfile[];
  receivedInvitations: Permission[];
  sentInvitations: Permission[];
  switchDashboard: (userId: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  sendInvitation: (userEmail: string, role: string) => Promise<{ success: boolean; error?: string }>;
  updateInvitationRole: (invitationId: string, role: string) => Promise<void>;
  removeInvitation: (invitationId: string) => Promise<void>;
  getUserRole: (userId: string) => string;
  canEditData: boolean;
  canDeleteAccount: boolean;
  canManageUsers: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentViewingUserId, setCurrentViewingUserId] = useState<string | null>(null);
  const [availableDashboards, setAvailableDashboards] = useState<UserProfile[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<Permission[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Permission[]>([]);

  // Determinar permissões baseado no contexto atual
  const canEditData = currentViewingUserId === user?.id;
  const canDeleteAccount = currentViewingUserId === user?.id;
  const canManageUsers = currentViewingUserId === user?.id;

  useEffect(() => {
    if (user) {
      initializeContext();
      refreshPermissions();
    }
  }, [user]);

  const initializeContext = async () => {
    if (!user) return;

    // Verificar se existe contexto salvo
    const { data: context } = await supabase
      .from('user_context')
      .select('viewing_as_user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    setCurrentViewingUserId(context?.viewing_as_user_id || user.id);
  };

  const refreshPermissions = async () => {
    if (!user) return;

    // Buscar convites recebidos
    const { data: received } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('invited_user_id', user.id);

    setReceivedInvitations(received || []);

    // Buscar convites enviados
    const { data: sent } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('admin_user_id', user.id);

    setSentInvitations(sent || []);

    // Buscar dashboards disponíveis (admins que convidaram este usuário)
    const acceptedInvitations = (received || []).filter(inv => inv.status === 'accepted');
    
    if (acceptedInvitations.length > 0) {
      const adminIds = acceptedInvitations.map(inv => inv.admin_user_id);
      
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', adminIds);

      if (adminProfiles) {
        // Incluir o próprio perfil do usuário
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const dashboards = userProfile ? [userProfile, ...adminProfiles] : adminProfiles;
        setAvailableDashboards(dashboards);
      }
    } else {
      // Se não tem convites aceitos, mostrar apenas seu próprio dashboard
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setAvailableDashboards(userProfile ? [userProfile] : []);
    }
  };

  const switchDashboard = async (userId: string) => {
    if (!user) return;

    // Atualizar contexto no banco
    await supabase
      .from('user_context')
      .upsert({
        user_id: user.id,
        viewing_as_user_id: userId
      });

    setCurrentViewingUserId(userId);
    
    // Recarregar a página para aplicar o novo contexto
    window.location.reload();
  };

  const acceptInvitation = async (invitationId: string) => {
    await supabase
      .from('user_permissions')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    await refreshPermissions();
  };

  const rejectInvitation = async (invitationId: string) => {
    await supabase
      .from('user_permissions')
      .update({ status: 'rejected' })
      .eq('id', invitationId);

    await refreshPermissions();
  };

  const sendInvitation = async (userEmail: string, role: string) => {
    if (!user) return { success: false, error: "Usuário não logado" };

    // Buscar usuário pelo email
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id) // Precisa implementar busca por email
      .single();

    if (userError || !targetUser) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Criar convite
    const { error: inviteError } = await supabase
      .from('user_permissions')
      .insert({
        admin_user_id: user.id,
        invited_user_id: targetUser.id,
        role: role,
        status: 'pending'
      });

    if (inviteError) {
      return { success: false, error: "Erro ao enviar convite" };
    }

    await refreshPermissions();
    return { success: true };
  };

  const updateInvitationRole = async (invitationId: string, role: string) => {
    await supabase
      .from('user_permissions')
      .update({ role })
      .eq('id', invitationId);

    await refreshPermissions();
  };

  const removeInvitation = async (invitationId: string) => {
    await supabase
      .from('user_permissions')
      .delete()
      .eq('id', invitationId);

    await refreshPermissions();
  };

  const getUserRole = (userId: string): string => {
    if (currentViewingUserId === user?.id) {
      // Visualizando próprio dashboard
      return "admin";
    }

    // Encontrar a permissão para este usuário
    const permission = receivedInvitations.find(
      inv => inv.admin_user_id === userId && inv.status === 'accepted'
    );

    return permission?.role || "viewer";
  };

  return (
    <PermissionsContext.Provider
      value={{
        currentViewingUserId,
        availableDashboards,
        receivedInvitations,
        sentInvitations,
        switchDashboard,
        acceptInvitation,
        rejectInvitation,
        sendInvitation,
        updateInvitationRole,
        removeInvitation,
        getUserRole,
        canEditData,
        canDeleteAccount,
        canManageUsers,
        refreshPermissions
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}