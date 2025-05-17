
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
  
  // Para contas de despesa:
  // A fórmula já calcula a variação percentual corretamente:
  // (valorAtual - valorAnterior) / valorAnterior * 100
  // Para despesas:
  // - Se valorAtual (-230,45) e valorAnterior (-279,98)
  // - A variação = (-230,45 - (-279,98)) / (-279,98) * 100
  // - A variação = (+49,53) / (-279,98) * 100 = -17,69%
  // 
  // Como queremos que:
  // - Uma redução na despesa apareça como positiva (verde)
  // - Um aumento na despesa apareça como negativa (vermelho)
  // Invertemos o sinal do valor para despesas para obter a interpretação semântica correta
  
  const displayValue = tipoConta === 'despesa' ? -value : value;
  
  // Determinar se a variação é positiva ou negativa após ajuste por tipo de conta
  const isPositive = displayValue > 0;
  
  // Formatar o valor com vírgula em vez de ponto decimal (padrão brasileiro)
  const formattedValue = Math.abs(value).toFixed(2).replace('.', ',');
  
  // Determinar cores e ícones com base no sinal do valor ajustado
  let color = isPositive ? "text-green-600" : "text-red-500";
  let Icon = isPositive ? ArrowUp : ArrowDown;
  
  // Determinar o sinal a ser mostrado (original, sem inverter)
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
