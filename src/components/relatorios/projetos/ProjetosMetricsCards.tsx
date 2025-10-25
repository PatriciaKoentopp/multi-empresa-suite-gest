import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricasProjetos } from "@/hooks/useRelatorioProjetos";
import { formatHoursMinutes } from "@/utils/timeUtils";
import { TrendingUp, DollarSign, Camera, Clock } from "lucide-react";

interface Props {
  metrics: MetricasProjetos;
  projetosCompletos: number;
  projetosSemVenda: number;
  projetosSemFotos: number;
}

export function ProjetosMetricsCards({ 
  metrics, 
  projetosCompletos, 
  projetosSemVenda, 
  projetosSemFotos 
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Total de Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalProjetos}</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="default" className="bg-green-500">{projetosCompletos} completos</Badge>
            {projetosSemVenda > 0 && (
              <Badge variant="secondary">{projetosSemVenda} sem venda</Badge>
            )}
            {projetosSemFotos > 0 && (
              <Badge variant="outline">{projetosSemFotos} sem fotos</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Receita Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.totalReceita.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Média: {metrics.receitaMedia.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Total de Fotos Vendidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalFotos}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Valor médio/foto: {metrics.valorMedioPorFoto > 0 
              ? metrics.valorMedioPorFoto.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })
              : 'N/A'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Total de Horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHoursMinutes(metrics.totalHoras)}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Valor médio/hora: {metrics.valorMedioPorHora > 0
              ? metrics.valorMedioPorHora.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })
              : 'N/A'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor/Foto (Média)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.valorMedioPorFoto > 0
              ? metrics.valorMedioPorFoto.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Projetos completos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Horas/Foto (Média)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.horasMediasPorFoto > 0
              ? formatHoursMinutes(metrics.horasMediasPorFoto)
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tempo médio de produção
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
