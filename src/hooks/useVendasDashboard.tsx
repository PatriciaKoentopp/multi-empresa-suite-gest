import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { YearlyComparison } from "@/types";

interface SalesData {
  total_vendas: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  variacao_percentual: number;
  media_ticket: number;
  media_ticket_projeto: number; // Adicionado campo para ticket médio por projeto
  clientes_ativos: number;
}

// Função auxiliar para formatar dados do gráfico
const formatChartData = (data: any[] | null) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  return data.map((item) => ({
    name: String(item.name || ''),
    faturado: Number(item.faturado || 0)
  }));
};

export const useVendasDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [quarterlyChartData, setQuarterlyChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);
  const [yearlyComparisonData, setYearlyComparisonData] = useState<YearlyComparison[]>([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<any[]>([]);
  const [ticketMedioPorProjetoData, setTicketMedioPorProjetoData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Nova função para buscar dados mensais por ano
  const fetchMonthlySalesData = async (year: number) => {
    try {
      console.log(`Buscando dados mensais para o ano ${year}`);
      
      // Tentar usar a função RPC para dados mensais se disponível
      try {
        const { data, error } = await supabase
          .rpc('get_monthly_sales_chart_data', { year_param: year });
          
        if (!error && data) {
          console.log(`Dados mensais recebidos via RPC para ${year}:`, data);
          const dadosFiltrados = data.filter((item: any) => Number(item.faturado) > 0);
          // Mapear os nomes dos meses para valores numéricos para ordenação
          const mesesMap: {[key: string]: number} = {
            "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4,
            "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
            "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
          };
          
          // Ordenar os meses em ordem decrescente (Dezembro -> Janeiro)
          const mesesOrdenadosComNumero = dadosFiltrados
            .map((item: any) => ({
              name: String(item.name || ''),
              faturado: Number(item.faturado || 0),
              monthNumber: mesesMap[String(item.name)] || 0,
              year: year // Adicionar o ano para referência
            }))
            .sort((a, b) => b.monthNumber - a.monthNumber);
          
          // Buscar dezembro do ano anterior para comparação com janeiro
          let dezEmbroAnoAnterior = null;
          if (mesesOrdenadosComNumero.some(m => m.monthNumber === 1)) {
            try {
              // Buscar dados de dezembro do ano anterior
              const { data: dataAnoAnterior, error: errorAnoAnterior } = await supabase
                .rpc('get_monthly_sales_chart_data', { year_param: year - 1 });
                
              if (!errorAnoAnterior && dataAnoAnterior) {
                // Encontrar dezembro no ano anterior
                const dezAnoAnterior = dataAnoAnterior.find((item: any) => 
                  item.name === "Dezembro" && Number(item.faturado) > 0
                );
                
                if (dezAnoAnterior) {
                  dezEmbroAnoAnterior = {
                    name: "Dezembro",
                    faturado: Number(dezAnoAnterior.faturado || 0),
                    monthNumber: 12,
                    year: year - 1
                  };
                  console.log(`Dezembro do ano anterior (${year-1}) encontrado:`, dezEmbroAnoAnterior);
                }
              }
            } catch (e) {
              console.warn(`Erro ao buscar dezembro do ano anterior (${year-1})`, e);
            }
          }
          
          // Buscar dados dos mesmos meses do ano anterior para comparação
          const anoAnterior = year - 1;
          let dadosMesmoMesAnoAnterior: any[] = [];
          
          try {
            const { data: dataAnoAnterior, error: errorAnoAnterior } = await supabase
              .rpc('get_monthly_sales_chart_data', { year_param: anoAnterior });
              
            if (!errorAnoAnterior && dataAnoAnterior) {
              // Transformar em formato mais fácil de pesquisar
              dadosMesmoMesAnoAnterior = dataAnoAnterior.map((item: any) => ({
                name: String(item.name || ''),
                faturado: Number(item.faturado || 0),
                monthNumber: mesesMap[String(item.name)] || 0,
                year: anoAnterior
              }));
            }
          } catch (e) {
            console.warn(`Erro ao buscar dados do ano anterior (${anoAnterior})`, e);
          }
          
          // Calcular variações percentuais entre os meses
          const result = mesesOrdenadosComNumero.map((mes) => {
            let mesAnterior;
            
            // Caso especial: para janeiro, usar dezembro do ano anterior se disponível
            if (mes.monthNumber === 1) {
              mesAnterior = dezEmbroAnoAnterior; 
            } else {
              // Para outros meses, buscar o mês anterior no mesmo ano
              mesAnterior = mesesOrdenadosComNumero.find(m => 
                m.monthNumber === mes.monthNumber - 1
              );
            }
            
            // Buscar o mesmo mês do ano anterior para comparação
            const mesmoMesAnoAnterior = dadosMesmoMesAnoAnterior.find(m => 
              m.monthNumber === mes.monthNumber
            );
            
            let variacao = null;
            if (mesAnterior && mesAnterior.faturado > 0) {
              variacao = ((mes.faturado - mesAnterior.faturado) / mesAnterior.faturado) * 100;
            }
            
            let variacaoAnoAnterior = null;
            if (mesmoMesAnoAnterior && mesmoMesAnoAnterior.faturado > 0) {
              variacaoAnoAnterior = ((mes.faturado - mesmoMesAnoAnterior.faturado) / mesmoMesAnoAnterior.faturado) * 100;
            }
            
            return {
              name: mes.name,
              faturado: mes.faturado,
              variacao_percentual: variacao,
              variacao_ano_anterior: variacaoAnoAnterior
            };
          });
          
          return result;
        }
      } catch (rpcError) {
        console.warn(`Erro na chamada RPC para dados mensais: ${rpcError}`);
      }
      
      // Fallback: buscar dados mensais manualmente
      console.log(`Buscando dados mensais manualmente para ${year}`);
      
      // Buscar todas as vendas do ano especificado
      const { data: vendaAnual, error: vendaAnualError } = await supabase
        .from('orcamentos')
        .select(`
          id, 
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', `${year}-01-01`)
        .lte('data_venda', `${year}-12-31`);
      
      if (vendaAnualError) {
        console.error(`Erro ao buscar vendas anuais para ${year}:`, vendaAnualError);
        throw vendaAnualError;
      }
      
      // Buscar todas as vendas do ano anterior
      const anoAnterior = year - 1;
      const { data: vendaAnoAnterior, error: vendaAnoAnteriorError } = await supabase
        .from('orcamentos')
        .select(`
          id, 
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', `${anoAnterior}-01-01`)
        .lte('data_venda', `${anoAnterior}-12-31`);
      
      if (vendaAnoAnteriorError) {
        console.error(`Erro ao buscar vendas do ano anterior para ${anoAnterior}:`, vendaAnoAnteriorError);
      }
      
      console.log(`Vendas do ano ${year} encontradas:`, vendaAnual?.length);
      console.log(`Vendas do ano anterior ${anoAnterior} encontradas:`, vendaAnoAnterior?.length);

      // Criar estrutura mensal com valores iniciais zerados
      const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      
      // Mapeamento reverso de mês para número (para ordenação posterior)
      const mesesMap: {[key: string]: number} = {};
      meses.forEach((mes, index) => {
        mesesMap[mes] = index + 1;
      });
      
      const dadosMensais = meses.map((name, index) => ({
        name,
        faturado: 0,
        monthNumber: index + 1,
        year
      }));
      
      // Estrutura similar para o ano anterior
      const dadosMensaisAnoAnterior = meses.map((name, index) => ({
        name,
        faturado: 0,
        monthNumber: index + 1,
        year: anoAnterior
      }));
      
      // Preencher os valores de cada mês para o ano atual
      if (vendaAnual) {
        vendaAnual.forEach(venda => {
          if (venda.data_venda) {
            const mesString = venda.data_venda.substring(5, 7);
            const mes = parseInt(mesString, 10) - 1;
            
            const valorTotal = venda.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            
            if (mes >= 0 && mes < 12) {
              dadosMensais[mes].faturado += valorTotal;
            }
          }
        });
      }
      
      // Preencher os valores de cada mês para o ano anterior
      if (vendaAnoAnterior) {
        vendaAnoAnterior.forEach(venda => {
          if (venda.data_venda) {
            const mesString = venda.data_venda.substring(5, 7);
            const mes = parseInt(mesString, 10) - 1;
            
            const valorTotal = venda.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            
            if (mes >= 0 && mes < 12) {
              dadosMensaisAnoAnterior[mes].faturado += valorTotal;
            }
          }
        });
      }
      
      // Filtrar apenas meses com vendas e ordenar em ordem decrescente
      const mesesComVendas = dadosMensais
        .filter(mes => mes.faturado > 0)
        .sort((a, b) => b.monthNumber - a.monthNumber);
      
      // Buscar dezembro do ano anterior para janeiro (se existir janeiro)
      let dezEmbroAnoAnterior = null;
      if (mesesComVendas.some(m => m.monthNumber === 1)) {
        try {
          // Buscar vendas de dezembro do ano anterior
          const { data: vendaDezAnterior, error: errorDezAnterior } = await supabase
            .from('orcamentos')
            .select(`
              id, 
              data_venda,
              orcamentos_itens (valor)
            `)
            .eq('tipo', 'venda')
            .eq('status', 'ativo')
            .gte('data_venda', `${year-1}-12-01`)
            .lte('data_venda', `${year-1}-12-31`);
            
          if (!errorDezAnterior && vendaDezAnterior && vendaDezAnterior.length > 0) {
            // Calcular o valor total de dezembro do ano anterior
            const valorDezAnterior = vendaDezAnterior.reduce((total, orcamento) => {
              const valorOrcamento = orcamento.orcamentos_itens.reduce(
                (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
              );
              return total + valorOrcamento;
            }, 0);
            
            if (valorDezAnterior > 0) {
              dezEmbroAnoAnterior = {
                name: "Dezembro",
                faturado: valorDezAnterior,
                monthNumber: 12,
                year: year - 1
              };
              console.log(`Dezembro do ano anterior (${year-1}) calculado manualmente:`, dezEmbroAnoAnterior);
            }
          }
        } catch (e) {
          console.warn(`Erro ao buscar dezembro do ano anterior (${year-1}) manualmente`, e);
        }
      }
      
      // Calcular variações percentuais entre os meses
      const mesesComVariacao = mesesComVendas.map((mes) => {
        let mesAnterior;
        
        // Caso especial: para janeiro, usar dezembro do ano anterior se disponível
        if (mes.monthNumber === 1) {
          mesAnterior = dezEmbroAnoAnterior;
        } else {
          // Para outros meses, buscar o mês anterior no mesmo ano
          const mesAnteriorNumero = mes.monthNumber - 1;
          mesAnterior = dadosMensais.find(m => m.monthNumber === mesAnteriorNumero);
        }
        
        // Buscar o mesmo mês do ano anterior para comparação
        const mesmoMesAnoAnterior = dadosMensaisAnoAnterior.find(m => m.monthNumber === mes.monthNumber);
        
        let variacao = null;
        if (mesAnterior && mesAnterior.faturado > 0) {
          variacao = ((mes.faturado - mesAnterior.faturado) / mesAnterior.faturado) * 100;
        }
        
        let variacaoAnoAnterior = null;
        if (mesmoMesAnoAnterior && mesmoMesAnoAnterior.faturado > 0) {
          variacaoAnoAnterior = ((mes.faturado - mesmoMesAnoAnterior.faturado) / mesmoMesAnoAnterior.faturado) * 100;
        }
        
        return {
          name: mes.name,
          faturado: mes.faturado,
          variacao_percentual: variacao,
          variacao_ano_anterior: variacaoAnoAnterior
        };
      });
      
      console.log(`Dados mensais processados para ${year}:`, mesesComVariacao);
      return mesesComVariacao;
      
    } catch (error: any) {
      console.error(`Erro ao buscar dados mensais para ${year}:`, error);
      toast({
        variant: "destructive",
        title: `Erro ao carregar dados mensais de ${year}`,
        description: error.message || "Não foi possível carregar os dados mensais"
      });
      return [];
    }
  };

  // Função para buscar dados de ticket médio por projeto por ano
  const fetchTicketMedioPorProjeto = async () => {
    try {
      console.log("Buscando dados de ticket médio por projeto por ano");
      const currentYear = new Date().getFullYear();
      
      // Vamos buscar dados a partir de 2024
      const anoInicial = 2024;
      const anosDisponiveis = [];
      for (let ano = anoInicial; ano <= currentYear; ano++) {
        anosDisponiveis.push(ano);
      }

      const resultados = [];

      // Armazenar temporariamente os valores para calcular variação
      const valoresPorAno: { [key: number]: number } = {};

      // Primeiro passo: calcular valor do ticket por ano
      for (const ano of anosDisponiveis) {
        const startDate = `${ano}-01-01`;
        const endDate = `${ano}-12-31`;
        
        // Buscar todas as vendas do ano
        const { data: vendasAno, error: errorVendasAno } = await supabase
          .from('orcamentos')
          .select(`
            id,
            codigo_projeto,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', startDate)
          .lte('data_venda', endDate)
          .not('codigo_projeto', 'is', null);
        
        if (errorVendasAno) {
          console.error(`Erro ao buscar vendas para o ano ${ano}:`, errorVendasAno);
          continue;
        }

        // Calcular o valor total de vendas
        let valorTotalVendas = 0;
        if (vendasAno) {
          valorTotalVendas = vendasAno.reduce((total, venda) => {
            const valorVenda = venda.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            return total + valorVenda;
          }, 0);
        }

        // Contagem de projetos únicos
        const projetosUnicos = new Set();
        if (vendasAno) {
          vendasAno.forEach(venda => {
            if (venda.codigo_projeto) {
              projetosUnicos.add(venda.codigo_projeto);
            }
          });
        }

        const contagemProjetos = projetosUnicos.size;
        
        // Calcular ticket médio por projeto
        const ticketMedio = contagemProjetos > 0 ? valorTotalVendas / contagemProjetos : 0;
        
        // Armazenar para cálculo de variação
        valoresPorAno[ano] = ticketMedio;

        resultados.push({
          name: ano.toString(),
          ticket_medio: ticketMedio,
          contagem_projetos: contagemProjetos,
          total_vendas: valorTotalVendas
        });
      }

      // Segundo passo: calcular variações percentuais
      const resultadosComVariacao = resultados.map(item => {
        const anoAtual = parseInt(item.name, 10);
        const anoAnterior = anoAtual - 1;
        
        // Verificar se temos dados do ano anterior
        if (valoresPorAno[anoAnterior] && valoresPorAno[anoAnterior] > 0) {
          const variacaoPercentual = ((item.ticket_medio - valoresPorAno[anoAnterior]) / valoresPorAno[anoAnterior]) * 100;
          return {
            ...item,
            variacao_percentual: variacaoPercentual
          };
        }
        
        return {
          ...item,
          variacao_percentual: null // Sem dados para comparar
        };
      });

      console.log("Dados de ticket médio por projeto processados:", resultadosComVariacao);
      return resultadosComVariacao;
    } catch (error: any) {
      console.error("Erro ao processar dados de ticket médio por projeto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados de ticket médio por projeto",
        description: error.message || "Não foi possível processar os dados de ticket médio"
      });
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Formato de data correto para o Supabase: YYYY-MM-DD
      const currentYear = new Date().getFullYear();
      
      // Buscar dados de comparação anual
      console.log("Iniciando busca de dados de comparação anual");
      const { data: yearComparisonData, error: comparisonError } = await supabase
        .rpc('get_yearly_sales_comparison');

      if (comparisonError) {
        console.error("Erro ao buscar comparação anual:", comparisonError);
        throw comparisonError;
      }
      
      console.log("Dados de comparação anual brutos:", yearComparisonData);
      
      // Garantir que todos os campos numéricos sejam números e não nulos
      const processedYearlyData = Array.isArray(yearComparisonData) ? yearComparisonData.map((item: any) => ({
        year: Number(item.year || 0),
        total: Number(item.total || 0),
        variacao_total: item.variacao_total !== null ? Number(item.variacao_total) : null,
        media_mensal: Number(item.media_mensal || 0),
        variacao_media: item.variacao_media !== null ? Number(item.variacao_media) : null,
        num_meses: Number(item.num_meses || 0)
      })) : [];

      console.log("Dados de comparação anual processados:", processedYearlyData);
      setYearlyComparisonData(processedYearlyData);
      
      // Definir datas para mês atual e anterior
      const startCurrentMonth = startOfMonth(new Date());
      const endCurrentMonth = endOfMonth(new Date());
      
      const startCurrentMonthFormatted = format(startCurrentMonth, 'yyyy-MM-dd');
      const endCurrentMonthFormatted = format(endCurrentMonth, 'yyyy-MM-dd');
      
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
      
      const startLastMonthFormatted = format(startLastMonth, 'yyyy-MM-dd');
      const endLastMonthFormatted = format(endLastMonth, 'yyyy-MM-dd');
      
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

      // Calcular variação percentual
      const variacaoPercentual = vendasMesAnterior === 0 ? 100 : ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100;

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
      
      // Calcular ticket médio por projeto
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

      if (projetosError) throw projetosError;
      
      // Contar projetos únicos
      const projetosUnicos = new Set();
      let totalValorProjetos = 0;
      
      if (projetosData) {
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
      
      // Calcular ticket médio por projeto
      const mediaTicketPorProjeto = projetosUnicos.size > 0 ? totalValorProjetos / projetosUnicos.size : 0;
      
      // Buscar clientes ativos (com vendas nos últimos 90 dias)
      const ninetyDaysAgo = subDays(new Date(), 90);
      const ninetyDaysAgoFormatted = format(ninetyDaysAgo, 'yyyy-MM-dd');
      
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

      setSalesData({
        total_vendas: totalVendas,
        vendas_mes_atual: vendasMesAtual,
        vendas_mes_anterior: vendasMesAnterior,
        variacao_percentual: variacaoPercentual,
        media_ticket: mediaTicket,
        media_ticket_projeto: mediaTicketPorProjeto, // Adicionado campo para ticket médio por projeto
        clientes_ativos: clientesAtivos
      });

      // Buscar dados para o gráfico de barras MENSAIS de forma manual
      try {
        console.log("Iniciando busca de dados para gráfico mensal");
        
        // Obter todas as vendas do ano atual
        const { data: vendaAnual, error: vendaAnualError } = await supabase
          .from('orcamentos')
          .select(`
            id, 
            data_venda,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', `${currentYear}-01-01`)
          .lte('data_venda', `${currentYear}-12-31`);
        
        if (vendaAnualError) {
          console.error("Erro ao buscar vendas anuais:", vendaAnualError);
          throw vendaAnualError;
        }
        
        console.log(`Vendas do ano ${currentYear} encontradas:`, vendaAnual?.length);

        // Criar estrutura mensal com valores iniciais zerados
        const meses = [
          "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
          "Jul", "Ago", "Set", "Out", "Nov", "Dez"
        ];
        
        const dadosMensais = meses.map((name, index) => ({
          name,
          faturado: 0
        }));
        
        // Preencher os valores de cada mês
        if (vendaAnual) {
          vendaAnual.forEach(venda => {
            if (venda.data_venda) {
              // CORREÇÃO: Usar o mês diretamente da string da data para evitar problemas de timezone
              // Formato da data no banco é 'YYYY-MM-DD', então pegamos o mês diretamente (índice 5-6)
              const mesString = venda.data_venda.substring(5, 7);
              const mes = parseInt(mesString, 10) - 1; // Converter para índice de array (0-11)
              
              // Calcular o valor total do orçamento
              const valorTotal = venda.orcamentos_itens.reduce(
                (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
              );
              
              // Adicionar ao mês correspondente
              if (mes >= 0 && mes < 12) {
                dadosMensais[mes].faturado += valorTotal;
              }
            }
          });
        }
        
        console.log("Dados mensais processados:", dadosMensais);
        setBarChartData(dadosMensais);
        
        // Processar dados trimestrais a partir dos dados mensais
        const dadosTrimestrais = [
          { name: '1º Trim', faturado: 0 },
          { name: '2º Trim', faturado: 0 },
          { name: '3º Trim', faturado: 0 },
          { name: '4º Trim', faturado: 0 }
        ];
        
        // Somar os meses para formar os trimestres
        dadosMensais.forEach((mes, index) => {
          const trimestre = Math.floor(index / 3);
          dadosTrimestrais[trimestre].faturado += mes.faturado;
        });
        
        console.log("Dados trimestrais processados:", dadosTrimestrais);
        setQuarterlyChartData(dadosTrimestrais);
        
      } catch (monthlyError) {
        console.error("Erro ao processar dados mensais:", monthlyError);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados mensais",
          description: "Não foi possível processar os dados mensais"
        });
      }

      // Buscar dados para gráficos anuais
      try {
        console.log("Iniciando busca de dados anuais");
        
        // Vamos buscar dados dos últimos 3 anos
        const yearsToShow = 3;
        const currentYear = new Date().getFullYear();
        const yearlyResults = [];
        
        // Buscar vendas por ano para os últimos 3 anos
        for (let i = 0; i < yearsToShow; i++) {
          const year = currentYear - i;
          
          // Buscar
