
import { useState, useEffect } from "react";
import { addMonths } from "date-fns";

interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: Date;
}

export function useParcelasCalculation(
  valorTotal: number,
  numParcelas: number,
  primeiroVencimento?: Date,
  shouldRecalculate: boolean = true
) {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  useEffect(() => {
    if (!valorTotal || !numParcelas || !primeiroVencimento) {
      setParcelas([]);
      return;
    }

    // Se não devemos recalcular (ex: quando estamos carregando parcelas existentes), apenas retornamos
    if (!shouldRecalculate && parcelas.length > 0) {
      return;
    }

    const valorParcela = Number((valorTotal / numParcelas).toFixed(2));
    const ajusteCentavos = Number((valorTotal - (valorParcela * numParcelas)).toFixed(2));
    
    const novasParcelas: Parcela[] = [];
    
    for (let i = 0; i < numParcelas; i++) {
      novasParcelas.push({
        numero: i + 1,
        valor: i === 0 ? valorParcela + ajusteCentavos : valorParcela,
        dataVencimento: addMonths(primeiroVencimento, i)
      });
    }

    setParcelas(novasParcelas);
  }, [valorTotal, numParcelas, primeiroVencimento, shouldRecalculate]);

  return parcelas;
}
