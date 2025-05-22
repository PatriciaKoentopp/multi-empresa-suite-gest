
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { Favorecido } from "@/types";

export function useFavorecidos() {
  const { currentCompany } = useCompany();
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function carregarFavorecidos() {
      if (!currentCompany?.id) return;
      
      setIsLoading(true);
      try {
        // Buscar favorecidos ativos
        const { data, error } = await supabase
          .from("favorecidos")
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .eq("status", "ativo")
          .order("nome");
        
        if (error) throw error;
        
        // Filtrar para garantir que não há itens sem id ou nome
        const favorecidosFiltrados = (data || [])
          .filter(item => item.id && item.nome)
          .sort((a, b) => a.nome.localeCompare(b.nome));
        
        setFavorecidos(favorecidosFiltrados);
      } catch (error) {
        console.error("Erro ao carregar favorecidos:", error);
        toast.error("Erro ao carregar favorecidos");
      } finally {
        setIsLoading(false);
      }
    }
    
    carregarFavorecidos();
  }, [currentCompany?.id]);
  
  return {
    favorecidos,
    isLoading
  };
}
