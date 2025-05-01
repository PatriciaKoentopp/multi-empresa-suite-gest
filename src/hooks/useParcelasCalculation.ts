
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
    if (!valorTotal || !numParcelas) {
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
      
      // Se não existe data de primeiro vencimento, usar a data atual
      const dataBase = primeiroVencimento ? new Date(primeiroVencimento) : new Date();
      
      for (let i = 0; i < numParcelas; i++) {
        let novaData: Date;
        
        if (i === 0) {
          // Para a primeira parcela, usamos a data exata informada ou a data atual
          novaData = new Date(dataBase);
        } else {
          // Para as demais parcelas, criamos uma nova data sem usar UTC para evitar problemas de timezone
          // Extrair os componentes da data base
          const diaVenc = dataBase.getDate();
          const mesBase = dataBase.getMonth();
          const anoBase = dataBase.getFullYear();
          
          // Calcular o novo mês e ano
          let novoMes = mesBase + i;
          let novoAno = anoBase;
          
          // Ajustar ano se o mês for maior que dezembro
          while (novoMes > 11) {
            novoMes -= 12;
            novoAno += 1;
          }
          
          // Criar a nova data sem ajustes de timezone
          novaData = new Date(novoAno, novoMes, diaVenc, 12, 0, 0);
          
          // Ajustar para o último dia do mês se o dia original não existir 
          // (por exemplo, 31 de janeiro + 1 mês = 28/29 de fevereiro)
          const ultimoDiaMes = new Date(novoAno, novoMes + 1, 0).getDate();
          if (diaVenc > ultimoDiaMes) {
            novaData = new Date(novoAno, novoMes, ultimoDiaMes, 12, 0, 0);
          }
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
