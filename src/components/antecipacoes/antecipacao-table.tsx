
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Trash2, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface Antecipacao {
  id: string;
  favorecido: string;
  tipoOperacao: "receber" | "pagar";
  dataAntecipacao: Date;
  valorTotal: number;
  valorUtilizado: number;
  valorDisponivel: number;
  descricao?: string;
  status: "ativa" | "utilizada" | "cancelada";
}

interface AntecipacaoTableProps {
  antecipacoes: Antecipacao[];
  onEdit: (antecipacao: Antecipacao) => void;
  onDelete: (id: string) => void;
  onVisualizar: (antecipacao: Antecipacao) => void;
  onCancelar: (antecipacao: Antecipacao) => void;
}

export function AntecipacaoTable({ 
  antecipacoes, 
  onEdit, 
  onDelete,
  onVisualizar,
  onCancelar
}: AntecipacaoTableProps) {
  function formatData(data: Date) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  }

  const totalValorTotal = antecipacoes.reduce((soma, ant) => soma + (ant.valorTotal || 0), 0);
  const totalValorUtilizado = antecipacoes.reduce((soma, ant) => soma + (ant.valorUtilizado || 0), 0);
  const totalValorDisponivel = antecipacoes.reduce((soma, ant) => soma + (ant.valorDisponivel || 0), 0);

  function getStatusBadge(status: Antecipacao["status"]) {
    switch (status) {
      case "ativa":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Ativa
          </span>
        );
      case "utilizada":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Utilizada
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
            Cancelada
          </span>
        );
      default:
        return status;
    }
  }

  function getTipoBadge(tipo: Antecipacao["tipoOperacao"]) {
    switch (tipo) {
      case "receber":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Recebimento
          </span>
        );
      case "pagar":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Pagamento
          </span>
        );
      default:
        return tipo;
    }
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Favorecido</TableHead>
            <TableHead className="w-[120px]">Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right w-[120px]">Valor Total</TableHead>
            <TableHead className="text-right w-[120px]">Valor Utilizado</TableHead>
            <TableHead className="text-right w-[120px]">Valor Disponível</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="text-center w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {antecipacoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                Nenhuma antecipação encontrada
              </TableCell>
            </TableRow>
          ) : (
            antecipacoes.map((antecipacao) => (
              <TableRow key={antecipacao.id}>
                <TableCell className="text-center">{formatData(antecipacao.dataAntecipacao)}</TableCell>
                <TableCell className="font-medium">{antecipacao.favorecido}</TableCell>
                <TableCell>{getTipoBadge(antecipacao.tipoOperacao)}</TableCell>
                <TableCell>{antecipacao.descricao || "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(antecipacao.valorTotal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(antecipacao.valorUtilizado)}</TableCell>
                <TableCell className="text-right">{formatCurrency(antecipacao.valorDisponivel)}</TableCell>
                <TableCell>{getStatusBadge(antecipacao.status)}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-neutral-500 hover:bg-gray-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                      <DropdownMenuItem
                        onClick={() => onVisualizar(antecipacao)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      
                      {antecipacao.status === 'ativa' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onEdit(antecipacao)}
                            className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCancelar(antecipacao)}
                            className="flex items-center gap-2 text-orange-500 focus:bg-orange-100 focus:text-orange-700"
                          >
                            <Ban className="h-4 w-4" />
                            Cancelar
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuItem
                        onClick={() => onDelete(antecipacao.id)}
                        className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                        disabled={antecipacao.valorUtilizado > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="font-bold text-right">Total</TableCell>
            <TableCell className="font-bold text-right">{formatCurrency(totalValorTotal)}</TableCell>
            <TableCell className="font-bold text-right">{formatCurrency(totalValorUtilizado)}</TableCell>
            <TableCell className="font-bold text-right">{formatCurrency(totalValorDisponivel)}</TableCell>
            <TableCell />
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
