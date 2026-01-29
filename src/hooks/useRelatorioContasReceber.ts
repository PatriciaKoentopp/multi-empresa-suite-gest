import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { format, parseISO } from "date-fns";

export interface ContaReceberRelatorio {
  id: string;
  movimentacao_id: string;
  cliente: string;
  descricao: string;
  dataVencimento: Date;
  numeroParcela: string;
  valor: number;
  situacao: 'vencida' | 'a_vencer';
}

export interface ResumoContasReceber {
  totalContas: number;
  valorTotal: number;
  contasVencidas: number;
  valorVencido: number;
  contasAVencer: number;
  valorAVencer: number;
}

export function useRelatorioContasReceber() {
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [contas, setContas] = useState<ContaReceberRelatorio[]>([]);
  const [resumo, setResumo] = useState<ResumoContasReceber>({
    totalContas: 0,
    valorTotal: 0,
    contasVencidas: 0,
    valorVencido: 0,
    contasAVencer: 0,
    valorAVencer: 0,
  });

  const gerarRelatorio = async (dataReferencia: Date) => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const dataReferenciaStr = format(dataReferencia, 'yyyy-MM-dd');

      // Buscar movimentações de receber lançadas até a data de referência
      const { data: movimentacoes, error } = await supabase
        .from('movimentacoes')
        .select(`
          id,
          descricao,
          data_lancamento,
          numero_documento,
          favorecido:favorecidos(id, nome),
          movimentacoes_parcelas(
            id, 
            numero, 
            valor, 
            data_vencimento, 
            data_pagamento
          )
        `)
        .eq('tipo_operacao', 'receber')
        .eq('empresa_id', currentCompany.id)
        .lte('data_lancamento', dataReferenciaStr);

      if (error) throw error;

      // Processar parcelas em aberto na data de referência
      const parcelasEmAberto: ContaReceberRelatorio[] = [];

      movimentacoes?.forEach((mov) => {
        const clienteNome = mov.favorecido?.nome || 'Não informado';
        
        mov.movimentacoes_parcelas?.forEach((parcela) => {
          // Parcela está em aberto se:
          // 1. Nunca foi recebida (data_pagamento IS NULL)
          // 2. OU foi recebida depois da data de referência
          const foiRecebidaAteDataRef = parcela.data_pagamento && 
            parcela.data_pagamento <= dataReferenciaStr;
          
          if (!foiRecebidaAteDataRef) {
            const dataVenc = parseISO(parcela.data_vencimento);
            const situacao = parcela.data_vencimento < dataReferenciaStr ? 'vencida' : 'a_vencer';
            
            parcelasEmAberto.push({
              id: parcela.id,
              movimentacao_id: mov.id,
              cliente: clienteNome,
              descricao: mov.descricao || `Doc: ${mov.numero_documento || 'S/N'}`,
              dataVencimento: dataVenc,
              numeroParcela: `${mov.numero_documento || 'S/N'}/${String(parcela.numero).padStart(2, '0')}`,
              valor: parcela.valor,
              situacao,
            });
          }
        });
      });

      // Ordenar por data de vencimento
      parcelasEmAberto.sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime());

      // Calcular resumo
      const contasVencidas = parcelasEmAberto.filter(c => c.situacao === 'vencida');
      const contasAVencer = parcelasEmAberto.filter(c => c.situacao === 'a_vencer');

      setContas(parcelasEmAberto);
      setResumo({
        totalContas: parcelasEmAberto.length,
        valorTotal: parcelasEmAberto.reduce((sum, c) => sum + c.valor, 0),
        contasVencidas: contasVencidas.length,
        valorVencido: contasVencidas.reduce((sum, c) => sum + c.valor, 0),
        contasAVencer: contasAVencer.length,
        valorAVencer: contasAVencer.reduce((sum, c) => sum + c.valor, 0),
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    contas,
    resumo,
    gerarRelatorio,
  };
}
