
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Eye, MoreVertical, Search } from "lucide-react";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { TabelaPrecoModal } from "./tabela-preco-modal";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { TabelaPreco, Servico, Produto } from "@/types";
import { formatDate } from "@/lib/utils";
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

export default function TabelaPrecosPage() {
  const { currentCompany } = useCompany();
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [searchNome, setSearchNome] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoModal, setModoModal] = useState<"visualizar" | "editar" | "novo">("visualizar");
  const [tabelaSelecionada, setTabelaSelecionada] = useState<TabelaPreco | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarTabelas();
      carregarServicos();
    }
  }, [currentCompany]);

  async function carregarTabelas() {
    try {
      const { data, error } = await supabase
        .from('tabelas_precos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .order('nome');

      if (error) throw error;
      
      // Converter datas corretamente sem considerar timezone
      const tabelasConvertidas = data?.map(tab => ({
        ...tab,
        vigencia_inicial: tab.vigencia_inicial ? parseDateString(tab.vigencia_inicial) : null,
        vigencia_final: tab.vigencia_final ? parseDateString(tab.vigencia_final) : null,
        created_at: new Date(tab.created_at),
        updated_at: new Date(tab.updated_at)
      })) as TabelaPreco[];
      
      setTabelas(tabelasConvertidas || []);
    } catch (error) {
      console.error('Erro ao carregar tabelas de preços:', error);
      toast({
        title: "Erro ao carregar tabelas",
        description: "Ocorreu um erro ao carregar a lista de tabelas de preços.",
        variant: "destructive",
      });
    }
  }

  // Função para converter string YYYY-MM-DD para objeto Date sem considerar timezone
  function parseDateString(dateStr: string): Date {
    // Se já for um objeto Date, retorna ele mesmo
    if (dateStr instanceof Date) return dateStr;
    
    // Caso contrário, tenta converter a data sem ajuste de timezone
    if (typeof dateStr === 'string') {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Cria uma nova data usando UTC para evitar qualquer ajuste de timezone
        return new Date(Date.UTC(year, month - 1, day));
      }
    }
    
    // Fallback
    return new Date(dateStr);
  }

  async function carregarServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .order('nome');

      if (error) throw error;
      
      // Converter datas de string para objetos Date
      const servicosConvertidos = data?.map(serv => ({
        ...serv,
        created_at: new Date(serv.created_at),
        updated_at: new Date(serv.updated_at),
        status: serv.status as "ativo" | "inativo"
      })) as Servico[];
      
      setServicos(servicosConvertidos || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Ocorreu um erro ao carregar a lista de serviços.",
        variant: "destructive",
      });
    }
  }

  // Filtro
  const tabelasFiltradas = useMemo(() => {
    return tabelas.filter(tab =>
      tab.nome.toLocaleLowerCase().includes(searchNome.toLocaleLowerCase())
    );
  }, [tabelas, searchNome]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  // Função utilitária para exibir o badge de status no padrão da tela de serviços
  function getStatusBadge(status: "ativo" | "inativo") {
    if (status === "ativo") {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
          Ativo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
        Inativo
      </span>
    );
  }

  async function handleSalvarTabela(tabela: TabelaPreco) {
    try {
      if (tabelaSelecionada) {
        // Atualização
        const { error: updateError } = await supabase
          .from('tabelas_precos')
          .update({
            nome: tabela.nome,
            vigencia_inicial: tabela.vigencia_inicial,
            vigencia_final: tabela.vigencia_final,
            status: tabela.status
          })
          .eq('id', tabelaSelecionada.id)
          .eq('empresa_id', currentCompany?.id);

        if (updateError) throw updateError;
        toast({ title: "Tabela de Preços atualizada com sucesso!" });
      } else {
        // Criação
        const { data: novaTabela, error: insertError } = await supabase
          .from('tabelas_precos')
          .insert({
            empresa_id: currentCompany?.id,
            nome: tabela.nome,
            vigencia_inicial: tabela.vigencia_inicial,
            vigencia_final: tabela.vigencia_final,
            status: "ativo"
          })
          .select()
          .single();

        if (insertError) throw insertError;
        toast({ title: "Tabela de Preços criada com sucesso!" });
      }

      carregarTabelas();
      setModalAberto(false);
    } catch (error) {
      console.error('Erro ao salvar tabela de preços:', error);
      toast({
        title: "Erro ao salvar tabela",
        description: "Ocorreu um erro ao salvar a tabela de preços.",
        variant: "destructive",
      });
    }
  }

  async function handleExcluirTabela(tabela: TabelaPreco) {
    try {
      // Primeiro excluir os itens relacionados
      const { error: deleteItensError } = await supabase
        .from('tabelas_precos_itens')
        .delete()
        .eq('tabela_id', tabela.id);

      if (deleteItensError) throw deleteItensError;

      // Depois excluir a tabela
      const { error } = await supabase
        .from('tabelas_precos')
        .delete()
        .eq('id', tabela.id)
        .eq('empresa_id', currentCompany?.id);

      if (error) throw error;
      
      toast({ title: "Tabela de Preços excluída com sucesso!" });
      carregarTabelas();
    } catch (error) {
      console.error('Erro ao excluir tabela de preços:', error);
      toast({
        title: "Erro ao excluir tabela",
        description: "Ocorreu um erro ao excluir a tabela de preços.",
        variant: "destructive",
      });
    }
  }

  const [tabelaParaExcluir, setTabelaParaExcluir] = useState<TabelaPreco | null>(null);

  async function confirmarExclusao() {
    if (tabelaParaExcluir) {
      await handleExcluirTabela(tabelaParaExcluir);
      setTabelaParaExcluir(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Tabelas de Preço</h2>
        <Button
          variant="blue"
          size="sm"
          className="flex gap-1"
          onClick={() => { 
            setTabelaSelecionada(null);
            setModoModal("novo");
            setModalAberto(true);
          }}
          title="Nova Tabela de Preços"
        >
          <Plus className="w-4 h-4" /> Nova Tabela
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center gap-2 bg-muted p-4 rounded-lg mb-4">
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
            placeholder="Filtrar por nome..."
            value={searchNome}
            onChange={e => setSearchNome(e.target.value)}
            className="bg-white text-base pl-10"
          />
        </div>
      </div>

      {/* Listagem em tabela */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <thead>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Vigência Inicial</TableHead>
              <TableHead>Vigência Final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </thead>
          <TableBody>
            {tabelasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma tabela encontrada.
                </TableCell>
              </TableRow>
            ) : (
              tabelasFiltradas.map(tab => (
                <TableRow key={tab.id}>
                  <TableCell className="font-semibold">{tab.nome}</TableCell>
                  <TableCell>
                    {tab.vigencia_inicial
                      ? formatDate(tab.vigencia_inicial)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {tab.vigencia_final
                      ? formatDate(tab.vigencia_final)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tab.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100" aria-label="Ações">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu de ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
                        <DropdownMenuItem
                          onClick={() => {
                            setTabelaSelecionada(tab);
                            setModoModal("visualizar");
                            setModalAberto(true);
                          }}
                          className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        >
                          <Eye className="h-4 w-4" color="#0EA5E9" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setTabelaSelecionada(tab);
                            setModoModal("editar");
                            setModalAberto(true);
                          }}
                          className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        >
                          <Edit className="h-4 w-4" color="#0EA5E9" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTabelaParaExcluir(tab)}
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

      <TabelaPrecoModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        tabela={tabelaSelecionada}
        modo={modoModal}
        onSalvar={handleSalvarTabela}
        servicosACadastrar={servicos}
      />

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={!!tabelaParaExcluir} onOpenChange={() => setTabelaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tabela de preços? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTabelaParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
