
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
      console.log(`Buscando dados mensais para o ano ${year}`);
      
      // Tentar usar a função RPC para dados mensais se disponível
      try {
        const { data, error } = await supabase
          .rpc('get_monthly_sales_chart_data', { year_param: year });
          
        if (!error && data) {
          console.log(`Dados mensais recebidos via RPC para ${year}:`, data);
          
          // Mapear os nomes dos meses para valores numéricos para ordenação
          const mesesMap = getMesesMap();
          
          // Ordenar os meses em ordem cronológica (Janeiro -> Dezembro)
          const mesesOrdenados = data
            .map((item: any) => ({
              name: String(item.name || ''),
              faturado: Number(item.faturado || 0),
              monthNumber: mesesMap[String(item.name)] || 0,
              variacao_percentual: null,
              variacao_ano_anterior: null
            }))
            .sort((a, b) => a.monthNumber - b.monthNumber); // Ordenar cronologicamente
          
          console.log("Meses ordenados com valores para tabela:", mesesOrdenados);
          
          if (mesesOrdenados.length === 0) {
            return [{
              name: `Sem dados para ${year}`,
              faturado: 0,
              variacao_percentual: null,
              variacao_ano_anterior: null
            }];
          }
          
          // Buscar dados dos mesmos meses do ano anterior para comparação
          const anoAnterior = year - 1;
          let dadosMesmoMesAnoAnterior: any[] = [];
          
          try {
            const { data: dataAnoAnterior, error: errorAnoAnterior } = await supabase
              .rpc('get_monthly_sales_chart_data', { year_param: anoAnterior });
              
            if (!errorAnoAnterior && dataAnoAnterior) {
              // Transformar em formato mais fácil de pesquisar
              dadosMesmoMesAnoAnterior = dataAnoAnterior
                .map((item: any) => ({
                  name: String(item.name || ''),
                  faturado: Number(item.faturado || 0),
                  monthNumber: mesesMap[String(item.name)] || 0
                }));
              
              console.log(`Dados do ano anterior (${anoAnterior}) para comparação:`, dadosMesmoMesAnoAnterior);
            }
          } catch (e) {
            console.warn(`Erro ao buscar dados do ano anterior (${anoAnterior})`, e);
          }
          
          // Calcular percentuais de variação mês a mês
          const dadosComVariacao = mesesOrdenados.map((mesAtual) => {
            // Mês anterior no mesmo ano (para calcular variação em relação ao mês anterior)
            const mesAnteriorNumero = mesAtual.monthNumber > 1 ? mesAtual.monthNumber - 1 : null;
            const mesAnteriorMesmoAno = mesAnteriorNumero 
              ? mesesOrdenados.find(m => m.monthNumber === mesAnteriorNumero) 
              : null;
            
            // Mesmo mês no ano anterior (para calcular variação em relação ao mesmo mês do ano anterior)
            const mesmoMesAnoAnterior = dadosMesmoMesAnoAnterior.find(
              m => m.monthNumber === mesAtual.monthNumber
            );
            
            // Calcular variação em relação ao mês anterior
            let variacaoMesAnterior = null;
            if (mesAnteriorMesmoAno && mesAnteriorMesmoAno.faturado > 0) {
              variacaoMesAnterior = ((mesAtual.faturado - mesAnteriorMesmoAno.faturado) / mesAnteriorMesmoAno.faturado) * 100;
            }
            
            // Calcular variação em relação ao mesmo mês no ano anterior
            let variacaoAnoAnterior = null;
            if (mesmoMesAnoAnterior && mesmoMesAnoAnterior.faturado > 0) {
              variacaoAnoAnterior = ((mesAtual.faturado - mesmoMesAnoAnterior.faturado) / mesmoMesAnoAnterior.faturado) * 100;
            }
            
            return {
              ...mesAtual,
              variacao_percentual: variacaoMesAnterior,
              variacao_ano_anterior: variacaoAnoAnterior
            };
          });
          
          console.log("Dados mensais com variações calculadas:", dadosComVariacao);
          return dadosComVariacao;
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
      
      console.log(`Vendas do ano ${year} encontradas:`, vendaAnual?.length);

      // Criar estrutura mensal com valores iniciais zerados
      const meses = getMesesNomes();
      
      // Mapeamento reverso de mês para número (para ordenação posterior)
      const mesesMap = getMesesMap();
      
      const dadosMensais = meses.map((name, index) => ({
        name,
        faturado: 0,
        monthNumber: index + 1,
        variacao_percentual: null,
        variacao_ano_anterior: null
      }));
      
      // Preencher os valores de cada mês para o ano atual
      if (vendaAnual && vendaAnual.length > 0) {
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
      
      // Buscar dados para ano anterior (para comparação)
      const anoAnterior = year - 1;
      const dadosMensaisAnoAnterior = [...dadosMensais].map(item => ({...item, faturado: 0}));
      
      try {
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
          
        if (!vendaAnoAnteriorError && vendaAnoAnterior && vendaAnoAnterior.length > 0) {
          // Preencher os valores de cada mês para o ano anterior
          vendaAnoAnterior.forEach((venda: any) => {
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
      } catch (e) {
        console.warn(`Erro ao buscar vendas do ano anterior (${anoAnterior})`, e);
      }
      
      // Calcular percentuais de variação mês a mês
      for (let i = 0; i < dadosMensais.length; i++) {
        // Calcular variação em relação ao mês anterior
        if (i > 0 && dadosMensais[i-1].faturado > 0) {
          dadosMensais[i].variacao_percentual = 
            ((dadosMensais[i].faturado - dadosMensais[i-1].faturado) / dadosMensais[i-1].faturado) * 100;
        }
        
        // Calcular variação em relação ao mesmo mês do ano anterior
        if (dadosMensaisAnoAnterior[i].faturado > 0) {
          dadosMensais[i].variacao_ano_anterior = 
            ((dadosMensais[i].faturado - dadosMensaisAnoAnterior[i].faturado) / dadosMensaisAnoAnterior[i].faturado) * 100;
        }
      }
      
      // Filtrar apenas meses com vendas
      const mesesComVendas = dadosMensais.filter(mes => mes.faturado > 0);
      
      if (mesesComVendas.length === 0) {
        return [{
          name: `Sem dados para ${year}`,
          faturado: 0,
          variacao_percentual: null,
          variacao_ano_anterior: null
        }];
      }
      
      console.log("Dados mensais processados manualmente:", mesesComVendas);
      return mesesComVendas;
      
    } catch (error: any) {
      console.error(`Erro ao buscar dados mensais para ${year}:`, error);
      toast({
        variant: "destructive",
        title: `Erro ao carregar dados mensais de ${year}`,
        description: error.message || "Não foi possível carregar os dados mensais"
      });
      return [{
        name: `Erro ao carregar ${year}`,
        faturado: 0,
        variacao_percentual: null,
        variacao_ano_anterior: null
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
