
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
            <p className="text-muted-foreground mt-2 text-sm">
              Total de contas a pagar e a receber com vencimento anterior a hoje
            </p>
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
            <p className="text-muted-foreground mt-2 text-sm">
              Total de contas a pagar e a receber com vencimento futuro
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
