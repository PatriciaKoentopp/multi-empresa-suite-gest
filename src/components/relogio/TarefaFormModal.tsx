import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RelogioTarefa } from "@/types/relogio";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa?: RelogioTarefa;
  tipoProjetoId: string;
  onSubmit: (data: {
    tipo_projeto_id: string;
    nome: string;
    status: "ativo" | "inativo";
    percentual_tempo_estimado: number;
  }) => Promise<void>;
}

export function TarefaFormModal({ open, onOpenChange, tarefa, tipoProjetoId, onSubmit }: Props) {
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [percentual, setPercentual] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(tarefa?.nome ?? "");
      setStatus((tarefa?.status as "ativo" | "inativo") ?? "ativo");
      setPercentual(tarefa ? String(tarefa.percentual_tempo_estimado) : "0");
    }
  }, [open, tarefa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    const pct = Number(String(percentual).replace(",", "."));
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    setSaving(true);
    try {
      await onSubmit({
        tipo_projeto_id: tipoProjetoId,
        nome: nome.trim(),
        status,
        percentual_tempo_estimado: pct,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-tarefa">Nome</Label>
            <Input
              id="nome-tarefa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pct">% Tempo Estimado</Label>
            <div className="relative">
              <Input
                id="pct"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "ativo" | "inativo")}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                <SelectItem value="inativo" className="text-red-600">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
