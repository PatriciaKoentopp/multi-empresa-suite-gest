
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlanoConta } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

const AnaliseDrePage = () => {
  // Estados para filtros
  const [filtroAtual, setFiltroAtual] = useState<'mes' | 'trimestre' | 'ano'>('mes');
  const [periodoAtual, setPeriodoAtual] = useState({
    inicio: format(new Date(), 'yyyy-MM-01'),
    fim: format(new Date(), 'yyyy-MM-dd')
  });
  const [periodoComparacao, setPeriodoComparacao] = useState({
    inicio: format(subMonths(new Date(), 1), 'yyyy-MM-01'),
    fim: format(subMonths(new Date(), 1), 'yyyy-MM-dd')
  });
  
  // Estados temporários para os filtros (serão aplicados apenas quando o botão for clicado)
  const [filtroAtualTemp, setFiltroAtualTemp] = useState<'mes' | 'trimestre' | 'ano'>('mes');
  const [periodoAtualTemp, setPeriodoAtualTemp] = useState({
    inicio: format(new Date(), 'yyyy-MM-01'),
    fim: format(new Date(), 'yyyy-MM-dd')
  });
  const [periodoComparacaoTemp, setPeriodoComparacaoTemp] = useState({
    inicio: format(subMonths(new Date(), 1), 'yyyy-MM-01'),
    fim: format(subMonths(new Date(), 1), 'yyyy-MM-dd')
  });

  // Inicializa os estados temporários com os valores dos estados principais
  useEffect(() => {
    setFiltroAtualTemp(filtroAtual);
    setPeriodoAtualTemp(periodoAtual);
    setPeriodoComparacaoTemp(periodoComparacao);
  }, [filtroAtual, periodoAtual, periodoComparacao]);

  // Função para aplicar os filtros temporários
  const aplicarFiltros = () => {
    setFiltroAtual(filtroAtualTemp);
    setPeriodoAtual(periodoAtualTemp);
    setPeriodoComparacao(periodoComparacaoTemp);
  };

  // Função para resetar os filtros
  const resetarFiltros = () => {
    const defaultFiltro = 'mes';
    const defaultPeriodoAtual = {
      inicio: format(new Date(), 'yyyy-MM-01'),
      fim: format(new Date(), 'yyyy-MM-dd')
    };
    const defaultPeriodoComparacao = {
      inicio: format(subMonths(new Date(), 1), 'yyyy-MM-01'),
      fim: format(subMonths(new Date(), 1), 'yyyy-MM-dd')
    };
    
    // Atualiza os estados principais
    setFiltroAtual(defaultFiltro);
    setPeriodoAtual(defaultPeriodoAtual);
    setPeriodoComparacao(defaultPeriodoComparacao);
    
    // Atualiza também os estados temporários
    setFiltroAtualTemp(defaultFiltro);
    setPeriodoAtualTemp(defaultPeriodoAtual);
    setPeriodoComparacaoTemp(defaultPeriodoComparacao);
  };

  // Buscar dados do plano de contas para as análises
  const { data: planoContas, isLoading } = useQuery({
    queryKey: ['plano-contas-analise', periodoAtual, periodoComparacao],
    queryFn: async () => {
      console.log('Períodos de análise:', {
        atual: periodoAtual,
        comparacao: periodoComparacao
      });

      // Buscar plano de contas
      const { data: planoContasData, error: planoContasError } = await supabase
        .from('plano_contas')
        .select('*')
        .order('codigo');

      if (planoContasError) {
        console.error('Erro ao buscar plano de contas:', planoContasError);
        throw new Error('Falha ao carregar plano de contas');
      }

      // Buscar lançamentos do período atual
      const { data: lancamentosAtuais, error: lancamentosAtuaisError } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data', periodoAtual.inicio)
        .lte('data', periodoAtual.fim);

      if (lancamentosAtuaisError) {
        console.error('Erro ao buscar lançamentos atuais:', lancamentosAtuaisError);
        throw new Error('Falha ao carregar lançamentos do período atual');
      }

      // Buscar lançamentos do período de comparação
      const { data: lancamentosComparacao, error: lancamentosComparacaoError } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data', periodoComparacao.inicio)
        .lte('data', periodoComparacao.fim);

      if (lancamentosComparacaoError) {
        console.error('Erro ao buscar lançamentos de comparação:', lancamentosComparacaoError);
        throw new Error('Falha ao carregar lançamentos do período de comparação');
      }

      // Processar os dados
      const planoContasProcessado = planoContasData.map((conta: PlanoConta) => {
        const lancamentosContaAtual = lancamentosAtuais.filter(
          (l) => l.conta_id === conta.id
        );
        const lancamentosContaComparacao = lancamentosComparacao.filter(
          (l) => l.conta_id === conta.id
        );

        const valorAtual = lancamentosContaAtual.reduce(
          (sum, l) => sum + (l.tipo === 'credito' ? l.valor : -l.valor),
          0
        );
        const valorComparacao = lancamentosContaComparacao.reduce(
          (sum, l) => sum + (l.tipo === 'credito' ? l.valor : -l.valor),
          0
        );

        const variacao = valorComparacao !== 0
          ? ((valorAtual - valorComparacao) / Math.abs(valorComparacao)) * 100
          : valorAtual > 0 ? 100 : 0;

        return {
          ...conta,
          valorAtual,
          valorComparacao,
          variacao
        };
      });

      return planoContasProcessado;
    },
  });

  // Função para agrupar os dados por grupo (receita, despesa)
  const agruparPorGrupo = (dados: any[]) => {
    if (!dados || dados.length === 0) return [];
    
    const grupos: Record<string, any> = {};
    
    dados.forEach((conta) => {
      if (!conta.tipo) return;
      
      if (!grupos[conta.tipo]) {
        grupos[conta.tipo] = {
          nome: getTipoNome(conta.tipo),
          valorAtual: 0,
          valorComparacao: 0,
          contas: []
        };
      }
      
      grupos[conta.tipo].valorAtual += conta.valorAtual || 0;
      grupos[conta.tipo].valorComparacao += conta.valorComparacao || 0;
      grupos[conta.tipo].contas.push(conta);
    });
    
    return Object.values(grupos);
  };

  // Função para obter nome mais amigável para o tipo
  const getTipoNome = (tipo: string) => {
    const nomes: Record<string, string> = {
      receita: 'Receitas',
      despesa: 'Despesas',
      ativo: 'Ativos',
      passivo: 'Passivos',
      patrimonio: 'Patrimônio'
    };
    return nomes[tipo] || tipo;
  };

  // Dados agrupados para visualização
  const dadosAgrupados = agruparPorGrupo(planoContas || []);

  // Preparar dados para gráficos
  const dadosGrafico = dadosAgrupados.map(grupo => ({
    nome: grupo.nome,
    atual: Math.abs(grupo.valorAtual),
    comparacao: Math.abs(grupo.valorComparacao),
  }));

  // Calcular resultado (receitas - despesas)
  const calcularResultado = (dados: any[]) => {
    if (!dados || dados.length === 0) return { atual: 0, comparacao: 0, variacao: 0 };
    
    const receitas = dados.find((grupo) => grupo.nome === 'Receitas') || { valorAtual: 0, valorComparacao: 0 };
    const despesas = dados.find((grupo) => grupo.nome === 'Despesas') || { valorAtual: 0, valorComparacao: 0 };
    
    const resultadoAtual = receitas.valorAtual - Math.abs(despesas.valorAtual);
    const resultadoComparacao = receitas.valorComparacao - Math.abs(despesas.valorComparacao);
    
    const variacao = resultadoComparacao !== 0
      ? ((resultadoAtual - resultadoComparacao) / Math.abs(resultadoComparacao)) * 100
      : resultadoAtual > 0 ? 100 : 0;
    
    return {
      atual: resultadoAtual,
      comparacao: resultadoComparacao,
      variacao
    };
  };

  const resultado = calcularResultado(dadosAgrupados);

  // Formatar valores para exibição
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Formatar percentual para exibição
  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
          <p className="text-sm text-muted-foreground">Carregando análises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Análise DRE</h1>
          <p className="text-muted-foreground">
            Compare e analise dados financeiros entre períodos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Período de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Select value={filtroAtualTemp} onValueChange={(valor) => setFiltroAtualTemp(valor as 'mes' | 'trimestre' | 'ano')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Mensal</SelectItem>
                  <SelectItem value="trimestre">Trimestral</SelectItem>
                  <SelectItem value="ano">Anual</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Período Atual</p>
                  <input
                    type="date"
                    value={periodoAtualTemp.inicio}
                    onChange={(e) => setPeriodoAtualTemp(prev => ({ ...prev, inicio: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">até</p>
                  <input
                    type="date"
                    value={periodoAtualTemp.fim}
                    onChange={(e) => setPeriodoAtualTemp(prev => ({ ...prev, fim: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Período Comparação</p>
                  <input
                    type="date"
                    value={periodoComparacaoTemp.inicio}
                    onChange={(e) => setPeriodoComparacaoTemp(prev => ({ ...prev, inicio: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">até</p>
                  <input
                    type="date"
                    value={periodoComparacaoTemp.fim}
                    onChange={(e) => setPeriodoComparacaoTemp(prev => ({ ...prev, fim: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="blue" 
                  className="w-full" 
                  onClick={aplicarFiltros}
                >
                  Aplicar Filtros
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetarFiltros}
                  title="Resetar filtros"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resultado do Período</CardTitle>
            <CardDescription>
              {format(new Date(periodoAtual.inicio), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(periodoAtual.fim), 'dd/MM/yyyy', { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Atual</p>
                <p className={`text-2xl font-bold ${resultado.atual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarValor(resultado.atual)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Período Anterior</p>
                <p className={`text-2xl font-bold ${resultado.comparacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarValor(resultado.comparacao)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Variação</p>
                <div className="flex items-center">
                  {resultado.variacao > 0 && <ArrowUp className="h-5 w-5 text-green-600 mr-1" />}
                  {resultado.variacao < 0 && <ArrowDown className="h-5 w-5 text-red-600 mr-1" />}
                  <p className={`text-2xl font-bold ${resultado.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatarPercentual(resultado.variacao)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="grafico" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grafico">Gráficos</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grafico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparação entre Períodos</CardTitle>
              <CardDescription>
                Análise de receitas e despesas entre os períodos selecionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatarValor(Number(value))} />
                    <Legend />
                    <Bar dataKey="atual" name="Período Atual" fill="#2563eb" />
                    <Bar dataKey="comparacao" name="Período Comparação" fill="#64748b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução do Resultado</CardTitle>
              <CardDescription>
                Tendência de resultados ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { nome: 'Período Anterior', valor: resultado.comparacao },
                    { nome: 'Período Atual', valor: resultado.atual },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatarValor(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="valor" name="Resultado" stroke="#2563eb" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detalhes">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Grupo</CardTitle>
              <CardDescription>
                Análise detalhada por grupo de contas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-4 border-b">Grupo</th>
                      <th className="text-right p-4 border-b">Atual</th>
                      <th className="text-right p-4 border-b">Anterior</th>
                      <th className="text-right p-4 border-b">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosAgrupados.map((grupo, index) => {
                      const variacao = grupo.valorComparacao !== 0
                        ? ((grupo.valorAtual - grupo.valorComparacao) / Math.abs(grupo.valorComparacao)) * 100
                        : grupo.valorAtual > 0 ? 100 : 0;
                      
                      return (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="p-4 border-b font-medium">
                            {grupo.nome}
                          </td>
                          <td className="text-right p-4 border-b">
                            {formatarValor(grupo.valorAtual)}
                          </td>
                          <td className="text-right p-4 border-b">
                            {formatarValor(grupo.valorComparacao)}
                          </td>
                          <td className={`text-right p-4 border-b ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center justify-end">
                              {variacao > 0 && <ArrowUp className="h-4 w-4 mr-1" />}
                              {variacao < 0 && <ArrowDown className="h-4 w-4 mr-1" />}
                              {formatarPercentual(variacao)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-muted font-bold">
                      <td className="p-4 border-b">
                        Resultado
                      </td>
                      <td className={`text-right p-4 border-b ${resultado.atual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatarValor(resultado.atual)}
                      </td>
                      <td className={`text-right p-4 border-b ${resultado.comparacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatarValor(resultado.comparacao)}
                      </td>
                      <td className={`text-right p-4 border-b ${resultado.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end">
                          {resultado.variacao > 0 && <ArrowUp className="h-4 w-4 mr-1" />}
                          {resultado.variacao < 0 && <ArrowDown className="h-4 w-4 mr-1" />}
                          {formatarPercentual(resultado.variacao)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnaliseDrePage;
