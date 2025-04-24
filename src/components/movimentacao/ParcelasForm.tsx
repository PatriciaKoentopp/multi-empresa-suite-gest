
import React from 'react';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: Date;
}

interface ParcelasFormProps {
  parcelas: Parcela[];
}

export function ParcelasForm({ parcelas }: ParcelasFormProps) {
  if (parcelas.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Parcelas</Label>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcelas.map((parcela) => (
              <TableRow key={parcela.numero}>
                <TableCell>{parcela.numero}</TableCell>
                <TableCell>{format(parcela.dataVencimento, "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-right">
                  {parcela.valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
