import { useState, useEffect } from "react";
import { Usuario } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsuariosForm } from "@/components/usuarios/usuarios-form";
import { UsuariosTable } from "@/components/usuarios/usuarios-table";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | undefined>(
    undefined
  );

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [tipoFilter, setTipoFilter] = useState<"todos" | "Administrador" | "Usuário">("todos");
  const [vendedorFilter, setVendedorFilter] = useState<"todos" | "sim" | "nao">("todos");

  const { currentCompany } = useCompany();

  useEffect(() => {
    fetchUsuarios();
  }, [currentCompany]);

  const fetchUsuarios = async () => {
    if (!currentCompany) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("empresa_id", currentCompany.id);

    if (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
      return;
    }

    if (data) {
      const usuariosFormatados: Usuario[] = data.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        senha: '', // Senha não deve ser retornada
        tipo: usuario.tipo as "Administrador" | "Usuário",
        status: usuario.status as "ativo" | "inativo",
        vendedor: usuario.vendedor as "sim" | "nao",
        createdAt: new Date(usuario.created_at),
        updatedAt: new Date(usuario.updated_at),
      }));
      setUsuarios(usuariosFormatados);
    }
  };

  const handleOpenDialog = (usuario?: Usuario) => {
    setEditingUsuario(usuario);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingUsuario(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: Usuario) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    if (editingUsuario) {
      // Update existing usuario
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: data.nome,
          email: data.email,
          tipo: data.tipo,
          status: data.status,
          vendedor: data.vendedor,
        })
        .eq("id", editingUsuario.id)
        .eq("empresa_id", currentCompany.id);

      if (error) {
        console.error("Erro ao atualizar usuário:", error);
        toast.error("Erro ao atualizar usuário");
        return;
      }

      setUsuarios(prev =>
        prev.map(u =>
          u.id === editingUsuario.id
            ? {
                ...u,
                nome: data.nome,
                email: data.email,
                tipo: data.tipo,
                status: data.status,
                vendedor: data.vendedor,
                updatedAt: new Date(),
              }
            : u
        )
      );
      toast.success("Usuário atualizado com sucesso!");
    } else {
      // Create new usuario
      const { data: newUsuario, error } = await supabase
        .from("usuarios")
        .insert([
          {
            empresa_id: currentCompany.id,
            nome: data.nome,
            email: data.email,
            tipo: data.tipo,
            status: data.status,
            vendedor: data.vendedor,
            id: data.id, // Certifique-se de que o ID seja gerado corretamente
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar usuário:", error);
        toast.error("Erro ao criar usuário");
        return;
      }

      if (newUsuario) {
        const usuarioFormatado: Usuario = {
          id: newUsuario.id,
          nome: newUsuario.nome,
          email: newUsuario.email,
          senha: '', // Senha não deve ser retornada
          tipo: newUsuario.tipo as "Administrador" | "Usuário",
          status: newUsuario.status as "ativo" | "inativo",
          vendedor: newUsuario.vendedor as "sim" | "nao",
          createdAt: new Date(newUsuario.created_at),
          updatedAt: new Date(newUsuario.updated_at),
        };
        setUsuarios(prev => [...prev, usuarioFormatado]);
        toast.success("Usuário criado com sucesso!");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (!currentCompany) return;

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id)
      .eq("empresa_id", currentCompany.id);

    if (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário");
      return;
    }

    setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
    toast.success("Usuário excluído com sucesso!");
  };

  // Atualizar a função filterUsuarios para usar o tipo correto
  const filterUsuarios = (usuarios: Usuario[]): Usuario[] => {
    return usuarios.filter(usuario => {
      const matchesSearch =
        usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || usuario.status === statusFilter;
      const matchesTipo = tipoFilter === "todos" || usuario.tipo === tipoFilter;
      const matchesVendedor = vendedorFilter === "todos" || usuario.vendedor === vendedorFilter;

      return matchesSearch && matchesStatus && matchesTipo && matchesVendedor;
    });
  };

  const filteredUsuarios = filterUsuarios(usuarios);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Button onClick={() => handleOpenDialog()} variant="blue">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as "todos" | "ativo" | "inativo")}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                  <SelectItem value="inativo" className="text-red-600">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={tipoFilter}
                onValueChange={(value) => setTipoFilter(value as "todos" | "Administrador" | "Usuário")}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Usuário">Usuário</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={vendedorFilter}
                onValueChange={(value) => setVendedorFilter(value as "todos" | "sim" | "nao")}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <UsuariosTable
            usuarios={filteredUsuarios}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario
                ? "Editar Usuário"
                : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <UsuariosForm
            usuario={editingUsuario}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
