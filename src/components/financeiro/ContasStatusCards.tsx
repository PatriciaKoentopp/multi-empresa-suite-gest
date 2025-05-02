
import { formatCurrency } from "@/lib/utils";
import { DadosFinanceiros } from "@/types/financeiro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContasStatusCardsProps {
  dadosFinanceiros: DadosFinanceiros | null;
}

export const ContasStatusCards = ({ dadosFinanceiros }: ContasStatusCardsProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Status de Contas</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </div>
  );
};
