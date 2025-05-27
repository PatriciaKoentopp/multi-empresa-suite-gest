
import React from "react";
import { formatCurrency } from "@/lib/utils";
import { FluxoCaixaItem } from "@/types/financeiro";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";

interface FluxoCaixaTableProps {
  fluxoCaixa: FluxoCaixaItem[];
  saldoInicial: number;
}

export const FluxoCaixaTable = ({ fluxoCaixa, saldoInicial }: FluxoCaixaTableProps) => {
  function formatDate(data?: Date) {
    if (!data) return "-";
    
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  }
  
  let saldoAcumulado = saldoInicial;
  const fluxoComSaldo = fluxoCaixa.map(item => {
    saldoAcumulado += item.valor;
    return {
      ...item,
      saldoAcumulado
    };
  });

  const totalEntradas = fluxoCaixa.filter(item => item.tipo === 'entrada').reduce((sum, item) => sum + item.valor, 0);
  const totalSaidas = fluxoCaixa.filter(item => item.tipo === 'saida').reduce((sum, item) => sum + Math.abs(item.valor), 0);
  const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Fluxo de Caixa</h2>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Favorecido</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Entrada</TableHead>
              <TableHead className="text-right">Saída</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fluxoComSaldo.length > 0 && (
              <TableRow className="bg-muted/20">
                <TableCell colSpan={5} className="font-medium">Saldo Inicial</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(saldoInicial)}
                </TableCell>
              </TableRow>
            )}
            
            {fluxoComSaldo.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  Nenhuma movimentação encontrada no período
                </TableCell>
              </TableRow>
            ) : (
              fluxoComSaldo.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.data)}</TableCell>
                  <TableCell>{item.favorecido || '-'}</TableCell>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell>{item.conta_nome}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      item.origem === 'antecipacao' ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' :
                      item.origem === 'movimentacao' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                      item.origem === 'contas_pagar' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                      item.origem === 'contas_receber' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                      'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                    }`}>
                      {item.origem === 'antecipacao' ? 'Antecipação' :
                       item.origem === 'movimentacao' ? 'Movimentação' :
                       item.origem === 'contas_pagar' ? 'Contas a Pagar' :
                       item.origem === 'contas_receber' ? 'Contas a Receber' :
                       item.origem || 'Outros'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {item.tipo === 'entrada' ? formatCurrency(item.valor) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {item.tipo === 'saida' ? formatCurrency(Math.abs(item.valor)) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.saldoAcumulado)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="font-medium">Totais do Período</TableCell>
              <TableCell className="text-right font-bold text-green-600">
                {formatCurrency(totalEntradas)}
              </TableCell>
              <TableCell className="text-right font-bold text-red-600">
                {formatCurrency(totalSaidas)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(saldoFinal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};
