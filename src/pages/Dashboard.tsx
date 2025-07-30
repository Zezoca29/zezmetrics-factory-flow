import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleBarChart, SimpleLineChart } from "@/components/charts/SimpleChart";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Types
interface Machine {
  id: string;
  name: string;
  code: string;
  sector: string;
}

interface ProductionRecord {
  id: string;
  machine_id: string;
  shift_id: string;
  date: string;
  planned_production: number;
  actual_production: number;
  downtime_minutes: number;
  defective_units: number;
  machines: Machine;
}

interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

interface DashboardMetrics {
  averageOEE: number;
  averageAvailability: number;
  averagePerformance: number;
  averageQuality: number;
  totalRecords: number;
  todayRecords: number;
}

// Função para calcular OEE de um registro
function calculateOEE(record: ProductionRecord): OEEMetrics {
  const shiftMinutes = 8 * 60; // 8 horas por turno
  const availability = ((shiftMinutes - record.downtime_minutes) / shiftMinutes) * 100;
  const performance = record.planned_production > 0 ? (record.actual_production / record.planned_production) * 100 : 0;
  const goodUnits = record.actual_production - record.defective_units;
  const quality = record.actual_production > 0 ? (goodUnits / record.actual_production) * 100 : 0;
  const oee = (availability * performance * quality) / 10000;
  
  return { 
    availability: Math.max(0, Math.min(100, availability)), 
    performance: Math.max(0, Math.min(100, performance)), 
    quality: Math.max(0, Math.min(100, quality)), 
    oee: Math.max(0, Math.min(100, oee)) 
  };
}

