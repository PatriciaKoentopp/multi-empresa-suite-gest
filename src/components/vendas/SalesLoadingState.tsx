
import { Loader2 } from "lucide-react";

export const SalesLoadingState = () => {
  return (
    <div className="flex items-center justify-center h-full w-full py-24">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Carregando dados de vendas...</p>
      </div>
    </div>
  );
};
