
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, endOfMonth } from "date-fns";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";

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

const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());

// Interface para dados do DRE
interface DadosDRE {
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  custos: number;
  lucro_bruto: number;
  despesas_operacionais: number;
  receitas_financeiras: number;
  despesas_financeiras: number;
  resultado_antes_ir: number;
  impostos: number;
  lucro_liquido: number;
  distribuicao_lucros: number;
  resultado_exercicio: number;
}

interface DadosComparacao {
  [ano: string]: DadosDRE;
}

export default function AnaliseDrePage() {
  const [anoBase, setAnoBase] = useState(new Date().getFullYear().toString());
  const [anoComparacao, setAnoComparacao] = useState((new Date().getFullYear() - 1).toString());
  const { currentCompany } = useCompany();

  // Query para buscar dados do DRE
  const { data: dadosDRE, isLoading } = useQuery({
    queryKey: ["analise-dre-data", currentCompany?.id, anoBase, anoComparacao],
    queryFn: async () => {
      if (!currentCompany?.id) return null;

      try {
        const dados: DadosComparacao = {};

        // Buscar dados para ambos os anos
        for (const ano of [anoBase, anoComparacao]) {
          const startDate = format(new Date(parseInt(ano), 0, 1), 'yyyy-MM-dd');
          const endDate = format(new Date(parseInt(ano), 11, 31), 'yyyy-MM-dd');

          const { data: movimentacoes, error } = await supabase
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
            .gte('data_movimentacao', startDate)
            .lte('data_movimentacao', endDate);

          if (error) throw error;

          dados[ano] = processarMovimentacoesDRE(movimentacoes || []);
        }

        return dados;
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados do DRE');
        return null;
      }
    }
  });

  // Função para processar movimentações e calcular totais do DRE - CORRIGIDA
  function processarMovimentacoesDRE(movimentacoes: any[]): DadosDRE {
    let receitaBruta = 0;
    let deducoes = 0;
    let custos = 0;
    let despesasOperacionais = 0;
    let receitasFinanceiras = 0;
    let despesasFinanceiras = 0;
    let distribuicaoLucros = 0;
    let impostos = 0;

    movimentacoes.forEach(mov => {
      // Verificar se deve considerar no DRE
      const considerarDreMovimentacao = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDreMovimentacao) return;

      const planoContas = mov.plano_contas?.plano_contas;
      
      // Novo filtro: verificar se a conta deve ser considerada no DRE
      const considerarDreConta = planoContas?.considerar_dre !== false;
      if (!considerarDreConta) return;

      const valor = Number(mov.valor) || 0;
      const tipoOperacao = mov.movimentacoes?.tipo_operacao;

      // Inicializar flag de processamento
      let processado = false;
      
      // Primeiro: tentar usar classificação DRE específica
      if (planoContas && planoContas.classificacao_dre && planoContas.classificacao_dre !== 'nao_classificado') {
        switch (planoContas.classificacao_dre) {
          case 'receita_bruta':
            receitaBruta += valor;
            processado = true;
            break;
          case 'deducoes':
            deducoes += valor;
            processado = true;
            break;
          case 'custos':
            custos += valor;
            processado = true;
            break;
          case 'despesas_operacionais':
            despesasOperacionais += valor;
            processado = true;
            break;
          case 'receitas_financeiras':
            receitasFinanceiras += valor;
            processado = true;
            break;
          case 'despesas_financeiras':
            despesasFinanceiras += valor;
            processado = true;
            break;
          case 'distribuicao_lucros':
            distribuicaoLucros += valor;
            processado = true;
            break;
          case 'impostos_irpj_csll':
            impostos += valor;
            processado = true;
            break;
        }
      } 
      
      // Segundo: lógica alternativa quando não há classificação DRE específica
      if (!processado && planoContas) {
        if (tipoOperacao === 'receber' && !mov.movimentacoes?.categoria_id) {
          receitaBruta += valor;
        } else {
          const { tipo, descricao } = planoContas;
          
          if (tipo === 'receita') {
            if (descricao && (descricao.toLowerCase().includes('financeira') || descricao.toLowerCase().includes('juros') || descricao.toLowerCase().includes('rendimento'))) {
              receitasFinanceiras += valor;
            } else {
              receitaBruta += valor;
            }
          } else if (tipo === 'despesa') {
            if (descricao) {
              const desc = descricao.toLowerCase();
              if (desc === 'das - simples nacional') {
                deducoes += valor;
              } else if (desc.includes('pró-labore') || desc.includes('pro-labore') || desc.includes('pró labore') || desc.includes('pro labore') || desc === 'inss' || desc.includes('honorários contábeis') || desc.includes('honorarios contabeis')) {
                despesasOperacionais += valor;
              } else if (desc.includes('distribuição de lucros') || desc.includes('distribuicao de lucros')) {
                distribuicaoLucros += valor;
              } else if (desc.includes('financeira') || desc.includes('juros') || desc.includes('tarifas')) {
                despesasFinanceiras += valor;
              } else {
                custos += valor;
              }
            } else {
              custos += valor;
            }
          }
        }
      }
    });

    const receitaLiquida = receitaBruta + deducoes;
    const lucroBruto = receitaLiquida + custos;
    const resultadoAntesIR = lucroBruto + despesasOperacionais + receitasFinanceiras + despesasFinanceiras;
    const lucroLiquido = resultadoAntesIR + impostos;
    const resultadoExercicio = lucroLiquido + distribuicaoLucros;

    return {
      receita_bruta: receitaBruta,
      deducoes: deducoes,
      receita_liquida: receitaLiquida,
      custos: custos,
      lucro_bruto: lucroBruto,
      despesas_operacionais: despesasOperacionais,
      receitas_financeiras: receitasFinanceiras,
      despesas_financeiras: despesasFinanceiras,
      resultado_antes_ir: resultadoAntesIR,
      impostos: impostos,
      lucro_liquido: lucroLiquido,
      distribuicao_lucros: distribuicaoLucros,
      resultado_exercicio: resultadoExercicio
    };
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });
  }

  // Função para calcular variação percentual
  function calcularVariacao(valorAtual: number, valorAnterior: number) {
    if (valorAnterior === 0) return null;
    return ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;
  }

  // Função para determinar o tipo de conta baseado no nome
  function getTipoConta(nomeConta: string): 'receita' | 'despesa' {
    if (nomeConta.includes('Despesa') || nomeConta.includes('Custo') || nomeConta.includes('Deduções') || nomeConta.includes('IRPJ') || nomeConta.includes('Distribuição')) {
      return 'despesa';
    }
    return 'receita';
  }

  // Função para renderizar variação
  function renderVariacao(valorAtual: number, valorAnterior: number, tipoConta: 'receita' | 'despesa' = 'receita') {
    const variacao = calcularVariacao(valorAtual, valorAnterior);
    if (variacao === null) return <span>-</span>;
    
    const tooltip = `Variação de ${formatCurrency(valorAnterior)} para ${formatCurrency(valorAtual)}`;
    return <VariationDisplay value={variacao} tooltip={tooltip} tipoConta={tipoConta} />;
  }

  const itensAnalise = [
    { label: "Receita Bruta", key: "receita_bruta" as keyof DadosDRE },
    { label: "(-) Deduções", key: "deducoes" as keyof DadosDRE },
    { label: "Receita Líquida", key: "receita_liquida" as keyof DadosDRE },
    { label: "(-) Custos", key: "custos" as keyof DadosDRE },
    { label: "Lucro Bruto", key: "lucro_bruto" as keyof DadosDRE },
    { label: "(-) Despesas Operacionais", key: "despesas_operacionais" as keyof DadosDRE },
    { label: "(+) Receitas Financeiras", key: "receitas_financeiras" as keyof DadosDRE },
    { label: "(-) Despesas Financeiras", key: "despesas_financeiras" as keyof DadosDRE },
    { label: "Resultado Antes IR", key: "resultado_antes_ir" as keyof DadosDRE },
    { label: "(-) IRPJ/CSLL", key: "impostos" as keyof DadosDRE },
    { label: "Lucro Líquido do Exercício", key: "lucro_liquido" as keyof DadosDRE },
    { label: "(-) Distribuição de Lucros", key: "distribuicao_lucros" as keyof DadosDRE },
    { label: "Resultado do Exercício", key: "resultado_exercicio" as keyof DadosDRE }
  ];

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise DRE - Comparação entre Anos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ano Base</label>
              <Select value={anoBase} onValueChange={setAnoBase}>
                <SelectTrigger className="min-w-[90px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem value={a} key={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ano Comparação</label>
              <Select value={anoComparacao} onValueChange={setAnoComparacao}>
                <SelectTrigger className="min-w-[90px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem value={a} key={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          {/* Estado de carregamento */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">Carregando análise do DRE...</div>
            </div>
          ) : dadosDRE ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">{anoBase}</TableHead>
                    <TableHead className="text-right">{anoComparacao}</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensAnalise.map(item => {
                    const valorBase = dadosDRE[anoBase]?.[item.key] || 0;
                    const valorComparacao = dadosDRE[anoComparacao]?.[item.key] || 0;
                    const variacao = valorBase - valorComparacao;
                    const tipoConta = getTipoConta(item.label);

                    return (
                      <TableRow key={item.key}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(valorBase)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(valorComparacao)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(tipoConta === 'despesa' ? -variacao : variacao)}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderVariacao(valorBase, valorComparacao, tipoConta)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Não foi possível carregar os dados do DRE
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
