import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Factory } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Machine {
  id: string;
  name: string;
  code: string;
  sector: string;
  created_at: string;
  updated_at: string;
}

interface MachineFormData {
  name: string;
  code: string;
  sector: string;
}

export default function Machines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<MachineFormData>({
    name: "",
    code: "",
    sector: "",
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  async function fetchMachines() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMachines(data || []);
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as máquinas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.sector) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingMachine) {
        // Atualizar máquina existente
        const { error } = await supabase
          .from('machines')
          .update(formData)
          .eq('id', editingMachine.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Máquina atualizada com sucesso!",
        });
      } else {
        // Criar nova máquina
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuário não autenticado');
        }
        
        const { error } = await supabase
          .from('machines')
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Máquina criada com sucesso!",
        });
      }

      setDialogOpen(false);
      setEditingMachine(null);
      setFormData({ name: "", code: "", sector: "" });
      fetchMachines();
    } catch (error: any) {
      console.error('Erro ao salvar máquina:', error);
      toast({
        title: "Erro",
        description: error.message === 'duplicate key value violates unique constraint "machines_code_key"' 
          ? "Código da máquina já existe" 
          : "Não foi possível salvar a máquina",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta máquina?")) return;

    try {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Máquina excluída com sucesso!",
      });
      fetchMachines();
    } catch (error) {
      console.error('Erro ao excluir máquina:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a máquina",
        variant: "destructive",
      });
    }
  }

  function handleEdit(machine: Machine) {
    setEditingMachine(machine);
    setFormData({
      name: machine.name,
      code: machine.code,
      sector: machine.sector,
    });
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingMachine(null);
    setFormData({ name: "", code: "", sector: "" });
  }

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      'Produção': 'success',
      'Embalagem': 'warning',
      'Qualidade': 'secondary',
      'Manutenção': 'destructive',
    };
    return colors[sector] || 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando máquinas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Máquinas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as máquinas do sistema de produção
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="industrial" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Nova Máquina
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMachine ? "Editar Máquina" : "Nova Máquina"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Máquina</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Torno CNC 001"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    placeholder="Ex: TC-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sector">Setor</Label>
                  <Input
                    id="sector"
                    placeholder="Ex: Produção"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="industrial" className="flex-1">
                    {editingMachine ? "Atualizar" : "Criar"} Máquina
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Barra de pesquisa e estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar máquinas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Factory className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{machines.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Máquinas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center">
                  <Factory className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {machines.filter(m => m.sector === 'Produção').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Em Produção</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de máquinas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Máquinas</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMachines.length === 0 ? (
              <div className="text-center py-10">
                <Factory className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  {searchTerm ? "Nenhuma máquina encontrada" : "Nenhuma máquina cadastrada"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchTerm 
                    ? "Tente ajustar os termos da pesquisa" 
                    : "Clique em 'Nova Máquina' para começar"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMachines.map((machine) => (
                      <TableRow key={machine.id}>
                        <TableCell className="font-medium">{machine.name}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-sm">
                            {machine.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSectorColor(machine.sector) as any}>
                            {machine.sector}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(machine.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(machine)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(machine.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}