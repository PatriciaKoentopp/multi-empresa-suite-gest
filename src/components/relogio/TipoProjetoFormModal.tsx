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
import type { RelogioTipoProjeto } from "@/types/relogio";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoProjeto?: RelogioTipoProjeto;
  onSubmit: (data: { nome: string; status: "ativo" | "inativo"; papel_id: string | null }) => Promise<void>;
}

export function TipoProjetoFormModal({ open, onOpenChange, tipoProjeto, onSubmit }: Props) {
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [saving, setSaving] = useState(false);
  const [papelId, setPapelId] = useState<string>("nenhum");
  const [papeis, setPapeis] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    if (open) {
      setNome(tipoProjeto?.nome ?? "");
      setStatus((tipoProjeto?.status as "ativo" | "inativo") ?? "ativo");
      setPapelId(tipoProjeto?.papel_id ?? "nenhum");
      supabase.from("agenda_papeis").select("id, nome").order("nome").then(({ data }) => setPapeis((data || []) as { id: string; nome: string }[]));
    }
  }, [open, tipoProjeto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ nome: nome.trim(), status, papel_id: papelId === "nenhum" ? null : papelId });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tipoProjeto ? "Editar Tipo de Projeto" : "Novo Tipo de Projeto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={papelId} onValueChange={setPapelId}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="nenhum">Nenhum</SelectItem>
                {papeis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
