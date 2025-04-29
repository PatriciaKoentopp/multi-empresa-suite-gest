
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, ShoppingBag } from "lucide-react";

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
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950">
            {icon === "money" && (
              <DollarSign className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            )}
            {icon === "sales" && (
              <ShoppingBag className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};
