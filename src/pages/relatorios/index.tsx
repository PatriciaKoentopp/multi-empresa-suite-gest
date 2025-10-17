
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Calculator, BarChart, Award, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardCardConfigurator } from "@/components/dashboard/DashboardCardConfigurator";
import { useDashboardCards } from "@/hooks/useDashboardCards";

export default function Relatorios() {
  const navigate = useNavigate();
  const [forceRender, setForceRender] = useState(0);
  const { isCardVisible, refetch: refetchCardsConfig } = useDashboardCards('relatorios');

  const relatorios = [
    {
      id: "favorecido",
      title: "Relatório de Favorecido",
      description: "Consulta completa de favorecidos com dados cadastrais, vendas e situação financeira",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      route: "/relatorios/favorecido"
    },
    {
      id: "vendas",
      title: "Relatório de Vendas",
      description: "Análise detalhada das vendas por período",
      icon: <BarChart className="h-8 w-8 text-green-500" />,
      route: "/relatorios/vendas"
    },
    {
      id: "classificacaoABC",
      title: "Classificação ABC de Clientes",
      description: "Análise de clientes por volume de vendas e frequência de compra",
      icon: <Award className="h-8 w-8 text-amber-500" />,
      route: "/relatorios/classificacao-abc"
    },
    {
      id: "analiseDRE",
      title: "Análise do DRE",
      description: "Análise comparativa das contas do DRE com alertas de variações significativas",
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      route: "/relatorios/analise-dre"
    },
    {
      id: "tempo",
      title: "Relatório de Tempo",
      description: "Análise de tempo de atendimento, duração de projetos e produtividade",
      icon: <Clock className="h-8 w-8 text-cyan-500" />,
      route: "/relatorios/tempo"
    },
    {
      id: "financeiro",
      title: "Relatório Financeiro",
      description: "Fluxo de caixa e análise de receitas e despesas",
      icon: <Calculator className="h-8 w-8 text-purple-500" />,
      route: "/relatorios/financeiro"
    },
    {
      id: "geral",
      title: "Relatório Geral",
      description: "Visão geral de todas as operações da empresa",
      icon: <FileText className="h-8 w-8 text-amber-500" />,
      route: "/relatorios/geral"
    },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleConfigChange = async () => {
    // Atualizar configuração dos cards
    await refetchCardsConfig();
    // Forçar re-render completo incrementando o estado
    setForceRender(prev => prev + 1);
  };

  return (
    <div className="space-y-6" key={forceRender}>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Consulte relatórios detalhados para análise de dados
          </p>
        </div>
        
        <DashboardCardConfigurator 
          pageId="relatorios" 
          onConfigChange={handleConfigChange}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatorios.map(relatorio => {
          // Verificar se o card está visível na configuração
          const isVisible = isCardVisible(relatorio.id);
          
          // Se não estiver visível, não renderizar o card
          if (!isVisible) {
            return null;
          }

          return (
            <Card 
              key={relatorio.id} 
              className={`cursor-pointer transition-shadow hover:shadow-lg ${relatorio.id === 'favorecido' || relatorio.id === 'classificacaoABC' || relatorio.id === 'analiseDRE' || relatorio.id === 'tempo' ? '' : 'opacity-60'}`}
              onClick={() => handleCardClick(relatorio.route)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{relatorio.title}</CardTitle>
                  <CardDescription>
                    {relatorio.description}
                  </CardDescription>
                </div>
                <div className="rounded-full p-2 bg-gray-100 dark:bg-gray-800">
                  {relatorio.icon}
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant={relatorio.id === 'favorecido' || relatorio.id === 'classificacaoABC' || relatorio.id === 'analiseDRE' || relatorio.id === 'tempo' ? "default" : "outline"} 
                  className="w-full"
                  onClick={() => handleCardClick(relatorio.route)}
                >
                  Acessar Relatório
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
