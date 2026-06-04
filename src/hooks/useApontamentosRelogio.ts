import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import type { RelogioApontamento } from "@/types/relogio";

const pad = (n: number) => String(n).padStart(2, "0");

export const nowTimeString = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const todayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const timeToSeconds = (t: string): number => {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  const [h, m, s = 0] = parts;
  return h * 3600 + m * 60 + s;
};

export const calcularDuracaoDecimal = (
  horaInicio: string,
  horaFim: string
): number => {
  const diff = timeToSeconds(horaFim) - timeToSeconds(horaInicio);
  if (diff <= 0) return 0;
  return Math.round((diff / 3600) * 100) / 100;
};

export const secondsToHHMMSS = (totalSec: number): string => {
  if (totalSec < 0) totalSec = 0;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export interface ApontamentoPayload {
  projeto_id: string;
  tarefa_id: string | null;
  data: string;
  hora_inicio: string;
  hora_fim: string | null;
  duracao_decimal: number;
  origem: "manual" | "cronometro";
  status: "em_andamento" | "concluido";
  observacao?: string | null;
}

export type PeriodoFiltro = "90d" | "12m" | "ano" | "todos";

const dataInicialPorPeriodo = (p: PeriodoFiltro): string | null => {
  const d = new Date();
  switch (p) {
    case "90d":
      d.setDate(d.getDate() - 90);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    case "12m":
      d.setMonth(d.getMonth() - 12);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    case "ano":
      return `${d.getFullYear()}-01-01`;
    case "todos":
    default:
      return null;
  }
};

export function useApontamentosRelogio(periodo: PeriodoFiltro = "90d") {
  const { currentCompany } = useCompany();
  const [apontamentos, setApontamentos] = useState<RelogioApontamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentCompany?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const dataIni = dataInicialPorPeriodo(periodo);

      // Carrega apontamentos do período (paginação 1000 em 1000)
      const pageSize = 1000;
      let from = 0;
      const all: any[] = [];
      while (true) {
        let q = supabase
          .from("relogio_apontamentos" as any)
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .order("data", { ascending: false })
          .order("hora_inicio", { ascending: false })
          .range(from, from + pageSize - 1);
        if (dataIni) q = q.gte("data", dataIni);
        const { data, error } = await q;
        if (error) throw error;
        const rows = (data || []) as any[];
        all.push(...rows);
        if (rows.length < pageSize) break;
        from += pageSize;
      }

      // Garante o registro "em_andamento" mesmo fora do período
      if (dataIni) {
        const { data: emAnd } = await supabase
          .from("relogio_apontamentos" as any)
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .eq("status", "em_andamento")
          .limit(5);
        const extras = ((emAnd || []) as any[]).filter(
          (e) => !all.some((a) => a.id === e.id)
        );
        all.push(...extras);
      }

      setApontamentos(all as unknown as RelogioApontamento[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar apontamentos");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, periodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upsertLocal = (row: RelogioApontamento) => {
    setApontamentos((prev) => {
      const idx = prev.findIndex((p) => p.id === row.id);
      if (idx === -1) {
        // insere na posição correta (mais recente primeiro)
        const next = [row, ...prev];
        next.sort((a, b) => {
          if (a.data !== b.data) return a.data < b.data ? 1 : -1;
          return (a.hora_inicio || "") < (b.hora_inicio || "") ? 1 : -1;
        });
        return next;
      }
      const next = [...prev];
      next[idx] = row;
      return next;
    });
  };

  const criarApontamento = async (payload: ApontamentoPayload) => {
    if (!currentCompany?.id) return null;
    const { data, error } = await supabase
      .from("relogio_apontamentos" as any)
      .insert({ ...payload, empresa_id: currentCompany.id })
      .select()
      .single();
    if (error) throw error;
    const novo = data as unknown as RelogioApontamento;
    upsertLocal(novo);
    toast.success("Apontamento criado!");
    return novo;
  };

  const atualizarApontamento = async (
    id: string,
    payload: Partial<ApontamentoPayload>
  ) => {
    const { data, error } = await supabase
      .from("relogio_apontamentos" as any)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (data) upsertLocal(data as unknown as RelogioApontamento);
    toast.success("Apontamento atualizado!");
  };

  const excluirApontamento = async (id: string) => {
    const { error } = await supabase
      .from("relogio_apontamentos" as any)
      .delete()
      .eq("id", id);
    if (error) throw error;
    setApontamentos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Apontamento excluído!");
  };

  const iniciarCronometro = async (
    projeto_id: string,
    tarefa_id: string | null
  ) => {
    return criarApontamento({
      projeto_id,
      tarefa_id,
      data: todayDateString(),
      hora_inicio: nowTimeString(),
      hora_fim: null,
      duracao_decimal: 0,
      origem: "cronometro",
      status: "em_andamento",
    });
  };

  const pararCronometro = async (apontamento: RelogioApontamento) => {
    const horaFim = nowTimeString();
    const duracao = calcularDuracaoDecimal(apontamento.hora_inicio, horaFim);
    await atualizarApontamento(apontamento.id, {
      hora_fim: horaFim,
      duracao_decimal: duracao,
      status: "concluido",
    });
  };

  const importarApontamentos = async (items: ApontamentoPayload[]) => {
    if (!currentCompany?.id) return { inserted: 0, errors: items.length };
    let inserted = 0;
    let errors = 0;
    const chunkSize = 50;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize).map((p) => ({
        ...p,
        empresa_id: currentCompany.id,
      }));
      const { error, data } = await supabase
        .from("relogio_apontamentos" as any)
        .insert(chunk)
        .select("id");
      if (error) {
        console.error(error);
        errors += chunk.length;
      } else {
        inserted += (data as any[] | null)?.length ?? chunk.length;
      }
    }
    await fetchData();
    return { inserted, errors };
  };

  const apontamentoEmAndamento =
    apontamentos.find((a) => a.status === "em_andamento") || null;

  return {
    apontamentos,
    isLoading,
    refetch: fetchData,
    criarApontamento,
    atualizarApontamento,
    excluirApontamento,
    iniciarCronometro,
    pararCronometro,
    importarApontamentos,
    apontamentoEmAndamento,
  };
}
