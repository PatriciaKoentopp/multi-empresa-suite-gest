import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  Calendar as CalendarIcon,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Trophy,
  Hourglass,
  RefreshCw,
  ChevronsUpDown,
  Check,
  CalendarRange,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApontamentosRelogio, type PeriodoFiltro } from "@/hooks/useApontamentosRelogio";
import { useProjetosRelogio } from "@/hooks/useProjetosRelogio";
import { useTiposProjetoRelogio } from "@/hooks/useTiposProjetoRelogio";
import { cn, formatDate } from "@/lib/utils";

// ---------- helpers ----------
const pad = (n: number) => String(n).padStart(2, "0");
const isoFromDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
};
const formatHoras = (decimal: number): string => {
  if (!decimal || decimal <= 0) return "0h";
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${pad(m)}m`;
};
const fmtNum = (n: number, d = 1) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MES_LONGO = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Paleta de cores alinhada ao Painel de Vendas
const CHART_COLORS = [
  "#4CAF50", // Verde
  "#2196F3", // Azul
  "#FFC107", // Amarelo
  "#9C27B0", // Roxo
  "#FF5722", // Laranja
  "#795548", // Marrom
  "#607D8B", // Azul Acinzentado
  "#E91E63", // Rosa
  "#3F51B5", // Índigo
  "#CDDC39", // Lima
  "#009688", // Verde-azulado
  "#FF9800", // Âmbar
];
function projetoColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CHART_COLORS[h % CHART_COLORS.length];
}

// Intervalo a partir do PeriodoFiltro
function intervaloPeriodo(
  p: PeriodoFiltro,
  custom?: { inicio?: string | null; fim?: string | null }
): { inicio: string; fim: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const f = (d: Date) => isoFromDate(d);
  switch (p) {
    case "semana_atual": {
      const i = new Date(hoje); i.setDate(hoje.getDate() - hoje.getDay());
      const fim = new Date(i); fim.setDate(i.getDate() + 6);
      return { inicio: f(i), fim: f(fim) };
    }
    case "mes_atual": {
      const i = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return { inicio: f(i), fim: f(fim) };
    }
    case "mes_anterior": {
      const i = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return { inicio: f(i), fim: f(fim) };
    }
    case "ano_atual": {
      const i = new Date(hoje.getFullYear(), 0, 1);
      return { inicio: f(i), fim: f(hoje) };
    }
    case "ano_anterior": {
      const i = new Date(hoje.getFullYear() - 1, 0, 1);
      const fim = new Date(hoje.getFullYear() - 1, 11, 31);
      return { inicio: f(i), fim: f(fim) };
    }
    case "personalizado": {
      return {
        inicio: custom?.inicio || f(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
        fim: custom?.fim || f(hoje),
      };
    }
    case "todos":
    default: {
      const i = new Date(hoje.getFullYear() - 5, 0, 1);
      return { inicio: f(i), fim: f(hoje) };
    }
  }
}

// Período anterior de mesmo tamanho
function periodoAnterior(inicioIso: string, fimIso: string) {
  const ini = parseIso(inicioIso);
  const fim = parseIso(fimIso);
  const dias = Math.round((fim.getTime() - ini.getTime()) / 86400000) + 1;
  const fimAnt = new Date(ini);
  fimAnt.setDate(ini.getDate() - 1);
  const iniAnt = new Date(fimAnt);
  iniAnt.setDate(fimAnt.getDate() - (dias - 1));
  return { inicio: isoFromDate(iniAnt), fim: isoFromDate(fimAnt) };
}

type KpiIconColor = "blue" | "green" | "purple" | "amber";
interface KpiProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  variation?: number | null;
  tone?: "positive" | "negative" | "neutral";
  iconColor?: KpiIconColor;
}
function KpiCard({ icon, label, value, sub, variation, tone = "neutral", iconColor = "blue" }: KpiProps) {
  const showVar = variation !== null && variation !== undefined && isFinite(variation);
  const positive = (variation ?? 0) >= 0;
  const iconClasses: Record<KpiIconColor, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", iconClasses[iconColor])}>{icon}</div>
              <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="text-2xl font-bold">{value}</div>
            {sub && <div className="text-sm text-muted-foreground mt-1">{sub}</div>}
            {showVar && (
              <div
                className={cn(
                  "flex items-center text-sm font-medium px-2.5 py-1.5 rounded-full mt-2 w-fit",
                  tone === "negative"
                    ? "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                    : tone === "positive"
                    ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                    : positive
                    ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                    : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {positive ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
                {positive ? "+" : ""}{fmtNum(variation!, 1)}% vs período anterior
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PainelTempoRelogioPage() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("mes_atual");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [projetoFilter, setProjetoFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [projetoOpen, setProjetoOpen] = useState(false);

  const intervaloAtual = useMemo(
    () => intervaloPeriodo(periodo, { inicio: dataInicio, fim: dataFim }),
    [periodo, dataInicio, dataFim]
  );
  const intervaloPrev = useMemo(
    () => periodoAnterior(intervaloAtual.inicio, intervaloAtual.fim),
    [intervaloAtual.inicio, intervaloAtual.fim]
  );

  // Janela do comparativo histórico: período atual + 12 meses anteriores (para Δ YoY)
  const janela12m = useMemo(() => {
    const ini = parseIso(intervaloAtual.inicio);
    const iniYoY = new Date(ini.getFullYear() - 1, ini.getMonth(), 1);
    return { inicio: isoFromDate(iniYoY), fim: intervaloAtual.fim };
  }, [intervaloAtual.inicio, intervaloAtual.fim]);

  // Fetches
  const { apontamentos: apontPeriodo, isLoading: loadingPeriodo, refetch: refetchPeriodo } =
    useApontamentosRelogio("personalizado", intervaloAtual.inicio, intervaloAtual.fim);
  const { apontamentos: apontPrev, refetch: refetchPrev } =
    useApontamentosRelogio("personalizado", intervaloPrev.inicio, intervaloPrev.fim);
  const { apontamentos: apont12m, refetch: refetch12m } =
    useApontamentosRelogio("personalizado", janela12m.inicio, janela12m.fim);

  const { projetos } = useProjetosRelogio();
  const { tiposProjeto, tarefas } = useTiposProjetoRelogio();

  const projetoMap = useMemo(() => {
    const m = new Map<string, { codigo: string; nome: string; tipo_id: string | null; favorecido_id: string | null }>();
    projetos.forEach((p) =>
      m.set(p.id, {
        codigo: p.codigo,
        nome: p.nome,
        tipo_id: p.tipo_projeto_id ?? null,
        favorecido_id: p.favorecido_id ?? null,
      })
    );
    return m;
  }, [projetos]);

  const tipoMap = useMemo(() => {
    const m = new Map<string, string>();
    tiposProjeto.forEach((t) => m.set(t.id, t.nome));
    return m;
  }, [tiposProjeto]);

  // Aplica filtros (projeto + tipo)
  const aplicaFiltros = (rows: typeof apontPeriodo) =>
    rows.filter((a) => {
      if (a.status !== "concluido") return false;
      if (projetoFilter !== "todos" && a.projeto_id !== projetoFilter) return false;
      if (tipoFilter !== "todos") {
        const p = projetoMap.get(a.projeto_id);
        if (!p || p.tipo_id !== tipoFilter) return false;
      }
      return true;
    });

  const dadosAtual = useMemo(() => aplicaFiltros(apontPeriodo), [apontPeriodo, projetoFilter, tipoFilter, projetoMap]);
  const dadosPrev = useMemo(() => aplicaFiltros(apontPrev), [apontPrev, projetoFilter, tipoFilter, projetoMap]);
  const dados12m = useMemo(() => aplicaFiltros(apont12m), [apont12m, projetoFilter, tipoFilter, projetoMap]);

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    const sum = (rows: typeof dadosAtual) =>
      rows.reduce((acc, r) => acc + Number(r.duracao_decimal || 0), 0);
    const totalAtual = sum(dadosAtual);
    const totalPrev = sum(dadosPrev);
    const variacao =
      totalPrev > 0 ? ((totalAtual - totalPrev) / totalPrev) * 100 : totalAtual > 0 ? 100 : 0;

    const diasSet = new Set(dadosAtual.map((r) => r.data));
    const diasTrab = diasSet.size;
    const projetosAtivos = new Set(dadosAtual.map((r) => r.projeto_id)).size;

    // Maior dia
    const totaisPorDia = new Map<string, number>();
    dadosAtual.forEach((r) => {
      totaisPorDia.set(r.data, (totaisPorDia.get(r.data) || 0) + Number(r.duracao_decimal || 0));
    });
    let maiorDia = { data: "", total: 0 };
    totaisPorDia.forEach((v, k) => { if (v > maiorDia.total) maiorDia = { data: k, total: v }; });

    // Maior projeto
    const totaisProj = new Map<string, number>();
    dadosAtual.forEach((r) => {
      totaisProj.set(r.projeto_id, (totaisProj.get(r.projeto_id) || 0) + Number(r.duracao_decimal || 0));
    });
    let maiorProj = { id: "", total: 0 };
    totaisProj.forEach((v, k) => { if (v > maiorProj.total) maiorProj = { id: k, total: v }; });

    // Hoje / semana
    const hojeIso = isoFromDate(new Date());
    const horasHoje = dadosAtual
      .filter((r) => r.data === hojeIso)
      .reduce((a, r) => a + Number(r.duracao_decimal || 0), 0);

    const inicioSemana = new Date();
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const iniSemIso = isoFromDate(inicioSemana);
    const horasSemana = dadosAtual
      .filter((r) => r.data >= iniSemIso)
      .reduce((a, r) => a + Number(r.duracao_decimal || 0), 0);

    return {
      totalAtual,
      variacao,
      diasTrab,
      mediaDia: diasTrab > 0 ? totalAtual / diasTrab : 0,
      projetosAtivos,
      maiorDia,
      maiorProj,
      horasHoje,
      horasSemana,
      qtd: dadosAtual.length,
      mediaApont: dadosAtual.length > 0 ? totalAtual / dadosAtual.length : 0,
    };
  }, [dadosAtual, dadosPrev]);

  // ---------- Comparativo mensal (segue o filtro de período) ----------
  const mensal = useMemo(() => {
    let ini = parseIso(intervaloAtual.inicio);
    const fim = parseIso(intervaloAtual.fim);
    // Quando "todos": começa a partir da data do apontamento mais antigo
    if (periodo === "todos" && dados12m.length > 0) {
      const minData = dados12m.reduce((m, r) => (r.data < m ? r.data : m), dados12m[0].data);
      ini = parseIso(minData);
    }
    const meses: { key: string; label: string; ano: number; mes: number }[] = [];
    const cursor = new Date(ini.getFullYear(), ini.getMonth(), 1);
    const limite = new Date(fim.getFullYear(), fim.getMonth(), 1);
    while (cursor <= limite) {
      meses.push({
        key: `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`,
        label: `${MES_CURTO[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(2)}`,
        ano: cursor.getFullYear(),
        mes: cursor.getMonth(),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const totais = new Map<string, { horas: number; dias: Set<string> }>();
    meses.forEach((m) => totais.set(m.key, { horas: 0, dias: new Set() }));
    dados12m.forEach((r) => {
      const k = r.data.substring(0, 7);
      const t = totais.get(k);
      if (t) {
        t.horas += Number(r.duracao_decimal || 0);
        t.dias.add(r.data);
      }
    });

    // Para Δ YoY precisamos dos meses do ano anterior — buscamos no mesmo dataset
    const horasMesYoY = new Map<string, number>();
    dados12m.forEach((r) => {
      const k = r.data.substring(0, 7);
      horasMesYoY.set(k, (horasMesYoY.get(k) || 0) + Number(r.duracao_decimal || 0));
    });

    const chart = meses.map((m, idx) => {
      const t = totais.get(m.key)!;
      // média móvel 3 meses
      const ini = Math.max(0, idx - 2);
      const slice = meses.slice(ini, idx + 1);
      const mm = slice.reduce((a, x) => a + (totais.get(x.key)!.horas), 0) / slice.length;
      return {
        mes: m.label,
        horas: Math.round(t.horas * 10) / 10,
        media3m: Math.round(mm * 10) / 10,
        dias: t.dias.size,
        mediaDia: t.dias.size > 0 ? Math.round((t.horas / t.dias.size) * 10) / 10 : 0,
        key: m.key,
      };
    });

    const tabela = chart.map((row, idx) => {
      const prev = idx > 0 ? chart[idx - 1].horas : 0;
      const deltaPrev = prev > 0 ? ((row.horas - prev) / prev) * 100 : row.horas > 0 ? 100 : 0;
      const [y, mo] = row.key.split("-").map(Number);
      const yoyKey = `${y - 1}-${pad(mo)}`;
      const yoyHoras = horasMesYoY.get(yoyKey) ?? 0;
      const deltaYoY = yoyHoras > 0 ? ((row.horas - yoyHoras) / yoyHoras) * 100 : row.horas > 0 ? null : 0;
      return { ...row, deltaPrev, deltaYoY };
    });

    return { chart, tabela };
  }, [dados12m, intervaloAtual.inicio, intervaloAtual.fim, periodo]);

  // ---------- Performance por Projeto ----------
  const perfProjetos = useMemo(() => {
    const agg = new Map<string, { horas: number; dias: Set<string>; ultima: string }>();
    dadosAtual.forEach((r) => {
      const e = agg.get(r.projeto_id) || { horas: 0, dias: new Set(), ultima: "" };
      e.horas += Number(r.duracao_decimal || 0);
      e.dias.add(r.data);
      if (r.data > e.ultima) e.ultima = r.data;
      agg.set(r.projeto_id, e);
    });
    const aggPrev = new Map<string, number>();
    dadosPrev.forEach((r) => {
      aggPrev.set(r.projeto_id, (aggPrev.get(r.projeto_id) || 0) + Number(r.duracao_decimal || 0));
    });
    const total = Array.from(agg.values()).reduce((a, b) => a + b.horas, 0);
    const arr = Array.from(agg.entries()).map(([id, e]) => {
      const p = projetoMap.get(id);
      const prev = aggPrev.get(id) || 0;
      const variacao = prev > 0 ? ((e.horas - prev) / prev) * 100 : e.horas > 0 ? 100 : 0;
      return {
        id,
        codigo: p?.codigo || "—",
        nome: p?.nome || "—",
        tipo: p?.tipo_id ? tipoMap.get(p.tipo_id) || "" : "",
        horas: e.horas,
        pct: total > 0 ? (e.horas / total) * 100 : 0,
        dias: e.dias.size,
        ultima: e.ultima,
        variacao,
      };
    }).sort((a, b) => b.horas - a.horas);
    return { lista: arr, total };
  }, [dadosAtual, dadosPrev, projetoMap, tipoMap]);

  const topProjChart = useMemo(
    () => perfProjetos.lista.slice(0, 10).map((p) => ({
      name: `${p.codigo}`,
      nome: p.nome,
      horas: Math.round(p.horas * 10) / 10,
      pct: Math.round(p.pct * 10) / 10,
      id: p.id,
    })),
    [perfProjetos]
  );

  // ---------- Tipo de projeto ----------
  const perfTipos = useMemo(() => {
    const agg = new Map<string, number>();
    const aggPrev = new Map<string, number>();
    dadosAtual.forEach((r) => {
      const p = projetoMap.get(r.projeto_id);
      const tid = p?.tipo_id || "sem_tipo";
      agg.set(tid, (agg.get(tid) || 0) + Number(r.duracao_decimal || 0));
    });
    dadosPrev.forEach((r) => {
      const p = projetoMap.get(r.projeto_id);
      const tid = p?.tipo_id || "sem_tipo";
      aggPrev.set(tid, (aggPrev.get(tid) || 0) + Number(r.duracao_decimal || 0));
    });
    const total = Array.from(agg.values()).reduce((a, b) => a + b, 0);
    return Array.from(agg.entries()).map(([id, horas]) => {
      const prev = aggPrev.get(id) || 0;
      const variacao = prev > 0 ? ((horas - prev) / prev) * 100 : horas > 0 ? 100 : 0;
      return {
        id,
        nome: id === "sem_tipo" ? "Sem tipo" : (tipoMap.get(id) || "—"),
        horas: Math.round(horas * 10) / 10,
        pct: total > 0 ? (horas / total) * 100 : 0,
        variacao,
      };
    }).sort((a, b) => b.horas - a.horas);
  }, [dadosAtual, dadosPrev, projetoMap, tipoMap]);

  // ---------- Heatmap dia da semana x faixa horária ----------
  const heatmap = useMemo(() => {
    // 7 dias x 6 faixas (0-4, 4-8, 8-12, 12-16, 16-20, 20-24)
    const grid: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0));
    dadosAtual.forEach((r) => {
      const d = parseIso(r.data);
      const dow = d.getDay();
      const h = parseInt((r.hora_inicio || "00:00").substring(0, 2), 10) || 0;
      const slot = Math.min(5, Math.floor(h / 4));
      grid[dow][slot] += Number(r.duracao_decimal || 0);
    });
    let max = 0;
    grid.forEach((row) => row.forEach((v) => { if (v > max) max = v; }));
    return { grid, max };
  }, [dadosAtual]);

  // ---------- Curva diária acumulada (atual vs anterior) ----------
  const curva = useMemo(() => {
    const ini = parseIso(intervaloAtual.inicio);
    const fim = parseIso(intervaloAtual.fim);
    const dias = Math.round((fim.getTime() - ini.getTime()) / 86400000) + 1;

    const atualMap = new Map<string, number>();
    dadosAtual.forEach((r) => {
      atualMap.set(r.data, (atualMap.get(r.data) || 0) + Number(r.duracao_decimal || 0));
    });
    const prevMap = new Map<string, number>();
    dadosPrev.forEach((r) => {
      prevMap.set(r.data, (prevMap.get(r.data) || 0) + Number(r.duracao_decimal || 0));
    });

    const iniPrev = parseIso(intervaloPrev.inicio);
    const arr: { dia: string; atual: number; anterior: number }[] = [];
    let acA = 0, acP = 0;
    for (let i = 0; i < dias; i++) {
      const dA = new Date(ini); dA.setDate(ini.getDate() + i);
      const dP = new Date(iniPrev); dP.setDate(iniPrev.getDate() + i);
      acA += atualMap.get(isoFromDate(dA)) || 0;
      acP += prevMap.get(isoFromDate(dP)) || 0;
      arr.push({
        dia: `${pad(dA.getDate())}/${pad(dA.getMonth() + 1)}`,
        atual: Math.round(acA * 10) / 10,
        anterior: Math.round(acP * 10) / 10,
      });
    }
    return arr;
  }, [dadosAtual, dadosPrev, intervaloAtual, intervaloPrev]);

  // ---------- Aderência por tarefa ----------
  const aderencia = useMemo(() => {
    const horasPorTarefa = new Map<string, number>();
    const horasPorTipo = new Map<string, number>();
    dadosAtual.forEach((r) => {
      const dur = Number(r.duracao_decimal || 0);
      if (r.tarefa_id) horasPorTarefa.set(r.tarefa_id, (horasPorTarefa.get(r.tarefa_id) || 0) + dur);
      const p = projetoMap.get(r.projeto_id);
      if (p?.tipo_id) horasPorTipo.set(p.tipo_id, (horasPorTipo.get(p.tipo_id) || 0) + dur);
    });
    const lista = tarefas
      .filter((t) => horasPorTarefa.has(t.id))
      .map((t) => {
        const real = horasPorTarefa.get(t.id) || 0;
        const totalTipo = horasPorTipo.get(t.tipo_projeto_id) || 0;
        const pctReal = totalTipo > 0 ? (real / totalTipo) * 100 : 0;
        const pctEsperado = Number(t.percentual_tempo_estimado || 0);
        const desvio = pctReal - pctEsperado;
        return {
          id: t.id,
          nome: t.nome,
          tipo: tipoMap.get(t.tipo_projeto_id) || "",
          horas: real,
          pctReal,
          pctEsperado,
          desvio,
        };
      })
      .sort((a, b) => Math.abs(b.desvio) - Math.abs(a.desvio))
      .slice(0, 10);
    return lista;
  }, [dadosAtual, tarefas, projetoMap, tipoMap]);

  // ---------- Alertas ----------
  const alertas = useMemo(() => {
    const hojeIso = isoFromDate(new Date());
    const limite = new Date(); limite.setDate(limite.getDate() - 14);
    const limiteIso = isoFromDate(limite);

    // Última atividade global (12m + período)
    const ultimaPorProj = new Map<string, string>();
    [...dados12m, ...dadosAtual].forEach((r) => {
      const cur = ultimaPorProj.get(r.projeto_id);
      if (!cur || r.data > cur) ultimaPorProj.set(r.projeto_id, r.data);
    });
    const inativos = projetos
      .filter((p) => p.status === "ativo")
      .map((p) => ({ p, ultima: ultimaPorProj.get(p.id) || "" }))
      .filter((x) => !x.ultima || x.ultima < limiteIso)
      .slice(0, 8);

    // Em andamento
    const emAberto = [...apontPeriodo, ...apont12m]
      .filter((r) => r.status === "em_andamento")
      // dedup
      .reduce<typeof apontPeriodo>((acc, cur) => {
        if (!acc.some((x) => x.id === cur.id)) acc.push(cur);
        return acc;
      }, []);

    // Dias úteis sem apontamento no período
    const diasSet = new Set(dadosAtual.map((r) => r.data));
    const ini = parseIso(intervaloAtual.inicio);
    const fim = parseIso(intervaloAtual.fim);
    const fimLimit = fim > new Date() ? new Date() : fim;
    let diasUteis = 0;
    let diasUteisSem = 0;
    for (let d = new Date(ini); d <= fimLimit; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue;
      diasUteis++;
      if (!diasSet.has(isoFromDate(d))) diasUteisSem++;
    }

    return { inativos, emAberto, diasUteis, diasUteisSem };
  }, [projetos, dados12m, dadosAtual, apontPeriodo, apont12m, intervaloAtual]);

  const projetoFilterLabel =
    projetoFilter === "todos"
      ? "Todos os projetos"
      : (() => {
          const p = projetoMap.get(projetoFilter);
          return p ? `${p.codigo} - ${p.nome}` : "Projeto";
        })();

  const refetchAll = () => { refetchPeriodo(); refetchPrev(); refetch12m(); };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Painel de Tempo</h1>
            <p className="text-sm text-muted-foreground">
              Métricas, comparativos e indicadores de performance dos apontamentos.
            </p>
          </div>
          <Button variant="outline" onClick={refetchAll} disabled={loadingPeriodo}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loadingPeriodo && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-full sm:w-[200px]">
                <label className="text-xs font-medium text-muted-foreground">Período</label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semana_atual">Semana atual</SelectItem>
                    <SelectItem value="mes_atual">Mês atual</SelectItem>
                    <SelectItem value="mes_anterior">Mês anterior</SelectItem>
                    <SelectItem value="ano_atual">Ano atual</SelectItem>
                    <SelectItem value="ano_anterior">Ano anterior</SelectItem>
                    <SelectItem value="todos">Tudo</SelectItem>
                    <SelectItem value="personalizado">Definir período</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodo === "personalizado" && (
                <>
                  <div className="w-full sm:w-[170px]">
                    <label className="text-xs font-medium text-muted-foreground">Data inicial</label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="w-full sm:w-[170px]">
                    <label className="text-xs font-medium text-muted-foreground">Data final</label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <div className="w-full sm:w-[220px]">
                <label className="text-xs font-medium text-muted-foreground">Tipo de projeto</label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {tiposProjeto.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-[280px]">
                <label className="text-xs font-medium text-muted-foreground">Projeto</label>
                <Popover open={projetoOpen} onOpenChange={setProjetoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-white dark:bg-gray-900 font-normal mt-1"
                    >
                      <span className="truncate">{projetoFilterLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 bg-white dark:bg-gray-800" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar projeto..." />
                      <CommandList>
                        <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="todos" onSelect={() => { setProjetoFilter("todos"); setProjetoOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", projetoFilter === "todos" ? "opacity-100" : "opacity-0")} />
                            Todos os projetos
                          </CommandItem>
                          {projetos.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.codigo} ${p.nome}`}
                              onSelect={() => { setProjetoFilter(p.id); setProjetoOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", projetoFilter === p.id ? "opacity-100" : "opacity-0")} />
                              {p.codigo} - {p.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <CalendarRange className="h-3.5 w-3.5" />
                {formatDate(intervaloAtual.inicio)} a {formatDate(intervaloAtual.fim)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            iconColor="blue"
            icon={<Clock className="h-6 w-6" />}
            label="Total de horas"
            value={formatHoras(kpis.totalAtual)}
            sub={`${kpis.qtd} apontamento(s)`}
            variation={kpis.variacao}
          />
          <KpiCard
            iconColor="green"
            icon={<CalendarIcon className="h-6 w-6" />}
            label="Dias trabalhados"
            value={String(kpis.diasTrab)}
            sub={`Média ${formatHoras(kpis.mediaDia)}/dia`}
          />
          <KpiCard
            iconColor="purple"
            icon={<FolderKanban className="h-6 w-6" />}
            label="Projetos ativos"
            value={String(kpis.projetosAtivos)}
            sub={kpis.maiorProj.id ? `Top: ${projetoMap.get(kpis.maiorProj.id)?.codigo ?? "—"} (${formatHoras(kpis.maiorProj.total)})` : "—"}
          />
          <KpiCard
            iconColor="amber"
            icon={<TrendingUp className="h-6 w-6" />}
            label="Tempo médio / apont."
            value={formatHoras(kpis.mediaApont)}
            sub={kpis.maiorDia.data ? `Maior dia: ${formatDate(kpis.maiorDia.data)} (${formatHoras(kpis.maiorDia.total)})` : "—"}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            iconColor="amber"
            icon={<Activity className="h-6 w-6" />}
            label="Horas hoje"
            value={formatHoras(kpis.horasHoje)}
          />
          <KpiCard
            iconColor="green"
            icon={<Hourglass className="h-6 w-6" />}
            label="Horas na semana"
            value={formatHoras(kpis.horasSemana)}
          />
          <KpiCard
            iconColor="purple"
            icon={<Trophy className="h-6 w-6" />}
            label="Projeto líder"
            value={kpis.maiorProj.id ? (projetoMap.get(kpis.maiorProj.id)?.codigo ?? "—") : "—"}
            sub={kpis.maiorProj.id ? `${formatHoras(kpis.maiorProj.total)} • ${perfProjetos.total > 0 ? fmtNum((kpis.maiorProj.total / perfProjetos.total) * 100, 1) : "0"}% do total` : ""}
          />
          <KpiCard
            iconColor="blue"
            icon={<AlertTriangle className="h-6 w-6" />}
            label="Dias úteis sem apontamento"
            value={`${alertas.diasUteisSem} / ${alertas.diasUteis}`}
            sub={alertas.emAberto.length > 0 ? `${alertas.emAberto.length} apontamento(s) em aberto` : "Sem pendências"}
            tone={alertas.diasUteisSem > 0 ? "negative" : "positive"}
          />
        </div>

        {/* Comparativo Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativo mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mensal.chart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip
                    formatter={(v: number, n) => [formatHoras(Number(v)), n]}
                  />
                  <Legend />
                  <Bar dataKey="horas" name="Horas" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="media3m" name="Média móvel 3m" stroke="#FF5722" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-right">Δ mês anterior</TableHead>
                    <TableHead className="text-right">Δ ano anterior</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead className="text-right">Média/dia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...mensal.tabela].reverse().map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="font-medium">{r.mes}</TableCell>
                      <TableCell className="text-right">{formatHoras(r.horas)}</TableCell>
                      <TableCell className={cn("text-right", r.deltaPrev >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {r.deltaPrev >= 0 ? "+" : ""}{fmtNum(r.deltaPrev, 1)}%
                      </TableCell>
                      <TableCell className={cn("text-right",
                        r.deltaYoY === null ? "text-muted-foreground"
                        : r.deltaYoY >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {r.deltaYoY === null ? "—" : `${r.deltaYoY >= 0 ? "+" : ""}${fmtNum(r.deltaYoY, 1)}%`}
                      </TableCell>
                      <TableCell className="text-right">{r.dias}</TableCell>
                      <TableCell className="text-right">{formatHoras(r.mediaDia)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Performance por Projeto + Tipo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Top 10 projetos no período</CardTitle>
            </CardHeader>
            <CardContent>
              {topProjChart.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  Sem apontamentos no período selecionado.
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProjChart} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                      <ReTooltip
                        formatter={(v: number) => [formatHoras(Number(v)), "Horas"]}
                        labelFormatter={(l, payload: any) => payload?.[0]?.payload?.nome || l}
                      />
                      <Bar dataKey="horas" radius={[0, 4, 4, 0]}>
                        {topProjChart.map((d) => (
                          <Cell key={d.id} fill={projetoColor(d.id)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mix por tipo de projeto</CardTitle>
            </CardHeader>
            <CardContent>
              {perfTipos.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">Sem dados.</div>
              ) : (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={perfTipos}
                          dataKey="horas"
                          nameKey="nome"
                          innerRadius={40}
                          outerRadius={75}
                          paddingAngle={2}
                        >
                          {perfTipos.map((t) => (
                            <Cell key={t.id} fill={projetoColor(t.id)} />
                          ))}
                        </Pie>
                        <ReTooltip formatter={(v: number) => [formatHoras(Number(v)), "Horas"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {perfTipos.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: projetoColor(t.id) }} />
                          <span className="truncate">{t.nome}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground">{fmtNum(t.pct, 1)}%</span>
                          <span className={cn("font-medium",
                            t.variacao >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {t.variacao >= 0 ? "+" : ""}{fmtNum(t.variacao, 0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela detalhada de projetos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhamento por projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-right">% do total</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead className="text-right">Δ período anterior</TableHead>
                    <TableHead>Última atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfProjetos.lista.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        Sem dados no período.
                      </TableCell>
                    </TableRow>
                  ) : perfProjetos.lista.map((p) => (
                    <TableRow key={p.id} className={cn(p.variacao <= -30 && "bg-red-50/40 dark:bg-red-950/10")}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: projetoColor(p.id) }} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.codigo} - {p.nome}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.tipo || "—"}</TableCell>
                      <TableCell className="text-right">{formatHoras(p.horas)}</TableCell>
                      <TableCell className="text-right">{fmtNum(p.pct, 1)}%</TableCell>
                      <TableCell className="text-right">{p.dias}</TableCell>
                      <TableCell className={cn("text-right font-medium",
                        p.variacao >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {p.variacao >= 0 ? "+" : ""}{fmtNum(p.variacao, 1)}%
                      </TableCell>
                      <TableCell>{p.ultima ? formatDate(p.ultima) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Curva acumulada + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Curva acumulada de horas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curva}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ReTooltip formatter={(v: number) => formatHoras(Number(v))} />
                    <Legend />
                    <Line type="monotone" dataKey="atual" name="Período atual" stroke="#4CAF50" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="anterior" name="Período anterior" stroke="#607D8B" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição: dia da semana × hora do dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-2">Dia</th>
                      {["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"].map((s) => (
                        <th key={s} className="px-1 pb-2 text-center text-muted-foreground font-normal">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia, i) => (
                      <tr key={dia}>
                        <td className="py-1 pr-2 font-medium">{dia}</td>
                        {heatmap.grid[i].map((v, j) => {
                          const intensity = heatmap.max > 0 ? v / heatmap.max : 0;
                          return (
                            <td key={j} className="p-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="h-9 rounded flex items-center justify-center text-[10px] font-medium"
                                    style={{
                                      background: intensity > 0
                                        ? `rgba(76, 175, 80, ${0.15 + intensity * 0.75})`
                                        : "hsl(var(--muted) / 0.4)",
                                      color: intensity > 0.6 ? "#ffffff" : "hsl(var(--foreground))",
                                    }}
                                  >
                                    {v > 0 ? formatHoras(v) : ""}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {dia} • faixa {["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"][j]} — {formatHoras(v)}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-muted-foreground mt-3">
                Cor mais intensa indica maior concentração de horas apontadas naquele intervalo.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aderência e Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aderência ao tempo estimado por tarefa</CardTitle>
            </CardHeader>
            <CardContent>
              {aderencia.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Sem tarefas com apontamento no período.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
                      <TableHead className="text-right">Estim.</TableHead>
                      <TableHead className="text-right">Real</TableHead>
                      <TableHead className="text-right">Desvio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aderencia.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-medium">{t.nome}</div>
                          <div className="text-xs text-muted-foreground">{t.tipo}</div>
                        </TableCell>
                        <TableCell className="text-right">{fmtNum(t.pctEsperado, 1)}%</TableCell>
                        <TableCell className="text-right">{fmtNum(t.pctReal, 1)}%</TableCell>
                        <TableCell className={cn("text-right font-medium",
                          Math.abs(t.desvio) < 5 ? "text-emerald-600"
                          : Math.abs(t.desvio) < 15 ? "text-amber-600" : "text-red-600")}>
                          {t.desvio >= 0 ? "+" : ""}{fmtNum(t.desvio, 1)} p.p.
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alertas operacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Projetos ativos sem apontamento há mais de 14 dias
                </div>
                {alertas.inativos.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Nenhum projeto inativo.</div>
                ) : (
                  <ul className="space-y-1">
                    {alertas.inativos.map(({ p, ultima }) => (
                      <li key={p.id} className="flex items-center justify-between text-xs border-b last:border-b-0 py-1.5">
                        <span className="truncate">{p.codigo} - {p.nome}</span>
                        <Badge variant="outline" className="shrink-0">
                          {ultima ? `última: ${formatDate(ultima)}` : "sem apontamentos"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-primary" />
                  Apontamentos em aberto
                </div>
                {alertas.emAberto.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Nenhum apontamento em andamento.</div>
                ) : (
                  <ul className="space-y-1">
                    {alertas.emAberto.map((a) => {
                      const p = projetoMap.get(a.projeto_id);
                      return (
                        <li key={a.id} className="flex items-center justify-between text-xs border-b last:border-b-0 py-1.5">
                          <span className="truncate">
                            {formatDate(a.data)} — {p ? `${p.codigo} - ${p.nome}` : "Projeto"}
                          </span>
                          <span className="text-muted-foreground">{a.hora_inicio?.substring(0, 5)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
