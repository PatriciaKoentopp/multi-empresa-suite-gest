
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { ContaContabil } from "@/types/lancamentos-contabeis";

interface LancarDiarioModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (novo: { data: string; historico: string; debito: string; credito: string; valor: number }) => void;
  contas: ContaContabil[];
  contaInicalId: string;
}

export default function LancarDiarioModal({ open, onClose, onSave, contas, contaInicalId }: LancarDiarioModalProps) {
  const [data, setData] = useState<Date>(new Date());
  const [valor, setValor] = useState<string>("");
  const [historico, setHistorico] = useState("");
  const [contaDebitoId, setContaDebitoId] = useState(contaInicalId || "");
  const [contaCreditoId, setContaCreditoId] = useState("");
  
  // Resetar formulário quando o modal abre
  useEffect(() => {
    if (open) {
      setData(new Date());
      setValor("");
      setHistorico("");
      setContaDebitoId(contaInicalId || (contas.length > 0 ? contas[0].id : ""));
      setContaCreditoId(contas.length > 1 ? contas[1].id : (contas.length > 0 ? contas[0].id : ""));
    }
  }, [open, contaInicalId, contas]);

  function clearForm() {
    setData(new Date());
    setValor("");
    setHistorico("");
    setContaDebitoId(contaInicalId || contas[0]?.id || "");
    setContaCreditoId(contas.length > 1 ? contas[1]?.id : contas[0]?.id || "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !historico || !valor || !contaDebitoId || !contaCreditoId || isNaN(Number(valor))) {
      toast.error("Preencha todos os campos corretamente.");
      return;
    }
    if (contaDebitoId === contaCreditoId) {
      toast.error("A conta de débito e crédito não podem ser iguais.");
      return;
    }

    try {
      onSave({
        data: format(data, "dd/MM/yyyy"),
        historico,
        debito: contaDebitoId,
        credito: contaCreditoId,
        valor: Number(valor),
      });
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
      toast.error("Erro ao salvar lançamento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) { clearForm(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-sm font-medium mb-1 block">Conta Débito</label>
            <Select value={contaDebitoId} onValueChange={setContaDebitoId}>
              <SelectTrigger className="w-full bg-white border rounded">
                <SelectValue placeholder="Conta Débito" />
              </SelectTrigger>
              <SelectContent className="bg-white border z-50">
                {contas.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>{cc.codigo} - {cc.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Conta Crédito</label>
            <Select value={contaCreditoId} onValueChange={setContaCreditoId}>
              <SelectTrigger className="w-full bg-white border rounded">
                <SelectValue placeholder="Conta Crédito" />
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
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Valor</label>
            <Input type="number" step="0.01" autoComplete="off" required value={valor} onChange={e => setValor(e.target.value.replace(",", "."))} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Histórico</label>
            <Input type="text" maxLength={64} value={historico} onChange={e => setHistorico(e.target.value)} required />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="default" type="submit" className="bg-blue-500 hover:bg-blue-600">
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
