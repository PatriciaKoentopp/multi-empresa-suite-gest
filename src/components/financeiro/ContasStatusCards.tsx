
import { formatCurrency } from "@/lib/utils";
import { DadosFinanceiros } from "@/types/financeiro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface ContasStatusCardsProps {
  dadosFinanceiros: DadosFinanceiros | null;
}

export const ContasStatusCards = ({ dadosFinanceiros }: ContasStatusCardsProps) => {
  const { isCardVisible } = useDashboardCards('painel-financeiro');
  
  const visibleCards = [
    isCardVisible('contas-vencidas-receber'),
    isCardVisible('contas-vencer-receber'),
    isCardVisible('contas-vencidas-pagar'),
    isCardVisible('contas-vencer-pagar')
  ].some(Boolean);

  if (!visibleCards) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Status de Contas</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isCardVisible('contas-vencidas-receber') && (
          <Card className="overflow-hidden border-red-200">
            <CardHeader className="bg-red-50 py-1 px-3">
              <CardTitle className="text-red-700 text-xs">Contas a Receber Vencidas</CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3">
              <div className="text-md font-bold text-blue-600">
                {formatCurrency(dadosFinanceiros?.contas_vencidas_receber || 0)}
              </div>
            </CardContent>
          </Card>
        )}
        
        {isCardVisible('contas-vencer-receber') && (
          <Card className="overflow-hidden border-blue-200">
            <CardHeader className="bg-blue-50 py-1 px-3">
              <CardTitle className="text-blue-700 text-xs">Contas a Receber a Vencer</CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3">
              <div className="text-md font-bold text-blue-600">
                {formatCurrency(dadosFinanceiros?.contas_a_vencer_receber || 0)}
              </div>
            </CardContent>
          </Card>
        )}
        
        {isCardVisible('contas-vencidas-pagar') && (
          <Card className="overflow-hidden border-red-200">
            <CardHeader className="bg-red-50 py-1 px-3">
              <CardTitle className="text-red-700 text-xs">Contas a Pagar Vencidas</CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3">
              <div className={`text-md font-bold ${dadosFinanceiros?.contas_vencidas_pagar === 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {formatCurrency(dadosFinanceiros?.contas_vencidas_pagar || 0)}
              </div>
            </CardContent>
          </Card>
        )}
        
        {isCardVisible('contas-vencer-pagar') && (
          <Card className="overflow-hidden border-blue-200">
            <CardHeader className="bg-blue-50 py-1 px-3">
              <CardTitle className="text-blue-700 text-xs">Contas a Pagar a Vencer</CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3">
              <div className={`text-md font-bold ${dadosFinanceiros?.contas_a_vencer_pagar === 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {formatCurrency(dadosFinanceiros?.contas_a_vencer_pagar || 0)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
