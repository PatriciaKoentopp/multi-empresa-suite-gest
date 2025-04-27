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
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

// Arrays de meses e anos
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

const mesesComTodos = [
  { label: "Todos os meses", value: "todos" },
  ...meses
];

// Array de anos (máx. últimos 5 anos)
const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());

// Mock dados contábeis padrão
const mockDRE = [
  { tipo: "Receita Bruta", valor: 100000 },
  { tipo: "(-) Deduções", valor: -2000 },
  { tipo: "Receita Líquida", valor: 98000 },
  { tipo: "(-) Custos", valor: -30000 },
  { tipo: "Lucro Bruto", valor: 68000 },
  { tipo: "(-) Despesas Operacionais", valor: -35000 },
  { tipo: "Resultado Operacional", valor: 33000 },
  { tipo: "(-) Despesas financeiras", valor: -8000 },
  { tipo: "Resultado Antes IR", valor: 25000 },
  { tipo: "(-) IRPJ/CSLL", valor: -3000 },
  { tipo: "Lucro Líquido do Exercício", valor: 22000 }
];
const contasDRE = mockDRE.map(c => c.tipo);

const mesesNumericos = meses.map(m => m.value);

// Mock DRE Mensal
const mockDREMensalBase = [
  {
    mes: "01",
    dados: [
      { tipo: "Receita Bruta", valor: 8000 },
      { tipo: "(-) Deduções", valor: -150 },
      { tipo: "Receita Líquida", valor: 7850 },
      { tipo: "(-) Custos", valor: -2500 },
      { tipo: "Lucro Bruto", valor: 5350 },
      { tipo: "(-) Despesas Operacionais", valor: -2900 },
      { tipo: "Resultado Operacional", valor: 2450 },
      { tipo: "(-) Despesas financeiras", valor: -600 },
      { tipo: "Resultado Antes IR", valor: 1850 },
      { tipo: "(-) IRPJ/CSLL", valor: -220 },
      { tipo: "Lucro Líquido do Exercício", valor: 1630 }
    ]
  },
  {
    mes: "02",
    dados: [
      { tipo: "Receita Bruta", valor: 9000 },
      { tipo: "(-) Deduções", valor: -180 },
      { tipo: "Receita Líquida", valor: 8820 },
      { tipo: "(-) Custos", valor: -2650 },
      { tipo: "Lucro Bruto", valor: 6170 },
      { tipo: "(-) Despesas Operacionais", valor: -3050 },
      { tipo: "Resultado Operacional", valor: 3120 },
      { tipo: "(-) Despesas financeiras", valor: -500 },
      { tipo: "Resultado Antes IR", valor: 2620 },
      { tipo: "(-) IRPJ/CSLL", valor: -360 },
      { tipo: "Lucro Líquido do Exercício", valor: 2260 }
    ]
  }
  // ... adicionar demais meses ao mock se necessário ...
];

// Mock multi anos acumulado - simular diferenças para comparar
const mockDREPorAno: { [ano: string]: typeof mockDRE } = {
  [anoAtual]: mockDRE,
  [anoAtual - 1]: mockDRE.map((l, i) => ({
    ...l,
    valor: Math.round(l.valor * 0.93 + (i%2 === 0 ? 3500 : -1200))
  })),
  [anoAtual - 2]: mockDRE.map((l, i) => ({
    ...l,
    valor: Math.round(l.valor * 0.81 + (i%2 === 0 ? 2000 : -2200))
  })),
  [anoAtual - 3]: mockDRE.map((l, i) => ({
    ...l,
    valor: Math.round(l.valor * 1.11 + (i%2 === 0 ? 700 : +800))
  })),
  [anoAtual - 4]: mockDRE.map((l, i) => ({
    ...l,
    valor: Math.round(l.valor * 1.19 + (i%2 === 0 ? 320 : -900))
  })),
};

