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

export function useApontamentosRelogio() {
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
      const { data, error } = await supabase
        .from("relogio_apontamentos" as any)
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("data", { ascending: false })
        .order("hora_inicio", { ascending: false });
      if (error) throw error;
      setApontamentos((data || []) as unknown as RelogioApontamento[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar apontamentos");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const criarApontamento = async (payload: ApontamentoPayload) => {
    if (!currentCompany?.id) return null;
    const { data, error } = await supabase
      .from("relogio_apontamentos" as any)
      .insert({ ...payload, empresa_id: currentCompany.id })
      .select()
      .single();
    if (error) throw error;
    toast.success("Apontamento criado!");
    await fetchData();
    return data as unknown as RelogioApontamento;
  };

  const atualizarApontamento = async (
    id: string,
    payload: Partial<ApontamentoPayload>
  ) => {
    const { error } = await supabase
      .from("relogio_apontamentos" as any)
      .update(payload)
      .eq("id", id);
    if (error) throw error;
    toast.success("Apontamento atualizado!");
    await fetchData();
  };

  const excluirApontamento = async (id: string) => {
    const { error } = await supabase
      .from("relogio_apontamentos" as any)
      .delete()
      .eq("id", id);
    if (error) throw error;
    toast.success("Apontamento excluído!");
    await fetchData();
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
