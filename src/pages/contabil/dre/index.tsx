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
import { ChevronDown } from "lucide-react";
import "../../../styles/collapsible.css";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";

// Arrays de meses e anos
const meses = [{
  label: "Janeiro",
  value: "01"
}, {
  label: "Fevereiro",
  value: "02"
}, {
  label: "Março",
  value: "03"
}, {
  label: "Abril",
  value: "04"
}, {
  label: "Maio",
  value: "05"
}, {
  label: "Junho",
  value: "06"
}, {
  label: "Julho",
  value: "07"
}, {
  label: "Agosto",
  value: "08"
}, {
  label: "Setembro",
  value: "09"
}, {
  label: "Outubro",
  value: "10"
}, {
  label: "Novembro",
  value: "11"
}, {
  label: "Dezembro",
  value: "12"
}];
const mesesComTodos = [{
  label: "Todos os meses",
  value: "todos"
}, ...meses];

// Array de anos (máx. últimos 5 anos)
const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());

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
const contasDRE = ["Receita Bruta", "(-) Deduções", "Receita Líquida", "(-) Custos", "Lucro Bruto", "(-) Despesas Operacionais", "(+) Receitas Financeiras", "(-) Despesas Financeiras", "Resultado Antes IR", "(-) IRPJ/CSLL", "Lucro Líquido do Exercício", "(-) Distribuição de Lucros", "Resultado do Exercício"];
export default function DrePage() {
  const [visualizacao, setVisualizacao] = useState<"acumulado" | "comparar_anos" | "mensal">("acumulado");
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [anosComparar, setAnosComparar] = useState<string[]>([new Date().getFullYear().toString(), (new Date().getFullYear() - 1).toString()]);
  const [mes, setMes] = useState("01");
  const [anoMensal, setAnoMensal] = useState(new Date().getFullYear().toString());
  const {
    currentCompany
  } = useCompany();
  const [contaExpandida, setContaExpandida] = useState<string | null>(null);
  const [contasExpandidasTodosMeses, setContasExpandidasTodosMeses] = useState<Record<string, boolean>>({});
  const [contasExpandidasComparacao, setContasExpandidasComparacao] = useState<Record<string, boolean>>({});

  // Query para buscar dados do DRE
  const {
    data: dadosDRE = [],
    isLoading
  } = useQuery({
    queryKey: ["dre-data", currentCompany?.id, ano, mes, visualizacao, anoMensal, anosComparar],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      let dadosAgrupados: any = [];
      try {
        if (visualizacao === "mensal" && mes !== "todos") {
          const startDate = format(new Date(parseInt(anoMensal), parseInt(mes) - 1, 1), 'yyyy-MM-dd');
          const endDate = format(endOfMonth(new Date(parseInt(anoMensal), parseInt(mes) - 1, 1)), 'yyyy-MM-dd');
          const {
            data: movimentacoes,
            error
          } = await supabase.from('fluxo_caixa').select(`
              *,
              movimentacoes!movimentacao_id (
                categoria_id,
                tipo_operacao,
                considerar_dre,
                plano_contas:categoria_id(id, tipo, descricao, classificacao_dre, considerar_dre)
              )
            `).eq('empresa_id', currentCompany.id).gte('data_movimentacao', startDate).lte('data_movimentacao', endDate);
          if (error) throw error;
          dadosAgrupados = processarMovimentacoes(movimentacoes || []);
        } else if (visualizacao === "mensal" && mes === "todos") {
          const startDate = format(new Date(parseInt(anoMensal), 0, 1), 'yyyy-MM-dd');
          const endDate = format(new Date(parseInt(anoMensal), 11, 31), 'yyyy-MM-dd');
          const {
            data: movimentacoes,
            error
          } = await supabase.from('fluxo_caixa').select(`
              *,
              movimentacoes!movimentacao_id (
                categoria_id,
                tipo_operacao,
                considerar_dre,
                plano_contas:categoria_id(id, tipo, descricao, classificacao_dre, considerar_dre)
              )
            `).eq('empresa_id', currentCompany.id).gte('data_movimentacao', startDate).lte('data_movimentacao', endDate);
          if (error) throw error;

          // Obter movimentações por mês sem considerar timezone nas datas
          const movimentacoesPorMes = (movimentacoes || []).reduce((acc: any, mov) => {
            // Extrair apenas o mês utilizando substring para evitar problemas de timezone
            const mesMovimentacao = mov.data_movimentacao.substring(5, 7);
            if (!acc[mesMovimentacao]) {
              acc[mesMovimentacao] = [];
            }
            acc[mesMovimentacao].push(mov);
            return acc;
          }, {});
          const resultadosMensais: ResultadoMensal[] = [];
          for (const [mesDado, movs] of Object.entries(movimentacoesPorMes)) {
            const dados = processarMovimentacoes(movs as any[]);
            const contasPorTipo: Record<string, ContaContabilAgrupamento[]> = {};
            dados.forEach((grupo: GrupoMovimentacao) => {
              if (grupo.contas && grupo.contas.length > 0) {
                contasPorTipo[grupo.tipo] = grupo.contas;
              }
            });
            resultadosMensais.push({
              mes: mesDado,
              dados,
              contasPorTipo
            });
          }
          return resultadosMensais.sort((a, b) => a.mes.localeCompare(b.mes));
        } else if (visualizacao === "comparar_anos") {
          const dadosPorAno: Record<string, GrupoMovimentacao[]> = {};
          for (const anoSelecionado of anosComparar) {
            const startDate = format(new Date(parseInt(anoSelecionado), 0, 1), 'yyyy-MM-dd');
            const endDate = format(new Date(parseInt(anoSelecionado), 11, 31), 'yyyy-MM-dd');
            const {
              data: movimentacoes,
              error
            } = await supabase.from('fluxo_caixa').select(`
                *,
                movimentacoes!movimentacao_id (
                  categoria_id,
                  tipo_operacao,
                  considerar_dre,
                  plano_contas:categoria_id(id, tipo, descricao, classificacao_dre, considerar_dre)
                )
              `).eq('empresa_id', currentCompany.id).gte('data_movimentacao', startDate).lte('data_movimentacao', endDate);
            if (error) throw error;
            dadosPorAno[anoSelecionado] = processarMovimentacoes(movimentacoes || []);
          }
          return dadosPorAno;
        } else {
          const startDate = format(new Date(parseInt(ano), 0, 1), 'yyyy-MM-dd');
          const endDate = format(new Date(parseInt(ano), 11, 31), 'yyyy-MM-dd');
          const {
            data: movimentacoes,
            error
          } = await supabase.from('fluxo_caixa').select(`
              *,
              movimentacoes!movimentacao_id (
                categoria_id,
                tipo_operacao,
                considerar_dre,
                plano_contas:categoria_id(id, tipo, descricao, classificacao_dre, considerar_dre)
              )
            `).eq('empresa_id', currentCompany.id).gte('data_movimentacao', startDate).lte('data_movimentacao', endDate);
          if (error) throw error;
          dadosAgrupados = processarMovimentacoes(movimentacoes || []);
        }
        return dadosAgrupados;
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados do DRE');
        return [];
      }
    }
  });

  // Função para processar movimentações e calcular totais
  function processarMovimentacoes(movimentacoes: any[]) {
    const grupos: {
      [key: string]: MovimentacaoDetalhe[];
    } = {
      "Receita Bruta": [],
      "Deduções": [],
      "Custos": [],
      "Despesas Operacionais": [],
      "Receitas Financeiras": [],
      "Despesas Financeiras": [],
      "Distribuição de Lucros": [],
      "IRPJ/CSLL": []
    };
    const contasAgrupamento: {
      [key: string]: {
        [contaId: string]: MovimentacaoDetalhe[];
      };
    } = {
      "Receita Bruta": {},
      "Deduções": {},
      "Custos": {},
      "Despesas Operacionais": {},
      "Receitas Financeiras": {},
      "Despesas Financeiras": {},
      "Distribuição de Lucros": {},
      "IRPJ/CSLL": {}
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
      const considerarDreMovimentacao = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDreMovimentacao) return;

      const planoContas = mov.movimentacoes?.plano_contas;
      
      // Novo filtro: verificar se a conta deve ser considerada no DRE
      const considerarDreConta = planoContas?.considerar_dre !== false;
      if (!considerarDreConta) return;

      const valor = Number(mov.valor);
      const tipoOperacao = mov.movimentacoes?.tipo_operacao;
      const descricaoCategoria = planoContas?.descricao || 'Sem categoria';
      const contaId = planoContas?.id || 'sem_conta';
      const dataFormatada = mov.data_movimentacao ? mov.data_movimentacao.substring(8, 10) + "/" + mov.data_movimentacao.substring(5, 7) + "/" + mov.data_movimentacao.substring(0, 4) : '';
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
          if (!contasAgrupamento[grupoDestino][contaId]) {
            contasAgrupamento[grupoDestino][contaId] = [];
          }
          contasAgrupamento[grupoDestino][contaId].push(detalhe);
        }
      } else {
        if (tipoOperacao === 'receber' && (!mov.movimentacoes?.categoria_id || !planoContas)) {
          receitaBruta += valor;
          grupos["Receita Bruta"].push(detalhe);
          if (!contasAgrupamento["Receita Bruta"][contaId]) {
            contasAgrupamento["Receita Bruta"][contaId] = [];
          }
          contasAgrupamento["Receita Bruta"][contaId].push(detalhe);
        } else if (planoContas) {
          const {
            tipo,
            descricao
          } = planoContas;
          let grupoDestino = "";
          if (tipo === 'receita') {
            if (descricao.toLowerCase().includes('financeira') || descricao.toLowerCase().includes('juros') || descricao.toLowerCase().includes('rendimento')) {
              receitasFinanceiras += valor;
              grupoDestino = "Receitas Financeiras";
            } else {
              receitaBruta += valor;
              grupoDestino = "Receita Bruta";
            }
          } else if (tipo === 'despesa') {
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
                if (descricao.toLowerCase().includes('financeira') || descricao.toLowerCase().includes('juros') || descricao.toLowerCase().includes('tarifas')) {
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
            if (!contasAgrupamento[grupoDestino][contaId]) {
              contasAgrupamento[grupoDestino][contaId] = [];
            }
            contasAgrupamento[grupoDestino][contaId].push(detalhe);
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
    const converterAgrupamentoContas = (grupoNome: string) => {
      const contas: ContaContabilAgrupamento[] = [];
      const contasObj = contasAgrupamento[grupoNome];
      Object.keys(contasObj).forEach(contaId => {
        const detalhes = contasObj[contaId];
        // Certifique-se de que os valores são tratados como números antes de somar
        const valorTotal = detalhes.reduce((sum, d) => sum + Number(d.valor), 0);
        if (detalhes.length === 0 || contaId === "sem_conta") return;
        contas.push({
          conta_id: contaId,
          descricao: detalhes[0].conta_descricao || "Conta sem descrição",
          valor: valorTotal,
          detalhes: detalhes
        });
      });
      return contas.sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
    };
    return [{
      tipo: "Receita Bruta",
      valor: receitaBruta,
      detalhes: grupos["Receita Bruta"],
      contas: converterAgrupamentoContas("Receita Bruta")
    }, {
      tipo: "(-) Deduções",
      valor: deducoes,
      detalhes: grupos["Deduções"],
      contas: converterAgrupamentoContas("Deduções")
    }, {
      tipo: "Receita Líquida",
      valor: receitaLiquida,
      detalhes: []
    }, {
      tipo: "(-) Custos",
      valor: custos,
      detalhes: grupos["Custos"],
      contas: converterAgrupamentoContas("Custos")
    }, {
      tipo: "Lucro Bruto",
      valor: lucroBruto,
      detalhes: []
    }, {
      tipo: "(-) Despesas Operacionais",
      valor: despesasOperacionais,
      detalhes: grupos["Despesas Operacionais"],
      contas: converterAgrupamentoContas("Despesas Operacionais")
    }, {
      tipo: "Resultado Operacional",
      valor: resultadoOperacional,
      detalhes: []
    }, {
      tipo: "(+) Receitas Financeiras",
      valor: receitasFinanceiras,
      detalhes: grupos["Receitas Financeiras"],
      contas: converterAgrupamentoContas("Receitas Financeiras")
    }, {
      tipo: "(-) Despesas Financeiras",
      valor: despesasFinanceiras,
      detalhes: grupos["Despesas Financeiras"],
      contas: converterAgrupamentoContas("Despesas Financeiras")
    }, {
      tipo: "Resultado Antes IR",
      valor: resultadoAntesIR,
      detalhes: []
    }, {
      tipo: "(-) IRPJ/CSLL",
      valor: impostos,
      detalhes: grupos["IRPJ/CSLL"],
      contas: converterAgrupamentoContas("IRPJ/CSLL")
    }, {
      tipo: "Lucro Líquido do Exercício",
      valor: lucroLiquido,
      detalhes: []
    }, {
      tipo: "(-) Distribuição de Lucros",
      valor: distribuicaoLucros,
      detalhes: grupos["Distribuição de Lucros"],
      contas: converterAgrupamentoContas("Distribuição de Lucros")
    }, {
      tipo: "Resultado do Exercício",
      valor: resultadoExercicio,
      detalhes: []
    }];
  }

  // Função para verificar se o grupo tem detalhes
  const temDetalhes = (grupo: GrupoMovimentacao) => grupo.detalhes.length > 0 || grupo.contas && grupo.contas.length > 0;

  // Função para verificar se o grupo tem contas agrupadas
  const temContas = (grupo: GrupoMovimentacao) => grupo.contas && grupo.contas.length > 0;

  // Função para verificar se a conta tem subcontas na comparação entre anos
  const temSubcontasNaComparacao = (conta: string) => {
    if (!dadosDRE || visualizacao !== "comparar_anos") return false;
    const dadosComparativos = dadosDRE as Record<string, GrupoMovimentacao[]>;
    return anosComparar.some(ano => {
      const grupo = dadosComparativos[ano]?.find(g => g.tipo === conta);
      return grupo?.contas && grupo.contas.length > 0;
    });
  };
  function handleAnoCompararChange(anoAlterado: string) {
    let result: string[] = [];
    if (anosComparar.includes(anoAlterado)) {
      result = anosComparar.filter(a => a !== anoAlterado);
    } else {
      if (anosComparar.length < 5) result = [...anosComparar, anoAlterado];else result = anosComparar;
    }
    if (result.length === 0) result = [anoAlterado];
    setAnosComparar(result);
  }
  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });
  }
  function handleToggleContaExpansao(tipoConta: string) {
    setContaExpandida(contaExpandida === tipoConta ? null : tipoConta);
  }
  function toggleContaExpandidaTodosMeses(conta: string) {
    setContasExpandidasTodosMeses(prev => ({
      ...prev,
      [conta]: !prev[conta]
    }));
  }
  function toggleContaExpandidaComparacao(conta: string) {
    setContasExpandidasComparacao(prev => ({
      ...prev,
      [conta]: !prev[conta]
    }));
  }
  function getNomeMes(numeroMes: string): string {
    return meses.find(m => m.value === numeroMes)?.label || numeroMes;
  }

  // Função para calcular e exibir variação com o componente VariationDisplay
  function renderVariacao(valorAtual: number, valorAnterior: number, tipoConta: 'receita' | 'despesa' = 'receita') {
    if (valorAnterior === 0) return <span>-</span>;
    const variacao = (valorAtual - valorAnterior) / Math.abs(valorAnterior) * 100;
    const tooltip = `Variação de ${formatCurrency(valorAnterior)} para ${formatCurrency(valorAtual)}`;
    return <VariationDisplay value={variacao} tooltip={tooltip} tipoConta={tipoConta} />;
  }

  // Função para determinar o tipo de conta baseado no nome
  function getTipoConta(nomeConta: string): 'receita' | 'despesa' {
    if (nomeConta.includes('Despesa') || nomeConta.includes('Custo') || nomeConta.includes('Deduções') || nomeConta.includes('IRPJ') || nomeConta.includes('Distribuição')) {
      return 'despesa';
    }
    return 'receita';
  }

  // Função para calcular totais acumulados por conta
  function calcularTotaisAcumulados(resultadosMensais: ResultadoMensal[]) {
    const totaisAcumulados: Record<string, number> = {};
    
    contasDRE.forEach(conta => {
      let acumulado = 0;
      resultadosMensais.forEach(resultado => {
        const grupoMes = resultado.dados?.find(g => g.tipo === conta);
        acumulado += grupoMes?.valor || 0;
      });
      totaisAcumulados[conta] = acumulado;
    });
    
    return totaisAcumulados;
  }

  // Função para calcular totais acumulados por subconta
  function calcularTotaisAcumuladosSubcontas(resultadosMensais: ResultadoMensal[]) {
    const totaisAcumuladosSubcontas: Record<string, Record<string, number>> = {};
    
    contasDRE.forEach(conta => {
      totaisAcumuladosSubcontas[conta] = {};
      
      // Obter todas as subcontas únicas para esta conta
      const subccontasUnicas = Array.from(new Set(
        resultadosMensais.flatMap(resultado => {
          const grupo = resultado.dados?.find(g => g.tipo === conta);
          return grupo?.contas?.map(c => c.descricao) || [];
        })
      ));
      
      subccontasUnicas.forEach(descricaoConta => {
        let acumulado = 0;
        resultadosMensais.forEach(resultado => {
          const grupo = resultado.dados?.find(g => g.tipo === conta);
          const subconta = grupo?.contas?.find(c => c.descricao === descricaoConta);
          acumulado += subconta?.valor || 0;
        });
        totaisAcumuladosSubcontas[conta][descricaoConta] = acumulado;
      });
    });
    
    return totaisAcumuladosSubcontas;
  }

  return <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>DRE - Demonstração do Resultado Regime de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Visualização</label>
              <Select value={visualizacao} onValueChange={v => setVisualizacao(v as any)}>
                <SelectTrigger className="min-w-[180px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acumulado">Resultado Acumulado</SelectItem>
                  <SelectItem value="comparar_anos">Comparar Anos</SelectItem>
                  <SelectItem value="mensal">Resultado por Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {visualizacao === "acumulado" && <div>
                <label className="block text-xs text-muted-foreground mb-1">Ano</label>
                <Select value={ano} onValueChange={val => setAno(val)}>
                  <SelectTrigger className="min-w-[90px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map(a => <SelectItem value={a} key={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}
            {visualizacao === "comparar_anos" && <div>
                <label className="block text-xs text-muted-foreground mb-1">Anos para comparar</label>
                <div className="flex flex-wrap gap-2">
                  {anos.map(a => <Button key={a} variant={anosComparar.includes(a) ? "blue" : "outline"} size="sm" type="button" className="px-3 py-1 rounded" onClick={() => handleAnoCompararChange(a)} aria-pressed={anosComparar.includes(a)}>
                      {a}
                    </Button>)}
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">
                  Selecione até 5 anos
                </span>
              </div>}
            {visualizacao === "mensal" && <>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Ano</label>
                  <Select value={anoMensal} onValueChange={val => setAnoMensal(val)}>
                    <SelectTrigger className="min-w-[90px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map(a => <SelectItem value={a} key={"anoMensal-" + a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Mês</label>
                  <Select value={mes} onValueChange={val => setMes(val)}>
                    <SelectTrigger className="min-w-[140px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesComTodos.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>}
          </form>

          {/* Estado de carregamento */}
          {isLoading ? <div className="text-center py-4">
              <div className="animate-pulse">Carregando dados do DRE...</div>
            </div> : <div className="overflow-x-auto">
              {/* Acumulado padrão */}
              {visualizacao === "acumulado" && <Accordion type="single" collapsible className="w-full">
                  {dadosDRE.map((grupo: GrupoMovimentacao, index: number) => <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className={`${!temDetalhes(grupo) ? 'cursor-default hover:no-underline' : ''}`} disabled={!temDetalhes(grupo)}>
                        <div className="flex justify-between w-full pr-4">
                          <span>{grupo.tipo}</span>
                          <span>{formatCurrency(grupo.valor)}</span>
                        </div>
                      </AccordionTrigger>
                      
                      {temContas(grupo) ? <AccordionContent>
                          {grupo.contas && grupo.contas.length > 0 ? grupo.contas.map((conta, contaIndex) => <Collapsible key={contaIndex} className="px-4 py-2 border-t">
                              <CollapsibleTrigger className="flex justify-between w-full hover:underline">
                                <div className="flex items-center gap-2">
                                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 collapsible-icon" />
                                  <span className="font-medium">{conta.descricao}</span>
                                </div>
                                <span>{formatCurrency(conta.valor)}</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="pt-2 overflow-x-auto pl-4">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {conta.detalhes.map((detalhe, idx) => <TableRow key={idx}>
                                          <TableCell>{detalhe.data_movimentacao}</TableCell>
                                          <TableCell>{detalhe.descricao}</TableCell>
                                          <TableCell className="text-right">
                                            {formatCurrency(detalhe.valor)}
                                          </TableCell>
                                        </TableRow>)}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>) : <div className="px-4 py-2 text-muted-foreground">
                              Não há contas contábeis detalhadas para este grupo
                            </div>}
                        </AccordionContent> : temDetalhes(grupo) ? <AccordionContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Descrição</TableHead>
                                  <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {grupo.detalhes.map((detalhe, idx) => <TableRow key={idx}>
                                    <TableCell>{detalhe.data_movimentacao}</TableCell>
                                    <TableCell>{detalhe.descricao}</TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(detalhe.valor)}
                                    </TableCell>
                                  </TableRow>)}
                              </TableBody>
                            </Table>
                          </div>
                        </AccordionContent> : null}
                    </AccordionItem>)}
                </Accordion>}

              {/* Comparação de anos */}
              {visualizacao === "comparar_anos" && dadosDRE && <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        {anosComparar.map(a => <TableHead key={a} className="text-right">{a}</TableHead>)}
                        {anosComparar.length === 2 && <>
                            <TableHead className="text-right">Variação</TableHead>
                            <TableHead className="text-right">%</TableHead>
                          </>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasDRE.map(conta => {
                  const contemSubcontas = temSubcontasNaComparacao(conta);
                  const estaExpandida = contasExpandidasComparacao[conta] || false;
                  const tipoConta = getTipoConta(conta);
                  return <React.Fragment key={conta}>
                            <TableRow className={contemSubcontas && estaExpandida ? "bg-muted/50" : ""} onClick={() => contemSubcontas && toggleContaExpandidaComparacao(conta)}>
                              <TableCell className={contemSubcontas ? "cursor-pointer" : ""}>
                                <div className="flex items-center">
                                  {contemSubcontas && <ChevronDown className={`h-4 w-4 mr-2 transition-transform duration-200 ${estaExpandida ? 'rotate-180' : ''} collapsible-icon`} />}
                                  {conta}
                                </div>
                              </TableCell>
                              
                              {anosComparar.map((anoComp, idx) => {
                        const dadosAno = (dadosDRE as Record<string, GrupoMovimentacao[]>)[anoComp] || [];
                        const contaData = dadosAno.find(item => item.tipo === conta);
                        return <TableCell key={anoComp} className="text-right">
                                    {formatCurrency(contaData?.valor || 0)}
                                  </TableCell>;
                      })}

                              {anosComparar.length === 2 && (() => {
                        const anoAtual = anosComparar[0];
                        const anoAnterior = anosComparar[1];
                        const dadosAnoAtual = (dadosDRE as Record<string, GrupoMovimentacao[]>)[anoAtual] || [];
                        const dadosAnoAnterior = (dadosDRE as Record<string, GrupoMovimentacao[]>)[anoAnterior] || [];
                        const contaAtual = dadosAnoAtual.find(item => item.tipo === conta);
                        const contaAnterior = dadosAnoAnterior.find(item => item.tipo === conta);
                        const valorAtual = contaAtual?.valor || 0;
                        const valorAnterior = contaAnterior?.valor || 0;

                        // Modificação: Para contas de despesa, calcular a variação invertendo o sinal
                        let variacaoAbsoluta = valorAtual - valorAnterior;
                        if (tipoConta === 'despesa') {
                          variacaoAbsoluta = variacaoAbsoluta * -1;
                        }
                        return <>
                                    <TableCell className="text-right">
                                      {formatCurrency(variacaoAbsoluta)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {valorAnterior !== 0 ? renderVariacao(valorAtual, valorAnterior, tipoConta) : '-'}
                                    </TableCell>
                                  </>;
                      })()}
                            </TableRow>
                            
                            {contemSubcontas && estaExpandida && Array.from(new Set(anosComparar.flatMap(anoComp => {
                      const dadosAno = (dadosDRE as Record<string, GrupoMovimentacao[]>)[anoComp] || [];
                      const grupo = dadosAno.find(g => g.tipo === conta);
                      return grupo?.contas?.map(c => c.descricao) || [];
                    }))).sort().map(descricaoConta => <TableRow key={`${conta}-${descricaoConta}`} className="bg-muted/20">
                                  <TableCell className="pl-10 text-sm font-normal">
                                    {descricaoConta}
                                  </TableCell>
                                  {anosComparar.map(anoComp => {
                        const dadosAno = (dadosDRE as Record<string, GrupoMovimentacao[]>)[anoComp] || [];
                        const grupo = dadosAno.find(g => g.tipo === conta);
                        const subconta = grupo?.contas?.find(c => c.descricao === descricaoConta);
                        return <TableCell key={`${conta}-${descricaoConta}-${anoComp}`} className="text-right text-sm">
                                        {formatCurrency(subconta?.valor || 0)}
                                      </TableCell>;
                      })}
                                </TableRow>)}
                          </React.Fragment>;
                })}
                    </TableBody>
                  </Table>
                </div>}

              {/* Mensal por mês único */}
              {visualizacao === "mensal" && mes !== "todos" && <Accordion type="single" collapsible className="w-full">
                  {dadosDRE.map((grupo: GrupoMovimentacao, index: number) => <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className={`${!temDetalhes(grupo) ? 'cursor-default hover:no-underline' : ''}`} disabled={!temDetalhes(grupo)}>
                        <div className="flex justify-between w-full pr-4">
                          <span>{grupo.tipo}</span>
                          <span>{formatCurrency(grupo.valor)}</span>
                        </div>
                      </AccordionTrigger>
                      
                      {temContas(grupo) ? <AccordionContent>
                          {grupo.contas && grupo.contas.length > 0 ? grupo.contas.map((conta, contaIndex) => <Collapsible key={contaIndex} className="px-4 py-2 border-t">
                              <CollapsibleTrigger className="flex justify-between w-full hover:underline">
                                <div className="flex items-center gap-2">
                                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 collapsible-icon" />
                                  <span className="font-medium">{conta.descricao}</span>
                                </div>
                                <span>{formatCurrency(conta.valor)}</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="pt-2 overflow-x-auto pl-4">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {conta.detalhes.map((detalhe, idx) => <TableRow key={idx}>
                                          <TableCell>{detalhe.data_movimentacao}</TableCell>
                                          <TableCell>{detalhe.descricao}</TableCell>
                                          <TableCell className="text-right">
                                            {formatCurrency(detalhe.valor)}
                                          </TableCell>
                                        </TableRow>)}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>) : <div className="px-4 py-2 text-muted-foreground">
                              Não há contas contábeis detalhadas para este grupo
                            </div>}
                        </AccordionContent> : temDetalhes(grupo) ? <AccordionContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Descrição</TableHead>
                                  <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {grupo.detalhes.map((detalhe, idx) => <TableRow key={idx}>
                                    <TableCell>{detalhe.data_movimentacao}</TableCell>
                                    <TableCell>{detalhe.descricao}</TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(detalhe.valor)}
                                    </TableCell>
                                  </TableRow>)}
                              </TableBody>
                            </Table>
                          </div>
                        </AccordionContent> : null}
                    </AccordionItem>)}
                </Accordion>}

              {/* Mensal todos os meses em colunas com expansão para subcontas */}
              {visualizacao === "mensal" && mes === "todos" && (() => {
                const totaisAcumulados = calcularTotaisAcumulados(dadosDRE as ResultadoMensal[]);
                const totaisAcumuladosSubcontas = calcularTotaisAcumuladosSubcontas(dadosDRE as ResultadoMensal[]);
                
                return <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conta</TableHead>
                          {meses.map(m => <TableHead key={m.value} className="text-center">{m.label}</TableHead>)}
                          <TableHead className="text-center font-bold">Total Acumulado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contasDRE.map(conta => {
                    const contemSubcontas = ["Receita Bruta", "(-) Deduções", "(-) Custos", "(-) Despesas Operacionais", "(+) Receitas Financeiras", "(-) Despesas Financeiras", "(-) IRPJ/CSLL", "(-) Distribuição de Lucros"].includes(conta);
                    const estaExpandida = contasExpandidasTodosMeses[conta] || false;
                    return <React.Fragment key={conta}>
                              <TableRow className={contemSubcontas && estaExpandida ? "bg-muted/50" : ""} onClick={() => contemSubcontas && toggleContaExpandidaTodosMeses(conta)}>
                                <TableCell className={contemSubcontas ? "cursor-pointer" : ""}>
                                  <div className="flex items-center">
                                    {contemSubcontas && <ChevronDown className={`h-4 w-4 mr-2 transition-transform duration-200 ${estaExpandida ? 'rotate-180' : ''} collapsible-icon`} />}
                                    {conta}
                                  </div>
                                </TableCell>
                                
                                {meses.map(m => {
                          const dadosMes = (dadosDRE as ResultadoMensal[]).find(x => x.mes === m.value);
                          const linhaMes = dadosMes?.dados?.find((i: GrupoMovimentacao) => i.tipo === conta);
                          return <TableCell key={m.value} className="text-right">
                                      {formatCurrency(linhaMes?.valor || 0)}
                                    </TableCell>;
                        })}
                        
                                <TableCell className="text-right font-bold">
                                  {formatCurrency(totaisAcumulados[conta] || 0)}
                                </TableCell>
                              </TableRow>
                              
                              {contemSubcontas && estaExpandida && Array.from(new Set((dadosDRE as ResultadoMensal[]).flatMap(resultadoMensal => {
                        const grupo = resultadoMensal.dados?.find(g => g.tipo === conta);
                        return grupo?.contas?.map(c => c.descricao) || [];
                      }))).sort().map(descricaoConta => <TableRow key={`${conta}-${descricaoConta}`} className="bg-muted/20">
                                  <TableCell className="pl-10 text-sm font-normal">
                                    {descricaoConta}
                                  </TableCell>
                                  {meses.map(m => {
                          const resultadoMensal = (dadosDRE as ResultadoMensal[]).find(x => x.mes === m.value);
                          const grupo = resultadoMensal?.dados?.find(g => g.tipo === conta);
                          const subconta = grupo?.contas?.find(c => c.descricao === descricaoConta);
                          return <TableCell key={`${conta}-${descricaoConta}-${m.value}`} className="text-right text-sm">
                                        {formatCurrency(subconta?.valor || 0)}
                                      </TableCell>;
                        })}
                                  <TableCell className="text-right text-sm font-bold">
                                    {formatCurrency(totaisAcumuladosSubcontas[conta]?.[descricaoConta] || 0)}
                                  </TableCell>
                                </TableRow>)}
                            </React.Fragment>;
                  })}
                      </TableBody>
                    </Table>
                  </div>
                </>;
              })()}
            </div>}
        </CardContent>
      </Card>
    </div>;
}
