
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import "../../../styles/collapsible.css";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { set } from "date-fns";

// Interface para detalhes de movimentação
interface MovimentacaoDetalhe {
  data_movimentacao: string;
  descricao: string;
  valor: number;
  categoria?: string;
  conta_id?: string;
  conta_descricao?: string;
}

// Interface para agrupamento de movimentações por conta contábil
interface ContaContabilAgrupamento {
  conta_id: string;
  descricao: string;
  valor: number;
  detalhes: MovimentacaoDetalhe[];
}

// Interface para grupo de movimentações
interface GrupoMovimentacao {
  tipo: string;
  valor: number;
  detalhes: MovimentacaoDetalhe[];
  contas?: ContaContabilAgrupamento[]; // Nova propriedade para agrupamento por contas
}

// Interface para resultado mensal com contas agrupadas
interface ResultadoMensal {
  mes: string;
  dados: GrupoMovimentacao[];
  contasPorTipo?: Record<string, ContaContabilAgrupamento[]>;
}

// Lista de contas padrão do DRE para garantir consistência nas visualizações
const contasDRE = [
  "Receita Bruta",
  "(-) Deduções",
  "Receita Líquida",
  "(-) Custos",
  "Lucro Bruto",
  "(-) Despesas Operacionais",
  "(+) Receitas Financeiras",
  "(-) Despesas Financeiras",
  "Resultado Antes IR",
  "(-) IRPJ/CSLL",
  "Lucro Líquido do Exercício",
  "(-) Distribuição de Lucros",
  "Resultado do Exercício"
];

interface DadosAnalise {
  conta: string;
  valorAtual: number;
  valorAnterior: number;
  variacaoAbsoluta: number;
  variacaoPercentual: number;
  detalhesMensais: Record<string, number[]>;
}

