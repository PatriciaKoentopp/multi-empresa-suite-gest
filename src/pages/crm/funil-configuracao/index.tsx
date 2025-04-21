
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";
import React from "react";

const etapasMock = [
  { id: 1, nome: "Prospecção", cor: "#0EA5E9", ordem: 1 },
  { id: 2, nome: "Contato Inicial", cor: "#F59E0B", ordem: 2 },
  { id: 3, nome: "Proposta Enviada", cor: "#10B981", ordem: 3 },
  { id: 4, nome: "Negociação", cor: "#8B5CF6", ordem: 4 },
  { id: 5, nome: "Fechamento", cor: "#F97316", ordem: 5 },
];

export default function FunilConfiguracaoPage() {
  return (
    <div className="max-w-3xl mx-auto my-10">
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Funil de Vendas (Kanban)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <span className="text-muted-foreground">Etapas do funil</span>
            <Button variant="blue" size="sm">
              <Plus className="mr-1" />
              Nova etapa
            </Button>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <table className="min-w-full divide-y divide-muted">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Etapa</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Cor</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Ordem</th>
                  <th className="px-4 py-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {etapasMock.map(etapa => (
                  <tr key={etapa.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2">{etapa.nome}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block w-5 h-5 rounded-full" style={{ background: etapa.cor }}></span>
                    </td>
                    <td className="px-4 py-2">{etapa.ordem}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
