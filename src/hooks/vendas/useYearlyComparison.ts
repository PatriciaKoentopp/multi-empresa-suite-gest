
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { YearlyComparison } from "@/types";

export const useYearlyComparison = () => {
  const { toast } = useToast();
  const [yearlyComparisonData, setYearlyComparisonData] = useState<YearlyComparison[]>([]);

  const fetchYearlyComparison = async () => {
    try {
      console.log("Iniciando busca de dados de comparação anual");
      const { data: yearComparisonData, error: comparisonError } = await supabase
        .rpc('get_yearly_sales_comparison');

      if (comparisonError) {
        console.error("Erro ao buscar comparação anual:", comparisonError);
        throw comparisonError;
      }
      
      console.log("Dados de comparação anual brutos:", yearComparisonData);
      
      // Garantir que todos os campos numéricos sejam números e não nulos
      const processedYearlyData = Array.isArray(yearComparisonData) ? yearComparisonData.map((item: any) => ({
        year: Number(item.year || 0),
        total: Number(item.total || 0),
        variacao_total: item.variacao_total !== null ? Number(item.variacao_total) : null,
        media_mensal: Number(item.media_mensal || 0),
        variacao_media: item.variacao_media !== null ? Number(item.variacao_media) : null,
        num_meses: Number(item.num_meses || 0)
      })) : [];

      console.log("Dados de comparação anual processados:", processedYearlyData);
      setYearlyComparisonData(processedYearlyData);
      
      return processedYearlyData;
    } catch (error: any) {
      console.error("Erro ao processar dados de comparação anual:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados de comparação anual",
        description: error.message || "Não foi possível processar os dados de comparação anual"
      });
      return [];
    }
  };

  return {
    yearlyComparisonData,
    fetchYearlyComparison,
    setYearlyComparisonData
  };
};
