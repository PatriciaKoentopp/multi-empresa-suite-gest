import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import {
  AgendaTarefa, TRIADE_INFO, fmtData, fmtHora, fmtMinutos,
  useAgendaMetas, useAgendaPapeis, useAgendaTarefas,
} from "@/hooks/useAgendaPessoal";

const TODOS = "todos";

export default function TarefasRealizadasPage() {
  const hoje = format(new Date(), "yyyy-MM-dd");
  const primeiroDiaMes = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

  const [de, setDe] = useState(primeiroDiaMes);
  const [ate, setAte] = useState(hoje);
  const [papelFiltro, setPapelFiltro] = useState(TODOS);

  const { papeis } = useAgendaPapeis();
  const { metas } = useAgendaMetas();
  const { tarefas, isLoading } = useAgendaTarefas(de, ate);

  const papelMap = useMemo(() => new Map(papeis.map((p) => [p.id, p])), [papeis]);
  const metaMap = useMemo(() => new Map(metas.map((m) => [m.id, m])), [metas]);

  const realizadas = useMemo(() => {
    return tarefas
      .filter((t) => t.status === "concluida")
      .filter((t) => papelFiltro === TODOS || t.papel_id === papelFiltro)
      .sort((a, b) => {
        if (a.data !== b.data) return a.data < b.data ? 1 : -1;
        return (a.hora_inicio ?? "") < (b.hora_inicio ?? "") ? 1 : (a.hora_inicio ?? "") > (b.hora_inicio ?? "") ? -1 : 0;
      });
  }, [tarefas, papelFiltro]);

  const totalMinutos = realizadas.reduce((s, t) => s + (Number(t.duracao_min) || 0), 0);

  const horario = (t: AgendaTarefa) => {
    if (!t.hora_inicio) return "-";
    return `${fmtHora(t.hora_inicio)}${t.hora_fim ? ` - ${fmtHora(t.hora_fim)}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tarefas Realizadas</h1>

      <Card>
        <CardContent className="flex flex-col md:flex-row md:items-end gap-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="de">De</Label>
            <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div className="grid gap-2 md:w-[220px]">
            <Label>Papel</Label>
            <Select value={papelFiltro} onValueChange={setPapelFiltro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {papeis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 md:ml-auto">
            <Button variant="outline" onClick={() => { setDe(primeiroDiaMes); setAte(hoje); setPapelFiltro(TODOS); }}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> {realizadas.length} tarefa(s) realizada(s)</span>
        <span>Total: {fmtMinutos(totalMinutos)}</span>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Meta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : realizadas.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhuma tarefa realizada no período</TableCell></TableRow>
            ) : realizadas.map((t) => {
              const papel = t.papel_id ? papelMap.get(t.papel_id) : undefined;
              const meta = t.meta_id ? metaMap.get(t.meta_id) : undefined;
              return (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">{fmtData(t.data)}</TableCell>
                  <TableCell className="whitespace-nowrap">{horario(t)}</TableCell>
                  <TableCell className="font-medium">{t.titulo}</TableCell>
                  <TableCell className="max-w-[320px] whitespace-pre-line break-words text-sm text-muted-foreground">{t.descricao || "-"}</TableCell>
                  <TableCell>{papel ? <span className="text-sm px-1 rounded" style={{ background: papel.cor + "22", color: papel.cor }}>{papel.nome}</span> : "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{t.duracao_min > 0 ? fmtMinutos(t.duracao_min) : "-"}</TableCell>
                  <TableCell>{meta ? meta.titulo : "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
