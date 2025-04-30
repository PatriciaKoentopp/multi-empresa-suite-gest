
import { Card, CardContent } from "@/components/ui/card";
import { UsersRound } from "lucide-react";

interface FavorecidosCountCardProps {
  count: number;
  total: number;
}

export function FavorecidosCountCard({ count, total }: FavorecidosCountCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="flex items-center p-4 h-full">
        <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950 mr-3">
          <UsersRound className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">
            Favorecidos exibidos
          </div>
          <div className="text-2xl font-bold">
            {count} <span className="text-sm font-normal text-muted-foreground">de {total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
