
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Download, Trash2 } from "lucide-react";

export interface ContaPagar {
  id: string;
  favorecido: string;
  descricao: string;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: "pago" | "pago_em_atraso" | "em_aberto";
  valor: number;
}

interface ContasAPagarTableProps {
  contas: ContaPagar[];
  onEdit: (conta: ContaPagar) => void;
  onBaixar: (conta: ContaPagar) => void;
  onDelete: (id: string) => void;
}

function formatDateBR(date?: Date) {
  if (!date) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatCurrency(valor?: number) {
  if (valor === undefined) return "-";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function getStatusBadge(status: ContaPagar["status"]) {
  switch (status) {
    case "pago":
      return (
        <Badge
          className="bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
          variant="secondary"
        >
          Pago
        </Badge>
      );
    case "pago_em_atraso":
      return (
        <Badge
          className="bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
          variant="secondary"
        >
          Pago em Atraso
        </Badge>
      );
    case "em_aberto":
      return (
        <Badge
          className="bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
          variant="secondary"
        >
          Em Aberto
        </Badge>
      );
    default:
      return status;
  }
}

export function ContasAPagarTable({ contas, onEdit, onBaixar, onDelete }: ContasAPagarTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data de Vencimento</TableHead>
            <TableHead>Data de Pagamento</TableHead>
            <TableHead>Favorecido</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell>{formatDateBR(conta.dataVencimento)}</TableCell>
                <TableCell>{formatDateBR(conta.dataPagamento)}</TableCell>
                <TableCell>{conta.favorecido}</TableCell>
                <TableCell>{conta.descricao}</TableCell>
                <TableCell>{getStatusBadge(conta.status)}</TableCell>
                <TableCell>{formatCurrency(conta.valor)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                      onClick={() => onEdit(conta)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                      onClick={() => onBaixar(conta)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100 hover:text-red-700"
                      onClick={() => onDelete(conta.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

