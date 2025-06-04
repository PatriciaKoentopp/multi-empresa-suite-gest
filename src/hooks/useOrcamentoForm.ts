import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/company-context';
import { Favorecido, Servico } from '@/types';

interface OrcamentoFormState {
  codigo: string;
  favorecido_id: string | null;
  data: string;
  tipo: 'orcamento' | 'venda';
  status: 'ativo' | 'inativo';
  forma_pagamento: string;
  numero_parcelas: number;
  observacoes: string;
  itens: { servico_id: string; quantidade: number; valor: number }[];
  parcelas: { numero_parcela: string; valor: number; data_vencimento: string }[];
}

export const useOrcamentoForm = () => {
  const { currentCompany } = useCompany();
  const [formState, setFormState] = useState<OrcamentoFormState>({
    codigo: '',
    favorecido_id: null,
    data: new Date().toISOString().split('T')[0],
    tipo: 'orcamento',
    status: 'ativo',
    forma_pagamento: 'boleto',
    numero_parcelas: 1,
    observacoes: '',
    itens: [],
    parcelas: [],
  });

  // Buscar favorecidos
  const { data: favorecidosData, isLoading: isLoadingFavorecidos } = useQuery({
    queryKey: ['favorecidos', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  // Buscar serviços
  const { data: servicosData, isLoading: isLoadingServicos } = useQuery({
    queryKey: ['servicos', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddItem = (item: { servico_id: string; quantidade: number; valor: number }) => {
    setFormState(prevState => ({
      ...prevState,
      itens: [...prevState.itens, item],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormState(prevState => ({
      ...prevState,
      itens: prevState.itens.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItem = (index: number, item: { servico_id: string; quantidade: number; valor: number }) => {
    setFormState(prevState => ({
      ...prevState,
      itens: prevState.itens.map((existingItem, i) => (i === index ? item : existingItem)),
    }));
  };

  const handleAddParcela = (parcela: { numero_parcela: string; valor: number; data_vencimento: string }) => {
    setFormState(prevState => ({
      ...prevState,
      parcelas: [...prevState.parcelas, parcela],
    }));
  };

  const handleRemoveParcela = (index: number) => {
    setFormState(prevState => ({
      ...prevState,
      parcelas: prevState.parcelas.filter((_, i) => i !== index),
    }));
  };

   const handleUpdateParcela = (index: number, parcela: { numero_parcela: string; valor: number; data_vencimento: string }) => {
    setFormState(prevState => ({
      ...prevState,
      parcelas: prevState.parcelas.map((existingParcela, i) => (i === index ? parcela : existingParcela)),
    }));
  };

  const setAllForm = (newState: OrcamentoFormState) => {
    setFormState(newState);
  }

  return {
    formState,
    handleChange,
    handleAddItem,
    handleRemoveItem,
    handleUpdateItem,
    handleAddParcela,
    handleRemoveParcela,
    handleUpdateParcela,
    setAllForm,
    favorecidos: favorecidosData as Favorecido[],
    servicos: servicosData as Servico[],
    isLoadingFavorecidos,
    isLoadingServicos
  };
};
