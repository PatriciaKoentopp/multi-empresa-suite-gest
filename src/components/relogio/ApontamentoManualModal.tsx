import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn, formatDate, dateToISOString, parseDateString } from "@/lib/utils";
import { toast } from "sonner";
import type { RelogioProjeto, RelogioTipoProjeto, RelogioTarefa, RelogioApontamento } from "@/types/relogio";
import {
  ApontamentoPayload,
  calcularDuracaoDecimal,
} from "@/hooks/useApontamentosRelogio";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetos: RelogioProjeto[];
  tiposProjeto: RelogioTipoProjeto[];
  tarefas: RelogioTarefa[];
  apontamento?: RelogioApontamento;
  onSubmit: (payload: ApontamentoPayload, id?: string) => Promise<void>;
}

export function ApontamentoManualModal({
  open,
  onOpenChange,
  projetos,
  tiposProjeto,
  tarefas,
  apontamento,
  onSubmit,
}: Props) {
  const [projetoId, setProjetoId] = useState<string>("");
  const [tarefaId, setTarefaId] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [horaInicio, setHoraInicio] = useState<string>("");
  const [horaFim, setHoraFim] = useState<string>("");
  const [observacao, setObservacao] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (apontamento) {
        setProjetoId(apontamento.projeto_id);
        setTarefaId(apontamento.tarefa_id || "");
        setData(apontamento.data);
        setDataFim(apontamento.data);
        setHoraInicio(apontamento.hora_inicio?.slice(0, 5) || "");
        setHoraFim(apontamento.hora_fim?.slice(0, 5) || "");
        setObservacao(apontamento.observacao || "");
      } else {
        setProjetoId("");
        setTarefaId("");
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        setData(today);
        setDataFim(today);
        setHoraInicio("");
        setHoraFim("");
        setObservacao("");
      }
    }
  }, [open, apontamento]);

  const projeto = projetos.find((p) => p.id === projetoId);
  const tarefasFiltradas = useMemo(() => {
    if (!projeto?.tipo_projeto_id) return [];
    return tarefas.filter(
      (t) => t.tipo_projeto_id === projeto.tipo_projeto_id && t.status === "ativo"
    );
  }, [projeto, tarefas]);

  const duracao = useMemo(() => {
    if (!horaInicio || !horaFim || !data) return 0;
    const ini = new Date(`${data}T${horaInicio}:00`);
    const fim = new Date(`${dataFim || data}T${horaFim}:00`);
    const diff = (fim.getTime() - ini.getTime()) / 1000;
    if (diff <= 0) return 0;
    return Math.round((diff / 3600) * 100) / 100;
  }, [data, dataFim, horaInicio, horaFim]);


  const handleSave = async () => {
    if (!projetoId) return toast.error("Selecione um projeto");
    if (!tarefaId && tarefasFiltradas.length > 0)
      return toast.error("Selecione uma tarefa");
    if (!data) return toast.error("Informe a data inicial");
    if (!horaInicio || !horaFim) return toast.error("Informe hora inicial e final");
    if (duracao <= 0) return toast.error("A hora/data final deve ser maior que a inicial");


    setSaving(true);
    try {
      await onSubmit(
        {
          projeto_id: projetoId,
          tarefa_id: tarefaId || null,
          data,
          hora_inicio: horaInicio + ":00",
          hora_fim: horaFim + ":00",
          duracao_decimal: duracao,
          origem: apontamento?.origem || "manual",
          status: "concluido",
          observacao: observacao || null,
        },
        apontamento?.id
      );
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const dateObj = data ? parseDateString(data) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {apontamento ? "Editar Apontamento" : "Novo Apontamento"}
          </DialogTitle>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data inicial *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white dark:bg-gray-900",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? formatDate(data) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={dateObj}
                    onSelect={(d) => {
                      if (d) {
                        const iso = dateToISOString(d) || "";
                        setData(iso);
                        if (!dataFim || dataFim < iso) setDataFim(iso);
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Data final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white dark:bg-gray-900",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? formatDate(dataFim) : "Mesmo dia"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim ? parseDateString(dataFim) : undefined}
                    onSelect={(d) => {
                      if (d) setDataFim(dateToISOString(d) || "");
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>


          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Hora inicial *</Label>
              <Input
                type="time"
                step={60}
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Hora final *</Label>
              <Input
                type="time"
                step={60}
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
              />
            </div>
            <div>
              <Label>Duração</Label>
              <Input value={`${duracao.toFixed(2)}h`} readOnly className="bg-muted" />
            </div>
          </div>

          <div>
            <Label>Observação</Label>
            <Textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="blue"
            onClick={handleSave}
            disabled={saving || !projetoId || (!tarefaId && tarefasFiltradas.length > 0)}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
