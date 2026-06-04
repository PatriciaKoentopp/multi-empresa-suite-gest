import { memo, useCallback } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

interface Props {
  id: string;
  data: string;
  projeto: string;
  tarefa: string;
  horaInicio: string;
  horaFim: string;
  duracaoDecimal: string;
  duracaoHHMMSS: string;
  origem: "manual" | "cronometro";
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function ApontamentoRowImpl({
  id,
  data,
  projeto,
  tarefa,
  horaInicio,
  horaFim,
  duracaoDecimal,
  duracaoHHMMSS,
  origem,
  onEdit,
  onDelete,
}: Props) {
  const handleEdit = useCallback(() => onEdit(id), [id, onEdit]);
  const handleDelete = useCallback(() => onDelete(id), [id, onDelete]);

  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>{data}</TableCell>
      <TableCell>{projeto}</TableCell>
      <TableCell>{tarefa}</TableCell>
      <TableCell>{horaInicio}</TableCell>
      <TableCell>{horaFim}</TableCell>
      <TableCell className="text-right font-mono">{duracaoDecimal}</TableCell>
      <TableCell className="font-mono">{duracaoHHMMSS}</TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            origem === "cronometro"
              ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
              : "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/20"
          }`}
        >
          {origem === "cronometro" ? "Cronômetro" : "Manual"}
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-500 hover:bg-gray-100"
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 z-30 bg-white border"
          >
            <DropdownMenuItem
              onClick={handleEdit}
              className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export const ApontamentoRow = memo(ApontamentoRowImpl);
