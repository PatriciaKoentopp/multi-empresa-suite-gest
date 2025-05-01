
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
      
      // Definir a data base para cálculo (hoje ou data fornecida)
      const dataBase = primeiroVencimento ? new Date(primeiroVencimento) : new Date();
      
      for (let i = 0; i < numParcelas; i++) {
        let dataVencimento: Date;
        
        if (i === 0) {
          // Para a primeira parcela, usamos exatamente a data base
          // Criamos uma nova instância para evitar referências
          dataVencimento = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate());
        } else {
          // Para as demais parcelas, adicionamos meses
          const ano = dataBase.getFullYear();
          const mes = dataBase.getMonth() + i;
          const dia = dataBase.getDate();
          
          // Cria uma nova data com o mês incrementado
          dataVencimento = new Date(ano, mes, dia);
        }
        
        novasParcelas.push({
          numero: i + 1,
          valor: i === 0 ? valorParcela + ajusteCentavos : valorParcela,
          dataVencimento
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
    // Extrair apenas a data (sem horário)
    const ano = novaData.getFullYear();
    const mes = novaData.getMonth();
    const dia = novaData.getDate();
    
    // Criar uma data limpa sem horário
    const dataLimpa = new Date(ano, mes, dia);
    
    setParcelas(parcelasAntigas => {
      const novasParcelas = [...parcelasAntigas];
      novasParcelas[index] = {
        ...novasParcelas[index],
        dataVencimento: dataLimpa
      };
      return novasParcelas;
    });
  };

  // Calcula a soma total dos valores das parcelas
  const somaParcelas = parcelas.reduce((acc, parcela) => acc + parcela.valor, 0);
  
  return { parcelas, atualizarValorParcela, atualizarDataVencimento, somaParcelas };
}