// Monta todos os meses do ano para exibição horizontal
const mockDREMensal: { mes: string, dados: { tipo: string, valor: number }[] }[] = mesesNumericos.map(mesVal => {
  const encontrado = mockDREMensalBase.find(mx => mx.mes === mesVal);
  if (encontrado) return encontrado;
  return { mes: mesVal, dados: contasDRE.map(c => ({ tipo: c, valor: 0 })) };
});

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

// Interface para detalhes de movimentação
interface MovimentacaoDetalhe {
  data_movimentacao: string;
  descricao: string;
  valor: number;
  categoria?: string;
}

// Interface para grupo de movimentações
interface GrupoMovimentacao {
  tipo: string;
  valor: number;
  detalhes: MovimentacaoDetalhe[];
}

export default function DrePage() {
  // NOVO: incluir modo comparar_anos
  const [visualizacao, setVisualizacao] = useState<"acumulado" | "comparar_anos" | "mensal">("acumulado");
  const [ano, setAno] = useState(anoAtual.toString());
  const [anosComparar, setAnosComparar] = useState<string[]>([anoAtual.toString(), (anoAtual-1).toString()]);
  const [mes, setMes] = useState("01");
  const [anoMensal, setAnoMensal] = useState(anoAtual.toString());
  const { currentCompany } = useCompany();

  // Query para buscar dados do DRE
  const { data: dadosDRE = [], isLoading } = useQuery({
    queryKey: ["dre-data", currentCompany?.id, ano, mes, visualizacao],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      let startDate, endDate;

      if (visualizacao === "mensal" && mes !== "todos") {
        startDate = format(new Date(parseInt(anoMensal), parseInt(mes) - 1, 1), 'yyyy-MM-dd');
        endDate = format(new Date(parseInt(anoMensal), parseInt(mes), 0), 'yyyy-MM-dd');
      } else {
        startDate = format(new Date(parseInt(ano), 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(parseInt(ano), 11, 31), 'yyyy-MM-dd');
      }

      const { data: movimentacoes, error } = await supabase
        .from('fluxo_caixa')
        .select(`
          *,
          movimentacoes (
            categoria_id,
            tipo_operacao
          ),
          plano_contas:movimentacoes(plano_contas(tipo, descricao))
        `)
        .eq('empresa_id', currentCompany.id)
        .gte('data_movimentacao', startDate)
        .lte('data_movimentacao', endDate);

      if (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados do DRE');
        return [];
      }

      // Agrupar movimentações
      const grupos: { [key: string]: MovimentacaoDetalhe[] } = {
        "Receita Bruta": [],
        "Deduções": [],
        "Custos": [],
        "Despesas Operacionais": [],
        "Despesas Financeiras": [],
        "IRPJ/CSLL": []
      };

      let receitaBruta = 0;
      let deducoes = 0;
      let custos = 0;
      let despesasOperacionais = 0;
      let despesasFinanceiras = 0;
      let impostos = 0;

      movimentacoes?.forEach(mov => {
        const valor = Number(mov.valor);
        const tipoOperacao = mov.movimentacoes?.tipo_operacao;
        const planoContas = mov.plano_contas?.plano_contas;
        const categoriaId = mov.movimentacoes?.categoria_id;
        const descricaoCategoria = planoContas?.descricao || 'Sem categoria';

        const detalhe: MovimentacaoDetalhe = {
          data_movimentacao: format(new Date(mov.data_movimentacao), 'dd/MM/yyyy'),
          descricao: mov.descricao || descricaoCategoria,
          valor: valor,
          categoria: descricaoCategoria
        };

        // Se for receita e não tiver categoria, considera como receita bruta
        if (tipoOperacao === 'receber' && !categoriaId) {
          receitaBruta += valor;
          grupos["Receita Bruta"].push(detalhe);
        } 
        // Para as demais, usa o plano de contas
        else if (planoContas) {
          const { tipo, descricao } = planoContas;
          if (tipo === 'despesa') {
            switch (descricao) {
              case 'DAS - Simples Nacional':
                deducoes += Math.abs(valor);
                grupos["Deduções"].push(detalhe);
                break;
              case 'Pró-Labore':
              case 'INSS':
              case 'Honorários Contábeis':
                despesasOperacionais += Math.abs(valor);
                grupos["Despesas Operacionais"].push(detalhe);
                break;
              case 'Distribuição de Lucros':
                despesasFinanceiras += Math.abs(valor);
                grupos["Despesas Financeiras"].push(detalhe);
                break;
              default:
                custos += Math.abs(valor);
                grupos["Custos"].push(detalhe);
            }
          }
        }
      });

      const receitaLiquida = receitaBruta - deducoes;
      const lucroBruto = receitaLiquida - custos;
      const resultadoOperacional = lucroBruto - despesasOperacionais;
      const resultadoAntesIR = resultadoOperacional - despesasFinanceiras;
      const lucroLiquido = resultadoAntesIR - impostos;

      // Converter grupos em array para o DRE
      const gruposDRE: GrupoMovimentacao[] = [
        { tipo: "Receita Bruta", valor: receitaBruta, detalhes: grupos["Receita Bruta"] },
        { tipo: "(-) Deduções", valor: -deducoes, detalhes: grupos["Deduções"] },
        { tipo: "Receita Líquida", valor: receitaLiquida, detalhes: [] },
        { tipo: "(-) Custos", valor: -custos, detalhes: grupos["Custos"] },
        { tipo: "Lucro Bruto", valor: lucroBruto, detalhes: [] },
        { tipo: "(-) Despesas Operacionais", valor: -despesasOperacionais, detalhes: grupos["Despesas Operacionais"] },
        { tipo: "Resultado Operacional", valor: resultadoOperacional, detalhes: [] },
        { tipo: "(-) Despesas financeiras", valor: -despesasFinanceiras, detalhes: grupos["Despesas Financeiras"] },
        { tipo: "Resultado Antes IR", valor: resultadoAntesIR, detalhes: [] },
        { tipo: "(-) IRPJ/CSLL", valor: -impostos, detalhes: grupos["IRPJ/CSLL"] },
        { tipo: "Lucro Líquido do Exercício", valor: lucroLiquido, detalhes: [] }
      ];

      return gruposDRE;
    },
    enabled: !!currentCompany?.id
  });

  // Função para verificar se o grupo tem detalhes
  const temDetalhes = (grupo: GrupoMovimentacao) => grupo.detalhes.length > 0;

  function handleAnoCompararChange(anoAlterado: string) {
    let result: string[] = [];
    if (anosComparar.includes(anoAlterado)) {
      // desmarca
      result = anosComparar.filter(a => a !== anoAlterado);
    } else {
      // marca (até 5)
      if (anosComparar.length < 5) result = [...anosComparar, anoAlterado];
      else result = anosComparar;
    }
    // Garante pelo menos 1 ano selecionado
    if (result.length === 0) result = [anoAlterado];
    setAnosComparar(result);
  }

  // Ajuste para buscar dados mensais do mock base para o ano selecionado (apenas para demonstrar seleção, simula dados zerados caso não exista p/ ano)
  function getMockDREMensalAnoSelecionado(anoSelecionado: string) {
    // Simples: só retorna o mock fixo pois mocks não tem dados de outros anos para visualização, simula zerados nos outros anos
    if (anoSelecionado === anoAtual.toString()) return mockDREMensal;
    // Se quiser simular outros anos diferentes, basta criar outros arrays semelhantes.
    return mesesNumericos.map(mesVal => ({
      mes: mesVal,
      dados: contasDRE.map(c => ({ tipo: c, valor: 0 })),
    }));
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>DRE - Demonstração do Resultado do Exercício</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Visualização</label>
              <Select
                value={visualizacao}
                onValueChange={v => setVisualizacao(v as any)}
              >
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
            {/* Ano para acumulado */}
            {visualizacao === "acumulado" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Ano</label>
                <Select value={ano} onValueChange={val => setAno(val)}>
                  <SelectTrigger className="min-w-[90px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map(a => (
                      <SelectItem value={a} key={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Seleção múltipla de anos para comparação */}
            {visualizacao === "comparar_anos" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Anos para comparar</label>
                <div className="flex flex-wrap gap-2">
                  {anos.map(a => (
                    <Button
                      key={a}
                      variant={anosComparar.includes(a) ? "blue" : "outline"}
                      size="sm"
                      type="button"
                      className="px-3 py-1 rounded"
                      onClick={() => handleAnoCompararChange(a)}
                      aria-pressed={anosComparar.includes(a)}
                    >
                      {a}
                    </Button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">
                  Selecione até 5 anos
                </span>
              </div>
            )}
            {/* NOVO: Ano + mês para visualização mensal */}
            {visualizacao === "mensal" && (
              <>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Ano</label>
                  <Select value={anoMensal} onValueChange={val => setAnoMensal(val)}>
                    <SelectTrigger className="min-w-[90px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map(a => (
                        <SelectItem value={a} key={"anoMensal-"+a}>{a}</SelectItem>
                      ))}
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
                      {mesesComTodos.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </form>

          {/* Estado de carregamento */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">Carregando dados do DRE...</div>
            </div>
          ) : (
            /* Exibição do DRE */
            <div>
              {/* Acumulado padrão */}
              {visualizacao === "acumulado" && (
                <Accordion type="single" collapsible className="w-full">
                  {dadosDRE.map((grupo, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className={`${!temDetalhes(grupo) ? 'cursor-default hover:no-underline' : ''}`} disabled={!temDetalhes(grupo)}>
                        <div className="flex justify-between w-full pr-4">
                          <span>{grupo.tipo}</span>
                          <span>{formatCurrency(grupo.valor)}</span>
                        </div>
                      </AccordionTrigger>
                      {temDetalhes(grupo) && (
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grupo.detalhes.map((detalhe, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{detalhe.data_movimentacao}</TableCell>
                                  <TableCell>{detalhe.descricao}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(detalhe.valor)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {/* Comparação de anos */}
              {visualizacao === "comparar_anos" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conta</TableHead>
                      {anosComparar.map(a => (
                        <TableHead key={a} className="text-center">{a}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasDRE.map(conta => (
                      <TableRow key={conta}>
                        <TableCell>{conta}</TableCell>
                        {anosComparar.map(a => {
                          const dadosAno = mockDREPorAno[a] || [];
                          const linha = dadosAno.find(i => i.tipo === conta);
                          return (
                            <TableCell key={a} className="text-right">
                              {linha
                                ? linha.valor.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                  })
                                : "R$ 0,00"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {/* Mensal por mês único */}
              {visualizacao === "mensal" && mes !== "todos" && (
                (() => {
                  const dadosMensalAno = getMockDREMensalAnoSelecionado(anoMensal);
                  const dadosMes = dadosMensalAno.find(mObj => mObj.mes === mes);
                  if (!dadosMes) {
                    return (
                      <div className="text-muted-foreground py-4">Sem dados para este mês.</div>
                    );
                  }
                  return (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conta</TableHead>
                          <TableHead className="text-right">Valor (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosMes.dados.map(item => (
                          <TableRow key={item.tipo}>
                            <TableCell>{item.tipo}</TableCell>
                            <TableCell className="text-right">
                              {item.valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  );
                })()
              )}
              {/* Mensal todos os meses em colunas */}
              {visualizacao === "mensal" && mes === "todos" && (
                (() => {
                  const dadosMensalAno = getMockDREMensalAnoSelecionado(anoMensal);
                  return (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conta</TableHead>
                          {meses.map(m => (
                            <TableHead key={m.value} className="text-center">{m.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contasDRE.map(conta => (
                          <TableRow key={conta}>
                            <TableCell>{conta}</TableCell>
                            {meses.map(m => {
                              const dadoMes = dadosMensalAno.find(x => x.mes === m.value);
                              const linha = dadoMes?.dados.find(i => i.tipo === conta);
                              return (
                                <TableCell key={m.value} className="text-right">
                                  {linha
                                    ? linha.valor.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL"
                                      })
                                    : "R$ 0,00"}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  );
                })()
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
