import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import type { HoraTrabalhadaData } from "./useSpreadsheetData";

const formatDataBR = (data: string): string => {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
};

const fetchInBatches = async <T,>(
  ids: string[],
  fetcher: (batch: string[]) => Promise<T[]>
): Promise<T[]> => {
  const BATCH = 50;
  const all: T[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const rows = await fetcher(ids.slice(i, i + BATCH));
    all.push(...rows);
  }
  return all;
};

export function useRelatorioTempoDB() {
  const { currentCompany } = useCompany();
  const [horasData, setHorasData] = useState<HoraTrabalhadaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentCompany?.id) {
      setHorasData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // 1) Apontamentos concluídos (paginado)
      const pageSize = 1000;
      let from = 0;
      const apontamentos: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("relogio_apontamentos" as any)
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .eq("status", "concluido")
          .order("data", { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const rows = (data || []) as any[];
        apontamentos.push(...rows);
        if (rows.length < pageSize) break;
        from += pageSize;
      }

      // 2) Projetos
      const { data: projetos, error: errProjetos } = await supabase
        .from("relogio_projetos" as any)
        .select("id, codigo, nome, favorecido_id")
        .eq("empresa_id", currentCompany.id);
      if (errProjetos) throw errProjetos;
      const projetoMap = new Map<string, any>(
        ((projetos || []) as any[]).map((p) => [p.id, p])
      );

      // 3) Tarefas
      const { data: tarefas, error: errTarefas } = await supabase
        .from("relogio_tarefas" as any)
        .select("id, nome");
      if (errTarefas) throw errTarefas;
      const tarefaMap = new Map<string, string>(
        ((tarefas || []) as any[]).map((t) => [t.id, t.nome])
      );

      // 4) Favorecidos (em batches de 50)
      const favorecidoIds = Array.from(
        new Set(
          ((projetos || []) as any[])
            .map((p) => p.favorecido_id)
            .filter((id): id is string => !!id)
        )
      );
      const favorecidos = await fetchInBatches(favorecidoIds, async (batch) => {
        const { data, error } = await supabase
          .from("favorecidos")
          .select("id, nome")
          .in("id", batch);
        if (error) throw error;
        return (data || []) as any[];
      });
      const favorecidoMap = new Map<string, string>(
        favorecidos.map((f) => [f.id, f.nome])
      );

      // 5) Montar HoraTrabalhadaData
      const result: HoraTrabalhadaData[] = apontamentos.map((a) => {
        const projeto = projetoMap.get(a.projeto_id);
        const codigo = projeto?.codigo ?? "";
        const nomeProj = projeto?.nome ?? "";
        const projetoStr = codigo || nomeProj
          ? `${codigo}${codigo && nomeProj ? " - " : ""}${nomeProj}`
          : "";
        const cliente = projeto?.favorecido_id
          ? favorecidoMap.get(projeto.favorecido_id) ?? ""
          : "";
        const tarefa = a.tarefa_id
          ? tarefaMap.get(a.tarefa_id) ?? "Sem tarefa"
          : "Sem tarefa";

        return {
          projeto: projetoStr,
          cliente,
          descricao: a.observacao ?? "",
          tarefa,
          usuario: "—",
          grupo: "",
          email: "",
          etiqueta: "",
          faturavel: true,
          data_inicio: formatDataBR(a.data),
          hora_inicio: a.hora_inicio ?? "",
          data_final: formatDataBR(a.data),
          hora_termino: a.hora_fim ?? "",
          duracao_horas: "",
          duracao_decimal: Number(a.duracao_decimal) || 0,
          valor_faturavel: 0,
        };
      });

      setHorasData(result);
    } catch (err: any) {
      console.error("Erro ao carregar relatório de tempo:", err);
      toast.error("Erro ao carregar dados do relatório de tempo");
      setHorasData([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { horasData, isLoading, refetch: fetchData };
}
