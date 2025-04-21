
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, ArrowDown } from "lucide-react";

interface Lead {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: number;
  valor: number;
  origem: string;
  dataCriacao: string;
  ultimoContato: string;
  responsavel: string;
}

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onDragStart: () => void;
}

export function LeadCard({ lead, onEdit, onDragStart }: LeadCardProps) {
  return (
    <Card 
      className="bg-white cursor-move hover:shadow-md transition-shadow border-l-4 border-l-blue-500 animate-fade-in"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-sm line-clamp-1">{lead.nome}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{lead.empresa}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-blue-500 hover:bg-blue-100 focus:bg-blue-100"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-3 w-3" />
            <span className="sr-only">Editar</span>
          </Button>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Valor:</span>
            <span className="font-medium">R$ {lead.valor.toLocaleString('pt-BR')}</span>
          </div>
          
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-600">Origem:</span>
            <span>{lead.origem}</span>
          </div>
          
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-600">Último contato:</span>
            <span>{lead.ultimoContato}</span>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-dashed flex justify-between items-center text-xs">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded-sm">{lead.responsavel}</span>
          <div className="flex items-center text-blue-500 gap-1 font-medium hover:underline">
            Mover
            <ArrowDown className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
