
import React, { useState, useMemo } from "react";
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
import { ChevronDown, ChevronRight } from "lucide-react";

interface FluxoFinanceiroTableProps {
  fluxoMensal: FluxoMensal[];
}

export const FluxoFinanceiroTable = ({ fluxoMensal }: FluxoFinanceiroTableProps) => {
  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({});

  // Agrupar dados por ano
  const dadosAgrupados = useMemo(() => {
    const porAno: {[key: number]: FluxoMensal[]} = {};
    
    fluxoMensal.forEach(mes => {
      if (!porAno[mes.ano]) {
        porAno[mes.ano] = [];
      }
      porAno[mes.ano].push(mes);
    });
    
    return porAno;
  }, [fluxoMensal]);
  
  // Dados resumidos por ano
  const resumoPorAno = useMemo(() => {
    const resumo: {
      ano: number;
      total_recebido: number;
      total_pago: number;
      saldo: number;
    }[] = [];
    
    Object.entries(dadosAgrupados).forEach(([ano, meses]) => {
      const anoNumerico = parseInt(ano);
      const totalRecebidoAno = meses.reduce((sum, mes) => sum + mes.total_recebido, 0);
      const totalPagoAno = meses.reduce((sum, mes) => sum + mes.total_pago, 0);
      const saldoAno = totalRecebidoAno - totalPagoAno;
      
      resumo.push({
        ano: anoNumerico,
        total_recebido: totalRecebidoAno,
        total_pago: totalPagoAno,
        saldo: saldoAno
      });
    });
    
    // Ordenar por ano (mais recente primeiro)
    return resumo.sort((a, b) => b.ano - a.ano);
  }, [dadosAgrupados]);

  // Calcular totais gerais
  const totalRecebido = resumoPorAno.reduce((sum, ano) => sum + ano.total_recebido, 0);
  const totalPago = resumoPorAno.reduce((sum, ano) => sum + ano.total_pago, 0);
  const saldoTotal = totalRecebido - totalPago;
  
  const toggleAnoExpansao = (ano: number) => {
    setExpandedYears(prev => ({
      ...prev,
      [ano]: !prev[ano]
    }));
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Fluxo Financeiro Mensal</h2>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Recebimentos</TableHead>
              <TableHead className="text-right">Pagamentos</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resumoPorAno.map((ano) => (
              <React.Fragment key={`ano-${ano.ano}`}>
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleAnoExpansao(ano.ano)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {expandedYears[ano.ano] ? (
                        <ChevronDown className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-blue-500" />
                      )}
                      {ano.ano}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(ano.total_recebido)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(ano.total_pago)}
                  </TableCell>
                  <TableCell 
                    className={`text-right font-medium ${ano.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(ano.saldo)}
                  </TableCell>
                </TableRow>
                
                {/* Mostrar meses do ano quando expandido */}
                {expandedYears[ano.ano] && dadosAgrupados[ano.ano]
                  .sort((a, b) => b.mes_numero - a.mes_numero) // Ordenar meses (mais recente primeiro)
                  .map((mes) => (
                    <TableRow key={`${mes.ano}-${mes.mes_numero}`} className="bg-muted/5">
                      <TableCell className="pl-8 font-normal">{mes.mes}/{mes.ano}</TableCell>
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
                  ))
                }
              </React.Fragment>
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
