import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, endOfMonth, subMonths, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";
import { ChevronDown } from "lucide-react";
import { useAnaliseDetalheConta } from "@/hooks/useAnaliseDetalheConta";
import { AnaliseVariacao, DetalhesMensaisConta, FiltroAnaliseDre, ValorMensal } from "@/types/financeiro";

// Arrays de meses e anos
const meses = [
  { label: "Janeiro", value: "1" },
  { label: "Fevereiro", value: "2" },
  { label: "Março", value: "3" },
  { label: "Abril", value: "4" },
  { label: "Maio", value: "5" },
  { label: "Junho", value: "6" },
  { label: "Julho", value: "7" },
  { label: "Agosto", value: "8" },
  { label: "Setembro", value: "9" },
  { label: "Outubro", value: "10" },
  { label: "Novembro", value: "11" },
  { label: "Dezembro", value: "12" },
];

// Array de anos (máx. últimos 5 anos)
const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= Math.max(2021, anoAtual - 4); a--) {
  anos.push(a.toString());
}

export default function AnaliseDrePage() {
  const [filtros, setFiltros] = useState<FiltroAnaliseDre>({
    tipo_comparacao: 'mes_anterior',
    ano: anoAtual,
    mes: new Date().getMonth() + 1,
    percentual_minimo: 10
  });
  
  const { currentCompany } = useCompany();
  const { calcularMedia } = useAnaliseDetalheConta();
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  
  const toggleAccountExpand = (accountId: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };
  
  // Query para buscar dados do DRE
  const { data: resultados, isLoading } = useQuery({
    queryKey: ["analise-dre", currentCompany?.id, filtros],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      try {
        const dataAtual = new Date(filtros.ano, filtros.mes - 1, 1);
        let dataComparacao: Date;
        
        // Determinar data de comparação com base no tipo de comparação
        switch (filtros.tipo_comparacao) {
          case 'mes_anterior':
            dataComparacao = subMonths(dataAtual, 1);
            break;
          case 'ano_anterior':
            dataComparacao = new Date(filtros.ano - 1, filtros.mes - 1, 1);
            break;
          case 'media_12_meses':
            // Para média, usaremos os últimos 12 meses antes do mês atual
            dataComparacao = subMonths(dataAtual, 12);
            break;
        }

        const inicioMesAtual = format(dataAtual, 'yyyy-MM-01');
        const fimMesAtual = format(endOfMonth(dataAtual), 'yyyy-MM-dd');
        
        // Buscar dados do mês atual
        const { data: dadosMesAtual, error: errorMesAtual } = await supabase
          .from('fluxo_caixa')
          .select(`
            id, data_movimentacao, descricao, valor,
            movimentacoes (
              id, categoria_id, tipo_operacao, considerar_dre
            ),
            plano_contas:movimentacoes(plano_contas(id, tipo, descricao, classificacao_dre))
          `)
          .eq('empresa_id', currentCompany.id)
          .gte('data_movimentacao', inicioMesAtual)
          .lte('data_movimentacao', fimMesAtual);

        if (errorMesAtual) throw errorMesAtual;

        // Para "media_12_meses", buscamos dados dos últimos 12 meses
        const resultado: AnaliseVariacao[] = [];
        
        if (filtros.tipo_comparacao === 'media_12_meses') {
          // Buscar dados dos últimos 12 meses para cálculo da média
          const inicioMedia = format(subMonths(dataAtual, 12), 'yyyy-MM-01');
          const fimMedia = format(subMonths(endOfMonth(dataAtual), 1), 'yyyy-MM-dd');
          
          const { data: dadosUltimos12Meses, error: errorUltimos12Meses } = await supabase
            .from('fluxo_caixa')
            .select(`
              id, data_movimentacao, descricao, valor,
              movimentacoes (
                id, categoria_id, tipo_operacao, considerar_dre
              ),
              plano_contas:movimentacoes(plano_contas(id, tipo, descricao, classificacao_dre))
            `)
            .eq('empresa_id', currentCompany.id)
            .gte('data_movimentacao', inicioMedia)
            .lte('data_movimentacao', fimMedia);

          if (errorUltimos12Meses) throw errorUltimos12Meses;
          
          // Processar os dados do mês atual e da média dos últimos 12 meses
          const dadosAgrupados = agruparDadosPorConta(dadosMesAtual || []);
          const dadosMediaAgrupados = calcularMediaPorContaCorreta(dadosUltimos12Meses || []);
          
          // Combinar os resultados
          const todasContas = new Set([
            ...Object.keys(dadosAgrupados), 
            ...Object.keys(dadosMediaAgrupados)
          ]);
          
          todasContas.forEach(conta => {
            const valorAtual = dadosAgrupados[conta]?.total || 0;
            const valorMedia = dadosMediaAgrupados[conta]?.media || 0;
            
            if (Math.abs(valorAtual) > 0 || Math.abs(valorMedia) > 0) {
              const variacaoValor = valorAtual - valorMedia;
              const variacaoPercentual = valorMedia !== 0
                ? (variacaoValor / Math.abs(valorMedia)) * 100
                : valorAtual !== 0 ? 100 : 0;
              
              // Apenas incluir se a variação percentual for maior que o percentual mínimo
              if (Math.abs(variacaoPercentual) >= filtros.percentual_minimo) {
                const tipoConta = determinarTipoConta(dadosAgrupados[conta]?.classificacao_dre || '');
                
                resultado.push({
                  nome: dadosAgrupados[conta]?.nome || dadosMediaAgrupados[conta]?.nome || conta,
                  valor_atual: valorAtual,
                  valor_comparacao: valorMedia,
                  variacao_valor: variacaoValor,
                  variacao_percentual: variacaoPercentual,
                  tipo_conta: tipoConta,
                  avaliacao: avaliarVariacao(variacaoPercentual, tipoConta),
                  nivel: 'principal',
                  detalhes_mensais: dadosMediaAgrupados[conta]?.detalhes_mensais
                });
              }
            }
          });
        } else {
          // Comparação mensal ou anual
          const inicioMesComparacao = format(dataComparacao, 'yyyy-MM-01');
          const fimMesComparacao = format(endOfMonth(dataComparacao), 'yyyy-MM-dd');
          
          const { data: dadosMesComparacao, error: errorMesComparacao } = await supabase
            .from('fluxo_caixa')
            .select(`
              id, data_movimentacao, descricao, valor,
              movimentacoes (
                id, categoria_id, tipo_operacao, considerar_dre
              ),
              plano_contas:movimentacoes(plano_contas(id, tipo, descricao, classificacao_dre))
            `)
            .eq('empresa_id', currentCompany.id)
            .gte('data_movimentacao', inicioMesComparacao)
            .lte('data_movimentacao', fimMesComparacao);

          if (errorMesComparacao) throw errorMesComparacao;
          
          // Processar os dados
          const dadosAtualAgrupados = agruparDadosPorConta(dadosMesAtual || []);
          const dadosComparacaoAgrupados = agruparDadosPorConta(dadosMesComparacao || []);
          
          // Combinar os resultados
          const todasContas = new Set([
            ...Object.keys(dadosAtualAgrupados), 
            ...Object.keys(dadosComparacaoAgrupados)
          ]);
          
          todasContas.forEach(conta => {
            const valorAtual = dadosAtualAgrupados[conta]?.total || 0;
            const valorComparacao = dadosComparacaoAgrupados[conta]?.total || 0;
            
            if (Math.abs(valorAtual) > 0 || Math.abs(valorComparacao) > 0) {
              const variacaoValor = valorAtual - valorComparacao;
              const variacaoPercentual = valorComparacao !== 0
                ? (variacaoValor / Math.abs(valorComparacao)) * 100
                : valorAtual !== 0 ? 100 : 0;
              
              // Apenas incluir se a variação percentual for maior que o percentual mínimo
              if (Math.abs(variacaoPercentual) >= filtros.percentual_minimo) {
                const tipoConta = determinarTipoConta(dadosAtualAgrupados[conta]?.classificacao_dre || '');
                
                resultado.push({
                  nome: dadosAtualAgrupados[conta]?.nome || dadosComparacaoAgrupados[conta]?.nome || conta,
                  valor_atual: valorAtual,
                  valor_comparacao: valorComparacao,
                  variacao_valor: variacaoValor,
                  variacao_percentual: variacaoPercentual,
                  tipo_conta: tipoConta,
                  avaliacao: avaliarVariacao(variacaoPercentual, tipoConta),
                  nivel: 'principal'
                });
              }
            }
          });
        }

        // Ordenar o resultado
        return resultado.sort((a, b) => 
          Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual)
        );

      } catch (error) {
        console.error('Erro ao buscar dados de análise:', error);
        toast.error('Erro ao carregar análise do DRE');
        return [];
      }
    }
  });
  
  // Função para agrupar dados por conta contábil
  function agruparDadosPorConta(movimentacoes: any[]) {
    const contas: Record<string, any> = {};
    
    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;
      
      const planoContas = mov.plano_contas?.plano_contas;
      if (!planoContas) return;
      
      const contaId = planoContas.id;
      const classificacaoDre = planoContas.classificacao_dre || 'nao_classificado';
      const valor = Number(mov.valor);
      
      if (!contas[contaId]) {
        contas[contaId] = {
          nome: planoContas.descricao,
          classificacao_dre: classificacaoDre,
          total: 0,
          movimentacoes: []
        };
      }
      
      contas[contaId].total += valor;
      contas[contaId].movimentacoes.push({
        id: mov.id,
        data: mov.data_movimentacao,
        descricao: mov.descricao,
        valor: valor
      });
    });
    
    return contas;
  }
  
  // IMPORTANTE: Função para calcular corretamente a média por conta, incluindo meses com valor zero
  function calcularMediaPorContaCorreta(movimentacoes: any[]) {
    const contas: Record<string, any> = {};
    
    // Primeiro, agrupar movimentações por conta e mês
    const movimentacoesPorContaMes: Record<string, Record<string, number>> = {};
    
    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;
      
      const planoContas = mov.plano_contas?.plano_contas;
      if (!planoContas) return;
      
      const contaId = planoContas.id;
      const mesAno = mov.data_movimentacao.substring(0, 7); // Formato YYYY-MM
      const valor = Number(mov.valor);
      
      if (!movimentacoesPorContaMes[contaId]) {
        movimentacoesPorContaMes[contaId] = {};
      }
      
      if (!movimentacoesPorContaMes[contaId][mesAno]) {
        movimentacoesPorContaMes[contaId][mesAno] = 0;
      }
      
      movimentacoesPorContaMes[contaId][mesAno] += valor;
      
      // Armazenar informações básicas da conta
      if (!contas[contaId]) {
        contas[contaId] = {
          nome: planoContas.descricao,
          classificacao_dre: planoContas.classificacao_dre || 'nao_classificado',
          valores_mensais: [],
          detalhes_mensais: {
            nome_conta: planoContas.descricao,
            valores_mensais: [],
            media: 0
          }
        };
      }
    });
    
    // Determinar o intervalo de 12 meses
    const mesesSet = new Set();
    Object.values(movimentacoesPorContaMes).forEach(contaMeses => {
      Object.keys(contaMeses).forEach(mes => mesesSet.add(mes));
    });
    
    let mesesOrdenados = Array.from(mesesSet as Set<string>).sort();
    
    // Garantir que temos exatamente 12 meses
    if (mesesOrdenados.length > 12) {
      mesesOrdenados = mesesOrdenados.slice(-12);
    }
    
    // Para cada conta, calcular a média considerando TODOS os meses (incluindo zeros)
    Object.keys(contas).forEach(contaId => {
      const valoresMensais: number[] = [];
      const detalhesMensais: ValorMensal[] = [];
      
      mesesOrdenados.forEach(mesAno => {
        const valor = movimentacoesPorContaMes[contaId]?.[mesAno] || 0;
        valoresMensais.push(valor);
        
        const [ano, mes] = mesAno.split('-').map(Number);
        detalhesMensais.push({
          mes: mes,
          ano: ano,
          mes_nome: meses.find(m => Number(m.value) === mes)?.label || `Mês ${mes}`,
          valor: valor
        });
      });
      
      // Usar a função calcularMedia do hook useAnaliseDetalheConta para consistência
      const media = calcularMedia(valoresMensais);
      
      contas[contaId].media = media;
      contas[contaId].valores_mensais = valoresMensais;
      contas[contaId].detalhes_mensais.valores_mensais = detalhesMensais;
      contas[contaId].detalhes_mensais.media = media;
    });
    
    return contas;
  }
  
  function determinarTipoConta(classificacao: string): 'receita' | 'despesa' {
    switch (classificacao) {
      case 'receita_bruta':
      case 'receitas_financeiras':
        return 'receita';
      case 'deducoes':
      case 'custos':
      case 'despesas_operacionais':
      case 'despesas_financeiras':
      case 'distribuicao_lucros':
      case 'impostos_irpj_csll':
        return 'despesa';
      default:
        return 'despesa'; // Padrão para classificação desconhecida
    }
  }
  
  function avaliarVariacao(variacao: number, tipoConta: 'receita' | 'despesa'): 'positiva' | 'negativa' | 'estavel' | 'atencao' {
    // Para receitas: aumento é positivo, diminuição é negativo
    // Para despesas: aumento é negativo, diminuição é positivo
    if (Math.abs(variacao) < 5) return 'estavel';
    
    if (tipoConta === 'receita') {
      return variacao > 0 ? 'positiva' : 'negativa';
    } else {
      return variacao < 0 ? 'positiva' : 'negativa';
    }
  }
  
  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  }
  
  function formatarNomeComparacao() {
    switch (filtros.tipo_comparacao) {
      case 'mes_anterior':
        return 'Mês Anterior';
      case 'ano_anterior':
        return 'Mesmo mês no Ano Anterior';
      case 'media_12_meses':
        return 'Valor Anterior (Média)';
    }
  }
  
  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise de Variações do DRE</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Comparar com:</label>
              <Select
                value={filtros.tipo_comparacao}
                onValueChange={v => setFiltros(prev => ({ ...prev, tipo_comparacao: v as 'mes_anterior' | 'ano_anterior' | 'media_12_meses' }))}
              >
                <SelectTrigger className="min-w-[180px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="ano_anterior">Mesmo mês no Ano Anterior</SelectItem>
                  <SelectItem value="media_12_meses">Média dos Últimos 12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ano:</label>
              <Select 
                value={filtros.ano.toString()} 
                onValueChange={v => setFiltros(prev => ({ ...prev, ano: parseInt(v) }))}
              >
                <SelectTrigger className="min-w-[100px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Mês:</label>
              <Select 
                value={filtros.mes.toString()} 
                onValueChange={v => setFiltros(prev => ({ ...prev, mes: parseInt(v) }))}
              >
                <SelectTrigger className="min-w-[150px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Variação Mínima (%):</label>
              <Select 
                value={filtros.percentual_minimo.toString()} 
                onValueChange={v => setFiltros(prev => ({ ...prev, percentual_minimo: parseInt(v) }))}
              >
                <SelectTrigger className="min-w-[100px] bg-white">
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
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-pulse">Carregando análise de variações...</div>
            </div>
          ) : resultados && resultados.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Mês Atual</TableHead>
                  <TableHead>{formatarNomeComparacao()}</TableHead>
                  <TableHead>Variação</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Avaliação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((item) => {
                  const isExpanded = expandedAccounts[item.nome] || false;
                  const hasDetails = filtros.tipo_comparacao === 'media_12_meses' && item.detalhes_mensais?.valores_mensais?.length > 0;
                  
                  return (
                    <React.Fragment key={item.nome}>
                      <TableRow className={hasDetails && isExpanded ? "bg-muted/30" : ""}>
                        <TableCell 
                          className={hasDetails ? "cursor-pointer" : ""} 
                          onClick={hasDetails ? () => toggleAccountExpand(item.nome) : undefined}
                        >
                          <div className="flex items-center">
                            {hasDetails && (
                              <ChevronDown 
                                className={`h-4 w-4 mr-2 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                              />
                            )}
                            {item.nome}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.valor_atual)}</TableCell>
                        <TableCell>{formatCurrency(item.valor_comparacao)}</TableCell>
                        <TableCell>{formatCurrency(item.variacao_valor)}</TableCell>
                        <TableCell>
                          <VariationDisplay 
                            value={item.variacao_percentual} 
                            tipoConta={item.tipo_conta} 
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium
                            ${item.avaliacao === 'positiva' ? 'bg-green-100 text-green-800' : 
                              item.avaliacao === 'negativa' ? 'bg-red-100 text-red-800' : 
                                item.avaliacao === 'atencao' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'}
                          `}>
                            {item.avaliacao === 'positiva' ? 'Positiva' : 
                              item.avaliacao === 'negativa' ? 'Negativa' : 
                                item.avaliacao === 'atencao' ? 'Atenção' : 'Estável'}
                          </span>
                        </TableCell>
                      </TableRow>
                      
                      {hasDetails && isExpanded && (
                        <TableRow className="bg-muted/10">
                          <TableCell colSpan={6} className="px-0 py-0">
                            <div className="p-4">
                              <h4 className="font-medium mb-2">Valores Mensais - {item.nome}</h4>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {item.detalhes_mensais?.valores_mensais.map((val: ValorMensal) => (
                                        <TableHead key={`${val.ano}-${val.mes}`} className="text-center">
                                          {val.mes_nome}
                                        </TableHead>
                                      ))}
                                      <TableHead className="text-center font-bold">Média</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      {item.detalhes_mensais?.valores_mensais.map((val: ValorMensal) => (
                                        <TableCell key={`${val.ano}-${val.mes}`} className="text-center">
                                          {formatCurrency(val.valor)}
                                        </TableCell>
                                      ))}
                                      <TableCell className="text-center font-bold">
                                        {formatCurrency(item.detalhes_mensais?.media)}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="text-sm text-muted-foreground mt-2">
                                <p>
                                  <strong>Observação:</strong> A média é calculada considerando TODOS os meses, 
                                  incluindo aqueles com valor zero, para uma representação fiel do resultado médio.
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhuma variação significativa encontrada com os filtros atuais.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFiltros(prev => ({ ...prev, percentual_minimo: 5 }))}
              >
                Reduzir para variações acima de 5%
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