// Função para calcular métricas agregadas
function calculateDashboardMetrics(records: ProductionRecord[]): DashboardMetrics {
  if (records.length === 0) {
    return {
      averageOEE: 0,
      averageAvailability: 0,
      averagePerformance: 0,
      averageQuality: 0,
      totalRecords: 0,
      todayRecords: 0
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today).length;

  // Usar registros dos últimos 7 dias para as métricas principais
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentRecords = records.filter(r => new Date(r.date) >= last7Days);

  if (recentRecords.length === 0) {
    return {
      averageOEE: 0,
      averageAvailability: 0,
      averagePerformance: 0,
      averageQuality: 0,
      totalRecords: records.length,
      todayRecords
    };
  }

  const metrics = recentRecords.map(calculateOEE);
  
  const averageOEE = metrics.reduce((acc, m) => acc + m.oee, 0) / metrics.length;
  const averageAvailability = metrics.reduce((acc, m) => acc + m.availability, 0) / metrics.length;
  const averagePerformance = metrics.reduce((acc, m) => acc + m.performance, 0) / metrics.length;
  const averageQuality = metrics.reduce((acc, m) => acc + m.quality, 0) / metrics.length;

  return {
    averageOEE,
    averageAvailability,
    averagePerformance,
    averageQuality,
    totalRecords: records.length,
    todayRecords
  };
}

function getOEEStatus(value: number) {
  if (value >= 85) return { label: "Excelente", variant: "success" as const, color: "#22C55E" };
  if (value >= 75) return { label: "Bom", variant: "secondary" as const, color: "#3B82F6" };
  if (value >= 65) return { label: "Atenção", variant: "warning" as const, color: "#EAB308" };
  return { label: "Crítico", variant: "destructive" as const, color: "#EF4444" };
}

export default function Dashboard() {
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    averageOEE: 0,
    averageAvailability: 0,
    averagePerformance: 0,
    averageQuality: 0,
    totalRecords: 0,
    todayRecords: 0
  });

  useEffect(() => {
    fetchProductionData();
    
    // Configurar realtime updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_records'
        },
        () => {
          console.log('Dados de produção atualizados, recarregando...');
          fetchProductionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchProductionData() {
    try {
      const { data, error } = await supabase
        .from('production_records')
        .select(`
          *,
          machines (
            id,
            name,
            code,
            sector
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const records = data || [];
      setProductionRecords(records);
      
      // Calcular métricas do dashboard
      const metrics = calculateDashboardMetrics(records);
      setDashboardMetrics(metrics);
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de produção",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Preparar dados para gráficos
  const oeeChartData = (() => {
    // Pegar últimos 7 dias únicos
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    return last7Days.map(date => {
      const dayRecords = productionRecords.filter(r => r.date === date);
      
      if (dayRecords.length === 0) {
        return {
          name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
          value: 0
        };
      }

      const dayMetrics = dayRecords.map(calculateOEE);
      const avgOEE = dayMetrics.reduce((acc, m) => acc + m.oee, 0) / dayMetrics.length;
      
      return {
        name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
        value: Math.round(avgOEE)
      };
    });
  })();

  // Dados por máquina (últimos registros de cada máquina)
  const machineData = (() => {
    const machineMap = new Map<string, ProductionRecord>();
    
    // Pegar o registro mais recente de cada máquina
    productionRecords.forEach(record => {
      const machineId = record.machine_id;
      if (!machineMap.has(machineId) || 
          new Date(record.date) > new Date(machineMap.get(machineId)!.date)) {
        machineMap.set(machineId, record);
      }
    });

    return Array.from(machineMap.values())
      .slice(0, 6) // Mostrar só as primeiras 6 máquinas
      .map(record => {
        const oee = calculateOEE(record);
        return {
          name: record.machines.name,
          value: Math.round(oee.oee)
        };
      });
  })();

  const oeeStatus = getOEEStatus(dashboardMetrics.averageOEE);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard OEE</h1>
          <p className="text-muted-foreground">
            Monitoramento da eficiência geral dos equipamentos em tempo real
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            Dados dos últimos 7 dias • Total de {dashboardMetrics.totalRecords} registros • {dashboardMetrics.todayRecords} registros hoje
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OEE Médio (7 dias)</CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(dashboardMetrics.averageOEE)}%</div>
              <Badge variant={oeeStatus.variant} className="mt-1">
                {oeeStatus.label}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibilidade</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(dashboardMetrics.averageAvailability)}%</div>
              <p className="text-xs text-muted-foreground">
                Tempo produtivo vs tempo total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(dashboardMetrics.averagePerformance)}%</div>
              <p className="text-xs text-muted-foreground">
                Produção real vs planejada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualidade</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(dashboardMetrics.averageQuality)}%</div>
              <p className="text-xs text-muted-foreground">
                Peças boas vs total produzido
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        {oeeChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Tendência OEE - Últimos Registros</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart data={oeeChartData} color="#3B82F6" />
              </CardContent>
            </Card>

            {machineData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>OEE por Máquina</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart data={machineData} color="#22C55E" />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Status das máquinas */}
        {machineData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status das Máquinas (Últimos Registros)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {machineData.slice(0, 6).map((machineRecord, index) => {
                  const record = productionRecords.find(r => r.machines.name === machineRecord.name);
                  if (!record) return null;
                  
                  const oeeData = calculateOEE(record);
                  const status = getOEEStatus(oeeData.oee);
                  return (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-medium">{record.machines.name}</h3>
                          <p className="text-sm text-muted-foreground">{record.machines.code}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-2">{Math.round(oeeData.oee)}%</div>
                      <div className="text-sm text-muted-foreground space-y-1 mb-3">
                        <div className="flex justify-between">
                          <span>Disponibilidade:</span>
                          <span>{Math.round(oeeData.availability)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Performance:</span>
                          <span>{Math.round(oeeData.performance)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Qualidade:</span>
                          <span>{Math.round(oeeData.quality)}%</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t">
                          <span>Último registro:</span>
                          <span>{new Date(record.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${oeeData.oee}%`,
                            backgroundColor: status.color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {productionRecords.length === 0 && (
          <Card>
            <CardContent className="text-center py-10">
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhum dado de produção encontrado
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione registros de produção para visualizar as métricas de OEE
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}