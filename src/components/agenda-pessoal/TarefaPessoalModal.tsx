import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AgendaMeta, AgendaPapel, AgendaTarefa, TRIADE_INFO, Triade, calcDuracao, fmtHora,
} from "@/hooks/useAgendaPessoal";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tarefa?: AgendaTarefa;
  dataPadrao?: string;
  papeis: AgendaPapel[];
  metas: AgendaMeta[];
  onSave: (t: Partial<AgendaTarefa>, id?: string) => Promise<boolean>;
}

const NENHUM = "nenhum";

export function TarefaPessoalModal({ open, onOpenChange, tarefa, dataPadrao, papeis, metas, onSave }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [triade, setTriade] = useState<Triade>("importante");
  const [papelId, setPapelId] = useState(NENHUM);
  const [metaId, setMetaId] = useState(NENHUM);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitulo(tarefa?.titulo ?? "");
    setDescricao(tarefa?.descricao ?? "");
    setData(tarefa?.data ?? dataPadrao ?? "");
    setHoraInicio(fmtHora(tarefa?.hora_inicio));
    setHoraFim(fmtHora(tarefa?.hora_fim));
    setTriade(tarefa?.triade ?? "importante");
    setPapelId(tarefa?.papel_id ?? NENHUM);
    setMetaId(tarefa?.meta_id ?? NENHUM);
  }, [open, tarefa, dataPadrao]);

  const handleSalvar = async () => {
    if (!titulo.trim()) return toast.error("Informe o título");
    if (!data) return toast.error("Informe a data");
    if (horaInicio && horaFim && calcDuracao(horaInicio, horaFim) === 0)
      return toast.error("A hora final deve ser maior que a inicial");
    setSalvando(true);
    const ok = await onSave(
      {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data,
        hora_inicio: horaInicio || null,
        hora_fim: horaFim || null,
        duracao_min: calcDuracao(horaInicio, horaFim),
        triade,
        papel_id: papelId === NENHUM ? null : papelId,
        meta_id: metaId === NENHUM ? null : metaId,
      },
      tarefa?.id,
    );
    setSalvando(false);
    if (ok) onOpenChange(false);
  };

  const metasAtivas = metas.filter((m) => m.status === "em_andamento" || m.id === tarefa?.meta_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Início</Label>
              <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Fim</Label>
              <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tríade do Tempo</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TRIADE_INFO) as Triade[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTriade(t)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    triade === t ? TRIADE_INFO[t].chip + " ring-2 ring-offset-1" : "bg-background text-muted-foreground"
                  }`}
                >
                  {TRIADE_INFO[t].label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Papel</Label>
              <Select value={papelId} onValueChange={setPapelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NENHUM}>Nenhum</SelectItem>
                  {papeis.filter((p) => p.ativo || p.id === tarefa?.papel_id).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Meta</Label>
              <Select value={metaId} onValueChange={setMetaId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NENHUM}>Nenhuma</SelectItem>
                  {metasAtivas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
