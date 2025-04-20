
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ContaReceber } from "./contas-a-receber-table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Mock contas correntes
const mockContasCorrentes = [
  { id: "1", nome: "Banco do Brasil - 1234-5" },
  { id: "2", nome: "Caixa - 4432-1" },
];

interface BaixarContaReceberModalProps {
  conta?: ContaReceber | null;
  open: boolean;
  onClose: () => void;
  onBaixar: (dados: {
    dataRecebimento: Date;
    contaCorrenteId: string;
    multa: number;
    juros: number;
    desconto: number;
  }) => void;
}

function formatCurrencyBR(valor?: number) {
  if (valor === undefined) return "-";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function BaixarContaReceberModal({ conta, open, onClose, onBaixar }: BaixarContaReceberModalProps) {
  const [dataRecebimento, setDataRecebimento] = useState<Date | undefined>(conta?.dataVencimento);
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("");
  const [multa, setMulta] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);

  useEffect(() => {
    setDataRecebimento(conta?.dataVencimento);
    setContaCorrenteId("");
    setMulta(0);
    setJuros(0);
    setDesconto(0);
  }, [conta, open]);

  function handleConfirmar() {
    if (!dataRecebimento || !contaCorrenteId) return;
    onBaixar({ dataRecebimento, contaCorrenteId, multa, juros, desconto });
    onClose();
  }

  const valorTotal = useMemo(() => {
    const valorTitulo = conta?.valor || 0;
    return valorTitulo + (multa || 0) + (juros || 0) - (desconto || 0);
  }, [conta, multa, juros, desconto]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Baixar Recebimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div>
            <label className="block text-sm font-medium mb-1">Data de Recebimento *</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={dataRecebimento ? format(dataRecebimento, "yyyy-MM-dd") : ""}
                onChange={e => setDataRecebimento(new Date(e.target.value + "T00:00:00"))}
                min={conta?.dataVencimento ? format(conta.dataVencimento, "yyyy-MM-dd") : undefined}
              />
              <Calendar className="text-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Conta Corrente *</label>
            <Select value={contaCorrenteId} onValueChange={setContaCorrenteId}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {mockContasCorrentes.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Multa</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={multa}
                onChange={e => setMulta(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Juros</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={juros}
                onChange={e => setJuros(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Desconto</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={desconto}
                onChange={e => setDesconto(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor Total</label>
            <Input
              type="text"
              value={formatCurrencyBR(valorTotal)}
              readOnly
              className="bg-gray-100 font-semibold"
              tabIndex={-1}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="blue"
            onClick={handleConfirmar}
            disabled={!dataRecebimento || !contaCorrenteId}
          >
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
