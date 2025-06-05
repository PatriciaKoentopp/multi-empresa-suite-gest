
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Edit, Trash2 } from "lucide-react";

interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  valor?: number;
  produto?: string;
}

interface LeadCardProps {
  lead: Lead;
  etapaNome: string;
  etapaCor: string;
  origemNome: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function LeadCard({ 
  lead, 
  etapaNome, 
  etapaCor, 
  origemNome, 
  onEdit, 
  onDelete 
}: LeadCardProps) {
  const valorFormatado = (lead.valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-1" style={{ backgroundColor: etapaCor }}></div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base truncate">{lead.nome}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {lead.empresa || 'Empresa não informada'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={onEdit} className="text-blue-600">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Etapa:</span>
            <span className="font-medium">{etapaNome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">{valorFormatado}</span>
          </div>
          {lead.produto && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produto:</span>
              <span className="font-medium truncate ml-2">{lead.produto}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 p-3 text-xs text-muted-foreground">
        <span>Origem: {origemNome}</span>
      </CardFooter>
    </Card>
  );
}
