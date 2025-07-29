import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleBarChart, SimpleLineChart } from "@/components/charts/SimpleChart";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

// Mock data - em produção virá do Supabase
const mockOEEData = [
  { name: "Seg", value: 85 },
  { name: "Ter", value: 78 },
  { name: "Qua", value: 92 },
  { name: "Qui", value: 88 },
  { name: "Sex", value: 76 },
  { name: "Sáb", value: 82 },
  { name: "Dom", value: 90 }
];

const mockMachineData = [
  { name: "Máquina A", value: 92, status: "excellent" },
  { name: "Máquina B", value: 76, status: "warning" },
  { name: "Máquina C", value: 85, status: "good" },
  { name: "Máquina D", value: 68, status: "poor" }
];

function getOEEStatus(value: number) {
  if (value >= 85) return { label: "Excelente", variant: "success" as const, color: "#22C55E" };
  if (value >= 75) return { label: "Bom", variant: "secondary" as const, color: "#3B82F6" };
  if (value >= 65) return { label: "Atenção", variant: "warning" as const, color: "#EAB308" };
  return { label: "Crítico", variant: "destructive" as const, color: "#EF4444" };
}

export default function Dashboard() {
  const currentOEE = 82;
  const oeeStatus = getOEEStatus(currentOEE);

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
              <CardTitle className="text-sm font-medium">OEE Atual</CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOEE}%</div>
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
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">
                +2% em relação a ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                +1% em relação a ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualidade</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">97%</div>
              <p className="text-xs text-muted-foreground">
                -1% em relação a ontem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tendência OEE - Última Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={mockOEEData} color="#3B82F6" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance por Máquina</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart 
                data={mockMachineData.map(machine => ({
                  name: machine.name,
                  value: machine.value
                }))} 
                color="#22C55E" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Status das máquinas */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Máquinas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockMachineData.map((machine, index) => {
                const status = getOEEStatus(machine.value);
                return (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{machine.name}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{machine.value}%</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${machine.value}%`,
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
      </div>
    </div>
  );
}