
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  AnaliseVariacao, 
  DetalhesMensaisConta, 
  FiltroAnaliseDre, 
  ValorMensal 
} from "@/types/financeiro";

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
  { label: "Dezembro", value: "12" }
];

// Array de anos (máx. últimos 5 anos)
const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());

// Contas principais do DRE
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

interface DadosAnaliseDRE {
  conta: string;
  valores: ValorMensal[];
  total: number;
  variacao?: AnaliseVariacao;
}

export default function AnaliseDrePage() {
  const { currentCompany } = useCompany();
  const [anoInicial, setAnoInicial] = useState((new Date().getFullYear() - 1).toString());
  const [anoFinal, setAnoFinal] = useState(new Date().getFullYear().toString());
  const [contaSelecionada, setContaSelecionada] = useState<string>("todas");

  // Query para buscar dados de análise do DRE
  const { data: dadosAnalise = [], isLoading } = useQuery({
    queryKey: ["analise-dre", currentCompany?.id, anoInicial, anoFinal, contaSelecionada],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      try {
        const startDateInicial = format(new Date(parseInt(anoInicial), 0, 1), 'yyyy-MM-dd');
        const endDateInicial = format(new Date(parseInt(anoInicial), 11, 31), 'yyyy-MM-dd');
        const startDateFinal = format(new Date(parseInt(anoFinal), 0, 1), 'yyyy-MM-dd');
        const endDateFinal = format(new Date(parseInt(anoFinal), 11, 31), 'yyyy-MM-dd');

        // Buscar dados do ano inicial
        const { data: dadosAnoInicial, error: errorInicial } = await supabase
          .from('fluxo_caixa')
          .select(`
            *,
            movimentacoes (
              categoria_id,
              tipo_operacao,
              considerar_dre
            ),
            plano_contas:movimentacoes(plano_contas(id, tipo, descricao, classificacao_dre, considerar_dre))
          `)
          .eq('empresa_id', currentCompany.id)
          .gte('data_movimentacao', startDateInicial)
          .lte('data_movimentacao', endDateInicial);

        if (errorInicial) throw errorInicial;

        // Buscar dados do ano final
        const { data: dadosAnoFinal, error: errorFinal } = await supabase
          .from('fluxo_caixa')
          .select(`
            *,
            movimentacoes (
              categoria_id,
              tipo_operacao,
              considerar_dre
            ),
            plano_contas:movimentacoes(plano_contas(id, tipo, descricao, classificacao_dre, considerar_dre))
          `)
          .eq('empresa_id', currentCompany.id)
          .gte('data_movimentacao', startDateFinal)
          .lte('data_movimentacao', endDateFinal);

        if (errorFinal) throw errorFinal;

        // Processar dados
        const resultadosInicial = processarMovimentacoes(dadosAnoInicial || []);
        const resultadosFinal = processarMovimentacoes(dadosAnoFinal || []);

        // Comparar resultados
        const analiseComparativa: DadosAnaliseDRE[] = contasDRE.map(conta => {
          const valorInicial = resultadosInicial.find(r => r.tipo === conta)?.valor || 0;
          const valorFinal = resultadosFinal.find(r => r.tipo === conta)?.valor || 0;

          let variacao: AnaliseVariacao | undefined;
          if (valorInicial !== 0) {
            const percentual = ((valorFinal - valorInicial) / Math.abs(valorInicial)) * 100;
            variacao = {
              valor: valorFinal - valorInicial,
              percentual: Math.abs(percentual),
              tipo: percentual >= 0 ? 'aumento' : 'reducao'
            };
          }

          return {
            conta,
            valores: [
              { mes: anoInicial, valor: valorInicial },
              { mes: anoFinal, valor: valorFinal }
            ],
            total: valorFinal,
            variacao
          };
        });

        return contaSelecionada === "todas" 
          ? analiseComparativa 
          : analiseComparativa.filter(item => item.conta === contaSelecionada);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados da análise DRE');
        return [];
      }
    },
    enabled: !!currentCompany?.id
  });

  // Função para processar movimentações e calcular totais por conta DRE
  function processarMovimentacoes(movimentacoes: any[]) {
    let receitaBruta = 0;
    let deducoes = 0;
    let custos = 0;
    let despesasOperacionais = 0;
    let receitasFinanceiras = 0;
    let despesasFinanceiras = 0;
    let distribuicaoLucros = 0;
    let impostos = 0;

    movimentacoes.forEach(mov => {
      const considerarDreMovimentacao = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDreMovimentacao) return;

      const planoContas = mov.plano_contas?.plano_contas;
      const considerarDreConta = planoContas?.considerar_dre !== false;
      if (!considerarDreConta) return;

      const valor = Number(mov.valor);
      const tipoOperacao = mov.movimentacoes?.tipo_operacao;

      if (planoContas && planoContas.classificacao_dre && planoContas.classificacao_dre !== 'nao_classificado') {
        switch (planoContas.classificacao_dre) {
          case 'receita_bruta':
            receitaBruta += valor;
            break;
          case 'deducoes':
            deducoes += valor;
            break;
          case 'custos':
            custos += valor;
            break;
          case 'despesas_operacionais':
            despesasOperacionais += valor;
            break;
          case 'receitas_financeiras':
            receitasFinanceiras += valor;
            break;
          case 'despesas_financeiras':
            despesasFinanceiras += valor;
            break;
          case 'distribuicao_lucros':
            distribuicaoLucros += valor;
            break;
          case 'impostos_irpj_csll':
            impostos += valor;
            break;
        }
      } else {
        // Lógica de fallback para movimentações sem classificação específica
        if (tipoOperacao === 'receber' && (!mov.movimentacoes?.categoria_id || !planoContas)) {
          receitaBruta += valor;
        } else if (planoContas) {
          const { tipo, descricao } = planoContas;
          
          if (tipo === 'receita') {
            if (descricao.toLowerCase().includes('financeira') || 
                descricao.toLowerCase().includes('juros') || 
                descricao.toLowerCase().includes('rendimento')) {
              receitasFinanceiras += valor;
            } else {
              receitaBruta += valor;
            }
          } else if (tipo === 'despesa') {
            switch (descricao.toLowerCase()) {
              case 'das - simples nacional':
                deducoes += valor;
                break;
              case 'pró-labore':
              case 'pro-labore':
              case 'pró labore':
              case 'pro labore':
              case 'inss':
              case 'honorários contábeis':
              case 'honorarios contabeis':
                despesasOperacionais += valor;
                break;
              case 'distribuição de lucros':
              case 'distribuicao de lucros':
                distribuicaoLucros += valor;
                break;
              default:
                if (descricao.toLowerCase().includes('financeira') || 
                    descricao.toLowerCase().includes('juros') || 
                    descricao.toLowerCase().includes('tarifas')) {
                  despesasFinanceiras += valor;
                } else {
                  custos += valor;
                }
            }
          }
        }
      }
    });

    // Calcular totais derivados
    const receitaLiquida = receitaBruta + deducoes;
    const lucroBruto = receitaLiquida + custos;
    const resultadoOperacional = lucroBruto + despesasOperacionais;
    const resultadoFinanceiro = resultadoOperacional + receitasFinanceiras + despesasFinanceiras;
    const resultadoAntesIR = resultadoFinanceiro;
    const lucroLiquido = resultadoAntesIR + impostos;
    const resultadoExercicio = lucroLiquido + distribuicaoLucros;

    return [
      { tipo: "Receita Bruta", valor: receitaBruta },
      { tipo: "(-) Deduções", valor: deducoes },
      { tipo: "Receita Líquida", valor: receitaLiquida },
      { tipo: "(-) Custos", valor: custos },
      { tipo: "Lucro Bruto", valor: lucroBruto },
      { tipo: "(-) Despesas Operacionais", valor: despesasOperacionais },
      { tipo: "Resultado Operacional", valor: resultadoOperacional },
      { tipo: "(+) Receitas Financeiras", valor: receitasFinanceiras },
      { tipo: "(-) Despesas Financeiras", valor: despesasFinanceiras },
      { tipo: "Resultado Antes IR", valor: resultadoAntesIR },
      { tipo: "(-) IRPJ/CSLL", valor: impostos },
      { tipo: "Lucro Líquido do Exercício", valor: lucroLiquido },
      { tipo: "(-) Distribuição de Lucros", valor: distribuicaoLucros },
      { tipo: "Resultado do Exercício", valor: resultadoExercicio }
    ];
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });
  }

  function renderVariacao(variacao: AnaliseVariacao) {
    const Icon = variacao.tipo === 'aumento' ? TrendingUp : TrendingDown;
    const color = variacao.tipo === 'aumento' ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon className="h-4 w-4" />
        <span>{variacao.percentual.toFixed(1)}%</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise Comparativa DRE</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ano Inicial</label>
              <Select value={anoInicial} onValueChange={setAnoInicial}>
                <SelectTrigger className="min-w-[90px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem value={a} key={`inicial-${a}`}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ano Final</label>
              <Select value={anoFinal} onValueChange={setAnoFinal}>
                <SelectTrigger className="min-w-[90px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem value={a} key={`final-${a}`}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Conta</label>
              <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                <SelectTrigger className="min-w-[200px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Contas</SelectItem>
                  {contasDRE.map(conta => (
                    <SelectItem value={conta} key={conta}>{conta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          {/* Estado de carregamento */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">Carregando análise comparativa...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">{anoInicial}</TableHead>
                    <TableHead className="text-right">{anoFinal}</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosAnalise.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.conta}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.valores[0]?.valor || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.valores[1]?.valor || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.variacao ? renderVariacao(item.variacao) : <Minus className="h-4 w-4 text-gray-400" />}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.variacao ? formatCurrency(item.variacao.valor) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
