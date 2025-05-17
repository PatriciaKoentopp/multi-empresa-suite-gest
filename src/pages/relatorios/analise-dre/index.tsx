
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAnaliseDre } from '@/hooks/useAnaliseDre';
import { DetalhesMensaisTabela } from '@/components/relatorios/DetalhesMensaisTabela';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  { valor: 12, nome: "Dezembro" },
];

const anos = Array.from({ length: 5 }, (_, i) => {
  const ano = new Date().getFullYear() - i;
  return { valor: ano, nome: ano.toString() };
});

export default function AnaliseDrePage() {
  const [mesAtual, setMesAtual] = useState<number>(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState<number>(new Date().getFullYear());
  const [contaExpandida, setContaExpandida] = useState<string | null>(null);
  
  const { isLoading, dadosDetalhados, fetchDadosAnalise } = useAnaliseDre();

  // Definir data final baseada no mês/ano selecionado
  const dataFinal = useMemo(() => {
    return new Date(anoAtual, mesAtual - 1, 15); // Dia 15 para evitar problemas com o último dia do mês
  }, [anoAtual, mesAtual]);

  // Texto do período de análise
  const periodoAnaliseTexto = useMemo(() => {
    const dataInicial = subMonths(dataFinal, 11); // 12 meses para trás (incluindo o mês atual)
    const mesInicial = dataInicial.getMonth() + 1;
    const anoInicial = dataInicial.getFullYear();
    
    const mesInicialNome = meses.find(m => m.valor === mesInicial)?.nome;
    const mesFinalNome = meses.find(m => m.valor === mesAtual)?.nome;
    
    return `${mesInicialNome}/${anoInicial} até ${mesFinalNome}/${anoAtual}`;
  }, [dataFinal, mesAtual, anoAtual]);

  // Buscar dados quando os filtros mudarem
  useEffect(() => {
    fetchDadosAnalise({
      dataFinal,
      mesesParaAnalise: 12 // Sempre 12 meses
    });
  }, [fetchDadosAnalise, dataFinal]);

  // Função para alternar a expansão de uma conta
  const toggleContaExpansao = (nomeConta: string) => {
    setContaExpandida(contaExpandida === nomeConta ? null : nomeConta);
  };

  // Função para formatar moeda
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise DRE - Detalhamento de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Mês</label>
              <Select 
                value={mesAtual.toString()} 
                onValueChange={(valor) => setMesAtual(parseInt(valor))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor.toString()}>
                      {mes.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Ano</label>
              <Select 
                value={anoAtual.toString()} 
                onValueChange={(valor) => setAnoAtual(parseInt(valor))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano.valor} value={ano.valor.toString()}>
                      {ano.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md mb-6 flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={18} className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Análise dos últimos 12 meses completos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div>
              <span className="font-medium">Período de análise:</span> {periodoAnaliseTexto}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse text-muted-foreground">Carregando dados da análise...</div>
            </div>
          ) : dadosDetalhados.length > 0 ? (
            <div className="space-y-4">
              {dadosDetalhados.map((conta) => (
                <Collapsible 
                  key={conta.nome_conta} 
                  open={contaExpandida === conta.nome_conta} 
                  onOpenChange={() => toggleContaExpansao(conta.nome_conta)}
                  className="border rounded-md"
                >
                  <CollapsibleTrigger className="flex justify-between w-full p-4 text-left hover:bg-muted/50 rounded-t-md">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 collapsible-icon" />
                      <span className="font-medium">{conta.nome_conta}</span>
                    </div>
                    <div className="font-medium">{formatarMoeda(conta.media)}</div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="p-4 pt-0">
                    <Separator className="my-4" />
                    <DetalhesMensaisTabela dados={conta} />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum dado disponível para o período selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
