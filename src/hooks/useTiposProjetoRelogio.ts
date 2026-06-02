import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import type { RelogioTipoProjeto, RelogioTarefa } from "@/types/relogio";

export function useTiposProjetoRelogio() {
  const { currentCompany } = useCompany();
  const [tiposProjeto, setTiposProjeto] = useState<RelogioTipoProjeto[]>([]);
  const [tarefas, setTarefas] = useState<RelogioTarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentCompany?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: tipos, error: errTipos } = await supabase
        .from("relogio_tipos_projeto")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("nome", { ascending: true });
      if (errTipos) throw errTipos;

      const tiposList = (tipos || []) as RelogioTipoProjeto[];
      setTiposProjeto(tiposList);

      const ids = tiposList.map((t) => t.id);
      if (ids.length === 0) {
        setTarefas([]);
      } else {
        // batch em lotes de 50
        const batches: string[][] = [];
        for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));
        const all: RelogioTarefa[] = [];
        for (const batch of batches) {
          const { data, error } = await supabase
            .from("relogio_tarefas")
            .select("*")
            .in("tipo_projeto_id", batch)
            .order("nome", { ascending: true });
          if (error) throw error;
          all.push(...((data || []) as RelogioTarefa[]));
        }
        setTarefas(all);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar tipos de projeto");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tipos de Projeto
  const criarTipoProjeto = async (payload: { nome: string; status: "ativo" | "inativo" }) => {
    if (!currentCompany?.id) return;
    const { error } = await supabase
      .from("relogio_tipos_projeto")
      .insert({ ...payload, empresa_id: currentCompany.id });
    if (error) throw error;
    toast.success("Tipo de projeto criado com sucesso!");
    await fetchData();
  };

  const atualizarTipoProjeto = async (
    id: string,
    payload: { nome: string; status: "ativo" | "inativo" }
  ) => {
    const { error } = await supabase
      .from("relogio_tipos_projeto")
      .update(payload)
      .eq("id", id);
    if (error) throw error;
    toast.success("Tipo de projeto atualizado!");
    await fetchData();
  };

  const excluirTipoProjeto = async (id: string) => {
    const { error } = await supabase.from("relogio_tipos_projeto").delete().eq("id", id);
    if (error) throw error;
    toast.success("Tipo de projeto excluído!");
    await fetchData();
  };

  // Tarefas
  const criarTarefa = async (payload: {
    tipo_projeto_id: string;
    nome: string;
    status: "ativo" | "inativo";
    percentual_tempo_estimado: number;
  }) => {
    const { error } = await supabase.from("relogio_tarefas").insert(payload);
    if (error) throw error;
    toast.success("Tarefa criada com sucesso!");
    await fetchData();
  };

  const atualizarTarefa = async (
    id: string,
    payload: { nome: string; status: "ativo" | "inativo"; percentual_tempo_estimado: number }
  ) => {
    const { error } = await supabase.from("relogio_tarefas").update(payload).eq("id", id);
    if (error) throw error;
    toast.success("Tarefa atualizada!");
    await fetchData();
  };

  const excluirTarefa = async (id: string) => {
    const { error } = await supabase.from("relogio_tarefas").delete().eq("id", id);
    if (error) throw error;
    toast.success("Tarefa excluída!");
    await fetchData();
  };

  return {
    tiposProjeto,
    tarefas,
    isLoading,
    refetch: fetchData,
    criarTipoProjeto,
    atualizarTipoProjeto,
    excluirTipoProjeto,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa,
  };
}
