
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FinanceiroDashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const FinanceiroDashboardHeader = ({ 
  onRefresh, 
  isRefreshing = false 
}: FinanceiroDashboardHeaderProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Financeiro</h1>
        <p className="text-muted-foreground">
          Acompanhe os principais indicadores financeiros de {currentYear}
        </p>
      </div>
      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-10"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
    </div>
  );
};
