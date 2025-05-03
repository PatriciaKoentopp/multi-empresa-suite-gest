
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
import { Edit, MoreHorizontal, Eye, Trash, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ContaPagar } from "../contas-a-pagar/contas-a-pagar-table";
import { formatDate, formatCurrency } from "@/lib/utils";

interface MovimentacaoTableProps {
  movimentacoes: ContaPagar[];
  onEdit: (movimentacao: ContaPagar) => void;
  onDelete: (id: string) => void;
  onVisualizar: (movimentacao: ContaPagar) => void;
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
  // Ordenar movimentações por data de vencimento ou pagamento (mais recente primeiro)
  const sortedMovimentacoes = [...movimentacoes].sort((a, b) => {
    const dateA = a.dataPagamento ? new Date(a.dataPagamento).getTime() : 
                 a.dataVencimento ? new Date(a.dataVencimento).getTime() : 0;
    const dateB = b.dataPagamento ? new Date(b.dataPagamento).getTime() : 
                 b.dataVencimento ? new Date(b.dataVencimento).getTime() : 0;
    return dateB - dateA; // Ordem decrescente (mais recente primeiro)
  });

  const totalValor = movimentacoes.reduce((soma, movimentacao) => soma + (movimentacao.valor || 0), 0);

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data de Lançamento</TableHead>
            <TableHead>Título/Parcela</TableHead>
            <TableHead>Favorecido</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ref.</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="w-[60px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMovimentacoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            sortedMovimentacoes.map((movimentacao) => (
              <TableRow key={movimentacao.id}>
                <TableCell>{formatDate(movimentacao.dataPagamento || movimentacao.dataVencimento)}</TableCell>
                <TableCell>
                  {(movimentacao.numeroTitulo || movimentacao.numeroParcela) ? (
                    <span className="block font-mono text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                      {`${movimentacao.numeroTitulo || '-'}/${movimentacao.numeroParcela || '1'}`}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{movimentacao.favorecido}</TableCell>
                <TableCell>{movimentacao.descricao}</TableCell>
                <TableCell>{(movimentacao as any).mes_referencia || "-"}</TableCell>
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
                      
                      {(movimentacao as any).documento_pdf && (
                        <>
                          <DropdownMenuItem
                            onClick={() => window.open((movimentacao as any).documento_pdf, '_blank')}
                            className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                            Ver documento
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
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
            <TableCell colSpan={6} className="font-bold text-right">Total</TableCell>
            <TableCell className="font-bold">{formatCurrency(totalValor)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
