import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, endOfMonth } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, LineChart } from "lucide-react";
import "../../../styles/collapsible.css";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";
import {
  AnaliseVariacao,
  FiltroAnaliseDre,
  DetalhesMensaisConta
} from "@/types/financeiro";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker"
import { CalendarIcon } from "@radix-ui/react-icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { clsx } from "clsx";

// Arrays de meses e anos
const meses = [
  { label: "Janeiro", value: "01" },
  { label: "Fevereiro", value: "02" },
  { label: "Março", value: "03" },
  { label: "Abril", value: "04" },
  { label: "Maio", value: "05" },
  { label: "Junho", value: "06" },
  { label: "Julho", value: "07" },
  { label: "Agosto", value: "08" },
  { label: "Setembro", value: "09" },
  { label: "Outubro", value: "10" },
  { label: "Novembro", value: "11" },
  { label: "Dezembro", value: "12" },
];

// Array de anos (máx. últimos 5 anos)
const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());

export default function AnaliseDrePage() {
  const [filtro, setFiltro] = useState<FiltroAnaliseDre>({
    tipo_comparacao: "mes_anterior",
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    percentual_minimo: 5,
  });
  const { currentCompany } = useCompany();
  const [detalhesMensais, setDetalhesMensais] = useState<DetalhesMensaisConta | null>(null);
  const [isVerDetalhes, setIsVerDetalhes] = useState<boolean[]>([]);
  const { toast } = useToast();

  // Query para buscar dados da análise do DRE
  const { data: dadosAnalise = [], isLoading } = useQuery({
    queryKey: ["analise-dre", currentCompany?.id, filtro],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      try {
        const startDate = format(new Date(filtro.ano, filtro.mes - 1, 1), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(filtro.ano, filtro.mes - 1, 1)), 'yyyy-MM-dd');

        const { data, error } = await supabase
          .rpc('analisar_dre', {
            p_empresa_id: currentCompany.id,
            p_ano: filtro.ano,
            p_mes: filtro.mes,
            p_tipo_comparacao: filtro.tipo_comparacao
          });

        if (error) throw error;

        return data as AnaliseVariacao[];
      } catch (error: any) {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: "Erro ao carregar dados do DRE",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Função para buscar detalhes mensais de uma conta
  const buscarDetalhesMensais = async (nomeConta: string) => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('detalhar_conta_mensal', {
          p_empresa_id: currentCompany.id,
          p_ano: filtro.ano,
          p_nome_conta: nomeConta
        });

      if (error) throw error;

      setDetalhesMensais(data as DetalhesMensaisConta);
    } catch (error: any) {
      console.error('Erro ao buscar detalhes mensais:', error);
      toast({
        title: "Erro ao carregar detalhes mensais",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Função para abrir o modal de detalhes mensais
  const handleAbrirDetalhesMensais = async (item: AnaliseVariacao) => {
    await buscarDetalhesMensais(item.nome);
  };

  // Função para formatar a data
  function formatDate(date: Date) {
    return format(date, "dd/MM/yyyy");
  }

  // Função para lidar com a mudança de mês
  const handleMesChange = (mes: number) => {
    setFiltro({ ...filtro, mes });
  };

  // Função para lidar com a mudança de ano
  const handleAnoChange = (ano: number) => {
    setFiltro({ ...filtro, ano });
  };

  // Função para lidar com a mudança do tipo de comparação
  const handleTipoComparacaoChange = (tipo_comparacao: FiltroAnaliseDre['tipo_comparacao']) => {
    setFiltro({ ...filtro, tipo_comparacao });
  };

  // Função para lidar com a mudança do percentual mínimo
  const handlePercentualMinimoChange = (percentual_minimo: number) => {
    setFiltro({ ...filtro, percentual_minimo });
  };

  const toggleVerDetalhes = (index: number) => {
    const newIsVerDetalhes = [...isVerDetalhes];
    newIsVerDetalhes[index] = !newIsVerDetalhes[index];
    setIsVerDetalhes(newIsVerDetalhes);
  };

  // Função para renderizar a tabela de análise
  function renderTabelaAnalise() {
    if (!dadosAnalise || dadosAnalise.length === 0) return null;

    return (
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Valor Atual</TableHead>
              <TableHead className="text-right">
                {filtro.tipo_comparacao === "mes_anterior"
                  ? "Mês Anterior"
                  : filtro.tipo_comparacao === "ano_anterior"
                  ? "Mesmo Mês Ano Anterior"
                  : "Média últimos meses"}
              </TableHead>
              <TableHead className="text-right">Variação (%)</TableHead>
              <TableHead className="text-right">Variação (R$)</TableHead>
              {/* Removemos a coluna de detalhes mensais quando o tipo de comparação for média dos últimos meses */}
              {filtro.tipo_comparacao !== "media_12_meses" && (
                <TableHead className="w-[100px] text-center">Detalhes Mensais</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dadosAnalise
              .filter(
                (item) =>
                  Math.abs(item.variacao_percentual) >= filtro.percentual_minimo
              )
              .map((item, idx) => (
                <React.Fragment key={idx}>
                  <TableRow
                    className={clsx(
                      item.nivel === "subconta" && "bg-muted/30",
                      item.nivel === "subconta" && "pl-6"
                    )}
                  >
                    <TableCell className="font-medium">
                      {item.nome}
                      {item.nivel === "principal" &&
                        (isVerDetalhes[idx] ? (
                          <ChevronDown className="ml-2 inline h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-2 inline h-4 w-4" />
                        ))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.valor_atual)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.valor_comparacao)}
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationDisplay
                        valor={item.variacao_percentual}
                        tipoConta={item.tipo_conta}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.variacao_valor)}
                    </TableCell>
                    {/* Removemos os botões de detalhes mensais quando o tipo de comparação for média dos últimos meses */}
                    {filtro.tipo_comparacao !== "media_12_meses" && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAbrirDetalhesMensais(item)}
                        >
                          <LineChart className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                  {/* Se tiver subcontas e estiver expandido, mostra subcontas */}
                  {item.nivel === "principal" &&
                    isVerDetalhes[idx] &&
                    item.subcontas &&
                    item.subcontas.map((subconta, subidx) => (
                      <TableRow key={`${idx}-${subidx}`} className="bg-muted/30">
                        <TableCell className="pl-10 font-normal">
                          {subconta.nome}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(subconta.valor_atual)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(subconta.valor_comparacao)}
                        </TableCell>
                        <TableCell className="text-right">
                          <VariationDisplay
                            valor={subconta.variacao_percentual}
                            tipoConta={subconta.tipo_conta}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(subconta.variacao_valor)}
                        </TableCell>
                        {/* Removemos os botões de detalhes mensais para subcontas também quando o tipo de comparação for média dos últimos meses */}
                        {filtro.tipo_comparacao !== "media_12_meses" && (
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleAbrirDetalhesMensais(subconta)}
                            >
                              <LineChart className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise do DRE</CardTitle>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compare o desempenho financeiro da sua empresa com diferentes
              períodos e identifique tendências importantes.
            </p>
          </CardContent>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            {/* Tipo de Comparação */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Tipo de Comparação
              </label>
              <Select
                value={filtro.tipo_comparacao}
                onValueChange={(value) =>
                  handleTipoComparacaoChange(value as any)
                }
              >
                <SelectTrigger className="min-w-[180px] bg-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="ano_anterior">
                    Mesmo Mês Ano Anterior
                  </SelectItem>
                  <SelectItem value="media_12_meses">
                    Média dos Últimos 12 Meses
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mês e Ano */}
            <div className="flex gap-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Mês
                </label>
                <Select
                  value={String(filtro.mes).padStart(2, "0")}
                  onValueChange={(value) =>
                    handleMesChange(Number(value))
                  }
                >
                  <SelectTrigger className="min-w-[120px] bg-white">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Ano
                </label>
                <Select
                  value={String(filtro.ano)}
                  onValueChange={(value) =>
                    handleAnoChange(Number(value))
                  }
                >
                  <SelectTrigger className="min-w-[100px] bg-white">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((ano) => (
                      <SelectItem key={ano} value={ano}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Percentual Mínimo */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Variação Mínima (%)
              </label>
              <Input
                type="number"
                className="w-24 bg-white"
                value={String(filtro.percentual_minimo)}
                onChange={(e) =>
                  handlePercentualMinimoChange(Number(e.target.value))
                }
              />
            </div>
          </form>

          {/* Tabela de Análise */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">Carregando dados...</div>
            </div>
          ) : (
            renderTabelaAnalise()
          )}

          {/* Modal de Detalhes Mensais */}
          {detalhesMensais && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <Card className="w-[80%] max-w-2xl">
                <CardHeader>
                  <CardTitle>
                    Detalhes Mensais de {detalhesMensais.nome_conta}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalhesMensais.valores_mensais.map((valorMensal) => (
                        <TableRow key={`${valorMensal.ano}-${valorMensal.mes}`}>
                          <TableCell>
                            {valorMensal.mes_nome} / {valorMensal.ano}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(valorMensal.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right mt-4">
                    <Button variant="outline" onClick={() => setDetalhesMensais(null)}>
                      Fechar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
