
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
  
  // Problema original: a variação percentual está sendo calculada incorretamente para despesas
  // Para despesas, uma redução (ex: de -280 para -230, variação de +50) deve aparecer como positiva
  // Para receitas, um aumento (ex: de 230 para 280, variação de +50) deve aparecer como positiva
  
  // O valor que recebemos já é a variação percentual calculada
  // Para despesas, invertemos o sinal para obter a interpretação semântica correta
  const displayValue = tipoConta === 'despesa' ? -value : value;
  
  // Determinar se a variação é positiva ou negativa após ajuste por tipo de conta
  const isPositive = displayValue > 0;
  
  // Formatar o valor com vírgula em vez de ponto decimal (padrão brasileiro)
  const formattedValue = Math.abs(value).toFixed(2).replace('.', ',');
  
  // Determinar cores e ícones com base no sinal do valor ajustado
  let color = isPositive ? "text-green-600" : "text-red-500";
  let Icon = isPositive ? ArrowUp : ArrowDown;
  
  // Determinar o sinal a ser mostrado (original, sem inverter)
  // Isso mostra o sinal correto na interface (+17,85% ou -17,85%)
  // mas a cor e o ícone são determinados pelo valor semanticamente correto (isPositive)
  const displaySign = value > 0 ? '+' : '-';
  
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
