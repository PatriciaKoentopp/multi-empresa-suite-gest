
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

// Exportar formasPagamento que a página espera
export const formasPagamento = [
  { id: 'boleto', label: 'Boleto' },
  { id: 'cartao', label: 'Cartão' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'transferencia', label: 'Transferência' }
];

export const useOrcamentoForm = (orcamentoId?: string | null, isVisualizacao?: boolean) => {
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

  // Estados individuais que a página espera
  const [data, setData] = useState<Date | undefined>(new Date());
  const [codigoVenda, setCodigoVenda] = useState('');
  const [favorecidoId, setFavorecidoId] = useState('');
  const [codigoProjeto, setCodigoProjeto] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('boleto');
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [dataNotaFiscal, setDataNotaFiscal] = useState('');
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState('');
  const [notaFiscalPdfUrl, setNotaFiscalPdfUrl] = useState('');
  const [servicos, setServicos] = useState<{ servicoId: string; valor: number }[]>([{ servicoId: '', valor: 0 }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
  };

  // Handlers que a página espera
  const handleServicoChange = (idx: number, field: "servicoId" | "valor", value: string | number) => {
    setServicos(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleAddServico = () => {
    setServicos(prev => [...prev, { servicoId: '', valor: 0 }]);
  };

  const handleRemoveServico = (idx: number) => {
    setServicos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleParcelaDataChange = (index: number, data: Date) => {
    // Implementação para mudança de data das parcelas
    console.log('Parcela data change:', index, data);
  };

  const handleParcelaValorChange = (index: number, valor: number) => {
    // Implementação para mudança de valor das parcelas
    console.log('Parcela valor change:', index, valor);
  };

  const handleNotaFiscalPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implementação para upload de nota fiscal
    console.log('Nota fiscal PDF change:', e.target.files?.[0]);
  };

  const handleCancel = () => {
    // Implementação para cancelar
    window.history.back();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Implementação para salvar
    console.log('Form submit');
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Valores calculados que a página espera
  const total = servicos.reduce((acc, s) => acc + (Number(s.valor) || 0), 0);
  const parcelas = Array.from({ length: numeroParcelas }, (_, i) => ({
    numeroParcela: `${i + 1}/${numeroParcelas}`,
    valor: total / numeroParcelas,
    dataVencimento: new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
  }));
  const somaParcelas = parcelas.reduce((acc, p) => acc + p.valor, 0);

  return {
    // Estado original do hook (mantido para compatibilidade)
    formState,
    handleChange,
    handleAddItem,
    handleRemoveItem,
    handleUpdateItem,
    handleAddParcela,
    handleRemoveParcela,
    handleUpdateParcela,
    setAllForm,
    favorecidos: (favorecidosData as Favorecido[]) || [],
    isLoadingFavorecidos,
    isLoadingServicos,

    // Propriedades individuais que a página espera
    data,
    setData,
    codigoVenda,
    setCodigoVenda,
    favorecidoId,
    setFavorecidoId,
    codigoProjeto,
    setCodigoProjeto,
    observacoes,
    setObservacoes,
    formaPagamento,
    setFormaPagamento,
    numeroParcelas,
    setNumeroParcelas,
    servicos,
    dataNotaFiscal,
    setDataNotaFiscal,
    numeroNotaFiscal,
    setNumeroNotaFiscal,
    notaFiscalPdfUrl,

    // Dados carregados com fallback para evitar undefined
    servicosDisponiveis: (servicosData as Servico[]) || [],

    // Handlers que a página espera
    handleServicoChange,
    handleAddServico,
    handleRemoveServico,
    handleParcelaDataChange,
    handleParcelaValorChange,
    handleNotaFiscalPdfChange,
    handleCancel,
    handleSubmit,

    // Valores calculados
    total,
    parcelas,
    somaParcelas,

    // Estado de UI
    isLoading,
    isUploading,
    isVisualizacao: isVisualizacao || false
  };
};