export default function AnalisedrePage() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: set(new Date(), {
      date: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }),
    to: new Date(),
  });
  const [anoAnteriorDate, setAnoAnteriorDate] = React.useState<DateRange | undefined>({
    from: set(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()), {
      date: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }),
    to: set(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()), {
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    }),
  });
  const [exibirContas, setExibirContas] = useState<string[]>([]);
  const { currentCompany } = useCompany();
  const [contaExpandida, setContaExpandida] = useState<string | null>(null);

  const dataInicial = date?.from ? format(date.from, 'yyyy-MM-dd') : null;
  const dataFinal = date?.to ? format(date.to, 'yyyy-MM-dd') : null;

  const dataInicialAnterior = anoAnteriorDate?.from ? format(anoAnteriorDate.from, 'yyyy-MM-dd') : null;
  const dataFinalAnterior = anoAnteriorDate?.to ? format(anoAnteriorDate.to, 'yyyy-MM-dd') : null;

  // Query para buscar dados do DRE
  const { data: dadosDRE = [], isLoading } = useQuery({
    queryKey: ["analise-dre-data", currentCompany?.id, dataInicial, dataFinal, dataInicialAnterior, dataFinalAnterior],
    queryFn: async () => {
      if (!currentCompany?.id || !dataInicial || !dataFinal || !dataInicialAnterior || !dataFinalAnterior) return [];

      try {
        // Buscar movimentações do período atual
        const { data: movimentacoesAtuais, error: errorAtual } = await supabase
          .from('fluxo_caixa')
          .select(`
            *,
            movimentacoes (
              categoria_id,
              tipo_operacao,
              considerar_dre
            ),
            plano_contas:movimentacoes(plano_contas(id, tipo, descricao, classificacao_dre))
          `)
          .eq('empresa_id', currentCompany.id)
          .gte('data_movimentacao', dataInicial)
          .lte('data_movimentacao', dataFinal);

        if (errorAtual) throw errorAtual;

        // Buscar movimentações do período anterior
        const { data: movimentacoesAnteriores, error: errorAnterior } = await supabase
          .from('fluxo_caixa')
          .select(`
            *,
            movimentacoes (
              categoria_id,
              tipo_operacao,
              considerar_dre
            ),
            plano_contas:movimentacoes(plano_contas(id, tipo, descricao, classificacao_dre))
          `)
          .eq('empresa_id', currentCompany.id)
          .gte('data_movimentacao', dataInicialAnterior)
          .lte('data_movimentacao', dataFinalAnterior);

        if (errorAnterior) throw errorAnterior;

        // Processar movimentações para o período atual e anterior
        const dadosAtuais = processarMovimentacoes(movimentacoesAtuais || []);
        const dadosAnteriores = processarMovimentacoes(movimentacoesAnteriores || []);

        // Agrupar dados mensais detalhados para o período atual e anterior
        const detalhesMensaisAtuais = agruparDetalhesMensais(movimentacoesAtuais || []);
        const detalhesMensaisAnteriores = agruparDetalhesMensais(movimentacoesAnteriores || []);

        // Preparar dados para análise
        const dadosParaAnalise: DadosAnalise[] = contasDRE.map(conta => {
          const valorAtual = dadosAtuais.find(d => d.tipo === conta)?.valor || 0;
          const valorAnterior = dadosAnteriores.find(d => d.tipo === conta)?.valor || 0;
          const variacaoAbsoluta = valorAtual - valorAnterior;
          const variacaoPercentual = valorAnterior !== 0 ? (variacaoAbsoluta / valorAnterior) * 100 : 0;

          return {
            conta,
            valorAtual,
            valorAnterior,
            variacaoAbsoluta,
            variacaoPercentual,
            detalhesMensais: detalhesMensaisAtuais[conta] || {}
          };
        });

        // Calcular a média dos valores anteriores
        const dadosAgrupadosAnterior = agruparDadosAnterior(movimentacoesAnteriores || []);

        // Calcular a média dos valores anteriores
        const dadosParaAnaliseComMedia = contasDRE.map(conta => {
          const valorAtual = dadosAtuais.find(d => d.tipo === conta)?.valor || 0;
          const valorAnterior = dadosAnteriores.find(d => d.tipo === conta)?.valor || 0;
          const variacaoAbsoluta = valorAtual - valorAnterior;
          const variacaoPercentual = valorAnterior !== 0 ? (variacaoAbsoluta / valorAnterior) * 100 : 0;
          const valorMediaAnterior = calcularValorMediaAnterior(conta, dadosAgrupadosAnterior);

          return {
            conta,
            valorAtual,
            valorAnterior,
            valorMediaAnterior,
            variacaoAbsoluta,
            variacaoPercentual,
            detalhesMensais: detalhesMensaisAtuais[conta] || {}
          };
        });

        return dadosParaAnaliseComMedia;

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados para análise do DRE');
        return [];
      }
    }
  });

  // Função para processar movimentações e calcular totais
  function processarMovimentacoes(movimentacoes: any[]) {
    const grupos: { [key: string]: MovimentacaoDetalhe[] } = {
      "Receita Bruta": [],
      "Deduções": [],
      "Custos": [],
      "Despesas Operacionais": [],
      "Receitas Financeiras": [],
      "Despesas Financeiras": [],
      "Distribuição de Lucros": [],
      "IRPJ/CSLL": []
    };

    let receitaBruta = 0;
    let deducoes = 0;
    let custos = 0;
    let despesasOperacionais = 0;
    let receitasFinanceiras = 0;
    let despesasFinanceiras = 0;
    let distribuicaoLucros = 0;
    let impostos = 0;

    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;

      const valor = Number(mov.valor);
      const tipoOperacao = mov.movimentacoes?.tipo_operacao;
      const planoContas = mov.plano_contas?.plano_contas;
      const descricaoCategoria = planoContas?.descricao || 'Sem categoria';
      const contaId = planoContas?.id || 'sem_conta';

      const dataFormatada = mov.data_movimentacao ?
        mov.data_movimentacao.substring(8, 10) + "/" +
        mov.data_movimentacao.substring(5, 7) + "/" +
        mov.data_movimentacao.substring(0, 4) : '';

      const detalhe: MovimentacaoDetalhe = {
        data_movimentacao: dataFormatada,
        descricao: mov.descricao || descricaoCategoria,
        valor: valor,
        categoria: descricaoCategoria,
        conta_id: contaId,
        conta_descricao: descricaoCategoria
      };

      if (planoContas && planoContas.classificacao_dre && planoContas.classificacao_dre !== 'nao_classificado') {
        let grupoDestino = "";

        switch (planoContas.classificacao_dre) {
          case 'receita_bruta':
            receitaBruta += valor;
            grupoDestino = "Receita Bruta";
            break;
          case 'deducoes':
            deducoes += valor;
            grupoDestino = "Deduções";
            break;
          case 'custos':
            custos += valor;
            grupoDestino = "Custos";
            break;
          case 'despesas_operacionais':
            despesasOperacionais += valor;
            grupoDestino = "Despesas Operacionais";
            break;
          case 'receitas_financeiras':
            receitasFinanceiras += valor;
            grupoDestino = "Receitas Financeiras";
            break;
          case 'despesas_financeiras':
            despesasFinanceiras += valor;
            grupoDestino = "Despesas Financeiras";
            break;
          case 'distribuicao_lucros':
            distribuicaoLucros += valor;
            grupoDestino = "Distribuição de Lucros";
            break;
          case 'impostos_irpj_csll':
            impostos += valor;
            grupoDestino = "IRPJ/CSLL";
            break;
        }

        if (grupoDestino) {
          grupos[grupoDestino].push(detalhe);
        }
      } else {
        if (tipoOperacao === 'receber' && (!mov.movimentacoes?.categoria_id || !planoContas)) {
          receitaBruta += valor;
          grupos["Receita Bruta"].push(detalhe);
        }
        else if (planoContas) {
          const { tipo, descricao } = planoContas;
          let grupoDestino = "";

          if (tipo === 'receita') {
            if (descricao.toLowerCase().includes('financeira') ||
              descricao.toLowerCase().includes('juros') ||
              descricao.toLowerCase().includes('rendimento')) {
              receitasFinanceiras += valor;
              grupoDestino = "Receitas Financeiras";
            } else {
              receitaBruta += valor;
              grupoDestino = "Receita Bruta";
            }
          }
          else if (tipo === 'despesa') {
            switch (descricao.toLowerCase()) {
              case 'das - simples nacional':
                deducoes += valor;
                grupoDestino = "Deduções";
                break;
              case 'pró-labore':
              case 'pro-labore':
              case 'pró labore':
              case 'pro labore':
              case 'inss':
              case 'honorários contábeis':
              case 'honorarios contabeis':
                despesasOperacionais += valor;
                grupoDestino = "Despesas Operacionais";
                break;
              case 'distribuição de lucros':
              case 'distribuicao de lucros':
                distribuicaoLucros += valor;
                grupoDestino = "Distribuição de Lucros";
                break;
              default:
                if (descricao.toLowerCase().includes('financeira') ||
                  descricao.toLowerCase().includes('juros') ||
                  descricao.toLowerCase().includes('tarifas')) {
                  despesasFinanceiras += valor;
                  grupoDestino = "Despesas Financeiras";
                } else {
                  custos += valor;
                  grupoDestino = "Custos";
                }
            }
          }

          if (grupoDestino) {
            grupos[grupoDestino].push(detalhe);
          }
        }
      }
    });

    const receitaLiquida = receitaBruta + deducoes;
    const lucroBruto = receitaLiquida + custos;
    const resultadoOperacional = lucroBruto + despesasOperacionais;
    const resultadoFinanceiro = resultadoOperacional + receitasFinanceiras + despesasFinanceiras;
    const resultadoAntesIR = resultadoFinanceiro;
    const lucroLiquido = resultadoAntesIR + impostos;
    const resultadoExercicio = lucroLiquido + distribuicaoLucros;

    return [
      { tipo: "Receita Bruta", valor: receitaBruta, detalhes: grupos["Receita Bruta"] },
      { tipo: "(-) Deduções", valor: deducoes, detalhes: grupos["Deduções"] },
      { tipo: "Receita Líquida", valor: receitaLiquida, detalhes: [] },
      { tipo: "(-) Custos", valor: custos, detalhes: grupos["Custos"] },
      { tipo: "Lucro Bruto", valor: lucroBruto, detalhes: [] },
      { tipo: "(-) Despesas Operacionais", valor: despesasOperacionais, detalhes: grupos["Despesas Operacionais"] },
      { tipo: "Resultado Operacional", valor: resultadoOperacional, detalhes: [] },
      { tipo: "(+) Receitas Financeiras", valor: receitasFinanceiras, detalhes: grupos["Receitas Financeiras"] },
      { tipo: "(-) Despesas Financeiras", valor: despesasFinanceiras, detalhes: grupos["Despesas Financeiras"] },
      { tipo: "Resultado Antes IR", valor: resultadoAntesIR, detalhes: [] },
      { tipo: "(-) IRPJ/CSLL", valor: impostos, detalhes: grupos["IRPJ/CSLL"] },
      { tipo: "Lucro Líquido do Exercício", valor: lucroLiquido, detalhes: [] },
      { tipo: "(-) Distribuição de Lucros", valor: distribuicaoLucros, detalhes: grupos["Distribuição de Lucros"] },
      { tipo: "Resultado do Exercício", valor: resultadoExercicio, detalhes: [] }
    ];
  }

  // Agrupar detalhes mensais
  function agruparDetalhesMensais(movimentacoes: any[]): Record<string, Record<string, number[]>> {
    const detalhesMensais: Record<string, Record<string, number[]>> = {};

    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;

      const valor = Number(mov.valor);
      const planoContas = mov.plano_contas?.plano_contas;

      if (planoContas && planoContas.classificacao_dre && planoContas.classificacao_dre !== 'nao_classificado') {
        const tipoConta = planoContas.classificacao_dre;
        const dataMovimentacao = new Date(mov.data_movimentacao);
        const mes = format(dataMovimentacao, 'MM/yyyy');

        if (!detalhesMensais[tipoConta]) {
          detalhesMensais[tipoConta] = {};
        }

        if (!detalhesMensais[tipoConta][mes]) {
          detalhesMensais[tipoConta][mes] = [];
        }

        detalhesMensais[tipoConta][mes].push(valor);
      }
    });

    return detalhesMensais;
  }

  // Agrupar dados do período anterior por mês
  function agruparDadosAnterior(movimentacoes: any[]): Record<string, Record<string, number[]>> {
    const dadosAgrupados: Record<string, Record<string, number[]>> = {};

    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;

      const valor = Number(mov.valor);
      const planoContas = mov.plano_contas?.plano_contas;

      if (planoContas && planoContas.classificacao_dre && planoContas.classificacao_dre !== 'nao_classificado') {
        const tipoConta = planoContas.classificacao_dre;
        const dataMovimentacao = new Date(mov.data_movimentacao);
        const mes = format(dataMovimentacao, 'MM/yyyy');

        if (!dadosAgrupados[tipoConta]) {
          dadosAgrupados[tipoConta] = {};
        }

        if (!dadosAgrupados[tipoConta][mes]) {
          dadosAgrupados[tipoConta][mes] = [];
        }

        dadosAgrupados[tipoConta][mes].push(valor);
      }
    });

    return dadosAgrupados;
  }

  // Função corrigida para calcular os detalhes das médias mensais
  function calcularDetalhesMensaisMedia(conta: string, detalhesConta: Record<string, number[]>): {
    meses: string[];
    valores: number[];
    media: number;
  } {
    const mesesDisponiveis = Object.keys(detalhesConta).sort();
    const valores: number[] = [];
    
    let totalValores = 0;
    let mesesComValor = 0;
    
    for (const mes of mesesDisponiveis) {
      // Garantir que estamos somando os valores corretamente como números
      const valoresMes = detalhesConta[mes].reduce((sum, val) => sum + Number(val), 0);
      valores.push(valoresMes);
      
      // Só conta meses que têm valores diferentes de zero para a média
      if (valoresMes !== 0) {
        totalValores += valoresMes;
        mesesComValor++;
      }
    }
    
    // Calcular a média usando apenas os meses com valores não-zero
    // para manter consistência com o cálculo na tabela principal
    const media = mesesComValor > 0 ? totalValores / mesesComValor : 0;
    
    return {
      meses: mesesDisponiveis,
      valores: valores,
      media: media
    };
  }

  // Função corrigida para calcular a média anterior com a mesma lógica
  function calcularValorMediaAnterior(conta: string, dadosAgrupados: Record<string, Record<string, number[]>>): number {
    if (!dadosAgrupados[conta]) return 0;
    
    const mesesComValores = Object.keys(dadosAgrupados[conta]);
    if (mesesComValores.length === 0) return 0;
    
    let somaTotal = 0;
    let quantidadeMeses = 0;
    
    // Somar todos os valores como números para cada mês, ignorando meses com valor zero
    for (const mes of mesesComValores) {
      const valoresMes = dadosAgrupados[conta][mes].reduce((sum, val) => sum + Number(val), 0);
      if (valoresMes !== 0) {
        somaTotal += valoresMes;
        quantidadeMeses++;
      }
    }
    
    // Retornar a média apenas dos meses com valores não-zero
    return quantidadeMeses > 0 ? somaTotal / quantidadeMeses : 0;
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  }

  function handleToggleContaExpansao(tipoConta: string) {
    setContaExpandida(contaExpandida === tipoConta ? null : tipoConta);
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise DRE</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="w-full md:w-auto">
              <div className="grid gap-2">
                <label
                  htmlFor="date"
                  className="text-xs text-muted-foreground"
                >
                  Período Atual
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !date
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(date.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecione o período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    side="bottom"
                  >
                    <DateRangePicker date={date} setDate={setDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <div className="grid gap-2">
                <label
                  htmlFor="anoAnteriorDate"
                  className="text-xs text-muted-foreground"
                >
                  Período Anterior
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !anoAnteriorDate
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {anoAnteriorDate?.from ? (
                        anoAnteriorDate.to ? (
                          <>
                            {format(anoAnteriorDate.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(anoAnteriorDate.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(anoAnteriorDate.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecione o período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    side="bottom"
                  >
                    <DateRangePicker date={anoAnteriorDate} setDate={setAnoAnteriorDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </form>

          {/* Estado de carregamento */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">Carregando dados para análise do DRE...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Valor Atual</TableHead>
                    <TableHead className="text-right">Valor Anterior</TableHead>
                    <TableHead className="text-right">Valor Anterior (Média)</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosDRE.map((item: any) => (
                    <TableRow key={item.conta}>
                      <TableCell>{item.conta}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valorAtual)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valorAnterior)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valorMediaAnterior)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.variacaoAbsoluta)}</TableCell>
                      <TableCell className="text-right">{(item.variacaoPercentual).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Detalhes Mensais */}
              {dadosDRE.map((item: any) => (
                <div key={item.conta} className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">{`Detalhes Mensais - ${item.conta}`}</h3>
                  {Object.keys(item.detalhesMensais).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(item.detalhesMensais).map(([mes, valores]) => (
                          <TableRow key={mes}>
                            <TableCell>{mes}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(valores.reduce((acc, valor) => acc + Number(valor), 0))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>Nenhum detalhe mensal encontrado para esta conta.</p>
                  )}
                  {/* Exibir a média calculada */}
                  <div className="mt-2">
                    {(() => {
                      const detalhesMensaisMedia = calcularDetalhesMensaisMedia(item.conta, item.detalhesMensais);
                      return (
                        <p>
                          <strong>Média Mensal:</strong> {formatCurrency(detalhesMensaisMedia.media)}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
