
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/movimentacao/DateInput";
import { formatCurrency } from "@/lib/utils";

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
  mostrarAlertaDiferenca?: boolean;
  valorTotal?: number;
  somaParcelas?: number;
}

export function ParcelasForm({ 
  parcelas, 
  onValorChange, 
  onDataChange, 
  readOnly = false,
  mostrarAlertaDiferenca = false,
  valorTotal = 0,
  somaParcelas = 0
}: ParcelasFormProps) {
  if (parcelas.length === 0) return null;
  
  // Estado local para rastrear os valores em edição
  const [valoresEmEdicao, setValoresEmEdicao] = useState<Record<number, string>>({});

  const handleValorChange = (index: number, valorString: string) => {
    if (!onValorChange) return;
    
    // Atualizar o estado local com o valor que está sendo digitado
    setValoresEmEdicao(prev => ({
      ...prev,
      [index]: valorString
    }));
    
    // Limpar o valor para processamento (remover símbolos de moeda, pontos, etc)
    const valorLimpo = valorString.replace(/[^\d,]/g, '');
    
    // Se o valor for válido para conversão, atualizar o valor real
    if (valorLimpo && valorLimpo !== ',') {
      const valorNumerico = parseFloat(valorLimpo.replace(',', '.')) || 0;
      onValorChange(index, valorNumerico);
    }
  };

  // Esta função é chamada quando a data é alterada pelo componente DateInput
  const handleDataChange = (index: number, data: Date) => {
    if (onDataChange && data) {
      // Garantir que a data tenha hora definida como meio-dia para evitar problemas com timezone
      const dataAjustada = new Date(data);
      dataAjustada.setHours(12, 0, 0, 0);
      onDataChange(index, dataAjustada);
    }
  };

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calcular diferença para mostrar alerta
  const diferenca = valorTotal - somaParcelas;
  const temDiferenca = mostrarAlertaDiferenca && Math.abs(diferenca) > 0.01;

  return (
    <div className="space-y-2">
      <Label>Parcelas</Label>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right w-[120px]">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcelas.map((parcela, index) => (
              <TableRow key={parcela.numero}>
                <TableCell>{parcela.numero}</TableCell>
                <TableCell>
                  <DateInput
                    value={parcela.dataVencimento}
                    onChange={(date) => date && handleDataChange(index, date)}
                    disabled={readOnly}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="text"
                    value={
                      // Se o campo estiver em edição ativa, mostrar o valor sendo digitado
                      // Caso contrário, mostrar o valor formatado
                      valoresEmEdicao[index] !== undefined ? 
                        valoresEmEdicao[index] : 
                        formatarValor(parcela.valor)
                    }
                    onChange={(e) => handleValorChange(index, e.target.value)}
                    // Quando o campo perde o foco, resetar o estado de edição
                    onBlur={() => {
                      setValoresEmEdicao(prev => {
                        const newState = {...prev};
                        delete newState[index];
                        return newState;
                      });
                    }}
                    className="text-right w-32 ml-auto"
                    disabled={readOnly}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {temDiferenca && (
        <div className={`mt-2 p-2 rounded-md text-sm ${diferenca > 0 ? 'bg-red-50 text-red-700' : 'bg-red-50 text-red-700'}`}>
          <span className="font-medium">
            {diferenca > 0 
              ? `Faltam ${formatCurrency(diferenca)} para atingir o valor total`
              : `O valor total é excedido em ${formatCurrency(Math.abs(diferenca))}`}
          </span>
        </div>
      )}
    </div>
  );
}
