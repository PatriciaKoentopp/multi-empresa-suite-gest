import { useState, useEffect } from "react";
import { format, addMonths } from 'date-fns';
import { toast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/company-context";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Favorecido, Servico, TabelaPreco, TabelaPrecoItem } from "@/types";
import { OrcamentoItem, Parcela } from "@/types/orcamento";
import { parseDateString, formatDate } from "@/lib/utils";

export function useOrcamentoForm(orcamentoId?: string, isVisualizacao: boolean = false) {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  
  const [data, setData] = useState<Date | undefined>(new Date());
  const [codigoVenda, setCodigoVenda] = useState("");
  const [favorecidoId, setFavorecidoId] = useState<string>("");
  const [codigoProjeto, setCodigoProjeto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>("avista");
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [servicos, setServicos] = useState<OrcamentoItem[]>([
    { servicoId: "", valor: 0 }
  ]);
  const [dataNotaFiscal, setDataNotaFiscal] = useState("");
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState("");
  const [notaFiscalPdf, setNotaFiscalPdf] = useState<File | null>(null);
  const [notaFiscalPdfUrl, setNotaFiscalPdfUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parcelasCarregadas, setParcelasCarregadas] = useState(false);

  // Estados para dados do banco
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
  const [tabelasPreco, setTabelasPreco] = useState<TabelaPreco[]>([]);
  const [precosServicos, setPrecosServicos] = useState<TabelaPrecoItem[]>([]);
  
  // Cálculo do total do orçamento
  const total = servicos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Inicializar parcelas
  const [parcelas, setParcelas] = useState<Parcela[]>(() => getParcelas(0, numeroParcelas, codigoVenda));

  function getParcelas(valorTotal: number, numParcelas: number, codigo: string, datasPrimeiroVencimento?: string) {
    if (numParcelas <= 1) {
      return [{
        valor: valorTotal,
        dataVencimento: datasPrimeiroVencimento || format(new Date(), 'yyyy-MM-dd'),
        numeroParcela: `${codigo}/1`
      }];
    }
    
    const valorParcela = Math.floor((valorTotal / numParcelas) * 100) / 100;
    const parcelas: Parcela[] = [];
    let soma = 0;
    
    for (let i = 0; i < numParcelas; i++) {
      let valor = valorParcela;
      if (i === numParcelas - 1) {
        valor = Math.round((valorTotal - soma) * 100) / 100;
      } else {
        soma += valor;
      }
      
      // Mantemos o formato yyyy-MM-dd para armazenamento, sem conversão de timezone
      const dataVencimento = format(
        addMonths(new Date(), i),
        'yyyy-MM-dd'
      );
      
      parcelas.push({
        valor,
        dataVencimento: dataVencimento,
        numeroParcela: `${codigo}/${i + 1}`,
      });
    }
    return parcelas;
  }

  // Buscar dados iniciais
  useEffect(() => {
    if (currentCompany?.id) {
      carregarFavorecidos();
      carregarServicos();
      carregarTabelasPreco();
      
      // Se temos um ID de orçamento, vamos carregar os dados
      if (orcamentoId) {
        carregarOrcamento(orcamentoId);
      }
    }
  }, [currentCompany?.id, orcamentoId]);

  // Efeito para atualizar as parcelas quando o valor total ou número de parcelas mudar
  useEffect(() => {
    // Só deve recalcular automaticamente as parcelas quando o número de parcelas mudar
    // ou quando for uma nova inicialização, não a cada edição de valor
    if (!parcelasCarregadas) {
      const dataPrimeiroParcela = parcelas.length > 0 ? parcelas[0].dataVencimento : "";
      const novasParcelas = getParcelas(total, numeroParcelas, codigoVenda, dataPrimeiroParcela);
      setParcelas(novasParcelas);
    }
  }, [numeroParcelas, codigoVenda]);

  // Carregar orçamento específico
  async function carregarOrcamento(id: string) {
    setIsLoading(true);
    try {
      // Buscar dados do orçamento
      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (orcamentoError) throw orcamentoError;
      if (!orcamento) throw new Error('Orçamento não encontrado');
      
      console.log('Dados do orçamento carregados:', orcamento);
      
      // Buscar itens do orçamento
      const { data: itens, error: itensError } = await supabase
        .from('orcamentos_itens')
        .select('*')
        .eq('orcamento_id', id);
        
      if (itensError) throw itensError;
      
      // Buscar parcelas do orçamento
      const { data: parcelas, error: parcelasError } = await supabase
        .from('orcamentos_parcelas')
        .select('*')
        .eq('orcamento_id', id);
        
      if (parcelasError) throw parcelasError;
      console.log('Parcelas carregadas do banco:', parcelas);
      
      // Preencher o formulário com os dados
      // Preservamos a data como objeto Date
      setData(orcamento.data ? parseDateString(orcamento.data) : new Date());
      setCodigoVenda(orcamento.codigo);
      setFavorecidoId(orcamento.favorecido_id);
      setCodigoProjeto(orcamento.codigo_projeto || "");
      setObservacoes(orcamento.observacoes || "");
      setFormaPagamento(orcamento.forma_pagamento);
      setNumeroParcelas(orcamento.numero_parcelas);
      
      // Para a data da nota fiscal, mantemos o formato ISO sem conversão
      if (orcamento.data_nota_fiscal) {
        setDataNotaFiscal(orcamento.data_nota_fiscal);
        console.log('Data nota fiscal do banco:', orcamento.data_nota_fiscal);
      }
      
      setNumeroNotaFiscal(orcamento.numero_nota_fiscal || "");
      setNotaFiscalPdfUrl(orcamento.nota_fiscal_pdf || "");
      
      // Configurar serviços
      if (itens && itens.length > 0) {
        const servicosCarregados = itens.map(item => ({
          servicoId: item.servico_id,
          valor: item.valor
        }));
        setServicos(servicosCarregados);
      }
      
      // Configurar parcelas - mantemos as datas exatamente como estão no banco
      if (parcelas && parcelas.length > 0) {
        const novasParcelas = parcelas.map(p => ({
          valor: p.valor,
          // Não convertemos para Date aqui, mantemos a string
          dataVencimento: p.data_vencimento,
          numeroParcela: p.numero_parcela
        }));
        setParcelas(novasParcelas);
        setParcelasCarregadas(true);
        
        console.log('Parcelas processadas:', novasParcelas);
      }
      
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      toast({
        title: "Erro ao carregar orçamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Carregar favorecidos
  async function carregarFavorecidos() {
    try {
      const { data, error } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setFavorecidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar favorecidos:', error);
      toast({
        title: "Erro ao carregar favorecidos",
        variant: "destructive",
      });
    }
  }

  // Carregar serviços
  async function carregarServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setServicosDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro ao carregar serviços",
        variant: "destructive",
      });
    }
  }

  // Carregar tabelas de preço
  async function carregarTabelasPreco() {
    try {
      const { data: tabelas, error: tabelasError } = await supabase
        .from('tabelas_precos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo')
        .lte('vigencia_inicial', new Date().toISOString())
        .gte('vigencia_final', new Date().toISOString());

      if (tabelasError) throw tabelasError;

      if (tabelas && tabelas.length > 0) {
        const { data: precos, error: precosError } = await supabase
          .from('tabelas_precos_itens')
          .select('*')
          .eq('tabela_id', tabelas[0].id);

        if (precosError) throw precosError;
        setPrecosServicos(precos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar tabelas de preço:', error);
      toast({
        title: "Erro ao carregar tabelas de preço",
        variant: "destructive",
      });
    }
  }
  
  // Atualiza parcela específica - Usando parseDateString para garantir consistência
  const handleParcelaDataChange = (idx: number, data: Date) => {
    setParcelas(prev => prev.map((parcela, i) =>
      i === idx ? { 
        ...parcela, 
        dataVencimento: format(data, 'yyyy-MM-dd') 
      } : parcela
    ));
  };

  // Adicionar função para atualizar valor da parcela
  const handleParcelaValorChange = (idx: number, valor: number) => {
    setParcelas(prev => prev.map((parcela, i) =>
      i === idx ? { ...parcela, valor } : parcela
    ));
  };

  // Calcular a soma dos valores das parcelas
  const somaParcelas = parcelas.reduce((acc, parcela) => acc + parcela.valor, 0);

  // Atualiza valor do serviço selecionado
  const handleServicoChange = (idx: number, field: "servicoId" | "valor", value: string | number) => {
    setServicos((prev) => {
      const newArr = [...prev];
      if (field === "servicoId") {
        const servicoId = value as string;
        const precoItem = precosServicos.find(p => p.servico_id === servicoId);
        newArr[idx] = {
          servicoId: servicoId,
          valor: precoItem ? precoItem.preco : 0
        };
      } else {
        newArr[idx].valor = Number(value);
      }
      return newArr;
    });
  };

  // Adiciona novo serviço
  const handleAddServico = () => {
    setServicos(prev => [...prev, { servicoId: "", valor: 0 }]);
  };

  // Remove serviço
  const handleRemoveServico = (idx: number) => {
    if (servicos.length === 1) return;
    setServicos(prev => prev.filter((_, i) => i !== idx));
  };

  // Upload do arquivo PDF para o Supabase Storage
  const uploadNotaFiscalPdf = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      // Validações adicionais de arquivo
      if (!file) {
        toast({
          title: "Erro no Upload",
          description: "Nenhum arquivo selecionado.",
          variant: "destructive"
        });
        throw new Error("Nenhum arquivo selecionado");
      }

      if (file.type !== "application/pdf") {
        toast({
          title: "Tipo de Arquivo Inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive"
        });
        throw new Error("Arquivo não é um PDF");
      }

      // Gerar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${currentCompany?.id}_${codigoVenda}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Iniciando upload do arquivo:', filePath);
      
      // Upload do arquivo para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('notas_fiscais')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        toast({
          title: "Erro no Upload",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      console.log('Upload realizado com sucesso:', data);
      
      // Obter a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('notas_fiscais')
        .getPublicUrl(filePath);
      
      console.log('URL pública gerada:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do PDF:', error);
      toast({
        title: "Erro ao fazer upload da nota fiscal",
        description: "Não foi possível fazer o upload do arquivo PDF.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Manipulador de alteração do arquivo de nota fiscal
  const handleNotaFiscalPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    
    if (!file) {
      setNotaFiscalPdf(null);
      setNotaFiscalPdfUrl("");
      return;
    }
    
    try {
      const publicUrl = await uploadNotaFiscalPdf(file);
      setNotaFiscalPdf(file);
      setNotaFiscalPdfUrl(publicUrl);
      toast({
        title: "Upload da nota fiscal concluído",
        description: "O arquivo PDF foi carregado com sucesso.",
      });
    } catch (error) {
      // Erro já tratado na função uploadNotaFiscalPdf
      setNotaFiscalPdf(null);
      setNotaFiscalPdfUrl("");
    }
  };

  // Voltar para a lista de faturamento
  const handleCancel = () => {
    navigate("/vendas/faturamento");
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!favorecidoId) {
      toast({ title: "Selecione um Favorecido para prosseguir." });
      return;
    }
    if (servicos.some(s => !s.servicoId || Number(s.valor) <= 0)) {
      toast({ title: "Inclua ao menos um serviço com valor positivo." });
      return;
    }
    if (parcelas.some(p => !p.dataVencimento)) {
      toast({ title: "Preencha todas as datas de vencimento das parcelas." });
      return;
    }
    
    // Verificação da soma dos valores das parcelas APENAS no momento do salvamento
    const valoresTotaisCorretos = Math.abs(total - somaParcelas) < 0.02;
    
    if (!valoresTotaisCorretos) {
      toast({ 
        title: "A soma dos valores das parcelas não corresponde ao valor total", 
        description: `Total: ${total.toFixed(2)}, Soma das parcelas: ${somaParcelas.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Se for edição, atualizamos o registro existente
      if (orcamentoId) {
        const { error: orcamentoError } = await supabase
          .from('orcamentos')
          .update({
            favorecido_id: favorecidoId,
            codigo_projeto: codigoProjeto || null,
            observacoes: observacoes || null,
            forma_pagamento: formaPagamento,
            numero_parcelas: numeroParcelas,
            data_nota_fiscal: dataNotaFiscal || null,
            numero_nota_fiscal: numeroNotaFiscal || null,
            nota_fiscal_pdf: notaFiscalPdfUrl || null,
          })
          .eq('id', orcamentoId);

        if (orcamentoError) throw orcamentoError;

        // Excluir itens antigos
        const { error: deleteItensError } = await supabase
          .from('orcamentos_itens')
          .delete()
          .eq('orcamento_id', orcamentoId);

        if (deleteItensError) throw deleteItensError;

        // Inserir novos itens
        const itensOrcamento = servicos.map(s => ({
          orcamento_id: orcamentoId,
          servico_id: s.servicoId,
          valor: s.valor
        }));

        const { error: itensError } = await supabase
          .from('orcamentos_itens')
          .insert(itensOrcamento);

        if (itensError) throw itensError;

        // Excluir parcelas antigas
        const { error: deleteParcelasError } = await supabase
          .from('orcamentos_parcelas')
          .delete()
          .eq('orcamento_id', orcamentoId);

        if (deleteParcelasError) throw deleteParcelasError;

        // Inserir novas parcelas
        const parcelasOrcamento = parcelas.map(p => ({
          orcamento_id: orcamentoId,
          numero_parcela: p.numeroParcela,
          valor: p.valor,
          data_vencimento: p.dataVencimento
        }));

        const { error: parcelasError } = await supabase
          .from('orcamentos_parcelas')
          .insert(parcelasOrcamento);

        if (parcelasError) throw parcelasError;
      } else {
        // Inserir novo orçamento (sempre como tipo "orcamento")
        const { data: orcamento, error: orcamentoError } = await supabase
          .from('orcamentos')
          .insert({
            empresa_id: currentCompany?.id,
            favorecido_id: favorecidoId,
            codigo: codigoVenda,
            tipo: 'orcamento', // Tipo fixo como "orcamento"
            data: data ? new Date(data).toISOString() : new Date().toISOString(),
            codigo_projeto: codigoProjeto || null,
            observacoes: observacoes || null,
            forma_pagamento: formaPagamento,
            numero_parcelas: numeroParcelas,
            data_nota_fiscal: dataNotaFiscal || null,
            numero_nota_fiscal: numeroNotaFiscal || null,
            status: 'ativo',
            nota_fiscal_pdf: notaFiscalPdfUrl || null,
          })
          .select()
          .single();

        if (orcamentoError) throw orcamentoError;

        // Inserir itens do orçamento
        const itensOrcamento = servicos.map(s => ({
          orcamento_id: orcamento.id,
          servico_id: s.servicoId,
          valor: s.valor
        }));

        const { error: itensError } = await supabase
          .from('orcamentos_itens')
          .insert(itensOrcamento);

        if (itensError) throw itensError;

        // Inserir parcelas
        const parcelasOrcamento = parcelas.map(p => ({
          orcamento_id: orcamento.id,
          numero_parcela: p.numeroParcela,
          valor: p.valor,
          data_vencimento: p.dataVencimento
        }));

        const { error: parcelasError } = await supabase
          .from('orcamentos_parcelas')
          .insert(parcelasOrcamento);

        if (parcelasError) throw parcelasError;
      }

      toast({ title: orcamentoId ? "Orçamento atualizado com sucesso!" : "Orçamento salvo com sucesso!" });
      navigate("/vendas/faturamento");
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: "Erro ao salvar orçamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
}

// Formas de Pagamento
export const formasPagamento = [
  { id: "avista", label: "À Vista" },
  { id: "boleto", label: "Boleto Bancário" },
  { id: "cartao", label: "Cartão de Crédito" },
  { id: "pix", label: "PIX" },
];
