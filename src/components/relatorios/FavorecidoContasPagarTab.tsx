
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { Badge } from "@/components/ui/badge";

interface FavorecidoContasPagarTabProps {
  favorecidoId: string;
}

interface ContaPagar {
  id: string;
  numeroParcela: string;
  numeroTitulo?: string;
  descricao: string;
  dataVencimento: Date;
  dataPagamento?: Date;
  valor: number;
  status: "pago" | "pago_em_atraso" | "em_aberto";
}

export function FavorecidoContasPagarTab({ favorecidoId }: FavorecidoContasPagarTabProps) {
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentCompany } = useCompany();

  useEffect(() => {
    const fetchContasPagar = async () => {
      if (!currentCompany || !favorecidoId) return;

      setIsLoading(true);
      try {
        // Primeiro, buscar as movimentações do tipo 'pagar' para este favorecido
        const { data: movimentacoes, error: movError } = await supabase
          .from("movimentacoes")
          .select("id, descricao, numero_documento")
          .eq("favorecido_id", favorecidoId)
          .eq("empresa_id", currentCompany.id)
          .eq("tipo_operacao", "pagar");

        if (movError) {
          console.error("Erro ao buscar movimentações:", movError);
          return;
        }

        if (!movimentacoes || movimentacoes.length === 0) {
          setContasPagar([]);
          setIsLoading(false);
          return;
        }

        // Criar um mapa de descrições e números de documento de movimentação para uso posterior
        const dadosPorMovimentacao = movimentacoes.reduce((acc, mov) => {
          acc[mov.id] = {
            descricao: mov.descricao || '',
            numeroTitulo: mov.numero_documento || ''
          };
          return acc;
        }, {} as Record<string, { descricao: string; numeroTitulo: string }>);

        // Obter os IDs das movimentações
        const movimentacoesIds = movimentacoes.map(m => m.id);

        // Buscar as parcelas associadas a essas movimentações
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

        const contasPagarFormatadas: ContaPagar[] = (parcelas || []).map(parcela => {
          const dataVencimento = new Date(parcela.data_vencimento);
          const dataPagamento = parcela.data_pagamento ? new Date(parcela.data_pagamento) : undefined;
          
          let status: ContaPagar["status"] = "em_aberto";
          
          if (dataPagamento) {
            status = dataPagamento > dataVencimento ? "pago_em_atraso" : "pago";
          } else if (dataVencimento < hoje) {
            status = "em_aberto"; // Em aberto e atrasado
          }

          const dadosMovimentacao = dadosPorMovimentacao[parcela.movimentacao_id] || { descricao: '', numeroTitulo: '' };

          return {
            id: parcela.id,
            numeroParcela: `${parcela.numero}`,
            numeroTitulo: dadosMovimentacao.numeroTitulo,
            descricao: dadosMovimentacao.descricao,
            dataVencimento,
            dataPagamento,
            valor: parcela.valor,
            status
          };
        });

        setContasPagar(contasPagarFormatadas);
      } catch (error) {
        console.error("Erro ao carregar contas a pagar:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContasPagar();
  }, [currentCompany, favorecidoId]);

  const totalPago = contasPagar
    .filter(conta => conta.status === "pago" || conta.status === "pago_em_atraso")
    .reduce((total, conta) => total + conta.valor, 0);
  
  const totalAPagar = contasPagar
    .filter(conta => conta.status === "em_aberto")
    .reduce((total, conta) => total + conta.valor, 0);
  
  const totalEmAtraso = contasPagar
    .filter(conta => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return conta.status === "em_aberto" && conta.dataVencimento < hoje;
    })
    .reduce((total, conta) => total + conta.valor, 0);

  function getStatusBadge(status: ContaPagar["status"], dataVencimento: Date) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const estaEmAtraso = dataVencimento < hoje;

    switch (status) {
      case "pago":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Pago
          </Badge>
        );
      case "pago_em_atraso":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Pago em atraso
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
          title="Total Pago"
          value={formatCurrency(totalPago)}
          icon="money"
          trend={totalPago > 0 ? "up" : "neutral"}
        />
        <SalesDashboardCard
          title="Total a Pagar"
          value={formatCurrency(totalAPagar)}
          icon="chart"
        />
        <SalesDashboardCard
          title="Total em Atraso"
          value={formatCurrency(totalEmAtraso)}
          icon="sales"
          trend={totalEmAtraso > 0 ? "down" : "neutral"}
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead>Data Vencimento</TableHead>
              <TableHead>Data Pagamento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : contasPagar.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhuma conta a pagar encontrada para este favorecido
                </TableCell>
              </TableRow>
            ) : (
              contasPagar.map((conta) => (
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
                  <TableCell>{conta.dataPagamento ? formatDate(conta.dataPagamento) : "-"}</TableCell>
                  <TableCell>{conta.descricao || "-"}</TableCell>
                  <TableCell>{getStatusBadge(conta.status, conta.dataVencimento)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
