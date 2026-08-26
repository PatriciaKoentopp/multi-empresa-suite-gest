import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateInput } from "@/components/movimentacao/DateInput";
import { FileText, Receipt, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";

interface NotaFiscal {
  id: string;
  codigo: string;
  data_nota_fiscal: string;
  numero_nota_fiscal: string;
  favorecido_nome: string;
  codigo_projeto: string | null;
  valor: number;
}

const toISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

export default function RelatorioNotasFiscais() {
  const { currentCompany } = useCompany();
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInicial, setDataInicial] = useState<Date>(startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    const fetchNotas = async () => {
      if (!currentCompany?.id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("orcamentos")
          .select(
            "id, codigo, data_nota_fiscal, numero_nota_fiscal, codigo_projeto, favorecidos(nome), orcamentos_itens(valor)"
          )
          .eq("empresa_id", currentCompany.id)
          .not("numero_nota_fiscal", "is", null)
          .not("data_nota_fiscal", "is", null)
          .gte("data_nota_fiscal", toISO(dataInicial))
          .lte("data_nota_fiscal", toISO(dataFinal))
          .order("data_nota_fiscal", { ascending: true });

        if (error) throw error;

        const mapped: NotaFiscal[] = (data || []).map((o: any) => ({
          id: o.id,
          codigo: o.codigo,
          data_nota_fiscal: o.data_nota_fiscal,
          numero_nota_fiscal: o.numero_nota_fiscal,
          codigo_projeto: o.codigo_projeto,
          favorecido_nome: o.favorecidos?.nome || "-",
          valor: (o.orcamentos_itens || []).reduce(
            (sum: number, item: any) => sum + Number(item.valor || 0),
            0
          ),
        }));

        mapped.sort((a, b) => {
          if (a.data_nota_fiscal !== b.data_nota_fiscal) {
            return a.data_nota_fiscal.localeCompare(b.data_nota_fiscal);
          }
          return String(a.numero_nota_fiscal).localeCompare(String(b.numero_nota_fiscal), undefined, {
            numeric: true,
          });
        });

        setNotas(mapped);
      } catch (error) {
        console.error("Erro ao buscar notas fiscais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotas();
  }, [currentCompany?.id, dataInicial, dataFinal]);

  const totalValor = useMemo(
    () => notas.reduce((sum, n) => sum + n.valor, 0),
    [notas]
  );

  const ticketMedio = notas.length > 0 ? totalValor / notas.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório de Notas Fiscais</h1>
        <p className="text-muted-foreground">
          Notas fiscais emitidas por data e número no período selecionado
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium mb-2 block">Data Inicial</label>
          <DateInput
            value={dataInicial}
            onChange={(date) => date && setDataInicial(date)}
            placeholder="Data inicial"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium mb-2 block">Data Final</label>
          <DateInput
            value={dataFinal}
            onChange={(date) => date && setDataFinal(date)}
            placeholder="Data final"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas Emitidas</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notas.length}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValor)}</div>
            <p className="text-xs text-muted-foreground">Soma das notas emitidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
            <p className="text-xs text-muted-foreground">Média por nota fiscal</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais Emitidas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : notas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma nota fiscal encontrada para o período selecionado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[120px]">Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="w-[130px]">Orçamento</TableHead>
                    <TableHead className="w-[140px]">Projeto</TableHead>
                    <TableHead className="text-right w-[140px]">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notas.map((nota) => (
                    <TableRow key={nota.id}>
                      <TableCell>{formatDate(nota.data_nota_fiscal)}</TableCell>
                      <TableCell className="font-medium">{nota.numero_nota_fiscal}</TableCell>
                      <TableCell>{nota.favorecido_nome}</TableCell>
                      <TableCell>{nota.codigo}</TableCell>
                      <TableCell>{nota.codigo_projeto || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(nota.valor)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={5}>Total ({notas.length} nota(s))</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalValor)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
