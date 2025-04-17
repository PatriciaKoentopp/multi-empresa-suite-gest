
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
import { PencilIcon, TrashIcon, EyeIcon } from "lucide-react";

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
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(conta)}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(conta)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(conta.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
