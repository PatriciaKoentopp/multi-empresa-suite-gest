
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
  dataVencimento: Date;
  dataRecebimento?: Date;
  valor: number;
  status: "recebido" | "recebido_em_atraso" | "em_aberto";
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
          .select("id")
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

        // Obter os IDs das movimentações
        const movimentacoesIds = movimentacoes.map(m => m.id);

        // Buscar as parcelas associadas a essas movimentações
        const { data: parcelas, error: parcError } = await supabase
          .from("movimentacoes_parcelas")
          .select("*")
          .in("movimentacao_id", movimentacoesIds)
          .order("data_vencimento");

        if (parcError) {
          console.error("Erro ao buscar parcelas:", parcError);
          return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const contasReceberFormatadas: ContaReceber[] = (parcelas || []).map(parcela => {
          const dataVencimento = new Date(parcela.data_vencimento);
          const dataRecebimento = parcela.data_pagamento ? new Date(parcela.data_pagamento) : undefined;
          
          let status: ContaReceber["status"] = "em_aberto";
          
          if (dataRecebimento) {
            status = dataRecebimento > dataVencimento ? "recebido_em_atraso" : "recebido";
          } else if (dataVencimento < hoje) {
            status = "em_aberto"; // Em aberto e atrasado
          }

          return {
            id: parcela.id,
            numeroParcela: `${parcela.numero}`,
            dataVencimento,
            dataRecebimento,
            valor: parcela.valor,
            status
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

  const totalRecebido = contasReceber
    .filter(conta => conta.status === "recebido" || conta.status === "recebido_em_atraso")
    .reduce((total, conta) => total + conta.valor, 0);
  
  const totalAReceber = contasReceber
    .filter(conta => conta.status === "em_aberto")
    .reduce((total, conta) => total + conta.valor, 0);
  
  const totalEmAtraso = contasReceber
    .filter(conta => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return conta.status === "em_aberto" && conta.dataVencimento < hoje;
    })
    .reduce((total, conta) => total + conta.valor, 0);

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
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : contasReceber.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhuma conta a receber encontrada para este favorecido
                </TableCell>
              </TableRow>
            ) : (
              contasReceber.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell>{conta.numeroParcela}</TableCell>
                  <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                  <TableCell>{conta.dataRecebimento ? formatDate(conta.dataRecebimento) : "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell>
                  <TableCell>{getStatusBadge(conta.status, conta.dataVencimento)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
