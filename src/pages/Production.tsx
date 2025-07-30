import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, ClipboardList, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Machine {
  id: string;
  name: string;
  code: string;
  sector: string;
}

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

interface ProductionRecord {
  id: string;
  machine_id: string;
  shift_id: string;
  date: string;
  planned_production: number;
  actual_production: number;
  downtime_minutes: number;
  downtime_reason: string | null;
  defective_units: number;
  created_at: string;
  machines: Machine;
  shifts: Shift;
}

interface ProductionFormData {
  machine_id: string;
  shift_id: string;
  date: string;
  planned_production: number;
  actual_production: number;
  downtime_minutes: number;
  downtime_reason: string;
  defective_units: number;
}

export default function Production() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [formData, setFormData] = useState<ProductionFormData>({
    machine_id: "",
    shift_id: "",
    date: new Date().toISOString().split('T')[0],
    planned_production: 0,
    actual_production: 0,
    downtime_minutes: 0,
    downtime_reason: "",
    defective_units: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Buscar registros de produção
      const { data: recordsData, error: recordsError } = await supabase
        .from('production_records')
        .select(`
          *,
          machines (
            id,
            name,
            code,
            sector
          ),
          shifts (
            id,
            name,
            start_time,
            end_time
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

      // Buscar máquinas
      const { data: machinesData, error: machinesError } = await supabase
        .from('machines')
        .select('*')
        .order('name');

      if (machinesError) throw machinesError;
      setMachines(machinesData || []);

      // Buscar turnos
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time');

      if (shiftsError) throw shiftsError;
      setShifts(shiftsData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.machine_id || !formData.shift_id || !formData.date) {
      toast({
        title: "Erro",
        description: "Máquina, turno e data são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingRecord) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('production_records')
          .update(formData)
          .eq('id', editingRecord.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Registro atualizado com sucesso!",
        });
      } else {
        // Criar novo registro
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuário não autenticado');
        }
        
        const { error } = await supabase
          .from('production_records')
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Registro criado com sucesso!",
        });
      }

      setDialogOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o registro",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
      const { error } = await supabase
        .from('production_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!",
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro",
        variant: "destructive",
      });
    }
  }

  function handleEdit(record: ProductionRecord) {
    setEditingRecord(record);
    setFormData({
      machine_id: record.machine_id,
      shift_id: record.shift_id,
      date: record.date,
      planned_production: record.planned_production,
      actual_production: record.actual_production,
      downtime_minutes: record.downtime_minutes,
      downtime_reason: record.downtime_reason || "",
      defective_units: record.defective_units,
    });
    setDialogOpen(true);
  }

  function resetForm() {
    setFormData({
      machine_id: "",
      shift_id: "",
      date: new Date().toISOString().split('T')[0],
      planned_production: 0,
      actual_production: 0,
      downtime_minutes: 0,
      downtime_reason: "",
      defective_units: 0,
    });
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingRecord(null);
    resetForm();
  }

  function calculateOEE(record: ProductionRecord) {
    const shiftMinutes = 8 * 60; // 8 horas por turno
    const availability = ((shiftMinutes - record.downtime_minutes) / shiftMinutes) * 100;
    const performance = (record.actual_production / record.planned_production) * 100;
    const goodUnits = record.actual_production - record.defective_units;
    const quality = record.actual_production > 0 ? (goodUnits / record.actual_production) * 100 : 0;
    const oee = (availability * performance * quality) / 10000;
    
    return Math.round(oee);
  }

  function getOEEStatus(oee: number) {
    if (oee >= 85) return { label: "Excelente", variant: "success" as const };
    if (oee >= 75) return { label: "Bom", variant: "secondary" as const };
    if (oee >= 65) return { label: "Atenção", variant: "warning" as const };
    return { label: "Crítico", variant: "destructive" as const };
  }

  const filteredRecords = records.filter(record =>
    record.machines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.machines.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.shifts.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Registro de Produção</h1>
            <p className="text-muted-foreground">
              Registre e monitore a produção diária das máquinas
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="industrial" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "Editar Registro" : "Novo Registro de Produção"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="machine">Máquina</Label>
                    <Select value={formData.machine_id} onValueChange={(value) => setFormData({ ...formData, machine_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma máquina" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.name} ({machine.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shift">Turno</Label>
                    <Select value={formData.shift_id} onValueChange={(value) => setFormData({ ...formData, shift_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um turno" />
                      </SelectTrigger>
                      <SelectContent>
                        {shifts.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_time} - {shift.end_time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planned">Produção Planejada</Label>
                    <Input
                      id="planned"
                      type="number"
                      min="0"
                      value={formData.planned_production}
                      onChange={(e) => setFormData({ ...formData, planned_production: Number(e.target.value) })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="actual">Produção Real</Label>
                    <Input
                      id="actual"
                      type="number"
                      min="0"
                      value={formData.actual_production}
                      onChange={(e) => setFormData({ ...formData, actual_production: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="downtime">Parada (minutos)</Label>
                    <Input
                      id="downtime"
                      type="number"
                      min="0"
                      max="480"
                      value={formData.downtime_minutes}
                      onChange={(e) => setFormData({ ...formData, downtime_minutes: Number(e.target.value) })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defective">Peças Defeituosas</Label>
                    <Input
                      id="defective"
                      type="number"
                      min="0"
                      value={formData.defective_units}
                      onChange={(e) => setFormData({ ...formData, defective_units: Number(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo da Parada</Label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo da parada (opcional)"
                    value={formData.downtime_reason}
                    onChange={(e) => setFormData({ ...formData, downtime_reason: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="industrial" className="flex-1">
                    {editingRecord ? "Atualizar" : "Criar"} Registro
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{records.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Registros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">
                    {records.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Registros Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de registros */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Produção</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  {searchTerm ? "Nenhum registro encontrado" : "Nenhum registro de produção"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchTerm 
                    ? "Tente ajustar os termos da pesquisa" 
                    : "Clique em 'Novo Registro' para começar"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Máquina</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Planejado</TableHead>
                      <TableHead>Produzido</TableHead>
                      <TableHead>Parada (min)</TableHead>
                      <TableHead>Defeitos</TableHead>
                      <TableHead>OEE</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const oee = calculateOEE(record);
                      const status = getOEEStatus(oee);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.machines.name}</div>
                              <div className="text-sm text-muted-foreground">{record.machines.code}</div>
                            </div>
                          </TableCell>
                          <TableCell>{record.shifts.name}</TableCell>
                          <TableCell>{record.planned_production}</TableCell>
                          <TableCell>{record.actual_production}</TableCell>
                          <TableCell>{record.downtime_minutes}</TableCell>
                          <TableCell>{record.defective_units}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {oee}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(record.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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