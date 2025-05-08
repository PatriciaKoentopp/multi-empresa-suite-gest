
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMesesMap, calcularTotalVendasAno, getMesesNomes } from "./salesChartUtils";

export const useMonthlySalesData = () => {
  const { toast } = useToast();
  const [loadingMonth, setLoadingMonth] = useState<boolean>(false);

  // Função para buscar dados mensais por ano
  const fetchMonthlySalesData = async (year: number) => {
    try {
      setLoadingMonth(true);
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
          const mesesMap = getMesesMap();
          
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
      const meses = getMesesNomes();
      
      // Mapeamento reverso de mês para número (para ordenação posterior)
      const mesesMap = getMesesMap();
      
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
    } finally {
      setLoadingMonth(false);
    }
  };

  return {
    fetchMonthlySalesData,
    loadingMonth
  };
};
