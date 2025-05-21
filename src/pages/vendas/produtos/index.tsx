
import { useState, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Search, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ProdutosForm } from "@/components/produtos/produtos-form";
import { ProdutosTable } from "@/components/produtos/produtos-table";
import { Produto } from "@/types/produtos";

export default function ProdutosPage() {
  const { currentCompany } = useCompany();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "ativo" | "inativo">("todas");
  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProdutoId, setDeletingProdutoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Simular carregamento de produtos
  useEffect(() => {
    if (currentCompany?.id) {
      // Esta função será substituída quando criarmos a tabela no Supabase
      setIsLoading(true);
      // Simulando dados
      setTimeout(() => {
        setProdutos([]);
        setIsLoading(false);
      }, 500);
    }
  }, [currentCompany]);

  // Aplica filtro na listagem
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      // Filtro texto: nome ou descrição
      const textoBusca = (produto.nome + " " + (produto.descricao || ""))
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      // Filtro status
      const statusOk = statusFilter === "todas" || produto.status === statusFilter;
      return textoBusca && statusOk;
    });
  }, [produtos, searchTerm, statusFilter]);

  async function handleSubmitProduto(formData: any) {
    // Função temporária até criarmos a tabela no Supabase
    toast("Funcionalidade será implementada após a criação da tabela");
    setShowForm(false);
    setEditingProduto(null);
  }

  function handleEditar(produto: Produto) {
    setEditingProduto(produto);
    setShowForm(true);
  }
  
  async function handleConfirmDelete() {
    // Função temporária até criarmos a tabela no Supabase
    toast("Funcionalidade será implementada após a criação da tabela");
    setIsDeleteDialogOpen(false);
    setDeletingProdutoId(null);
  }

  function handleExcluirClick(id: string, e?: React.MouseEvent) {
    if (e) e.preventDefault();
    setDeletingProdutoId(id);
    setIsDeleteDialogOpen(true);
  }

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingProduto(null);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Cadastro de Produtos</h2>
        <Button variant="blue" onClick={() => { setShowForm(true); setEditingProduto(null); }}>
          <Plus className="mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Campo de busca */}
            <div className="relative w-full md:w-1/2 min-w-[220px]">
              <button
                type="button"
                className="absolute left-3 top-2.5 z-10 p-0 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-blue-500"
                style={{ lineHeight: 0 }}
                onClick={handleLupaClick}
                tabIndex={-1}
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
              <Input
                ref={inputBuscaRef}
                placeholder="Buscar produto ou descrição"
                className="pl-10 bg-white border-gray-300 shadow-sm focus:bg-white w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    inputBuscaRef.current?.blur();
                  }
                }}
                autoComplete="off"
              />
            </div>
            {/* Select de status */}
            <div className="w-full md:w-40">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="todas">Todos Status</SelectItem>
                  <SelectItem value="ativo" className="text-green-700">Ativo</SelectItem>
                  <SelectItem value="inativo" className="text-red-700">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingProduto ? "Editar Produto" : "Novo Produto"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProdutosForm 
              initialData={editingProduto || undefined}
              onSubmit={handleSubmitProduto}
              onCancel={handleCancelForm}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <ProdutosTable 
            produtos={produtosFiltrados}
            onEdit={handleEditar}
            onDelete={handleExcluirClick}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false);
            setDeletingProdutoId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 text-white hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
