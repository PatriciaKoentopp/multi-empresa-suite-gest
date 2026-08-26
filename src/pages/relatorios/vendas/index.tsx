import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Trophy, DollarSign, FileSpreadsheet, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// mapa: ano -> mês (1-12) -> valor total
type VendasMap = Record<number, Record<number, number>>;

export default function RelatorioVendas() {
  const { currentCompany } = useCompany();
  const [vendas, setVendas] = useState<VendasMap>({});
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [anosSelecionados, setAnosSelecionados] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVendas = async () => {
      if (!currentCompany?.id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("orcamentos")
          .select("data_venda, orcamentos_itens(valor)")
          .eq("empresa_id", currentCompany.id)
          .eq("tipo", "venda")
          .eq("status", "ativo")
          .not("data_venda", "is", null);

        if (error) throw error;

        const mapa: VendasMap = {};
        (data || []).forEach((o: any) => {
          if (!o.data_venda) return;
          const ano = parseInt(o.data_venda.substring(0, 4), 10);
          const mes = parseInt(o.data_venda.substring(5, 7), 10);
          const total = (o.orcamentos_itens || []).reduce(
            (s: number, i: any) => s + Number(i.valor || 0), 0
          );
          if (total <= 0) return;
          if (!mapa[ano]) mapa[ano] = {};
          mapa[ano][mes] = (mapa[ano][mes] || 0) + total;
        });

        const anos = Object.keys(mapa).map(Number).sort((a, b) => a - b);
        setVendas(mapa);
        setAnosDisponiveis(anos);
        setAnosSelecionados(anos);
      } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        toast.error("Erro ao carregar dados de vendas");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendas();
  }, [currentCompany?.id]);

  const anos = useMemo(
    () => anosSelecionados.filter((a) => anosDisponiveis.includes(a)).sort((a, b) => a - b),
    [anosSelecionados, anosDisponiveis]
  );

  const totaisAno = useMemo(() => {
    const t: Record<number, number> = {};
    anos.forEach((ano) => {
      t[ano] = Object.values(vendas[ano] || {}).reduce((s, v) => s + v, 0);
    });
    return t;
  }, [anos, vendas]);

  const mediasAno = useMemo(() => {
    const m: Record<number, number> = {};
    anos.forEach((ano) => {
      const mesesComVenda = Object.keys(vendas[ano] || {}).length;
      m[ano] = mesesComVenda > 0 ? totaisAno[ano] / mesesComVenda : 0;
    });
    return m;
  }, [anos, vendas, totaisAno]);

  const totalGeral = useMemo(
    () => anos.reduce((s, ano) => s + (totaisAno[ano] || 0), 0),
    [anos, totaisAno]
  );

  const melhorAno = useMemo(() => {
    let melhor: number | null = null;
    anos.forEach((ano) => {
      if (melhor === null || (totaisAno[ano] || 0) > (totaisAno[melhor] || 0)) melhor = ano;
    });
    return melhor;
  }, [anos, totaisAno]);

  const melhorMesAno = useMemo(() => {
    const m: Record<number, number> = {};
    anos.forEach((ano) => {
      let melhorMes = 0;
      let melhorValor = -1;
      for (let mes = 1; mes <= 12; mes++) {
        const valor = vendas[ano]?.[mes] || 0;
        if (valor > melhorValor) {
          melhorValor = valor;
          melhorMes = mes;
        }
      }
      if (melhorValor > 0) m[ano] = melhorMes;
    });
    return m;
  }, [anos, vendas]);

  const toggleAno = (ano: number) => {
    setAnosSelecionados((prev) =>
      prev.includes(ano) ? prev.filter((a) => a !== ano) : [...prev, ano]
    );
  };

  const variacao = (atual: number, anterior: number): number | null => {
    if (anterior > 0) return ((atual - anterior) / anterior) * 100;
    if (atual > 0) return 100;
    return null;
  };

  const renderVar = (v: number | null) => {
    if (v === null) return <span className="text-muted-foreground">-</span>;
    const cor = v >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={cor}>
        {v >= 0 ? "+" : ""}
        {v.toFixed(1)}%
      </span>
    );
  };

  const exportarExcel = () => {
    const rows: any[][] = [];
    const header: any[] = ["Mês"];
    anos.forEach((ano, idx) => {
      header.push(String(ano));
      if (idx > 0) header.push("Var. %");
    });
    rows.push(header);

    MESES.forEach((nomeMes, i) => {
      const mes = i + 1;
      const row: any[] = [nomeMes];
      anos.forEach((ano, idx) => {
        row.push(vendas[ano]?.[mes] || 0);
        if (idx > 0) {
          const v = variacao(vendas[ano]?.[mes] || 0, vendas[anos[idx - 1]]?.[mes] || 0);
          row.push(v !== null ? `${v.toFixed(1)}%` : "-");
        }
      });
      rows.push(row);
    });

    const rowTotal: any[] = ["Total"];
    anos.forEach((ano, idx) => {
      rowTotal.push(totaisAno[ano] || 0);
      if (idx > 0) {
        const v = variacao(totaisAno[ano] || 0, totaisAno[anos[idx - 1]] || 0);
        rowTotal.push(v !== null ? `${v.toFixed(1)}%` : "-");
      }
    });
    rows.push(rowTotal);

    const rowMedia: any[] = ["Média mensal"];
    anos.forEach((ano, idx) => {
      rowMedia.push(Number((mediasAno[ano] || 0).toFixed(2)));
      if (idx > 0) {
        const v = variacao(mediasAno[ano] || 0, mediasAno[anos[idx - 1]] || 0);
        rowMedia.push(v !== null ? `${v.toFixed(1)}%` : "-");
      }
    });
    rows.push(rowMedia);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, ...anos.flatMap((_, idx) => (idx > 0 ? [{ wch: 14 }, { wch: 9 }] : [{ wch: 14 }]))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, "relatorio-vendas.xlsx");
    toast.success("Relatório exportado com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Vendas</h1>
          <p className="text-muted-foreground">
            Vendas mensais por ano em formato de planilha, com comparativo entre anos
          </p>
        </div>
        <Button onClick={exportarExcel} variant="outline" disabled={anos.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <label className="text-sm font-medium mb-2 block">Anos</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {anosSelecionados.length === anosDisponiveis.length
                  ? "Todos"
                  : `${anosSelecionados.length} ano(s) selecionado(s)`}
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                onClick={() => setAnosSelecionados(anosDisponiveis)}
              >
                <Checkbox checked={anosSelecionados.length === anosDisponiveis.length} />
                <span className="text-sm font-medium">Todos</span>
              </div>
              {anosDisponiveis.map((ano) => (
                <div
                  key={ano}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                  onClick={() => toggleAno(ano)}
                >
                  <Checkbox checked={anosSelecionados.includes(ano)} />
                  <span className="text-sm">{ano}</span>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGeral)}</div>
            <p className="text-xs text-muted-foreground">Soma dos anos selecionados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Ano</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{melhorAno ?? "-"}</div>
            <p className="text-xs text-muted-foreground">
              {melhorAno ? formatCurrency(totaisAno[melhorAno] || 0) : "Sem dados"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anos Comparados</CardTitle>
            <BarChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anos.length}</div>
            <p className="text-xs text-muted-foreground">Anos com vendas no filtro</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Mensais por Ano</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : anos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda encontrada para os anos selecionados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border px-3 py-2 text-left font-semibold">Mês</th>
                    {anos.map((ano, idx) => (
                      <>
                        <th key={ano} className="border px-3 py-2 text-right font-semibold">
                          {ano}
                        </th>
                        {idx > 0 && (
                          <th key={`${ano}-var`} className="border px-3 py-2 text-right font-semibold w-[90px]">
                            Var. %
                          </th>
                        )}
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MESES.map((nomeMes, i) => {
                    const mes = i + 1;
                    const temVenda = anos.some((ano) => (vendas[ano]?.[mes] || 0) > 0);
                    return (
                      <tr key={mes} className={temVenda ? "" : "text-muted-foreground"}>
                        <td className="border px-3 py-1.5">{nomeMes}</td>
                        {anos.map((ano, idx) => {
                          const valor = vendas[ano]?.[mes] || 0;
                          const v = idx > 0
                            ? variacao(valor, vendas[anos[idx - 1]]?.[mes] || 0)
                            : null;
                          return (
                            <>
                              <td key={ano} className="border px-3 py-1.5 text-right">
                                {valor > 0 ? formatCurrency(valor) : "-"}
                              </td>
                              {idx > 0 && (
                                <td key={`${ano}-var`} className="border px-3 py-1.5 text-right">
                                  {renderVar(v)}
                                </td>
                              )}
                            </>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/60 font-semibold">
                    <td className="border px-3 py-2">Total</td>
                    {anos.map((ano, idx) => {
                      const v = idx > 0
                        ? variacao(totaisAno[ano] || 0, totaisAno[anos[idx - 1]] || 0)
                        : null;
                      return (
                        <>
                          <td key={ano} className="border px-3 py-2 text-right">
                            {formatCurrency(totaisAno[ano] || 0)}
                          </td>
                          {idx > 0 && (
                            <td key={`${ano}-var`} className="border px-3 py-2 text-right">
                              {renderVar(v)}
                            </td>
                          )}
                        </>
                      );
                    })}
                  </tr>
                  <tr className="bg-muted/40">
                    <td className="border px-3 py-2 font-medium">Média mensal</td>
                    {anos.map((ano, idx) => {
                      const v = idx > 0
                        ? variacao(mediasAno[ano] || 0, mediasAno[anos[idx - 1]] || 0)
                        : null;
                      return (
                        <>
                          <td key={ano} className="border px-3 py-2 text-right">
                            {formatCurrency(mediasAno[ano] || 0)}
                          </td>
                          {idx > 0 && (
                            <td key={`${ano}-var`} className="border px-3 py-2 text-right">
                              {renderVar(v)}
                            </td>
                          )}
                        </>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
