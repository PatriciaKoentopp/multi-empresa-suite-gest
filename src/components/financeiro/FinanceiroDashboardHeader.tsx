
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
  return (
    <Button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="h-10"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      Atualizar
    </Button>
  );
};
