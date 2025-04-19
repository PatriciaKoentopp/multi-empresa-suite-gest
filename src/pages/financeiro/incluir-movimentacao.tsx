import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";

type Operacao = "pagar" | "receber" | "transferencia";

interface Parcela {
  numero: number;
  valor: number;
  vencimento: Date;
}

// Utilitário para converter DD/MM/YYYY <-> Date
function parseDateBr(input: string): Date | null {
  const [dia, mes, ano] = input.split("/");
  if (!dia || !mes || !ano) return null;
  const d = Number(dia), m = Number(mes) - 1, y = Number(ano);
  if (
    isNaN(d) || isNaN(m) || isNaN(y) ||
    d < 1 || d > 31 || m < 0 || m > 11 || y < 1000
  ) return null;
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
  return dt;
}

// Campo de input de data (igual campo aniversário)
// Permite digitação manual DD/MM/YYYY e seleção via calendário
function DateInput({ label, value, onChange }: { label: string, value?: Date, onChange: (d?: Date) => void }) {
  const [inputValue, setInputValue] = React.useState(value ? format(value, "dd/MM/yyyy") : "");

  React.useEffect(() => {
    setInputValue(value ? format(value, "dd/MM/yyyy") : "");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Limita a apenas números e barra
    let val = e.target.value.replace(/[^\d/]/g, "")
      .replace(/^(\d{2})(\d)/, "$1/$2")
      .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
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

  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={handleChange}
          placeholder="DD/MM/AAAA"
          className="w-[120px]"
          maxLength={10}
          inputMode="numeric"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" tabIndex={-1}><CalendarIcon className="w-4 h-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto bg-white")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default function IncluirMovimentacaoModal() {
  const [open, setOpen] = useState(true);
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

  // Para selects, use fetch dos dados caso necessário.
  const favorecidos = [
    { id: "1", nome: "João Silva" },
    { id: "2", nome: "Empresa XYZ" },
  ];
  const categorias = [
    { id: "1", nome: "Aluguel" },
    { id: "2", nome: "Salário" },
    { id: "3", nome: "Outros" },
  ];
  const formasPagamento = [
    { id: "1", nome: "Dinheiro" },
    { id: "2", nome: "Cartão" },
    { id: "3", nome: "Boleto" },
    { id: "4", nome: "Transferência" },
  ];

  // Colunas: número, valor, vencimento (DD/MM/YYYY)
  const calcularParcelas = () => {
    let total = parseFloat(valor.replace(",", ".") || "0");
    let n = Number(numParcelas) || 1;
    let valorParcela = n > 0 ? Number((total / n).toFixed(2)) : total;
    let vencs: Parcela[] = [];
    for (let i = 0; i < n; i++) {
      let dt = dataPrimeiroVenc ? addMonths(dataPrimeiroVenc, i) : new Date();
      vencs.push({ numero: i + 1, valor: valorParcela, vencimento: dt });
    }
    setParcelas(vencs);
  };

  React.useEffect(() => {
    calcularParcelas();
    // eslint-disable-next-line
  }, [valor, numParcelas, dataPrimeiroVenc]);

  // Trocar helpers para manter conversão correta para YYYY-MM-DD ao salvar

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
      valor: parseFloat(valor.replace(",", ".")),
      formaPagamento,
      numParcelas,
      parcelas: parcelas.map(p => ({
        numero: p.numero,
        valor: p.valor,
        vencimento: format(p.vencimento, "yyyy-MM-dd")
      })),
      considerarDRE,
    };
    alert("Movimentação cadastrada!\n" + JSON.stringify(cadastrado, null, 2));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Incluir Movimentação</DialogTitle>
          <DialogDescription>Preencha os dados da nota de despesa/receita.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={e => { e.preventDefault(); handleSalvar(); }}
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Operação</Label>
              <Select value={operacao} onValueChange={v => setOperacao(v as Operacao)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagar">Pagar</SelectItem>
                  <SelectItem value="receber">Receber</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DateInput label="Data de Emissão" value={dataEmissao} onChange={setDataEmissao} />
            <DateInput label="Data de Lançamento" value={dataLancamento} onChange={setDataLancamento} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número do Documento</Label>
              <Input value={numDoc} onChange={e => setNumDoc(e.target.value)} />
            </div>
            <div>
              <Label>Favorecido</Label>
              <Select value={favorecido} onValueChange={setFavorecido}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {favorecidos.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria Financeira</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {formasPagamento.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Valor</Label>
              <div className="relative flex items-center">
                <Input
                  value={valor}
                  onChange={e => setValor(e.target.value.replace(/[^0-9,\.]/g, ""))}
                  placeholder="0,00"
                />
                <DollarSign className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <Label>Número de Parcelas</Label>
              <Input
                type="number"
                min={1}
                max={36}
                value={numParcelas}
                onChange={e => setNumParcelas(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
              />
            </div>
            <DateInput label="Primeiro Vencimento" value={dataPrimeiroVenc} onChange={setDataPrimeiroVenc} />
          </div>
          <div>
            <Label>Parcelas</Label>
            <div className="border rounded p-2">
              <div className="grid grid-cols-3 gap-2 font-bold mb-1">
                <span>Parcela</span><span>Valor (R$)</span><span>Vencimento</span>
              </div>
              {parcelas.map(parc => (
                <div key={parc.numero} className="grid grid-cols-3 gap-2 text-sm mb-1">
                  <span>{parc.numero}</span>
                  <span>{parc.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <span>{format(parc.vencimento, "dd/MM/yyyy")}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={considerarDRE} onCheckedChange={v => setConsiderarDRE(!!v)} id="dre" />
            <Label htmlFor="dre">Movimentação aparece no DRE?</Label>
          </div>
          <DialogFooter>
            <Button type="submit" variant="blue">Salvar</Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// AVISO: Este arquivo está ficando muito longo (mais de 280 linhas!)
// Considere pedir para eu refatorar em componentes menores!
