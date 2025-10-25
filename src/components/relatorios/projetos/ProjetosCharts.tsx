import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjetoCompleto } from "@/hooks/useRelatorioProjetos";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

interface Props {
  projetos: ProjetoCompleto[];
}

export function ProjetosCharts({ projetos }: Props) {
  const top10Receita = useMemo(() => 
    [...projetos]
      .filter(p => p.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10)
      .map(p => ({
        projeto: p.numeroProjeto,
        receita: p.receita,
        horas: p.totalHoras
      })),
    [projetos]
  );

  const scatterData = useMemo(() =>
    projetos
      .filter(p => p.temVenda && p.temDadosFotos && p.totalHoras > 0)
      .map(p => ({
        horas: p.totalHoras,
        receita: p.receita,
        projeto: p.numeroProjeto
      })),
    [projetos]
  );

  if (top10Receita.length === 0 && scatterData.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {top10Receita.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Projetos por Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Receita}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="projeto" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => 
                    Number(value).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })
                  }
                />
                <Bar dataKey="receita" fill="hsl(var(--chart-1))" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {scatterData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Horas vs Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="horas" 
                  name="Horas" 
                  label={{ value: 'Horas', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="receita" 
                  name="Receita" 
                  label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Receita') {
                      return Number(value).toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      });
                    }
                    return value;
                  }}
                  labelFormatter={(label) => `Projeto: ${label}`}
                />
                <Scatter data={scatterData} fill="hsl(var(--chart-2))" name="Projeto" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
