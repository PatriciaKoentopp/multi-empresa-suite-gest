
import { TipoTitulo } from "@/types/tipos-titulos";
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
import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TiposTitulosTableProps {
  tipos: TipoTitulo[];
  onEdit: (tipo: TipoTitulo) => void;
  onDelete: (id: string) => void;
}

export function TiposTitulosTable({
  tipos,
  onEdit,
  onDelete,
}: TiposTitulosTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tipos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhum tipo de título encontrado
              </TableCell>
            </TableRow>
          ) : (
            tipos.map((tipo) => (
              <TableRow key={tipo.id}>
                <TableCell>{tipo.nome}</TableCell>
                <TableCell>
                  <Badge variant={tipo.tipo === "receber" ? "success" : "destructive"}>
                    {tipo.tipo === "receber" ? "Receber" : "Pagar"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={tipo.status === "ativo" ? "success" : "destructive"}
                    className="capitalize"
                  >
                    {tipo.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                      <DropdownMenuItem
                        onClick={() => onEdit(tipo)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(tipo.id)}
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
