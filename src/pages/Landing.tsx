import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import zezmetricsLogo from "@/assets/zezmetrics-logo.png";

export default function Landing() {
  const features = [
    {
      icon: BarChart3,
      title: "Monitoramento OEE",
      description: "Calcule e monitore a Eficiência Geral dos Equipamentos em tempo real"
    },
    {
      icon: TrendingUp,
      title: "Análise de Tendências",
      description: "Identifique padrões e tendências para otimizar sua produção"
    },
    {
      icon: Shield,
      title: "Dados Seguros",
      description: "Seus dados industriais protegidos com segurança enterprise"
    },
    {
      icon: Zap,
      title: "Interface Rápida",
      description: "Dashboard responsivo e intuitivo para decisões ágeis"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src={zezmetricsLogo} 
                alt="ZezMetrics Logo" 
                className="h-24 w-24 shadow-glow"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              ZezMetrics
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Monitore sua produção, identifique gargalos e melhore a eficiência com o ZezMetrics — simples, acessível e escalável.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="industrial" size="lg" className="text-lg px-8 py-3">
                <Link to="/dashboard">
                  Comece agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link to="#features">
                  Saiba mais
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para monitorar e otimizar sua produção industrial
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-industrial transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-industrial">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Pronto para aumentar sua eficiência?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Comece a monitorar seu OEE hoje mesmo e veja os resultados na sua produção
          </p>
          <Button asChild variant="secondary" size="lg" className="text-lg px-8 py-3">
            <Link to="/dashboard">
              Iniciar monitoramento
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}