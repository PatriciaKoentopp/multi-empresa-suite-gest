import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import type { RelogioProjeto } from "@/types/relogio";

export interface ProjetoPayload {
  codigo: string;
  nome: string;
  favorecido_id: string | null;
  tipo_projeto_id: string | null;
  fotos_tiradas: number;
  fotos_enviadas: number;
  fotos_vendidas: number;
  status: "ativo" | "arquivado";
  data_fotos?: string | null;
  data_previa?: string | null;
  data_selecao?: string | null;
  data_prazo?: string | null;
  data_entrega?: string | null;
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
    setProjetos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Projeto excluído!");
  };

  const contarApontamentos = async (projetoId: string): Promise<number> => {
    const { count, error } = await supabase
      .from("relogio_apontamentos")
      .select("*", { count: "exact", head: true })
      .eq("projeto_id", projetoId);
    if (error) {
      console.error(error);
      return 0;
    }
    return count ?? 0;
  };

  const excluirProjetoComApontamentos = async (id: string) => {
    const { error: errApont } = await supabase
      .from("relogio_apontamentos")
      .delete()
      .eq("projeto_id", id);
    if (errApont) throw errApont;
    const { error } = await supabase.from("relogio_projetos").delete().eq("id", id);
    if (error) throw error;
    setProjetos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Projeto e apontamentos excluídos!");
  };

  // Garante existência do tipo "Fotografia" para a empresa, retornando o id
  const garantirTipoFotografia = async (): Promise<string | null> => {
    if (!currentCompany?.id) return null;
    const { data: existente, error: errSel } = await supabase
      .from("relogio_tipos_projeto")
      .select("id")
      .eq("empresa_id", currentCompany.id)
      .ilike("nome", "fotografia")
      .maybeSingle();
    if (errSel) {
      console.error(errSel);
      return null;
    }
    if (existente?.id) return existente.id;
    const { data: novo, error: errIns } = await supabase
      .from("relogio_tipos_projeto")
      .insert({ empresa_id: currentCompany.id, nome: "Fotografia", status: "ativo" })
      .select("id")
      .single();
    if (errIns) {
      console.error(errIns);
      return null;
    }
    return novo.id;
  };

  const importarProjetos = async (
    items: Array<Omit<ProjetoPayload, "tipo_projeto_id">>
  ): Promise<{ inserted: number; errors: number }> => {
    if (!currentCompany?.id) return { inserted: 0, errors: 0 };
    if (items.length === 0) return { inserted: 0, errors: 0 };

    const tipoFotografiaId = await garantirTipoFotografia();

    let inserted = 0;
    let errors = 0;
    // Insere um a um para que duplicatas (codigo+nome) não cancelem o lote inteiro
    for (const item of items) {
      const { error } = await supabase
        .from("relogio_projetos")
        .insert({
          ...item,
          tipo_projeto_id: tipoFotografiaId,
          empresa_id: currentCompany.id,
        });
      if (error) {
        console.error("Erro ao importar projeto:", item.codigo, item.nome, error);
        errors += 1;
      } else {
        inserted += 1;
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
    contarApontamentos,
    excluirProjetoComApontamentos,
    importarProjetos,
  };
}
