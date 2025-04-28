
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
        // Para garantir que a data seja exatamente a selecionada, usamos UTC e depois ajustamos o offset
        let novaData: Date;
        
        if (i === 0) {
          // Para a primeira parcela, usamos a data exata informada sem alterações
          novaData = new Date(primeiroVencimento);
        } else {
          // Para as demais parcelas, criamos uma nova data mantendo o mesmo dia
          const diaVenc = primeiroVencimento.getDate();
          const mesVenc = primeiroVencimento.getMonth() + i;
          const anoVenc = primeiroVencimento.getFullYear();
          
          // Criar data em UTC para evitar ajustes automáticos de timezone
          novaData = new Date(Date.UTC(anoVenc, mesVenc, diaVenc, 12, 0, 0));
          
          // Ajustar o offset do timezone local
          const offset = novaData.getTimezoneOffset() * 60000;
          novaData = new Date(novaData.getTime() + offset);
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
      
      // A novaData já deve vir corretamente tratada do componente DateInput
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
