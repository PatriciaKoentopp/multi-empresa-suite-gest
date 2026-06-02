import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";

export interface ProjetoFotosDB {
  numeroProjeto: string;
  cliente: string;
  fotosVendidas: number;
  fotosEnviadas: number;
  fotosTiradas: number;
  totalHoras: number;
}

const normalizarCodigo = (codigo: string): string => {
  const trimmed = String(codigo ?? "").trim();
  return trimmed.replace(/^0+/, "") || trimmed;
};

export function useRelatorioProjetosFotosDB() {
  const { currentCompany } = useCompany();
  const [projetos, setProjetos] = useState<any[]>([]);
  const [apontamentos, setApontamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentCompany?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [projRes, apRes] = await Promise.all([
        supabase
          .from("relogio_projetos")
          .select("id, codigo, nome, fotos_tiradas, fotos_enviadas, fotos_vendidas, status")
          .eq("empresa_id", currentCompany.id),
        supabase
          .from("relogio_apontamentos" as any)
          .select("projeto_id, duracao_decimal")
          .eq("empresa_id", currentCompany.id),
      ]);
      if (projRes.error) throw projRes.error;
      if (apRes.error) throw apRes.error;
      setProjetos(projRes.data || []);
      setApontamentos((apRes.data || []) as any[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados de projetos");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projetosFotos: ProjetoFotosDB[] = useMemo(() => {
    const horasPorProjeto = new Map<string, number>();
    apontamentos.forEach((a) => {
      const id = a.projeto_id;
      if (!id) return;
      horasPorProjeto.set(
        id,
        (horasPorProjeto.get(id) || 0) + (Number(a.duracao_decimal) || 0)
      );
    });

    return projetos
      .map((p) => {
        const totalHoras = horasPorProjeto.get(p.id) || 0;
        return {
          numeroProjeto: normalizarCodigo(p.codigo),
          cliente: p.nome || "",
          fotosVendidas: Number(p.fotos_vendidas) || 0,
          fotosEnviadas: Number(p.fotos_enviadas) || 0,
          fotosTiradas: Number(p.fotos_tiradas) || 0,
          totalHoras,
        };
      })
      .filter(
        (p) =>
          p.cliente.trim() !== "" &&
          (p.fotosVendidas > 0 ||
            p.fotosEnviadas > 0 ||
            p.fotosTiradas > 0 ||
            p.totalHoras > 0)
      );
  }, [projetos, apontamentos]);

  return { projetosFotos, isLoading, refetch: fetchData };
}
