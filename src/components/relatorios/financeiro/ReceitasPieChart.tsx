import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoriaFinanceira } from "@/hooks/useRelatorioFinanceiro";
import { TrendingUp } from "lucide-react";

interface ReceitasPieChartProps {
  categorias: CategoriaFinanceira[];
  loading?: boolean;
}

// Cores para as categorias de receitas
const CORES_RECEITAS = [
  "#22c55e", // verde
  "#10b981", // esmeralda
  "#14b8a6", // teal
  "#06b6d4", // ciano
  "#0ea5e9", // sky
  "#3b82f6", // azul
  "#6366f1", // indigo
  "#84cc16", // lima
  "#8b5cf6", // violeta
  "#a855f7", // roxo
];

export function ReceitasPieChart({ categorias, loading }: ReceitasPieChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalReceitas = categorias?.reduce((acc, cat) => acc + cat.total, 0) || 0;

  if (loading) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle>Receitas por Categoria</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <div className="animate-pulse h-[180px] w-[180px] rounded-full bg-muted"></div>
        </CardContent>
      </Card>
    );
  }

  if (!categorias || categorias.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle>Receitas por Categoria</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhuma receita no período</p>
        </CardContent>
      </Card>
    );
  }

  const data = categorias.map((cat, index) => ({
    name: cat.categoria_nome,
    value: cat.total,
    percentual: cat.percentual,
    color: CORES_RECEITAS[index % CORES_RECEITAS.length],
  }));

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle>Receitas por Categoria</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
            <p className="text-xs text-muted-foreground">{categorias.length} categorias</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico */}
          <div className="h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-green-600 font-semibold">{formatCurrency(item.value)}</p>
                          <p className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}% do total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda com valores */}
          <div className="flex flex-col justify-center space-y-2 max-h-[260px] overflow-y-auto pr-2">
            {data.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-medium">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
