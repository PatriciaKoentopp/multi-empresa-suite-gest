
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { Badge } from "@/components/ui/badge";

interface FavorecidoContasReceberTabProps {
  favorecidoId: string;
}

interface ContaReceber {
  id: string;
  numeroParcela: string;
  numeroTitulo?: string;
  dataVencimento: Date;
  dataRecebimento?: Date;
  valor: number;
  valorEfetivo: number; // Valor com multa, juros e desconto aplicados
  status: "recebido" | "recebido_em_atraso" | "em_aberto";
  multa?: number;
  juros?: number;
  desconto?: number;
}

export function FavorecidoContasReceberTab({ favorecidoId }: FavorecidoContasReceberTabProps) {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentCompany } = useCompany();

  useEffect(() => {
    const fetchContasReceber = async () => {
      if (!currentCompany || !favorecidoId) return;

      setIsLoading(true);
      try {
        // Primeiro, buscar as movimentações do tipo 'receber' para este favorecido
        const { data: movimentacoes, error: movError } = await supabase
          .from("movimentacoes")
          .select("id, numero_documento")
          .eq("favorecido_id", favorecidoId)
          .eq("empresa_id", currentCompany.id)
          .eq("tipo_operacao", "receber");

        if (movError) {
          console.error("Erro ao buscar movimentações:", movError);
          return;
        }

        if (!movimentacoes || movimentacoes.length === 0) {
          setContasReceber([]);
          setIsLoading(false);
          return;
        }

        // Criar um mapa de números de documento por movimentação para uso posterior
        const numerosPorMovimentacao = movimentacoes.reduce((acc, mov) => {
          acc[mov.id] = mov.numero_documento || '';
          return acc;
        }, {} as Record<string, string>);

        // Obter os IDs das movimentações
        const movimentacoesIds = movimentacoes.map(m => m.id);

        // Buscar as parcelas associadas a essas movimentações incluindo multa, juros e desconto
        const { data: parcelas, error: parcError } = await supabase
          .from("movimentacoes_parcelas")
          .select("*")
          .in("movimentacao_id", movimentacoesIds)
          .order("data_vencimento", { ascending: false }); // Ordenado por data de vencimento decrescente

        if (parcError) {
          console.error("Erro ao buscar parcelas:", parcError);
          return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const contasReceberFormatadas: ContaReceber[] = (parcelas || []).map(parcela => {
          const dataVencimento = new Date(parcela.data_vencimento);
          const dataRecebimento = parcela.data_pagamento ? new Date(parcela.data_pagamento) : undefined;
          
          // Calcular o valor efetivo considerando multa, juros e desconto
          const valorOriginal = parcela.valor;
          const multa = parcela.multa || 0;
          const juros = parcela.juros || 0;
          const desconto = parcela.desconto || 0;
          const valorEfetivo = valorOriginal + multa + juros - desconto;
          
          let status: ContaReceber["status"] = "em_aberto";
          
          if (dataRecebimento) {
            status = dataRecebimento > dataVencimento ? "recebido_em_atraso" : "recebido";
          } else if (dataVencimento < hoje) {
            status = "em_aberto"; // Em aberto e atrasado
          }

          return {
            id: parcela.id,
            numeroParcela: `${parcela.numero}`,
            numeroTitulo: numerosPorMovimentacao[parcela.movimentacao_id],
            dataVencimento,
            dataRecebimento,
            valor: valorOriginal,
            valorEfetivo,
            status,
            multa,
            juros,
            desconto
          };
        });

        setContasReceber(contasReceberFormatadas);
      } catch (error) {
        console.error("Erro ao carregar contas a receber:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContasReceber();
  }, [currentCompany, favorecidoId]);

  // Usar valorEfetivo para os cálculos dos totais
  const totalRecebido = contasReceber
    .filter(conta => conta.status === "recebido" || conta.status === "recebido_em_atraso")
    .reduce((total, conta) => total + conta.valorEfetivo, 0);
  
  const totalAReceber = contasReceber
    .filter(conta => conta.status === "em_aberto")
    .reduce((total, conta) => total + conta.valorEfetivo, 0);
  
  const totalEmAtraso = contasReceber
    .filter(conta => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return conta.status === "em_aberto" && conta.dataVencimento < hoje;
    })
    .reduce((total, conta) => total + conta.valorEfetivo, 0);

  function getStatusBadge(status: ContaReceber["status"], dataVencimento: Date) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const estaEmAtraso = dataVencimento < hoje;

    switch (status) {
      case "recebido":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Recebido
          </Badge>
        );
      case "recebido_em_atraso":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Recebido em atraso
          </Badge>
        );
      case "em_aberto":
        return estaEmAtraso ? (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Em atraso
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Em aberto
          </Badge>
        );
      default:
        return status;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <SalesDashboardCard
          title="Total Recebido"
          value={formatCurrency(totalRecebido)}
          icon="chart"
          trend={totalRecebido > 0 ? "up" : "neutral"}
        />
        <SalesDashboardCard
          title="Total a Receber"
          value={formatCurrency(totalAReceber)}
          icon="money"
        />
        <SalesDashboardCard
          title="Total em Atraso"
          value={formatCurrency(totalEmAtraso)}
          icon="chart"
          trend={totalEmAtraso > 0 ? "down" : "neutral"}
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead>Data Vencimento</TableHead>
              <TableHead>Data Recebimento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Efetivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : contasReceber.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhuma conta a receber encontrada para este favorecido
                </TableCell>
              </TableRow>
            ) : (
              contasReceber.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell>
                    {(conta.numeroTitulo || conta.numeroParcela) ? (
                      <span className="block font-mono text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                        {`${conta.numeroTitulo || '-'}/${conta.numeroParcela || '1'}`}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                  <TableCell>{conta.dataRecebimento ? formatDate(conta.dataRecebimento) : "-"}</TableCell>
                  <TableCell>
                    <div>
                      <div>-</div>
                      {(conta.multa || conta.juros || conta.desconto) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Valor original: {formatCurrency(conta.valor)}
                          {conta.multa ? ` | Multa: ${formatCurrency(conta.multa)}` : ''}
                          {conta.juros ? ` | Juros: ${formatCurrency(conta.juros)}` : ''}
                          {conta.desconto ? ` | Desconto: ${formatCurrency(conta.desconto)}` : ''}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(conta.status, conta.dataVencimento)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(conta.valorEfetivo)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
