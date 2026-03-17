
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useLogTransacao } from "@/hooks/useLogTransacao";

interface FechamentoMensal {
  id: string;
  empresa_id: string;
  mes: number;
  ano: number;
  data_fechamento: string;
  fechado_por: string | null;
  fechado_por_nome: string | null;
  observacoes: string | null;
  created_at: string;
}

export const useFechamentoMensal = () => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { registrarLog } = useLogTransacao();
  const [mesesFechados, setMesesFechados] = useState<FechamentoMensal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregarFechamentos = useCallback(async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from("fechamentos_mensais" as any)
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });

      if (error) throw error;
      setMesesFechados((data as any[]) || []);
    } catch (error) {
      console.error("Erro ao carregar fechamentos:", error);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    carregarFechamentos();
  }, [carregarFechamentos]);

  const verificarPeriodoFechado = useCallback(
    (data: Date | string): boolean => {
      if (!data) return false;
      const d = typeof data === "string" ? new Date(data) : data;
      const mes = d.getMonth() + 1;
      const ano = d.getFullYear();
      return mesesFechados.some((f) => f.mes === mes && f.ano === ano);
    },
    [mesesFechados]
  );

  const fecharMes = async (mes: number, ano: number, observacoes?: string) => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("fechamentos_mensais" as any)
        .insert({
          empresa_id: currentCompany.id,
          mes,
          ano,
          fechado_por: user?.id || null,
          fechado_por_nome: user?.email || "Sistema",
          observacoes: observacoes || null,
        });

      if (error) throw error;

      await registrarLog({
        acao: "fechar",
        modulo: "administrativo",
        entidade: "fechamento_mensal",
        descricao: `Período fechado: ${String(mes).padStart(2, "0")}/${ano}${observacoes ? ` - ${observacoes}` : ""}`,
        dados_novos: { mes, ano, observacoes },
      });

      toast.success(`Período ${String(mes).padStart(2, "0")}/${ano} fechado com sucesso!`);
      await carregarFechamentos();
    } catch (error: any) {
      console.error("Erro ao fechar mês:", error);
      if (error?.code === "23505") {
        toast.error("Este período já está fechado.");
      } else {
        toast.error("Erro ao fechar período");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reabrirMes = async (mes: number, ano: number) => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("fechamentos_mensais" as any)
        .delete()
        .eq("empresa_id", currentCompany.id)
        .eq("mes", mes)
        .eq("ano", ano);

      if (error) throw error;

      await registrarLog({
        acao: "reabrir",
        modulo: "administrativo",
        entidade: "fechamento_mensal",
        descricao: `Período reaberto: ${String(mes).padStart(2, "0")}/${ano}`,
        dados_anteriores: { mes, ano },
      });

      toast.success(`Período ${String(mes).padStart(2, "0")}/${ano} reaberto com sucesso!`);
      await carregarFechamentos();
    } catch (error) {
      console.error("Erro ao reabrir mês:", error);
      toast.error("Erro ao reabrir período");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mesesFechados,
    isLoading,
    verificarPeriodoFechado,
    fecharMes,
    reabrirMes,
    carregarFechamentos,
  };
};
