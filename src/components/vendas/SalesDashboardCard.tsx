
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";

interface SalesDashboardCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: "money" | "sales" | "users" | "chart" | "custom";
  className?: string;
}

export const SalesDashboardCard = ({
  title,
  value,
  description,
  trend = "neutral",
  trendValue,
  icon = "money",
  className,
}: SalesDashboardCardProps) => {
  // Determinando a cor com base no tipo de ícone
  const getIconColor = () => {
    switch (icon) {
      case "money":
        return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "sales":
        return "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "users":
        return "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "chart":
        return "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  // Determinando ícone com base no tipo
  const getIcon = () => {
    switch (icon) {
      case "money":
        return <DollarSign className="h-6 w-6" />;
      case "sales":
        return <ShoppingBag className="h-6 w-6" />;
      case "users":
        return <Users className="h-6 w-6" />;
      case "chart":
        return <TrendingUp className="h-6 w-6" />;
      default:
        return <DollarSign className="h-6 w-6" />;
    }
  };

  return (
    <Card className={cn("overflow-hidden shadow-md hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          {/* Cabeçalho com título */}
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          
          {/* Conteúdo principal */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn("p-2 rounded-lg", getIconColor())}>
                {getIcon()}
              </div>
              
              <div>
                <div className="text-2xl font-bold">
                  {value}
                </div>
                
                {description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {description}
                  </div>
                )}
              </div>
            </div>
            
            {/* Indicador de tendência */}
            {trend !== "neutral" && trendValue && (
              <div className={cn(
                "flex items-center text-sm font-medium px-2.5 py-1.5 rounded-full",
                trend === "up" 
                  ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
                  : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {trend === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                )}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
