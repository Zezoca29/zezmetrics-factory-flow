import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Building2, Bell, Shield, Trash2, Save, Eye, EyeOff, Users, Mail, CheckCircle, XCircle, UserPlus } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { 
    canDeleteAccount, 
    canManageUsers, 
    receivedInvitations, 
    sentInvitations,
    acceptInvitation,
    rejectInvitation,
    sendInvitation,
    updateInvitationRole,
    removeInvitation,
    refreshPermissions
  } = usePermissions();
  
  const [profile, setProfile] = useState({
    user_name: "",
    company_name: "",
    role: "operator"
  });
  const [notifications, setNotifications] = useState({
    email_alerts: true,
    production_reminders: true,
    daily_reports: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          user_name: data.user_name || "",
          company_name: data.company_name || "",
          role: data.role || "operator"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_name: profile.user_name,
          company_name: profile.company_name,
          role: profile.role
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.new.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;

      setPasswordData({ current: "", new: "", confirm: "" });
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar senha",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sendInvitation(inviteEmail, inviteRole);
      if (result.success) {
        toast({
          title: "Convite enviado",
          description: "O convite foi enviado com sucesso"
        });
        setInviteEmail("");
        setInviteRole("viewer");
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao enviar convite",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    console.log('🟢 Tentando aceitar convite:', invitationId);
    console.log('🟢 Usuário atual:', user?.id);
    
    try {
      await acceptInvitation(invitationId);
      console.log('🟢 Convite aceito com sucesso');
      toast({
        title: "Convite aceito",
        description: "Você agora tem acesso ao dashboard"
      });
    } catch (error) {
      console.error('🔴 Erro ao aceitar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao aceitar convite",
        variant: "destructive"
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    console.log('🟠 Tentando rejeitar convite:', invitationId);
    console.log('🟠 Usuário atual:', user?.id);
    
    try {
      await rejectInvitation(invitationId);
      console.log('🟠 Convite rejeitado com sucesso');
      toast({
        title: "Convite rejeitado",
        description: "O convite foi rejeitado"
      });
    } catch (error) {
      console.error('🔴 Erro ao rejeitar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar convite",
        variant: "destructive"
      });
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      // Aqui você implementaria a lógica de exclusão da conta
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A exclusão de conta será implementada em breve"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir conta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          )}
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Convites
            {receivedInvitations.filter(inv => inv.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {receivedInvitations.filter(inv => inv.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Nome do Usuário</Label>
                  <Input
                    id="userName"
                    value={profile.user_name}
                    onChange={(e) => setProfile({ ...profile, user_name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={profile.role} onValueChange={(value) => setProfile({ ...profile, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={updateProfile} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Configure os dados da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div className="space-y-2">
                <Label>Plano Atual</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Gratuito</Badge>
                  <span className="text-sm text-muted-foreground">
                    Recursos básicos incluídos
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={updateProfile} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Alertas por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas importantes por email
                  </p>
                </div>
                <Switch
                  checked={notifications.email_alerts}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, email_alerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Lembretes de Produção</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba lembretes sobre registros de produção
                  </p>
                </div>
                <Switch
                  checked={notifications.production_reminders}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, production_reminders: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Relatórios Diários</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba um resumo diário das atividades
                  </p>
                </div>
                <Switch
                  checked={notifications.daily_reports}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, daily_reports: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => toast({ title: "Configurações salvas", description: "Suas preferências de notificação foram atualizadas" })}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>
                  Convide usuários para acessar seu dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="inviteEmail">Email do Usuário</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Digite o email do usuário"
                    />
                  </div>
                  <div className="w-48 space-y-2">
                    <Label htmlFor="inviteRole">Função</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                        <SelectItem value="operator">Operador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSendInvitation} disabled={loading}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convidar
                    </Button>
                  </div>
                </div>

                {sentInvitations.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-4">Convites Enviados</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data do Convite</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sentInvitations.map((invitation) => (
                            <TableRow key={invitation.id}>
                              <TableCell>{invitation.invited_profile?.email || invitation.invited_user_id}</TableCell>
                              <TableCell>
                                <Select 
                                  value={invitation.role} 
                                  onValueChange={(value) => updateInvitationRole(invitation.id, value)}
                                  disabled={invitation.status !== 'pending'}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="viewer">Visualizador</SelectItem>
                                    <SelectItem value="operator">Operador</SelectItem>
                                    <SelectItem value="supervisor">Supervisor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  invitation.status === 'accepted' ? 'default' :
                                  invitation.status === 'pending' ? 'secondary' : 'destructive'
                                }>
                                  {invitation.status === 'accepted' ? 'Aceito' :
                                   invitation.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(invitation.invited_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeInvitation(invitation.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Convites Recebidos</CardTitle>
              <CardDescription>
                Gerencie os convites que você recebeu de outros usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você não possui convites no momento</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>De</TableHead>
                      <TableHead>Função Atribuída</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data do Convite</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.admin_profile?.email || invitation.admin_user_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {invitation.role === 'viewer' ? 'Visualizador' :
                             invitation.role === 'operator' ? 'Operador' : 'Supervisor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            invitation.status === 'accepted' ? 'default' :
                            invitation.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {invitation.status === 'accepted' ? 'Aceito' :
                             invitation.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.invited_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {invitation.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptInvitation(invitation.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectInvitation(invitation.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {invitation.status === 'accepted' && (
                            <span className="text-sm text-muted-foreground">
                              Aceito em {invitation.accepted_at ? new Date(invitation.accepted_at).toLocaleDateString('pt-BR') : '-'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura com uma senha forte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  placeholder="Digite sua nova senha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={updatePassword} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>
                Ações irreversíveis para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-destructive">Excluir Conta</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-fit">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todos os seus dados, incluindo máquinas, registros de produção e configurações serão permanentemente excluídos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-destructive hover:bg-destructive/90">
                        Sim, excluir minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}