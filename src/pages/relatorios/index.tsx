
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Calculator, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Relatorios() {
  const navigate = useNavigate();

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
      id: "classificacaoabc",
      title: "Classificação ABC de Clientes",
      description: "Análise de clientes por volume de compras, frequência e ticket médio",
      icon: <Users className="h-8 w-8 text-purple-500" />,
      route: "/relatorios/classificacao-abc"
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Consulte relatórios detalhados para análise de dados
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatorios.map(relatorio => (
          <Card 
            key={relatorio.id} 
            className={`cursor-pointer transition-shadow hover:shadow-lg ${(relatorio.id !== 'favorecido' && relatorio.id !== 'classificacaoabc') ? 'opacity-60' : ''}`}
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
                variant={(relatorio.id === 'favorecido' || relatorio.id === 'classificacaoabc') ? "default" : "outline"} 
                className="w-full"
                onClick={() => handleCardClick(relatorio.route)}
              >
                Acessar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
