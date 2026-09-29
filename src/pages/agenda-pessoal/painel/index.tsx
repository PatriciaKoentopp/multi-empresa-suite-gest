import { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TRIADE_INFO, Triade, useAgendaMetas, useAgendaPapeis, useAgendaTarefas } from "@/hooks/useAgendaPessoal";

const TRIADES = Object.keys(TRIADE_INFO) as Triade[];

export default function PainelTriadePage() {
  const [mes, setMes] = useState(() => new Date());
  const inicio = format(startOfMonth(mes), "yyyy-MM-dd");
  const fim = format(endOfMonth(mes), "yyyy-MM-dd");
  const { tarefas } = useAgendaTarefas(inicio, fim);
  const { papeis } = useAgendaPapeis();
  const { metas } = useAgendaMetas();

  const dados = useMemo(() => {
    const validas = tarefas.filter((t) => t.status !== "cancelada");
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
      pizza,
      porPapel,
    };
  }, [tarefas, papeis]);

  const metasAndamento = metas.filter((m) => m.status === "em_andamento");
  const taxa = dados.total ? (dados.concluidas / dados.total) * 100 : 0;
  const unidade = dados.usarDuracao ? "min" : "tarefas";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Painel da Tríade</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMes((d) => addMonths(d, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[150px] text-center capitalize">{format(mes, "MMMM 'de' yyyy", { locale: ptBR })}</span>
          <Button variant="outline" size="icon" onClick={() => setMes((d) => addMonths(d, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tarefas no mês</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dados.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Concluídas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{taxa.toFixed(0)}%</div><p className="text-xs text-muted-foreground">{dados.concluidas} de {dados.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Horas planejadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dados.horas.toFixed(1).replace(".", ",")}h</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Metas em andamento</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{metasAndamento.length}</div></CardContent></Card>
      </div>

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
          {metasAndamento.map((m) => (
            <div key={m.id}>
              <div className="flex justify-between text-sm"><span>{m.titulo}</span><span>{m.progresso}%</span></div>
              <div className="h-2 rounded bg-muted overflow-hidden mt-1"><div className="h-full bg-blue-500" style={{ width: `${m.progresso}%` }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
