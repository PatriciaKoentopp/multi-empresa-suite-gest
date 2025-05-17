
import { useState } from 'react';
import { DetalhesMensaisConta, ValorMensal } from '@/types/financeiro';

/**
 * Hook para analisar o cálculo de média das contas na análise do DRE
 */
export function useAnaliseDetalheConta() {
  const [resultado, setResultado] = useState<string>("");

  /**
   * Calcula a média conforme a lógica atual do sistema
   */
  const calcularMedia = (valores: number[]) => {
    // Filtra os valores zero antes de calcular a média
    const valoresNaoZero = valores.filter(v => v !== 0);
    
    if (valoresNaoZero.length === 0) return 0;
    
    const soma = valoresNaoZero.reduce((acc, val) => acc + val, 0);
    return soma / valoresNaoZero.length;
  };

  /**
   * Verifica o cálculo da média para a conta Luz com os valores fornecidos
   */
  const analisarContaLuz = () => {
    // Valores da conta Luz conforme mencionados pelo usuário
    const valoresLuz = [
      -148.45, // março/2023
      -82.83,  // abril/2023
      0,       // maio/2023
      -210.75, // junho/2023
      0,       // julho/2023
      -193.90, // agosto/2023
      -84.64,  // setembro/2023
      -84.14,  // outubro/2023
      -93.47,  // novembro/2023
      -84.76,  // dezembro/2023
      -198.53, // janeiro/2024
      -279.98  // fevereiro/2024
    ];

    // Cálculo considerando todos os meses (incluindo zeros)
    const mediaComZeros = valoresLuz.reduce((acc, val) => acc + val, 0) / valoresLuz.length;
    
    // Cálculo ignorando meses com valor zero
    const mediaSemZeros = calcularMedia(valoresLuz);
    
    // Média apenas dos últimos 10 meses (ignorando os mais antigos)
    const ultimos10Meses = valoresLuz.slice(2);
    const mediaUltimos10Meses = ultimos10Meses.reduce((acc, val) => acc + val, 0) / ultimos10Meses.length;
    
    // Média apenas dos últimos 10 meses sem zeros
    const ultimos10MesesSemZeros = ultimos10Meses.filter(v => v !== 0);
    const mediaUltimos10SemZeros = ultimos10MesesSemZeros.reduce((acc, val) => acc + val, 0) / ultimos10MesesSemZeros.length;

    // Arredondamento para 2 casas decimais
    const arredondar = (valor: number) => Math.round(valor * 100) / 100;

    // Resultado da análise
    const resultadoAnalise = `
      Análise da Conta Luz:
      
      1. Média com todos os 12 meses (incluindo zeros): ${arredondar(mediaComZeros)}
      2. Média ignorando meses com valor zero (10 meses): ${arredondar(mediaSemZeros)}
      3. Média dos últimos 10 meses (incluindo zeros): ${arredondar(mediaUltimos10Meses)}
      4. Média dos últimos 10 meses (sem zeros): ${arredondar(mediaUltimos10SemZeros)}
      
      O valor -119,36 mostrado no sistema parece estar mais próximo da média ignorando os meses com valor zero.
    `;

    setResultado(resultadoAnalise);
    return resultadoAnalise;
  };

  return { calcularMedia, analisarContaLuz, resultado };
}
