import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Trophy, DollarSign, FileSpreadsheet, ChevronDown, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  // comparativo: média mensal do ano mais recente (corrente) vs anos anteriores
  const anoCorrente = useMemo(() => {
    return anos.length > 0 ? anos[anos.length - 1] : null;
  }, [anos]);

  const comparativoMedias = useMemo(() => {
    if (!anoCorrente || anos.length < 2) return [];
    const mediaCorrente = mediasAno[anoCorrente] || 0;
    return anos
      .slice(0, anos.length - 1)
      .sort((a, b) => b - a)
      .map((ano) => {
        const mediaAnterior = mediasAno[ano] || 0;
        const diff = mediaCorrente - mediaAnterior;
        const varPct =
          mediaAnterior > 0
            ? ((mediaCorrente - mediaAnterior) / mediaAnterior) * 100
            : mediaCorrente > 0
            ? 100
            : null;
        return { ano, mediaAnterior, mediaCorrente, diff, varPct };
      });
  }, [anoCorrente, anos, mediasAno]);

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

  const exportarPDF = () => {
    if (anos.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Vendas", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(currentCompany?.razao_social || "", 14, 21);
    doc.text(
      `Anos: ${anosSelecionados.length === anosDisponiveis.length ? "Todos" : anos.join(", ")}`,
      14,
      26
    );

    const dataEmissao = new Date();
    const dd = String(dataEmissao.getDate()).padStart(2, "0");
    const mm = String(dataEmissao.getMonth() + 1).padStart(2, "0");
    const yyyy = dataEmissao.getFullYear();
    const hh = String(dataEmissao.getHours()).padStart(2, "0");
    const mi = String(dataEmissao.getMinutes()).padStart(2, "0");
    doc.text(`Emitido em ${dd}/${mm}/${yyyy} ${hh}:${mi}`, pageWidth - 14, 15, { align: "right" });

    // Resumo (mesmos cards da página)
    doc.setFont("helvetica", "bold");
    doc.text(`Total Geral: ${formatCurrency(totalGeral)}`, 14, 32);
    doc.text(
      `Melhor Ano: ${melhorAno ?? "-"}${melhorAno ? ` (${formatCurrency(totaisAno[melhorAno] || 0)})` : ""}`,
      100,
      32
    );
    doc.text(`Anos Comparados: ${anos.length}`, 200, 32);

    const head: string[] = ["Mês"];
    anos.forEach((ano, idx) => {
      head.push(String(ano));
      if (idx > 0) head.push("Var. %");
    });

    const body: any[][] = MESES.map((nomeMes, i) => {
      const mes = i + 1;
      const row: any[] = [nomeMes];
      anos.forEach((ano, idx) => {
        const valor = vendas[ano]?.[mes] || 0;
        row.push(valor > 0 ? formatCurrency(valor) : "-");
        if (idx > 0) {
          const v = variacao(valor, vendas[anos[idx - 1]]?.[mes] || 0);
          row.push(v !== null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : "-");
        }
      });
      return row;
    });

    const rowTotal: any[] = ["Total"];
    const rowMedia: any[] = ["Média mensal"];
    anos.forEach((ano, idx) => {
      rowTotal.push(formatCurrency(totaisAno[ano] || 0));
      rowMedia.push(formatCurrency(mediasAno[ano] || 0));
      if (idx > 0) {
        const vt = variacao(totaisAno[ano] || 0, totaisAno[anos[idx - 1]] || 0);
        const vm = variacao(mediasAno[ano] || 0, mediasAno[anos[idx - 1]] || 0);
        rowTotal.push(vt !== null ? `${vt >= 0 ? "+" : ""}${vt.toFixed(1)}%` : "-");
        rowMedia.push(vm !== null ? `${vm >= 0 ? "+" : ""}${vm.toFixed(1)}%` : "-");
      }
    });
    body.push(rowTotal, rowMedia);

    // índices das colunas de valor por ano (para destacar o melhor mês)
    const colunaDoAno: Record<number, number> = {};
    let col = 1;
    anos.forEach((ano, idx) => {
      colunaDoAno[ano] = col;
      col += idx > 0 ? 2 : 1;
    });

    autoTable(doc, {
      head: [head],
      body,
      startY: 37,
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
      columnStyles: { 0: { halign: "left", cellWidth: 30 } },
      didParseCell: (data) => {
        if (data.section === "body") {
          if (data.column.index > 0) data.cell.styles.halign = "right";

          const isTotal = data.row.index === body.length - 2;
          const isMedia = data.row.index === body.length - 1;
          if (isTotal) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [237, 240, 244];
          } else if (isMedia) {
            data.cell.styles.fillColor = [245, 247, 250];
          } else {
            const mes = data.row.index + 1;
            const anoDestacado = anos.find(
              (ano) => colunaDoAno[ano] === data.column.index && melhorMesAno[ano] === mes
            );
            if (anoDestacado) {
              data.cell.styles.fillColor = [229, 231, 235];
              data.cell.styles.fontStyle = "bold";
            }
          }

          const texto = String(data.cell.raw ?? "");
          if (texto.endsWith("%")) {
            if (texto.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
            else if (texto.startsWith("-") && texto !== "-") data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 8,
          { align: "right" }
        );
      },
    });

    doc.save("relatorio-vendas.pdf");
    toast.success("PDF gerado com sucesso");
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
        <div className="flex gap-2">
          <Button onClick={exportarPDF} variant="outline" disabled={anos.length === 0}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={exportarExcel} variant="outline" disabled={anos.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
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
                          const isMelhorMes = melhorMesAno[ano] === mes;
                          return (
                            <>
                              <td
                                key={ano}
                                className={`border px-3 py-1.5 text-right ${isMelhorMes ? "bg-gray-100 dark:bg-gray-800 font-medium" : ""}`}
                              >
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

      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Média Mensal - Ano Corrente vs Anos Anteriores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : comparativoMedias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Selecione pelo menos dois anos para comparar a média mensal
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border px-3 py-2 text-left font-semibold">Comparativo</th>
                    <th className="border px-3 py-2 text-right font-semibold">Média Mensal {anoCorrente}</th>
                    <th className="border px-3 py-2 text-right font-semibold">Média Mensal Ano Anterior</th>
                    <th className="border px-3 py-2 text-right font-semibold">Diferença</th>
                    <th className="border px-3 py-2 text-right font-semibold">Variação %</th>
                  </tr>
                </thead>
                <tbody>
                  {comparativoMedias.map((item) => (
                    <tr key={item.ano}>
                      <td className="border px-3 py-1.5 font-medium">
                        {anoCorrente} x {item.ano}
                      </td>
                      <td className="border px-3 py-1.5 text-right">
                        {formatCurrency(item.mediaCorrente)}
                      </td>
                      <td className="border px-3 py-1.5 text-right">
                        {formatCurrency(item.mediaAnterior)}
                      </td>
                      <td className="border px-3 py-1.5 text-right">
                        {item.diff > 0 ? "+" : ""}
                        {formatCurrency(item.diff)}
                      </td>
                      <td className="border px-3 py-1.5 text-right">
                        {renderVar(item.varPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
