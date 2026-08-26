import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play } from "lucide-react";
import { toast } from "sonner";
import type { RelogioProjeto, RelogioTipoProjeto, RelogioTarefa } from "@/types/relogio";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetos: RelogioProjeto[];
  tiposProjeto: RelogioTipoProjeto[];
  tarefas: RelogioTarefa[];
  onIniciar: (projetoId: string, tarefaId: string | null) => Promise<void>;
}

export function ApontamentoCronometroModal({
  open,
  onOpenChange,
  projetos,
  tarefas,
  onIniciar,
}: Props) {
  const [projetoId, setProjetoId] = useState<string>("");
  const [tarefaId, setTarefaId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setProjetoId("");
      setTarefaId("");
    }
  }, [open]);

  const projeto = projetos.find((p) => p.id === projetoId);
  const tarefasFiltradas = useMemo(() => {
    if (!projeto?.tipo_projeto_id) return [];
    return tarefas.filter(
      (t) => t.tipo_projeto_id === projeto.tipo_projeto_id && t.status === "ativo"
    );
  }, [projeto, tarefas]);

  const handleStart = async () => {
    if (!projetoId) return toast.error("Selecione um projeto");
    if (!tarefaId && tarefasFiltradas.length > 0)
      return toast.error("Selecione uma tarefa");
    setSaving(true);
    try {
      await onIniciar(projetoId, tarefaId || null);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Cronômetro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Projeto *</Label>
            <Select
              value={projetoId}
              onValueChange={(v) => {
                setProjetoId(v);
                setTarefaId("");
              }}
            >
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 max-h-72">
                {projetos
                  .filter((p) => p.status === "ativo")
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} - {p.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tarefa *</Label>
            <Select
              value={tarefaId}
              onValueChange={setTarefaId}
              disabled={!projeto?.tipo_projeto_id}
            >
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue
                  placeholder={
                    !projeto
                      ? "Selecione um projeto primeiro"
                      : tarefasFiltradas.length === 0
                      ? "Sem tarefas cadastradas"
                      : "Selecione uma tarefa"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 max-h-72">
                {tarefasFiltradas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="blue" onClick={handleStart} disabled={saving || !tarefaId}>
            <Play className="mr-2 h-4 w-4" />
            {saving ? "Iniciando..." : "Iniciar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
