
import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAnaliseDetalheConta } from "@/hooks/useAnaliseDetalheConta";

/**
 * Página para análise do cálculo da média na página analise-dre
 */
export default function AnaliseCalculoPage() {
  const { analisarContaLuz, resultado } = useAnaliseDetalheConta();

  useEffect(() => {
    // Executa a análise ao carregar a página
    analisarContaLuz();
  }, []);

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise do Cálculo da Média na Página analise-dre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="font-medium mb-2">Valores da conta Luz:</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>março/2023 = -148,45</li>
              <li>abril/2023 = -82,83</li>
              <li>maio/2023 = 0</li>
              <li>junho/2023 = -210,75</li>
              <li>julho/2023 = 0</li>
              <li>agosto/2023 = -193,90</li>
              <li>setembro/2023 = -84,64</li>
              <li>outubro/2023 = -84,14</li>
              <li>novembro/2023 = -93,47</li>
              <li>dezembro/2023 = -84,76</li>
              <li>janeiro/2024 = -198,53</li>
              <li>fevereiro/2024 = -279,98</li>
            </ul>
          </div>

          <div className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
            {resultado}
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            <h4 className="font-medium">Conclusão:</h4>
            <p className="mt-2">
              Após analisar várias formas de calcular a média, concluímos que o sistema deve considerar todos os meses no cálculo, 
              incluindo aqueles com valor zero. A função <code>calcularMedia</code> foi atualizada para incluir todos os valores no cálculo.
            </p>
            <p className="mt-2">
              Anteriormente, o sistema excluía os períodos com valores zero antes de calcular a média, o que alterava o resultado final.
              Com a correção, a média será calculada considerando o número total de meses no período, resultando em um valor mais preciso de -121,79.
            </p>
            
            <h4 className="font-medium mt-4">Explicação do cálculo:</h4>
            <p className="mt-2">
              Na página analise-dre, o sistema busca os valores das contas nos últimos 12 meses e calcula a média desses valores.
              O processo é o seguinte:
            </p>
            <ol className="list-decimal pl-6 space-y-1 mt-2">
              <li>O sistema busca todas as movimentações na tabela fluxo_caixa dentro do período selecionado (12 meses)</li>
              <li>As movimentações são agrupadas por conta contábil (por exemplo, "Luz")</li>
              <li>Para cada conta, os valores mensais são somados e então divididos pelo número total de meses (12)</li>
              <li>É importante incluir os meses com valor zero no cálculo para obter uma média correta</li>
              <li>Fórmula: Média = Soma dos valores / Número total de meses (incluindo os meses sem movimentação)</li>
            </ol>
            
            <div className="bg-blue-50 p-3 rounded-md mt-4 border border-blue-200">
              <p className="text-blue-800 font-medium">
                Exemplo para a conta Luz:
              </p>
              <p className="mt-1 text-blue-700">
                Cálculo = (-148,45 + -82,83 + 0 + -210,75 + 0 + -193,90 + -84,64 + -84,14 + -93,47 + -84,76 + -198,53 + -279,98) ÷ 12
              </p>
              <p className="mt-1 text-blue-700">
                = -1461,45 ÷ 12 = -121,79
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
