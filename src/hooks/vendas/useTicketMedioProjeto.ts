
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TicketMedioData } from "./types";

export const useTicketMedioProjeto = () => {
  const { toast } = useToast();

  // Função para buscar dados de ticket médio por projeto por ano
  const fetchTicketMedioPorProjeto = async (): Promise<TicketMedioData[]> => {
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

  return {
    fetchTicketMedioPorProjeto
  };
};
