
import { useState, useCallback } from "react";
import { addMonths, format, parseISO, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { DetalhesMensaisConta, ValorMensal } from "@/types/financeiro";

export interface AnaliseDreFilters {
  contaId?: string;
  dataFinal: Date;
  mesesParaAnalise: number;
}

export function useAnaliseDre() {
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [dadosDetalhados, setDadosDetalhados] = useState<DetalhesMensaisConta[]>([]);

  // Função para obter dados da análise considerando TODOS os meses
  const fetchDadosAnalise = useCallback(async (filtros: AnaliseDreFilters) => {
    if (!currentCompany?.id) return;
    
    setIsLoading(true);
    
    try {
      // Calcular período de análise corretamente para incluir todos os meses
      const dataFinal = filtros.dataFinal;
      // Aqui é a correção principal: incluir o mês inicial por completo
      // Isso garante que março/2023 seja incluído integralmente
      const dataInicial = subMonths(dataFinal, filtros.mesesParaAnalise - 1);
      
      // Formatar para o início do mês inicial e fim do mês final
      const dataInicialFormatada = format(new Date(dataInicial.getFullYear(), dataInicial.getMonth(), 1), 'yyyy-MM-dd');
      const dataFinalFormatada = format(new Date(dataFinal.getFullYear(), dataFinal.getMonth() + 1, 0), 'yyyy-MM-dd');
      
      console.log(`Buscando dados de ${dataInicialFormatada} até ${dataFinalFormatada}`);
      
      // Buscar todas as movimentações do período completo
      const { data: movimentacoes, error } = await supabase
        .from('fluxo_caixa')
        .select(`
          *,
          movimentacoes (
            categoria_id,
            tipo_operacao,
            considerar_dre,
            plano_contas:categoria_id(id, tipo, descricao, classificacao_dre)
          )
        `)
        .eq('empresa_id', currentCompany.id)
        .gte('data_movimentacao', dataInicialFormatada)
        .lte('data_movimentacao', dataFinalFormatada)
        .order('data_movimentacao', { ascending: true });

      if (error) throw error;
      
      console.log(`Encontradas ${movimentacoes?.length || 0} movimentações no período`);
      
      // Criar estrutura para todos os meses no período
      const mesesPeriodo = [];
      let dataCursor = new Date(dataInicial);
      
      while (dataCursor <= dataFinal) {
        mesesPeriodo.push({
          ano: dataCursor.getFullYear(),
          mes: dataCursor.getMonth() + 1,
          nome: format(dataCursor, 'MMMM/yyyy', { locale: require('date-fns/locale/pt-BR') })
        });
        dataCursor = addMonths(dataCursor, 1);
      }
      
      // Processar os dados por conta (luz, água, etc)
      const contas: Record<string, DetalhesMensaisConta> = {};
      
      // Inicializar todas as contas encontradas com todos os meses do período
      (movimentacoes || []).forEach(mov => {
        const planoContas = mov.movimentacoes?.plano_contas;
        if (!planoContas) return;
        
        const nomeConta = planoContas.descricao;
        
        if (!contas[nomeConta]) {
          // Inicializar estrutura da conta com todos os meses zerados
          contas[nomeConta] = {
            nome_conta: nomeConta,
            valores_mensais: mesesPeriodo.map(mesInfo => ({
              mes: mesInfo.mes,
              ano: mesInfo.ano,
              mes_nome: mesInfo.nome,
              valor: 0,
              data_completa: new Date(mesInfo.ano, mesInfo.mes - 1, 15) // dia 15 para ordenação
            })),
            media: 0,
            total: 0,
            meses_com_valor: 0
          };
        }
      });
      
      // Preencher valores reais das movimentações
      (movimentacoes || []).forEach(mov => {
        const planoContas = mov.movimentacoes?.plano_contas;
        if (!planoContas) return;
        
        const nomeConta = planoContas.descricao;
        const valor = Number(mov.valor);
        
        if (!contas[nomeConta]) return; // Já inicializamos todas as contas acima
        
        // Extrair mês e ano da data da movimentação
        const dataMovimentacao = parseISO(mov.data_movimentacao);
        const mesMovimentacao = dataMovimentacao.getMonth() + 1;
        const anoMovimentacao = dataMovimentacao.getFullYear();
        
        // Encontrar o índice do mês correspondente
        const mesIndex = contas[nomeConta].valores_mensais.findIndex(
          vm => vm.mes === mesMovimentacao && vm.ano === anoMovimentacao
        );
        
        if (mesIndex >= 0) {
          // Acumular o valor no mês correto
          contas[nomeConta].valores_mensais[mesIndex].valor += valor;
          
          // Se estamos apenas começando a somar neste mês, incrementar meses_com_valor
          if (contas[nomeConta].valores_mensais[mesIndex].valor !== 0 && 
              Math.abs(contas[nomeConta].valores_mensais[mesIndex].valor - valor) < 0.01) {
            contas[nomeConta].meses_com_valor++;
          }
          
          // Atualizar o total da conta
          contas[nomeConta].total += valor;
        }
      });
      
      // Calcular média de cada conta corretamente
      Object.values(contas).forEach(conta => {
        // Usar número de meses do período para média, mesmo que alguns estejam zerados
        conta.media = conta.total / filtros.mesesParaAnalise;
        
        // Ordenar por data para exibição
        conta.valores_mensais.sort((a, b) => 
          a.data_completa.getTime() - b.data_completa.getTime()
        );
        
        console.log(`Conta ${conta.nome_conta}: média ${conta.media}, total ${conta.total}, meses com valor ${conta.meses_com_valor}`);
      });
      
      // Converter para array e ordenar por nome da conta
      const resultado = Object.values(contas).sort((a, b) => 
        a.nome_conta.localeCompare(b.nome_conta)
      );
      
      setDadosDetalhados(resultado);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Erro ao buscar dados para análise:", error);
      toast.error("Não foi possível obter os dados para análise");
      setIsLoading(false);
    }
  }, [currentCompany]);

  return { isLoading, dadosDetalhados, fetchDadosAnalise };
}
