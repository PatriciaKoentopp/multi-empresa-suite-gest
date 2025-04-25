
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";

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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950">
          {icon === "money" && (
            <DollarSign className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          )}
          {icon === "sales" && (
            <ShoppingBag className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trendValue && (
          <div className="flex items-center mt-1">
            {trend === "up" ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-600 dark:text-green-500" />
            ) : trend === "down" ? (
              <TrendingDown className="mr-1 h-3 w-3 text-red-600 dark:text-red-500" />
            ) : null}
            <span
              className={cn(
                "text-xs",
                trend === "up" && "text-green-600 dark:text-green-500",
                trend === "down" && "text-red-600 dark:text-red-500"
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
