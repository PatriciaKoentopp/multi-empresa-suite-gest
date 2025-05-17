
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
  
  // Determinar se a variação é positiva do ponto de vista de negócio
  // Para receitas: aumento (value > 0) é bom
  // Para despesas: aumento (value > 0) é ruim (pois significa que a despesa aumentou)
  // value > 0 significa que houve aumento, value < 0 significa que houve redução
  const isPositiveForBusiness = tipoConta === 'receita' ? value > 0 : value < 0;
  
  // Cor baseada na avaliação de negócio
  const color = isPositiveForBusiness ? "text-green-600" : "text-red-500";
  
  // Ícone baseado no valor REAL da variação, não na avaliação de negócio
  // Seta para cima quando o valor AUMENTOU (positivo)
  // Seta para baixo quando o valor DIMINUIU (negativo)
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  
  // Formatar o valor com vírgula em vez de ponto decimal (padrão brasileiro)
  // Garantimos que sempre temos duas casas decimais
  // Mostramos o valor absoluto, pois o sinal já é indicado pelo ícone
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
