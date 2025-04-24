
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
import { Edit, MoreHorizontal, Eye, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ContaPagar } from "../contas-a-pagar/contas-a-pagar-table";

interface MovimentacaoTableProps {
  movimentacoes: ContaPagar[];
  onEdit: (movimentacao: ContaPagar) => void;
  onDelete: (id: string) => void;
  onVisualizar: (movimentacao: ContaPagar) => void;
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

function getTipoOperacao(tipo?: string) {
  switch (tipo) {
    case "pagar":
      return (
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
          Pagar
        </span>
      );
    case "receber":
      return (
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
          Receber
        </span>
      );
    case "transferencia":
      return (
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
          Transferência
        </span>
      );
    default:
      return tipo;
  }
}

export function MovimentacaoTable({ 
  movimentacoes, 
  onEdit, 
  onDelete,
  onVisualizar 
}: MovimentacaoTableProps) {
  const totalValor = movimentacoes.reduce((soma, movimentacao) => soma + (movimentacao.valor || 0), 0);

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data de Lançamento</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Favorecido</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="w-[60px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimentacoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            movimentacoes.map((movimentacao) => (
              <TableRow key={movimentacao.id}>
                <TableCell>{formatDateBR(movimentacao.dataVencimento)}</TableCell>
                <TableCell>
                  {movimentacao.numeroParcela ? (
                    <span className="block font-mono text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                      {movimentacao.numeroParcela}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{movimentacao.favorecido}</TableCell>
                <TableCell>{movimentacao.descricao}</TableCell>
                <TableCell>{getTipoOperacao(movimentacao.tipo_operacao)}</TableCell>
                <TableCell>{formatCurrency(movimentacao.valor)}</TableCell>
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
                        onClick={() => onVisualizar(movimentacao)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(movimentacao)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(movimentacao.id)}
                        className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
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
            <TableCell colSpan={5} className="font-bold text-right">Total</TableCell>
            <TableCell className="font-bold">{formatCurrency(totalValor)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
