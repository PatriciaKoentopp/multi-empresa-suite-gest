
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { LancamentoContabil } from "@/types/lancamentos-contabeis";
import { PlanoConta } from "@/types/plano-contas";

export function useLancamentosContabeis() {
  const { currentCompany } = useCompany();
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([]);
  const [contasDebito, setContasDebito] = useState<PlanoConta[]>([]);
  const [contasCredito, setContasCredito] = useState<PlanoConta[]>([]);
  const [todasContas, setTodasContas] = useState<PlanoConta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchContas();
      fetchLancamentos();
    }
  }, [currentCompany?.id]);

  const fetchContas = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("codigo");

      if (error) throw error;

      if (data) {
        const contasFormatadas: PlanoConta[] = data.map(conta => ({
          ...conta,
          categoria: conta.categoria as "título" | "movimentação",
          status: conta.status as "ativo" | "inativo"
        }));

        setContasDebito(contasFormatadas.filter(conta => conta.tipo === "debito"));
        setContasCredito(contasFormatadas.filter(conta => conta.tipo === "credito"));
        setTodasContas(contasFormatadas);
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  };

  const fetchLancamentos = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lancamentos_contabeis")
        .select(`
          *,
          conta_debito:plano_contas!conta_debito_id(codigo, descricao),
          conta_credito:plano_contas!conta_credito_id(codigo, descricao)
        `)
        .eq("empresa_id", currentCompany.id)
        .order("data", { ascending: false });

      if (error) throw error;

      if (data) {
        const lancamentosFormatados: LancamentoContabil[] = data.flatMap(lancamento => {
          const contaDebito = lancamento.conta_debito as any;
          const contaCredito = lancamento.conta_credito as any;
          
          return [
            {
              id: `${lancamento.id}-debito`,
              empresa_id: lancamento.empresa_id,
              data: lancamento.data,
              historico: lancamento.historico,
              conta_debito_id: lancamento.conta_debito_id,
              conta_credito_id: lancamento.conta_credito_id,
              conta: `${contaDebito?.codigo} - ${contaDebito?.descricao}`,
              conta_nome: contaDebito?.descricao,
              conta_codigo: contaDebito?.codigo,
              tipo: 'debito' as const,
              valor: lancamento.valor,
              saldo: 0,
            },
            {
              id: `${lancamento.id}-credito`,
              empresa_id: lancamento.empresa_id,
              data: lancamento.data,
              historico: lancamento.historico,
              conta_debito_id: lancamento.conta_debito_id,
              conta_credito_id: lancamento.conta_credito_id,
              conta: `${contaCredito?.codigo} - ${contaCredito?.descricao}`,
              conta_nome: contaCredito?.descricao,
              conta_codigo: contaCredito?.codigo,
              tipo: 'credito' as const,
              valor: lancamento.valor,
              saldo: 0,
            }
          ];
        });

        setLancamentos(lancamentosFormatados);
      }
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createLancamento = async (data: {
    data: string;
    historico: string;
    conta_debito_id: string;
    conta_credito_id: string;
    valor: number;
  }) => {
    if (!currentCompany?.id) return;

    try {
      const { error } = await supabase
        .from("lancamentos_contabeis")
        .insert({
          ...data,
          empresa_id: currentCompany.id,
        });

      if (error) throw error;

      await fetchLancamentos();
      return true;
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      return false;
    }
  };

  return {
    lancamentos,
    contasDebito,
    contasCredito,
    todasContas,
    isLoading,
    createLancamento,
    refetch: fetchLancamentos,
  };
}
