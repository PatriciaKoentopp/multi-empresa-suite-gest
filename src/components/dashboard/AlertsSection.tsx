
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  tipo: string;
  mensagem: string;
  data_criacao: string;
  data_vencimento?: string;
  valor?: number;
}

const AlertsSection = () => {
  const { currentCompany } = useCompany();
  const [alertas, setAlertas] = useState<Alert[]>([]);
  const [filtroSelecionado, setFiltroSelecionado] = useState<string>("todos");

  useEffect(() => {
    // Por enquanto vamos simular alguns alertas até a tabela ser criada
    const alertasSimulados: Alert[] = [
      {
        id: "1",
        tipo: "financeiro",
        mensagem: "Saldo da conta principal está baixo",
        data_criacao: new Date().toISOString(),
        valor: 1500.00
      },
      {
        id: "2", 
        tipo: "vencimento_conta",
        mensagem: "Conta de energia elétrica vence em 3 dias",
        data_criacao: new Date().toISOString(),
        data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        valor: 450.00
      }
    ];
    setAlertas(alertasSimulados);
  }, [currentCompany?.id]);

  const formatarData = (data: string) => {
    return format(parseISO(data), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const formatarDataVencimento = (data: string) => {
    return format(parseISO(data), "dd 'de' MMMM", { locale: ptBR });
  };

  const renderAlert = (alerta: Alert) => {
    switch (alerta.tipo) {
      case "financeiro":
        return (
          <div key={alerta.id} className="mb-4 p-4 border rounded-md shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold">Alerta Financeiro</span>
            </div>
            <p className="text-sm">{alerta.mensagem}</p>
            <div className="mt-2 text-xs text-gray-500">
              Criado em: {formatarData(alerta.data_criacao)}
            </div>
          </div>
        );
      case "vencimento_conta":
        return (
          <div key={alerta.id} className="mb-4 p-4 border rounded-md shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold">Vencimento de Conta</span>
            </div>
            <p className="text-sm">{alerta.mensagem}</p>
            {alerta.data_vencimento && (
              <div className="text-xs text-gray-500">
                Vencimento: {formatarDataVencimento(alerta.data_vencimento)}
              </div>
            )}
            {alerta.valor !== undefined && (
              <div className="text-xs text-gray-500">
                Valor: R$ {alerta.valor.toFixed(2)}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              Criado em: {formatarData(alerta.data_criacao)}
            </div>
          </div>
        );
      case "meta_vendas":
        return (
          <div key={alerta.id} className="mb-4 p-4 border rounded-md shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold">Meta de Vendas</span>
            </div>
            <p className="text-sm">{alerta.mensagem}</p>
            <div className="mt-2 text-xs text-gray-500">
              Criado em: {formatarData(alerta.data_criacao)}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const aplicarFiltro = (filtro: string) => {
    setFiltroSelecionado(filtro);
  };

  const alertasFiltrados = alertas.filter(alerta => {
    if (filtroSelecionado === "todos") return true;
    return alerta.tipo === filtroSelecionado;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Badge
            variant={filtroSelecionado === "todos" ? "secondary" : "outline"}
            onClick={() => aplicarFiltro("todos")}
            className="mr-2 cursor-pointer"
          >
            Todos
          </Badge>
          <Badge
            variant={filtroSelecionado === "financeiro" ? "secondary" : "outline"}
            onClick={() => aplicarFiltro("financeiro")}
            className="mr-2 cursor-pointer"
          >
            Financeiro
          </Badge>
          <Badge
            variant={filtroSelecionado === "vencimento_conta" ? "secondary" : "outline"}
            onClick={() => aplicarFiltro("vencimento_conta")}
            className="mr-2 cursor-pointer"
          >
            Vencimento de Contas
          </Badge>
           <Badge
            variant={filtroSelecionado === "meta_vendas" ? "secondary" : "outline"}
            onClick={() => aplicarFiltro("meta_vendas")}
            className="mr-2 cursor-pointer"
          >
            Meta de Vendas
          </Badge>
        </div>
        {alertasFiltrados.length > 0 ? (
          alertasFiltrados.map(alerta => renderAlert(alerta))
        ) : (
          <div className="text-center text-gray-500">Nenhum alerta encontrado.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsSection;
