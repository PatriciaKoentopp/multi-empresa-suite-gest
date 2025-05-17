
import { ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VariationDisplayProps {
  value: number | null;
  tooltip?: string;
  tipoConta?: 'receita' | 'despesa';
}

export const VariationDisplay = ({ value, tooltip, tipoConta = 'receita' }: VariationDisplayProps) => {
  // Se o valor for null ou undefined, mostramos o traço
  if (value === null || value === undefined) {
    return <span className="text-gray-400 block text-right">-</span>;
  }
  
  // Se o valor for zero, mostramos zero em cinza
  if (value === 0) return <span className="text-gray-500 block text-right">0,00%</span>;
  
  // Determinar o sinal real da variação (o que determina se aumentou ou diminuiu)
  const isPositive = value > 0;
  
  // Formatar o valor com vírgula em vez de ponto decimal (padrão brasileiro)
  const formattedValue = Math.abs(value).toFixed(2).replace('.', ',');
  
  // Para contas de despesa, invertemos a interpretação do sinal
  // Para receitas: variação positiva (verde/bom), variação negativa (vermelha/ruim)
  // Para despesas: variação positiva (vermelha/ruim), variação negativa (verde/bom)
  
  // Para despesas, um valor matematicamente positivo significa que a despesa aumentou (ruim)
  // Para despesas, um valor matematicamente negativo significa que a despesa diminuiu (bom)
  let color, Icon, displaySign;
  
  if (tipoConta === 'receita') {
    // Para receitas mantemos a lógica padrão
    color = isPositive ? "text-green-600" : "text-red-500";
    Icon = isPositive ? ArrowUp : ArrowDown;
    displaySign = isPositive ? '+' : '-';
  } else { // despesa
    // Para despesas invertemos a interpretação (não o sinal do número)
    color = isPositive ? "text-red-500" : "text-green-600";
    Icon = isPositive ? ArrowUp : ArrowDown;
    // Mantemos o sinal matemático real na exibição
    displaySign = isPositive ? '+' : '-';
  }
  
  // Componente base de variação
  const VariationComponent = (
    <div className={`flex items-center justify-end gap-1 ${color} font-medium`}>
      <Icon className="h-4 w-4" />
      <span>{displaySign}{formattedValue}%</span>
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
