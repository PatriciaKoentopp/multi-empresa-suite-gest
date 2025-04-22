
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarPlus } from "lucide-react";
import { format } from "date-fns";

type Conta = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
};

type Lancamento = {
  id: string;
  data: string;
  historico: string;
  conta: string;
  tipo: "debito" | "credito";
  valor: number;
  saldo: number;
};

interface LancarDiarioModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (novo: Omit<Lancamento, "id" | "saldo">) => void;
  contas: Conta[];
  contaInicalId: string;
}

export default function LancarDiarioModal({ open, onClose, onSave, contas, contaInicalId }: LancarDiarioModalProps) {
  const [data, setData] = useState<Date>(new Date());
  const [tipo, setTipo] = useState<"debito" | "credito">("debito");
  const [valor, setValor] = useState<string>("");
  const [historico, setHistorico] = useState("");
  const [contaId, setContaId] = useState(contaInicalId || contas[0]?.id || "");

  function clearForm() {
    setData(new Date());
    setTipo("debito");
    setValor("");
    setHistorico("");
    setContaId(contaInicalId || contas[0]?.id || "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !historico || !valor || !contaId || isNaN(Number(valor))) return;
    onSave({
      data: data.toISOString().slice(0, 10),
      historico,
      conta: contaId,
      tipo,
      valor: Number(valor),
    });
    clearForm();
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) { clearForm(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-sm font-medium mb-1 block">Conta Contábil</label>
            <Select value={contaId} onValueChange={setContaId}>
              <SelectTrigger className="w-full bg-white border rounded">
                <SelectValue placeholder="Conta Contábil" />
              </SelectTrigger>
              <SelectContent className="bg-white border z-50">
                {contas.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>{cc.codigo} - {cc.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                  {data ? format(data, "dd/MM/yyyy") : "Escolha uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={d => d && setData(d)}
                  initialFocus
                  className="pointer-events-auto p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Valor</label>
              <Input type="number" min={0} step="0.01" autoComplete="off" required value={valor} onChange={e => setValor(e.target.value.replace(",", "."))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <Select value={tipo} onValueChange={v => setTipo(v as any)}>
                <SelectTrigger className="w-full bg-white border rounded">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border z-50">
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Histórico</label>
            <Input type="text" maxLength={64} value={historico} onChange={e => setHistorico(e.target.value)} required />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="blue" type="submit">
              Salvar
            </Button>
            <DialogClose asChild>
              <Button variant="outline" type="button" className="ml-2">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

