
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
      // Se o ano for anterior a 2023, não exibimos dados para o comparativo mensal
      if (year < 2023) {
        console.log(`Ano ${year} é anterior a 2023, não exibindo dados para o comparativo mensal`);
        return [{
          name: `Dados disponíveis a partir de 2023`,
          [year]: 0
        }];
      }
      
      console.log(`Buscando dados mensais para o ano ${year}`);
      
      // Tentar usar a função RPC para dados mensais se disponível
      try {
        const { data, error } = await supabase
          .rpc('get_monthly_sales_chart_data', { year_param: year });
          
        if (!error && data) {
          console.log(`Dados mensais recebidos via RPC para ${year}:`, data);
          const dadosFiltrados = data.filter((item: any) => Number(item.faturado) > 0);
          
          // Se não há dados, retornar pelo menos um item para mostrar o gráfico vazio
          if (dadosFiltrados.length === 0) {
            console.log("Sem dados mensais para o ano, criando estrutura vazia");
            return [{
              name: `Sem dados para ${year}`,
              [year]: 0
            }];
          }
          
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
              [year]: Number(item.faturado || 0), // Usar o ano como chave para o valor
              monthNumber: mesesMap[String(item.name)] || 0,
              year: year // Adicionar o ano para referência
            }))
            .sort((a, b) => a.monthNumber - b.monthNumber); // Ordenar cronologicamente (Jan -> Dez)
          
          console.log("Meses ordenados com valores para gráfico:", mesesOrdenadosComNumero);
          
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
                    [year-1]: Number(dezAnoAnterior.faturado || 0),
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
          
          // Verificar se o ano anterior é pelo menos 2023 (primeiro ano com dados disponíveis)
          if (anoAnterior < 2023) {
            console.log(`Ano anterior ${anoAnterior} é anterior a 2023, não exibindo comparativos`);
            return mesesOrdenadosComNumero;
          }
          
          let dadosMesmoMesAnoAnterior: any[] = [];
          
          try {
            const { data: dataAnoAnterior, error: errorAnoAnterior } = await supabase
              .rpc('get_monthly_sales_chart_data', { year_param: anoAnterior });
              
            if (!errorAnoAnterior && dataAnoAnterior) {
              // Transformar em formato mais fácil de pesquisar
              dadosMesmoMesAnoAnterior = dataAnoAnterior
                .filter((item: any) => Number(item.faturado) > 0)
                .map((item: any) => ({
                  name: String(item.name || ''),
                  [anoAnterior]: Number(item.faturado || 0), // Usar o ano anterior como chave
                  monthNumber: mesesMap[String(item.name)] || 0,
                  year: anoAnterior
                }));
              
              console.log(`Dados do ano anterior (${anoAnterior}):`, dadosMesmoMesAnoAnterior);
            }
          } catch (e) {
            console.warn(`Erro ao buscar dados do ano anterior (${anoAnterior})`, e);
          }
          
          // Mesclar os dados do ano atual com o ano anterior para exibir barras lado a lado
          const dadosCombinados = mesesOrdenadosComNumero.map(mesAtual => {
            // Procurar o mesmo mês no ano anterior
            const mesAnterior = dadosMesmoMesAnoAnterior.find(m => 
              m.monthNumber === mesAtual.monthNumber
            );
            
            return {
              name: mesAtual.name,
              [year]: mesAtual[year],
              [anoAnterior]: mesAnterior ? mesAnterior[anoAnterior] : 0,
              monthNumber: mesAtual.monthNumber
            };
          });
          
          console.log("Dados combinados para gráfico de comparação mensal:", dadosCombinados);
          return dadosCombinados;
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
      
      // Se o ano anterior for pelo menos 2023, buscar os dados para comparação
      const anoAnterior = year - 1;
      let vendaAnoAnterior = null;
      
      if (anoAnterior >= 2023) {
        const { data: vendasAnoAnterior, error: vendaAnoAnteriorError } = await supabase
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
        } else {
          vendaAnoAnterior = vendasAnoAnterior;
        }
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
        [year]: 0, // Usar o ano como chave para o valor
        monthNumber: index + 1,
        year
      }));
      
      // Estrutura similar para o ano anterior
      const dadosMensaisAnoAnterior = meses.map((name, index) => ({
        name,
        [anoAnterior]: 0, // Usar o ano anterior como chave
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
              dadosMensais[mes][year] += valorTotal;
            }
          }
        });
      }
      
      // Preencher os valores de cada mês para o ano anterior
      if (vendaAnoAnterior) {
        vendaAnoAnterior.forEach((venda: any) => {
          if (venda.data_venda) {
            const mesString = venda.data_venda.substring(5, 7);
            const mes = parseInt(mesString, 10) - 1;
            
            const valorTotal = venda.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            
            if (mes >= 0 && mes < 12) {
              dadosMensaisAnoAnterior[mes][anoAnterior] += valorTotal;
            }
          }
        });
      }
      
      // Filtrar apenas meses com vendas (em qualquer um dos anos)
      const mesesCombinados = meses.map((name, index) => {
        const mesAtual = dadosMensais[index];
        const mesAnterior = dadosMensaisAnoAnterior[index];
        
        return {
          name,
          [year]: mesAtual[year],
          [anoAnterior]: anoAnterior >= 2023 ? mesAnterior[anoAnterior] : 0,
          monthNumber: index + 1
        };
      }).filter(mes => mes[year] > 0 || (anoAnterior >= 2023 && mes[anoAnterior] > 0));
      
      // Se não temos dados em nenhum dos anos, retornar pelo menos um item para mostrar o gráfico vazio
      if (mesesCombinados.length === 0) {
        return [{
          name: `Sem dados para ${year}${anoAnterior >= 2023 ? `-${anoAnterior}` : ''}`,
          [year]: 0,
          [anoAnterior]: anoAnterior >= 2023 ? 0 : undefined
        }];
      }
      
      // Ordenar cronologicamente (Jan -> Dez)
      const mesesOrdenados = mesesCombinados.sort((a, b) => a.monthNumber - b.monthNumber);
      
      console.log("Dados mensais processados para comparação:", mesesOrdenados);
      return mesesOrdenados;
      
    } catch (error: any) {
      console.error(`Erro ao buscar dados mensais para ${year}:`, error);
      toast({
        variant: "destructive",
        title: `Erro ao carregar dados mensais de ${year}`,
        description: error.message || "Não foi possível carregar os dados mensais"
      });
      // Retornar pelo menos um item para o gráfico não quebrar
      return [{
        name: `Erro ao carregar ${year}`,
        [year]: 0
      }];
    }
  };

  // Função para buscar dados de ticket médio por projeto por ano
  const fetchTicketMedioPorProjeto = async () => {
    try {
      console.log("Buscando dados de ticket médio por projeto por ano");
      const currentYear = new Date().getFullYear();
      
      // Vamos buscar dados a partir de 2024 (ajustado conforme solicitado)
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

      // Calcular ticket médio por projeto
      // Primeiro buscamos os dados de ticket por projeto
      const ticketProjetoData = await fetchTicketMedioPorProjeto();
      setTicketMedioPorProjetoData(ticketProjetoData);
      
      // Pegamos o valor do ano atual se existir, caso contrário, usamos 0
      const anoAtualDados = ticketProjetoData.find(item => item.name === currentYear.toString());
      const mediaTicketPorProjeto = anoAtualDados ? anoAtualDados.ticket_medio : 0;
      
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
      
      // Ticket médio por projeto - usar o mesmo cálculo usado no gráfico
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
        media_ticket_projeto: valorTicketMedioPorProjeto, // Usando o valor calculado para projetos
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
          if (trimestre >= 0 && trimestre < 4) {
            dadosTrimestrais[trimestre].faturado += mes.faturado;
          }
        });
        
        console.log("Dados trimestrais processados:", dadosTrimestrais);
        setQuarterlyChartData(dadosTrimestrais);
        
        // Buscar dados para o gráfico de vendas anuais
        console.log("Iniciando busca de dados para gráfico anual");
        
        // Definir anos para busca (últimos 5 anos)
        const anoAtual = new Date().getFullYear();
        const anosParaGrafico = [];
        for (let i = 0; i < 5; i++) {
          anosParaGrafico.push(anoAtual - i);
        }
        
        anosParaGrafico.sort(); // Ordenar anos crescentemente
        
        // Criar estrutura para dados anuais
        const dadosAnuais = await Promise.all(anosParaGrafico.map(async (ano) => {
          // Buscar vendas para cada ano
          const { data: vendasAno, error: vendasAnoError } = await supabase
            .from('orcamentos')
            .select(`
              id, 
              data_venda,
              orcamentos_itens (valor)
            `)
            .eq('tipo', 'venda')
            .eq('status', 'ativo')
            .gte('data_venda', `${ano}-01-01`)
            .lte('data_venda', `${ano}-12-31`);
          
          if (vendasAnoError) {
            console.error(`Erro ao buscar vendas para o ano ${ano}:`, vendasAnoError);
            return { name: String(ano), faturado: 0 };
          }
          
          // Calcular total faturado
          let totalFaturadoAno = 0;
          if (vendasAno) {
            vendasAno.forEach(venda => {
              const valorOrcamento = venda.orcamentos_itens.reduce(
                (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
              );
              totalFaturadoAno += valorOrcamento;
            });
          }
          
          return {
            name: String(ano),
            faturado: totalFaturadoAno
          };
        }));
        
        console.log("Dados anuais processados:", dadosAnuais);
        setYearlyChartData(dadosAnuais);
        
        // Buscar dados de comparação mensal do ano atual
        const anoAtualMensal = await fetchMonthlySalesData(currentYear);
        setMonthlyComparisonData(anoAtualMensal);
        
      } catch (error: any) {
        console.error("Erro ao processar dados dos gráficos:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados dos gráficos",
          description: error.message || "Não foi possível processar os dados dos gráficos"
        });
      } finally {
        setIsLoading(false);
      }
      
    } catch (error: any) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dashboard de vendas",
        description: error.message || "Não foi possível carregar os dados do dashboard de vendas"
      });
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    salesData,
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    yearlyComparisonData,
    monthlyComparisonData,
    ticketMedioPorProjetoData,
    fetchMonthlySalesData
  };
};
