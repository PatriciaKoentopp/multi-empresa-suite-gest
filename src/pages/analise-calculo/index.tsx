
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
              Após analisar várias formas de calcular a média, o valor de -119,36 mostrado pelo sistema 
              parece estar próximo da média calculada ignorando os meses com valor zero. Essa abordagem é 
              comum em análises financeiras para não "diluir" os custos reais incluindo períodos sem despesas.
            </p>
            <p className="mt-2">
              Na análise DRE, parece que o sistema está considerando apenas os meses onde a conta registrou
              movimentação, ignorando períodos onde não houve despesa (valor zero).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
