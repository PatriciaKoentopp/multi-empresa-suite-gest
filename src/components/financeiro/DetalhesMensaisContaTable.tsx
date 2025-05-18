
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DetalhesMensaisConta, FiltroAnaliseDre } from "@/types/financeiro";
import { formatCurrency } from '@/lib/utils';

interface DetalhesMensaisContaTableProps {
  detalhes: DetalhesMensaisConta;
  filtro: FiltroAnaliseDre;
}

export const DetalhesMensaisContaTable = ({ detalhes, filtro }: DetalhesMensaisContaTableProps) => {
  // Se o tipo de comparação for média dos últimos meses, não exibimos a tabela
  if (filtro.tipo_comparacao === "media_12_meses") {
    return null;
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="text-lg">Detalhes Mensais: {detalhes.nome_conta}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detalhes.valores_mensais.map((valor, index) => (
              <TableRow key={index}>
                <TableCell>{valor.mes_nome}/{valor.ano}</TableCell>
                <TableCell className="text-right">{formatCurrency(valor.valor)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/20">
              <TableCell className="font-medium">Média</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(detalhes.media)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
