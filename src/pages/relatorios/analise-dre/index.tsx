import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, endOfMonth, subMonths } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Info } from "lucide-react";
import {
  AnaliseVariacao,
  FiltroAnaliseDre,
  DetalhesMensaisConta
} from "@/types/financeiro";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils";

const defaultFiltro: FiltroAnaliseDre = {
  tipo_comparacao: 'mes_anterior',
  ano: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  percentual_minimo: 5
};

export default function AnaliseDrePage() {
  const [filtro, setFiltro] = useState<FiltroAnaliseDre>(defaultFiltro);
  const [analise, setAnalise] = useState<AnaliseVariacao[]>([]);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [detalhesConta, setDetalhesConta] = useState<DetalhesMensaisConta | null>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [openModalDetalhes, setOpenModalDetalhes] = useState(false);
  const { currentCompany } = useCompany();

  useEffect(() => {
    carregarAnalise();
  }, [filtro, currentCompany]);

  // Função para obter os períodos de análise com base no tipo de comparação
  function getPeriodosAnalise(filtro: FiltroAnaliseDre) {
    if (filtro.tipo_comparacao === 'ano_anterior') {
      return {
        atual: {
          inicio: format(new Date(filtro.ano, filtro.mes - 1, 1), 'yyyy-MM-dd'),
          fim: format(endOfMonth(new Date(filtro.ano, filtro.mes - 1, 1)), 'yyyy-MM-dd')
        },
        comparacao: {
          inicio: format(new Date(filtro.ano - 1, filtro.mes - 1, 1), 'yyyy-MM-dd'),
          fim: format(endOfMonth(new Date(filtro.ano - 1, filtro.mes - 1, 1)), 'yyyy-MM-dd')
        }
      };
    } else if (filtro.tipo_comparacao === 'mes_anterior') {
      const dataAtual = new Date(filtro.ano, filtro.mes - 1, 1);
      const dataAnterior = subMonths(dataAtual, 1);

      return {
        atual: {
          inicio: format(new Date(filtro.ano, filtro.mes - 1, 1), 'yyyy-MM-dd'),
          fim: format(endOfMonth(new Date(filtro.ano, filtro.mes - 1, 1)), 'yyyy-MM-dd')
        },
        comparacao: {
          inicio: format(new Date(dataAnterior.getFullYear(), dataAnterior.getMonth(), 1), 'yyyy-MM-dd'),
          fim: format(endOfMonth(new Date(dataAnterior.getFullYear(), dataAnterior.getMonth(), 1)), 'yyyy-MM-dd')
        }
      };
    }

    // Caso específico para média de 13 meses
    if (filtro.tipo_comparacao === 'media_13_meses') {
      // Criar data inicial (13 meses atrás)
      const dataInicio = new Date(filtro.ano, filtro.mes - 1, 1);
      dataInicio.setMonth(dataInicio.getMonth() - 13);
      
      // Criar data final (1 mês atrás)
      const dataFim = new Date(filtro.ano, filtro.mes - 1, 1);
      dataFim.setDate(0); // Último dia do mês anterior
      
      return {
        atual: {
          inicio: format(new Date(filtro.ano, filtro.mes - 1, 1), 'yyyy-MM-dd'),
          fim: format(endOfMonth(new Date(filtro.ano, filtro.mes - 1, 1)), 'yyyy-MM-dd')
        },
        comparacao: {
          inicio: format(dataInicio, 'yyyy-MM-dd'),
          fim: format(dataFim, 'yyyy-MM-dd')
        }
      };
    }

    return {
      atual: {
        inicio: format(new Date(filtro.ano, filtro.mes - 1, 1), 'yyyy-MM-dd'),
        fim: format(endOfMonth(new Date(filtro.ano, filtro.mes - 1, 1)), 'yyyy-MM-dd')
      },
      comparacao: {
        inicio: format(new Date(filtro.ano - 1, filtro.mes - 1, 1), 'yyyy-MM-dd'),
        fim: format(endOfMonth(new Date(filtro.ano - 1, filtro.mes - 1, 1)), 'yyyy-MM-dd')
      }
    };
  }

  // Função para carregar a análise DRE
  async function carregarAnalise() {
    if (!currentCompany?.id) return;

    setLoadingAnalise(true);

    try {
      const periodos = getPeriodosAnalise(filtro);

      const { data: dadosAtuais, error: errorAtual } = await supabase
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
        .gte('data_movimentacao', periodos.atual.inicio)
        .lte('data_movimentacao', periodos.atual.fim);

      if (errorAtual) throw errorAtual;

      const { data: dadosComparacao, error: errorComparacao } = await supabase
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
        .gte('data_movimentacao', periodos.comparacao.inicio)
        .lte('data_movimentacao', periodos.comparacao.fim);

      if (errorComparacao) throw errorComparacao;

      // Processar os dados para análise
      const analiseDados = processarDadosParaAnalise(dadosAtuais || [], dadosComparacao || []);
      setAnalise(analiseDados);

    } catch (error) {
      console.error("Erro ao carregar análise DRE:", error);
      toast.error("Erro ao carregar análise DRE");
    } finally {
      setLoadingAnalise(false);
    }
  }

  // Função para processar os dados e calcular a análise de variação
  function processarDadosParaAnalise(dadosAtuais: any[], dadosComparacao: any[]): AnaliseVariacao[] {
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

    const gruposAtuais = agruparDadosPorConta(dadosAtuais);
    const gruposComparacao = agruparDadosPorConta(dadosComparacao);

    const analiseCompleta: AnaliseVariacao[] = contasDRE.map(nomeConta => {
      const valorAtual = gruposAtuais[nomeConta] || 0;
      const valorComparacao = gruposComparacao[nomeConta] || 0;
      const variacaoValor = valorAtual - valorComparacao;
      const variacaoPercentual = valorComparacao !== 0 ? (variacaoValor / Math.abs(valorComparacao)) * 100 : 0;

      let tipoConta: 'receita' | 'despesa' = 'receita';
      if (
        nomeConta.includes('Despesa') || 
        nomeConta.includes('Custo') || 
        nomeConta.includes('Deduções') || 
        nomeConta.includes('IRPJ') || 
        nomeConta.includes('Distribuição')
      ) {
        tipoConta = 'despesa';
      }

      let avaliacao: 'positiva' | 'negativa' | 'estavel' | 'atencao' = 'estavel';
      if (tipoConta === 'receita') {
        if (variacaoPercentual > filtro.percentual_minimo) {
          avaliacao = 'positiva';
        } else if (variacaoPercentual < -filtro.percentual_minimo) {
          avaliacao = 'negativa';
        } else if (variacaoPercentual < 0) {
          avaliacao = 'atencao';
        }
      } else {
        if (variacaoPercentual < -filtro.percentual_minimo) {
          avaliacao = 'positiva';
        } else if (variacaoPercentual > filtro.percentual_minimo) {
          avaliacao = 'negativa';
        } else if (variacaoPercentual > 0) {
          avaliacao = 'atencao';
        }
      }

      return {
        nome: nomeConta,
        valor_atual: valorAtual,
        valor_comparacao: valorComparacao,
        variacao_valor: variacaoValor,
        variacao_percentual: variacaoPercentual,
        tipo_conta: tipoConta,
        avaliacao: avaliacao,
        nivel: 'principal'
      };
    });

    return analiseCompleta;
  }

  // Função auxiliar para agrupar os dados por conta contábil
  function agruparDadosPorConta(dados: any[]): { [key: string]: number } {
    const grupos: { [key: string]: number } = {};

    dados.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;

      const valor = Number(mov.valor);
      const tipoOperacao = mov.movimentacoes?.tipo_operacao;
      const planoContas = mov.plano_contas?.plano_contas;
      const descricaoCategoria = planoContas?.descricao || 'Sem categoria';

      if (planoContas && planoContas.classificacao_dre && planoContas.classificacao_dre !== 'nao_classificado') {
        switch (planoContas.classificacao_dre) {
          case 'receita_bruta':
            grupos["Receita Bruta"] = (grupos["Receita Bruta"] || 0) + valor;
            break;
          case 'deducoes':
            grupos["(-) Deduções"] = (grupos["(-) Deduções"] || 0) - valor;
            break;
          case 'custos':
            grupos["(-) Custos"] = (grupos["(-) Custos"] || 0) - valor;
            break;
          case 'despesas_operacionais':
            grupos["(-) Despesas Operacionais"] = (grupos["(-) Despesas Operacionais"] || 0) - valor;
            break;
          case 'receitas_financeiras':
            grupos["(+) Receitas Financeiras"] = (grupos["(+) Receitas Financeiras"] || 0) + valor;
            break;
          case 'despesas_financeiras':
            grupos["(-) Despesas Financeiras"] = (grupos["(-) Despesas Financeiras"] || 0) - valor;
            break;
          case 'distribuicao_lucros':
            grupos["(-) Distribuição de Lucros"] = (grupos["(-) Distribuição de Lucros"] || 0) - valor;
            break;
          case 'impostos_irpj_csll':
            grupos["(-) IRPJ/CSLL"] = (grupos["(-) IRPJ/CSLL"] || 0) - valor;
            break;
        }
      } else {
        if (tipoOperacao === 'receber' && (!mov.movimentacoes?.categoria_id || !planoContas)) {
          grupos["Receita Bruta"] = (grupos["Receita Bruta"] || 0) + valor;
        }
        else if (planoContas) {
          const { tipo, descricao } = planoContas;

          if (tipo === 'receita') {
            if (descricao.toLowerCase().includes('financeira') ||
              descricao.toLowerCase().includes('juros') ||
              descricao.toLowerCase().includes('rendimento')) {
              grupos["(+) Receitas Financeiras"] = (grupos["(+) Receitas Financeiras"] || 0) + valor;
            } else {
              grupos["Receita Bruta"] = (grupos["Receita Bruta"] || 0) + valor;
            }
          }
          else if (tipo === 'despesa') {
            switch (descricao.toLowerCase()) {
              case 'das - simples nacional':
                grupos["(-) Deduções"] = (grupos["(-) Deduções"] || 0) - valor;
                break;
              case 'pró-labore':
              case 'pro-labore':
              case 'pró labore':
              case 'pro labore':
              case 'inss':
              case 'honorários contábeis':
              case 'honorarios contabeis':
                grupos["(-) Despesas Operacionais"] = (grupos["(-) Despesas Operacionais"] || 0) - valor;
                break;
              case 'distribuição de lucros':
              case 'distribuicao de lucros':
                grupos["(-) Distribuição de Lucros"] = (grupos["(-) Distribuição de Lucros"] || 0) - valor;
                break;
              default:
                if (descricao.toLowerCase().includes('financeira') ||
                  descricao.toLowerCase().includes('juros') ||
                  descricao.toLowerCase().includes('tarifas')) {
                  grupos["(-) Despesas Financeiras"] = (grupos["(-) Despesas Financeiras"] || 0) - valor;
                } else {
                  grupos["(-) Custos"] = (grupos["(-) Custos"] || 0) - valor;
                }
            }
          }
        }
      }
    });

    // Calcular Receita Líquida, Lucro Bruto, etc.
    grupos["Receita Líquida"] = (grupos["Receita Bruta"] || 0) + (grupos["(-) Deduções"] || 0);
    grupos["Lucro Bruto"] = (grupos["Receita Líquida"] || 0) + (grupos["(-) Custos"] || 0);
    grupos["Resultado Antes IR"] = (grupos["Lucro Bruto"] || 0) + (grupos["(-) Despesas Operacionais"] || 0) + (grupos["(+) Receitas Financeiras"] || 0) + (grupos["(-) Despesas Financeiras"] || 0);
    grupos["Lucro Líquido do Exercício"] = (grupos["Resultado Antes IR"] || 0) + (grupos["(-) IRPJ/CSLL"] || 0);
    grupos["Resultado do Exercício"] = (grupos["Lucro Líquido do Exercício"] || 0) + (grupos["(-) Distribuição de Lucros"] || 0);

    return grupos;
  }

  // Função para carregar detalhes mensais de uma conta
  async function carregarDetalhesMensaisConta(nomeConta: string) {
    if (!currentCompany?.id) return;
    
    setLoadingDetalhes(true);
    
    try {
      // Determinar período de análise para os 13 meses anteriores
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtual = hoje.getMonth() + 1;
      
      const dataFim = new Date(anoAtual, mesAtual - 1, 0); // Último dia do mês anterior
      const dataInicio = new Date(anoAtual, mesAtual - 1, 1); // Primeiro dia do mês atual
      dataInicio.setMonth(dataInicio.getMonth() - 13); // Voltar 13 meses
      
      const { data, error } = await supabase
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
        .gte('data_movimentacao', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_movimentacao', format(dataFim, 'yyyy-MM-dd'));
      
      if (error) throw error;
      
      // Agrupar valores mensais
      const valores_mensais = [];
      let dataAtual = new Date(dataInicio);
      
      while (dataAtual <= dataFim) {
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth() + 1;
        const mesNome = format(dataAtual, 'MMMM', { locale: ptBR });
        
        const valorMes = data.reduce((soma, mov) => {
          const dataMov = new Date(mov.data_movimentacao);
          const considerarDre = mov.movimentacoes?.considerar_dre !== false;
          const planoContas = mov.plano_contas?.plano_contas;
          
          if (
            dataMov.getFullYear() === ano &&
            dataMov.getMonth() + 1 === mes &&
            considerarDre &&
            planoContas?.descricao === nomeConta
          ) {
            return soma + Number(mov.valor);
          }
          return soma;
        }, 0);
        
        valores_mensais.push({
          mes,
          ano,
          mes_nome: mesNome,
          valor: valorMes
        });
        
        dataAtual.setMonth(dataAtual.getMonth() + 1);
      }
      
      // Calcular a média dos valores dos últimos 13 meses
      const mediaValores = valores_mensais.length > 0
        ? valores_mensais.reduce((soma, vm) => soma + vm.valor, 0) / valores_mensais.length
        : 0;
      
      setOpenModalDetalhes(true);
      setLoadingDetalhes(false);
      
      setDetalhesConta({
        nome_conta: nomeConta,
        valores_mensais,
        media: mediaValores
      });
      
    } catch (error) {
      console.error("Erro ao carregar detalhes da conta:", error);
      toast.error("Erro ao carregar detalhes mensais da conta");
      setLoadingDetalhes(false);
    }
  }

  // Função para formatar a variação
  function formatarVariacao(variacao: number): string {
    const sinal = variacao > 0 ? '+' : '';
    return `${sinal}${variacao.toFixed(2)}%`;
  }

  // Função para renderizar o texto do período de análise
  function renderizarTextoPeriodo() {
    if (filtro.tipo_comparacao === 'mes_anterior') {
      const dataAtual = new Date(filtro.ano, filtro.mes - 1, 1);
      const dataAnterior = subMonths(dataAtual, 1);

      return (
        <>
          Comparativo entre o mês de {format(dataAtual, 'MMMM/yyyy', { locale: ptBR })} e o mês anterior, {format(dataAnterior, 'MMMM/yyyy', { locale: ptBR })}.
        </>
      );
    } else if (filtro.tipo_comparacao === 'ano_anterior') {
      return (
        <>
          Comparativo entre o mês de {format(new Date(filtro.ano, filtro.mes - 1, 1), 'MMMM/yyyy', { locale: ptBR })} e o mesmo mês do ano anterior.
        </>
      );
    } else {
      // Média dos últimos 13 meses
      const dataAtual = new Date(filtro.ano, filtro.mes - 1, 1);
      const dataInicio = new Date(filtro.ano, filtro.mes - 1, 1);
      dataInicio.setMonth(dataInicio.getMonth() - 13);
      
      return (
        <>
          Os valores apresentados correspondem aos 13 meses anteriores a {format(dataAtual, 'M/yyyy')}, 
          desde {format(dataInicio, 'MMMM/yyyy', { locale: ptBR })} até {format(dataAtual, 'MMMM/yyyy', { locale: ptBR })}.
        </>
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise DRE</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-wrap gap-4 mb-6 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Ano</label>
            <Select
              value={filtro.ano.toString()}
              onValueChange={(v) => setFiltro(prev => ({ ...prev, ano: Number(v) }))}
            >
              <SelectTrigger className="min-w-[90px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Mês</label>
            <Select
              value={filtro.mes.toString()}
              onValueChange={(v) => setFiltro(prev => ({ ...prev, mes: Number(v) }))}
            >
              <SelectTrigger className="min-w-[140px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                  <SelectItem key={mes} value={mes.toString()}>{format(new Date(2023, mes - 1, 1), 'MMMM', { locale: ptBR })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tipo de Comparação</label>
            <Select
              value={filtro.tipo_comparacao}
              onValueChange={(v) => setFiltro(prev => ({ ...prev, tipo_comparacao: v as 'mes_anterior' | 'ano_anterior' | 'media_13_meses' }))}
            >
              <SelectTrigger className="min-w-[180px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                <SelectItem value="ano_anterior">Mesmo Mês do Ano Anterior</SelectItem>
                <SelectItem value="media_13_meses">Média dos Últimos 13 Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Variação Mínima (%)</label>
            <input
              type="number"
              className="bg-white rounded px-3 py-2 text-sm w-24"
              value={filtro.percentual_minimo}
              onChange={(e) => setFiltro(prev => ({ ...prev, percentual_minimo: Number(e.target.value) }))}
            />
          </div>
          <Button type="button" size="sm" onClick={carregarAnalise} disabled={loadingAnalise}>
            {loadingAnalise ? "Carregando..." : "Atualizar Análise"}
          </Button>
        </form>

        {loadingAnalise ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor Atual</TableHead>
                  <TableHead className="text-right">Valor Comparação</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Avaliação</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analise.map(item => (
                  <TableRow key={item.nome}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valor_atual)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valor_comparacao)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.variacao_valor)}</TableCell>
                    <TableCell className="text-right">{formatarVariacao(item.variacao_percentual)}</TableCell>
                    <TableCell className="text-center">
                      {item.avaliacao === 'positiva' && <span className="text-green-500">Positiva</span>}
                      {item.avaliacao === 'negativa' && <span className="text-red-500">Negativa</span>}
                      {item.avaliacao === 'estavel' && <span>Estável</span>}
                      {item.avaliacao === 'atencao' && <span className="text-orange-500">Atenção</span>}
                    </TableCell>
                    <TableCell className="w-10">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => carregarDetalhesMensaisConta(item.nome)} disabled={loadingDetalhes}>
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Detalhes Mensais</DialogTitle>
                            <DialogDescription>
                              Detalhes mensais da conta {detalhesConta?.nome_conta}
                            </DialogDescription>
                          </DialogHeader>
                          {loadingDetalhes ? (
                            <div className="space-y-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-5 w-full" />
                              ))}
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Mês/Ano</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detalhesConta?.valores_mensais.map(vm => (
                                    <TableRow key={`${vm.mes}-${vm.ano}`}>
                                      <TableCell>{vm.mes_nome}/{vm.ano}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(vm.valor)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Exibir período de análise */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info size={16} />
              <span className="text-sm font-medium">Período de análise</span>
            </div>
            <p className="text-sm mt-1">
              {renderizarTextoPeriodo()}
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
