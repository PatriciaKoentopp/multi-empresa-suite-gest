
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { ShoppingBag, Calculator, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FavorecidoVendasTabProps {
  favorecidoId: string;
}

interface Venda {
  id: string;
  codigo: string;
  data: Date;
  tipo: string;
  codigo_projeto?: string;
  valor_total: number;
}

export function FavorecidoVendasTab({ favorecidoId }: FavorecidoVendasTabProps) {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentCompany } = useCompany();

  useEffect(() => {
    const fetchVendas = async () => {
      if (!currentCompany || !favorecidoId) return;

      setIsLoading(true);
      try {
        // Primeiro, buscar os orçamentos/vendas
        const { data: orcamentos, error } = await supabase
          .from("orcamentos")
          .select("*")
          .eq("favorecido_id", favorecidoId)
          .eq("empresa_id", currentCompany.id)
          .eq("tipo", "venda")
          .order("data", { ascending: false });

        if (error) {
          console.error("Erro ao buscar vendas:", error);
          return;
        }

        // Para cada venda, buscar os itens para calcular o valor total
        const vendasCompletas = await Promise.all(
          (orcamentos || []).map(async (orcamento) => {
            const { data: itens } = await supabase
              .from("orcamentos_itens")
              .select("valor")
              .eq("orcamento_id", orcamento.id);

            const valorTotal = itens?.reduce(
              (total, item) => total + (item.valor || 0),
              0
            ) || 0;

            return {
              id: orcamento.id,
              codigo: orcamento.codigo,
              data: new Date(orcamento.data),
              tipo: orcamento.tipo,
              codigo_projeto: orcamento.codigo_projeto,
              valor_total: valorTotal,
            };
          })
        );

        setVendas(vendasCompletas);
      } catch (error) {
        console.error("Erro ao carregar vendas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendas();
  }, [currentCompany, favorecidoId]);

  const totalVendas = vendas.reduce((total, venda) => total + venda.valor_total, 0);
  const quantidadeVendas = vendas.length;
  const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <SalesDashboardCard
          title="Valor Total de Vendas"
          value={formatCurrency(totalVendas)}
          icon="sales"
        />
        <SalesDashboardCard
          title="Quantidade de Vendas"
          value={quantidadeVendas.toString()}
          icon="chart"
        />
        <SalesDashboardCard
          title="Ticket Médio"
          value={formatCurrency(ticketMedio)}
          icon="money"
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : vendas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhuma venda encontrada para este favorecido
                </TableCell>
              </TableRow>
            ) : (
              vendas.map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {venda.tipo === "venda" ? "Venda" : "Orçamento"}
                    </Badge>
                  </TableCell>
                  <TableCell>{venda.codigo}</TableCell>
                  <TableCell>{formatDate(venda.data)}</TableCell>
                  <TableCell>{venda.codigo_projeto || "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(venda.valor_total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
