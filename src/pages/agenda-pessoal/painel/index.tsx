import { useMemo, useState } from "react";
import { addDays, addMonths, addWeeks, differenceInCalendarDays, endOfMonth, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TRIADE_INFO, Triade, TipoMedicao, useAgendaMetas, useAgendaPapeis, useAgendaTarefas, fmtMinutos } from "@/hooks/useAgendaPessoal";
import { parseDateString } from "@/lib/utils";

const TRIADES = Object.keys(TRIADE_INFO) as Triade[];

const TIPO_LABEL: Record<TipoMedicao, string> = { quantidade: "Quantidade", tempo: "Tempo", manual: "Manual" };

type TipoPeriodo = "dia" | "semana" | "mes";

export default function PainelTriadePage() {
  const [tipo, setTipo] = useState<TipoPeriodo>("mes");
  const [ref, setRef] = useState(() => new Date());

  const inicioDate = tipo === "dia" ? ref : tipo === "semana" ? startOfWeek(ref, { weekStartsOn: 1 }) : startOfMonth(ref);
  const fimBase = tipo === "dia" ? ref : tipo === "semana" ? addDays(inicioDate, 6) : endOfMonth(ref);
  // No mês, considera apenas os dias transcorridos quando for o mês corrente
  const fimDate = tipo === "mes" && isSameMonth(ref, new Date()) ? new Date() : fimBase;
  const inicio = format(inicioDate, "yyyy-MM-dd");
  const fim = format(fimDate, "yyyy-MM-dd");

  const mover = (d: number) =>
    setRef((r) => (tipo === "dia" ? addDays(r, d) : tipo === "semana" ? addWeeks(r, d) : addMonths(r, d)));

  const periodoLabel =
    tipo === "dia"
      ? format(ref, "dd/MM/yyyy")
      : tipo === "semana"
        ? `${format(inicioDate, "dd/MM")} – ${format(fimDate, "dd/MM/yyyy")}`
        : format(ref, "MMMM 'de' yyyy", { locale: ptBR });

  const { tarefas } = useAgendaTarefas(inicio, fim);
  const { papeis } = useAgendaPapeis();
  const { metas } = useAgendaMetas();

  const dados = useMemo(() => {
    const validas = tarefas.filter((t) => t.status === "concluida");
    const diasPeriodo = differenceInCalendarDays(parseDateString(fim)!, parseDateString(inicio)!) + 1;
    const totalMinutosPeriodo = Math.max(1, diasPeriodo) * 24 * 60;
    const minutosPorPapel = new Map<string | null, number>();
    validas.forEach((t) => {
      const id = papeis.some((p) => p.id === t.papel_id) ? t.papel_id : null;
      minutosPorPapel.set(id, (minutosPorPapel.get(id) ?? 0) + Math.max(0, t.duracao_min || 0));
    });
    const minutosRegistrados = Array.from(minutosPorPapel.values()).reduce((s, n) => s + n, 0);
    const participacaoPapeis = [
      ...papeis.map((p) => ({ id: p.id, name: p.nome, cor: p.cor })),
      { id: null, name: "Sem papel", cor: "var(--chart-5)" },
    ].map((p) => ({ ...p, minutos: minutosPorPapel.get(p.id) ?? 0 }))
      .filter((p) => p.minutos > 0)
      .map((p) => ({ ...p, value: p.minutos / 60 }));
    participacaoPapeis.push({ id: null, name: "Sem tarefa registrada", cor: "var(--muted-foreground)", minutos: Math.max(0, totalMinutosPeriodo - minutosRegistrados), value: Math.max(0, totalMinutosPeriodo - minutosRegistrados) / 60 });
    const usarDuracao = validas.some((t) => t.duracao_min > 0);
    const peso = (t: (typeof validas)[number]) => (usarDuracao ? t.duracao_min : 1);
    const total = validas.reduce((s, t) => s + peso(t), 0);
    const pizza = TRIADES.map((tr) => {
      const v = validas.filter((t) => t.triade === tr).reduce((s, t) => s + peso(t), 0);
      return { name: TRIADE_INFO[tr].label, value: v, cor: TRIADE_INFO[tr].cor, pct: total ? (v / total) * 100 : 0 };
    });
    const porPapel = [
      ...papeis.map((p) => ({ id: p.id as string | null, nome: p.nome })),
      { id: null, nome: "Sem papel" },
    ].map((p) => {
      const lst = validas.filter((t) => t.papel_id === p.id);
      const row: Record<string, number | string> = { nome: p.nome };
      TRIADES.forEach((tr) => { row[tr] = lst.filter((t) => t.triade === tr).reduce((s, t) => s + peso(t), 0); });
      return { row, qtd: lst.length };
    }).filter((x) => x.qtd > 0).map((x) => x.row);
    return {
      usarDuracao,
      total: validas.length,
      concluidas: validas.filter((t) => t.status === "concluida").length,
      horas: validas.reduce((s, t) => s + t.duracao_min, 0) / 60,
      participacaoPapeis,
      totalHorasPeriodo: totalMinutosPeriodo / 60,
      pizza,
      porPapel,
    };
  }, [tarefas, papeis, inicio, fim]);

  const metasAndamento = metas.filter((m) => m.status === "em_andamento");
  const taxa = dados.total ? (dados.concluidas / dados.total) * 100 : 0;
  const unidade = dados.usarDuracao ? "min" : "tarefas";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Painel da Tríade</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(["dia", "semana", "mes"] as const).map((t) => (
            <Button key={t} size="sm" variant={tipo === t ? "default" : "outline"} onClick={() => setTipo(t)}>
              {t === "dia" ? "Dia" : t === "semana" ? "Semana" : "Mês"}
            </Button>
          ))}
          <Button variant="outline" size="icon" onClick={() => mover(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[150px] text-center capitalize">{periodoLabel}</span>
          <Button variant="outline" size="icon" onClick={() => mover(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tarefas no período</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dados.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Concluídas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{taxa.toFixed(0)}%</div><p className="text-xs text-muted-foreground">{dados.concluidas} de {dados.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Horas realizadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dados.horas.toFixed(1).replace(".", ",")}h</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Metas em andamento</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{metasAndamento.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Participação dos papéis nas horas do período</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Total do período: {dados.totalHorasPeriodo.toLocaleString("pt-BR")}h</p>
          <div className="grid items-center gap-4 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={dados.participacaoPapeis.filter((p) => p.value > 0)} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100}>
                  {dados.participacaoPapeis.filter((p) => p.value > 0).map((p) => <Cell key={`${p.id ?? "sem-papel"}-${p.name}`} fill={p.cor} />)}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h (${(Number(value) / dados.totalHorasPeriodo * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {dados.participacaoPapeis.map((p) => (
                <div key={`${p.id ?? "sem-papel"}-${p.name}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: p.cor }} /><span className="break-words">{p.name}</span></span>
                  <span className="shrink-0 tabular-nums">{p.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h · {(p.value / dados.totalHorasPeriodo * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Horas sem tarefa registrada = horas do período menos a duração das tarefas realizadas.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição da Tríade</CardTitle></CardHeader>
          <CardContent>
            {dados.total === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">Sem tarefas no período.</p> : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={dados.pizza} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label={(e: any) => `${e.pct.toFixed(0)}%`}>
                      {dados.pizza.map((p) => <Cell key={p.name} fill={p.cor} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v} ${unidade}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground text-center">Ideal da Tríade do Tempo: cerca de 70% importante, 20% urgente e 10% circunstancial.</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tríade por Papel ({unidade})</CardTitle></CardHeader>
          <CardContent>
            {dados.porPapel.length === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">Sem tarefas no período.</p> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dados.porPapel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  {TRIADES.map((tr) => <Bar key={tr} dataKey={tr} name={TRIADE_INFO[tr].label} stackId="a" fill={TRIADE_INFO[tr].cor} />)}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Progresso das Metas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {metasAndamento.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma meta em andamento.</p>}
          {metasAndamento.map((m) => {
            const pct = m.percentual ?? m.progresso;
            const detalhe =
              m.tipo_medicao === "quantidade"
                ? `${m.realizado ?? 0} / ${m.valor_alvo ?? 0}${m.unidade ? ` ${m.unidade}` : ""}`
                : m.tipo_medicao === "tempo"
                  ? `${fmtMinutos(m.realizado ?? 0)} / ${fmtMinutos(Number(m.valor_alvo || 0) * 60)}`
                  : `${pct}%`;
            return (
              <div key={m.id}>
                <div className="flex justify-between text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{m.titulo}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{TIPO_LABEL[m.tipo_medicao ?? "manual"]}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{detalhe} · {pct}%</span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden mt-1"><div className="h-full bg-blue-500" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
