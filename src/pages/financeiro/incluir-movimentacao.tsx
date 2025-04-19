import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FavorecidosForm } from "@/components/favorecidos/favorecidos-form";
import { PlanoContasForm } from "@/components/plano-contas/plano-contas-form";
import { toast } from "sonner";

// Utilitário para converter DD/MM/YYYY <-> Date
function parseDateBr(input: string): Date | null {
  const [dia, mes, ano] = input.split("/");
  if (!dia || !mes || !ano) return null;
  const d = Number(dia),
    m = Number(mes) - 1,
    y = Number(ano);
  if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 0 || m > 11 || y < 1000) return null;
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
  return dt;
}

// Campo de input de data, permitindo digitação manual e seleção via calendário
function DateInput({
  label,
  value,
  onChange
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
}) {
  const [inputValue, setInputValue] = React.useState(value ? format(value, "dd/MM/yyyy") : "");
  React.useEffect(() => {
    setInputValue(value ? format(value, "dd/MM/yyyy") : "");
  }, [value]);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Limita a apenas números e barra
    let val = e.target.value.replace(/[^\d/]/g, "").replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2").slice(0, 10);
    setInputValue(val);
    const dt = parseDateBr(val);
    onChange(dt || undefined);
  }
  function handleCalendarSelect(dt?: Date) {
    if (dt) {
      setInputValue(format(dt, "dd/MM/yyyy"));
      onChange(dt);
    }
  }
  return <div className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Input value={inputValue} onChange={handleChange} placeholder="DD/MM/AAAA" className="w-[120px]" maxLength={10} inputMode="numeric" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" tabIndex={-1}><CalendarIcon className="w-4 h-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200 z-50" align="start">
            <Calendar mode="single" selected={value} onSelect={handleCalendarSelect} initialFocus className={cn("p-3 pointer-events-auto bg-white")} />
          </PopoverContent>
        </Popover>
      </div>
    </div>;
}
type Operacao = "pagar" | "receber" | "transferencia";
interface Parcela {
  numero: number;
  valor: number;
  vencimento: Date;
}
export default function IncluirMovimentacaoPage() {
  const [operacao, setOperacao] = useState<Operacao>("pagar");
  const [dataEmissao, setDataEmissao] = useState<Date | undefined>(new Date());
  const [dataLancamento, setDataLancamento] = useState<Date | undefined>(new Date());
  const [numDoc, setNumDoc] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [numParcelas, setNumParcelas] = useState<number>(1);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [dataPrimeiroVenc, setDataPrimeiroVenc] = useState<Date | undefined>(new Date());
  const [considerarDRE, setConsiderarDRE] = useState(true);
  const navigate = useNavigate();

  // Novo: controle do modal e dados locais de favorecidos/categorias
  const [isModalNovoFavorecido, setIsModalNovoFavorecido] = useState(false);
  const [isModalNovaCategoria, setIsModalNovaCategoria] = useState(false);
  const [favorecidos, setFavorecidos] = useState([
    { id: "1", nome: "João Silva" },
    { id: "2", nome: "Empresa XYZ" }
  ]);
  const [categorias, setCategorias] = useState([
    { id: "1", nome: "Aluguel" },
    { id: "2", nome: "Salário" },
    { id: "3", nome: "Outros" }
  ]);
  const formasPagamento = [
    { id: "1", nome: "Dinheiro" },
    { id: "2", nome: "Cartão" },
    { id: "3", nome: "Boleto" },
    { id: "4", nome: "Transferência" }
  ];

  // Função para tratar valor no padrão PT-BR (permite , e digita R$)
  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^0-9,]/g, "");
    // Só permite apenas uma vírgula decimal (não aceita ponto)
    if ((val.match(/,/g) || []).length > 1) {
      val = val.slice(0, -1);
    }
    setValor(val);
  }

  // Função para calcular parcelas e corrigir a última em caso de dízima
  function calcularParcelas(vlr: string, nParc: number, primeiroVenc?: Date, vencimentos?: Date[]) {
    let total = parseFloat(vlr.replace(/\./g, "").replace(",", ".") || "0");
    let n = Number(nParc) || 1;
    let base = Math.floor(total / n * 100) / 100; // Trunca com 2 casas
    let parcelasTmp: Parcela[] = [];

    // Lista de vencimentos personalizada, se vier por edição
    let vencList: Date[] = [];
    if (vencimentos && vencimentos.length === n) {
      vencList = vencimentos;
    } else {
      for (let i = 0; i < n; i++) {
        vencList.push(primeiroVenc ? addMonths(primeiroVenc, i) : new Date());
      }
    }
    let soma = 0;
    for (let i = 0; i < n; i++) {
      let valorParc = base;
      // Última parcela: corrige para fechar o total (arredonda para 2 casas)
      if (i === n - 1) {
        valorParc = +(total - soma).toFixed(2);
      } else {
        soma += valorParc;
      }
      parcelasTmp.push({
        numero: i + 1,
        valor: valorParc,
        vencimento: vencList[i]
      });
    }
    return parcelasTmp;
  }

  // Alterar parcelas ao mudar valor, quantidade ou vencimento inicial
  React.useEffect(() => {
    const novasParcelas = calcularParcelas(valor, numParcelas, dataPrimeiroVenc);
    setParcelas(novasParcelas);
    // eslint-disable-next-line
  }, [valor, numParcelas, dataPrimeiroVenc]);
  function handleEditarDataVencimento(indice: number, dt: Date | undefined) {
    if (!dt) return;
    const novosVenc = parcelas.map((p, i) => i === indice ? dt : p.vencimento);
    const novaLista = calcularParcelas(valor, numParcelas, dataPrimeiroVenc, novosVenc);
    setParcelas(novaLista);
  }

  // Atualiza valor de uma parcela e redistribui valores para manter o total, caso editado manualmente
  function handleEditarValorParcela(indice: number, valStr: string) {
    let valLimpo = valStr.replace(/[^0-9,]/g, "").replace(",", ".");
    let valNum = parseFloat(valLimpo || "0");
    let novasParcelas = [...parcelas];
    let somaOutras = novasParcelas.reduce((acc, curr, i) => i !== indice ? acc + curr.valor : acc, 0);
    let total = parseFloat(valor.replace(/\./g, "").replace(",", ".") || "0");
    // Última parcela sempre ajusta para fechar
    if (indice === novasParcelas.length - 1) {
      novasParcelas[indice].valor = +(total - somaOutras).toFixed(2);
    } else {
      novasParcelas[indice].valor = valNum;
      // Atualiza última parcela para fechar total
      novasParcelas[novasParcelas.length - 1].valor = +(total - novasParcelas.slice(0, novasParcelas.length - 1).reduce((acc, p) => acc + p.valor, 0)).toFixed(2);
    }
    setParcelas(novasParcelas);
  }
  // Modal Favorecido
  function handleSalvarNovoFavorecido(data: any) {
    // Considerando que o form de favorecido retorna {nome}
    const novoId = `temp-${Date.now()}`;
    setFavorecidos(old => [...old, { id: novoId, nome: data.nome }]);
    setFavorecido(novoId);
    setIsModalNovoFavorecido(false);
    toast.success("Favorecido cadastrado com sucesso!");
  }
  // Modal Categoria Financeira
  function handleSalvarNovaCategoria(data: any) {
    // O form de PlanoContas retorna {descricao}
    const novoId = `temp-${Date.now()}`;
    setCategorias(old => [...old, { id: novoId, nome: data.descricao }]);
    setCategoria(novoId);
    setIsModalNovaCategoria(false);
    toast.success("Categoria cadastrada com sucesso!");
  }

  function handleSalvar() {
    // Conversão correta para insert/back-end -> YYYY-MM-DD
    const cadastrado = {
      operacao,
      dataEmissao: dataEmissao ? format(dataEmissao, "yyyy-MM-dd") : undefined,
      dataLancamento: dataLancamento ? format(dataLancamento, "yyyy-MM-dd") : undefined,
      numDoc,
      favorecido,
      categoria,
      descricao,
      valor: parseFloat(valor.replace(/\./g, "").replace(",", ".")),
      formaPagamento,
      numParcelas,
      parcelas: parcelas.map(p => ({
        numero: p.numero,
        valor: p.valor,
        vencimento: format(p.vencimento, "yyyy-MM-dd")
      })),
      considerarDRE
    };
    alert("Movimentação cadastrada!\n" + JSON.stringify(cadastrado, null, 2));
    navigate(-1); // Volta para a tela anterior ao salvar, igual a Empresa
  }
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Título principal fora do card */}
      <h1 className="text-2xl font-bold mb-2">Incluir Movimentação</h1>
      
      {/* Container branco agrupando somente o formulário */}
      <div className="bg-white shadow rounded flex flex-col gap-6">
        <form className="flex flex-col gap-4 p-6" onSubmit={e => {
          e.preventDefault();
          handleSalvar();
        }}>
          {/* Linha 1: Operação, Data de Emissão, Data de Lançamento */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <Label>Operação</Label>
              <Select value={operacao} onValueChange={v => setOperacao(v as Operacao)}>
                <SelectTrigger className="bg-white z-50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="pagar">Pagar</SelectItem>
                  <SelectItem value="receber">Receber</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <DateInput label="Data de Emissão" value={dataEmissao} onChange={setDataEmissao} />
            </div>
            <div className="flex flex-col gap-1">
              <DateInput label="Data de Lançamento" value={dataLancamento} onChange={setDataLancamento} />
            </div>
          </div>
          {/* Linha 2: Número do Documento, Favorecido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número do Documento</Label>
              <Input value={numDoc} onChange={e => setNumDoc(e.target.value)} />
            </div>
            <div>
              <Label>Favorecido</Label>
              <div className="flex gap-2 items-end">
                <Select value={favorecido} onValueChange={setFavorecido}>
                  <SelectTrigger className="bg-white z-50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {favorecidos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsModalNovoFavorecido(true)}
                  className="border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                  aria-label="Novo favorecido"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Linha 3: Categoria Financeira, Forma de Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria Financeira</Label>
              <div className="flex gap-2 items-end">
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="bg-white z-50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsModalNovaCategoria(true)}
                  className="border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                  aria-label="Nova categoria financeira"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger className="bg-white z-50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {formasPagamento.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Linha 4: Descrição */}
          <div>
            <Label>Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
          {/* Linha 5: Valor, Número de Parcelas, Primeiro Vencimento */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <Label>Valor</Label>
              <div className="relative flex items-center">
                <Input value={valor} onChange={handleValorChange} placeholder="0,00" inputMode="decimal" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none select-none">
                  R$
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Número de Parcelas</Label>
              <Input type="number" min={1} max={36} value={numParcelas} onChange={e => setNumParcelas(Math.max(1, Math.min(36, Number(e.target.value) || 1)))} />
            </div>
            <div className="flex flex-col gap-1">
              <DateInput label="Primeiro Vencimento" value={dataPrimeiroVenc} onChange={setDataPrimeiroVenc} />
            </div>
          </div>
          {/* Parcela */}
          <div>
            <Label>Parcelas</Label>
            <div className="border rounded p-2">
              <div className="grid grid-cols-3 gap-2 font-bold mb-1">
                <span>Parcela</span><span>Valor (R$)</span><span>Vencimento</span>
              </div>
              {parcelas.map((parc, i) => <div key={parc.numero} className="grid grid-cols-3 gap-2 text-sm mb-1 items-center">
                  <span>{parc.numero}</span>
                  <Input className="w-[90px]" value={parc.valor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} onChange={e => handleEditarValorParcela(i, e.target.value)} inputMode="decimal" />
                  <DateInput label="" value={parc.vencimento} onChange={dt => handleEditarDataVencimento(i, dt)} />
                </div>)}
            </div>
          </div>
          {/* Checkbox DRE */}
          <div className="flex items-center gap-2">
            <Checkbox checked={considerarDRE} onCheckedChange={v => setConsiderarDRE(!!v)} id="dre" />
            <Label htmlFor="dre">Movimentação aparece no DRE?</Label>
          </div>
          {/* Botões */}
          <div className="flex gap-2 justify-end mt-2">
            <Button type="submit" variant="blue">Salvar</Button>
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
      {/* Modal Novo Favorecido */}
      <Dialog open={isModalNovoFavorecido} onOpenChange={setIsModalNovoFavorecido}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Novo Favorecido</DialogTitle>
          </DialogHeader>
          <FavorecidosForm
            onSubmit={handleSalvarNovoFavorecido}
            onCancel={() => setIsModalNovoFavorecido(false)}
            grupos={[]} // Campos não utilizados no cadastro rápido
            profissoes={[]} // Campos não utilizados no cadastro rápido
          />
        </DialogContent>
      </Dialog>
      {/* Modal Nova Categoria Financeira */}
      <Dialog open={isModalNovaCategoria} onOpenChange={setIsModalNovaCategoria}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria Financeira</DialogTitle>
          </DialogHeader>
          <PlanoContasForm
            onSubmit={handleSalvarNovaCategoria}
            onCancel={() => setIsModalNovaCategoria(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
