
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Users } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | null;
  trendValue?: string;
  icon?: "leads" | "conversion" | "value";
  className?: string;
}

export function LeadsStatsCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon = "leads",
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              {trend && (
                <div
                  className={`flex items-center text-xs font-medium ${
                    trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {trend === "up" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {trendValue}
                </div>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              icon === "leads"
                ? "bg-blue-100 text-blue-600"
                : icon === "conversion"
                ? "bg-green-100 text-green-600"
                : "bg-yellow-100 text-yellow-600"
            }`}
          >
            <Users className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
