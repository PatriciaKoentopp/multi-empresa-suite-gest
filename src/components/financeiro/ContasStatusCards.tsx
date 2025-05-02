
import { formatCurrency } from "@/lib/utils";
import { DadosFinanceiros } from "@/types/financeiro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContasStatusCardsProps {
  dadosFinanceiros: DadosFinanceiros | null;
}

export const ContasStatusCards = ({ dadosFinanceiros }: ContasStatusCardsProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Status de Contas</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Contas Vencidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(dadosFinanceiros?.contas_vencidas || 0)}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">A receber:</span>
                <span className="font-medium">
                  {formatCurrency(dadosFinanceiros?.contas_vencidas_receber || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">A pagar:</span>
                <span className="font-medium">
                  {formatCurrency(dadosFinanceiros?.contas_vencidas_pagar || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">Contas a Vencer</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(dadosFinanceiros?.contas_a_vencer || 0)}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">A receber:</span>
                <span className="font-medium">
                  {formatCurrency(dadosFinanceiros?.contas_a_vencer_receber || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">A pagar:</span>
                <span className="font-medium">
                  {formatCurrency(dadosFinanceiros?.contas_a_vencer_pagar || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
