
import { Favorecido, GrupoFavorecido } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Trash2, User, Building2, Landmark, UserCog, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

interface FavorecidosTableProps {
  favorecidos: Favorecido[];
  grupos: GrupoFavorecido[];
  onView: (favorecido: Favorecido) => void;
  onEdit: (favorecido: Favorecido) => void;
  onDelete: (id: string) => void;
}

export function FavorecidosTable({
  favorecidos,
  grupos,
  onView,
  onEdit,
  onDelete,
}: FavorecidosTableProps) {
  // Função para obter o nome do grupo pelo ID
  const getGrupoNome = (grupoId?: string) => {
    if (!grupoId) return "";
    const grupo = grupos.find(g => g.id === grupoId);
    return grupo ? grupo.nome : "";
  };

  // Função para renderizar o ícone baseado no tipo do favorecido
  const renderTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "cliente":
        return <User className="h-4 w-4 text-blue-500" />;
      case "fornecedor":
        return <Building2 className="h-4 w-4 text-green-500" />;
      case "funcionario":
        return <UserCog className="h-4 w-4 text-amber-500" />;
      case "publico":
        return <Landmark className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Função para formatar o tipo para exibição
  const formatTipo = (tipo: string) => {
    const tipos = {
      cliente: "Cliente",
      fornecedor: "Fornecedor",
      funcionario: "Funcionário",
      publico: "Órgão Público"
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {favorecidos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            favorecidos.map((favorecido) => (
              <TableRow key={favorecido.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {renderTipoIcon(favorecido.tipo)}
                    <span>{formatTipo(favorecido.tipo)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{favorecido.nome}</div>
                    {favorecido.nomeFantasia && (
                      <div className="text-xs text-muted-foreground">{favorecido.nomeFantasia}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{favorecido.documento}</TableCell>
                <TableCell>{getGrupoNome(favorecido.grupoId)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {favorecido.email && (
                      <div className="text-xs">{favorecido.email}</div>
                    )}
                    {favorecido.telefone && (
                      <div className="text-xs">{favorecido.telefone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      favorecido.status === "ativo"
                        ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                        : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                    }`}
                  >
                    {favorecido.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
                      <DropdownMenuItem
                        onClick={() => onView(favorecido)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(favorecido)}
                        className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(favorecido.id)}
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
