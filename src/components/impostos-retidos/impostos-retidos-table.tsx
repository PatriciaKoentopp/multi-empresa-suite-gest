import { ImpostoRetido } from "@/types/impostos-retidos";
import { TipoTitulo } from "@/types/tipos-titulos";
import { PlanoConta } from "@/types/plano-contas";
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
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Favorecido {
  id: string;
  nome: string;
  status: string;
}

interface ImpostosRetidosTableProps {
  impostos: ImpostoRetido[];
  tiposTitulos: TipoTitulo[];
  contasContabeis: PlanoConta[];
  favorecidos: Favorecido[];
  onEdit: (imposto: ImpostoRetido) => void;
  onDelete: (id: string) => void;
}

export function ImpostosRetidosTable({
  impostos,
  tiposTitulos,
  contasContabeis,
  favorecidos,
  onEdit,
  onDelete,
}: ImpostosRetidosTableProps) {
  const getTipoTituloNome = (tipoTituloId: string) => {
    const tipo = tiposTitulos.find((t) => t.id === tipoTituloId);
    return tipo?.nome || "—";
  };

  const getContaDespesaNome = (contaDespesaId?: string) => {
    if (!contaDespesaId) return "—";
    const conta = contasContabeis.find((c) => c.id === contaDespesaId);
    return conta ? `${conta.codigo} - ${conta.descricao}` : "—";
  };

  const getFavorecidoNome = (favorecidoId?: string) => {
    if (!favorecidoId) return "—";
    const fav = favorecidos.find((f) => f.id === favorecidoId);
    return fav?.nome || "—";
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo de Título</TableHead>
            <TableHead>Conta de Despesa</TableHead>
            <TableHead>Favorecido Padrão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {impostos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                Nenhum imposto retido encontrado
              </TableCell>
            </TableRow>
          ) : (
            impostos.map((imposto) => (
              <TableRow key={imposto.id}>
                <TableCell>{imposto.nome}</TableCell>
                <TableCell>{getTipoTituloNome(imposto.tipo_titulo_id)}</TableCell>
                <TableCell>{getContaDespesaNome(imposto.conta_despesa_id)}</TableCell>
                <TableCell>{getFavorecidoNome(imposto.favorecido_id)}</TableCell>
                <TableCell>
                  <Badge
                    variant={imposto.status === "ativo" ? "success" : "destructive"}
                    className="capitalize"
                  >
                    {imposto.status === "ativo" ? "Ativo" : "Inativo"}
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
                        onClick={() => onEdit(imposto)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(imposto.id)}
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
