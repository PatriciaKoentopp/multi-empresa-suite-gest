
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { Favorecido } from "@/types";

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
