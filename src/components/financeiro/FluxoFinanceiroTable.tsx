
import { formatCurrency } from "@/lib/utils";
import { FluxoMensal } from "@/types/financeiro";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";

interface FluxoFinanceiroTableProps {
  fluxoMensal: FluxoMensal[];
}

export const FluxoFinanceiroTable = ({ fluxoMensal }: FluxoFinanceiroTableProps) => {
  // Calcular totais
  const totalRecebido = fluxoMensal.reduce((sum, mes) => sum + mes.total_recebido, 0);
  const totalPago = fluxoMensal.reduce((sum, mes) => sum + mes.total_pago, 0);
  const saldoTotal = totalRecebido - totalPago;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Fluxo Financeiro Mensal</h2>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Recebimentos</TableHead>
              <TableHead className="text-right">Pagamentos</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fluxoMensal.map((mes) => (
              <TableRow key={`${mes.ano}-${mes.mes_numero}`}>
                <TableCell className="font-medium">{mes.mes}/{mes.ano}</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(mes.total_recebido)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(mes.total_pago)}
                </TableCell>
                <TableCell 
                  className={`text-right font-medium ${mes.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(mes.saldo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(totalRecebido)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totalPago)}</TableCell>
              <TableCell 
                className={`text-right font-medium ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(saldoTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};
