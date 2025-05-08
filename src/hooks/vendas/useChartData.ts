
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMesesAbreviados, processQuarterlyData } from "./salesChartUtils";
import { ChartData } from "./types";

export const useChartData = () => {
  const { toast } = useToast();
  const [barChartData, setBarChartData] = useState<ChartData[]>([]);
  const [quarterlyChartData, setQuarterlyChartData] = useState<ChartData[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<ChartData[]>([]);

  const fetchBarChartData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      
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
      const meses = getMesesAbreviados();
      
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
      const dadosTrimestrais = processQuarterlyData(dadosMensais);
      console.log("Dados trimestrais processados:", dadosTrimestrais);
      setQuarterlyChartData(dadosTrimestrais);
      
      return {
        barChartData: dadosMensais,
        quarterlyChartData: dadosTrimestrais
      };
    } catch (error: any) {
      console.error("Erro ao processar dados dos gráficos mensais/trimestrais:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados dos gráficos",
        description: error.message || "Não foi possível processar os dados dos gráficos"
      });
      return {
        barChartData: [],
        quarterlyChartData: []
      };
    }
  };

  const fetchYearlyChartData = async () => {
    try {
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
      return dadosAnuais;
    } catch (error: any) {
      console.error("Erro ao processar dados do gráfico anual:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados do gráfico anual",
        description: error.message || "Não foi possível processar os dados do gráfico anual"
      });
      return [];
    }
  };

  return {
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    fetchBarChartData,
    fetchYearlyChartData,
    setBarChartData,
    setQuarterlyChartData,
    setYearlyChartData
  };
};
