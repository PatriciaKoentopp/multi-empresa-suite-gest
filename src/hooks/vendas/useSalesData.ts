import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { SalesData } from "./types";
import { formatDateForSupabase } from "./salesChartUtils";

export const useSalesData = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      
      const currentYear = new Date().getFullYear();
      
      // Definir datas para mês atual e anterior
      const startCurrentMonth = startOfMonth(new Date());
      const endCurrentMonth = endOfMonth(new Date());
      
      const startCurrentMonthFormatted = formatDateForSupabase(startCurrentMonth);
      const endCurrentMonthFormatted = formatDateForSupabase(endCurrentMonth);
      
      // Buscar vendas do mês atual
      const { data: currentMonthData, error: currentMonthError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', startCurrentMonthFormatted)
        .lte('data_venda', endCurrentMonthFormatted);

      if (currentMonthError) throw currentMonthError;

      const vendasMesAtual = currentMonthData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;
      
      // Buscar vendas do mês anterior
      const startLastMonth = startOfMonth(subMonths(new Date(), 1));
      const endLastMonth = endOfMonth(subMonths(new Date(), 1));
      
      const startLastMonthFormatted = formatDateForSupabase(startLastMonth);
      const endLastMonthFormatted = formatDateForSupabase(endLastMonth);
      
      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', startLastMonthFormatted)
        .lte('data_venda', endLastMonthFormatted);

      if (lastMonthError) throw lastMonthError;

      const vendasMesAnterior = lastMonthData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;

      // Calcular variação percentual mantendo o sinal
      // Se o mês anterior for zero, consideramos como 100% de aumento
      let variacaoPercentual = 0;
      if (vendasMesAnterior === 0) {
        variacaoPercentual = vendasMesAtual > 0 ? 100 : 0;
      } else {
        variacaoPercentual = ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100;
      }

      // Buscar total anual de vendas do ano atual
      const startOfYear = format(new Date(currentYear, 0, 1), 'yyyy-MM-dd');
      const endOfYear = format(new Date(currentYear, 11, 31), 'yyyy-MM-dd');
      
      const { data: totalAnualData, error: totalAnualError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', startOfYear)
        .lte('data_venda', endOfYear);

      if (totalAnualError) throw totalAnualError;

      const totalVendas = totalAnualData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;
      
      // Buscar média de ticket - ANO CORRENTE (alterado de 90 dias para o ano corrente)
      const { data: ticketData, error: ticketError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', startOfYear)
        .lte('data_venda', endOfYear);

      if (ticketError) throw ticketError;

      const totalVendasPeriodo = ticketData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;

      const mediaTicket = ticketData?.length ? totalVendasPeriodo / ticketData.length : 0;
      
      // Buscar clientes ativos (com vendas nos últimos 90 dias)
      const ninetyDaysAgo = subDays(new Date(), 90);
      const ninetyDaysAgoFormatted = formatDateForSupabase(ninetyDaysAgo);
      
      const { data: clientesData, error: clientesError } = await supabase
        .from('orcamentos')
        .select('favorecido_id')
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', ninetyDaysAgoFormatted);

      if (clientesError) throw clientesError;
      
      // Contar clientes únicos
      const clientesUnicos = new Set();
      clientesData?.forEach(orcamento => {
        if (orcamento.favorecido_id) {
          clientesUnicos.add(orcamento.favorecido_id);
        }
      });
      
      const clientesAtivos = clientesUnicos.size;

      // Buscar dados para projetos com código
      const { data: projetosData, error: projetosError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          codigo_projeto,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .not('codigo_projeto', 'is', null)
        .gte('data_venda', startOfYear)
        .lte('data_venda', endOfYear);
      
      if (projetosError) {
        console.error("Erro ao buscar dados de projetos:", projetosError);
        throw projetosError;
      }
      
      // Calcular o valor médio por projeto
      const projetosUnicos = new Set();
      let totalValorProjetos = 0;
      
      if (projetosData && projetosData.length > 0) {
        projetosData.forEach(orcamento => {
          if (orcamento.codigo_projeto) {
            projetosUnicos.add(orcamento.codigo_projeto);
            
            // Somar valor deste orçamento
            const valorOrcamento = orcamento.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            totalValorProjetos += valorOrcamento;
          }
        });
      }
      
      // Ticket médio por projeto
      const valorTicketMedioPorProjeto = projetosUnicos.size > 0 
        ? totalValorProjetos / projetosUnicos.size 
        : 0;
      
      console.log("Ticket médio por projeto calculado:", valorTicketMedioPorProjeto);

      setSalesData({
        total_vendas: totalVendas,
        vendas_mes_atual: vendasMesAtual,
        vendas_mes_anterior: vendasMesAnterior,
        variacao_percentual: variacaoPercentual,
        media_ticket: mediaTicket,
        media_ticket_projeto: valorTicketMedioPorProjeto,
        clientes_ativos: clientesAtivos
      });

      return {
        total_vendas: totalVendas,
        vendas_mes_atual: vendasMesAtual,
        vendas_mes_anterior: vendasMesAnterior,
        variacao_percentual: variacaoPercentual,
        media_ticket: mediaTicket,
        media_ticket_projeto: valorTicketMedioPorProjeto,
        clientes_ativos: clientesAtivos
      };
      
    } catch (error: any) {
      console.error("Erro ao carregar dados básicos de vendas:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados de vendas",
        description: error.message || "Não foi possível carregar os dados básicos de vendas"
      });
      return null;
    }
  };

  return {
    salesData,
    fetchSalesData,
    isLoading,
    setIsLoading
  };
};
