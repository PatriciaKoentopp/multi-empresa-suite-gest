import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Filter } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiltroFluxoCaixa, ContaCorrenteItem } from "@/types/financeiro";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface FluxoCaixaFilterProps {
  contas: ContaCorrenteItem[];
  filtro: FiltroFluxoCaixa;
  onFiltroChange: (filtro: FiltroFluxoCaixa) => void;
}

export const FluxoCaixaFilter = ({
  contas,
  filtro,
  onFiltroChange,
}: FluxoCaixaFilterProps) => {
  const [dataInicio, setDataInicio] = useState<Date>(filtro.dataInicio);
  const [dataFim, setDataFim] = useState<Date>(filtro.dataFim);
  const [contaId, setContaId] = useState<string | null>(filtro.contaId || filtro.conta_corrente_id || null);
  const [situacao, setSituacao] = useState<string | null>(filtro.situacao || "todos");

  const aplicarFiltro = () => {
    onFiltroChange({
      dataInicio,
      dataFim,
      contaId,
      conta_corrente_id: contaId || "",
      situacao,
    } as any);
  };

  const aplicarFiltroPreDefinido = (tipo: string) => {
    const hoje = new Date();
    let novaDataInicio;
    let novaDataFim = hoje;

    switch (tipo) {
      case "7dias":
        novaDataInicio = subDays(hoje, 7);
        break;
      case "30dias":
        novaDataInicio = subDays(hoje, 30);
        break;
      case "mesAtual":
        novaDataInicio = startOfMonth(hoje);
        novaDataFim = endOfMonth(hoje);
        break;
      case "mesAnterior":
        const mesAnterior = subMonths(hoje, 1);
        novaDataInicio = startOfMonth(mesAnterior);
        novaDataFim = endOfMonth(mesAnterior);
        break;
      default:
        novaDataInicio = dataInicio;
    }

    setDataInicio(novaDataInicio);
    setDataFim(novaDataFim);
    
    onFiltroChange({
      dataInicio: novaDataInicio,
      dataFim: novaDataFim,
      contaId,
      conta_corrente_id: contaId || "",
      situacao,
    } as any);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Filtros</h4>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="conta" className="text-xs text-muted-foreground">
                Conta
              </label>
              <Select
                value={contaId || "todas"}
                onValueChange={(valor) => setContaId(valor === "todas" ? null : valor)}
              >
                <SelectTrigger id="conta" className="h-8">
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as contas</SelectItem>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Data inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? (
                      format(dataInicio, "dd/MM/yyyy")
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => date && setDataInicio(date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Data final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? (
                      format(dataFim, "dd/MM/yyyy")
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => date && setDataFim(date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Período</label>
              <Select
                onValueChange={aplicarFiltroPreDefinido}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="mesAtual">Mês atual</SelectItem>
                  <SelectItem value="mesAnterior">Mês anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="h-8 self-end" onClick={aplicarFiltro}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
