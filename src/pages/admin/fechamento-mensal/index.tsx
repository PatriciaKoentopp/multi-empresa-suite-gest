
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Unlock, Calendar, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFechamentoMensal } from "@/hooks/useFechamentoMensal";
import { format } from "date-fns";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function FechamentoMensal() {
  const { mesesFechados, isLoading, fecharMes, reabrirMes } = useFechamentoMensal();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogReabrirAberto, setDialogReabrirAberto] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState<{ mes: number; ano: number } | null>(null);
  const [observacoes, setObservacoes] = useState("");

  // Gerar últimos 12 meses
  const hoje = new Date();
  const periodos = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    periodos.push({ mes: d.getMonth() + 1, ano: d.getFullYear() });
  }

  function getFechamento(mes: number, ano: number) {
    return mesesFechados.find((f) => f.mes === mes && f.ano === ano);
  }

  function handleFechar(mes: number, ano: number) {
    setMesSelecionado({ mes, ano });
    setObservacoes("");
    setDialogAberto(true);
  }

  function handleReabrir(mes: number, ano: number) {
    setMesSelecionado({ mes, ano });
    setDialogReabrirAberto(true);
  }

  async function confirmarFechamento() {
    if (!mesSelecionado) return;
    await fecharMes(mesSelecionado.mes, mesSelecionado.ano, observacoes);
    setDialogAberto(false);
    setMesSelecionado(null);
  }

  async function confirmarReabertura() {
    if (!mesSelecionado) return;
    await reabrirMes(mesSelecionado.mes, mesSelecionado.ano);
    setDialogReabrirAberto(false);
    setMesSelecionado(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Fechamento Mensal</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controle de Períodos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Feche períodos para impedir lançamentos, baixas e movimentações com datas retroativas.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data do Fechamento</TableHead>
                  <TableHead>Fechado por</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.map(({ mes, ano }) => {
                  const fechamento = getFechamento(mes, ano);
                  const isFechado = !!fechamento;
                  return (
                    <TableRow key={`${mes}-${ano}`}>
                      <TableCell className="font-medium">
                        {MESES[mes - 1]} / {ano}
                      </TableCell>
                      <TableCell>
                        {isFechado ? (
                          <Badge variant="destructive">
                            <Lock className="h-3 w-3 mr-1" />
                            Fechado
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <Unlock className="h-3 w-3 mr-1" />
                            Aberto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {fechamento
                          ? format(new Date(fechamento.data_fechamento), "dd/MM/yyyy HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>{fechamento?.fechado_por_nome || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {fechamento?.observacoes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isFechado ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReabrir(mes, ano)}
                            disabled={isLoading}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Reabrir
                          </Button>
                        ) : (
                          <Button
                            variant="blue"
                            size="sm"
                            onClick={() => handleFechar(mes, ano)}
                            disabled={isLoading}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Fechar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Fechar */}
      <AlertDialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Fechar Período
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao fechar o período{" "}
              <strong>
                {mesSelecionado ? `${MESES[mesSelecionado.mes - 1]}/${mesSelecionado.ano}` : ""}
              </strong>
              , não será possível realizar lançamentos, baixas, recebimentos ou movimentações com
              datas neste mês. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Observações (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarFechamento} disabled={isLoading}>
              {isLoading ? "Fechando..." : "Confirmar Fechamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Reabrir */}
      <AlertDialog open={dialogReabrirAberto} onOpenChange={setDialogReabrirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir Período</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja reabrir o período{" "}
              <strong>
                {mesSelecionado ? `${MESES[mesSelecionado.mes - 1]}/${mesSelecionado.ano}` : ""}
              </strong>
              ? Isso permitirá novamente lançamentos e movimentações neste mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarReabertura} disabled={isLoading}>
              {isLoading ? "Reabrindo..." : "Confirmar Reabertura"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
