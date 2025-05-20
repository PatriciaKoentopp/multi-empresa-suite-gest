import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { AlertCircle, ArrowDown, ArrowUp, ChevronDown, MinusCircle, Info } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AnaliseVariacao, DetalhesMensaisConta, FiltroAnaliseDre, ValorMensal } from "@/types/financeiro";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import "../../../styles/collapsible.css";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";

// Array de meses
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
  { label: "Dezembro", value: "12" },
];

// Array de anos (últimos 5 anos)
const anos: number[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= anoAtual - 4; a--) anos.push(a);

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
  contas?: ContaContabilAgrupamento[]; // Para agrupamento por contas
}

export default function AnaliseDrePage() {
  const { currentCompany } = useCompany();
  const [filtro, setFiltro] = useState<FiltroAnaliseDre>({
    tipo_comparacao: "mes_anterior",
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    percentual_minimo: 10
  });
  // Estado temporário para os filtros antes de aplicá-los
  const [filtroTemp, setFiltroTemp] = useState<FiltroAnaliseDre>({
    tipo_comparacao: "mes_anterior",
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    percentual_minimo: 10
  });
  
  const [contasExpandidas, setContasExpandidas] = useState<Record<string, boolean>>({});
  const [tabAtiva, setTabAtiva] = useState<string>("todos");
  const [mostrarTodasContas, setMostrarTodasContas] = useState<boolean>(false);
  const [contaSelecionadaDetalhes, setContaSelecionadaDetalhes] = useState<DetalhesMensaisConta | null>(null);

  // Query para buscar dados do DRE para análise
  const { data: dadosAnalise = [], isLoading } = useQuery({
    queryKey: ["dre-analise", currentCompany?.id, filtro],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      try {
        // Determinar períodos para comparação
        let dataAtualInicio: Date, dataAtualFim: Date;
        let dataCompInicio: Date, dataCompFim: Date;
        
        const mesAtual = filtro.mes;
        const anoAtual = filtro.ano;
        
        // Configurar datas atuais (período de análise)
        dataAtualInicio = new Date(anoAtual, mesAtual - 1, 1);
        dataAtualFim = new Date(anoAtual, mesAtual, 0); // Último dia do mês atual
        
        // Configurar datas de comparação com base no tipo selecionado
        if (filtro.tipo_comparacao === "mes_anterior") {
          // Mês anterior
          let mesAnterior = mesAtual - 1;
          let anoAnterior = anoAtual;
          
          if (mesAnterior === 0) {
            mesAnterior = 12;
            anoAnterior = anoAtual - 1;
          }
          
          dataCompInicio = new Date(anoAnterior, mesAnterior - 1, 1);
          dataCompFim = new Date(anoAnterior, mesAnterior, 0);
        } 
        else if (filtro.tipo_comparacao === "ano_anterior") {
          // Mesmo mês do ano anterior
          dataCompInicio = new Date(anoAtual - 1, mesAtual - 1, 1);
          dataCompFim = new Date(anoAtual - 1, mesAtual, 0);
        }
        else if (filtro.tipo_comparacao === "media_12_meses") {
          // Últimos 13 meses (excluindo o mês atual)
          dataCompInicio = new Date(anoAtual - 1, mesAtual - 1, 1);
          dataCompFim = new Date(anoAtual, mesAtual - 1, 0);
        }
        
        // Formatar datas para consulta
        const dataAtualInicioStr = format(dataAtualInicio, 'yyyy-MM-dd');
        const dataAtualFimStr = format(dataAtualFim, 'yyyy-MM-dd');
        const dataCompInicioStr = format(dataCompInicio, 'yyyy-MM-dd');
        const dataCompFimStr = format(dataCompFim, 'yyyy-MM-dd');
        
        console.log("Períodos de análise:", {
          atual: { inicio: dataAtualInicioStr, fim: dataAtualFimStr },
          comparacao: { inicio: dataCompInicioStr, fim: dataCompFimStr },
        });
        
        // Buscar movimentações para o período atual
        const { data: movAtual, error: errorAtual } = await supabase
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
          .gte('data_movimentacao', dataAtualInicioStr)
          .lte('data_movimentacao', dataAtualFimStr);

        if (errorAtual) throw errorAtual;
        
        // Buscar movimentações para o período de comparação
        const { data: movComp, error: errorComp } = await supabase
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
          .gte('data_movimentacao', dataCompInicioStr)
          .lte('data_movimentacao', dataCompFimStr);

        if (errorComp) throw errorComp;
        
        // Processar dados atuais
        const dadosAtuais = processarMovimentacoesDRE(movAtual || []);
        
        // Processar dados de comparação
        const dadosComparacao = processarMovimentacoesDRE(movComp || []);
        
        // Para média dos últimos 13 meses, buscar também os dados mensais
        let dadosMensais = [];
        if (filtro.tipo_comparacao === "media_12_meses") {
          dadosMensais = await buscarDadosMensais(
            anoAtual - 1, 
            mesAtual, 
            anoAtual, 
            mesAtual - 1,
            currentCompany.id
          );
        }
        
        // Gerar análise comparativa
        return gerarAnaliseComparativa(
          dadosAtuais, 
          dadosComparacao, 
          filtro.tipo_comparacao, 
          filtro.percentual_minimo, 
          dataAtualInicio, 
          dataCompInicio, 
          dataCompFim,
          dadosMensais
        );
      } catch (error) {
        console.error('Erro ao buscar dados para análise:', error);
        toast.error('Erro ao carregar dados para análise do DRE');
        return [];
      }
    }
  });

  // Função para buscar dados mensais para visualização detalhada
  async function buscarDadosMensais(anoInicio: number, mesInicio: number, anoFim: number, mesFim: number, empresaId: string) {
    const dadosMensais = [];
    const dataInicio = new Date(anoInicio, mesInicio - 1, 1);
    const dataFim = new Date(anoFim, mesFim, 0);
    
    const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
    const dataFimStr = format(dataFim, 'yyyy-MM-dd');
    
    // Buscar todas as movimentações do período de 13 meses
    const { data: movimentacoes, error } = await supabase
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
      .eq('empresa_id', empresaId)
      .gte('data_movimentacao', dataInicioStr)
      .lte('data_movimentacao', dataFimStr);
      
    if (error) {
      console.error('Erro ao buscar dados mensais:', error);
      return [];
    }
    
    // Agrupar por conta e mês
    const contas: Record<string, Record<string, number>> = {};
    
    movimentacoes?.forEach(mov => {
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;
      
      const planoContas = mov.plano_contas?.plano_contas;
      if (!planoContas) return;
      
      const contaId = planoContas.id;
      const contaNome = planoContas.descricao;
      const valor = Number(mov.valor);
      
      // Extrair ano e mês da data
      const dataStr = mov.data_movimentacao;
      const ano = parseInt(dataStr.substring(0, 4));
      const mes = parseInt(dataStr.substring(5, 7));
      const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
      
      // Inicializar conta se não existir
      if (!contas[contaNome]) {
        contas[contaNome] = { contaId };
      }
      
      // Adicionar valor ao mês
      if (!contas[contaNome][chave]) {
        contas[contaNome][chave] = 0;
      }
      
      contas[contaNome][chave] += valor;
    });
    
    // Converter para o formato de detalhes mensais
    Object.entries(contas).forEach(([nomeConta, dados]) => {
      const valoresMensais: ValorMensal[] = [];
      const contaId = dados.contaId as string;
      let somaTotal = 0;
      let contMeses = 0;
      
      // Inicializar valores para todos os 13 meses
      for (let m = 0; m < 13; m++) {
        // Calcular ano e mês corretos
        let anoMes = anoInicio;
        let mesMes = mesInicio + m;
        
        // Ajustar para virada de ano
        if (mesMes > 12) {
          mesMes -= 12;
          anoMes += 1;
        }
        
        const chave = `${anoMes}-${mesMes.toString().padStart(2, '0')}`;
        const valor = dados[chave] || 0;
        
        // Adicionar à lista de valores mensais
        valoresMensais.push({
          mes: mesMes,
          ano: anoMes,
          mes_nome: meses.find(m => parseInt(m.value) === mesMes)?.label || "",
          valor: valor
        });
        
        // Somar para média
        somaTotal += valor;
        contMeses++;
      }
      
      // Calcular média
      const media = contMeses > 0 ? somaTotal / contMeses : 0;
      
      // Adicionar aos detalhes mensais
      dadosMensais.push({
        nome_conta: nomeConta,
        contaId,
        valores_mensais: valoresMensais,
        media
      });
    });
    
    return dadosMensais;
  }

  // Função para obter os detalhes mensais de uma conta específica
  const obterDetalhesMensaisConta = (nomeConta: string) => {
    // Verificar se estamos usando o modo de média dos últimos 13 meses
    if (filtro.tipo_comparacao !== "media_12_meses") {
      toast.warning("Os detalhes mensais só estão disponíveis no modo de comparação com a média dos 13 meses");
      return;
    }
    
    // Buscar os detalhes da conta
    buscarDadosConta(nomeConta)
      .then((detalhes) => {
        if (detalhes) {
          setContaSelecionadaDetalhes(detalhes);
        } else {
          toast.error("Não foi possível encontrar os dados mensais da conta");
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar detalhes da conta:", error);
        toast.error("Erro ao buscar detalhes mensais da conta");
      });
  };
  
  // Função para buscar dados de uma conta específica
  const buscarDadosConta = async (nomeConta: string): Promise<DetalhesMensaisConta | null> => {
    if (!currentCompany?.id) return null;

    try {
      // Determinar o período para busca (últimos 13 meses)
      const mesAtual = filtro.mes;
      const anoAtual = filtro.ano;
      
      const dataCompInicio = new Date(anoAtual - 1, mesAtual, 1);
      const dataCompFim = new Date(anoAtual, mesAtual - 1, 0);
      
      const dataCompInicioStr = format(dataCompInicio, 'yyyy-MM-dd');
      const dataCompFimStr = format(dataCompFim, 'yyyy-MM-dd');
      
      // Buscar todas as movimentações da conta específica
      const { data: movimentacoes, error } = await supabase
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
        .gte('data_movimentacao', dataCompInicioStr)
        .lte('data_movimentacao', dataCompFimStr);
        
      if (error) throw error;
      
      // Filtrar apenas movimentações da conta especificada
      const movConta = movimentacoes?.filter(mov => {
        const planoContas = mov.plano_contas?.plano_contas;
        return planoContas?.descricao === nomeConta;
      }) || [];
      
      // Agrupar por mês
      const valoresPorMes: Record<string, number> = {};
      
      movConta.forEach(mov => {
        const dataStr = mov.data_movimentacao;
        const ano = parseInt(dataStr.substring(0, 4));
        const mes = parseInt(dataStr.substring(5, 7));
        const chave = `${ano}-${mes}`;
        
        if (!valoresPorMes[chave]) {
          valoresPorMes[chave] = 0;
        }
        
        valoresPorMes[chave] += Number(mov.valor);
      });
      
      // Converter para o formato de detalhes mensais
      const valoresMensais: ValorMensal[] = [];
      let somaTotal = 0;
      let contMeses = 0;
      
      // Inicializar valores para todos os 13 meses
      for (let m = 0; m < 13; m++) {
        // Calcular ano e mês corretos
        let anoMes = anoAtual - 1;
        let mesMes = mesAtual + m;
        
        // Ajustar para virada de ano
        if (mesMes > 12) {
          mesMes -= 12;
          anoMes += 1;
        }
        
        const chave = `${anoMes}-${mesMes}`;
        const valor = valoresPorMes[chave] || 0;
        
        // Adicionar à lista de valores mensais
        valoresMensais.push({
          mes: mesMes,
          ano: anoMes,
          mes_nome: meses.find(m => parseInt(m.value) === mesMes)?.label || "",
          valor: valor
        });
        
        // Somar para média
        somaTotal += valor;
        contMeses++;
      }
      
      // Calcular média
      const media = contMeses > 0 ? somaTotal / contMeses : 0;
      
      return {
        nome_conta: nomeConta,
        valores_mensais: valoresMensais,
        media
      };
      
    } catch (error) {
      console.error('Erro ao buscar dados da conta:', error);
      return null;
    }
  };

  // Função para processar movimentações e calcular DRE
  function processarMovimentacoesDRE(movimentacoes: any[]) {
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
    
    // Estrutura para agrupar por conta contábil
    const contasAgrupamento: { [key: string]: { [contaId: string]: MovimentacaoDetalhe[] } } = {
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
      // Verificar se é para considerar no DRE
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;
      
      const valor = Number(mov.valor);
      const tipoOperacao = mov.movimentacoes?.tipo_operacao;
      const planoContas = mov.plano_contas?.plano_contas;
      const descricaoCategoria = planoContas?.descricao || 'Sem categoria';
      const contaId = planoContas?.id || 'sem_conta';

      // Formatar a data sem timezone
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

      // Classificação baseada no campo classificacao_dre ou inferência
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
          
          // Agrupamento por conta contábil
          if (!contasAgrupamento[grupoDestino][contaId]) {
            contasAgrupamento[grupoDestino][contaId] = [];
          }
          contasAgrupamento[grupoDestino][contaId].push(detalhe);
        }
      } else {
        // Classificação por inferência
        if (tipoOperacao === 'receber' && (!mov.movimentacoes?.categoria_id || !planoContas)) {
          receitaBruta += valor;
          grupoDestino = "Receita Bruta";
          
          if (!contasAgrupamento["Receita Bruta"][contaId]) {
            contasAgrupamento["Receita Bruta"][contaId] = [];
          }
          contasAgrupamento["Receita Bruta"][contaId].push(detalhe);
          grupos["Receita Bruta"].push(detalhe);
        } 
        else if (planoContas) {
          const { tipo, descricao } = planoContas;
          let grupoDestino = "";
          
          // Receitas
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
          // Despesas
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
            
            if (!contasAgrupamento[grupoDestino][contaId]) {
              contasAgrupamento[grupoDestino][contaId] = [];
            }
            contasAgrupamento[grupoDestino][contaId].push(detalhe);
          }
        }
      }
    });

    // Converter o agrupamento de contas para o formato estruturado
    const converterAgrupamentoContas = (grupoNome: string) => {
      const contas: ContaContabilAgrupamento[] = [];
      const contasObj = contasAgrupamento[grupoNome];
      
      Object.keys(contasObj).forEach(contaId => {
        const detalhes = contasObj[contaId];
        const valorTotal = detalhes.reduce((sum, d) => sum + d.valor, 0);
        
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

    // Calcular os totais do DRE
    const receitaLiquida = receitaBruta + deducoes; 
    const lucroBruto = receitaLiquida + custos; 
    const resultadoOperacional = lucroBruto + despesasOperacionais; 
    const resultadoFinanceiro = resultadoOperacional + receitasFinanceiras + despesasFinanceiras; 
    const resultadoAntesIR = resultadoFinanceiro;
    const lucroLiquido = resultadoAntesIR + impostos; 
    const resultadoExercicio = lucroLiquido + distribuicaoLucros;

    return [
      { tipo: "Receita Bruta", valor: receitaBruta, detalhes: grupos["Receita Bruta"], contas: converterAgrupamentoContas("Receita Bruta") },
      { tipo: "(-) Deduções", valor: deducoes, detalhes: grupos["Deduções"], contas: converterAgrupamentoContas("Deduções") },
      { tipo: "Receita Líquida", valor: receitaLiquida, detalhes: [] },
      { tipo: "(-) Custos", valor: custos, detalhes: grupos["Custos"], contas: converterAgrupamentoContas("Custos") },
      { tipo: "Lucro Bruto", valor: lucroBruto, detalhes: [] },
      { tipo: "(-) Despesas Operacionais", valor: despesasOperacionais, detalhes: grupos["Despesas Operacionais"], contas: converterAgrupamentoContas("Despesas Operacionais") },
      { tipo: "Resultado Operacional", valor: resultadoOperacional, detalhes: [] },
      { tipo: "(+) Receitas Financeiras", valor: receitasFinanceiras, detalhes: grupos["Receitas Financeiras"], contas: converterAgrupamentoContas("Receitas Financeiras") },
      { tipo: "(-) Despesas Financeiras", valor: despesasFinanceiras, detalhes: grupos["Despesas Financeiras"], contas: converterAgrupamentoContas("Despesas Financeiras") },
      { tipo: "Resultado Antes IR", valor: resultadoAntesIR, detalhes: [] },
      { tipo: "(-) IRPJ/CSLL", valor: impostos, detalhes: grupos["IRPJ/CSLL"], contas: converterAgrupamentoContas("IRPJ/CSLL") },
      { tipo: "Lucro Líquido do Exercício", valor: lucroLiquido, detalhes: [] },
      { tipo: "(-) Distribuição de Lucros", valor: distribuicaoLucros, detalhes: grupos["Distribuição de Lucros"], contas: converterAgrupamentoContas("Distribuição de Lucros") },
      { tipo: "Resultado do Exercício", valor: resultadoExercicio, detalhes: [] }
    ];
  }

  // Função para gerar análise comparativa
  function gerarAnaliseComparativa(
    dadosAtuais: GrupoMovimentacao[],
    dadosComparacao: GrupoMovimentacao[],
    tipoComparacao: string,
    percentualMinimo: number,
    dataAtual: Date,
    dataCompInicio: Date, 
    dataCompFim: Date,
    dadosMensais: any[] = []
  ): AnaliseVariacao[] {
    const analise: AnaliseVariacao[] = [];
    const subcontasVariacao: AnaliseVariacao[] = [];
    
    // Calcular número de meses para média
    let numMesesAtual = 1; // Por padrão é 1 mês
    let numMesesComparacao = 1;
    
    if (tipoComparacao === "media_12_meses") {
      // Para últimos 13 meses, calcular número de meses exatos
      const mesesDif = (dataCompFim.getFullYear() - dataCompInicio.getFullYear()) * 12 + 
                      (dataCompFim.getMonth() - dataCompInicio.getMonth()) + 1;
      numMesesComparacao = Math.max(1, mesesDif);
    }
    
    // Percorrer grupos principais do DRE
    dadosAtuais.forEach((grupoAtual) => {
      // Encontrar grupo correspondente nos dados de comparação
      const grupoComp = dadosComparacao.find(g => g.tipo === grupoAtual.tipo);
      
      // Se não tiver contas, é um total calculado
      if (!grupoAtual.contas || grupoAtual.contas.length === 0) {
        return; // Pular totais calculados na análise por subcontas
      }
      
      // Identificar se é uma conta de despesa ou dedução (contas negativas)
      const tiposDespesas = ['(-) Deduções', '(-) Custos', '(-) Despesas Operacionais', 
                            '(-) Despesas Financeiras', '(-) IRPJ/CSLL', '(-) Distribuição de Lucros'];
      const ehContaDespesa = tiposDespesas.includes(grupoAtual.tipo);
      
      // Calcular valor médio mensal
      const valorAtualMedio = grupoAtual.valor / numMesesAtual;
      const valorCompMedio = grupoComp ? (grupoComp.valor / numMesesComparacao) : 0;
      
      // Se ambos os valores forem 0, não incluir na análise 
      if (valorAtualMedio === 0 && valorCompMedio === 0) return;
      
      const variacaoValor = valorAtualMedio - valorCompMedio;
      let variacaoPercentual = 0;
      
      // CORREÇÃO: Calcular variação percentual sem usar Math.abs no denominador
      if (valorCompMedio !== 0) {
        variacaoPercentual = (variacaoValor / valorCompMedio) * 100;
      } else if (valorAtualMedio !== 0) {
        // Se o valor de comparação for zero, mas o atual não for
        variacaoPercentual = 100; // 100% de aumento
      }
      
      // Avaliação da variação
      let avaliacao: 'positiva' | 'negativa' | 'estavel' | 'atencao' = 'estavel';
      
      if (Math.abs(variacaoPercentual) < percentualMinimo) {
        avaliacao = 'estavel';
      } else {
        if (ehContaDespesa) {
          // Para despesas, redução é positiva (menor gasto)
          avaliacao = variacaoPercentual < 0 ? 'positiva' : 'negativa';
        } else {
          // Para receitas, aumento é positivo (maior entrada)
          avaliacao = variacaoPercentual > 0 ? 'positiva' : 'negativa';
        }
      }
      
      // Adicionar variações das subcontas
      const subcontas: AnaliseVariacao[] = [];
      
      // Para cada subconta, fazer análise similar
      if (grupoAtual.contas) {
        grupoAtual.contas.forEach(contaAtual => {
          // Procurar subconta correspondente no período de comparação
          let contaComp = null;
          if (grupoComp && grupoComp.contas) {
            contaComp = grupoComp.contas.find(c => c.conta_id === contaAtual.conta_id);
          }
          
          // Calcular valores médios para subcontas
          const valorSubcontaAtual = contaAtual.valor / numMesesAtual; 
          const valorSubcontaComp = contaComp ? (contaComp.valor / numMesesComparacao) : 0;
          
          // Se ambos os valores forem 0, não incluir na análise de subcontas
          if (valorSubcontaAtual === 0 && valorSubcontaComp === 0) return;
          
          const variacaoSubcontaValor = valorSubcontaAtual - valorSubcontaComp;
          let variacaoSubcontaPercentual = 0;
          
          // CORREÇÃO: Calcular variação percentual da subconta sem usar Math.abs no denominador
          if (valorSubcontaComp !== 0) {
            variacaoSubcontaPercentual = (variacaoSubcontaValor / valorSubcontaComp) * 100;
          } else if (valorSubcontaAtual !== 0) {
            variacaoSubcontaPercentual = 100;
          }
          
          // Avaliação da variação da subconta
          let avaliacaoSubconta: 'positiva' | 'negativa' | 'estavel' | 'atencao' = 'estavel';
          
          // Avaliação inicial baseada no percentual mínimo
          if (Math.abs(variacaoSubcontaPercentual) < percentualMinimo) {
            avaliacaoSubconta = 'estavel';
          } else {
            // Aplicar a mesma lógica usada para o grupo principal
            if (ehContaDespesa) {
              // Para subcontas de despesas, redução é positiva (valor negativo da variação)
              avaliacaoSubconta = variacaoSubcontaPercentual < 0 ? 'positiva' : 'negativa';
            } else {
              // Para subcontas de receitas, aumento é positivo (valor positivo da variação)
              avaliacaoSubconta = variacaoSubcontaPercentual > 0 ? 'positiva' : 'negativa';
            }
            
            // Marcar como atenção se a variação for muito alta
            if (Math.abs(variacaoSubcontaPercentual) > percentualMinimo * 3) {
              avaliacaoSubconta = 'atencao';
            }
          }

          // Se ultrapassar o percentual mínimo, adicionar à lista de variações significativas
          if (Math.abs(variacaoSubcontaPercentual) >= percentualMinimo) {
            const variacaoSubconta = {
              nome: contaAtual.descricao,
              valor_atual: valorSubcontaAtual,
              valor_comparacao: valorSubcontaComp,
              variacao_valor: variacaoSubcontaValor,
              variacao_percentual: variacaoSubcontaPercentual,
              tipo_conta: ehContaDespesa ? 'despesa' : 'receita', // Adicionado tipo_conta correto
              grupo_pai: grupoAtual.tipo,
              avaliacao: avaliacaoSubconta,
              nivel: 'subconta' as 'subconta' | 'principal'
            };
            
            subcontasVariacao.push(variacaoSubconta);
          }
          
          // Adicionar subconta ao grupo mesmo se não tiver variação significativa
          subcontas.push({
            nome: contaAtual.descricao,
            valor_atual: valorSubcontaAtual,
            valor_comparacao: valorSubcontaComp,
            variacao_valor: variacaoSubcontaValor,
            variacao_percentual: variacaoSubcontaPercentual,
            tipo_conta: ehContaDespesa ? 'despesa' : 'receita', // Adicionado tipo_conta correto
            avaliacao: avaliacaoSubconta,
            nivel: 'subconta'
          });
        });
      }
      
      // Adicionar grupo principal com suas subcontas
      analise.push({
        nome: grupoAtual.tipo,
        valor_atual: valorAtualMedio,
        valor_comparacao: valorCompMedio,
        variacao_valor: variacaoValor,
        variacao_percentual: variacaoPercentual,
        tipo_conta: ehContaDespesa ? 'despesa' : 'receita', // Adicionado tipo_conta correto
        subcontas: subcontas,
        avaliacao,
        nivel: 'principal'
      });
    });
    
    // Se estamos no modo de mostrar todas as contas, retornar a análise completa
    // Caso contrário, retornar apenas as subcontas com variação significativa
    return mostrarTodasContas ? analise : subcontasVariacao;
  }
  
  // Função para formatar moeda
  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  }
  
  // Função para formatar percentual
  function formatPercentual(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + "%";
  }
  
  // Retorna o ícone e a cor com base na avaliação
  function getAvaliacaoIcone(avaliacao: string) {
    switch (avaliacao) {
      case 'positiva':
        return { icon: <ArrowUp className="h-4 w-4 text-green-500" />, cor: 'text-green-500' };
      case 'negativa':
        return { icon: <ArrowDown className="h-4 w-4 text-red-500" />, cor: 'text-red-500' };
      case 'atencao':
        return { icon: <AlertCircle className="h-4 w-4 text-amber-500" />, cor: 'text-amber-500' };
      default:
        return { icon: <MinusCircle className="h-4 w-4 text-gray-500" />, cor: 'text-gray-500' };
    }
  }
  
  // Determinar descrição do período de comparação
  function getDescricaoComparacao() {
    const mesNome = meses.find(m => parseInt(m.value) === filtro.mes)?.label || "";
    
    switch (filtro.tipo_comparacao) {
      case 'mes_anterior':
        const mesAnteriorNum = filtro.mes - 1 === 0 ? 12 : filtro.mes - 1;
        const mesAnteriorNome = meses.find(m => parseInt(m.value) === mesAnteriorNum)?.label || "";
        const anoAnterior = filtro.mes === 1 ? filtro.ano - 1 : filtro.ano;
        return `${mesNome}/${filtro.ano} vs ${mesAnteriorNome}/${anoAnterior}`;
        
      case 'ano_anterior':
        return `${mesNome}/${filtro.ano} vs ${mesNome}/${filtro.ano - 1}`;
        
      case 'media_12_meses':
        return `${mesNome}/${filtro.ano} vs Média dos 13 meses anteriores`;
        
      default:
        return "Comparação de períodos";
    }
  }
  
  // Função para alternar exibição de subconta
  function toggleContaExpansao(tipo: string) {
    setContasExpandidas(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }));
  }
  
  // Filtrar dados por avaliação para tabs
  const getAnaliseFiltrada = (tipo: string) => {
    if (!dadosAnalise || dadosAnalise.length === 0) return [];
    
    if (tipo === 'todos') return dadosAnalise;
    if (tipo === 'positivas') return dadosAnalise.filter(item => item.avaliacao === 'positiva');
    if (tipo === 'negativas') return dadosAnalise.filter(item => item.avaliacao === 'negativa');
    if (tipo === 'atencao') return dadosAnalise.filter(item => 
      item.avaliacao === 'atencao' || 
      (item.subcontas && item.subcontas.some(s => s.avaliacao === 'atencao'))
    );
    return dadosAnalise;
  };
  
  // Função para atualizar valor do filtro temporário
  const updateFiltroTemp = (campo: keyof FiltroAnaliseDre, valor: any) => {
    setFiltroTemp(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  // Função para aplicar os filtros temporários
  const aplicarFiltros = () => {
    setFiltro(filtroTemp);
    toast.success("Filtros aplicados com sucesso!");
  };
  
  // Função para resetar filtros (atualiza ambos os estados)
  const resetarFiltros = () => {
    const filtrosPadrao = {
      tipo_comparacao: "mes_anterior",
      ano: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      percentual_minimo: 10
    };
    setFiltro(filtrosPadrao);
    setFiltroTemp(filtrosPadrao);
    setMostrarTodasContas(false);
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Análise do DRE</CardTitle>
          <CardDescription>
            Análise comparativa das contas do DRE, destacando variações significativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-5 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo de Comparação</label>
              <Select
                value={filtroTemp.tipo_comparacao}
                onValueChange={(val) => updateFiltroTemp('tipo_comparacao', val)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_anterior">Mês Atual vs Mês Anterior</SelectItem>
                  <SelectItem value="ano_anterior">Mês Atual vs Mesmo Mês do Ano Anterior</SelectItem>
                  <SelectItem value="media_12_meses">Mês Atual vs Média dos Últimos 13 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Ano</label>
              <Select
                value={filtroTemp.ano.toString()}
                onValueChange={(val) => updateFiltroTemp('ano', parseInt(val))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem value={a.toString()} key={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Mês</label>
              <Select
                value={filtroTemp.mes.toString().padStart(2, '0')}
                onValueChange={(val) => updateFiltroTemp('mes', parseInt(val))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(m => (
                    <SelectItem value={m.value} key={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">% Mínimo para Alerta</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={filtroTemp.percentual_minimo} 
                  min={1}
                  max={100}
                  className="bg-white"
                  onChange={(e) => updateFiltroTemp('percentual_minimo', Number(e.target.value))}
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Visualização</label>
              <Select
                value={mostrarTodasContas ? "todas" : "significativas"}
                onValueChange={(val) => setMostrarTodasContas(val === "todas")}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="significativas">Apenas Variações Significativas</SelectItem>
                  <SelectItem value="todas">Todas as Contas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Botões de Ação para os Filtros */}
          <div className="flex justify-end mb-6 gap-2">
            <Button variant="outline" onClick={resetarFiltros}>
              Resetar Filtros
            </Button>
            <Button onClick={aplicarFiltros}>
              Aplicar Filtros
            </Button>
          </div>

          {/* Estado de carregamento */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Carregando dados para análise...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo da comparação */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-medium">
                  {getDescricaoComparacao()}
                </h3>
                
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <span>Positiva</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                    <span>Negativa</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>Atenção</span>
                  </div>
                </div>
              </div>

              {/* Tabs de filtro */}
              <Tabs defaultValue="todos" value={tabAtiva} onValueChange={setTabAtiva}>
                <TabsList className="mb-4">
                  <TabsTrigger value="todos">Todas as Variações</TabsTrigger>
                  <TabsTrigger value="positivas">Variações Positivas</TabsTrigger>
                  <TabsTrigger value="negativas">Variações Negativas</TabsTrigger>
                  <TabsTrigger value="atencao">Atenção</TabsTrigger>
                </TabsList>
                
                <TabsContent value={tabAtiva}>
                  {getAnaliseFiltrada(tabAtiva).length > 0 ? (
                    mostrarTodasContas ? (
                      // Visualização original por grupos principais
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">Conta</TableHead>
                            <TableHead className="text-right">Valor Atual (Média)</TableHead>
                            <TableHead className="text-right">Valor Anterior (Média)</TableHead>
                            <TableHead className="text-right">Variação</TableHead>
                            <TableHead className="text-right w-[10%]">%</TableHead>
                            <TableHead className="text-right">Avaliação</TableHead>
                            {filtro.tipo_comparacao === "media_12_meses" && <TableHead className="text-center">Detalhes Mensais</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getAnaliseFiltrada(tabAtiva).map((conta, index) => {
                            const { icon, cor } = getAvaliacaoIcone(conta.avaliacao);
                            const estaExpandida = contasExpandidas[conta.nome] || false;
                            const temSubcontas = conta.subcontas && conta.subcontas.length > 0;

                            return (
                              <React.Fragment key={`${conta.nome}-${index}`}>
                                {/* Linha da conta principal */}
                                <TableRow 
                                  className={`hover:bg-gray-50 ${estaExpandida ? "bg-gray-50" : ""}`}
                                  onClick={() => temSubcontas && toggleContaExpansao(conta.nome)}
                                >
                                  <TableCell className="font-medium">
                                    <div className="flex items-center">
                                      {temSubcontas && (
                                        <ChevronDown 
                                          className={`h-5 w-5 mr-2 shrink-0 transition-transform duration-200 ${estaExpandida ? 'rotate-180' : ''} text-gray-500`} 
                                        />
                                      )}
                                      {conta.nome}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(conta.valor_atual)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(conta.valor_comparacao)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(conta.variacao_valor)}</TableCell>
                                  <TableCell className={`text-right ${cor}`}>
                                    {formatPercentual(conta.variacao_percentual)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {icon}
                                      <span className={cor}>{conta.avaliacao.charAt(0).toUpperCase() + conta.avaliacao.slice(1)}</span>
                                    </div>
                                  </TableCell>
                                  {filtro.tipo_comparacao === "media_12_meses" && (
                                    <TableCell className="text-center">
                                      <Button 
                                        variant="ghost" 
                                        className="p-2 h-auto" 
                                        onClick={(e) => { 
                                          e.stopPropagation();
                                          // Usar o nome da conta principal para mostrar detalhes mensais não é necessário
                                        }}
                                        disabled={true}
                                      >
                                        <Info className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                                
                                {/* Linhas das subcontas, quando expandidas */}
                                {estaExpandida && conta.subcontas && conta.subcontas.map((subconta, subIndex) => {
                                  const { icon: subIcon, cor: subCor } = getAvaliacaoIcone(subconta.avaliacao);
                                  
                                  return (
                                    <TableRow key={`${conta.nome}-sub-${subIndex}`} className="bg-gray-50/50">
                                      <TableCell className="pl-10">
                                        {subconta.nome}
                                      </TableCell>
                                      <TableCell className="text-right">{formatCurrency(subconta.valor_atual)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(subconta.valor_comparacao)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(subconta.variacao_valor)}</TableCell>
                                      <TableCell className={`text-right ${subCor}`}>{formatPercentual(subconta.variacao_percentual)}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {subIcon}
                                          <span className={subCor}>{subconta.avaliacao.charAt(0).toUpperCase() + subconta.avaliacao.slice(1)}</span>
                                        </div>
                                      </TableCell>
                                      {filtro.tipo_comparacao === "media_12_meses" && (
                                        <TableCell className="text-center">
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                className="p-2 h-auto" 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  obterDetalhesMensaisConta(subconta.nome);
                                                }}
                                              >
                                                <Info className="h-4 w-4" />
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl">
                                              <DialogHeader>
                                                <DialogTitle>
                                                  Valores Mensais - {subconta.nome}
                                                </DialogTitle>
                                                <DialogDescription>
                                                  Detalhamento mensal dos valores da conta para o período de 13 meses
                                                </DialogDescription>
                                              </DialogHeader>
                                              
                                              {contaSelecionadaDetalhes?.nome_conta === subconta.nome ? (
                                                <div className="space-y-4">
                                                  <Card className="overflow-hidden">
                                                    <CardContent className="p-0">
                                                      <Table>
                                                        <TableHeader>
                                                          <TableRow>
                                                            <TableHead>Mês/Ano</TableHead>
                                                            <TableHead className="text-right">Valor</TableHead>
                                                          </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                          {contaSelecionadaDetalhes.valores_mensais.map((valor, idx) => (
                                                            <TableRow key={idx}>
                                                              <TableCell>
                                                                {valor.mes_nome}/{valor.ano}
                                                              </TableCell>
                                                              <TableCell className="text-right">
                                                                {formatCurrency(valor.valor)}
                                                              </TableCell>
                                                            </TableRow>
                                                          ))}
                                                          <TableRow className="bg-muted/50">
                                                            <TableCell className="font-medium">Média</TableCell>
                                                            <TableCell className="text-right font-medium">
                                                              {formatCurrency(contaSelecionadaDetalhes.media)}
                                                            </TableCell>
                                                          </TableRow>
                                                        </TableBody>
                                                      </Table>
                                                    </CardContent>
                                                  </Card>
                                                  
                                                  <Alert>
                                                    <AlertTitle className="flex items-center gap-2">
                                                      <Info className="h-4 w-4" />
                                                      Período de análise
                                                    </AlertTitle>
                                                    <AlertDescription>
                                                      Os valores apresentados correspondem aos 13 meses anteriores a {filtro.mes}/{filtro.ano}, 
                                                      desde {meses.find(m => m.value === filtro.mes.toString().padStart(2, '0'))?.label}/{filtro.ano - 1} até {meses.find(m => {
                                                        const mesFim = filtro.mes - 1 === 0 ? 12 : filtro.mes - 1;
                                                        return m.value === mesFim.toString().padStart(2, '0');
                                                      })?.label}/{filtro.mes - 1 === 0 ? filtro.ano - 1 : filtro.ano}.
                                                    </AlertDescription>
                                                  </Alert>
                                                </div>
                                              ) : (
                                                <div className="flex justify-center items-center py-10">
                                                  <span className="animate-pulse">Carregando dados mensais...</span>
                                                </div>
                                              )}
                                              
                                              <DialogFooter>
                                                <Button variant="outline" onClick={() => setContaSelecionadaDetalhes(null)}>
                                                  Fechar
                                                </Button>
                                              </DialogFooter>
                                            </DialogContent>
                                          </Dialog>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      // Nova visualização focada em subcontas com variações significativas, agrupadas por tipo
                      <div className="space-y-6">
                        {Object.entries(agruparPorGrupo(getAnaliseFiltrada(tabAtiva))).map(([grupoPai, subcontas], groupIndex) => (
                          <Card key={`grupo-${groupIndex}`} className="overflow-hidden">
                            <CardHeader className="py-2 px-4 bg-muted">
                              <CardTitle className="text-sm font-medium">{grupoPai}</CardTitle>
                            </CardHeader>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[40%]">Subconta</TableHead>
                                  <TableHead className="text-right">Valor Atual (Média)</TableHead>
                                  <TableHead className="text-right">Valor Anterior (Média)</TableHead>
                                  <TableHead className="text-right">Variação</TableHead>
                                  <TableHead className="text-right w-[10%]">%</TableHead>
                                  <TableHead className="text-right">Avaliação</TableHead>
                                  {filtro.tipo_comparacao === "media_12_meses" && <TableHead className="text-center">Detalhes Mensais</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subcontas.map((subconta, index) => {
                                  const { icon: subIcon, cor: subCor } = getAvaliacaoIcone(subconta.avaliacao);
                                  
                                  return (
                                    <TableRow key={`${subconta.nome}-${index}`}>
                                      <TableCell>
                                        {subconta.nome}
                                      </TableCell>
                                      <TableCell className="text-right">{formatCurrency(subconta.valor_atual)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(subconta.valor_comparacao)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(subconta.variacao_valor)}</TableCell>
                                      <TableCell className={`text-right ${subCor}`}>{formatPercentual(subconta.variacao_percentual)}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {subIcon}
                                          <span className={subCor}>{subconta.avaliacao.charAt(0).toUpperCase() + subconta.avaliacao.slice(1)}</span>
                                        </div>
                                      </TableCell>
                                      {filtro.tipo_comparacao === "media_12_meses" && (
                                        <TableCell className="text-center">
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                className="p-2 h-auto" 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  obterDetalhesMensaisConta(subconta.nome);
                                                }}
                                              >
                                                <Info className="h-4 w-4" />
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl">
                                              <DialogHeader>
                                                <DialogTitle>
                                                  Valores Mensais - {subconta.nome}
                                                </DialogTitle>
                                                <DialogDescription>
                                                  Detalhamento mensal dos valores da conta para o período de 13 meses
                                                </DialogDescription>
                                              </DialogHeader>
                                              
                                              {contaSelecionadaDetalhes?.nome_conta === subconta.nome ? (
                                                <div className="space-y-4">
                                                  <Card className="overflow-hidden">
                                                    <CardContent className="p-0">
                                                      <Table>
                                                        <TableHeader>
                                                          <TableRow>
                                                            <TableHead>Mês/Ano</TableHead>
                                                            <TableHead className="text-right">Valor</TableHead>
                                                          </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                          {contaSelecionadaDetalhes.valores_mensais.map((valor, idx) => (
                                                            <TableRow key={idx}>
                                                              <TableCell>
                                                                {valor.mes_nome}/{valor.ano}
                                                              </TableCell>
                                                              <TableCell className="text-right">
                                                                {formatCurrency(valor.valor)}
                                                              </TableCell>
                                                            </TableRow>
                                                          ))}
                                                          <TableRow className="bg-muted/50">
                                                            <TableCell className="font-medium">Média</TableCell>
                                                            <TableCell className="text-right font-medium">
                                                              {formatCurrency(contaSelecionadaDetalhes.media)}
                                                            </TableCell>
                                                          </TableRow>
                                                        </TableBody>
                                                      </Table>
                                                    </CardContent>
                                                  </Card>
                                                  
                                                  <Alert>
                                                    <AlertTitle className="flex items-center gap-2">
                                                      <Info className="h-4 w-4" />
                                                      Período de análise
                                                    </AlertTitle>
                                                    <AlertDescription>
                                                      Os valores apresentados correspondem aos 13 meses anteriores a {filtro.mes}/{filtro.ano}, 
                                                      desde {meses.find(m => m.value === filtro.mes.toString().padStart(2, '0'))?.label}/{filtro.ano - 1} até {meses.find(m => {
                                                        const mesFim = filtro.mes - 1 === 0 ? 12 : filtro.mes - 1;
                                                        return m.value === mesFim.toString().padStart(2, '0');
                                                      })?.label}/{filtro.mes - 1 === 0 ? filtro.ano - 1 : filtro.ano}.
                                                    </AlertDescription>
                                                  </Alert>
                                                </div>
                                              ) : (
                                                <div className="flex justify-center items-center py-10">
                                                  <span className="animate-pulse">Carregando dados mensais...</span>
                                                </div>
                                              )}
                                              
                                              <DialogFooter>
                                                <Button variant="outline" onClick={() => setContaSelecionadaDetalhes(null)}>
                                                  Fechar
                                                </Button>
                                              </DialogFooter>
                                            </DialogContent>
                                          </Dialog>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Card>
                        ))}
                      </div>
                    )
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Nenhum resultado encontrado</AlertTitle>
                      <AlertDescription>
                        Não há contas com variações significativas que atendam aos critérios selecionados.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
              
              {/* Legenda e ações - removido botão resetar filtros daqui */}
              <div className="flex flex-col md:flex-row gap-3 justify-between">
                <div className="text-sm text-muted-foreground">
                  * As variações são calculadas usando a média mensal dos valores em cada período para garantir comparabilidade.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
