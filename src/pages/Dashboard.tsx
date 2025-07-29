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

interface OEEData {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

// Função para calcular OEE
function calculateOEE(record: ProductionRecord): OEEData {
  const shiftMinutes = 8 * 60; // 8 horas por turno
  const availability = ((shiftMinutes - record.downtime_minutes) / shiftMinutes) * 100;
  const performance = (record.actual_production / record.planned_production) * 100;
  const goodUnits = record.actual_production - record.defective_units;
  const quality = (goodUnits / record.actual_production) * 100;
  const oee = (availability * performance * quality) / 10000;
  
  return { availability, performance, quality, oee };
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

  useEffect(() => {
    fetchProductionData();
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
        .limit(50);

      if (error) throw error;
      setProductionRecords(data || []);
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

  // Calcular métricas agregadas
  const latestRecords = productionRecords.slice(0, 4);
  const averageOEE = latestRecords.length > 0 
    ? latestRecords.reduce((acc, record) => acc + calculateOEE(record).oee, 0) / latestRecords.length 
    : 0;
  
  const averageAvailability = latestRecords.length > 0
    ? latestRecords.reduce((acc, record) => acc + calculateOEE(record).availability, 0) / latestRecords.length
    : 0;
    
  const averagePerformance = latestRecords.length > 0
    ? latestRecords.reduce((acc, record) => acc + calculateOEE(record).performance, 0) / latestRecords.length
    : 0;
    
  const averageQuality = latestRecords.length > 0
    ? latestRecords.reduce((acc, record) => acc + calculateOEE(record).quality, 0) / latestRecords.length
    : 0;

  // Dados para gráficos
  const oeeChartData = productionRecords.slice(0, 7).reverse().map(record => ({
    name: new Date(record.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    value: Math.round(calculateOEE(record).oee)
  }));

  const machineData = latestRecords.map(record => ({
    name: record.machines.name,
    value: Math.round(calculateOEE(record).oee)
  }));

  const oeeStatus = getOEEStatus(averageOEE);

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
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OEE Médio</CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(averageOEE)}%</div>
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
              <div className="text-2xl font-bold">{Math.round(averageAvailability)}%</div>
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
              <div className="text-2xl font-bold">{Math.round(averagePerformance)}%</div>
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
              <div className="text-2xl font-bold">{Math.round(averageQuality)}%</div>
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
        {latestRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status das Máquinas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {latestRecords.map((record, index) => {
                  const oeeData = calculateOEE(record);
                  const status = getOEEStatus(oeeData.oee);
                  return (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{record.machines.name}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{Math.round(oeeData.oee)}%</div>
                      <div className="text-sm text-muted-foreground space-y-1 mt-2">
                        <div>Disponibilidade: {Math.round(oeeData.availability)}%</div>
                        <div>Performance: {Math.round(oeeData.performance)}%</div>
                        <div>Qualidade: {Math.round(oeeData.quality)}%</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
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