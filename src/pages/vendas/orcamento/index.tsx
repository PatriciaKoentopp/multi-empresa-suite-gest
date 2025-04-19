import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

// Mock Favorecidos (simular busca/listagem)
const mockFavorecidos = [
  { id: "1", nome: "Empresa ABC Ltda" },
  { id: "2", nome: "João da Silva" },
  { id: "3", nome: "Prefeitura de SP" },
];

// Mock Serviços (simular busca/listagem)
const mockServicos = [
  { id: "1", nome: "Consultoria Fiscal", valorPadrao: 700 },
  { id: "2", nome: "Abertura de Empresa", valorPadrao: 1200 },
  { id: "3", nome: "Auditoria Contábil", valorPadrao: 3500 },
  { id: "4", nome: "BPO Financeiro", valorPadrao: 2500 },
];

// Mock Formas de Pagamento
const formasPagamento = [
  { id: "avista", label: "À Vista" },
  { id: "boleto", label: "Boleto Bancário" },
  { id: "cartao", label: "Cartão de Crédito" },
  { id: "pix", label: "PIX" },
];

function gerarCodigoVenda(): string {
  // Gera um código único numérico para simulação (poderia ser mais robusto em produção)
  return `ORC${Date.now().toString().slice(-7)}`;
}

export default function OrcamentoPage() {
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

  // Cálculo do total do orçamento
  const total = servicos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Cálculo das parcelas
  const getParcelas = () => {
    if (numeroParcelas <= 1) {
      return [{ valor: total, dataVencimento: "" }];
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
      parcelas.push({ valor, dataVencimento: "" });
    }
    return parcelas;
  };

  const [parcelas, setParcelas] = useState(getParcelas());

  // Sincroniza parcelas ao mudar número ou valor total
  const atualizarParcelas = () => {
    const novas = getParcelas();
    setParcelas(novas);
  };

  // Atualiza parcela específica
  const handleParcelaDataChange = (idx: number, data: string) => {
    setParcelas(prev => prev.map((parcela, i) => i === idx ? { ...parcela, dataVencimento: data } : parcela));
  };

  // Atualiza quando muda número de parcelas ou valor total
  React.useEffect(() => {
    atualizarParcelas();
    // eslint-disable-next-line
  }, [numeroParcelas, total]);

  // Atualiza valor do serviço selecionado
  const handleServicoChange = (idx: number, field: "servicoId" | "valor", value: string | number) => {
    setServicos((prev) => {
      const newArr = [...prev];
      if (field === "valor") {
        newArr[idx].valor = Number(value);
      } else {
        newArr[idx].servicoId = value as string;
        const servicoObj = mockServicos.find(s => s.id === value);
        newArr[idx].valor = servicoObj?.valorPadrao ?? 0;
      }
      return newArr;
    });
  };

  // Adiciona serviço novo
  const handleAddServico = () => {
    setServicos(prev => [...prev, { servicoId: "", valor: 0 }]);
  };

  // Remove serviço
  const handleRemoveServico = (idx: number) => {
    if (servicos.length === 1) return;
    setServicos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    toast({ title: "Orçamento salvo com sucesso!" });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Orçamento</h2>
      </div>
      <Card>
        <CardHeader>
          
        </CardHeader>
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
              {/* Data - agora digitável */}
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
              <div className="w-full md:w-1/2 flex gap-2 items-end">
                <div className="w-full">
                  <label className="block text-sm mb-1">Favorecido *</label>
                  <Select value={favorecidoId} onValueChange={setFavorecidoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Favorecido" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockFavorecidos.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="blue"
                  type="button"
                  className="mb-0"
                  onClick={() => setShowFavorecidoModal(true)}
                  size="icon"
                  aria-label="Adicionar novo favorecido"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Código do Projeto */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm mb-1">Código do Projeto</label>
                <Input type="text" value={codigoProjeto} onChange={e => setCodigoProjeto(e.target.value)} />
              </div>
              {/* Observações */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm mb-1">Observações</label>
                <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} />
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
                          {mockServicos.map(servico => (
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
                      <Button type="button" variant="outline" onClick={() => handleRemoveServico(idx)}>
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="blue" onClick={handleAddServico} className="mt-1">
                  <Plus className="mr-1 w-4 h-4" />
                  Incluir Serviço
                </Button>
              </div>
            </div>
            
            {/* Total */}
            <div>
              <label className="block text-sm mb-1 font-semibold">Total da Venda</label>
              <Input type="text" value={total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} readOnly />
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
                      <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
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
              <label className="block text-sm mb-1">Parcelas e Datas de Vencimento</label>
              <div className="flex flex-col gap-2">
                {parcelas.map((parcela, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="text"
                      readOnly
                      value={`Parcela ${idx+1} - ${parcela.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
                      className="w-56"
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

            <div className="flex gap-2 mt-2">
              <Button type="submit" variant="blue">Salvar Orçamento</Button>
              <Button type="button" variant="outline">Cancelar</Button>
            </div>
          </form>

          {/* Modal de novo favorecido (simples) */}
          {showFavorecidoModal && (
            <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-md p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-3">Novo Favorecido</h3>
                <Input className="mb-3" placeholder="Nome do Favorecido" />
                <div className="flex justify-end gap-2">
                  <Button variant="blue" onClick={() => { setShowFavorecidoModal(false); toast({ title: "Favorecido cadastrado!" }) }}>
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowFavorecidoModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
