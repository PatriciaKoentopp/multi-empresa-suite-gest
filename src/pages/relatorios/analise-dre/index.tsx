
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subMonths, isValid, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AnaliseDre() {
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const { currentCompany } = useCompany();
  const [detalhesExpandidos, setDetalhesExpandidos] = useState<Record<string, boolean>>({});

  // Gerar lista de anos disponíveis (últimos 5 anos)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);

  // Lista de meses
  const meses = [
    { valor: 1, nome: "Janeiro" },
    { valor: 2, nome: "Fevereiro" },
    { valor: 3, nome: "Março" },
    { valor: 4, nome: "Abril" },
    { valor: 5, nome: "Maio" },
    { valor: 6, nome: "Junho" },
    { valor: 7, nome: "Julho" },
    { valor: 8, nome: "Agosto" },
    { valor: 9, nome: "Setembro" },
    { valor: 10, nome: "Outubro" },
    { valor: 11, nome: "Novembro" },
    { valor: 12, nome: "Dezembro" }
  ];

  // Helper para formato de datas
  const formatarData = (data: Date | string): string => {
    if (!data) return "";
    
    let dataObj: Date;
    if (typeof data === "string") {
      // Se for uma string de data do banco, ela estará no formato YYYY-MM-DD
      // Usamos parseISO para garantir que a data seja interpretada corretamente
      dataObj = parseISO(data);
      if (!isValid(dataObj)) return "";
    } else {
      dataObj = data;
    }
    
    return format(dataObj, "dd/MM/yyyy", { locale: pt });
  };

  // Formatação de valores monetários
  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para determinar o tipo da conta (receita ou despesa)
  const obterTipoConta = (nomeConta: string): 'receita' | 'despesa' => {
    const nomeLowerCase = nomeConta.toLowerCase();
    if (
      nomeLowerCase.includes('receita') || 
      nomeLowerCase.includes('vendas') ||
      nomeLowerCase.includes('faturamento')
    ) {
      return 'receita';
    }
    return 'despesa';
  };

  // Query para buscar dados do DRE
  const { data: dadosDRE, isLoading } = useQuery({
    queryKey: ["analise-dre", currentCompany?.id, anoSelecionado, mesSelecionado],
    queryFn: async () => {
      if (!currentCompany?.id) return { contas: [], resumo: [] };

      try {
        // Obter primeiro e último dia do mês selecionado
        const primeiroDiaMes = new Date(anoSelecionado, mesSelecionado - 1, 1);
        const ultimoDiaMes = new Date(anoSelecionado, mesSelecionado, 0);
        
        // Formatar datas para strings ISO
        const dataInicio = format(primeiroDiaMes, "yyyy-MM-dd");
        const dataFim = format(ultimoDiaMes, "yyyy-MM-dd");
        
        // Calcular primeiro dia para a média dos últimos 12 meses (sem incluir o mês atual)
        const primeiroMes12Meses = subMonths(primeiroDiaMes, 12);
        const ultimoMes12Meses = subMonths(ultimoDiaMes, 1);
        
        const dataInicio12Meses = format(primeiroMes12Meses, "yyyy-MM-dd");
        const dataFim12Meses = format(ultimoMes12Meses, "yyyy-MM-dd");

        console.log(`Buscando dados: Mês atual: ${dataInicio} a ${dataFim}`);
        console.log(`Média 12 meses: ${dataInicio12Meses} a ${dataFim12Meses}`);

        // Buscar todas as movimentações classificadas no DRE no período selecionado
        const { data: movimentacoes, error } = await supabase
          .from('fluxo_caixa')
          .select(`
            *,
            movimentacoes (
              categoria_id,
              tipo_operacao,
              considerar_dre,
              plano_contas(id, tipo, descricao, classificacao_dre)
            )
          `)
          .eq('empresa_id', currentCompany.id)
          .gte('data_movimentacao', dataInicio)
          .lte('data_movimentacao', dataFim);

        if (error) throw error;

        // Buscar movimentações dos 12 meses anteriores para média
        const { data: movimentacoes12Meses, error: error12Meses } = await supabase
          .from('fluxo_caixa')
          .select(`
            *,
            movimentacoes (
              categoria_id,
              tipo_operacao,
              considerar_dre,
              plano_contas(id, tipo, descricao, classificacao_dre)
            )
          `)
          .eq('empresa_id', currentCompany.id)
          .gte('data_movimentacao', dataInicio12Meses)
          .lte('data_movimentacao', dataFim12Meses);

        if (error12Meses) throw error12Meses;

        // Processar as movimentações agrupadas por conta
        const contasMesAtual = processarMovimentacoesPorConta(movimentacoes || []);
        const contas12Meses = processarMovimentacoesPorConta(movimentacoes12Meses || []);

        // Calcular a média mensal para cada conta nos últimos 12 meses
        // Importante: devemos considerar o número correto de meses em que cada conta teve movimento
        const mediasMensais = calcularMediaMensal(movimentacoes12Meses || [], 12);
        
        // Combinar dados do mês atual com médias dos últimos 12 meses
        const contasCombinadas = combinarDados(contasMesAtual, mediasMensais);

        // Calcular resumo
        const resumo = calcularResumo(contasCombinadas);

        return {
          contas: contasCombinadas,
          resumo,
          detalhesMes12: agruparPorMes(movimentacoes12Meses || [])
        };
      } catch (error) {
        console.error("Erro ao buscar dados DRE:", error);
        return { contas: [], resumo: [], detalhesMes12: {} };
      }
    }
  });

  // Função para processar movimentações e agrupar por conta
  function processarMovimentacoesPorConta(movimentacoes: any[]) {
    const contas: Record<string, { 
      descricao: string; 
      valor: number; 
      classificacao: string;
      tipo_conta: 'receita' | 'despesa';
      movimentacoes: any[];
    }> = {};
    
    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;

      const planoContas = mov.movimentacoes?.plano_contas;
      if (!planoContas) return;

      const valor = Number(mov.valor);
      const descricao = planoContas.descricao || "Sem descrição";
      const classificacao = planoContas.classificacao_dre || "nao_classificado";
      
      // Determinar tipo de conta (receita ou despesa)
      const tipo = planoContas.tipo?.toLowerCase() || "";
      const tipo_conta: 'receita' | 'despesa' = tipo === 'receita' ? 'receita' : 'despesa';
      
      if (!contas[descricao]) {
        contas[descricao] = { 
          descricao, 
          valor: 0,
          classificacao,
          tipo_conta,
          movimentacoes: []
        };
      }
      
      contas[descricao].valor += valor;
      contas[descricao].movimentacoes.push(mov);
    });

    // Converter para array e ordenar
    return Object.values(contas).sort((a, b) => {
      // Primeiro por tipo (receitas primeiro)
      if (a.tipo_conta === 'receita' && b.tipo_conta !== 'receita') return -1;
      if (a.tipo_conta !== 'receita' && b.tipo_conta === 'receita') return 1;
      
      // Depois por valor absoluto (maior primeiro)
      return Math.abs(b.valor) - Math.abs(a.valor);
    });
  }

  // Função para calcular a média mensal por conta
  function calcularMediaMensal(movimentacoes: any[], totalMeses: number) {
    // Primeiro agrupamos as movimentações por mês e conta
    const movimentacoesPorMesEConta = agruparPorMes(movimentacoes);
    
    // Depois calculamos a média para cada conta
    const mediaPorConta: Record<string, { 
      descricao: string; 
      valor: number;
      classificacao: string;
      tipo_conta: 'receita' | 'despesa';
      mesesComMovimento: number;
      valoresPorMes: Record<string, number>;
    }> = {};
    
    // Primeiro estabelecemos todas as contas únicas
    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;

      const planoContas = mov.movimentacoes?.plano_contas;
      if (!planoContas) return;
      
      const descricao = planoContas.descricao || "Sem descrição";
      const classificacao = planoContas.classificacao_dre || "nao_classificado";
      
      // Determinar tipo de conta
      const tipo = planoContas.tipo?.toLowerCase() || "";
      const tipo_conta: 'receita' | 'despesa' = tipo === 'receita' ? 'receita' : 'despesa';
      
      if (!mediaPorConta[descricao]) {
        mediaPorConta[descricao] = { 
          descricao, 
          valor: 0,
          classificacao,
          tipo_conta,
          mesesComMovimento: 0,
          valoresPorMes: {}
        };
      }
    });
    
    // Agora contamos os meses com movimento para cada conta
    Object.keys(movimentacoesPorMesEConta).forEach(mes => {
      const contasNoMes = movimentacoesPorMesEConta[mes];
      
      Object.keys(contasNoMes).forEach(descricaoConta => {
        if (mediaPorConta[descricaoConta]) {
          const valorNoMes = Number(contasNoMes[descricaoConta].valor);
          mediaPorConta[descricaoConta].mesesComMovimento += 1;
          mediaPorConta[descricaoConta].valoresPorMes[mes] = valorNoMes;
          mediaPorConta[descricaoConta].valor += valorNoMes;
        }
      });
    });
    
    // Calcular a média final dividindo pelo número de meses com movimento
    Object.keys(mediaPorConta).forEach(descricaoConta => {
      const conta = mediaPorConta[descricaoConta];
      // Se não houver movimento, a média é zero
      if (conta.mesesComMovimento > 0) {
        conta.valor = conta.valor / conta.mesesComMovimento;
      }
    });
    
    return mediaPorConta;
  }

  // Função para agrupar movimentações por mês e conta
  function agruparPorMes(movimentacoes: any[]) {
    const movPorMes: Record<string, Record<string, {
      valor: number;
      tipo_conta: 'receita' | 'despesa';
      classificacao: string;
      movimentacoes: any[];
    }>> = {};
    
    movimentacoes.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;

      const planoContas = mov.movimentacoes?.plano_contas;
      if (!planoContas) return;

      // Importante: usamos substring para extrair o mês, evitando problemas de timezone
      const mes = mov.data_movimentacao.substring(0, 7); // Formato: YYYY-MM
      
      const valor = Number(mov.valor);
      const descricao = planoContas.descricao || "Sem descrição";
      const classificacao = planoContas.classificacao_dre || "nao_classificado";
      
      // Determinar tipo de conta
      const tipo = planoContas.tipo?.toLowerCase() || "";
      const tipo_conta: 'receita' | 'despesa' = tipo === 'receita' ? 'receita' : 'despesa';
      
      if (!movPorMes[mes]) {
        movPorMes[mes] = {};
      }
      
      if (!movPorMes[mes][descricao]) {
        movPorMes[mes][descricao] = { 
          valor: 0, 
          tipo_conta,
          classificacao,
          movimentacoes: [] 
        };
      }
      
      movPorMes[mes][descricao].valor += valor;
      movPorMes[mes][descricao].movimentacoes.push(mov);
    });
    
    return movPorMes;
  }

  // Função para combinar os dados do mês atual com as médias dos últimos 12 meses
  function combinarDados(contasMesAtual: any[], mediasMensais: Record<string, any>) {
    // Primeiro, adicionamos os dados do mês atual
    const contasCombinadas = [...contasMesAtual];
    
    // Para cada conta do mês atual, adicionamos a média se existir
    contasCombinadas.forEach(conta => {
      const mediaInfo = mediasMensais[conta.descricao];
      if (mediaInfo) {
        conta.valor_anterior = mediaInfo.valor;
        conta.variacao_percentual = 
          mediaInfo.valor !== 0 
            ? ((conta.valor - mediaInfo.valor) / Math.abs(mediaInfo.valor)) * 100 
            : null;
        conta.detalhe_meses = mediaInfo.valoresPorMes;
        conta.num_meses = mediaInfo.mesesComMovimento;
      } else {
        conta.valor_anterior = 0;
        conta.variacao_percentual = null;
        conta.detalhe_meses = {};
        conta.num_meses = 0;
      }
    });
    
    // Verificar se há contas nos meses anteriores que não existem no mês atual
    Object.keys(mediasMensais).forEach(descricaoConta => {
      const contaExiste = contasCombinadas.some(c => c.descricao === descricaoConta);
      
      if (!contaExiste) {
        const mediaInfo = mediasMensais[descricaoConta];
        
        contasCombinadas.push({
          descricao: descricaoConta,
          valor: 0,
          valor_anterior: mediaInfo.valor,
          variacao_percentual: mediaInfo.valor !== 0 ? -100 : null, // Diminuiu 100% (não existe mais)
          classificacao: mediaInfo.classificacao,
          tipo_conta: mediaInfo.tipo_conta,
          movimentacoes: [],
          detalhe_meses: mediaInfo.valoresPorMes,
          num_meses: mediaInfo.mesesComMovimento
        });
      }
    });
    
    // Ordenar novamente
    return contasCombinadas.sort((a, b) => {
      // Primeiro por tipo (receitas primeiro)
      if (a.tipo_conta === 'receita' && b.tipo_conta !== 'receita') return -1;
      if (a.tipo_conta !== 'receita' && b.tipo_conta === 'receita') return 1;
      
      // Depois por valor absoluto do mês atual (maior primeiro)
      return Math.abs(b.valor) - Math.abs(a.valor);
    });
  }

  // Função para calcular totais de receitas e despesas para o resumo
  function calcularResumo(contas: any[]) {
    const resumo = {
      receitas: { atual: 0, anterior: 0 },
      despesas: { atual: 0, anterior: 0 },
      resultado: { atual: 0, anterior: 0 }
    };
    
    contas.forEach(conta => {
      if (conta.tipo_conta === 'receita') {
        resumo.receitas.atual += conta.valor;
        resumo.receitas.anterior += conta.valor_anterior || 0;
      } else {
        resumo.despesas.atual += conta.valor;
        resumo.despesas.anterior += conta.valor_anterior || 0;
      }
    });
    
    resumo.resultado.atual = resumo.receitas.atual + resumo.despesas.atual;
    resumo.resultado.anterior = resumo.receitas.anterior + resumo.despesas.anterior;
    
    return resumo;
  }

  function toggleDetalhes(contaDescricao: string) {
    setDetalhesExpandidos(prev => ({
      ...prev,
      [contaDescricao]: !prev[contaDescricao]
    }));
  }

  // Função auxiliar para formatar nomes de mês
  function obterNomeMes(data: string) {
    const [ano, mes] = data.split('-');
    const mesNumero = parseInt(mes, 10);
    const mesEncontrado = meses.find(m => m.valor === mesNumero);
    return `${mesEncontrado?.nome || mes}/${ano}`;
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Análise de DRE - Comparação com média dos últimos 12 meses</span>
            <div className="flex items-center gap-2">
              <Select value={anoSelecionado.toString()} onValueChange={v => setAnoSelecionado(parseInt(v, 10))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={mesSelecionado.toString()} onValueChange={v => setMesSelecionado(parseInt(v, 10))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.valor} value={mes.valor.toString()}>{mes.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo */}
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Valor Atual</TableHead>
                        <TableHead className="text-right">Valor Anterior (Média)</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Receitas</TableCell>
                        <TableCell className="text-right">{formatarMoeda(dadosDRE?.resumo.receitas.atual || 0)}</TableCell>
                        <TableCell className="text-right">{formatarMoeda(dadosDRE?.resumo.receitas.anterior || 0)}</TableCell>
                        <TableCell className="text-right">
                          {formatarMoeda((dadosDRE?.resumo.receitas.atual || 0) - (dadosDRE?.resumo.receitas.anterior || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {dadosDRE?.resumo.receitas.anterior !== 0 ? (
                            <VariationDisplay 
                              value={((dadosDRE?.resumo.receitas.atual - dadosDRE?.resumo.receitas.anterior) / 
                                Math.abs(dadosDRE?.resumo.receitas.anterior)) * 100} 
                              tipoConta="receita"
                            />
                          ) : <span>-</span>}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Despesas</TableCell>
                        <TableCell className="text-right">{formatarMoeda(dadosDRE?.resumo.despesas.atual || 0)}</TableCell>
                        <TableCell className="text-right">{formatarMoeda(dadosDRE?.resumo.despesas.anterior || 0)}</TableCell>
                        <TableCell className="text-right">
                          {formatarMoeda((dadosDRE?.resumo.despesas.atual || 0) - (dadosDRE?.resumo.despesas.anterior || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {dadosDRE?.resumo.despesas.anterior !== 0 ? (
                            <VariationDisplay 
                              value={((dadosDRE?.resumo.despesas.atual - dadosDRE?.resumo.despesas.anterior) / 
                                Math.abs(dadosDRE?.resumo.despesas.anterior)) * 100} 
                              tipoConta="despesa"
                            />
                          ) : <span>-</span>}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>Resultado</TableCell>
                        <TableCell className="text-right">{formatarMoeda(dadosDRE?.resumo.resultado.atual || 0)}</TableCell>
                        <TableCell className="text-right">{formatarMoeda(dadosDRE?.resumo.resultado.anterior || 0)}</TableCell>
                        <TableCell className="text-right">
                          {formatarMoeda((dadosDRE?.resumo.resultado.atual || 0) - (dadosDRE?.resumo.resultado.anterior || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {dadosDRE?.resumo.resultado.anterior !== 0 ? (
                            <VariationDisplay 
                              value={((dadosDRE?.resumo.resultado.atual - dadosDRE?.resumo.resultado.anterior) / 
                                Math.abs(dadosDRE?.resumo.resultado.anterior)) * 100}
                              tipoConta={dadosDRE?.resumo.resultado.anterior > 0 ? 'receita' : 'despesa'}
                            />
                          ) : <span>-</span>}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Detalhes por conta */}
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg flex items-center">
                    <span>Detalhamento por Conta</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Comparação entre o mês atual e a média dos últimos 12 meses para cada conta.</p>
                          <p>Uma variação positiva em despesas significa uma redução no valor gasto.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead className="text-right">Valor Atual</TableHead>
                        <TableHead className="text-right">Valor Anterior (Média)</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosDRE?.contas.map((conta: any, index: number) => (
                        <React.Fragment key={index}>
                          <TableRow className={conta.tipo_conta === 'receita' ? 'bg-green-50' : 'bg-red-50'}>
                            <TableCell 
                              className="font-medium cursor-pointer"
                              onClick={() => toggleDetalhes(conta.descricao)}
                            >
                              <div className="flex items-center">
                                <ChevronDown 
                                  className={`h-4 w-4 mr-2 transition-transform duration-200 ${detalhesExpandidos[conta.descricao] ? 'rotate-180' : ''}`} 
                                />
                                {conta.descricao}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatarMoeda(conta.valor)}</TableCell>
                            <TableCell className="text-right">{formatarMoeda(conta.valor_anterior || 0)}</TableCell>
                            <TableCell className="text-right">
                              {formatarMoeda((conta.valor || 0) - (conta.valor_anterior || 0))}
                            </TableCell>
                            <TableCell className="text-right">
                              {conta.variacao_percentual !== null ? (
                                <VariationDisplay 
                                  value={conta.variacao_percentual} 
                                  tipoConta={conta.tipo_conta}
                                />
                              ) : <span>-</span>}
                            </TableCell>
                          </TableRow>
                          
                          {/* Detalhes da média dos últimos 12 meses */}
                          {detalhesExpandidos[conta.descricao] && (
                            <TableRow>
                              <TableCell colSpan={5} className="p-0">
                                <Collapsible open={detalhesExpandidos[conta.descricao]} className="w-full">
                                  <CollapsibleContent className="p-2 bg-gray-50">
                                    <div className="text-sm font-medium mb-2">
                                      Detalhes da média dos últimos 12 meses:
                                    </div>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Mês</TableHead>
                                          <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {Object.keys(conta.detalhe_meses || {}).length > 0 ? (
                                          <>
                                            {Object.entries(conta.detalhe_meses || {})
                                              .sort(([mesA], [mesB]) => mesA.localeCompare(mesB))
                                              .map(([mes, valor]: [string, any], idx: number) => (
                                                <TableRow key={idx}>
                                                  <TableCell>{obterNomeMes(mes)}</TableCell>
                                                  <TableCell className="text-right">{formatarMoeda(Number(valor))}</TableCell>
                                                </TableRow>
                                              ))
                                            }
                                            <TableRow className="font-medium">
                                              <TableCell>Média ({conta.num_meses} meses)</TableCell>
                                              <TableCell className="text-right">{formatarMoeda(conta.valor_anterior || 0)}</TableCell>
                                            </TableRow>
                                          </>
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                              Sem histórico nos últimos 12 meses
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </CollapsibleContent>
                                </Collapsible>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
