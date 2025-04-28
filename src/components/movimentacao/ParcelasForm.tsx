
import React from 'react';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/movimentacao/DateInput";

interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: Date;
}

interface ParcelasFormProps {
  parcelas: Parcela[];
  onValorChange?: (index: number, valor: number) => void;
  onDataChange?: (index: number, data: Date) => void;
  readOnly?: boolean;
}

export function ParcelasForm({ parcelas, onValorChange, onDataChange, readOnly = false }: ParcelasFormProps) {
  if (parcelas.length === 0) return null;

  const handleValorChange = (index: number, valorString: string) => {
    if (!onValorChange) return;
    const valor = parseFloat(valorString.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    onValorChange(index, valor);
  };

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

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
            {parcelas.map((parcela, index) => (
              <TableRow key={parcela.numero}>
                <TableCell>{parcela.numero}</TableCell>
                <TableCell>
                  {readOnly ? (
                    format(parcela.dataVencimento, "dd/MM/yyyy")
                  ) : (
                    <DateInput
                      value={parcela.dataVencimento}
                      onChange={(date) => onDataChange && date && onDataChange(index, date)}
                      disabled={readOnly}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    formatarValor(parcela.valor)
                  ) : (
                    <Input
                      type="text"
                      value={formatarValor(parcela.valor)}
                      onChange={(e) => handleValorChange(index, e.target.value)}
                      className="text-right w-32 ml-auto"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
