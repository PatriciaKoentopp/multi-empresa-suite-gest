
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";

interface Antecipacao {
  id: string;
  data_lancamento: string;
  numero_documento?: string;
  descricao?: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel: number;
  status: string;
  tipo_operacao: string;
}

interface FavorecidoAntecipacoesTabProps {
  favorecidoId: string;
}

export function FavorecidoAntecipacoesTab({ favorecidoId }: FavorecidoAntecipacoesTabProps) {
  const { currentCompany } = useCompany();
  const [antecipacoes, setAntecipacoes] = useState<Antecipacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function carregarAntecipacoes() {
      if (!currentCompany?.id || !favorecidoId) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("antecipacoes")
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .eq("favorecido_id", favorecidoId)
          .order("data_lancamento", { ascending: false });

        if (error) {
          console.error("Erro ao carregar antecipações:", error);
          toast.error("Erro ao carregar antecipações");
          return;
        }

        const antecipacoesFormatadas = (data || []).map(item => ({
          id: item.id,
          data_lancamento: item.data_lancamento,
          numero_documento: item.numero_documento,
          descricao: item.descricao,
          valor_total: Number(item.valor_total),
          valor_utilizado: Number(item.valor_utilizado),
          valor_disponivel: Number(item.valor_total) - Number(item.valor_utilizado),
          status: item.status,
          tipo_operacao: item.tipo_operacao
        }));

        setAntecipacoes(antecipacoesFormatadas);
      } catch (error) {
        console.error("Erro ao carregar antecipações:", error);
        toast.error("Erro ao carregar antecipações");
      } finally {
        setIsLoading(false);
      }
    }

    carregarAntecipacoes();
  }, [currentCompany?.id, favorecidoId]);

  function formatData(data: string) {
    const dataObj = new Date(data + 'T12:00:00');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ativa":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Ativa
          </span>
        );
      case "utilizada":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Utilizada
          </span>
        );
      default:
        return status;
    }
  }

  function getTipoBadge(tipo: string) {
    switch (tipo) {
      case "receber":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Recebimento
          </span>
        );
      case "pagar":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Pagamento
          </span>
        );
      default:
        return tipo;
    }
  }

  const totalValorTotal = antecipacoes.reduce((soma, ant) => soma + ant.valor_total, 0);
  const totalValorUtilizado = antecipacoes.reduce((soma, ant) => soma + ant.valor_utilizado, 0);
  const totalValorDisponivel = antecipacoes.reduce((soma, ant) => soma + ant.valor_disponivel, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando antecipações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Antecipações</CardTitle>
      </CardHeader>
      <CardContent>
        {antecipacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma antecipação encontrada para este favorecido
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead>Número do Documento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right w-[120px]">Valor Total</TableHead>
                  <TableHead className="text-right w-[120px]">Valor Utilizado</TableHead>
                  <TableHead className="text-right w-[120px]">Valor Disponível</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {antecipacoes.map((antecipacao) => (
                  <TableRow key={antecipacao.id}>
                    <TableCell className="text-center">{formatData(antecipacao.data_lancamento)}</TableCell>
                    <TableCell>{getTipoBadge(antecipacao.tipo_operacao)}</TableCell>
                    <TableCell>{antecipacao.numero_documento || "-"}</TableCell>
                    <TableCell>{antecipacao.descricao || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(antecipacao.valor_total)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(antecipacao.valor_utilizado)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(antecipacao.valor_disponivel)}</TableCell>
                    <TableCell>{getStatusBadge(antecipacao.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {antecipacoes.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={4} className="font-bold text-right">Total</TableCell>
                  <TableCell className="font-bold text-right">{formatCurrency(totalValorTotal)}</TableCell>
                  <TableCell className="font-bold text-right">{formatCurrency(totalValorUtilizado)}</TableCell>
                  <TableCell className="font-bold text-right">{formatCurrency(totalValorDisponivel)}</TableCell>
                  <TableCell />
                </TableRow>
              )}
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
