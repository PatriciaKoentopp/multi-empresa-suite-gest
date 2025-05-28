
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Contrato } from "@/types/contratos";

interface ContratosTableProps {
  contratos: Contrato[];
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  onView: (contrato: Contrato) => void;
  onGenerateInvoices: (contrato: Contrato) => void;
  isLoading?: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ativo":
      return "default";
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
            <TableHead>Ações</TableHead>
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
                    Venc. dia {contrato.dia_vencimento}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(contrato.status)}>
                  {getStatusLabel(contrato.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(contrato)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(contrato)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGenerateInvoices(contrato)}
                    title="Gerar Contas a Receber"
                    disabled={contrato.status !== "ativo"}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(contrato)}
                    title="Excluir"
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
  );
}
