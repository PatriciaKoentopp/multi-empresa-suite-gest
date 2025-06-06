
import React from 'react';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ContaReceber } from '@/types/financeiro';
import { LeadInteracao } from '@/pages/crm/leads/types';

interface AlertsSectionProps {
  parcelasVencidas: ContaReceber[];
  parcelasHoje: ContaReceber[];
  interacoesPendentes: LeadInteracao[];
  isLoading: boolean;
}

export function AlertsSection({ parcelasVencidas, parcelasHoje, interacoesPendentes, isLoading }: AlertsSectionProps) {
  const totalAlertas = parcelasVencidas.length + parcelasHoje.length + interacoesPendentes.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Carregando alertas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalAlertas === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            Alertas
          </CardTitle>
          <CardDescription>
            Nenhum alerta no momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 font-medium">✓ Tudo em dia!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Alertas ({totalAlertas})
        </CardTitle>
        <CardDescription>
          Itens que requerem sua atenção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parcelas Vencidas */}
        {parcelasVencidas.length > 0 && (
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {parcelasVencidas.length} título(s) em atraso
            </h4>
            <div className="mt-2 space-y-1">
              {parcelasVencidas.slice(0, 3).map(parcela => (
                <div key={parcela.id} className="text-sm text-gray-600">
                  {parcela.cliente} - {formatCurrency(parcela.valor)} - Venceu em {formatDate(new Date(parcela.data_vencimento))}
                </div>
              ))}
              {parcelasVencidas.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{parcelasVencidas.length - 3} outros...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parcelas que vencem hoje */}
        {parcelasHoje.length > 0 && (
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-medium text-yellow-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {parcelasHoje.length} título(s) vencem hoje
            </h4>
            <div className="mt-2 space-y-1">
              {parcelasHoje.slice(0, 3).map(parcela => (
                <div key={parcela.id} className="text-sm text-gray-600">
                  {parcela.cliente} - {formatCurrency(parcela.valor)}
                </div>
              ))}
              {parcelasHoje.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{parcelasHoje.length - 3} outros...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interações Pendentes */}
        {interacoesPendentes.length > 0 && (
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-blue-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {interacoesPendentes.length} interação(ões) pendente(s)
            </h4>
            <div className="mt-2 space-y-1">
              {interacoesPendentes.slice(0, 3).map(interacao => (
                <div key={interacao.id} className="text-sm text-gray-600">
                  {interacao.leadNome} - {interacao.tipo} - {formatDate(new Date(interacao.data))}
                </div>
              ))}
              {interacoesPendentes.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{interacoesPendentes.length - 3} outros...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
