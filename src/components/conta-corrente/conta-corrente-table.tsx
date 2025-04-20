
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContaCorrente } from "@/types/conta-corrente";
import { Pencil, Trash2, Eye, EllipsisVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ContaCorrenteTableProps {
  contas: ContaCorrente[];
  contasContabeis: Array<{ id: string; codigo: string; descricao: string }>;
  onView: (conta: ContaCorrente) => void;
  onEdit: (conta: ContaCorrente) => void;
  onDelete: (id: string) => void;
}

export function ContaCorrenteTable({
  contas,
  contasContabeis,
  onView,
  onEdit,
  onDelete,
}: ContaCorrenteTableProps) {
  const getContaContabil = (id: string) => {
    const conta = contasContabeis.find(c => c.id === id);
    return conta ? `${conta.codigo} - ${conta.descricao}` : 'Não encontrada';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead>Agência</TableHead>
          <TableHead>Número</TableHead>
          <TableHead>Conta Contábil</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[120px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contas.map((conta) => (
          <TableRow key={conta.id}>
            <TableCell>{conta.nome}</TableCell>
            <TableCell>{conta.banco}</TableCell>
            <TableCell>{conta.agencia}</TableCell>
            <TableCell>{conta.numero}</TableCell>
            <TableCell>{getContaContabil(conta.contaContabilId)}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  conta.status === "ativo"
                    ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                    : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                }`}
              >
                {conta.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                    <EllipsisVertical className="h-4 w-4" />
                    <span className="sr-only">Abrir menu de ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                  <DropdownMenuItem
                    onClick={() => onView(conta)}
                    className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEdit(conta)}
                    className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
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
        ))}
      </TableBody>
    </Table>
  );
}
