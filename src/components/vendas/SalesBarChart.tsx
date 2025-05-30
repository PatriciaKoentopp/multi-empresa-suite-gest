
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

interface SalesBarChartProps {
  data: {
    name: string;
    [key: string]: any;
  }[];
  className?: string;
  multiColor?: boolean;
  isMonthlyComparison?: boolean;
  isYearlyServiceComparison?: boolean; // Nova propriedade
  valueKey?: string;
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
  isMonthlyComparison = false,
  isYearlyServiceComparison = false,
  valueKey = "faturado"
}: SalesBarChartProps) => {
  // Verificar se os dados estão presentes e em formato correto
  const chartData = Array.isArray(data) ? data : [];
  
  console.log("Dados do gráfico SalesBarChart:", chartData);

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
  let valueKeys: string[] = [];
  
  if (isYearlyServiceComparison) {
    // Para gráfico de vendas por serviço por ano, as chaves são os nomes dos serviços
    valueKeys = Object.keys(chartData[0]).filter(key => 
      key !== "name" && 
      key !== "total_vendas" && // Excluir chave de quantidade de vendas dos valueKeys
      !key.endsWith('_count') && // Excluir chaves de contagem
      typeof chartData[0][key] === 'number'
    );
  } else if (isMonthlyComparison) {
    // Para comparativo mensal, precisamos identificar corretamente os anos como chaves
    valueKeys = Object.keys(chartData[0]).filter(key => 
      key !== "name" && 
      key !== "variacao_percentual" && 
      key !== "variacao_ano_anterior" && 
      key !== "monthNumber" &&
      !isNaN(Number(key)) // Garantir que são apenas os anos (valores numéricos)
    ).sort((a, b) => Number(b) - Number(a)); // Ordenar anos em ordem decrescente
  } else {
    // Para outros tipos de gráfico
    valueKeys = valueKey ? 
      [valueKey] : 
      Object.keys(chartData[0]).filter(key => key !== "name");
  }
  
  console.log("Chaves de valores identificadas:", valueKeys);
  
  // Verificar se todos os valores são zero
  const allZeros = chartData.every(item => 
    valueKeys.every(key => !item[key] || item[key] === 0)
  );
  
  if (allZeros) {
    console.log("Todos os valores do gráfico são zero:", chartData);
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

  // Formatador para variação percentual
  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}%`;
  };

  // Definir a altura do gráfico
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
          [valueKey]: {
            label: valueKey === "ticket_medio" ? "Ticket Médio" : "Faturado",
            color: "#4CAF50",
          },
        }}
      >
        {isMonthlyComparison ? (
          // Para o comparativo mensal, usar uma div com overflow para permitir scroll horizontal
          <div className="overflow-x-auto pb-4" style={{ width: '100%' }}>
            <div style={{ width: minWidth, height: `${chartHeight}px`, minWidth: '800px' }}>
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
                <Legend />
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
              {(multiColor || isYearlyServiceComparison) && <Legend />}
              <Tooltip 
                content={({ payload, label }) => {
                  if (!payload || !payload.length) return null;
                  
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="font-medium mb-1">{isYearlyServiceComparison ? `Ano ${label}` : label}</p>
                      {payload.map((entry, index) => {
                        // Verificar se temos dados de projetos e variação para exibir
                        const itemData = chartData.find(d => d.name === label);
                        const showCount = valueKey === "ticket_medio" && itemData?.contagem_projetos;
                        const showVariacao = valueKey === "ticket_medio" && itemData?.variacao_percentual !== undefined;
                        const variacao = itemData?.variacao_percentual;
                        
                        // Para gráfico de vendas por serviço por ano, mostrar quantidade de vendas do serviço
                        const serviceName = entry.name;
                        const serviceCount = isYearlyServiceComparison && itemData ? itemData[`${serviceName}_count`] : null;
                        
                        return (
                          <div key={`tooltip-item-${index}`}>
                            <p 
                              className="text-sm" 
                              style={{ color: entry.color }}
                            >
                              {entry.name === "ticket_medio" ? "Ticket Médio" : entry.name}: {formatCurrency(Number(entry.value || 0))}
                            </p>
                            {/* Mostrar quantidade de vendas do serviço específico */}
                            {serviceCount && (
                              <p className="text-xs text-gray-600">
                                Quantidade: {serviceCount} {serviceCount === 1 ? 'venda' : 'vendas'}
                              </p>
                            )}
                            {showCount && (
                              <p className="text-xs text-gray-600">
                                Total de Projetos: {itemData.contagem_projetos}
                              </p>
                            )}
                            {showVariacao && variacao !== null && variacao !== undefined && (
                              <p className={`text-xs ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Variação: {formatPercent(variacao)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      {/* Mostrar quantidade total de vendas para gráfico de vendas por serviço por ano */}
                      {isYearlyServiceComparison && chartData.find(d => d.name === label)?.total_vendas && (
                        <p className="text-xs text-gray-600 mt-1 border-t pt-1">
                          Total de Vendas no Ano: {chartData.find(d => d.name === label)?.total_vendas}
                        </p>
                      )}
                    </div>
                  );
                }} 
              />
              {(multiColor && !isYearlyServiceComparison) || isYearlyServiceComparison ? (
                // Se temos múltiplas chaves de valor (anos diferentes, categorias ou serviços)
                valueKeys.map((key, index) => (
                  <Bar
                    key={`bar-${key}`}
                    dataKey={key}
                    name={key}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    stackId={isYearlyServiceComparison ? "services" : undefined}
                  />
                ))
              ) : (
                <Bar
                  dataKey={valueKey}
                  name={valueKey === "ticket_medio" ? "Ticket Médio" : "Faturado"}
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
