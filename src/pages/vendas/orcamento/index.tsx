
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Favorecido, Servico, TabelaPreco, TabelaPrecoItem } from "@/types";

// Formas de Pagamento
const formasPagamento = [
  { id: "avista", label: "À Vista" },
  { id: "boleto", label: "Boleto Bancário" },
  { id: "cartao", label: "Cartão de Crédito" },
  { id: "pix", label: "PIX" },
];

function gerarCodigoVenda(): string {
  return `${Date.now().toString().slice(-7)}`;
}

export default function OrcamentoPage() {
  const { currentCompany } = useCompany();
  const [tipoVenda, setTipoVenda] = useState<"orcamento" | "venda">("orcamento");
  const [data, setData] = useState(formatDate(new Date()));
  const [codigoVenda] = useState(gerarCodigoVenda());
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

  // Estados para dados do banco
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
  const [tabelasPreco, setTabelasPreco] = useState<TabelaPreco[]>([]);
  const [precosServicos, setPrecosServicos] = useState<TabelaPrecoItem[]>([]);

  // Buscar dados iniciais
  useEffect(() => {
    if (currentCompany?.id) {
      carregarFavorecidos();
      carregarServicos();
      carregarTabelasPreco();
    }
  }, [currentCompany?.id]);

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

  // Cálculo do total do orçamento
  const total = servicos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Cálculo das parcelas
  const getParcelas = () => {
    if (numeroParcelas <= 1) {
      return [{
        valor: total,
        dataVencimento: "",
        numeroParcela: `${codigoVenda}/1`
      }];
    }
    const valorParcela = Math.floor((total / numeroParcelas) * 100) / 100;
    const parcelas = [];
    let soma = 0;
    for (let i = 0; i < numeroParcelas; i++) {
      let valor = valorParcela;
      if (i === numeroParcelas - 1) {
        valor = Math.round((total - soma) * 100) / 100;
      } else {
        soma += valor;
      }
      parcelas.push({
        valor,
        dataVencimento: "",
        numeroParcela: `${codigoVenda}/${i + 1}`,
      });
    }
    return parcelas;
  };

  const [parcelas, setParcelas] = useState(getParcelas());

  // Atualiza parcelas quando muda número ou valor total
  React.useEffect(() => {
    const novas = getParcelas();
    setParcelas(novas);
  }, [numeroParcelas, total]);

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

  // Upload do arquivo PDF da nota fiscal
  const handleNotaFiscalPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file && file.type === "application/pdf") {
      setNotaFiscalPdf(file);
      const url = URL.createObjectURL(file);
      setNotaFiscalPdfUrl(url);
    } else {
      setNotaFiscalPdf(null);
      setNotaFiscalPdfUrl("");
    }
  };

  // Salvar orçamento
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

    try {
      // Inserir orçamento
      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .insert({
          empresa_id: currentCompany?.id,
          favorecido_id: favorecidoId,
          codigo: codigoVenda,
          tipo: tipoVenda,
          data: new Date().toISOString(),
          codigo_projeto: codigoProjeto || null,
          observacoes: observacoes || null,
          forma_pagamento: formaPagamento,
          numero_parcelas: numeroParcelas,
          data_nota_fiscal: dataNotaFiscal || null,
          numero_nota_fiscal: numeroNotaFiscal || null,
          status: 'ativo'
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

      toast({ title: "Orçamento salvo com sucesso!" });

      // Resetar formulário
      setFavorecidoId("");
      setCodigoProjeto("");
      setObservacoes("");
      setFormaPagamento(formasPagamento[0].id);
      setNumeroParcelas(1);
      setServicos([{ servicoId: "", valor: 0 }]);
      setDataNotaFiscal("");
      setNumeroNotaFiscal("");
      setNotaFiscalPdf(null);
      setNotaFiscalPdfUrl("");

    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: "Erro ao salvar orçamento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Orçamento</h2>
      </div>
      <Card>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Tipo de Venda */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm mb-1">Tipo de Venda</label>
                <Select value={tipoVenda} onValueChange={v => setTipoVenda(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orcamento">Orçamento</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Data */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm mb-1">Data</label>
                <Input
                  type="text"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Código da Venda */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm mb-1">Código da Venda</label>
                <Input type="text" value={codigoVenda} readOnly />
              </div>
              {/* Favorecido */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm mb-1">Favorecido *</label>
                <Select value={favorecidoId} onValueChange={setFavorecidoId}>
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
                />
              </div>
              {/* Observações */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm mb-1">Observações</label>
                <Textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
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
                    />
                    {servicos.length > 1 && (
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
                <Button
                  type="button"
                  variant="blue"
                  onClick={handleAddServico}
                  className="mt-1"
                >
                  <Plus className="mr-1 w-4 h-4" />
                  Incluir Serviço
                </Button>
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
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
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
                />
              </div>
            </div>

            {/* Parcelas */}
            <div>
              <label className="block text-sm mb-1">
                Parcelas e Datas de Vencimento
              </label>
              <div className="flex flex-col gap-2">
                {parcelas.map((parcela, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="text"
                      readOnly
                      value={`Parcela ${parcela.numeroParcela} - ${parcela.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}`}
                      className="w-72"
                    />
                    <Input
                      type="date"
                      value={parcela.dataVencimento}
                      onChange={e => handleParcelaDataChange(idx, e.target.value)}
                      required
                      className="w-52"
                    />
                  </div>
                ))}
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
                />
              </div>
              {/* Upload Nota Fiscal PDF */}
              <div className="w-full md:w-1/3">
                <label className="block text-sm mb-1">Nota Fiscal (PDF)</label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleNotaFiscalPdfChange}
                />
                {notaFiscalPdf && notaFiscalPdfUrl && (
                  <Button
                    variant="blue"
                    type="button"
                    className="mt-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = notaFiscalPdfUrl;
                      link.download = notaFiscalPdf.name || "nota-fiscal.pdf";
                      link.click();
                    }}
                  >
                    Baixar Nota Fiscal
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <Button type="submit" variant="blue">
                Salvar Orçamento
              </Button>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
