import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SimpleBarChart } from "@/components/charts/SimpleChart";
import { CalendarIcon, Download, TrendingUp, TrendingDown, Activity, AlertTriangle, Target, Clock } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/contexts/PermissionsContext";
import { toast } from "@/hooks/use-toast";

interface ProductionRecord {
  id: string;
  date: string;
  planned_production: number;
  actual_production: number;
  downtime_minutes: number;
  downtime_reason?: string;
  defective_units: number;
  machines: {
    id: string;
    name: string;
    code: string;
    sector: string;
  };
}

interface MetricsSummary {
  totalProduction: number;
  totalPlanned: number;
  totalDowntime: number;
  totalDefects: number;
  efficiencyRate: number;
  qualityRate: number;
  oeeScore: number;
  availabilityRate: number;
  performanceRate: number;
}

export function Reports() {
  const { currentViewingUserId } = usePermissions();
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("week");
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [productionData, setProductionData] = useState<ProductionRecord[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary>({
    totalProduction: 0,
    totalPlanned: 0,
    totalDowntime: 0,
    totalDefects: 0,
    efficiencyRate: 0,
    qualityRate: 0,
    oeeScore: 0,
    availabilityRate: 0,
    performanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentViewingUserId, dateRange, startDate, endDate, selectedMachine, selectedSector]);

  useEffect(() => {
    updateDateRange();
  }, [dateRange]);

  const updateDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        setStartDate(now);
        setEndDate(now);
        break;
      case "week":
        setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case "month":
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
    }
  };

  const fetchData = async () => {
    if (!currentViewingUserId) return;
    
    setLoading(true);
    try {
      // Buscar máquinas
      const { data: machinesData } = await supabase
        .from('machines')
        .select('*')
        .eq('user_id', currentViewingUserId);

      setMachines(machinesData || []);

      // Construir query para registros de produção
      let query = supabase
        .from('production_records')
        .select(`
          *,
          machines!inner(id, name, code, sector)
        `)
        .eq('user_id', currentViewingUserId);

      // Filtros de data
      if (startDate) {
        query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('date', format(endDate, 'yyyy-MM-dd'));
      }

      // Filtros de máquina e setor
      if (selectedMachine !== 'all') {
        query = query.eq('machine_id', selectedMachine);
      }
      if (selectedSector !== 'all') {
        query = query.eq('machines.sector', selectedSector);
      }

      const { data: records } = await query.order('date', { ascending: false });

      setProductionData(records || []);
      calculateMetrics(records || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (records: ProductionRecord[]) => {
    if (!records.length) {
      setMetrics({
        totalProduction: 0,
        totalPlanned: 0,
        totalDowntime: 0,
        totalDefects: 0,
        efficiencyRate: 0,
        qualityRate: 0,
        oeeScore: 0,
        availabilityRate: 0,
        performanceRate: 0
      });
      return;
    }

    const totalProduction = records.reduce((sum, record) => sum + record.actual_production, 0);
    const totalPlanned = records.reduce((sum, record) => sum + record.planned_production, 0);
    const totalDowntime = records.reduce((sum, record) => sum + record.downtime_minutes, 0);
    const totalDefects = records.reduce((sum, record) => sum + record.defective_units, 0);

    // Cálculo das taxas OEE
    const workingMinutes = records.length * 480; // 8 horas por dia
    const availableMinutes = workingMinutes - totalDowntime;
    const availabilityRate = (availableMinutes / workingMinutes) * 100;
    
    const performanceRate = totalPlanned > 0 ? (totalProduction / totalPlanned) * 100 : 0;
    const qualityRate = totalProduction > 0 ? ((totalProduction - totalDefects) / totalProduction) * 100 : 0;
    const efficiencyRate = totalPlanned > 0 ? (totalProduction / totalPlanned) * 100 : 0;
    
    const oeeScore = (availabilityRate * performanceRate * qualityRate) / 10000;

    setMetrics({
      totalProduction,
      totalPlanned,
      totalDowntime,
      totalDefects,
      efficiencyRate: Math.max(0, efficiencyRate),
      qualityRate: Math.max(0, qualityRate),
      oeeScore: Math.max(0, oeeScore),
      availabilityRate: Math.max(0, availabilityRate),
      performanceRate: Math.max(0, performanceRate)
    });
  };

  const getEfficiencyColor = (value: number) => {
    if (value >= 85) return "text-green-600";
    if (value >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getEfficiencyIcon = (value: number) => {
    if (value >= 85) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value >= 70) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const sectors = [...new Set(machines.map(m => m.sector))];

  const chartData = productionData.slice(0, 10).reverse().map(record => ({
    name: format(new Date(record.date), 'dd/MM', { locale: ptBR }),
    value: record.actual_production,
    planned: record.planned_production,
    actual: record.actual_production,
    defects: record.defective_units
  }));

  const exportData = () => {
    const csvContent = [
      ['Data', 'Máquina', 'Setor', 'Produção Planejada', 'Produção Real', 'Defeitos', 'Tempo Parado (min)', 'Motivo da Parada'].join(','),
      ...productionData.map(record => [
        record.date,
        record.machines.name,
        record.machines.sector,
        record.planned_production,
        record.actual_production,
        record.defective_units,
        record.downtime_minutes,
        record.downtime_reason || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_producao_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios de Produção</h1>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === "custom" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Setor</label>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Máquina</label>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Máquinas</SelectItem>
                {machines
                  .filter(machine => selectedSector === "all" || machine.sector === selectedSector)
                  .map(machine => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.code} - {machine.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Geral</CardTitle>
            {getEfficiencyIcon(metrics.efficiencyRate)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(metrics.efficiencyRate)}`}>
              {metrics.efficiencyRate.toFixed(1)}%
            </div>
            <Progress value={metrics.efficiencyRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.totalProduction} / {metrics.totalPlanned} unidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OEE Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(metrics.oeeScore)}`}>
              {metrics.oeeScore.toFixed(1)}%
            </div>
            <Progress value={metrics.oeeScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Disponibilidade × Performance × Qualidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Qualidade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(metrics.qualityRate)}`}>
              {metrics.qualityRate.toFixed(1)}%
            </div>
            <Progress value={metrics.qualityRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.totalDefects} defeitos identificados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Parada</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Math.floor(metrics.totalDowntime / 60)}h {metrics.totalDowntime % 60}min
            </div>
            <Progress value={100 - metrics.availabilityRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Disponibilidade: {metrics.availabilityRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Produção */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Produção (Últimos 10 Registros)</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={chartData} />
        </CardContent>
      </Card>

      {/* Detalhes dos Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          {productionData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro encontrado para os filtros selecionados
            </p>
          ) : (
            <div className="space-y-4">
              {productionData.slice(0, 20).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{record.machines.code}</Badge>
                      <span className="font-medium">{record.machines.name}</span>
                      <Badge variant="secondary">{record.machines.sector}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Produção:</span>
                        <span className={`ml-1 font-medium ${
                          record.actual_production >= record.planned_production 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {record.actual_production}/{record.planned_production}
                        </span>
                      </div>
                      
                      {record.defective_units > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Defeitos:</span>
                          <span className="ml-1 font-medium text-red-600">
                            {record.defective_units}
                          </span>
                        </div>
                      )}
                      
                      {record.downtime_minutes > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Parada:</span>
                          <span className="ml-1 font-medium text-orange-600">
                            {record.downtime_minutes}min
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {record.downtime_reason && (
                      <p className="text-xs text-muted-foreground">
                        Motivo: {record.downtime_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {productionData.length > 20 && (
                <p className="text-center text-muted-foreground text-sm">
                  Mostrando 20 de {productionData.length} registros
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}