
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, DollarSign, ShoppingBag } from "lucide-react";

interface SalesCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: "money" | "sales" | "custom";
  className?: string;
}

export const SalesCard = ({
  title,
  value,
  description,
  trend = "neutral",
  trendValue,
  icon = "money",
  className,
}: SalesCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 flex items-center h-12">
        <div className="p-1.5 mr-3 rounded-md bg-blue-50 dark:bg-blue-950">
          {icon === "money" && (
            <DollarSign className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          )}
          {icon === "sales" && (
            <ShoppingBag className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="text-lg font-semibold">
            {value}
          </div>
        </div>
        
        {description && (
          <span className="text-lg font-semibold text-muted-foreground mr-2">
            {description}
          </span>
        )}
        
        {trend !== "neutral" && trendValue && (
          <div className={cn(
            "flex items-center text-xs font-medium px-2 py-1 rounded-full",
            trend === "up" 
              ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
              : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
