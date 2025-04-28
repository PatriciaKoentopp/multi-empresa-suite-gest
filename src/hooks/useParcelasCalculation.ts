
import { useState, useEffect } from "react";

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

    // Recalcular quando os valores mudarem e shouldRecalculate for true
    if (shouldRecalculate && valorTotal > 0 && numParcelas > 0) {
      const valorParcela = Number((valorTotal / numParcelas).toFixed(2));
      const ajusteCentavos = Number((valorTotal - (valorParcela * numParcelas)).toFixed(2));
      
      const novasParcelas: Parcela[] = [];
      
      for (let i = 0; i < numParcelas; i++) {
        // Garantir que estamos usando o dia exato sem timezone issues
        const dataBase = new Date(primeiroVencimento);
        
        // Criar nova data para cada mês
        let novaData: Date;
        
        if (i === 0) {
          // Para a primeira parcela, usamos a data exata informada
          novaData = new Date(
            dataBase.getFullYear(),
            dataBase.getMonth(),
            dataBase.getDate(),
            12, 0, 0
          );
        } else {
          // Para as demais parcelas, adicionamos meses
          novaData = new Date(
            dataBase.getFullYear(),
            dataBase.getMonth() + i,
            dataBase.getDate(),
            12, 0, 0
          );
        }
        
        novasParcelas.push({
          numero: i + 1,
          valor: i === 0 ? valorParcela + ajusteCentavos : valorParcela,
          dataVencimento: novaData
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

  const atualizarDataVencimento = (index: number, novaData: Date) => {
    setParcelas(parcelasAntigas => {
      const novasParcelas = [...parcelasAntigas];
      
      // Manter a data exatamente como foi recebida - já garantimos que está com horário 12:00
      novasParcelas[index] = {
        ...novasParcelas[index],
        dataVencimento: novaData
      };
      return novasParcelas;
    });
  };

  // Calcula a soma total dos valores das parcelas
  const somaParcelas = parcelas.reduce((acc, parcela) => acc + parcela.valor, 0);
  
  return { parcelas, atualizarValorParcela, atualizarDataVencimento, somaParcelas };
}
