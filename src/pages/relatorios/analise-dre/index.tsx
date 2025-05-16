
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/contexts/company-context";
import { 
  AlertCircle, 
  ArrowDown, 
  ArrowUp, 
  Info, 
  MinusCircle, 
  TrendingDown, 
  TrendingUp 
} from "lucide-react";
import { format } from "date-fns";
import { AnaliseVariacao, DetalhesMensaisConta, ValorMensal } from "@/types/financeiro";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Arrays para seleção de meses e anos
const meses = [
  { label: "Janeiro", value: 1 },
  { label: "Fevereiro", value: 2 },
  { label: "Março", value: 3 },
  { label: "Abril", value: 4 },
  { label: "Maio", value: 5 },
  { label: "Junho", value: 6 },
  { label: "Julho", value: 7 },
  { label: "Agosto", value: 8 },
  { label: "Setembro", value: 9 },
  { label: "Outubro", value: 10 },
  { label: "Novembro", value: 11 },
  { label: "Dezembro", value: 12 }
];

// Array de anos (últimos 5 anos + atual)
const anos: number[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= anoAtual - 5; a--) anos.push(a);

// Tipos de comparação disponíveis
const tiposComparacao = [
  { label: "Mês anterior", value: "mes_anterior" },
  { label: "Mesmo mês do ano anterior", value: "ano_anterior" },
  { label: "Média dos últimos 12 meses", value: "media_12_meses" }
];

// Função para formatar valores como moeda
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Função para formatar percentual
function formatPercentage(value: number): string {
  return value.toFixed(2).replace('.', ',') + '%';
}

