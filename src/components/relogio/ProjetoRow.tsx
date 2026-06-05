import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  ArchiveRestore,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import type { RelogioProjeto } from "@/types/relogio";
import { formatHoursMinutes } from "@/utils/timeUtils";

interface Props {
  projeto: RelogioProjeto;
  tipoNome: string;
  clienteNome: string;
  horas: number;
  onEdit: (p: RelogioProjeto) => void;
  onToggleStatus: (p: RelogioProjeto) => void;
  onDelete: (p: RelogioProjeto) => void;
}

function ProjetoRowImpl({
  projeto: p,
  tipoNome,
  clienteNome,
  horas,
  onEdit,
  onToggleStatus,
  onDelete,
}: Props) {
  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell className="font-medium">{p.codigo}</TableCell>
      <TableCell>{p.nome}</TableCell>
      <TableCell>{tipoNome || "—"}</TableCell>
      <TableCell>{clienteNome || "—"}</TableCell>
      <TableCell className="text-right">{p.fotos_tiradas}</TableCell>
      <TableCell className="text-right">{p.fotos_enviadas}</TableCell>
      <TableCell className="text-right">{p.fotos_vendidas}</TableCell>
      <TableCell className="text-right">
        {horas > 0 ? formatHoursMinutes(horas) : "—"}
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            p.status === "ativo"
              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
          }`}
        >
          {p.status === "ativo" ? "Ativo" : "Arquivado"}
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
          <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
            <DropdownMenuItem
              onClick={() => onEdit(p)}
              className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleStatus(p)}
              className="flex items-center gap-2 text-amber-600 focus:bg-amber-100 focus:text-amber-700"
            >
              {p.status === "ativo" ? (
                <>
                  <Archive className="h-4 w-4" /> Arquivar
                </>
              ) : (
                <>
                  <ArchiveRestore className="h-4 w-4" /> Reativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(p)}
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

export const ProjetoRow = memo(ProjetoRowImpl);
