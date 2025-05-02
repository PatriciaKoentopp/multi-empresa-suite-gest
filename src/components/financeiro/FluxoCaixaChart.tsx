
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FluxoCaixaItem } from "@/types/financeiro";
import { formatCurrency } from "@/lib/utils";

interface FluxoCaixaChartProps {
  data: FluxoCaixaItem[];
}

export const FluxoCaixaChart = ({ data }: FluxoCaixaChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Agrupar dados por data para o gráfico
    const groupedByDate = data.reduce((acc, item) => {
      const dateStr = format(new Date(item.data), 'yyyy-MM-dd');
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          data: dateStr,
          dataFormatada: format(new Date(item.data), 'dd/MM', { locale: ptBR }),
          entradas: 0,
          saidas: 0,
          saldo: 0
        };
      }
      
      if (item.tipo === 'entrada') {
        acc[dateStr].entradas += Number(item.valor);
      } else {
        acc[dateStr].saidas += Number(item.valor);
      }
      
      acc[dateStr].saldo = acc[dateStr].entradas - acc[dateStr].saidas;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Converter para array e ordenar por data
    const sortedData = Object.values(groupedByDate).sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    
    // Calcular saldo acumulado
    let saldoAcumulado = 0;
    const dataWithCumulativeSaldo = sortedData.map(item => {
      saldoAcumulado += item.saldo;
      return {
        ...item,
        saldoAcumulado
      };
    });
    
    setChartData(dataWithCumulativeSaldo);
  }, [data]);

  // Verificar se há dados para exibir
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular valores máximos e mínimos para melhor escala do gráfico
  const maxValue = Math.max(
    ...chartData.map(item => Math.max(item.entradas, item.saidas, item.saldoAcumulado))
  );
  const minValue = Math.min(
    ...chartData.map(item => Math.min(0, item.saldoAcumulado))
  );
  const domain = [minValue < 0 ? minValue * 1.1 : 0, maxValue * 1.1];

  // Personalizar tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-md shadow-md">
          <p className="font-bold">{label}</p>
          <p className="text-blue-600">
            Entradas: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-red-600">
            Saídas: {formatCurrency(payload[1].value)}
          </p>
          <p className="text-emerald-600 font-semibold">
            Saldo do dia: {formatCurrency(payload[0].value - payload[1].value)}
          </p>
          <p className="text-violet-700 font-semibold">
            Saldo acumulado: {formatCurrency(payload[2].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="dataFormatada" 
                tickMargin={10}
                height={50}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                width={80}
                domain={domain}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#888" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="saldoAcumulado"
                name="Saldo Acumulado"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
