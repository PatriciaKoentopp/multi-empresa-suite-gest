
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompany } from "@/contexts/company-context";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnaliseVariacao, FiltroAnaliseDre } from "@/types/financeiro";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";
import { formatCurrency } from "@/lib/utils";

// Lista de tipos de contas para classificação e filtro
const tiposContas = [
  { id: "todos", nome: "Todos os tipos" },
  { id: "receita_bruta", nome: "Receita Bruta" },
  { id: "deducoes", nome: "Deduções" },
  { id: "custos", nome: "Custos" },
  { id: "despesas_operacionais", nome: "Despesas Operacionais" },
  { id: "receitas_financeiras", nome: "Receitas Financeiras" },
  { id: "despesas_financeiras", nome: "Despesas Financeiras" },
  { id: "impostos_irpj_csll", nome: "Impostos (IRPJ/CSLL)" },
  { id: "distribuicao_lucros", nome: "Distribuição de Lucros" }
];

export default function AnaliseDrePage() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [analiseVariacoes, setAnaliseVariacoes] = useState<AnaliseVariacao[]>([]);
  const [filtro, setFiltro] = useState<FiltroAnaliseDre>({
    tipo_comparacao: 'mes_anterior',
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    percentual_minimo: 10
  });
  const [tipoContaSelecionado, setTipoContaSelecionado] = useState("todos");

  useEffect(() => {
    if (currentCompany?.id) {
      buscarDadosAnalise();
    }
  }, [currentCompany?.id, filtro]);

  const buscarDadosAnalise = async () => {
    if (!currentCompany?.id) return;
    
    try {
      setIsLoading(true);
      
      // Determinar os períodos para análise
      let periodoAtual = {
        inicio: format(startOfMonth(new Date(filtro.ano, filtro.mes - 1)), 'yyyy-MM-dd'),
        fim: format(endOfMonth(new Date(filtro.ano, filtro.mes - 1)), 'yyyy-MM-dd')
      };
      
      let periodoComparacao;
      
      switch (filtro.tipo_comparacao) {
        case 'mes_anterior':
          periodoComparacao = {
            inicio: format(startOfMonth(subMonths(new Date(filtro.ano, filtro.mes - 1), 1)), 'yyyy-MM-dd'),
            fim: format(endOfMonth(subMonths(new Date(filtro.ano, filtro.mes - 1), 1)), 'yyyy-MM-dd')
          };
          break;
        case 'ano_anterior':
          periodoComparacao = {
            inicio: format(startOfMonth(new Date(filtro.ano - 1, filtro.mes - 1)), 'yyyy-MM-dd'),
            fim: format(endOfMonth(new Date(filtro.ano - 1, filtro.mes - 1)), 'yyyy-MM-dd')
          };
          break;
        case 'media_12_meses':
          // Aqui seria implementada a lógica para buscar dados dos últimos 12 meses
          // Por simplicidade, usaremos o mês anterior nesta implementação inicial
          periodoComparacao = {
            inicio: format(startOfMonth(subMonths(new Date(filtro.ano, filtro.mes - 1), 1)), 'yyyy-MM-dd'),
            fim: format(endOfMonth(subMonths(new Date(filtro.ano, filtro.mes - 1), 1)), 'yyyy-MM-dd')
          };
          break;
      }
      
      console.info("Períodos de análise:", { atual: periodoAtual, comparacao: periodoComparacao });

      // Buscar dados do período atual
      const { data: dadosAtual, error: errorAtual } = await supabase
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
        .gte('data_movimentacao', periodoAtual.inicio)
        .lte('data_movimentacao', periodoAtual.fim);
        
      if (errorAtual) throw errorAtual;
      
      // Buscar dados do período de comparação
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
        .gte('data_movimentacao', periodoComparacao.inicio)
        .lte('data_movimentacao', periodoComparacao.fim);
        
      if (errorComparacao) throw errorComparacao;
      
      // Filtrar movimentações consideradas para o DRE
      const movimentacoesAtual = (dadosAtual || []).filter(mov => 
        mov.movimentacoes?.considerar_dre !== false
      );
      
      const movimentacoesComparacao = (dadosComparacao || []).filter(mov => 
        mov.movimentacoes?.considerar_dre !== false
      );
      
      // Processar dados por tipo de conta
      const processar = (movimentacoes: any[], tiposDeConta: string[]) => {
        const resultados: Record<string, { total: number, detalhes: Record<string, number> }> = {};
        
        // Inicializar tipos de conta
        tiposDeConta.forEach(tipo => {
          resultados[tipo] = { total: 0, detalhes: {} };
        });
        
        movimentacoes.forEach(mov => {
          const valor = Number(mov.valor || 0);
          const planoContas = mov.plano_contas?.plano_contas;
          const contaId = planoContas?.id || 'sem_classificacao';
          const descricao = planoContas?.descricao || 'Sem Classificação';
          let tipoConta = planoContas?.classificacao_dre;
          
          // Se não tiver classificação explícita, tentar inferir pelo tipo de operação
          if (!tipoConta || tipoConta === 'nao_classificado') {
            const tipoOperacao = mov.movimentacoes?.tipo_operacao;
            if (tipoOperacao === 'receber') {
              tipoConta = 'receita_bruta';
            } else if (tipoOperacao === 'pagar') {
              tipoConta = 'custos'; // Default para despesas não classificadas
            }
          }
          
          // Garantir que o tipo da conta está em nossa lista
          if (tipoConta && resultados[tipoConta]) {
            resultados[tipoConta].total += valor;
            
            // Agrupar por subconta
            if (!resultados[tipoConta].detalhes[contaId]) {
              resultados[tipoConta].detalhes[contaId] = 0;
            }
            resultados[tipoConta].detalhes[contaId] += valor;
          }
        });
        
        return resultados;
      };
      
      // Lista de todos os tipos de contas que queremos analisar
      const tiposDeConta = [
        "receita_bruta",
        "deducoes",
        "custos",
        "despesas_operacionais",
        "receitas_financeiras", 
        "despesas_financeiras",
        "impostos_irpj_csll",
        "distribuicao_lucros"
      ];
      
      // Processar dados
      const resultadosAtual = processar(movimentacoesAtual, tiposDeConta);
      const resultadosComparacao = processar(movimentacoesComparacao, tiposDeConta);
      
      // Calcular variações
      const variacoes: AnaliseVariacao[] = [];
      
      // Função para avaliar o impacto da variação
      const avaliarVariacao = (tipoConta: string, variacaoPercentual: number): 'positiva' | 'negativa' | 'estavel' | 'atencao' => {
        if (Math.abs(variacaoPercentual) < 2) return 'estavel';
        
        // Para contas de despesa, variação negativa é positiva (reduziu despesas)
        if (tipoConta === 'deducoes' || tipoConta === 'custos' || tipoConta === 'despesas_operacionais' || 
            tipoConta === 'despesas_financeiras' || tipoConta === 'impostos_irpj_csll' || 
            tipoConta === 'distribuicao_lucros') {
          return variacaoPercentual < 0 ? 'positiva' : 'negativa';
        }
        // Para contas de receita, variação positiva é positiva (aumentou receitas)
        else {
          return variacaoPercentual > 0 ? 'positiva' : 'negativa';
        }
      };
      
      // Calcular variações por tipo de conta
      tiposDeConta.forEach(tipo => {
        const valorAtual = resultadosAtual[tipo]?.total || 0;
        const valorComparacao = resultadosComparacao[tipo]?.total || 0;
        
        // Calcular variação apenas se houver valor de comparação
        if (valorAtual !== 0 || valorComparacao !== 0) {
          // Fórmula corrigida: (valorAtual - valorComparacao) / valorComparacao
          // Note que não usamos Math.abs(valorComparacao) no denominador
          const variacaoValor = valorAtual - valorComparacao;
          const variacaoPercentual = valorComparacao !== 0 
            ? (variacaoValor / valorComparacao) * 100 
            : (valorAtual !== 0 ? 100 : 0); // Se não havia antes e agora há, consideramos 100%
          
          // Criar objeto de variação principal
          const variacao: AnaliseVariacao = {
            nome: tiposContas.find(t => t.id === tipo)?.nome || tipo,
            valor_atual: valorAtual,
            valor_comparacao: valorComparacao,
            variacao_valor: variacaoValor,
            variacao_percentual: variacaoPercentual,
            tipo_conta: tipo,
            avaliacao: avaliarVariacao(tipo, variacaoPercentual),
            nivel: 'principal'
          };
          
          // Adicionar subcontas se existirem
          const subcontas: AnaliseVariacao[] = [];
          const detalhesAtual = resultadosAtual[tipo]?.detalhes || {};
          const detalhesComparacao = resultadosComparacao[tipo]?.detalhes || {};
          
          // Combinar todas as chaves únicas de ambos períodos
          const todasSubcontas = new Set([
            ...Object.keys(detalhesAtual),
            ...Object.keys(detalhesComparacao)
          ]);
          
          todasSubcontas.forEach(contaId => {
            if (contaId === 'sem_classificacao') return; // Pular contas sem classificação
            
            const valorAtualConta = detalhesAtual[contaId] || 0;
            const valorComparacaoConta = detalhesComparacao[contaId] || 0;
            
            // Calcular variação para subconta
            const variacaoValorSubconta = valorAtualConta - valorComparacaoConta;
            const variacaoPercentualSubconta = valorComparacaoConta !== 0 
              ? (variacaoValorSubconta / valorComparacaoConta) * 100 
              : (valorAtualConta !== 0 ? 100 : 0);
            
            // Verificar se a variação é significativa
            if (Math.abs(variacaoPercentualSubconta) >= filtro.percentual_minimo || 
                Math.abs(variacaoValorSubconta) >= 1000) {
              
              // Buscar o nome da conta (poderia ser melhorado com cache ou query adicional)
              let nomeConta = contaId;
              // Em uma implementação real, buscaríamos o nome da conta no banco de dados
              
              // Criar objeto de variação para subconta
              const subconta: AnaliseVariacao = {
                nome: nomeConta,
                valor_atual: valorAtualConta,
                valor_comparacao: valorComparacaoConta,
                variacao_valor: variacaoValorSubconta,
                variacao_percentual: variacaoPercentualSubconta,
                tipo_conta: tipo,
                grupo_pai: tipo,
                avaliacao: avaliarVariacao(tipo, variacaoPercentualSubconta),
                nivel: 'subconta'
              };
              
              subcontas.push(subconta);
            }
          });
          
          // Ordenar subcontas por variação percentual (absoluta)
          subcontas.sort((a, b) => Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual));
          
          // Adicionar subcontas ao objeto principal
          if (subcontas.length > 0) {
            variacao.subcontas = subcontas;
          }
          
          variacoes.push(variacao);
        }
      });
      
      // Ordenar variações por impacto (negativo -> positivo)
      variacoes.sort((a, b) => {
        if (a.avaliacao === 'negativa' && b.avaliacao !== 'negativa') return -1;
        if (a.avaliacao !== 'negativa' && b.avaliacao === 'negativa') return 1;
        return Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual);
      });
      
      setAnaliseVariacoes(variacoes);
      
    } catch (error) {
      console.error("Erro ao buscar dados para análise:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados para análise do DRE.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarVariacoesPorTipo = () => {
    if (tipoContaSelecionado === "todos") {
      return analiseVariacoes;
    }
    return analiseVariacoes.filter(variacao => variacao.tipo_conta === tipoContaSelecionado);
  };

  const formatarPeriodoComparacao = () => {
    const nomeMes = format(new Date(filtro.ano, filtro.mes - 1), 'MMMM', { locale: ptBR });
    const mesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    
    switch (filtro.tipo_comparacao) {
      case 'mes_anterior':
        const mesAnterior = filtro.mes === 1 ? 12 : filtro.mes - 1;
        const anoAnterior = filtro.mes === 1 ? filtro.ano - 1 : filtro.ano;
        const nomeMesAnterior = format(new Date(anoAnterior, mesAnterior - 1), 'MMMM', { locale: ptBR });
        const mesAnteriorCapitalizado = nomeMesAnterior.charAt(0).toUpperCase() + nomeMesAnterior.slice(1);
        return `${mesCapitalizado}/${filtro.ano} vs ${mesAnteriorCapitalizado}/${anoAnterior}`;
        
      case 'ano_anterior':
        return `${mesCapitalizado}/${filtro.ano} vs ${mesCapitalizado}/${filtro.ano - 1}`;
        
      case 'media_12_meses':
        return `${mesCapitalizado}/${filtro.ano} vs Média dos 12 meses anteriores`;
        
      default:
        return `${mesCapitalizado}/${filtro.ano}`;
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Variações do DRE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Filtro de tipo de comparação */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo de Comparação</label>
              <Select
                value={filtro.tipo_comparacao}
                onValueChange={(value: any) => setFiltro(prev => ({ ...prev, tipo_comparacao: value }))}
              >
                <SelectTrigger className="w-[210px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="ano_anterior">Mesmo mês no Ano Anterior</SelectItem>
                  <SelectItem value="media_12_meses">Média dos últimos 12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro de ano */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ano</label>
              <Select
                value={filtro.ano.toString()}
                onValueChange={(value) => setFiltro(prev => ({ ...prev, ano: parseInt(value) }))}
              >
                <SelectTrigger className="w-[100px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2021, 2022, 2023, 2024, 2025, 2026].map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro de mês */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Mês</label>
              <Select
                value={filtro.mes.toString()}
                onValueChange={(value) => setFiltro(prev => ({ ...prev, mes: parseInt(value) }))}
              >
                <SelectTrigger className="w-[120px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const mes = i + 1;
                    const nomeMes = format(new Date(2000, i), 'MMMM', { locale: ptBR });
                    return (
                      <SelectItem key={mes} value={mes.toString()}>
                        {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro de variação mínima */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Variação Mínima (%)</label>
              <Select
                value={filtro.percentual_minimo.toString()}
                onValueChange={(value) => setFiltro(prev => ({ ...prev, percentual_minimo: parseInt(value) }))}
              >
                <SelectTrigger className="w-[100px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de tipo de conta */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo de Conta</label>
              <Select
                value={tipoContaSelecionado}
                onValueChange={setTipoContaSelecionado}
              >
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposContas.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="mt-2">Carregando análise...</p>
            </div>
          ) : filtrarVariacoesPorTipo().length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhuma variação significativa encontrada para o período selecionado.
            </div>
          ) : (
            <div>
              <h3 className="mb-4 font-medium text-lg">Análise de Variações: {formatarPeriodoComparacao()}</h3>
              
              <div className="space-y-4">
                {filtrarVariacoesPorTipo().map((variacao, index) => (
                  <Accordion 
                    key={`${variacao.tipo_conta}-${index}`} 
                    type="single" 
                    collapsible 
                    className="border rounded-md overflow-hidden"
                  >
                    <AccordionItem value="item-1" className="border-none">
                      <AccordionTrigger className={`px-4 py-3 ${
                        variacao.avaliacao === 'positiva' ? 'bg-green-50' :
                        variacao.avaliacao === 'negativa' ? 'bg-red-50' :
                        'bg-gray-50'
                      } hover:no-underline`}>
                        <div className="flex flex-1 justify-between items-center">
                          <div className="text-left">
                            <span className="font-semibold">{variacao.nome}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(variacao.valor_atual)}</div>
                              <div className="text-sm text-muted-foreground">{formatCurrency(variacao.valor_comparacao)}</div>
                            </div>
                            <div className="w-24 text-right">
                              <VariationDisplay 
                                value={variacao.variacao_percentual} 
                                tipoConta={variacao.tipo_conta}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        {variacao.subcontas && variacao.subcontas.length > 0 ? (
                          <div className="border-t">
                            <table className="w-full">
                              <thead className="bg-muted/30">
                                <tr>
                                  <th className="text-left py-2 px-4 text-sm font-medium">Subconta</th>
                                  <th className="text-right py-2 px-4 text-sm font-medium">Período Atual</th>
                                  <th className="text-right py-2 px-4 text-sm font-medium">Período Anterior</th>
                                  <th className="text-right py-2 px-4 text-sm font-medium">Variação</th>
                                </tr>
                              </thead>
                              <tbody>
                                {variacao.subcontas.map((subconta, idx) => (
                                  <tr 
                                    key={idx} 
                                    className={`border-t ${
                                      subconta.avaliacao === 'positiva' ? 'bg-green-50/50' :
                                      subconta.avaliacao === 'negativa' ? 'bg-red-50/50' :
                                      ''
                                    }`}
                                  >
                                    <td className="py-2 px-4 text-sm">{subconta.nome}</td>
                                    <td className="py-2 px-4 text-right text-sm">{formatCurrency(subconta.valor_atual)}</td>
                                    <td className="py-2 px-4 text-right text-sm">{formatCurrency(subconta.valor_comparacao)}</td>
                                    <td className="py-2 px-4 text-right">
                                      <VariationDisplay 
                                        value={subconta.variacao_percentual} 
                                        tipoConta={subconta.tipo_conta}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground">
                            Não há subcontas com variações significativas para mostrar.
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
