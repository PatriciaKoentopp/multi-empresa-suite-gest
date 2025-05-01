
import { ArrowUp, ArrowDown } from "lucide-react";

interface VariationDisplayProps {
  value: number | null;
}

export const VariationDisplay = ({ value }: VariationDisplayProps) => {
  if (value === null) return <span className="text-gray-400">-</span>;
  
  const isPositive = value > 0;
  const color = isPositive ? "text-green-600" : "text-red-500";
  const Icon = isPositive ? ArrowUp : ArrowDown;
  
  return (
    <div className={`flex items-center justify-end gap-1 ${color} font-medium`}>
      <Icon className="h-4 w-4" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
};
