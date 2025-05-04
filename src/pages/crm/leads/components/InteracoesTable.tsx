
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRound, Eye, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import { LeadInteracao } from "../types";
import { getIconForInteraction } from "../utils/leadUtils";

interface InteracoesTableProps {
  interacoes: LeadInteracao[];
  onView: (interacao: LeadInteracao) => void;
  onEdit: (interacao: LeadInteracao) => void;
  onDelete: (interacao: LeadInteracao) => void;
  onToggleStatus: (interacao: LeadInteracao) => void;
  getNomeResponsavel: (id: string) => string;
}

export function InteracoesTable({ 
  interacoes, 
  onView, 
  onEdit, 
  onDelete,
  onToggleStatus,
  getNomeResponsavel
}: InteracoesTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interacoes.map((interacao) => (
              <TableRow key={interacao.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getIconForInteraction(interacao.tipo)}
                    <span className="capitalize">{interacao.tipo}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {interacao.descricao}
                </TableCell>
                <TableCell>{interacao.data}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <UserRound className="h-3 w-3 text-gray-500" />
                    <span>{interacao.responsavelNome || getNomeResponsavel(interacao.responsavelId)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    interacao.status === "Realizado" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {interacao.status === "Realizado" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Circle className="mr-1 h-3 w-3" />
                    )}
                    {interacao.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onView(interacao)}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEdit(interacao)}
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onToggleStatus(interacao)}
                      title={interacao.status === "Realizado" ? "Marcar como Aberto" : "Marcar como Realizado"}
                    >
                      {interacao.status === "Realizado" ? (
                        <Circle className="h-4 w-4 text-blue-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDelete(interacao)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
