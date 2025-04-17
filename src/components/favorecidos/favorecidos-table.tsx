
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
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, User, Building2, Landmark, UserCog } from "lucide-react";
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
                  <Badge
                    variant={favorecido.status === "ativo" ? "default" : "destructive"}
                    className={favorecido.status === "ativo" ? "bg-blue-500 hover:bg-blue-600" : ""}
                  >
                    {favorecido.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(favorecido)}
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(favorecido)}
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(favorecido.id)}
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
