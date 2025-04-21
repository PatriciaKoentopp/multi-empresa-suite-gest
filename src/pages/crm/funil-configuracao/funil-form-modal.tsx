
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FunilEtapaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { nome: string; cor: string; ordem: number }) => void;
  etapa?: { nome: string; cor: string; ordem: number };
}

export function FunilFormModal({ open, onClose, onConfirm, etapa }: FunilEtapaModalProps) {
  const [nome, setNome] = React.useState(etapa?.nome || "");
  const [cor, setCor] = React.useState(etapa?.cor || "#0EA5E9");
  const [ordem, setOrdem] = React.useState(etapa?.ordem || 1);

  // Atualiza valores ao editar
  useEffect(() => {
    setNome(etapa?.nome || "");
    setCor(etapa?.cor || "#0EA5E9");
    setOrdem(etapa?.ordem || 1);
  }, [etapa, open]);

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    onConfirm({ nome, cor, ordem: Number(ordem) });
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{etapa ? "Editar Etapa" : "Nova Etapa"}</DialogTitle>
          <DialogDescription>
            {etapa ? "Altere os dados da etapa do funil:" : "Informe os dados para nova etapa:"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} required autoFocus maxLength={32}/>
          </div>
          <div>
            <Label htmlFor="cor">Cor</Label>
            <Input id="cor" type="color" value={cor} onChange={e => setCor(e.target.value)} className="w-14 h-8 p-0 border-none" />
          </div>
          <div>
            <Label htmlFor="ordem">Ordem</Label>
            <Input id="ordem" type="number" value={ordem} onChange={e => setOrdem(Number(e.target.value))} min={1} required />
          </div>
          <DialogFooter>
            <Button variant="blue" type="submit">{etapa ? "Salvar" : "Adicionar"}</Button>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
