
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { Produto } from "@/types/produtos";
import { Servico } from "@/types";

type Item = {
  id: string;
  nome: string;
  tipo: "produto" | "servico";
};

export function useProdutosServicos() {
  const { currentCompany } = useCompany();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function carregarItens() {
      if (!currentCompany?.id) return;
      
      setIsLoading(true);
      try {
        // Buscar produtos ativos
        const { data: produtos, error: errorProdutos } = await supabase
          .from("produtos")
          .select("id, nome")
          .eq("empresa_id", currentCompany.id)
          .eq("status", "ativo");
        
        if (errorProdutos) throw errorProdutos;
        
        // Buscar serviços ativos
        const { data: servicos, error: errorServicos } = await supabase
          .from("servicos")
          .select("id, nome")
          .eq("empresa_id", currentCompany.id)
          .eq("status", "ativo");
        
        if (errorServicos) throw errorServicos;
        
        // Combinar produtos e serviços em uma única lista
        const produtosFormatados = produtos?.map((p: Produto) => ({
          id: p.id,
          nome: p.nome,
          tipo: "produto" as const
        })) || [];
        
        const servicosFormatados = servicos?.map((s: Servico) => ({
          id: s.id,
          nome: s.nome,
          tipo: "servico" as const
        })) || [];
        
        // Ordenar por nome
        const todosItens = [...produtosFormatados, ...servicosFormatados]
          .filter(item => item.id && item.nome) // Garantir que não há itens sem id ou nome
          .sort((a, b) => a.nome.localeCompare(b.nome));
        
        setItems(todosItens);
      } catch (error) {
        console.error("Erro ao carregar produtos e serviços:", error);
        toast.error("Erro ao carregar produtos e serviços");
      } finally {
        setIsLoading(false);
      }
    }
    
    carregarItens();
  }, [currentCompany?.id]);
  
  return {
    items,
    isLoading
  };
}
