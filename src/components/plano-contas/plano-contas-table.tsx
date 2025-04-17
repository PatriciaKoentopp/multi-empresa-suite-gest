
import { PencilIcon, Trash2Icon } from "lucide-react";
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
import { PlanoConta } from "@/types";

interface PlanoContasTableProps {
  contas: PlanoConta[];
  onEdit: (conta: PlanoConta) => void;
  onDelete: (id: string) => void;
}

export function PlanoContasTable({ contas, onEdit, onDelete }: PlanoContasTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Considerar DRE</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell>{conta.codigo}</TableCell>
                <TableCell>{conta.descricao}</TableCell>
                <TableCell className="capitalize">{conta.tipo}</TableCell>
                <TableCell>{conta.considerarDRE ? "Sim" : "Não"}</TableCell>
                <TableCell>
                  <Badge
                    variant={conta.status === "ativo" ? "default" : "destructive"}
                    className={conta.status === "ativo" ? "bg-blue-500 hover:bg-blue-600" : ""}
                  >
                    {conta.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(conta)}
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(conta.id)}
                      className="text-red-500 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2Icon className="h-4 w-4" />
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
