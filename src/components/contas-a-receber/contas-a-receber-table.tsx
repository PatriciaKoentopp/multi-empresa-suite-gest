import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Download, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface ContaReceber {
  id: string;
  cliente: string;
  descricao: string;
  dataVencimento: Date;
  dataRecebimento?: Date;
  valor: number;
  status: "recebido" | "recebido_em_atraso" | "em_aberto";
  numeroParcela: string;
  origem?: string;
}

interface ContasAReceberTableProps {
  contas: ContaReceber[];
  onEdit: (conta: ContaReceber) => void;
  onBaixar: (conta: ContaReceber) => void;
  onDelete: (id: string) => void;
  onVisualizar: (conta: ContaReceber) => void;
}

export function ContasAReceberTable({ 
  contas, 
  onEdit, 
  onBaixar, 
  onDelete,
  onVisualizar 
}: ContasAReceberTableProps) {
  function formatData(data?: Date) {
    if (!data) return "-";
    return format(data, "dd/MM/yyyy");
  }

  function getStatusColor(status: ContaReceber["status"]) {
    switch (status) {
      case "recebido":
        return "text-green-600";
      case "recebido_em_atraso":
        return "text-red-600";
      case "em_aberto":
        return "text-blue-600";
    }
  }

  function getStatusText(status: ContaReceber["status"]) {
    switch (status) {
      case "recebido":
        return "Recebido";
      case "recebido_em_atraso":
        return "Recebido em Atraso";
      case "em_aberto":
        return "Em Aberto";
    }
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Data Venc.</TableHead>
            <TableHead className="w-[120px]">Data Rec.</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right w-[120px]">Valor</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[120px]">Parcela</TableHead>
            <TableHead className="text-center w-[140px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                Nenhuma conta a receber encontrada
              </TableCell>
            </TableRow>
          ) : (
            contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="text-center">{formatData(conta.dataVencimento)}</TableCell>
                <TableCell className="text-center">{formatData(conta.dataRecebimento)}</TableCell>
                <TableCell className="font-medium">{conta.cliente}</TableCell>
                <TableCell>{conta.descricao}</TableCell>
                <TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell>
                <TableCell>
                  <span className={getStatusColor(conta.status)}>
                    {getStatusText(conta.status)}
                  </span>
                </TableCell>
                <TableCell className="text-center">{conta.numeroParcela}</TableCell>
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
                        onClick={() => onVisualizar(conta)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(conta)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onBaixar(conta)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(conta.id)}
                        className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                        disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
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
            <TableCell colSpan={7} className="font-bold text-right">Total</TableCell>
            <TableCell className="font-bold">{formatCurrency(contas.reduce((soma, conta) => soma + (conta.valor || 0), 0))}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
