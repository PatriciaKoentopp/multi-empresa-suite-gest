import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { ProjetoCompleto } from "@/hooks/useRelatorioProjetos";

interface Props {
  projetos: ProjetoCompleto[];
}

interface DadosMensais {
  mes: string;
  valorPorFoto: number;
  horasPorFoto: number;
  qtdProjetos: number;
}

export function ProjetosTimelineVendidasCharts({ projetos }: Props) {
  const dadosTemporais = useMemo(() => {
    // Filtrar projetos válidos
    const projetosValidos = projetos.filter(
      (p) =>
        p.temVenda &&
        p.temDadosFotos &&
        p.dataVenda &&
        p.fotosVendidas > 0 &&
        p.receita > 0
    );

    if (projetosValidos.length < 2) {
      return [];
    }

    // Agrupar por mês/ano
    const projetosPorMes = new Map<string, ProjetoCompleto[]>();

    projetosValidos.forEach((projeto) => {
      try {
        const data = projeto.dataVenda instanceof Date ? projeto.dataVenda : parseISO(projeto.dataVenda!);
        const chaveMes = format(data, "yyyy-MM");
        
        if (!projetosPorMes.has(chaveMes)) {
          projetosPorMes.set(chaveMes, []);
        }
        projetosPorMes.get(chaveMes)!.push(projeto);
      } catch (error) {
        console.error("Erro ao processar data:", projeto.dataVenda, error);
      }
    });

    // Calcular médias mensais
    const dados: DadosMensais[] = Array.from(projetosPorMes.entries())
      .map(([chaveMes, projetosMes]) => {
        // Somar totais do mês usando FOTOS VENDIDAS
        const totalReceita = projetosMes.reduce((acc, p) => acc + p.receita, 0);
        const totalFotos = projetosMes.reduce((acc, p) => acc + p.fotosVendidas, 0);
        const totalHoras = projetosMes.reduce((acc, p) => acc + p.totalHoras, 0);

        const data = parseISO(chaveMes + "-01");

        return {
          mes: format(data, "MMM/yyyy", { locale: ptBR }),
          mesOrdenacao: chaveMes,
          valorPorFoto: totalFotos > 0 ? totalReceita / totalFotos : 0,
          horasPorFoto: totalFotos > 0 ? totalHoras / totalFotos : 0,
          qtdProjetos: projetosMes.length,
        };
      })
      .sort((a, b) => a.mesOrdenacao.localeCompare(b.mesOrdenacao));

    return dados;
  }, [projetos]);

  if (dadosTemporais.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Dados insuficientes para gerar análise temporal. São necessários pelo
        menos 2 meses com projetos vendidos.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.mes}</p>
          <p className="text-sm text-blue-600">
            Valor/Foto: R${" "}
            {data.valorPorFoto.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-green-600">
            Horas/Foto:{" "}
            {data.horasPorFoto.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            h
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.qtdProjetos} projeto{data.qtdProjetos !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ChartContainer
        className="h-[400px] w-full"
        config={{
          valorPorFoto: {
            label: "Valor por Foto Vendida (R$)",
            color: "#3b82f6",
          },
          horasPorFoto: {
            label: "Horas por Foto Vendida",
            color: "#10b981",
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dadosTemporais}
            margin={{ top: 20, right: 60, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="mes"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) =>
                `R$ ${value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`
              }
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) =>
                value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              }
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              formatter={(value) => {
                if (value === "valorPorFoto") return "Valor por Foto Vendida (R$)";
                if (value === "horasPorFoto") return "Horas por Foto Vendida";
                return value;
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="valorPorFoto"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="valorPorFoto"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="horasPorFoto"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="horasPorFoto"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
