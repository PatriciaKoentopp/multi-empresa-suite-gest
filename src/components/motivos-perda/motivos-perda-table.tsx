
import { MotivoPerda } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from "lucide-react";
import { EllipsisVertical } from "lucide-react";

interface MotivosPerdaTableProps {
  motivosPerda: MotivoPerda[];
  onEdit: (motivoPerda: MotivoPerda) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function MotivosPerdaTable({
  motivosPerda,
  onEdit,
  onDelete,
  isLoading = false
}: MotivosPerdaTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : motivosPerda.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            motivosPerda.map((motivoPerda) => (
              <TableRow key={motivoPerda.id}>
                <TableCell>{motivoPerda.nome}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      motivoPerda.status === "ativo"
                        ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                        : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                    }`}
                  >
                    {motivoPerda.status === "ativo" ? "Ativo" : "Inativo"}
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
                        onClick={() => onEdit(motivoPerda)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(motivoPerda.id)}
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
      </Table>
    </div>
  );
}
