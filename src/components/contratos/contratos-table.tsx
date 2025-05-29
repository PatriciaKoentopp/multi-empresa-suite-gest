
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye, FileText, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Contrato } from "@/types/contratos";

interface ContratosTableProps {
  contratos: Contrato[];
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  onView: (contrato: Contrato) => void;
  onGenerateInvoices: (contrato: Contrato) => void;
  onChangeStatus: (contrato: Contrato, novoStatus: string) => void;
  isLoading?: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ativo":
      return "success";
    case "suspenso":
      return "secondary";
    case "encerrado":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ativo":
      return "Ativo";
    case "suspenso":
      return "Suspenso";
    case "encerrado":
      return "Encerrado";
    default:
      return status;
  }
};

const getPeriodicidadeLabel = (periodicidade: string) => {
  switch (periodicidade) {
    case "mensal":
      return "Mensal";
    case "trimestral":
      return "Trimestral";
    case "semestral":
      return "Semestral";
    case "anual":
      return "Anual";
    default:
      return periodicidade;
  }
};

export function ContratosTable({
  contratos,
  onEdit,
  onDelete,
  onView,
  onGenerateInvoices,
  onChangeStatus,
  isLoading = false,
}: ContratosTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p>Carregando contratos...</p>
      </div>
    );
  }

  if (contratos.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Nenhum contrato encontrado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Favorecido</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Valor Mensal</TableHead>
            <TableHead>Periodicidade</TableHead>
            <TableHead>Vigência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contratos.map((contrato) => (
            <TableRow key={contrato.id}>
              <TableCell className="font-medium">{contrato.codigo}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{contrato.favorecido?.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    {contrato.favorecido?.documento}
                  </div>
                </div>
              </TableCell>
              <TableCell>{contrato.servico?.nome}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(contrato.valor_mensal)}
              </TableCell>
              <TableCell>{getPeriodicidadeLabel(contrato.periodicidade)}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>
                    {format(new Date(contrato.data_inicio), "dd/MM/yyyy", { locale: ptBR })} a{" "}
                    {format(new Date(contrato.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="text-muted-foreground">
                    1º Venc.: {format(new Date(contrato.data_primeiro_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(contrato.status)}>
                  {getStatusLabel(contrato.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-neutral-500 hover:bg-gray-100">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 z-30 bg-white border">
                    <DropdownMenuItem 
                      onClick={() => onView(contrato)}
                      className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onEdit(contrato)}
                      className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onGenerateInvoices(contrato)}
                      disabled={contrato.status !== "ativo"}
                      className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Gerar Contas a Receber
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Opções de mudança de status */}
                    {contrato.status !== "ativo" && (
                      <DropdownMenuItem 
                        onClick={() => onChangeStatus(contrato, "ativo")}
                        className="flex items-center gap-2 text-green-600 focus:bg-green-100 focus:text-green-700"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Ativar
                      </DropdownMenuItem>
                    )}
                    
                    {contrato.status !== "suspenso" && (
                      <DropdownMenuItem 
                        onClick={() => onChangeStatus(contrato, "suspenso")}
                        className="flex items-center gap-2 text-yellow-600 focus:bg-yellow-100 focus:text-yellow-700"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Suspender
                      </DropdownMenuItem>
                    )}
                    
                    {contrato.status !== "encerrado" && (
                      <DropdownMenuItem 
                        onClick={() => onChangeStatus(contrato, "encerrado")}
                        className="flex items-center gap-2 text-orange-600 focus:bg-orange-100 focus:text-orange-700"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Encerrar
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => onDelete(contrato)}
                      className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
