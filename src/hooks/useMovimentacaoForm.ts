import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Favorecido } from "@/types";
import { useCompany } from "@/contexts/company-context";

export const useMovimentacaoForm = (tipo: "pagar" | "receber" | "transferencia") => {
  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    reset,
    formState: { errors },
    control,
  } = useForm();
  const { toast } = useToast();
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [anomesRef, setAnomesRef] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentCompany } = useCompany();

  useEffect(() => {
    const fetchFavorecidos = async () => {
      try {
        setIsLoading(true);
        if (!currentCompany?.id) return;

        const { data, error } = await supabase
          .from("favorecidos")
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .order("nome");

        if (error) {
          console.error("Erro ao buscar favorecidos:", error);
          toast({
            variant: "destructive",
            title: "Erro ao buscar favorecidos",
            description:
              error.message || "Não foi possível buscar os favorecidos.",
          });
        }

        if (data) {
          setFavorecidos(data);
        }
      } catch (error) {
        console.error("Erro ao buscar favorecidos:", error);
        toast({
          variant: "destructive",
          title: "Erro ao buscar favorecidos",
          description:
            "Ocorreu um erro inesperado ao buscar os favorecidos.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorecidos();
  }, [currentCompany?.id, toast]);

  const onSubmit = async (data: any) => {
    console.log("Dados do formulário:", data);
  };

  const handleGetPgClient = async () => {
    try {
      setAnomesRef(new Date());
    } catch (error) {
      console.error("Erro ao buscar cliente PG:", error);
    }
  };

  return {
    handleSubmit: handleSubmit(onSubmit),
    register,
    setValue,
    getValues,
    reset,
    errors,
    control,
    favorecidos,
    anomesRef,
    handleGetPgClient,
    isLoading,
  };
};
