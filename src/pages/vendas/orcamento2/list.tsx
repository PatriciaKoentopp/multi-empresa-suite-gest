
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Eye, Trash2, Search, MoreVertical } from "lucide-react";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";

export default function OrcamentoList() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [orcamentoParaExcluir, setOrcamentoParaExcluir] = useState<string | null>(null);
  const inputBuscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarOrcamentos();
    }
  }, [currentCompany]);

  async function carregarOrcamentos() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          favorecidos:favorecido_id(nome)
        `)
        .eq('empresa_id', currentCompany?.id)
        .eq('tipo', 'orcamento')
        .order('data', { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: "Erro ao carregar orçamentos",
        description: "Ocorreu um erro ao carregar a lista de orçamentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExcluirOrcamento(id: string) {
    try {
      // Excluir itens relacionados
      const { error: errorItens } = await supabase
        .from('orcamentos_itens')
        .delete()
        .eq('orcamento_id', id);
      
      if (errorItens) throw errorItens;
      
      // Excluir parcelas relacionadas
      const { error: errorParcelas } = await supabase
        .from('orcamentos_parcelas')
        .delete()
        .eq('orcamento_id', id);
      
      if (errorParcelas) throw errorParcelas;

      // Excluir o orçamento
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id)
        .eq('empresa_id', currentCompany?.id);

      if (error) throw error;

      toast({ title: "Orçamento excluído com sucesso" });
      carregarOrcamentos();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: "Erro ao excluir orçamento",
        description: "Ocorreu um erro ao excluir o orçamento.",
        variant: "destructive",
      });
    }
  }

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  const orcamentosFiltrados = orcamentos.filter(orcamento => {
    const favorecidoNome = orcamento.favorecidos?.nome?.toLowerCase() || '';
    const codigo = orcamento.codigo?.toLowerCase() || '';
    
    return favorecidoNome.includes(searchTerm.toLowerCase()) || 
           codigo.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orçamentos 2.0</h1>
        <Button
          variant="blue"
          onClick={() => navigate("/vendas/orcamento2")}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      <div className="bg-muted p-4 rounded-lg mb-4">
        <div className="relative w-full md:max-w-xs">
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
            placeholder="Buscar orçamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white text-base pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orcamentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum orçamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                orcamentosFiltrados.map((orcamento) => (
                  <TableRow key={orcamento.id}>
                    <TableCell className="font-medium">
                      {orcamento.codigo || "---"}
                    </TableCell>
                    <TableCell>{formatDate(orcamento.data)}</TableCell>
                    <TableCell>{orcamento.favorecidos?.nome}</TableCell>
                    <TableCell>{formatCurrency(orcamento.valor_total)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          orcamento.status === "ativo"
                            ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                            : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                        }`}
                      >
                        {orcamento.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
                          <DropdownMenuItem asChild className="text-blue-500 focus:bg-blue-100 focus:text-blue-700">
                            <Link to={`/vendas/orcamento2?id=${orcamento.id}&visualizar=1`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" color="#0EA5E9" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-blue-500 focus:bg-blue-100 focus:text-blue-700">
                            <Link to={`/vendas/orcamento2?id=${orcamento.id}`} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" color="#0EA5E9" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setOrcamentoParaExcluir(orcamento.id)}
                            className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" color="#ea384c" />
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
      )}

      <AlertDialog open={!!orcamentoParaExcluir} onOpenChange={() => setOrcamentoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrcamentoParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (orcamentoParaExcluir) {
                  handleExcluirOrcamento(orcamentoParaExcluir);
                  setOrcamentoParaExcluir(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
