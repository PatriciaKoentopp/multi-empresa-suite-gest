
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { Favorecido } from "@/types/index";

export const useFavorecidos = () => {
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(true);
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);

  const fetchFavorecidos = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      const favorecidosFormatados: Favorecido[] = (data || []).map(favorecido => ({
        id: favorecido.id,
        empresa_id: favorecido.empresa_id,
        tipo: favorecido.tipo as "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor",
        tipo_documento: favorecido.tipo_documento as "cpf" | "cnpj",
        documento: favorecido.documento,
        grupo_id: favorecido.grupo_id,
        profissao_id: favorecido.profissao_id,
        nome: favorecido.nome,
        nome_fantasia: favorecido.nome_fantasia,
        email: favorecido.email,
        telefone: favorecido.telefone,
        cep: favorecido.cep,
        logradouro: favorecido.logradouro,
        numero: favorecido.numero,
        complemento: favorecido.complemento,
        bairro: favorecido.bairro,
        cidade: favorecido.cidade,
        estado: favorecido.estado,
        pais: favorecido.pais,
        data_aniversario: favorecido.data_aniversario,
        status: favorecido.status as "ativo" | "inativo",
        created_at: favorecido.created_at,
        updated_at: favorecido.updated_at
      }));

      setFavorecidos(favorecidosFormatados);
    } catch (error) {
      console.error('Erro ao buscar favorecidos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar favorecidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const criarFavorecido = async (data: Omit<Favorecido, 'id' | 'created_at' | 'updated_at'>) => {
    if (!currentCompany?.id) {
      toast({
        title: "Erro",
        description: "Nenhuma empresa selecionada",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('favorecidos')
        .insert({
          ...data,
          empresa_id: currentCompany.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Favorecido criado com sucesso",
      });

      await fetchFavorecidos();
    } catch (error) {
      console.error('Erro ao criar favorecido:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar favorecido",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      fetchFavorecidos();
    }
  }, [currentCompany?.id]);

  return {
    favorecidos,
    isLoading,
    fetchFavorecidos,
    criarFavorecido
  };
};
