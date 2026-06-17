import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import type { RelogioProjeto } from "@/types/relogio";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MESES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parseISO(d: string | null): { y: number; m: number; d: number } | null {
  if (!d) return null;
  const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { y: +match[1], m: +match[2], d: +match[3] };
}

function formatDM(d: string | null): string {
  const p = parseISO(d);
  if (!p) return "";
  return `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}`;
}

function compareISO(a: string | null, b: string | null): number {
  // -1 if a<b, 0 if equal, 1 if a>b. Nulls treated as "missing".
  if (!a || !b) return 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

function getEntregaClass(prazo: string | null, entrega: string | null): string {
  if (!entrega || !prazo) return "";
  const c = compareISO(entrega, prazo);
  if (c < 0) return "bg-green-100 text-green-900";
  if (c === 0) return "bg-yellow-100 text-yellow-900";
  return "bg-red-100 text-red-900";
}

export default function PlanilhaFotosPage() {
  const { currentCompany } = useCompany();
  const currentYear = new Date().getFullYear();
  const [anoFiltro, setAnoFiltro] = useState<number>(currentYear);

  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ["planilha-fotos-projetos", currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relogio_projetos")
        .select("*")
        .eq("empresa_id", currentCompany!.id)
        .order("data_fotos", { ascending: true });
      if (error) throw error;
      return (data || []) as RelogioProjeto[];
    },
  });

  const { data: favorecidos = [] } = useQuery({
    queryKey: ["favorecidos-planilha-fotos", currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorecidos")
        .select("id, nome")
        .eq("empresa_id", currentCompany!.id);
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  const favorecidoNome = useMemo(() => {
    const m = new Map<string, string>();
    favorecidos.forEach((f) => m.set(f.id, f.nome));
    return m;
  }, [favorecidos]);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    projetos.forEach((p) => {
      const parsed = parseISO(p.data_fotos);
      if (parsed) anos.add(parsed.y);
    });
    anos.add(currentYear);
    return Array.from(anos).sort((a, b) => b - a);
  }, [projetos, currentYear]);

  // Agrupa projetos do ano por mês de data_fotos
  const meses = useMemo(() => {
    const grupos: Record<number, RelogioProjeto[]> = {};
    projetos.forEach((p) => {
      const parsed = parseISO(p.data_fotos);
      if (!parsed || parsed.y !== anoFiltro) return;
      if (!grupos[parsed.m]) grupos[parsed.m] = [];
      grupos[parsed.m].push(p);
    });
    // ordena dentro de cada mês por dia
    Object.values(grupos).forEach((arr) =>
      arr.sort((a, b) => (a.data_fotos || "").localeCompare(b.data_fotos || ""))
    );
    return Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      label: MESES_ABREV[i],
      projetos: grupos[i + 1] || [],
      totalVendidas: (grupos[i + 1] || []).reduce(
        (s, p) => s + (p.fotos_vendidas || 0),
        0
      ),
    })).filter((g) => g.projetos.length > 0);
  }, [projetos, anoFiltro]);

  const totaisGerais = useMemo(() => {
    let cr2 = 0;
    let dng = 0;
    let pacote = 0;

    meses.forEach((g) => {
      g.projetos.forEach((p) => {
        cr2 += p.fotos_tiradas || 0;
        dng += p.fotos_enviadas || 0;
        pacote += p.fotos_vendidas || 0;
      });
    });

    return { cr2, dng, pacote };
  }, [meses]);

  const handleExportar = () => {
    if (meses.length === 0) {
      toast.error("Nenhum projeto para exportar");
      return;
    }
    const rows: any[][] = [];
    rows.push([
      "Mês",
      "Cliente",
      "Projeto",
      "Cidade",
      ".cr2",
      ".dng",
      "pacote",
      "Fotos mês",
      "Fotos",
      "Prévia",
      "Seleção",
      "Prazo",
      "Entrega",
    ]);
    meses.forEach((g) => {
      g.projetos.forEach((p, idx) => {
        rows.push([
          idx === 0 ? MESES_FULL[g.mes - 1] : "",
          favorecidoNome.get(p.favorecido_id || "") || "",
          p.nome,
          p.cidade || "",
          p.fotos_tiradas || 0,
          p.fotos_enviadas || 0,
          p.fotos_vendidas || 0,
          idx === 0 ? g.totalVendidas : "",
          formatDM(p.data_fotos),
          formatDM(p.data_previa),
          formatDM(p.data_selecao),
          formatDM(p.data_prazo),
          formatDM(p.data_entrega),
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 }, { wch: 24 }, { wch: 26 }, { wch: 22 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
      { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Fotos ${anoFiltro}`);
    XLSX.writeFile(wb, `planilha-fotos-${anoFiltro}.xlsx`);
    toast.success("Planilha exportada com sucesso");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Planilha de Fotos</h1>
        <div className="flex items-center gap-2">
          <Select
            value={String(anoFiltro)}
            onValueChange={(v) => setAnoFiltro(parseInt(v))}
          >
            <SelectTrigger className="w-[140px] bg-white dark:bg-gray-900">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : meses.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhum projeto com Data de Fotos no ano {anoFiltro}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <Th className="w-14"></Th>
                    <Th>Cliente</Th>
                    <Th>Projeto</Th>
                    <Th>Cidade</Th>
                    <Th className="text-right">.cr2</Th>
                    <Th className="text-right">.dng</Th>
                    <Th className="text-right">pacote</Th>
                    <Th className="text-right">Fotos mês</Th>
                    <Th className="text-center">Fotos</Th>
                    <Th className="text-center">Prévia</Th>
                    <Th className="text-center">Seleção</Th>
                    <Th className="text-center">Prazo</Th>
                    <Th className="text-center">Entrega</Th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map((g) =>
                    g.projetos.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={cn(
                          idx % 2 === 1 ? "bg-gray-50/60 dark:bg-gray-800/40" : ""
                        )}
                      >
                        {idx === 0 && (
                          <Td
                            rowSpan={g.projetos.length}
                            className="text-center font-semibold align-middle bg-gray-100 dark:bg-gray-800"
                          >
                            {g.label}
                          </Td>
                        )}
                        <Td>{favorecidoNome.get(p.favorecido_id || "") || ""}</Td>
                        <Td>{p.nome}</Td>
                        <Td>{p.cidade || ""}</Td>
                        <Td className="text-right tabular-nums">
                          {p.fotos_tiradas || ""}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {p.fotos_enviadas || ""}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {p.fotos_vendidas || ""}
                        </Td>
                        {idx === 0 && (
                          <Td
                            rowSpan={g.projetos.length}
                            className="text-center font-semibold align-middle tabular-nums bg-gray-100 dark:bg-gray-800"
                          >
                            {g.totalVendidas || ""}
                          </Td>
                        )}
                        <Td className="text-center tabular-nums">
                          {formatDM(p.data_fotos)}
                        </Td>
                        <Td className="text-center tabular-nums">
                          {formatDM(p.data_previa)}
                        </Td>
                        <Td className="text-center tabular-nums">
                          {formatDM(p.data_selecao)}
                        </Td>
                        <Td className="text-center tabular-nums">
                          {formatDM(p.data_prazo)}
                        </Td>
                        <Td
                          className={cn(
                            "text-center tabular-nums",
                            getEntregaClass(p.data_prazo, p.data_entrega)
                          )}
                        >
                          {formatDM(p.data_entrega)}
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-semibold",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
  rowSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  rowSpan?: number;
}) {
  return (
    <td
      rowSpan={rowSpan}
      className={cn(
        "border border-gray-300 dark:border-gray-700 px-3 py-2",
        className
      )}
    >
      {children}
    </td>
  );
}
