
import { ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VariationDisplayProps {
  value: number | null;
  tooltip?: string;
  tipoConta?: string;
}

export const VariationDisplay = ({ value, tooltip, tipoConta }: VariationDisplayProps) => {
  // Se o valor for null ou undefined, mostramos o traço
  if (value === null || value === undefined) {
    return <span className="text-gray-400 block text-right">-</span>;
  }
  
  // Se o valor for zero, mostramos zero em cinza
  if (value === 0) return <span className="text-gray-500 block text-right">0,00%</span>;
  
  // Determinar se a variação é considerada positiva de acordo com o tipo de conta
  // Para despesas, uma variação negativa (redução) é considerada positiva
  // Para receitas, uma variação positiva (aumento) é considerada positiva
  let isPositiveEvaluation = false;
  
  if (tipoConta === "despesa" || 
      tipoConta === "custos" || 
      tipoConta === "deducoes" || 
      tipoConta === "distribuicao_lucros" || 
      tipoConta === "impostos") {
    // Para contas de despesa, custo, etc. (redutoras):
    // Se a variação for negativa (valor < 0), é uma avaliação positiva (despesas diminuíram)
    isPositiveEvaluation = value < 0;
  } else {
    // Para contas de receita:
    // Se a variação for positiva (valor > 0), é uma avaliação positiva (receitas aumentaram)
    isPositiveEvaluation = value > 0;
  }

  // Definir cor baseada na avaliação
  const color = isPositiveEvaluation ? "text-green-600" : "text-red-500";
  // Definir ícone baseado na direção da variação (não na avaliação)
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  
  // Formatar o valor com vírgula em vez de ponto decimal (padrão brasileiro)
  // Garantimos que sempre temos duas casas decimais, para valores como 6,75% ou 8,01%
  const formattedValue = Math.abs(value).toFixed(2).replace('.', ',');
  
  // Componente base de variação
  const VariationComponent = (
    <div className={`flex items-center justify-end gap-1 ${color} font-medium`}>
      <Icon className="h-4 w-4" />
      <span>{formattedValue}%</span>
    </div>
  );
  
  // Retornar com tooltip se for fornecido
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {VariationComponent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Retornar sem tooltip se não for fornecido
  return VariationComponent;
};