export default function AnaliseDrePage() {
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  
  // Estado para armazenar os filtros de análise
  const [filtros, setFiltros] = useState({
    tipo_comparacao: "mes_anterior",
    ano: anoAtual,
    mes: new Date().getMonth() + 1, // Mês atual
    percentual_minimo: 10
  });
  
  // Estado para controlar a visibilidade do diálogo de detalhes mensais
  const [detalhesMensaisAberto, setDetalhesMensaisAberto] = useState(false);
  const [contaDetalheMensal, setContaDetalheMensal] = useState<DetalhesMensaisConta | null>(null);
  
  // Estado para controlar abas
  const [aba, setAba] = useState("analise");
  
  // Estado para mostrar todas as contas ou apenas as com variações significativas
  const [mostrarTodasContas, setMostrarTodasContas] = useState(false);
  
  // Query para buscar os dados de análise do DRE
  const { data: dadosAnalise = [], isLoading } = useQuery({
    queryKey: ["analise-dre", currentCompany?.id, filtros],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      try {
        // Definir datas para a consulta SQL
        let dataReferencia: string;
        let dataComparacao: string;
        let dataInicioMedia: string;
        let dataFimMedia: string;
        
        // Mês/ano de referência para a análise
        dataReferencia = `${filtros.ano}-${filtros.mes.toString().padStart(2, '0')}`;
        
        // Formatar data de acordo com o tipo de comparação
        if (filtros.tipo_comparacao === "mes_anterior") {
          // Mês anterior
          const mesAnterior = filtros.mes === 1 ? 12 : filtros.mes - 1;
          const anoAnterior = filtros.mes === 1 ? filtros.ano - 1 : filtros.ano;
          dataComparacao = `${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}`;
        } 
        else if (filtros.tipo_comparacao === "ano_anterior") {
          // Mesmo mês do ano anterior
          dataComparacao = `${filtros.ano - 1}-${filtros.mes.toString().padStart(2, '0')}`;
        } 
        else {
          // Média 12 meses: do mês anterior a 12 meses antes
          // Para calcular corretamente, vamos calcular os 12 meses ANTES do mês de referência
          const mesFim = filtros.mes === 1 ? 12 : filtros.mes - 1;
          const anoFim = filtros.mes === 1 ? filtros.ano - 1 : filtros.ano;
          
          // O início é 12 meses antes do fim
          const anoInicio = mesFim === 12 ? anoFim - 1 : anoFim;
          const mesInicio = mesFim === 12 ? 1 : mesFim + 1;
          
          // Formatar as datas para consulta SQL - usando o padrão 'YYYY-MM' sem timezone
          dataInicioMedia = `${anoInicio}-${mesInicio.toString().padStart(2, '0')}`;
          dataFimMedia = `${anoFim}-${mesFim.toString().padStart(2, '0')}`;
        }
        
        // Buscar dados do fluxo de caixa para cálculos do DRE
        const { data: fluxoAtual, error: errorAtual } = await supabase
          .from('fluxo_caixa')
          .select(`
            id,
            data_movimentacao,
            tipo_operacao,
            valor,
            movimentacoes!inner (
              tipo_operacao,
              considerar_dre,
              plano_contas!inner (
                id,
                tipo,
                descricao,
                classificacao_dre
              )
            )
          `)
          .eq('empresa_id', currentCompany.id)
          .like('data_movimentacao', `${dataReferencia}%`)
          .eq('movimentacoes.considerar_dre', true);
        
        if (errorAtual) throw errorAtual;
        
        // Consulta para os dados de comparação
        let fluxoComparacao: any[] = [];
        
        if (filtros.tipo_comparacao !== "media_12_meses") {
          // Para comparação com mês anterior ou ano anterior
          const { data: fluxoComp, error: errorComp } = await supabase
            .from('fluxo_caixa')
            .select(`
              id,
              data_movimentacao,
              tipo_operacao,
              valor,
              movimentacoes!inner (
                tipo_operacao,
                considerar_dre,
                plano_contas!inner (
                  id,
                  tipo,
                  descricao,
                  classificacao_dre
                )
              )
            `)
            .eq('empresa_id', currentCompany.id)
            .like('data_movimentacao', `${dataComparacao}%`)
            .eq('movimentacoes.considerar_dre', true);
          
          if (errorComp) throw errorComp;
          fluxoComparacao = fluxoComp || [];
        } else {
          // Para média dos últimos 12 meses
          // Usamos uma query diferente para pegar todos os dados dos últimos 12 meses
          // Isso é importante para evitar problemas de timezone
          const dataInicio = dataInicioMedia + "-01"; // Primeiro dia do mês inicial
          const ultimoDiaDoMes = new Date(parseInt(dataFimMedia.split('-')[0]), parseInt(dataFimMedia.split('-')[1]), 0).getDate();
          const dataFim = dataFimMedia + "-" + ultimoDiaDoMes.toString().padStart(2, '0'); // Último dia do mês final
          
          const { data: fluxoPeriodo, error: errorPeriodo } = await supabase
            .from('fluxo_caixa')
            .select(`
              id,
              data_movimentacao,
              tipo_operacao,
              valor,
              movimentacoes!inner (
                tipo_operacao,
                considerar_dre,
                plano_contas!inner (
                  id,
                  tipo,
                  descricao,
                  classificacao_dre
                )
              )
            `)
            .eq('empresa_id', currentCompany.id)
            .gte('data_movimentacao', dataInicio)
            .lte('data_movimentacao', dataFim)
            .eq('movimentacoes.considerar_dre', true);
          
          if (errorPeriodo) throw errorPeriodo;
          fluxoComparacao = fluxoPeriodo || [];
        }
        
        // Processamento dos dados para gerar a análise
        // Agrupar dados do período atual por conta contábil
        const contasAtual = processarFluxoParaContas(fluxoAtual || []);
        
        // Dados para comparação
        let contasComparacao: Record<string, number> = {};
        let valoresMensaisPorConta: Record<string, ValorMensal[]> = {};
        
        if (filtros.tipo_comparacao !== "media_12_meses") {
          contasComparacao = processarFluxoParaContas(fluxoComparacao);
        } else {
          // Para média dos últimos 12 meses, precisamos calcular os valores mensais e depois a média
          const valoresPorMes = processarFluxoParaMeses(fluxoComparacao);
          
          // Calcular a média para cada conta nos últimos 12 meses
          const contasMedias: Record<string, number> = {};
          const contasDetalhes: Record<string, ValorMensal[]> = {};
          
          // Para cada conta, calcular a média dos valores mensais
          Object.keys(valoresPorMes).forEach(nomeConta => {
            const valoresMensais = valoresPorMes[nomeConta];
            const total = valoresMensais.reduce((sum, item) => sum + item.valor, 0);
            const media = valoresMensais.length > 0 ? total / 12 : 0; // Sempre dividir por 12, mesmo que alguns meses não tenham valor
            
            contasMedias[nomeConta] = media;
            contasDetalhes[nomeConta] = valoresMensais;
          });
          
          contasComparacao = contasMedias;
          valoresMensaisPorConta = contasDetalhes;
        }
        
        // Gerar dados de análise comparativa
        const analise = gerarAnaliseComparativa(contasAtual, contasComparacao, filtros.tipo_comparacao, valoresMensaisPorConta);
        
        return analise;
        
      } catch (error) {
        console.error('Erro ao carregar dados de análise DRE:', error);
        toast({
          title: "Erro ao carregar análise",
          description: "Não foi possível carregar os dados do DRE.",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Função para processar os dados de fluxo e agrupá-los por conta contábil
  function processarFluxoParaContas(dados: any[]): Record<string, number> {
    const contas: Record<string, number> = {};
    
    dados.forEach(item => {
      if (!item.movimentacoes?.plano_contas) return;
      
      const conta = item.movimentacoes.plano_contas;
      const descricao = conta.descricao;
      const valor = item.valor;
      const tipoOperacao = item.tipo_operacao;
      
      // Verificar se a conta já existe no objeto de contas
      if (!contas[descricao]) {
        contas[descricao] = 0;
      }
      
      // Adicionar ou subtrair o valor conforme o tipo de operação
      if (tipoOperacao === 'receber') {
        contas[descricao] += valor;
      } else if (tipoOperacao === 'pagar') {
        contas[descricao] -= valor;
      }
    });
    
    return contas;
  }
  
  // Função para processar os dados de fluxo e agrupá-los por mês para cada conta contábil
  function processarFluxoParaMeses(dados: any[]): Record<string, ValorMensal[]> {
    const contasPorMes: Record<string, Record<string, number>> = {};
    const contasDetalhes: Record<string, ValorMensal[]> = {};
    
    // Primeiro, agrupar os valores por mês para cada conta
    dados.forEach(item => {
      if (!item.movimentacoes?.plano_contas) return;
      
      const conta = item.movimentacoes.plano_contas;
      const descricao = conta.descricao;
      const valor = item.valor;
      const tipoOperacao = item.tipo_operacao;
      
      // Extrair ano e mês da data sem manipulação de timezone
      const dataStr = item.data_movimentacao;
      const [anoMes] = dataStr.split('-', 2);
      const [ano, mes] = anoMes.split('-').map(Number);
      const chaveData = `${ano}-${mes}`;
      
      // Inicializar objetos se necessário
      if (!contasPorMes[descricao]) {
        contasPorMes[descricao] = {};
      }
      
      if (!contasPorMes[descricao][chaveData]) {
        contasPorMes[descricao][chaveData] = 0;
      }
      
      // Adicionar ou subtrair o valor conforme o tipo de operação
      if (tipoOperacao === 'receber') {
        contasPorMes[descricao][chaveData] += valor;
      } else if (tipoOperacao === 'pagar') {
        contasPorMes[descricao][chaveData] -= valor;
      }
    });
    
    // Depois, criar os arrays de valores mensais para cada conta
    Object.keys(contasPorMes).forEach(nomeConta => {
      const mesesValores = contasPorMes[nomeConta];
      const valoresMensais: ValorMensal[] = [];
      
      // Para garantir que todos os 12 meses estejam representados
      // Calcular início e fim do período
      const dataPeriodo = new Date(filtros.ano, filtros.mes - 1, 1);
      dataPeriodo.setMonth(dataPeriodo.getMonth() - 1); // Mês anterior
      
      for (let i = 0; i < 12; i++) {
        dataPeriodo.setMonth(dataPeriodo.getMonth() - 1);
        const ano = dataPeriodo.getFullYear();
        const mes = dataPeriodo.getMonth() + 1;
        
        const chaveData = `${ano}-${mes}`;
        const mesNome = meses.find(m => m.value === mes)?.label || "";
        const valor = mesesValores[chaveData] || 0;
        
        valoresMensais.push({
          mes,
          ano,
          mes_nome: `${mesNome}/${ano}`,
          valor
        });
      }
      
      // Ordenar os meses (do mais antigo para o mais recente)
      valoresMensais.sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      });
      
      contasDetalhes[nomeConta] = valoresMensais;
    });
    
    return contasDetalhes;
  }
  
  // Função para gerar a análise comparativa entre os períodos
  function gerarAnaliseComparativa(
    contasAtual: Record<string, number>,
    contasComparacao: Record<string, number>,
    tipoComparacao: string,
    valoresMensaisPorConta?: Record<string, ValorMensal[]>
  ): AnaliseVariacao[] {
    const analise: AnaliseVariacao[] = [];
    
    // Conjunto de todas as contas (atual + comparação)
    const todasContas = new Set([
      ...Object.keys(contasAtual),
      ...Object.keys(contasComparacao)
    ]);
    
    // Para cada conta, calcular a variação
    todasContas.forEach(conta => {
      const valorAtual = contasAtual[conta] || 0;
      const valorComparacao = contasComparacao[conta] || 0;
      
      // Calculando a variação
      const variacaoValor = valorAtual - valorComparacao;
      const variacaoPercentual = valorComparacao !== 0
        ? (variacaoValor / Math.abs(valorComparacao)) * 100
        : valorAtual !== 0 ? 100 : 0;
      
      // Determinando a avaliação com base na variação
      let avaliacao: 'positiva' | 'negativa' | 'estavel' | 'atencao' = 'estavel';
      
      // Para receitas, aumento é positivo; para despesas, redução é positiva
      const ehDespesa = conta.toLowerCase().includes('despesa') || 
                      conta.toLowerCase().includes('custo') || 
                      conta.toLowerCase().includes('imposto') || 
                      conta.toLowerCase().includes('tributo');
      
      if (Math.abs(variacaoPercentual) < 5) {
        avaliacao = 'estavel';
      } else if ((ehDespesa && variacaoValor < 0) || (!ehDespesa && variacaoValor > 0)) {
        avaliacao = 'positiva';
      } else if (Math.abs(variacaoPercentual) > 20) {
        avaliacao = 'atencao';
      } else {
        avaliacao = 'negativa';
      }
      
      const item: AnaliseVariacao = {
        nome: conta,
        valor_atual: valorAtual,
        valor_comparacao: valorComparacao,
        variacao_valor: variacaoValor,
        variacao_percentual: variacaoPercentual,
        tipo_conta: ehDespesa ? 'despesa' : 'receita',
        avaliacao,
        nivel: 'principal'
      };
      
      analise.push(item);
    });
    
    // Ordenar a análise por valor absoluto da variação (maiores variações primeiro)
    analise.sort((a, b) => Math.abs(b.variacao_valor) - Math.abs(a.variacao_valor));
    
    return analise;
  }
  
  // Filtrar os dados de análise com base na opção de mostrar todas as contas
  const dadosFiltrados = useMemo(() => {
    if (!dadosAnalise) return [];
    
    if (mostrarTodasContas) {
      return dadosAnalise;
    } else {
      return dadosAnalise.filter(item => 
        Math.abs(item.variacao_percentual) >= filtros.percentual_minimo
      );
    }
  }, [dadosAnalise, mostrarTodasContas, filtros.percentual_minimo]);
  
  // Filtrar alertas significativos (variações positivas e negativas)
  const alertas = useMemo(() => {
    if (!dadosAnalise) return { positivos: [], negativos: [] };
    
    const alertaPositivos = dadosAnalise.filter(item => 
      item.avaliacao === 'positiva' && 
      Math.abs(item.variacao_percentual) >= filtros.percentual_minimo
    ).sort((a, b) => Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual));
    
    const alertaNegativos = dadosAnalise.filter(item => 
      (item.avaliacao === 'negativa' || item.avaliacao === 'atencao') && 
      Math.abs(item.variacao_percentual) >= filtros.percentual_minimo
    ).sort((a, b) => Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual));
    
    return {
      positivos: alertaPositivos,
      negativos: alertaNegativos
    };
  }, [dadosAnalise, filtros.percentual_minimo]);
  
  // Atualizar o filtro
  const handleFiltroChange = (campo: string, valor: string | number) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };
  
  // Manipulador para abrir o diálogo de detalhes mensais
  const handleAbrirDetalhesMensais = (conta: string) => {
    if (!filtros.tipo_comparacao === true || filtros.tipo_comparacao !== "media_12_meses") return;
    
    // Encontrar os detalhes mensais da conta
    const contaAnalise = dadosAnalise.find(item => item.nome === conta);
    if (!contaAnalise) return;
    
    // Calcular o período para o cabeçalho do diálogo
    const mesFim = filtros.mes === 1 ? 12 : filtros.mes - 1;
    const anoFim = filtros.mes === 1 ? filtros.ano - 1 : filtros.ano;
    const mesInicio = mesFim === 12 ? 1 : mesFim + 1;
    const anoInicio = mesFim === 12 ? anoFim - 1 : anoFim;
    
    const periodoInicio = `${meses.find(m => m.value === mesInicio)?.label}/${anoInicio}`;
    const periodoFim = `${meses.find(m => m.value === mesFim)?.label}/${anoFim}`;
    
    // Obter os valores mensais da conta
    const valoresMensais = (contaAnalise as any)._valoresMensais || [];
    
    setContaDetalheMensal({
      nome_conta: conta,
      valores_mensais: valoresMensais,
      media: contaAnalise.valor_comparacao
    });
    
    setDetalhesMensaisAberto(true);
  };
  
  // Gerar texto de período de comparação
  const textoComparacao = useMemo(() => {
    const mesTexto = meses.find(m => m.value === filtros.mes)?.label;
    
    if (filtros.tipo_comparacao === "mes_anterior") {
      const mesAnteriorValue = filtros.mes === 1 ? 12 : filtros.mes - 1;
      const mesAnterior = meses.find(m => m.value === mesAnteriorValue)?.label;
      const anoAnterior = filtros.mes === 1 ? filtros.ano - 1 : filtros.ano;
      return `Comparando ${mesTexto}/${filtros.ano} com ${mesAnterior}/${anoAnterior}`;
    } 
    else if (filtros.tipo_comparacao === "ano_anterior") {
      return `Comparando ${mesTexto}/${filtros.ano} com ${mesTexto}/${filtros.ano - 1}`;
    } 
    else {
      // Para média dos últimos 12 meses
      const mesFim = filtros.mes === 1 ? 12 : filtros.mes - 1;
      const anoFim = filtros.mes === 1 ? filtros.ano - 1 : filtros.ano;
      const mesInicio = mesFim === 12 ? 1 : mesFim + 1;
      const anoInicio = mesFim === 12 ? anoFim - 1 : anoFim;
      
      const periodoInicio = `${meses.find(m => m.value === mesInicio)?.label}/${anoInicio}`;
      const periodoFim = `${meses.find(m => m.value === mesFim)?.label}/${anoFim}`;
      
      return `Comparando ${mesTexto}/${filtros.ano} com média de ${periodoInicio} a ${periodoFim}`;
    }
  }, [filtros]);
  
  // Componente para ícone de avaliação
  const IconeAvaliacao = ({ avaliacao }: { avaliacao: string }) => {
    switch (avaliacao) {
      case 'positiva':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'negativa':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'atencao':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <MinusCircle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Componente para texto de avaliação
  const TextoAvaliacao = ({ avaliacao, tipoConta }: { avaliacao: string, tipoConta: string }) => {
    if (avaliacao === 'estavel') {
      return <span className="text-gray-500">Estável</span>;
    }
    
    const ehPositivo = 
      (avaliacao === 'positiva' && tipoConta === 'receita') || 
      (avaliacao === 'negativa' && tipoConta === 'despesa');
    
    const ehNegativo = 
      (avaliacao === 'negativa' && tipoConta === 'receita') || 
      (avaliacao === 'positiva' && tipoConta === 'despesa');
    
    if (ehPositivo) {
      return <span className="text-green-600">Positiva</span>;
    } else if (ehNegativo) {
      return <span className="text-red-600">Negativa</span>;
    } else if (avaliacao === 'atencao') {
      return <span className="text-amber-500">Atenção</span>;
    }
    
    return <span>-</span>;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Análise do DRE</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Período Base</label>
              <div className="flex gap-2">
                <Select 
                  value={filtros.mes.toString()}
                  onValueChange={(v) => handleFiltroChange("mes", parseInt(v))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filtros.ano.toString()}
                  onValueChange={(v) => handleFiltroChange("ano", parseInt(v))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((a) => (
                      <SelectItem key={a} value={a.toString()}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Comparar com</label>
              <Select 
                value={filtros.tipo_comparacao}
                onValueChange={(v) => handleFiltroChange("tipo_comparacao", v)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Tipo de comparação" />
                </SelectTrigger>
                <SelectContent>
                  {tiposComparacao.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">% Mínimo para alertas</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  min="1"
                  max="100"
                  value={filtros.percentual_minimo}
                  onChange={(e) => handleFiltroChange("percentual_minimo", parseInt(e.target.value))}
                  className="w-24"
                />
                <span>%</span>
              </div>
            </div>
            
            <div className="flex items-end">
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox 
                  id="mostrarTodas" 
                  checked={mostrarTodasContas} 
                  onCheckedChange={(checked) => setMostrarTodasContas(checked as boolean)} 
                />
                <label
                  htmlFor="mostrarTodas"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mostrar todas as contas
                </label>
              </div>
            </div>
          </div>
          
          {/* Texto da comparação */}
          <div className="mb-6">
            <Badge variant="outline" className="px-3 py-1 text-xs">
              {textoComparacao}
            </Badge>
          </div>
          
          {/* Tabs para análise e alertas */}
          <Tabs value={aba} onValueChange={setAba}>
            <TabsList className="mb-4">
              <TabsTrigger value="analise">Análise</TabsTrigger>
              <TabsTrigger value="alertas">
                Alertas
                {alertas.positivos.length + alertas.negativos.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {alertas.positivos.length + alertas.negativos.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Tab de análise */}
            <TabsContent value="analise">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Skeleton key={index} className="w-full h-12" />
                  ))}
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Conta</TableHead>
                        <TableHead className="text-right">Valor Atual</TableHead>
                        <TableHead className="text-right">Valor Anterior</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosFiltrados.length > 0 ? (
                        dadosFiltrados.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.nome}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.valor_atual)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.valor_comparacao)}
                            </TableCell>
                            <TableCell className={`text-right ${item.variacao_valor > 0 ? 'text-green-600' : item.variacao_valor < 0 ? 'text-red-600' : ''}`}>
                              <div className="flex items-center justify-end gap-1">
                                {item.variacao_valor > 0 && <ArrowUp className="w-4 h-4" />}
                                {item.variacao_valor < 0 && <ArrowDown className="w-4 h-4" />}
                                {formatCurrency(Math.abs(item.variacao_valor))}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right ${item.variacao_percentual > 0 ? 'text-green-600' : item.variacao_percentual < 0 ? 'text-red-600' : ''}`}>
                              {formatPercentage(item.variacao_percentual)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <IconeAvaliacao avaliacao={item.avaliacao} />
                                <TextoAvaliacao avaliacao={item.avaliacao} tipoConta={item.tipo_conta} />
                              </div>
                            </TableCell>
                            <TableCell>
                              {filtros.tipo_comparacao === "media_12_meses" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => handleAbrirDetalhesMensais(item.nome)}
                                      >
                                        <Info className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver detalhes mensais</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Não há dados para o período selecionado ou nenhuma conta atende ao filtro de variação.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            {/* Tab de alertas */}
            <TabsContent value="alertas">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Variações Positivas
                  </h3>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((_, index) => (
                        <Skeleton key={index} className="w-full h-12" />
                      ))}
                    </div>
                  ) : (
                    alertas.positivos.length > 0 ? (
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[180px]">Conta</TableHead>
                              <TableHead className="text-right">Atual</TableHead>
                              <TableHead className="text-right">Anterior</TableHead>
                              <TableHead className="text-right">Variação</TableHead>
                              <TableHead className="text-right">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {alertas.positivos.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {item.nome}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.valor_atual)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.valor_comparacao)}
                                </TableCell>
                                <TableCell className="text-right text-green-600">
                                  <div className="flex items-center justify-end gap-1">
                                    <ArrowUp className="w-4 h-4" />
                                    {formatCurrency(Math.abs(item.variacao_valor))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-green-600">
                                  {formatPercentage(item.variacao_percentual)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma variação positiva significativa encontrada.</p>
                    )
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Variações Negativas
                  </h3>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((_, index) => (
                        <Skeleton key={index} className="w-full h-12" />
                      ))}
                    </div>
                  ) : (
                    alertas.negativos.length > 0 ? (
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[180px]">Conta</TableHead>
                              <TableHead className="text-right">Atual</TableHead>
                              <TableHead className="text-right">Anterior</TableHead>
                              <TableHead className="text-right">Variação</TableHead>
                              <TableHead className="text-right">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {alertas.negativos.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {item.nome}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.valor_atual)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.valor_comparacao)}
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                  <div className="flex items-center justify-end gap-1">
                                    <ArrowDown className="w-4 h-4" />
                                    {formatCurrency(Math.abs(item.variacao_valor))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                  {formatPercentage(Math.abs(item.variacao_percentual))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma variação negativa significativa encontrada.</p>
                    )
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Diálogo de detalhes mensais */}
      <Dialog open={detalhesMensaisAberto} onOpenChange={setDetalhesMensaisAberto}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes Mensais: {contaDetalheMensal?.nome_conta}</DialogTitle>
            <DialogDescription>
              Valores mensais utilizados para cálculo da média dos últimos 12 meses
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contaDetalheMensal?.valores_mensais?.map((valor, index) => (
                  <TableRow key={index}>
                    <TableCell>{valor.mes_nome}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(valor.valor)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Média</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(contaDetalheMensal?.media || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <p>Período de análise</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Os valores apresentados correspondem aos 12 meses anteriores a {meses.find(m => m.value === filtros.mes)?.label}/{filtros.ano}, 
            desde {filtros.mes === 1 ? meses.find(m => m.value === 1)?.label : meses.find(m => m.value === filtros.mes)?.label}/{filtros.mes === 1 ? filtros.ano-1 : filtros.ano-1} 
            até {filtros.mes === 1 ? meses.find(m => m.value === 12)?.label : meses.find(m => m.value === (filtros.mes-1))?.label}/{filtros.mes === 1 ? filtros.ano-1 : filtros.ano}.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
