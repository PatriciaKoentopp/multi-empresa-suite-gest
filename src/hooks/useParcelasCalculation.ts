
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
  shouldRecalculate: boolean = true,
  parcelasExistentes?: Parcela[]
) {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  useEffect(() => {
    if (!valorTotal || !numParcelas || !primeiroVencimento) {
      setParcelas([]);
      return;
    }

    // Se existem parcelas e não devemos recalcular, manter as parcelas existentes
    if (parcelasExistentes && !shouldRecalculate) {
      setParcelas(parcelasExistentes);
      return;
    }

    // Sempre recalcular quando valorTotal ou numParcelas mudar
    if (valorTotal > 0 && numParcelas > 0) {
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
    }
  }, [valorTotal, numParcelas, primeiroVencimento, shouldRecalculate, parcelasExistentes]);

  const atualizarValorParcela = (index: number, novoValor: number) => {
    setParcelas(parcelasAntigas => {
      const novasParcelas = [...parcelasAntigas];
      novasParcelas[index] = {
        ...novasParcelas[index],
        valor: novoValor
      };
      return novasParcelas;
    });
  };

  return { parcelas, atualizarValorParcela };
}
