
import { useState, useEffect, useCallback } from "react";
import { OrcamentoFormData, OrcamentoItem, Parcela } from "@/types/orcamento";
import { Servico, Favorecido } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { addDays } from "date-fns";

// Formas de pagamento
export const formasPagamento = [
  { id: "a-vista", label: "À Vista" },
  { id: "parcelado", label: "Parcelado" },
  { id: "entrada-mais-parcelas", label: "Entrada + Parcelas" }
];

export const useOrcamentoForm = (orcamentoId?: string | null, isVisualizacao = false) => {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();

  // Estados para o formulário
  const [data, setData] = useState<Date | undefined>(new Date());
  const [codigoVenda, setCodigoVenda] = useState("");
  const [favorecidoId, setFavorecidoId] = useState("");
  const [codigoProjeto, setCodigoProjeto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [formaPagamento, setFormaPagamento] = useState(formasPagamento[0].id);
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [dataNotaFiscal, setDataNotaFiscal] = useState("");
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState("");
  const [notaFiscalPdf, setNotaFiscalPdf] = useState<File | null>(null);
  const [notaFiscalPdfUrl, setNotaFiscalPdfUrl] = useState("");
  const [servicos, setServicos] = useState<OrcamentoItem[]>([{ servicoId: "", quantidade: 1, valor: 0 }]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  
  // Estados para dados carregados
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calcular o total do orçamento - movido para antes do useEffect
  const total = servicos.reduce((acc, servico) => acc + Number(servico.valor || 0) * Number(servico.quantidade || 1), 0);
  
  // Calcular a soma das parcelas - movido para antes do useEffect
  const somaParcelas = parcelas.reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0);

  // Carregar dados iniciais
  useEffect(() => {
    if (currentCompany?.id) {
      carregarFavorecidos();
      carregarServicos();

      if (orcamentoId) {
        carregarOrcamento(orcamentoId);
      }
    }
  }, [currentCompany, orcamentoId]);

  // Atualizar parcelas quando o número de parcelas muda
  useEffect(() => {
    gerarParcelas();
  }, [numeroParcelas, total]);

  // Funções auxiliares para carregar dados
  async function carregarFavorecidos() {
    try {
      const { data, error } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      
      setFavorecidos(data || []);
      
      if (data && data.length > 0 && !favorecidoId) {
        setFavorecidoId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar favorecidos:', error);
      toast({
        title: "Erro ao carregar favorecidos",
        description: "Ocorreu um erro ao carregar a lista de favorecidos.",
        variant: "destructive",
      });
    }
  }

  async function carregarServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      
      setServicosDisponiveis(data || []);
      
      if (data && data.length > 0 && servicos.length === 1 && !servicos[0].servicoId) {
        setServicos([{ servicoId: data[0].id, quantidade: 1, valor: 0 }]);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Ocorreu um erro ao carregar a lista de serviços.",
        variant: "destructive",
      });
    }
  }

  async function carregarOrcamento(id: string) {
    try {
      setIsLoading(true);
      
      // Carregar dados do orçamento
      const { data: orcamento, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (orcamento) {
        // Atualizar estado com os dados carregados
        setData(orcamento.data ? new Date(orcamento.data) : undefined);
        setCodigoVenda(orcamento.codigo || "");
        setFavorecidoId(orcamento.favorecido_id || "");
        setCodigoProjeto(orcamento.codigo_projeto || "");
        setObservacoes(orcamento.observacoes || "");
        setFormaPagamento(orcamento.forma_pagamento || formasPagamento[0].id);
        setNumeroParcelas(orcamento.numero_parcelas || 1);
        setDataNotaFiscal(orcamento.data_nota_fiscal || "");
        setNumeroNotaFiscal(orcamento.numero_nota_fiscal || "");
        setNotaFiscalPdfUrl(orcamento.nota_fiscal_pdf || "");
        
        // Carregar serviços do orçamento
        const { data: servicosData, error: servicosError } = await supabase
          .from('orcamentos_servicos')
          .select('*')
          .eq('orcamento_id', id);
        
        if (servicosError) throw servicosError;
        
        if (servicosData && servicosData.length > 0) {
          const servicosConvertidos = servicosData.map(servico => ({
            servicoId: servico.servico_id,
            quantidade: servico.quantidade || 1,
            valor: servico.valor || 0
          }));
          
          setServicos(servicosConvertidos);
        }
        
        // Carregar parcelas do orçamento
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('orcamentos_parcelas')
          .select('*')
          .eq('orcamento_id', id)
          .order('numero');
        
        if (parcelasError) throw parcelasError;
        
        if (parcelasData && parcelasData.length > 0) {
          const parcelasConvertidas = parcelasData.map(p => ({
            valor: p.valor || 0,
            dataVencimento: p.data_vencimento || "",
            numeroParcela: `Parcela ${p.numero}/${parcelasData.length}`
          }));
          
          setParcelas(parcelasConvertidas);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      toast({
        title: "Erro ao carregar orçamento",
        description: "Ocorreu um erro ao carregar os dados do orçamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handlers para atualizar serviços
  const handleServicoChange = (idx: number, field: string, value: string | number) => {
    const novosServicos = [...servicos];
    
    // @ts-ignore - Estamos lidando com campos dinâmicos
    novosServicos[idx][field] = value;
    
    setServicos(novosServicos);
  };

  const handleAddServico = () => {
    const novoServico = { 
      servicoId: servicosDisponiveis.length > 0 ? servicosDisponiveis[0].id : "",
      quantidade: 1,
      valor: 0
    };
    setServicos([...servicos, novoServico]);
  };

  const handleRemoveServico = (idx: number) => {
    const novosServicos = servicos.filter((_, index) => index !== idx);
    setServicos(novosServicos);
  };

  // Handlers para atualizar parcelas
  const handleParcelaValorChange = (idx: number, valor: number) => {
    const novasParcelas = [...parcelas];
    novasParcelas[idx].valor = valor;
    setParcelas(novasParcelas);
  };

  const handleParcelaDataChange = (idx: number, data: Date) => {
    const novasParcelas = [...parcelas];
    novasParcelas[idx].dataVencimento = data.toISOString().split('T')[0];
    setParcelas(novasParcelas);
  };

  // Gerar parcelas automaticamente
  const gerarParcelas = useCallback(() => {
    if (numeroParcelas < 1) return;
    
    const hoje = new Date();
    const valorParcela = total / numeroParcelas;
    
    const novasParcelas: Parcela[] = Array.from({ length: numeroParcelas }, (_, i) => {
      const dataVencimento = addDays(hoje, (i + 1) * 30);
      
      return {
        numeroParcela: `Parcela ${i + 1}/${numeroParcelas}`,
        valor: Number(valorParcela.toFixed(2)),
        dataVencimento: dataVencimento.toISOString().split('T')[0],
      };
    });
    
    setParcelas(novasParcelas);
  }, [numeroParcelas, total]);

  // Handler para arquivo PDF da nota fiscal
  const handleNotaFiscalPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setNotaFiscalPdf(file);
      
      // Simular upload - aqui seria a sua função de upload para um serviço de armazenamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      const fileUrl = `https://exemplo.com/uploads/${file.name}`; // URL fictícia
      
      setNotaFiscalPdfUrl(fileUrl);
      toast({ title: "PDF carregado com sucesso!" });
    } catch (error) {
      console.error('Erro ao carregar PDF:', error);
      toast({
        title: "Erro ao carregar PDF",
        description: "Ocorreu um erro ao fazer upload do arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Função para cancelar e voltar
  const handleCancel = () => {
    navigate(-1);
  };

  // Função para salvar o orçamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se já está processando
    if (isLoading || isUploading) return;
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    if (!data || !favorecidoId || servicos.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se todos os serviços têm valores
    const servicoInvalido = servicos.find(servico => 
      !servico.servicoId || 
      !servico.quantidade || 
      !servico.valor
    );
    
    if (servicoInvalido) {
      toast({
        title: "Serviços incompletos",
        description: "Por favor, preencha todos os campos dos serviços.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Preparar dados para persistir
      const dadosOrcamento = {
        empresa_id: currentCompany?.id,
        data: data.toISOString(),
        codigo: codigoVenda,
        favorecido_id: favorecidoId,
        codigo_projeto: codigoProjeto,
        observacoes: observacoes,
        forma_pagamento: formaPagamento,
        numero_parcelas: numeroParcelas,
        valor_total: total,
        status: "ativo",
        tipo: "orcamento",
        data_nota_fiscal: dataNotaFiscal || null,
        numero_nota_fiscal: numeroNotaFiscal || null,
        nota_fiscal_url: notaFiscalPdfUrl || null
      };
      
      let orcamentoId_final = orcamentoId;
      
      // Criar ou atualizar orçamento
      if (orcamentoId) {
        // Atualização
        const { error } = await supabase
          .from('orcamentos')
          .update(dadosOrcamento)
          .eq('id', orcamentoId);
          
        if (error) throw error;
      } else {
        // Criação
        const { data: novoOrcamento, error } = await supabase
          .from('orcamentos')
          .insert(dadosOrcamento)
          .select()
          .single();
          
        if (error) throw error;
        orcamentoId_final = novoOrcamento.id;
      }
      
      if (orcamentoId_final) {
        // Excluir serviços existentes para recriar
        if (orcamentoId) {
          const { error: deleteError } = await supabase
            .from('orcamentos_servicos')
            .delete()
            .eq('orcamento_id', orcamentoId);
            
          if (deleteError) throw deleteError;
          
          const { error: deleteParcelasError } = await supabase
            .from('orcamentos_parcelas')
            .delete()
            .eq('orcamento_id', orcamentoId);
            
          if (deleteParcelasError) throw deleteParcelasError;
        }
        
        // Inserir novos serviços
        const servicosParaInserir = servicos.map(servico => ({
          orcamento_id: orcamentoId_final,
          servico_id: servico.servicoId,
          quantidade: servico.quantidade,
          valor: servico.valor
        }));
        
        const { error: insertServicosError } = await supabase
          .from('orcamentos_servicos')
          .insert(servicosParaInserir);
          
        if (insertServicosError) throw insertServicosError;
        
        // Inserir parcelas
        const parcelasParaInserir = parcelas.map((p, idx) => ({
          orcamento_id: orcamentoId_final,
          numero: idx + 1,
          valor: p.valor,
          data_vencimento: p.dataVencimento
        }));
        
        const { error: insertParcelasError } = await supabase
          .from('orcamentos_parcelas')
          .insert(parcelasParaInserir);
          
        if (insertParcelasError) throw insertParcelasError;
      }
      
      toast({ title: orcamentoId ? "Orçamento atualizado com sucesso!" : "Orçamento criado com sucesso!" });
      navigate("/vendas/orcamento");
      
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: "Erro ao salvar orçamento",
        description: "Ocorreu um erro ao salvar os dados do orçamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Retornar tudo o que o componente precisa
  return {
    // Estado do formulário
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
    notaFiscalPdf,
    notaFiscalPdfUrl,
    
    // Dados carregados
    favorecidos,
    servicosDisponiveis,
    
    // Handlers
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
    isVisualizacao
  };
};
