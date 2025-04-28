import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate, parseDateString, dateToISOString } from "@/lib/utils";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Favorecido, Servico, TabelaPreco, TabelaPrecoItem, Orcamento as OrcamentoType, OrcamentoItem, OrcamentoParcela } from "@/types";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, addMonths } from 'date-fns';
import { DateInput } from "@/components/movimentacao/DateInput";
import { ParcelasForm } from "@/components/movimentacao/ParcelasForm";

// Formas de Pagamento
const formasPagamento = [
  { id: "avista", label: "À Vista" },
  { id: "boleto", label: "Boleto Bancário" },
  { id: "cartao", label: "Cartão de Crédito" },
  { id: "pix", label: "PIX" },
];

function gerarCodigoVenda(): string {
  const baseNumber = 200;
  const uniqueSuffix = Date.now().toString().slice(-4);
  return `${baseNumber}${uniqueSuffix}`;
}

export default function OrcamentoPage() {
  const { currentCompany } = useCompany();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Obter parâmetros da URL
  const orcamentoId = searchParams.get('id');
  const isVisualizacao = searchParams.get('visualizar') === '1';
  
  const [data, setData] = useState<Date | undefined>(new Date());
  // Removendo a geração automática do código de venda
  const [codigoVenda, setCodigoVenda] = useState("");
  const [favorecidoId, setFavorecidoId] = useState<string>("");
  const [showFavorecidoModal, setShowFavorecidoModal] = useState(false);
  const [codigoProjeto, setCodigoProjeto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>(formasPagamento[0].id);
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [servicos, setServicos] = useState([
    { servicoId: "", valor: 0 }
  ]);
  const [dataNotaFiscal, setDataNotaFiscal] = useState("");
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState("");
  const [notaFiscalPdf, setNotaFiscalPdf] = useState<File | null>(null);
  const [notaFiscalPdfUrl, setNotaFiscalPdfUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para dados do banco
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
  const [tabelasPreco, setTabelasPreco] = useState<TabelaPreco[]>([]);
  const [precosServicos, setPrecosServicos] = useState<TabelaPrecoItem[]>([]);
  
  // Cálculo do total do orçamento
  const total = servicos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  
  // Modificando a função que gera as parcelas para incluir datas padrão
  function getParcelas(valorTotal: number, numParcelas: number, codigo: string, datasPrimeiroVencimento?: string) {
    if (numParcelas <= 1) {
      return [{
        valor: valorTotal,
        dataVencimento: datasPrimeiroVencimento || format(new Date(), 'yyyy-MM-dd'),
        numeroParcela: `${codigo}/1`
      }];
    }
    
    const valorParcela = Math.floor((valorTotal / numParcelas) * 100) / 100;
    const parcelas = [];
    let soma = 0;
    
    for (let i = 0; i < numParcelas; i++) {
      let valor = valorParcela;
      if (i === numParcelas - 1) {
        valor = Math.round((valorTotal - soma) * 100) / 100;
      } else {
        soma += valor;
      }
      
      // Calcula a data de vencimento: primeira parcela hoje, demais a cada 30 dias
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

  // Inicializar parcelas
  const [parcelas, setParcelas] = useState(() => getParcelas(0, numeroParcelas, codigoVenda));
  const [parcelasCarregadas, setParcelasCarregadas] = useState(false);

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
      
      // Preencher o formulário com os dados
      // Exibir data exatamente como está no banco
      setData(orcamento.data ? new Date(orcamento.data) : new Date());
      setCodigoVenda(orcamento.codigo);
      setFavorecidoId(orcamento.favorecido_id);
      setCodigoProjeto(orcamento.codigo_projeto || "");
      setObservacoes(orcamento.observacoes || "");
      setFormaPagamento(orcamento.forma_pagamento);
      setNumeroParcelas(orcamento.numero_parcelas);
      
      // Exibir data da nota fiscal exatamente como está no banco
      if (orcamento.data_nota_fiscal) {
        setDataNotaFiscal(formatDate(orcamento.data_nota_fiscal, "yyyy-MM-dd"));
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
      
      // Configurar parcelas
      if (parcelas && parcelas.length > 0) {
        const novasParcelas = parcelas.map(p => ({
          valor: p.valor,
          dataVencimento: formatDate(p.data_vencimento, "yyyy-MM-dd"),
          numeroParcela: p.numero_parcela
        }));
        setParcelas(novasParcelas);
        setParcelasCarregadas(true);
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

  // Efeito para atualizar as parcelas quando o valor total ou número de parcelas mudar
  useEffect(() => {
    const dataPrimeiroParcela = parcelas.length > 0 ? parcelas[0].dataVencimento : "";
    const novasParcelas = getParcelas(total, numeroParcelas, codigoVenda, dataPrimeiroParcela);
    setParcelas(novasParcelas);
  }, [total, numeroParcelas, codigoVenda]);

  // Atualiza parcela específica
  const handleParcelaDataChange = (idx: number, data: string) => {
    setParcelas(prev => prev.map((parcela, i) =>
      i === idx ? { ...parcela, dataVencimento: data } : parcela
    ));
  };

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

  // Adicionar função para atualizar valor da parcela
  const handleParcelaValorChange = (idx: number, valor: number) => {
    setParcelas(prev => prev.map((parcela, i) =>
      i === idx ? { ...parcela, valor } : parcela
    ));
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

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {orcamentoId 
            ? isVisualizacao 
              ? "Visualizar Orçamento" 
              : "Editar Orçamento" 
            : "Novo Orçamento"
          }
        </h2>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Card>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full">
                  <label className="block text-sm mb-1">Data</label>
                  <DateInput 
                    value={data} 
                    onChange={(date) => setData(date)}
                    disabled={isVisualizacao}
                  />
                </div>
              </div>
              
              
              
              <div className="flex flex-col md:flex-row gap-4">
                {/* Código da Venda - agora editável */}
                <div className="w-full md:w-1/2">
                  <label className="block text-sm mb-1">Código da Venda *</label>
                  <Input 
                    type="text" 
                    value={codigoVenda} 
                    onChange={(e) => setCodigoVenda(e.target.value)}
                    placeholder="Digite o código da venda"
                    required
                    disabled={isVisualizacao}
                  />
                </div>
                {/* Favorecido */}
                <div className="w-full md:w-1/2">
                  <label className="block text-sm mb-1">Favorecido *</label>
                  <Select 
                    value={favorecidoId} 
                    onValueChange={setFavorecidoId}
                    disabled={isVisualizacao}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Favorecido" />
                    </SelectTrigger>
                    <SelectContent>
                      {favorecidos.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Código do Projeto */}
                <div className="w-full md:w-1/2">
                  <label className="block text-sm mb-1">Código do Projeto</label>
                  <Input
                    type="text"
                    value={codigoProjeto}
                    onChange={e => setCodigoProjeto(e.target.value)}
                    disabled={isVisualizacao}
                  />
                </div>
                {/* Observações */}
                <div className="w-full md:w-1/2">
                  <label className="block text-sm mb-1">Observações</label>
                  <Textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    disabled={isVisualizacao}
                  />
                </div>
              </div>

              {/* Serviços */}
              <div>
                <label className="block text-sm mb-2 font-medium">Serviços</label>
                <div className="flex flex-col gap-2">
                  {servicos.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="w-full">
                        <Select
                          value={s.servicoId}
                          onValueChange={v => handleServicoChange(idx, "servicoId", v)}
                          disabled={isVisualizacao}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o Serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {servicosDisponiveis.map(servico => (
                              <SelectItem key={servico.id} value={servico.id}>
                                {servico.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-[120px]"
                        value={s.valor}
                        onChange={e => handleServicoChange(idx, "valor", e.target.value)}
                        placeholder="Valor"
                        disabled={isVisualizacao}
                      />
                      {!isVisualizacao && servicos.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveServico(idx)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isVisualizacao && (
                    <Button
                      type="button"
                      variant="blue"
                      onClick={handleAddServico}
                      className="mt-1"
                    >
                      <Plus className="mr-1 w-4 h-4" />
                      Incluir Serviço
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Total */}
              <div>
                <label className="block text-sm mb-1 font-semibold">
                  Total da Venda
                </label>
                <Input
                  type="text"
                  value={total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                  readOnly
                />
              </div>

              {/* Pagamento */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm mb-1">Forma de Pagamento</label>
                  <Select 
                    value={formaPagamento} 
                    onValueChange={setFormaPagamento}
                    disabled={isVisualizacao}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm mb-1">Número de Parcelas</label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={numeroParcelas}
                    onChange={e => setNumeroParcelas(Number(e.target.value) || 1)}
                    disabled={isVisualizacao}
                  />
                </div>
              </div>

              {/* Parcelas */}
              <div>
                <label className="block text-sm mb-1">
                  Parcelas e Datas de Vencimento
                </label>
                <div className="flex flex-col gap-2">
                  <ParcelasForm 
                    parcelas={parcelas.map(p => ({
                      numero: parseInt(p.numeroParcela.split('/')[1]),
                      valor: p.valor,
                      dataVencimento: new Date(p.dataVencimento)
                    }))}
                    onValorChange={handleParcelaValorChange}
                    readOnly={isVisualizacao}
                  />
                </div>
              </div>

              {/* CAMPOS NOTA FISCAL */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Data Nota Fiscal */}
                <div className="w-full md:w-1/3">
                  <label className="block text-sm mb-1">Data Nota Fiscal</label>
                  <Input
                    type="date"
                    value={dataNotaFiscal}
                    onChange={e => setDataNotaFiscal(e.target.value)}
                    disabled={isVisualizacao}
                  />
                </div>
                {/* Número Nota Fiscal */}
                <div className="w-full md:w-1/3">
                  <label className="block text-sm mb-1">Número Nota Fiscal</label>
                  <Input
                    type="text"
                    maxLength={30}
                    value={numeroNotaFiscal}
                    onChange={e => setNumeroNotaFiscal(e.target.value)}
                    placeholder="Ex: 12345"
                    disabled={isVisualizacao}
                  />
                </div>
                {/* Upload Nota Fiscal PDF */}
                <div className="w-full md:w-1/3">
                  <label className="block text-sm mb-1">Nota Fiscal (PDF)</label>
                  {!isVisualizacao && (
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleNotaFiscalPdfChange}
                      disabled={isVisualizacao || isUploading}
                    />
                  )}
                  {isUploading && (
                    <div className="mt-2 text-sm flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-blue-500"></div>
                      Fazendo upload...
                    </div>
                  )}
                  {notaFiscalPdfUrl && (
                    <Button
                      variant="blue"
                      type="button"
                      className="mt-2"
                      onClick={() => window.open(notaFiscalPdfUrl, '_blank')}
                    >
                      Baixar Nota Fiscal
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                {!isVisualizacao && (
                  <Button 
                    type="submit" 
                    variant="blue"
                    disabled={isLoading || isUploading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-white"></div>
                        Salvando...
                      </>
                    ) : (
                      orcamentoId ? "Atualizar Orçamento" : "Salvar Orçamento"
                    )}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {isVisualizacao ? "Voltar" : "Cancelar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
