import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { format, parseISO } from "date-fns";

export interface AntecipacaoRelatorio {
  id: string;
  favorecido: string;
  descricao: string;
  dataLancamento: Date;
  tipoOperacao: 'receber' | 'pagar';
  valorTotal: number;
  valorUtilizado: number;
  valorDisponivel: number;
  status: string;
  numeroDocumento: string;
}

export interface ResumoAntecipacoes {
  totalAntecipacoes: number;
  valorTotalDisponivel: number;
  antecipacoesRecebimento: number;
  valorRecebimento: number;
  antecipacoesPagamento: number;
  valorPagamento: number;
}

export function useRelatorioAntecipacoes() {
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [antecipacoes, setAntecipacoes] = useState<AntecipacaoRelatorio[]>([]);
  const [resumo, setResumo] = useState<ResumoAntecipacoes>({
    totalAntecipacoes: 0,
    valorTotalDisponivel: 0,
    antecipacoesRecebimento: 0,
    valorRecebimento: 0,
    antecipacoesPagamento: 0,
    valorPagamento: 0,
  });

  const gerarRelatorio = async (dataReferencia: Date) => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const dataReferenciaStr = format(dataReferencia, 'yyyy-MM-dd');

      // Buscar antecipações lançadas até a data de referência
      const { data: antecipacoesData, error } = await supabase
        .from('antecipacoes')
        .select(`
          id,
          data_lancamento,
          tipo_operacao,
          valor_total,
          valor_utilizado,
          descricao,
          numero_documento,
          status,
          favorecido_id
        `)
        .eq('empresa_id', currentCompany.id)
        .lte('data_lancamento', dataReferenciaStr)
        .neq('status', 'devolvida');

      if (error) throw error;

      // Buscar nomes dos favorecidos
      const favorecidoIds = [...new Set(antecipacoesData?.map(a => a.favorecido_id).filter(Boolean))];
      
      let favorecidosMap: Record<string, string> = {};
      if (favorecidoIds.length > 0) {
        const { data: favorecidos } = await supabase
          .from('favorecidos')
          .select('id, nome')
          .in('id', favorecidoIds);
        
        if (favorecidos) {
          favorecidosMap = favorecidos.reduce((acc, fav) => {
            acc[fav.id] = fav.nome;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Filtrar apenas as que têm valor disponível
      const antecipacoesEmAberto: AntecipacaoRelatorio[] = [];

      antecipacoesData?.forEach((ant) => {
        const valorDisponivel = Number(ant.valor_total) - Number(ant.valor_utilizado);
        
        if (valorDisponivel > 0) {
          antecipacoesEmAberto.push({
            id: ant.id,
            favorecido: ant.favorecido_id ? favorecidosMap[ant.favorecido_id] || 'Não informado' : 'Não informado',
            descricao: ant.descricao || `Doc: ${ant.numero_documento || 'S/N'}`,
            dataLancamento: parseISO(ant.data_lancamento),
            tipoOperacao: ant.tipo_operacao as 'receber' | 'pagar',
            valorTotal: Number(ant.valor_total),
            valorUtilizado: Number(ant.valor_utilizado),
            valorDisponivel: valorDisponivel,
            status: ant.status,
            numeroDocumento: ant.numero_documento || '',
          });
        }
      });

      // Ordenar por data de lançamento
      antecipacoesEmAberto.sort((a, b) => a.dataLancamento.getTime() - b.dataLancamento.getTime());

      // Calcular resumo
      const recebimentos = antecipacoesEmAberto.filter(a => a.tipoOperacao === 'receber');
      const pagamentos = antecipacoesEmAberto.filter(a => a.tipoOperacao === 'pagar');

      setAntecipacoes(antecipacoesEmAberto);
      setResumo({
        totalAntecipacoes: antecipacoesEmAberto.length,
        valorTotalDisponivel: antecipacoesEmAberto.reduce((sum, a) => sum + a.valorDisponivel, 0),
        antecipacoesRecebimento: recebimentos.length,
        valorRecebimento: recebimentos.reduce((sum, a) => sum + a.valorDisponivel, 0),
        antecipacoesPagamento: pagamentos.length,
        valorPagamento: pagamentos.reduce((sum, a) => sum + a.valorDisponivel, 0),
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    antecipacoes,
    resumo,
    gerarRelatorio,
  };
}
