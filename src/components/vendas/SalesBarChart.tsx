
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

interface SalesBarChartProps {
  data: {
    name: string;
    [key: string]: any;
  }[];
  className?: string;
  multiColor?: boolean;
  isMonthlyComparison?: boolean; // Nova propriedade para identificar o comparativo mensal
}

const CHART_COLORS = [
  "#4CAF50", // Verde
  "#2196F3", // Azul
  "#FFC107", // Amarelo
  "#9C27B0", // Roxo
  "#FF5722", // Laranja
  "#795548", // Marrom
  "#607D8B", // Azul Acinzentado
  "#E91E63", // Rosa
  "#3F51B5", // Índigo
  "#CDDC39", // Lima
  "#009688", // Verde-azulado
  "#FF9800"  // Âmbar
];

export const SalesBarChart = ({ 
  data, 
  className, 
  multiColor = false,
  isMonthlyComparison = false 
}: SalesBarChartProps) => {
  // Verificar se os dados estão presentes e em formato correto
  const chartData = Array.isArray(data) ? data : [];
  
  console.log("Dados do gráfico processados:", chartData);

  // Verificar se temos dados válidos para o gráfico
  if (!chartData.length) {
    console.warn("Sem dados válidos para o gráfico");
    return (
      <div className={className || "h-[300px] flex items-center justify-center"}>
        <p className="text-muted-foreground">Sem dados disponíveis para visualização</p>
      </div>
    );
  }

  // Identificar as chaves que representam valores (além de "name")
  const valueKeys = Object.keys(chartData[0]).filter(key => key !== "name");
  
  // Verificar se todos os valores são zero
  const allZeros = chartData.every(item => 
    valueKeys.every(key => item[key] === 0)
  );
  
  if (allZeros) {
    console.warn("Todos os valores do gráfico são zero");
    return (
      <div className={className || "h-[300px] flex items-center justify-center"}>
        <p className="text-muted-foreground">Sem dados de faturamento para o período selecionado</p>
      </div>
    );
  }

  // Formatador para valores em reais
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Definir a largura do gráfico com base no tipo de comparativo
  const chartHeight = 300;
  
  // Calcular a largura mínima para o gráfico mensal (50px por mês * número de meses)
  const minWidth = isMonthlyComparison ? Math.max(chartData.length * 100, 800) : '100%';
  
  // Calcular a largura da barra - mais estreita para comparativo mensal para manter proporção
  const barSize = isMonthlyComparison ? 20 : undefined;

  return (
    <div className={className}>
      <ChartContainer
        className={`h-[${chartHeight}px]`}
        config={{
          faturado: {
            label: "Faturado",
            color: "#4CAF50",
          },
        }}
      >
        {isMonthlyComparison ? (
          // Para o comparativo mensal, usar uma div com overflow para permitir scroll horizontal
          <div className="overflow-x-auto pb-4" style={{ width: '100%' }}>
            <div style={{ width: minWidth, height: `${chartHeight}px` }}>
              <BarChart
                data={chartData}
                width={chartData.length * 100}
                height={chartHeight}
                margin={{
                  top: 10,
                  right: 30,
                  left: 60,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={true}
                  tick={{ fontSize: 12 }}
                  height={40}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  content={({ payload, label }) => {
                    if (!payload || !payload.length) return null;
                    
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        <p className="font-medium mb-1">{label}</p>
                        {payload.map((entry, index) => (
                          <p 
                            key={`tooltip-item-${index}`} 
                            className="text-sm" 
                            style={{ color: entry.color }}
                          >
                            {entry.name}: {formatCurrency(Number(entry.value || 0))}
                          </p>
                        ))}
                      </div>
                    );
                  }} 
                />
                {/* Renderizar barras para cada ano no comparativo mensal */}
                {valueKeys.map((key, index) => (
                  <Bar
                    key={`bar-${key}`}
                    dataKey={key}
                    name={key}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    barSize={barSize}
                  />
                ))}
              </BarChart>
            </div>
          </div>
        ) : (
          // Para outros tipos de gráficos, usar ResponsiveContainer normal
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={true}
                tick={{ fontSize: 12 }}
                height={40}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                content={({ payload, label }) => {
                  if (!payload || !payload.length) return null;
                  
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="font-medium mb-1">{label}</p>
                      {payload.map((entry, index) => (
                        <p 
                          key={`tooltip-item-${index}`} 
                          className="text-sm" 
                          style={{ color: entry.color }}
                        >
                          {entry.name}: {formatCurrency(Number(entry.value || 0))}
                        </p>
                      ))}
                    </div>
                  );
                }} 
              />
              {multiColor ? (
                // Se temos múltiplas chaves de valor (anos diferentes ou categorias)
                valueKeys.map((key, index) => (
                  <Bar
                    key={`bar-${key}`}
                    dataKey={key}
                    name={key}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))
              ) : (
                <Bar
                  dataKey="faturado"
                  name="Faturado"
                  fill="#4CAF50"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
};
