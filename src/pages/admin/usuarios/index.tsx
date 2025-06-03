
import { useState, useEffect, useCallback } from "react";
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
  DialogDescription,
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
  const [isLoading, setIsLoading] = useState(true);
  // Adicionamos uma flag para forçar o recarregamento
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [tipoFilter, setTipoFilter] = useState<"todos" | "Administrador" | "Usuário">("todos");
  const [vendedorFilter, setVendedorFilter] = useState<"todos" | "sim" | "nao">("todos");

  const { currentCompany } = useCompany();

  // Modificamos a função para usar o useCallback para poder referenciá-la no useEffect
  const fetchUsuarios = useCallback(async () => {
    if (!currentCompany) return;

    setIsLoading(true);
    try {
      console.log("Buscando usuários...");
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
        console.log("Usuários carregados com sucesso:", data.length);
        const usuariosFormatados: Usuario[] = data.map(usuario => ({
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          senha: '', // Senha não deve ser retornada
          tipo: usuario.tipo as "Administrador" | "Usuário",
          status: usuario.status as "ativo" | "inativo",
          vendedor: usuario.vendedor as "sim" | "nao",
          created_at: usuario.created_at, // Agora é timestamp with time zone
          updated_at: usuario.updated_at, // Agora é timestamp with time zone
          empresa_id: usuario.empresa_id
        }));
        setUsuarios(usuariosFormatados);
      }
    } catch (err) {
      console.error("Exceção ao carregar usuários:", err);
      toast.error("Erro inesperado ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);
  
  // Efeito para carregar os dados quando a página é carregada ou quando refreshFlag muda
  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios, currentCompany, refreshFlag]);

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

    try {
      setIsLoading(true);
      
      if (editingUsuario) {
        // Update existing usuario
        console.log("Atualizando usuário:", data);
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

        console.log("Usuário atualizado com sucesso!");
        toast.success("Usuário atualizado com sucesso!");
      } else {
        // Create new usuario
        console.log("Criando novo usuário:", data);
        const { error } = await supabase
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
          ]);

        if (error) {
          console.error("Erro ao criar usuário:", error);
          toast.error("Erro ao criar usuário");
          return;
        }

        console.log("Usuário criado com sucesso!");
        toast.success("Usuário criado com sucesso!");
      }
      
      // Fecha o modal
      handleCloseDialog();
      
      // Incrementa o refreshFlag para forçar o recarregamento dos dados
      setRefreshFlag(prev => prev + 1);
      
    } catch (err) {
      console.error("Exceção durante operação de usuário:", err);
      toast.error("Erro inesperado ao processar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentCompany) return;

    try {
      setIsLoading(true);
      console.log("Excluindo usuário:", id);
      
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

      console.log("Usuário excluído com sucesso!");
      toast.success("Usuário excluído com sucesso!");
      
      // Incrementa o refreshFlag para forçar o recarregamento dos dados
      setRefreshFlag(prev => prev + 1);
      
    } catch (err) {
      console.error("Exceção ao excluir usuário:", err);
      toast.error("Erro inesperado ao excluir usuário");
    } finally {
      setIsLoading(false);
    }
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
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario
                ? "Editar Usuário"
                : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editingUsuario
                ? "Atualize as informações do usuário abaixo."
                : "Preencha as informações para criar um novo usuário."}
            </DialogDescription>
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
