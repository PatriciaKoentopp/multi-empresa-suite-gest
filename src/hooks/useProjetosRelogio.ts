import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import type { RelogioProjeto } from "@/types/relogio";

export interface ProjetoPayload {
  codigo: string;
  nome: string;
  favorecido_id: string;
  fotos_tiradas: number;
  fotos_enviadas: number;
  fotos_vendidas: number;
  status: "ativo" | "arquivado";
}

export function useProjetosRelogio() {
  const { currentCompany } = useCompany();
  const [projetos, setProjetos] = useState<RelogioProjeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentCompany?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("relogio_projetos")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("codigo", { ascending: true });
      if (error) throw error;
      setProjetos((data || []) as RelogioProjeto[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar projetos");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const criarProjeto = async (payload: ProjetoPayload) => {
    if (!currentCompany?.id) return;
    const { error } = await supabase
      .from("relogio_projetos")
      .insert({ ...payload, empresa_id: currentCompany.id });
    if (error) throw error;
    toast.success("Projeto criado com sucesso!");
    await fetchData();
  };

  const atualizarProjeto = async (id: string, payload: ProjetoPayload) => {
    const { error } = await supabase
      .from("relogio_projetos")
      .update(payload)
      .eq("id", id);
    if (error) throw error;
    toast.success("Projeto atualizado!");
    await fetchData();
  };

  const excluirProjeto = async (id: string) => {
    const { error } = await supabase.from("relogio_projetos").delete().eq("id", id);
    if (error) throw error;
    toast.success("Projeto excluído!");
    await fetchData();
  };

  const importarProjetos = async (
    items: Array<ProjetoPayload>
  ): Promise<{ inserted: number; errors: number }> => {
    if (!currentCompany?.id) return { inserted: 0, errors: 0 };
    if (items.length === 0) return { inserted: 0, errors: 0 };

    let inserted = 0;
    let errors = 0;
    // batch de 100
    for (let i = 0; i < items.length; i += 100) {
      const batch = items.slice(i, i + 100).map((p) => ({
        ...p,
        empresa_id: currentCompany.id,
      }));
      const { error, count } = await supabase
        .from("relogio_projetos")
        .insert(batch, { count: "exact" });
      if (error) {
        console.error("Erro ao importar lote:", error);
        errors += batch.length;
      } else {
        inserted += count ?? batch.length;
      }
    }
    await fetchData();
    return { inserted, errors };
  };

  return {
    projetos,
    isLoading,
    refetch: fetchData,
    criarProjeto,
    atualizarProjeto,
    excluirProjeto,
    importarProjetos,
  };
}
