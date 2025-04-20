
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Download, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface ContaPagar {
  id: string;
  favorecido: string;
  descricao: string;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: "pago" | "pago_em_atraso" | "em_aberto";
  valor: number;
  numeroParcela?: string; // novo campo para número/documento
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
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
          Pago
        </span>
      );
    case "pago_em_atraso":
      return (
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
          Pago em Atraso
        </span>
      );
    case "em_aberto":
      return (
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
          Em Aberto
        </span>
      );
    default:
      return status;
  }
}

export function ContasAPagarTable({ contas, onEdit, onBaixar, onDelete }: ContasAPagarTableProps) {
  const totalValor = contas.reduce((soma, conta) => soma + (conta.valor || 0), 0);

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data de Vencimento</TableHead>
            <TableHead>Data de Pagamento</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Favorecido</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="w-[60px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell>{formatDateBR(conta.dataVencimento)}</TableCell>
                <TableCell>{formatDateBR(conta.dataPagamento)}</TableCell>
                <TableCell>
                  {conta.numeroParcela ? (
                    <span className="block font-mono text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                      {conta.numeroParcela}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{conta.favorecido}</TableCell>
                <TableCell>{conta.descricao}</TableCell>
                <TableCell>{getStatusBadge(conta.status)}</TableCell>
                <TableCell>{formatCurrency(conta.valor)}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                      <DropdownMenuItem
                        onClick={() => onEdit(conta)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onBaixar(conta)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(conta.id)}
                        className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
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
            <TableCell colSpan={6} className="font-bold text-right">Total</TableCell>
            <TableCell className="font-bold">{formatCurrency(totalValor)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

