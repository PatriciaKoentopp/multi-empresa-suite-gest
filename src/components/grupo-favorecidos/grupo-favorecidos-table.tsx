
import { useState } from "react";
import { GrupoFavorecido } from "@/types";
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

interface GrupoFavorecidosTableProps {
  grupos: GrupoFavorecido[];
  onEdit: (grupo: GrupoFavorecido) => void;
  onDelete: (id: string) => void;
}

export function GrupoFavorecidosTable({
  grupos,
  onEdit,
  onDelete,
}: GrupoFavorecidosTableProps) {
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
          {grupos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            grupos.map((grupo) => (
              <TableRow key={grupo.id}>
                <TableCell>{grupo.nome}</TableCell>
                <TableCell>
                  <Badge
                    variant={grupo.status === "ativo" ? "default" : "destructive"}
                    className={grupo.status === "ativo" ? "bg-blue-500 hover:bg-blue-600" : ""}
                  >
                    {grupo.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(grupo)}
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(grupo.id)}
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
