
import { Profissao } from "@/types";
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
import { Pencil, Trash2 } from "lucide-react";

interface ProfissoesTableProps {
  profissoes: Profissao[];
  onEdit: (profissao: Profissao) => void;
  onDelete: (id: string) => void;
}

export function ProfissoesTable({
  profissoes,
  onEdit,
  onDelete,
}: ProfissoesTableProps) {
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
          {profissoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            profissoes.map((profissao) => (
              <TableRow key={profissao.id}>
                <TableCell>{profissao.nome}</TableCell>
                <TableCell>
                  <Badge
                    variant={profissao.status === "ativo" ? "default" : "destructive"}
                    className={profissao.status === "ativo" ? "bg-blue-500 hover:bg-blue-600" : ""}
                  >
                    {profissao.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(profissao)}
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(profissao.id)}
                      className="text-red-500 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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
