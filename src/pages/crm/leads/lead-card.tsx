
import { useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Phone, Mail, Building, Calendar, User, Tag, MoveRight } from "lucide-react";
import { Origem, Usuario } from "@/types";

interface Lead {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: number;
  valor: number;
  origemId: string;
  dataCriacao: string;
  ultimoContato: string;
  responsavelId: string; // Atualizado para usar responsavelId
}

interface EtapaFunil {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}

interface LeadCardProps {
  lead: Lead;
  etapas: EtapaFunil[];
  origens: Origem[];
  usuarios: Usuario[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (leadId: number, etapaId: number) => void;
}

export function LeadCard({ lead, etapas, origens, usuarios, onEdit, onDelete, onMove }: LeadCardProps) {
  const etapa = useMemo(
    () => etapas.find((e) => e.id === lead.etapaId) || etapas[0],
    [lead.etapaId, etapas]
  );

  // Buscar a origem pelo ID
  const origem = useMemo(
    () => origens.find((o) => o.id === lead.origemId)?.nome || "Desconhecida",
    [lead.origemId, origens]
  );
  
  // Buscar o responsável pelo ID
  const responsavel = useMemo(
    () => usuarios.find((u) => u.id === lead.responsavelId)?.nome || "Não atribuído",
    [lead.responsavelId, usuarios]
  );

  const valorFormatado = lead.valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-1" style={{ backgroundColor: etapa.cor }}></div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-base">{lead.nome}</h3>
            <p className="text-xs text-muted-foreground">{lead.empresa}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100 h-6 w-6">
                <EllipsisVertical className="h-3 w-3" />
                <span className="sr-only">Abrir menu de ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-30 bg-white border">
              <DropdownMenuItem
                onClick={onEdit}
                className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
              >
                <span className="w-4 h-4 inline-flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </span>
                Editar
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2">
                  <MoveRight className="h-3 w-3" />
                  <span>Mover para...</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-white">
                    {etapas.filter(e => e.id !== lead.etapaId).map(etapa => (
                      <DropdownMenuItem 
                        key={etapa.id} 
                        onClick={() => onMove(lead.id, etapa.id)}
                        className="flex items-center gap-2"
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: etapa.cor }}></div>
                        <span>{etapa.nome}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={onDelete}
                className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
              >
                <span className="w-4 h-4 inline-flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM3.5 5C3.22386 5 3 5.22386 3 5.5C3 5.77614 3.22386 6 3.5 6H4V12C4 12.5523 4.44772 13 5 13H10C10.5523 13 11 12.5523 11 12V6H11.5C11.7761 6 12 5.77614 12 5.5C12 5.22386 11.7761 5 11.5 5H3.5ZM5 6H10V12H5V6Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </span>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-between text-xs mt-2">
          <span className="text-muted-foreground">Valor:</span>
          <span className="font-medium">{valorFormatado}</span>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 p-2 flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{responsavel}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
