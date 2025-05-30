import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  conta_corrente_id: string;
  situacao: string;
}

interface FluxoCaixaFilterProps {
  onFiltroChange: (filtro: FiltroFluxoCaixa) => void;
}

export const FluxoCaixaFilter = ({ onFiltroChange }: FluxoCaixaFilterProps) => {
  const { currentCompany } = useCompany();
  const [dataInicio, setDataInicio] = useState<Date | undefined>(new Date());
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());
  const [contaId, setContaId] = useState<string>("todas");
  const [situacao, setSituacao] = useState<string>("todas");

  const aplicarFiltro = () => {
    if (dataInicio && dataFim) {
      onFiltroChange({
        dataInicio,
        dataFim,
        conta_corrente_id: contaId,
        situacao
      });
    }
  };

  const limparFiltros = () => {
    const hoje = new Date();
    setDataInicio(hoje);
    setDataFim(hoje);
    setContaId("todas");
    setSituacao("todas");
    
    onFiltroChange({
      dataInicio: hoje,
      dataFim: hoje,
      conta_corrente_id: "todas",
      situacao: "todas"
    });
  };

  const { data: contasCorrentes, isLoading: isLoadingContas } = useQuery({
    queryKey: ['contasCorrentes', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('contas_correntes')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) {
        console.error("Erro ao buscar contas correntes:", error);
        return [];
      }

      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtro do Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data de Início */}
          <div>
            <Label htmlFor="dataInicio">Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={setDataInicio}
                  disabled={(date) =>
                    date > (dataFim || new Date())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Fim */}
          <div>
            <Label htmlFor="dataFim">Data de Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataFim && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={setDataFim}
                  disabled={(date) =>
                    date < (dataInicio || new Date())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Conta Corrente */}
        <div>
          <Label htmlFor="conta">Conta Corrente</Label>
          <Select value={contaId} onValueChange={setContaId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as contas</SelectItem>
              {contasCorrentes?.map((conta) => (
                <SelectItem key={conta.id} value={conta.id}>
                  {conta.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Situação */}
        <div>
          <Label htmlFor="situacao">Situação</Label>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as situações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as situações</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={limparFiltros}>
            Limpar Filtros
          </Button>
          <Button type="submit" onClick={aplicarFiltro}>
            Aplicar Filtro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
