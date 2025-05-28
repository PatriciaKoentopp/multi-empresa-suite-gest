
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

export interface Favorecido {
  id: string;
  nome: string;
  documento: string;
  tipo: string;
  email?: string;
  telefone?: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export function useFavorecidos() {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ["favorecidos", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from("favorecidos")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo")
        .order("nome");
      
      if (error) throw error;
      
      return (data || []).filter(item => item.id && item.nome) as Favorecido[];
    },
    enabled: !!currentCompany?.id,
  });
}
