
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  AnaliseVariacao,
  DetalhesMensaisConta,
  FiltroAnaliseDre,
} from "@/types/financeiro";
import { formatCurrency } from "@/lib/utils";
import { AvaliacaoIndicator } from "@/components/financeiro/AvaliacaoIndicator";
import { IconButton } from "@/components/ui/icon-button";
import { Info } from "lucide-react";
import { DetalhesMensaisContaTable } from "@/components/financeiro/DetalhesMensaisContaTable";
import { Spinner } from "@/components/ui/spinner";

// Array de meses para o select
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
  { label: "Dezembro", value: 12 },
];

// Array de anos (últimos 5 anos)
const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

// Função que busca os dados da análise do DRE
async function buscarAnaliseDre(
  empresaId: string,
  filtro: FiltroAnaliseDre
): Promise<AnaliseVariacao[]> {
  if (!empresaId) {
    console.warn("Empresa ID não fornecido.");
    return [];
  }

  const startDate = filtro.tipo_comparacao === 'ano_anterior'
    ? format(subYears(new Date(filtro.ano, filtro.mes - 1, 1), 1), 'yyyy-MM-dd')
    : filtro.tipo_comparacao === 'mes_anterior'
      ? format(subMonths(new Date(filtro.ano, filtro.mes - 1, 1), 1), 'yyyy-MM-dd')
      : format(subMonths(new Date(filtro.ano, filtro.mes - 1, 1), 12), 'yyyy-MM-dd');

  const endDate = format(new Date(filtro.ano, filtro.mes - 1, 1), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .rpc('analisar_dre', {
      p_empresa_id: empresaId,
      p_data_inicio: startDate,
      p_data_fim: endDate,
      p_tipo_comparacao: filtro.tipo_comparacao
    });

  if (error) {
    console.error("Erro ao buscar análise do DRE:", error);
    toast.error("Erro ao carregar análise do DRE");
    return [];
  }

  return data || [];
}

// Função que determina se deve mostrar a coluna de detalhes mensais
const deveExibirColunaMensais = (filtro: FiltroAnaliseDre) => {
  return filtro.tipo_comparacao !== "media_12_meses";
};

// Componente principal
const AnaliseDrePage = () => {
  const { currentCompany } = useCompany();
  const [filtro, setFiltro] = useState<FiltroAnaliseDre>({
    tipo_comparacao: "mes_anterior",
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    percentual_minimo: 5,
  });
  const [detalhesAbertos, setDetalhesAbertos] = useState<string | null>(null);
  const [detalhesConta, setDetalhesConta] = useState<DetalhesMensaisConta | null>(null);
  const [detalhesCarregando, setDetalhesCarregando] = useState(false);

  // UseQuery Hook para buscar os dados
  const { data: analises = [], isLoading } = useQuery({
    queryKey: ["analise-dre", currentCompany?.id, filtro],
    queryFn: () => buscarAnaliseDre(currentCompany?.id as string, filtro),
  });

  // Filtra as análises com base na avaliação
  const analisesPositivas = analises.filter(a => a.avaliacao === 'positiva');
  const analisesNegativas = analises.filter(a => a.avaliacao === 'negativa');
  const analisesAtencao = analises.filter(a => a.avaliacao === 'atencao');

  // Função para formatar a data por extenso
  const formatDateExtensive = (date: Date): string => {
    return format(date, 'MMMM yyyy', { locale: ptBR });
  };

  // Obtém os nomes dos meses para comparação
  const mesAtualExtenso = formatDateExtensive(new Date(filtro.ano, filtro.mes - 1, 1));
  const mesComparacaoExtenso = filtro.tipo_comparacao === 'ano_anterior'
    ? formatDateExtensive(subYears(new Date(filtro.ano, filtro.mes - 1, 1), 1))
    : filtro.tipo_comparacao === 'mes_anterior'
      ? formatDateExtensive(subMonths(new Date(filtro.ano, filtro.mes - 1, 1), 1))
      : 'Média dos últimos 12 meses';

  // Função para atualizar o filtro
  const atualizarFiltro = (
    campo: keyof FiltroAnaliseDre,
    valor: FiltroAnaliseDre[keyof FiltroAnaliseDre]
  ) => {
    setFiltro(prevFiltro => ({
      ...prevFiltro,
      [campo]: valor,
    }));
  };

  // Função para buscar os detalhes mensais da conta
  const buscarDetalhesMensais = async (nomeConta: string) => {
    setDetalhesCarregando(true);
    try {
      const { data, error } = await supabase.rpc('detalhar_conta_mensal', {
        p_empresa_id: currentCompany?.id,
        p_nome_conta: nomeConta,
        p_ano: filtro.ano,
        p_mes: filtro.mes,
        p_tipo_comparacao: filtro.tipo_comparacao
      });

      if (error) {
        console.error("Erro ao buscar detalhes mensais:", error);
        toast.error("Erro ao carregar detalhes da conta");
        setDetalhesCarregando(false);
        return;
      }

      setDetalhesConta(data as DetalhesMensaisConta);
    } finally {
      setDetalhesCarregando(false);
    }
  };

  // Função para exibir os detalhes da conta
  const handleShowDetalhes = async (nomeConta: string) => {
    setDetalhesAbertos(nomeConta);
    await buscarDetalhesMensais(nomeConta);
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise do DRE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div>
              <Label htmlFor="tipo_comparacao">Tipo de Comparação</Label>
              <Select
                id="tipo_comparacao"
                value={filtro.tipo_comparacao}
                onValueChange={(value) =>
                  atualizarFiltro("tipo_comparacao", value as FiltroAnaliseDre["tipo_comparacao"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de comparação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="ano_anterior">Ano Anterior</SelectItem>
                  <SelectItem value="media_12_meses">Média dos Últimos 12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ano">Ano</Label>
              <Select
                id="ano"
                value={filtro.ano}
                onValueChange={(value) => atualizarFiltro("ano", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
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

            <div>
              <Label htmlFor="mes">Mês</Label>
              <Select
                id="mes"
                value={filtro.mes}
                onValueChange={(value) => atualizarFiltro("mes", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="percentual_minimo">Variação Mínima (%)</Label>
              <Input
                id="percentual_minimo"
                type="number"
                value={filtro.percentual_minimo}
                onChange={(e) =>
                  atualizarFiltro("percentual_minimo", Number(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="todas" className="mt-6">
        <TabsList>
          <TabsTrigger value="todas">Todas as Variações</TabsTrigger>
          <TabsTrigger value="positivas">Variações Positivas</TabsTrigger>
          <TabsTrigger value="negativas">Variações Negativas</TabsTrigger>
          <TabsTrigger value="atencao">Atenção</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todas" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Comparando {mesAtualExtenso} com {mesComparacaoExtenso}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subconta</TableHead>
                <TableHead className="text-right">Valor Atual<br/>(Média)</TableHead>
                <TableHead className="text-right">Valor Anterior<br/>(Média)</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Avaliação</TableHead>
                {deveExibirColunaMensais(filtro) && (
                  <TableHead className="text-center">Detalhes Mensais</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {analises.map((analise, index) => (
                <TableRow key={index}>
                  <TableCell>{analise.nome}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_atual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_comparacao)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.variacao_valor)}</TableCell>
                  <TableCell className="text-right">
                    {analise.variacao_percentual.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <AvaliacaoIndicator avaliacao={analise.avaliacao} />
                  </TableCell>
                  {deveExibirColunaMensais(filtro) && (
                    <TableCell className="text-center">
                      <IconButton
                        icon={<Info className="h-5 w-5" />}
                        onClick={() => handleShowDetalhes(analise.nome)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="positivas" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Comparando {mesAtualExtenso} com {mesComparacaoExtenso}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subconta</TableHead>
                <TableHead className="text-right">Valor Atual<br/>(Média)</TableHead>
                <TableHead className="text-right">Valor Anterior<br/>(Média)</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Avaliação</TableHead>
                {deveExibirColunaMensais(filtro) && (
                  <TableHead className="text-center">Detalhes Mensais</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {analisesPositivas.map((analise, index) => (
                <TableRow key={index}>
                  <TableCell>{analise.nome}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_atual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_comparacao)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.variacao_valor)}</TableCell>
                  <TableCell className="text-right">
                    {analise.variacao_percentual.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <AvaliacaoIndicator avaliacao={analise.avaliacao} />
                  </TableCell>
                  {deveExibirColunaMensais(filtro) && (
                    <TableCell className="text-center">
                      <IconButton
                        icon={<Info className="h-5 w-5" />}
                        onClick={() => handleShowDetalhes(analise.nome)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="negativas" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Comparando {mesAtualExtenso} com {mesComparacaoExtenso}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subconta</TableHead>
                <TableHead className="text-right">Valor Atual<br/>(Média)</TableHead>
                <TableHead className="text-right">Valor Anterior<br/>(Média)</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Avaliação</TableHead>
                {deveExibirColunaMensais(filtro) && (
                  <TableHead className="text-center">Detalhes Mensais</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {analisesNegativas.map((analise, index) => (
                <TableRow key={index}>
                  <TableCell>{analise.nome}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_atual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_comparacao)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.variacao_valor)}</TableCell>
                  <TableCell className="text-right">
                    {analise.variacao_percentual.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <AvaliacaoIndicator avaliacao={analise.avaliacao} />
                  </TableCell>
                  {deveExibirColunaMensais(filtro) && (
                    <TableCell className="text-center">
                      <IconButton
                        icon={<Info className="h-5 w-5" />}
                        onClick={() => handleShowDetalhes(analise.nome)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="atencao" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Comparando {mesAtualExtenso} com {mesComparacaoExtenso}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subconta</TableHead>
                <TableHead className="text-right">Valor Atual<br/>(Média)</TableHead>
                <TableHead className="text-right">Valor Anterior<br/>(Média)</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Avaliação</TableHead>
                {deveExibirColunaMensais(filtro) && (
                  <TableHead className="text-center">Detalhes Mensais</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {analisesAtencao.map((analise, index) => (
                <TableRow key={index}>
                  <TableCell>{analise.nome}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_atual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.valor_comparacao)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(analise.variacao_valor)}</TableCell>
                  <TableCell className="text-right">
                    {analise.variacao_percentual.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <AvaliacaoIndicator avaliacao={analise.avaliacao} />
                  </TableCell>
                  {deveExibirColunaMensais(filtro) && (
                    <TableCell className="text-center">
                      <IconButton
                        icon={<Info className="h-5 w-5" />}
                        onClick={() => handleShowDetalhes(analise.nome)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
      
      {detalhesAbertos && (
        <Dialog open={!!detalhesAbertos} onOpenChange={() => setDetalhesAbertos(null)}>
          <DialogContent className="max-w-3xl">
            {detalhesCarregando ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
                <span className="ml-2">Carregando detalhes...</span>
              </div>
            ) : detalhesConta ? (
              <DetalhesMensaisContaTable detalhes={detalhesConta} filtro={filtro} />
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                Nenhum detalhe encontrado para esta conta.
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AnaliseDrePage;
