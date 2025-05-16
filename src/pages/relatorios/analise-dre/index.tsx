
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { AnaliseVariacao, DetalhesMensaisConta, FiltroAnaliseDre, ValorMensal } from "@/types/financeiro";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { AnaliseVariacaoRow } from "@/components/contabil/AnaliseVariacaoRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Por padrão, o módulo date-fns já faz o uso do locale correto, mas podemos garantir que estamos usando pt-BR
const localePtBR = ptBR;

export default function AnaliseDrePage() {
  const { currentCompany } = useCompany();
  const [filtro, setFiltro] = useState<FiltroAnaliseDre>({
    tipo_comparacao: 'mes_anterior',
    mes: new Date().getMonth(),
    ano: new Date().getFullYear(),
    percentual_minimo: 10
  });

  const [periodoAtualLabel, setPeriodoAtualLabel] = useState<string>("");
  const [periodoCompLabel, setPeriodoCompLabel] = useState<string>("");
  const [periodoInicio, setPeriodoInicio] = useState<string>("");
  const [periodoFim, setPeriodoFim] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);

  // Query para buscar dados do DRE para análise
  const { data: dadosAnalise = [], isLoading } = useQuery({
    queryKey: ["dre-analise", currentCompany?.id, filtro],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      // Definimos os períodos com base no tipo de comparação
      const periodoAtual = new Date(filtro.ano, filtro.mes, 1);
      let dataAtualInicio: Date;
      let dataAtualFim: Date;
      let dataCompInicio: Date;
      let dataCompFim: Date;
      
      const mesAtual = filtro.mes;
      const anoAtual = filtro.ano;

      // Configurar o período atual (mês escolhido no filtro)
      dataAtualInicio = new Date(anoAtual, mesAtual, 1);
      // Último dia do mês
      dataAtualFim = new Date(anoAtual, mesAtual + 1, 0); 

      if (filtro.tipo_comparacao === "mes_anterior") {
        // Mês anterior
        const mesAnterior = mesAtual - 1 < 0 ? 11 : mesAtual - 1;
        const anoAnterior = mesAtual - 1 < 0 ? anoAtual - 1 : anoAtual;
        
        dataCompInicio = new Date(anoAnterior, mesAnterior, 1);
        dataCompFim = new Date(anoAnterior, mesAnterior + 1, 0);
        
        setPeriodoAtualLabel(`${format(dataAtualInicio, 'MMMM/yyyy', { locale: localePtBR })}`);
        setPeriodoCompLabel(`${format(dataCompInicio, 'MMMM/yyyy', { locale: localePtBR })}`);
        setPeriodoInicio("");
        setPeriodoFim("");
      }
      else if (filtro.tipo_comparacao === "ano_anterior") {
        // Mesmo mês do ano anterior
        dataCompInicio = new Date(anoAtual - 1, mesAtual, 1);
        dataCompFim = new Date(anoAtual - 1, mesAtual + 1, 0);
        
        setPeriodoAtualLabel(`${format(dataAtualInicio, 'MMMM/yyyy', { locale: localePtBR })}`);
        setPeriodoCompLabel(`${format(dataCompInicio, 'MMMM/yyyy', { locale: localePtBR })}`);
        setPeriodoInicio("");
        setPeriodoFim("");
      }
      else if (filtro.tipo_comparacao === "media_12_meses") {
        // Últimos 12 meses (excluindo o mês atual)
        // A data de início é exatamente o mesmo mês do ano anterior
        // A data de fim é o último dia do mês anterior
        dataCompInicio = new Date(anoAtual - 1, mesAtual, 1);
        dataCompFim = new Date(anoAtual, mesAtual, 0); // Último dia do mês anterior
        
        setPeriodoAtualLabel(`${format(dataAtualInicio, 'MMMM/yyyy', { locale: localePtBR })}`);
        setPeriodoCompLabel(`Média 12 meses anteriores`);
        setPeriodoInicio(format(dataCompInicio, 'MMMM/yyyy', { locale: localePtBR }));
        setPeriodoFim(format(dataCompFim, 'MMMM/yyyy', { locale: localePtBR }));
      }

      try {
        // Formatamos para YYYY-MM-DD para evitar problemas de fuso horário
        const dataAtualInicioStr = format(dataAtualInicio, 'yyyy-MM-dd');
        const dataAtualFimStr = format(dataAtualFim, 'yyyy-MM-dd');
        const dataCompInicioStr = format(dataCompInicio, 'yyyy-MM-dd');
        const dataCompFimStr = format(dataCompFim, 'yyyy-MM-dd');
        
        // Buscamos as movimentações para o período ATUAL
        const { data: movsAtual, error: errorAtual } = await supabase
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

        // Buscamos as movimentações para o período de COMPARAÇÃO
        const { data: movsComp, error: errorComp } = await supabase
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

        // Se for média de 12 meses, precisamos buscar os dados mensais para cada conta
        let detalhes_mensais = null;
        
        if (filtro.tipo_comparacao === "media_12_meses") {
          // Separamos os dados por mês para análise detalhada
          detalhes_mensais = extrairDetalhesMensaisPorConta(movsComp);
        }

        // Processa e compara os dados
        const analiseResult = analisarVariacao(movsAtual, movsComp, detalhes_mensais);
        
        // Se não quisermos filtrar por percentual mínimo, retornamos todos os dados
        if (showAll || filtro.percentual_minimo <= 0) {
          return analiseResult;
        }
        
        // Filtra para mostrar apenas as variações acima do percentual mínimo
        return filtrarPorPercentualMinimo(analiseResult, filtro.percentual_minimo);
      } catch (error) {
        console.error('Erro ao buscar dados para análise:', error);
        toast.error('Erro ao carregar dados para análise');
        return [];
      }
    },
    enabled: !!currentCompany?.id
  });

  // Função para extrair detalhes mensais organizados por conta contábil
  function extrairDetalhesMensaisPorConta(movimentacoes: any[]) {
    // Vamos agrupar as movimentações por conta e por mês
    const contasPorMes: Record<string, Record<string, ValorMensal[]>> = {};
    
    movimentacoes.forEach(mov => {
      // Verifica se devemos considerar no DRE
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;
      
      const planoContas = mov.plano_contas?.plano_contas;
      if (!planoContas) return;
      
      const classificacaoDre = planoContas.classificacao_dre;
      if (!classificacaoDre || classificacaoDre === 'nao_classificado') return;
      
      const contaId = planoContas.id;
      const contaNome = planoContas.descricao;
      const valor = Number(mov.valor);
      
      // Extrair o mês e ano da data de movimentação (sem ajustes de timezone)
      // A data vem no formato YYYY-MM-DD do banco
      const dataStr = mov.data_movimentacao;
      if (!dataStr) return;
      
      const ano = parseInt(dataStr.substring(0, 4));
      const mes = parseInt(dataStr.substring(5, 7)) - 1; // Mês é 0-indexed em JS
      
      // Criar o nome do mês
      const dataMov = new Date(ano, mes, 1);
      const mesNome = format(dataMov, 'MMMM', { locale: localePtBR });
      
      // Inicializar estruturas se necessário
      if (!contasPorMes[classificacaoDre]) {
        contasPorMes[classificacaoDre] = {};
      }
      
      if (!contasPorMes[classificacaoDre][contaId]) {
        contasPorMes[classificacaoDre][contaId] = [];
      }
      
      // Procurar se já existe um registro para este mês/ano
      let mesExistente = contasPorMes[classificacaoDre][contaId].find(
        m => m.ano === ano && m.mes === mes
      );
      
      if (mesExistente) {
        // Adicionar ao valor existente
        mesExistente.valor += valor;
      } else {
        // Criar novo registro mensal
        contasPorMes[classificacaoDre][contaId].push({
          mes,
          ano,
          mes_nome: mesNome,
          valor
        });
      }
    });
    
    // Converter para o formato final com médias calculadas
    const detalhesFinais: Record<string, Record<string, DetalhesMensaisConta>> = {};
    
    Object.keys(contasPorMes).forEach(classificacao => {
      detalhesFinais[classificacao] = {};
      
      Object.keys(contasPorMes[classificacao]).forEach(contaId => {
        const valoresMensais = contasPorMes[classificacao][contaId];
        
        // Calcular a média considerando apenas os meses com dados
        const totalValor = valoresMensais.reduce((sum, item) => sum + item.valor, 0);
        const mediaValor = valoresMensais.length > 0 ? totalValor / valoresMensais.length : 0;
        
        // Obter o nome da conta do primeiro item (todos terão o mesmo)
        const contaNome = valoresMensais.length > 0 && 
                          movimentacoes.find(m => 
                            m.plano_contas?.plano_contas?.id === contaId
                          )?.plano_contas?.plano_contas?.descricao || "Conta desconhecida";
        
        detalhesFinais[classificacao][contaId] = {
          nome_conta: contaNome,
          valores_mensais: valoresMensais,
          media: mediaValor
        };
      });
    });
    
    return detalhesFinais;
  }

  // Função para analisar variações entre períodos
  function analisarVariacao(movsAtual: any[], movsComp: any[], detalhesContaMensal: any = null) {
    // Processamento dos dados para o período atual e o período de comparação
    const dadosAtual = processarMovimentacoesPorTipoConta(movsAtual);
    const dadosComp = processarMovimentacoesPorTipoConta(movsComp, filtro.tipo_comparacao === 'media_12_meses');
    
    // Lista para armazenar os resultados da análise
    const resultado: AnaliseVariacao[] = [];
    
    // Analisar Receitas
    const receitaBrutaAtual = dadosAtual.receita_bruta || 0;
    const receitaBrutaComp = dadosComp.receita_bruta || 0;
    const variacaoReceitaBruta = receitaBrutaAtual - receitaBrutaComp;
    const percentualReceitaBruta = receitaBrutaComp !== 0 ? (variacaoReceitaBruta / Math.abs(receitaBrutaComp)) * 100 : 100;
    
    resultado.push({
      nome: "Receita Bruta",
      valor_atual: receitaBrutaAtual,
      valor_comparacao: receitaBrutaComp,
      variacao_valor: variacaoReceitaBruta,
      variacao_percentual: percentualReceitaBruta,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualReceitaBruta),
      nivel: 'principal',
      subcontas: processarSubcontas('receita_bruta', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Analisar Deduções
    const deducoesAtual = dadosAtual.deducoes || 0;
    const deducoesComp = dadosComp.deducoes || 0;
    const variacaoDeducoes = deducoesAtual - deducoesComp;
    const percentualDeducoes = deducoesComp !== 0 ? (variacaoDeducoes / Math.abs(deducoesComp)) * 100 : 100;
    
    resultado.push({
      nome: "Deduções",
      valor_atual: deducoesAtual,
      valor_comparacao: deducoesComp,
      variacao_valor: variacaoDeducoes,
      variacao_percentual: percentualDeducoes,
      tipo_conta: 'despesa',
      avaliacao: avaliarVariacao('despesa', percentualDeducoes),
      nivel: 'principal',
      subcontas: processarSubcontas('deducoes', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Receita Líquida (Calculada)
    const receitaLiquidaAtual = receitaBrutaAtual + deducoesAtual; // Deduções já são negativas
    const receitaLiquidaComp = receitaBrutaComp + deducoesComp;
    const variacaoReceitaLiquida = receitaLiquidaAtual - receitaLiquidaComp;
    const percentualReceitaLiquida = receitaLiquidaComp !== 0 ? (variacaoReceitaLiquida / Math.abs(receitaLiquidaComp)) * 100 : 100;
    
    resultado.push({
      nome: "Receita Líquida",
      valor_atual: receitaLiquidaAtual,
      valor_comparacao: receitaLiquidaComp,
      variacao_valor: variacaoReceitaLiquida,
      variacao_percentual: percentualReceitaLiquida,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualReceitaLiquida),
      nivel: 'principal'
    });
    
    // Analisar Custos
    const custosAtual = dadosAtual.custos || 0;
    const custosComp = dadosComp.custos || 0;
    const variacaoCustos = custosAtual - custosComp;
    const percentualCustos = custosComp !== 0 ? (variacaoCustos / Math.abs(custosComp)) * 100 : 100;
    
    resultado.push({
      nome: "Custos",
      valor_atual: custosAtual,
      valor_comparacao: custosComp,
      variacao_valor: variacaoCustos,
      variacao_percentual: percentualCustos,
      tipo_conta: 'despesa',
      avaliacao: avaliarVariacao('despesa', percentualCustos),
      nivel: 'principal',
      subcontas: processarSubcontas('custos', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Lucro Bruto (Calculado)
    const lucroBrutoAtual = receitaLiquidaAtual + custosAtual; // Custos já são negativos
    const lucroBrutoComp = receitaLiquidaComp + custosComp;
    const variacaoLucroBruto = lucroBrutoAtual - lucroBrutoComp;
    const percentualLucroBruto = lucroBrutoComp !== 0 ? (variacaoLucroBruto / Math.abs(lucroBrutoComp)) * 100 : 100;
    
    resultado.push({
      nome: "Lucro Bruto",
      valor_atual: lucroBrutoAtual,
      valor_comparacao: lucroBrutoComp,
      variacao_valor: variacaoLucroBruto,
      variacao_percentual: percentualLucroBruto,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualLucroBruto),
      nivel: 'principal'
    });
    
    // Analisar Despesas Operacionais
    const despesasOperacionaisAtual = dadosAtual.despesas_operacionais || 0;
    const despesasOperacionaisComp = dadosComp.despesas_operacionais || 0;
    const variacaoDespesasOp = despesasOperacionaisAtual - despesasOperacionaisComp;
    const percentualDespesasOp = despesasOperacionaisComp !== 0 ? (variacaoDespesasOp / Math.abs(despesasOperacionaisComp)) * 100 : 100;
    
    resultado.push({
      nome: "Despesas Operacionais",
      valor_atual: despesasOperacionaisAtual,
      valor_comparacao: despesasOperacionaisComp,
      variacao_valor: variacaoDespesasOp,
      variacao_percentual: percentualDespesasOp,
      tipo_conta: 'despesa',
      avaliacao: avaliarVariacao('despesa', percentualDespesasOp),
      nivel: 'principal',
      subcontas: processarSubcontas('despesas_operacionais', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Resultado Operacional (Calculado)
    const resultadoOpAtual = lucroBrutoAtual + despesasOperacionaisAtual; // Despesas já são negativas
    const resultadoOpComp = lucroBrutoComp + despesasOperacionaisComp;
    const variacaoResultadoOp = resultadoOpAtual - resultadoOpComp;
    const percentualResultadoOp = resultadoOpComp !== 0 ? (variacaoResultadoOp / Math.abs(resultadoOpComp)) * 100 : 100;
    
    resultado.push({
      nome: "Resultado Operacional",
      valor_atual: resultadoOpAtual,
      valor_comparacao: resultadoOpComp,
      variacao_valor: variacaoResultadoOp,
      variacao_percentual: percentualResultadoOp,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualResultadoOp),
      nivel: 'principal'
    });
    
    // Analisar Receitas Financeiras
    const receitasFinanceirasAtual = dadosAtual.receitas_financeiras || 0;
    const receitasFinanceirasComp = dadosComp.receitas_financeiras || 0;
    const variacaoReceitasFin = receitasFinanceirasAtual - receitasFinanceirasComp;
    const percentualReceitasFin = receitasFinanceirasComp !== 0 ? (variacaoReceitasFin / Math.abs(receitasFinanceirasComp)) * 100 : 100;
    
    resultado.push({
      nome: "(+) Receitas Financeiras",
      valor_atual: receitasFinanceirasAtual,
      valor_comparacao: receitasFinanceirasComp,
      variacao_valor: variacaoReceitasFin,
      variacao_percentual: percentualReceitasFin,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualReceitasFin),
      nivel: 'principal',
      subcontas: processarSubcontas('receitas_financeiras', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Analisar Despesas Financeiras
    const despesasFinanceirasAtual = dadosAtual.despesas_financeiras || 0;
    const despesasFinanceirasComp = dadosComp.despesas_financeiras || 0;
    const variacaoDespesasFin = despesasFinanceirasAtual - despesasFinanceirasComp;
    const percentualDespesasFin = despesasFinanceirasComp !== 0 ? (variacaoDespesasFin / Math.abs(despesasFinanceirasComp)) * 100 : 100;
    
    resultado.push({
      nome: "(-) Despesas Financeiras",
      valor_atual: despesasFinanceirasAtual,
      valor_comparacao: despesasFinanceirasComp,
      variacao_valor: variacaoDespesasFin,
      variacao_percentual: percentualDespesasFin,
      tipo_conta: 'despesa',
      avaliacao: avaliarVariacao('despesa', percentualDespesasFin),
      nivel: 'principal',
      subcontas: processarSubcontas('despesas_financeiras', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Resultado Antes IR (Calculado)
    const resultadoAntesIRAtual = resultadoOpAtual + receitasFinanceirasAtual + despesasFinanceirasAtual;
    const resultadoAntesIRComp = resultadoOpComp + receitasFinanceirasComp + despesasFinanceirasComp;
    const variacaoResultadoAntesIR = resultadoAntesIRAtual - resultadoAntesIRComp;
    const percentualResultadoAntesIR = resultadoAntesIRComp !== 0 ? (variacaoResultadoAntesIR / Math.abs(resultadoAntesIRComp)) * 100 : 100;
    
    resultado.push({
      nome: "Resultado Antes IR",
      valor_atual: resultadoAntesIRAtual,
      valor_comparacao: resultadoAntesIRComp,
      variacao_valor: variacaoResultadoAntesIR,
      variacao_percentual: percentualResultadoAntesIR,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualResultadoAntesIR),
      nivel: 'principal'
    });
    
    // Analisar IRPJ/CSLL
    const impostosAtual = dadosAtual.impostos_irpj_csll || 0;
    const impostosComp = dadosComp.impostos_irpj_csll || 0;
    const variacaoImpostos = impostosAtual - impostosComp;
    const percentualImpostos = impostosComp !== 0 ? (variacaoImpostos / Math.abs(impostosComp)) * 100 : 100;
    
    resultado.push({
      nome: "(-) IRPJ/CSLL",
      valor_atual: impostosAtual,
      valor_comparacao: impostosComp,
      variacao_valor: variacaoImpostos,
      variacao_percentual: percentualImpostos,
      tipo_conta: 'despesa',
      avaliacao: avaliarVariacao('despesa', percentualImpostos),
      nivel: 'principal',
      subcontas: processarSubcontas('impostos_irpj_csll', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Lucro Líquido (Calculado)
    const lucroLiquidoAtual = resultadoAntesIRAtual + impostosAtual;
    const lucroLiquidoComp = resultadoAntesIRComp + impostosComp;
    const variacaoLucroLiquido = lucroLiquidoAtual - lucroLiquidoComp;
    const percentualLucroLiquido = lucroLiquidoComp !== 0 ? (variacaoLucroLiquido / Math.abs(lucroLiquidoComp)) * 100 : 100;
    
    resultado.push({
      nome: "Lucro Líquido do Exercício",
      valor_atual: lucroLiquidoAtual,
      valor_comparacao: lucroLiquidoComp,
      variacao_valor: variacaoLucroLiquido,
      variacao_percentual: percentualLucroLiquido,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualLucroLiquido),
      nivel: 'principal'
    });
    
    // Analisar Distribuição de Lucros
    const distribLucrosAtual = dadosAtual.distribuicao_lucros || 0;
    const distribLucrosComp = dadosComp.distribuicao_lucros || 0;
    const variacaoDistribLucros = distribLucrosAtual - distribLucrosComp;
    const percentualDistribLucros = distribLucrosComp !== 0 ? (variacaoDistribLucros / Math.abs(distribLucrosComp)) * 100 : 100;
    
    resultado.push({
      nome: "(-) Distribuição de Lucros",
      valor_atual: distribLucrosAtual,
      valor_comparacao: distribLucrosComp,
      variacao_valor: variacaoDistribLucros,
      variacao_percentual: percentualDistribLucros,
      tipo_conta: 'despesa',
      avaliacao: avaliarVariacao('despesa', percentualDistribLucros),
      nivel: 'principal',
      subcontas: processarSubcontas('distribuicao_lucros', dadosAtual, dadosComp, detalhesContaMensal)
    });
    
    // Resultado do Exercício (Calculado)
    const resultadoExercicioAtual = lucroLiquidoAtual + distribLucrosAtual;
    const resultadoExercicioComp = lucroLiquidoComp + distribLucrosComp;
    const variacaoResultadoExercicio = resultadoExercicioAtual - resultadoExercicioComp;
    const percentualResultadoExercicio = resultadoExercicioComp !== 0 ? (variacaoResultadoExercicio / Math.abs(resultadoExercicioComp)) * 100 : 100;
    
    resultado.push({
      nome: "Resultado do Exercício",
      valor_atual: resultadoExercicioAtual,
      valor_comparacao: resultadoExercicioComp,
      variacao_valor: variacaoResultadoExercicio,
      variacao_percentual: percentualResultadoExercicio,
      tipo_conta: 'receita',
      avaliacao: avaliarVariacao('receita', percentualResultadoExercicio),
      nivel: 'principal'
    });
    
    return resultado;
  }

  // Função para processar subcontas em um determinado tipo de conta
  function processarSubcontas(tipoContaId: string, dadosAtual: any, dadosComp: any, detalhesContaMensal: any = null) {
    if (!dadosAtual.subcontas || !dadosAtual.subcontas[tipoContaId] || 
        !dadosComp.subcontas || !dadosComp.subcontas[tipoContaId]) {
      return undefined;
    }
    
    // Combina as chaves de ambos os períodos para garantir que todas as contas sejam analisadas
    const todasSubContas = new Set<string>();
    Object.keys(dadosAtual.subcontas[tipoContaId] || {}).forEach(k => todasSubContas.add(k));
    Object.keys(dadosComp.subcontas[tipoContaId] || {}).forEach(k => todasSubContas.add(k));
    
    const resultado: AnaliseVariacao[] = [];
    
    todasSubContas.forEach(contaId => {
      const valorAtual = (dadosAtual.subcontas[tipoContaId] && dadosAtual.subcontas[tipoContaId][contaId]) || 0;
      const valorComp = (dadosComp.subcontas[tipoContaId] && dadosComp.subcontas[tipoContaId][contaId]) || 0;
      
      const nomeConta = valorAtual.nome || valorComp.nome || "Conta desconhecida";
      const valorAtualNum = valorAtual.valor || 0;
      const valorCompNum = valorComp.valor || 0;
      
      const variacao = valorAtualNum - valorCompNum;
      const variacao_percentual = valorCompNum !== 0 ? (variacao / Math.abs(valorCompNum)) * 100 : 100;
      
      // Determinar o tipo da conta baseado no tipo de grupo
      const tipoConta = ['receita_bruta', 'receitas_financeiras'].includes(tipoContaId) ? 'receita' : 'despesa';
      
      // Obter detalhes mensais da conta se disponíveis
      let detalheMensal = undefined;
      if (detalhesContaMensal && detalhesContaMensal[tipoContaId] && detalhesContaMensal[tipoContaId][contaId]) {
        detalheMensal = detalhesContaMensal[tipoContaId][contaId];
      }
      
      resultado.push({
        nome: nomeConta,
        valor_atual: valorAtualNum,
        valor_comparacao: valorCompNum,
        variacao_valor: variacao,
        variacao_percentual: variacao_percentual,
        tipo_conta: tipoConta,
        grupo_pai: tipoContaId,
        avaliacao: avaliarVariacao(tipoConta, variacao_percentual),
        nivel: 'subconta',
        detalhes_mensais: detalheMensal
      });
    });
    
    // Ordena as subcontas por valor absoluto da variação (decrescente)
    return resultado.sort((a, b) => Math.abs(b.variacao_valor) - Math.abs(a.variacao_valor));
  }

  // Função para processar movimentações agrupadas por tipo de conta
  function processarMovimentacoesPorTipoConta(movimentacoes: any[], calcularMedia = false) {
    const resultado: any = {
      receita_bruta: 0,
      deducoes: 0,
      custos: 0,
      despesas_operacionais: 0,
      receitas_financeiras: 0,
      despesas_financeiras: 0,
      impostos_irpj_csll: 0,
      distribuicao_lucros: 0,
      subcontas: {
        receita_bruta: {},
        deducoes: {},
        custos: {},
        despesas_operacionais: {},
        receitas_financeiras: {},
        despesas_financeiras: {},
        impostos_irpj_csll: {},
        distribuicao_lucros: {}
      }
    };
    
    // Contador de meses para cálculo de média (quando aplicável)
    const mesesContados: Record<string, Set<string>> = {
      receita_bruta: new Set(),
      deducoes: new Set(),
      custos: new Set(),
      despesas_operacionais: new Set(),
      receitas_financeiras: new Set(),
      despesas_financeiras: new Set(),
      impostos_irpj_csll: new Set(),
      distribuicao_lucros: new Set()
    };
    
    movimentacoes.forEach(mov => {
      // Verifica se devemos considerar no DRE
      const considerarDre = mov.movimentacoes?.considerar_dre !== false;
      if (!considerarDre) return;
      
      const valor = Number(mov.valor);
      const planoContas = mov.plano_contas?.plano_contas;
      
      if (!planoContas) return;
      
      const classificacaoDre = planoContas.classificacao_dre;
      const contaId = planoContas.id;
      const contaNome = planoContas.descricao;
      
      if (!classificacaoDre || classificacaoDre === 'nao_classificado') return;
      
      // Se estamos calculando média, atualizamos o contador de meses
      if (calcularMedia) {
        // A data vem no formato YYYY-MM-DD do banco
        const dataStr = mov.data_movimentacao;
        if (!dataStr) return;
        
        const anoMes = dataStr.substring(0, 7); // formato: YYYY-MM
        mesesContados[classificacaoDre].add(anoMes);
      }
      
      // Acumula o valor no grupo correspondente e nas subcontas
      resultado[classificacaoDre] += valor;
      
      // Inicializa a subconta se necessário
      if (!resultado.subcontas[classificacaoDre][contaId]) {
        resultado.subcontas[classificacaoDre][contaId] = {
          nome: contaNome,
          valor: 0
        };
      }
      
      resultado.subcontas[classificacaoDre][contaId].valor += valor;
    });
    
    // Se estamos calculando médias, dividimos pelo número de meses
    if (calcularMedia) {
      Object.keys(resultado).forEach(key => {
        if (key !== 'subcontas' && mesesContados[key].size > 0) {
          resultado[key] = resultado[key] / mesesContados[key].size;
        }
      });
      
      // Também calculamos médias para as subcontas
      Object.keys(resultado.subcontas).forEach(group => {
        if (mesesContados[group].size > 0) {
          Object.keys(resultado.subcontas[group]).forEach(contaId => {
            resultado.subcontas[group][contaId].valor = 
              resultado.subcontas[group][contaId].valor / mesesContados[group].size;
          });
        }
      });
    }
    
    return resultado;
  }

  // Função para avaliar a variação como positiva, negativa ou estável
  function avaliarVariacao(tipoConta: string, percentual: number) {
    if (Math.abs(percentual) < 5) {
      return 'estavel';
    }
    
    if (tipoConta === 'receita') {
      if (percentual > 0) return 'positiva';
      return 'negativa';
    } else {
      // Para despesas, aumentar despesas é ruim (negativo)
      if (percentual < 0) return 'positiva'; // Diminuição de despesas é positivo
      if (percentual > 15) return 'atencao'; // Aumento acentuado de despesas merece atenção
      return 'negativa'; // Aumento de despesas é negativo
    }
  }

  // Função para filtrar apenas variações significativas
  function filtrarPorPercentualMinimo(analise: AnaliseVariacao[], percentualMinimo: number) {
    return analise.map(item => {
      // Para itens principais, preservamos todos, mas filtramos as subcontas
      if (item.nivel === 'principal') {
        if (item.subcontas) {
          item.subcontas = item.subcontas.filter(
            sub => Math.abs(sub.variacao_percentual) >= percentualMinimo
          );
        }
        return item;
      }
      
      // Para outros níveis (se houver), filtramos com base no percentual
      if (Math.abs(item.variacao_percentual) >= percentualMinimo) {
        return item;
      }
      
      return null;
    }).filter(item => item !== null) as AnaliseVariacao[];
  }

  // Atualização da lista de meses com os nomes em português
  const meses = [
    { label: "Janeiro", value: "0" },
    { label: "Fevereiro", value: "1" },
    { label: "Março", value: "2" },
    { label: "Abril", value: "3" },
    { label: "Maio", value: "4" },
    { label: "Junho", value: "5" },
    { label: "Julho", value: "6" },
    { label: "Agosto", value: "7" },
    { label: "Setembro", value: "8" },
    { label: "Outubro", value: "9" },
    { label: "Novembro", value: "10" },
    { label: "Dezembro", value: "11" }
  ];

  // Lista de anos (máx. últimos 5 anos)
  const anos = [];
  const anoAtual = new Date().getFullYear();
  for (let a = anoAtual; a >= anoAtual - 4; a--) {
    anos.push(a);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Análise do DRE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Tipo de comparação */}
            <div>
              <Label htmlFor="tipoComparacao">Tipo de Comparação</Label>
              <Select
                value={filtro.tipo_comparacao}
                onValueChange={(val) => setFiltro({ ...filtro, tipo_comparacao: val as any })}
              >
                <SelectTrigger id="tipoComparacao" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_anterior">Mês Atual vs Mês Anterior</SelectItem>
                  <SelectItem value="ano_anterior">Mês Atual vs Mesmo Mês Ano Anterior</SelectItem>
                  <SelectItem value="media_12_meses">Mês Atual vs Média dos Últimos 12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mês */}
            <div>
              <Label htmlFor="mes">Mês</Label>
              <Select
                value={filtro.mes.toString()}
                onValueChange={(val) => setFiltro({ ...filtro, mes: parseInt(val) })}
              >
                <SelectTrigger id="mes" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ano */}
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Select
                value={filtro.ano.toString()}
                onValueChange={(val) => setFiltro({ ...filtro, ano: parseInt(val) })}
              >
                <SelectTrigger id="ano" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Percentual mínimo */}
            <div>
              <Label htmlFor="percentualMinimo">
                % Mínimo de Variação <span className="text-muted-foreground">(Subcontas)</span>
              </Label>
              <Input
                id="percentualMinimo"
                type="number"
                className="mt-1"
                value={filtro.percentual_minimo}
                onChange={(e) => setFiltro({ ...filtro, percentual_minimo: parseInt(e.target.value) || 0 })}
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="showAll"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="showAll" className="text-sm cursor-pointer">
                  Mostrar todas as contas
                </Label>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="ml-3">Carregando dados para análise...</span>
            </div>
          ) : (
            <>
              {/* Info do período */}
              <div className="mb-6">
                <Alert className="bg-muted/30 text-foreground">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Comparando <strong>{periodoAtualLabel}</strong> com <strong>{periodoCompLabel}</strong>
                  </AlertDescription>
                </Alert>
              </div>
              
              <Tabs defaultValue="analise">
                <TabsList className="mb-4">
                  <TabsTrigger value="analise">Análise de Variação</TabsTrigger>
                  <TabsTrigger value="alertas">Alertas</TabsTrigger>
                </TabsList>
                
                {/* Análise de Variação */}
                <TabsContent value="analise">
                  {/* Tabela de análise de variação */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conta</TableHead>
                          <TableHead className="text-right">Valor Atual</TableHead>
                          <TableHead className="text-right">Valor Anterior</TableHead>
                          <TableHead className="text-right">Variação</TableHead>
                          <TableHead className="text-right">%</TableHead>
                          <TableHead className="text-center">Detalhes Mensais</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosAnalise && dadosAnalise.length > 0 ? (
                          <>
                            {dadosAnalise.map((analise: AnaliseVariacao, index) => (
                              <React.Fragment key={`analise-${index}`}>
                                {/* Linha da conta principal */}
                                <AnaliseVariacaoRow 
                                  analise={analise} 
                                  periodoInicio={periodoInicio} 
                                  periodoFim={periodoFim}
                                />
                                
                                {/* Linhas das subcontas, se houver */}
                                {analise.subcontas && analise.subcontas.length > 0 && 
                                  analise.subcontas.map((subconta, subIdx) => (
                                    <AnaliseVariacaoRow 
                                      key={`subconta-${index}-${subIdx}`} 
                                      analise={subconta}
                                      periodoInicio={periodoInicio} 
                                      periodoFim={periodoFim}
                                    />
                                  ))
                                }
                                
                                {/* Separador visual entre grupos de contas */}
                                {index < dadosAnalise.length - 1 && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="p-0">
                                      <Separator className="my-1" />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              Nenhum dado disponível para análise
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                {/* Alertas */}
                <TabsContent value="alertas">
                  <div className="space-y-6">
                    {/* Alertas para variações significativas */}
                    <Card className="border-red-200">
                      <CardHeader className="bg-red-50/50 py-3">
                        <CardTitle className="text-base">Variações Negativas Significativas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ul className="space-y-2">
                          {dadosAnalise && dadosAnalise.length > 0 ? (
                            <>
                              {dadosAnalise.flatMap(analise => [
                                ...(analise.avaliacao === 'negativa' && analise.nivel === 'principal' && Math.abs(analise.variacao_percentual) >= 15 ? [{
                                  nome: analise.nome,
                                  variacao: analise.variacao_percentual,
                                  tipo: 'principal'
                                }] : []),
                                ...(analise.subcontas?.filter(sub => sub.avaliacao === 'negativa' && Math.abs(sub.variacao_percentual) >= 15) || []).map(sub => ({
                                  nome: `${sub.nome} (${analise.nome})`,
                                  variacao: sub.variacao_percentual,
                                  tipo: 'subconta'
                                }))
                              ]).map((alerta, idx) => (
                                <li key={idx} className="flex items-center justify-between">
                                  <div>{alerta.nome}</div>
                                  <div className="font-medium text-red-600">{alerta.variacao.toFixed(2)}%</div>
                                </li>
                              ))}
                            </>
                          ) : (
                            <li className="text-center text-muted-foreground py-4">
                              Nenhum alerta negativo significativo
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                      
                    <Card className="border-green-200">
                      <CardHeader className="bg-green-50/50 py-3">
                        <CardTitle className="text-base">Variações Positivas Significativas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ul className="space-y-2">
                          {dadosAnalise && dadosAnalise.length > 0 ? (
                            <>
                              {dadosAnalise.flatMap(analise => [
                                ...(analise.avaliacao === 'positiva' && analise.nivel === 'principal' && Math.abs(analise.variacao_percentual) >= 15 ? [{
                                  nome: analise.nome,
                                  variacao: analise.variacao_percentual,
                                  tipo: 'principal'
                                }] : []),
                                ...(analise.subcontas?.filter(sub => sub.avaliacao === 'positiva' && Math.abs(sub.variacao_percentual) >= 15) || []).map(sub => ({
                                  nome: `${sub.nome} (${analise.nome})`,
                                  variacao: sub.variacao_percentual,
                                  tipo: 'subconta'
                                }))
                              ]).map((alerta, idx) => (
                                <li key={idx} className="flex items-center justify-between">
                                  <div>{alerta.nome}</div>
                                  <div className="font-medium text-green-600">+{alerta.variacao.toFixed(2)}%</div>
                                </li>
                              ))}
                            </>
                          ) : (
                            <li className="text-center text-muted-foreground py-4">
                              Nenhum alerta positivo significativo
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
