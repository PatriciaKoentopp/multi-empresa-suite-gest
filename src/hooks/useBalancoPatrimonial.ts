
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { PlanoConta } from "@/types/plano-contas";

interface ContaBalanco {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  saldo: number;
  categoria: string;
}

interface BalancoPatrimonial {
  ativo: {
    circulante: ContaBalanco[];
    nao_circulante: ContaBalanco[];
    total: number;
  };
  passivo: {
    circulante: ContaBalanco[];
    nao_circulante: ContaBalanco[];
    total: number;
  };
  patrimonio_liquido: {
    contas: ContaBalanco[];
    total: number;
  };
}

export function useBalancoPatrimonial() {
  const { currentCompany } = useCompany();
  const [balanco, setBalanco] = useState<BalancoPatrimonial>({
    ativo: { circulante: [], nao_circulante: [], total: 0 },
    passivo: { circulante: [], nao_circulante: [], total: 0 },
    patrimonio_liquido: { contas: [], total: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);

  const calcularSaldoConta = (lancamentos: any[], contaId: string): number => {
    return lancamentos.reduce((saldo, lancamento) => {
      if (lancamento.conta_debito_id === contaId) {
        return saldo + Number(lancamento.valor);
      }
      if (lancamento.conta_credito_id === contaId) {
        return saldo - Number(lancamento.valor);
      }
      return saldo;
    }, 0);
  };

  const processarContasBalanco = (contas: PlanoConta[], lancamentos: any[]): ContaBalanco[] => {
    return contas.map((conta) => ({
      id: conta.id,
      codigo: conta.codigo,
      descricao: conta.descricao,
      tipo: conta.tipo,
      categoria: conta.categoria,
      saldo: calcularSaldoConta(lancamentos, conta.id)
    }));
  };

  const fetchBalanco = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      // Buscar plano de contas
      const { data: contas, error: contasError } = await supabase
        .from("plano_contas")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo")
        .order("codigo");

      if (contasError) throw contasError;

      // Buscar lançamentos contábeis
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from("lancamentos_contabeis")
        .select("*")
        .eq("empresa_id", currentCompany.id);

      if (lancamentosError) throw lancamentosError;

      if (!contas || !lancamentos) return;

      // Converter tipos para compatibilidade
      const contasFormatadas: PlanoConta[] = contas.map(conta => ({
        ...conta,
        categoria: conta.categoria as "título" | "movimentação",
        status: conta.status as "ativo" | "inativo"
      }));

      // Separar contas por tipo
      const contasAtivo = contasFormatadas.filter(conta => conta.tipo === "ativo");
      const contasPassivo = contasFormatadas.filter(conta => conta.tipo === "passivo");
      const contasPatrimonio = contasFormatadas.filter(conta => conta.tipo === "patrimonio_liquido");

      // Processar saldos
      const ativoProcessado = processarContasBalanco(contasAtivo, lancamentos);
      const passivoProcessado = processarContasBalanco(contasPassivo, lancamentos);
      const patrimonioProcessado = processarContasBalanco(contasPatrimonio, lancamentos);

      // Calcular totais
      const totalAtivo = ativoProcessado.reduce((total, conta) => total + conta.saldo, 0);
      const totalPassivo = passivoProcessado.reduce((total, conta) => total + conta.saldo, 0);
      const totalPatrimonio = patrimonioProcessado.reduce((total, conta) => total + conta.saldo, 0);

      setBalanco({
        ativo: {
          circulante: ativoProcessado.filter(conta => conta.categoria === "movimentação"),
          nao_circulante: ativoProcessado.filter(conta => conta.categoria === "título"),
          total: totalAtivo
        },
        passivo: {
          circulante: passivoProcessado.filter(conta => conta.categoria === "movimentação"),
          nao_circulante: passivoProcessado.filter(conta => conta.categoria === "título"),
          total: totalPassivo
        },
        patrimonio_liquido: {
          contas: patrimonioProcessado,
          total: totalPatrimonio
        }
      });

    } catch (error) {
      console.error("Erro ao buscar balanço patrimonial:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      fetchBalanco();
    }
  }, [currentCompany?.id]);

  return {
    balanco,
    isLoading,
    refetch: fetchBalanco
  };
}
