import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/movimentacao/DateInput";
import { FileText, Receipt, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useFavorecidos } from "@/hooks/useFavorecidos";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";

interface NotaRecebida {
  id: string;
  data_emissao: string;
  numero_documento: string;
  favorecido_nome: string;
  descricao: string;
  mes_referencia: string | null;
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

export default function RelatorioNotasFiscaisRecebidas() {
  const { currentCompany } = useCompany();
  const { data: favorecidos = [] } = useFavorecidos();
  const [notas, setNotas] = useState<NotaRecebida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInicial, setDataInicial] = useState<Date>(startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState<Date>(endOfMonth(new Date()));
  const [favorecidoId, setFavorecidoId] = useState<string>("todos");

  useEffect(() => {
    const fetchNotas = async () => {
      if (!currentCompany?.id) return;
      setIsLoading(true);
      try {
        let query = supabase
          .from("movimentacoes")
          .select(
            "id, data_emissao, numero_documento, descricao, mes_referencia, valor, favorecidos(nome)"
          )
          .eq("empresa_id", currentCompany.id)
          .eq("tipo_operacao", "pagar")
          .not("data_emissao", "is", null)
          .gte("data_emissao", toISO(dataInicial))
          .lte("data_emissao", toISO(dataFinal));

        if (favorecidoId !== "todos") {
          query = query.eq("favorecido_id", favorecidoId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const mapped: NotaRecebida[] = (data || []).map((m: any) => ({
          id: m.id,
          data_emissao: m.data_emissao,
          numero_documento: m.numero_documento || "-",
          descricao: m.descricao || "-",
          mes_referencia: m.mes_referencia,
          favorecido_nome: m.favorecidos?.nome || "-",
          valor: Number(m.valor || 0),
        }));

        mapped.sort((a, b) => {
          if (a.data_emissao !== b.data_emissao) {
            return a.data_emissao.localeCompare(b.data_emissao);
          }
          return String(a.numero_documento).localeCompare(String(b.numero_documento), undefined, {
            numeric: true,
          });
        });

        setNotas(mapped);
      } catch (error) {
        console.error("Erro ao buscar notas fiscais recebidas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotas();
  }, [currentCompany?.id, dataInicial, dataFinal, favorecidoId]);

  const totalValor = useMemo(() => notas.reduce((sum, n) => sum + n.valor, 0), [notas]);
  const ticketMedio = notas.length > 0 ? totalValor / notas.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório de Notas Fiscais Recebidas</h1>
        <p className="text-muted-foreground">
          Notas fiscais recebidas de fornecedores por data de emissão e número
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
        <div className="w-full sm:w-72">
          <label className="text-sm font-medium mb-2 block">Favorecido</label>
          <Select value={favorecidoId} onValueChange={setFavorecidoId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {favorecidos.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas Recebidas</CardTitle>
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
            <p className="text-xs text-muted-foreground">Soma das notas recebidas</p>
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
          <CardTitle>Notas Fiscais Recebidas</CardTitle>
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
                    <TableHead className="w-[130px]">Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[120px]">Referência</TableHead>
                    <TableHead className="text-right w-[140px]">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notas.map((nota) => (
                    <TableRow key={nota.id}>
                      <TableCell>{formatDate(nota.data_emissao)}</TableCell>
                      <TableCell className="font-medium">{nota.numero_documento}</TableCell>
                      <TableCell>{nota.favorecido_nome}</TableCell>
                      <TableCell>{nota.descricao}</TableCell>
                      <TableCell>{nota.mes_referencia || "-"}</TableCell>
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
