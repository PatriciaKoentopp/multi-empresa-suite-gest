
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Download, Trash2, RotateCcw, FileEdit, FileText } from "lucide-react";
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
  movimentacao_id?: string;
  multa?: number;
  juros?: number;
  desconto?: number;
  contaCorrenteId?: string;
  formaPagamento?: string;
}

interface ContasAReceberTableProps {
  contas: ContaReceber[];
  onEdit: (conta: ContaReceber) => void;
  onBaixar: (conta: ContaReceber) => void;
  onDelete: (id: string) => void;
  onVisualizar: (conta: ContaReceber) => void;
  onRenegociarParcela: (conta: ContaReceber) => void;
  onVisualizarBaixa?: (conta: ContaReceber) => void;
}

export function ContasAReceberTable({ 
  contas, 
  onEdit, 
  onBaixar, 
  onDelete,
  onVisualizar,
  onDesfazerBaixa,
  onRenegociarParcela,
  onVisualizarBaixa
}: ContasAReceberTableProps & {
  onDesfazerBaixa: (conta: ContaReceber) => void;
}) {
  function formatData(data?: Date) {
    if (!data) return "-";
    
    // Formatar a data no padrão DD/MM/YYYY sem considerar timezone
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  }

  const totalValor = contas.reduce((soma, conta) => soma + (conta.valor || 0), 0);

  function getStatusBadge(status: ContaReceber["status"], dataVencimento: Date) {
    // Verificar se está vencido (data de vencimento menor que a data atual)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Resetar horas para comparação apenas de data
    const estaVencido = dataVencimento < hoje;

    switch (status) {
      case "recebido":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Recebido
          </span>
        );
      case "recebido_em_atraso":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
            Recebido em Atraso
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
                  {getStatusBadge(conta.status, conta.dataVencimento)}
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
                        onClick={() => onRenegociarParcela(conta)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
                      >
                        <FileEdit className="h-4 w-4" />
                        Renegociar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onBaixar(conta)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </DropdownMenuItem>
                      {(conta.status === "recebido" || conta.status === "recebido_em_atraso") && (
                        <DropdownMenuItem
                          onClick={() => onVisualizarBaixa ? onVisualizarBaixa(conta) : null}
                          className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                          Visualizar Baixa
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDesfazerBaixa(conta)}
                        className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                        disabled={conta.status === "em_aberto"}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Desfazer Baixa
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
            <TableCell className="font-bold">{formatCurrency(totalValor)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
