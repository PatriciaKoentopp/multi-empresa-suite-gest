
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, DollarSign, Clock, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Parcela {
  id: string;
  cliente: string;
  descricao: string;
  dataVencimento: string;
  valor: number;
  status: 'em_aberto' | 'pago' | 'cancelado';
  numeroParcela?: string;
  origem?: string;
  movimentacao_id?: string;
  tipo?: string;
}

interface LeadInteracao {
  id: string;
  leadId: string;
  tipo: string;
  descricao: string;
  data: string;
  responsavelId?: string;
  responsavelNome?: string;
  status: string;
  leadNome: string;
  leadEmpresa?: string;
}

interface AlertsSectionProps {
  parcelasVencidas: Parcela[];
  parcelasHoje: Parcela[];
  interacoesPendentes: LeadInteracao[];
  isLoading: boolean;
}

export const AlertsSection = ({
  parcelasVencidas,
  parcelasHoje,
  interacoesPendentes,
  isLoading
}: AlertsSectionProps) => {
  const [activeTab, setActiveTab] = useState("vencidas");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  const totalAlertas = parcelasVencidas.length + parcelasHoje.length + interacoesPendentes.length;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const formatData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas
          </div>
          {totalAlertas > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalAlertas}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Acompanhe parcelas vencidas e interações pendentes
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {totalAlertas === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium">Nenhum alerta no momento</p>
              <p className="text-sm">Todos os pagamentos estão em dia!</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vencidas" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Vencidas ({parcelasVencidas.length})
              </TabsTrigger>
              <TabsTrigger value="hoje" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hoje ({parcelasHoje.length})
              </TabsTrigger>
              <TabsTrigger value="interacoes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Interações ({interacoesPendentes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vencidas" className="mt-4">
              {parcelasVencidas.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma parcela vencida
                </p>
              ) : (
                <div className="space-y-3">
                  {parcelasVencidas.slice(0, 5).map((parcela) => (
                    <Alert key={parcela.id} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{parcela.cliente}</span>
                        <Badge variant="outline">{formatCurrency(parcela.valor)}</Badge>
                      </AlertTitle>
                      <AlertDescription>
                        {parcela.descricao} - Vencimento: {formatData(parcela.dataVencimento)}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {parcelasVencidas.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      E mais {parcelasVencidas.length - 5} parcela(s) vencida(s)
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hoje" className="mt-4">
              {parcelasHoje.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma parcela vence hoje
                </p>
              ) : (
                <div className="space-y-3">
                  {parcelasHoje.slice(0, 5).map((parcela) => (
                    <Alert key={parcela.id}>
                      <Clock className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{parcela.cliente}</span>
                        <Badge variant="outline">{formatCurrency(parcela.valor)}</Badge>
                      </AlertTitle>
                      <AlertDescription>
                        {parcela.descricao} - Vence hoje
                      </AlertDescription>
                    </Alert>
                  ))}
                  {parcelasHoje.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      E mais {parcelasHoje.length - 5} parcela(s) que vencem hoje
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="interacoes" className="mt-4">
              {interacoesPendentes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma interação pendente
                </p>
              ) : (
                <div className="space-y-3">
                  {interacoesPendentes.slice(0, 5).map((interacao) => (
                    <Alert key={interacao.id}>
                      <Users className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{interacao.leadNome}</span>
                        <Badge variant="outline">{interacao.tipo}</Badge>
                      </AlertTitle>
                      <AlertDescription>
                        {interacao.descricao} - {formatData(interacao.data)}
                        {interacao.responsavelNome && (
                          <span className="block text-xs mt-1">
                            Responsável: {interacao.responsavelNome}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {interacoesPendentes.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      E mais {interacoesPendentes.length - 5} interação(ões) pendente(s)
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
