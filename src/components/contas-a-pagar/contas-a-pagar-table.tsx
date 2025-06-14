
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
import { Edit, Download, Trash2, MoreHorizontal, Eye, Undo, RefreshCw, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency } from "@/lib/utils";

export interface ContaPagar {
  id: string;
  movimentacao_id: string;
  favorecido: string;
  descricao: string;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: "pago" | "pago_em_atraso" | "em_aberto";
  valor: number;
  numeroParcela: number;
  numeroTitulo?: string;
  multa?: number;
  juros?: number;
  desconto?: number;
  contaCorrenteId?: string;
  formaPagamento?: string;
}

interface ContasAPagarTableProps {
  contas: ContaPagar[];
  onEdit: (conta: ContaPagar) => void;
  onBaixar: (conta: ContaPagar) => void;
  onDelete: (id: string) => void;
  onVisualizar: (conta: ContaPagar) => void;
  onDesfazerBaixa: (conta: ContaPagar) => void;
  onRenegociar: (conta: ContaPagar) => void;
  onVisualizarBaixa?: (conta: ContaPagar) => void;
}

function getStatusBadge(status: ContaPagar["status"], dataVencimento: Date) {
  // Verificar se está vencido (data de vencimento menor que a data atual)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Resetar horas para comparação apenas de data
  const estaVencido = dataVencimento < hoje;

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
      if (estaVencido) {
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
            Em Aberto
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Em Aberto
          </span>
        );
      }
    default:
      return status;
  }
}

export function ContasAPagarTable({ 
  contas, 
  onEdit, 
  onBaixar, 
  onDelete,
  onVisualizar,
  onDesfazerBaixa,
  onRenegociar,
  onVisualizarBaixa
}: ContasAPagarTableProps) {
  const totalValor = contas.reduce((soma, conta) => soma + (conta.valor || 0), 0);

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data de Vencimento</TableHead>
            <TableHead>Data de Pagamento</TableHead>
            <TableHead>Parcela</TableHead>
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
                <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                <TableCell>{formatDate(conta.dataPagamento)}</TableCell>
                <TableCell>
                  <span className="block font-mono text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                    {`${conta.numeroTitulo || '-'}/${conta.numeroParcela}`}
                  </span>
                </TableCell>
                <TableCell>{conta.favorecido}</TableCell>
                <TableCell>{conta.descricao}</TableCell>
                <TableCell>{getStatusBadge(conta.status, conta.dataVencimento)}</TableCell>
                <TableCell>{formatCurrency(conta.valor)}</TableCell>
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
                      
                      {conta.status === 'em_aberto' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onEdit(conta)}
                            className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRenegociar(conta)}
                            className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Renegociar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onBaixar(conta)}
                            className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                          >
                            <Download className="h-4 w-4" />
                            Baixar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(conta.movimentacao_id)}
                            className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}

                      {(conta.status === 'pago' || conta.status === 'pago_em_atraso') && conta.dataPagamento && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onVisualizarBaixa ? onVisualizarBaixa(conta) : null}
                            className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                            Visualizar Baixa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDesfazerBaixa(conta)}
                            className="flex items-center gap-2 text-orange-500 focus:bg-orange-100 focus:text-orange-700"
                          >
                            <Undo className="h-4 w-4" />
                            Desfazer Baixa
                          </DropdownMenuItem>
                        </>
                      )}
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
