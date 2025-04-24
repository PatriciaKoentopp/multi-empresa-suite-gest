
import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TipoTitulo } from "@/types/tipos-titulos";

interface Favorecido {
  id: string;
  nome: string;
}

interface Categoria {
  id: string;
  nome: string;
}

interface ContaCorrente {
  id: string;
  nome: string;
}

export function useMovimentacaoDados() {
  const { currentCompany } = useCompany();
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contasCorrente, setContasCorrente] = useState<ContaCorrente[]>([]);
  const [tiposTitulos, setTiposTitulos] = useState<TipoTitulo[]>([]);

  useEffect(() => {
    carregarDados();
  }, [currentCompany?.id]);

  async function carregarDados() {
    if (!currentCompany?.id) return;
    
    try {
      const { data: favorecidosData, error: errorFavorecidos } = await supabase
        .from("favorecidos")
        .select("id, nome")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo");
        
      if (errorFavorecidos) throw errorFavorecidos;
      
      const { data: categoriasData, error: errorCategorias } = await supabase
        .from("plano_contas")
        .select("id, descricao")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo");
        
      if (errorCategorias) throw errorCategorias;
      
      const { data: contasData, error: errorContas } = await supabase
        .from("contas_correntes")
        .select("id, nome")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo");
        
      if (errorContas) throw errorContas;
      
      const { data: tiposTitulosData, error: errorTipos } = await supabase
        .from("tipos_titulos")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo");
        
      if (errorTipos) throw errorTipos;
      
      setFavorecidos(favorecidosData || []);
      setCategorias(categoriasData?.map(cat => ({ id: cat.id, nome: cat.descricao })) || []);
      setContasCorrente(contasData || []);
      setTiposTitulos(tiposTitulosData || []);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    }
  }

  return {
    favorecidos,
    categorias,
    contasCorrente,
    tiposTitulos
  };
}
