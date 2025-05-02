
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowRight, MoreVertical } from "lucide-react";
import { FunilFormModal } from "./funil-form-modal";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

interface Funil {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  data_criacao: string;
  etapas: EtapaFunil[];
}

export default function FunilConfiguracaoPage() {
  // Lista de funis
  const [funis, setFunis] = useState<Funil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  
  // Estado para novo funil ou edição de funil existente
  const [novoFunil, setNovoFunil] = useState(false);
  const [funilSelecionado, setFunilSelecionado] = useState<Funil | null>(null);
  
  // Estados para etapas do funil
  const [etapas, setEtapas] = useState<EtapaFunil[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEtapa, setEditEtapa] = useState<EtapaFunil | null>(null);
  
  // Estado para o modal de criação/edição de funil
  const [modalFunilOpen, setModalFunilOpen] = useState(false);
  const [nomeFunil, setNomeFunil] = useState("");
  const [descricaoFunil, setDescricaoFunil] = useState("");
  const [ativoFunil, setAtivoFunil] = useState(true);
  
  // Função para carregar os dados dos funis do banco
  async function carregarFunis() {
    if (!currentCompany) return;
    
    setIsLoading(true);
    try {
      // Buscar todos os funis da empresa
      const { data: funisData, error: funisError } = await supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('created_at', { ascending: false });
      
      if (funisError) throw funisError;
      
      // Buscar etapas de todos os funis
      const { data: etapasData, error: etapasError } = await supabase
        .from('funil_etapas')
        .select('*')
        .in('funil_id', funisData.map(f => f.id))
        .order('ordem', { ascending: true });
        
      if (etapasError) throw etapasError;
      
      // Mapear os funis com suas respectivas etapas
      const funisComEtapas: Funil[] = funisData.map(funil => {
        const etapasFunil = etapasData.filter(e => e.funil_id === funil.id);
        return {
          ...funil,
          etapas: etapasFunil.map(e => ({
            id: e.id,
            nome: e.nome,
            cor: e.cor,
            ordem: e.ordem
          }))
        };
      });
      
      setFunis(funisComEtapas);
      
      // Se não houver um funil selecionado, selecione o primeiro
      if (funisComEtapas.length > 0 && !funilSelecionado) {
        selecionarFunil(funisComEtapas[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar funis:", error);
      toast.error("Não foi possível carregar os funis. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }
  
  // Função para selecionar um funil para edição
  function selecionarFunil(funil: Funil) {
    setFunilSelecionado(funil);
    setEtapas(funil.etapas);
  }
  
  // Função para abrir modal de novo funil
  function criarNovoFunil() {
    setNovoFunil(true);
    setFunilSelecionado(null);
    setNomeFunil("");
    setDescricaoFunil("");
    setAtivoFunil(true);
    setModalFunilOpen(true);
  }
  
  // Função para abrir modal de edição de funil
  function editarFunil(funil: Funil) {
    setNovoFunil(false);
    setFunilSelecionado(funil);
    setNomeFunil(funil.nome);
    setDescricaoFunil(funil.descricao || "");
    setAtivoFunil(funil.ativo);
    setModalFunilOpen(true);
  }
  
  // Função para excluir um funil
  async function excluirFunil(id: string) {
    if (!currentCompany) return;
    
    if (funis.length <= 1) {
      toast.error("Não é possível excluir o único funil existente.");
      return;
    }
    
    try {
      // Verificar se o funil está sendo utilizado em leads
      const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('funil_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error("Este funil está sendo utilizado em leads ativos e não pode ser excluído.");
        return;
      }
      
      // Excluir etapas do funil (a exclusão em cascata deve estar configurada no banco)
      const { error: deleteEtapasError } = await supabase
        .from('funil_etapas')
        .delete()
        .eq('funil_id', id);
        
      if (deleteEtapasError) throw deleteEtapasError;
      
      // Excluir o funil
      const { error: deleteFunilError } = await supabase
        .from('funis')
        .delete()
        .eq('id', id);
        
      if (deleteFunilError) throw deleteFunilError;
      
      // Atualizar estado local
      const novaLista = funis.filter(f => f.id !== id);
      setFunis(novaLista);
      
      // Se o funil excluído era o selecionado, seleciona o primeiro da lista
      if (funilSelecionado && funilSelecionado.id === id && novaLista.length > 0) {
        selecionarFunil(novaLista[0]);
      }
      
      toast.success("Funil excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir funil:", error);
      toast.error("Não foi possível excluir o funil. Tente novamente.");
    }
  }
  
  // Função para salvar novo funil ou atualizar existente
  async function salvarFunil() {
    if (!currentCompany) return;
    
    if (!nomeFunil.trim()) {
      toast.error("O nome do funil é obrigatório");
      return;
    }
    
    try {
      if (novoFunil) {
        // Criar novo funil
        const { data: novoFunilData, error: novoFunilError } = await supabase
          .from('funis')
          .insert([{
            nome: nomeFunil,
            descricao: descricaoFunil || null,
            ativo: ativoFunil,
            empresa_id: currentCompany.id
          }])
          .select('*')
          .single();
          
        if (novoFunilError) throw novoFunilError;
        
        // Criar etapas padrão para o novo funil
        const etapasIniciais = [
          { nome: "Prospecção", cor: "#0EA5E9", ordem: 1 },
          { nome: "Contato Inicial", cor: "#F59E0B", ordem: 2 },
          { nome: "Proposta Enviada", cor: "#10B981", ordem: 3 },
          { nome: "Negociação", cor: "#8B5CF6", ordem: 4 },
          { nome: "Fechamento", cor: "#F97316", ordem: 5 }
        ];
        
        const etapasBanco = etapasIniciais.map(etapa => ({
          funil_id: novoFunilData.id,
          nome: etapa.nome,
          cor: etapa.cor,
          ordem: etapa.ordem
        }));
        
        const { data: etapasData, error: etapasError } = await supabase
          .from('funil_etapas')
          .insert(etapasBanco)
          .select('*');
          
        if (etapasError) throw etapasError;
        
        // Atualizar estado local
        const novoFunilCompleto: Funil = {
          ...novoFunilData,
          etapas: etapasData.map(e => ({
            id: e.id,
            nome: e.nome,
            cor: e.cor,
            ordem: e.ordem
          }))
        };
        
        setFunis([novoFunilCompleto, ...funis]);
        selecionarFunil(novoFunilCompleto);
        toast.success("Novo funil criado com sucesso!");
      } else if (funilSelecionado) {
        // Atualizar funil existente
        const { error } = await supabase
          .from('funis')
          .update({
            nome: nomeFunil,
            descricao: descricaoFunil || null,
            ativo: ativoFunil
          })
          .eq('id', funilSelecionado.id);
          
        if (error) throw error;
        
        // Atualizar estado local
        const funilAtualizado: Funil = {
          ...funilSelecionado,
          nome: nomeFunil,
          descricao: descricaoFunil,
          ativo: ativoFunil
        };
        
        setFunis(funis.map(f => f.id === funilSelecionado.id ? funilAtualizado : f));
        selecionarFunil(funilAtualizado);
        toast.success("Funil atualizado com sucesso!");
      }
      
      setModalFunilOpen(false);
    } catch (error) {
      console.error("Erro ao salvar funil:", error);
      toast.error("Não foi possível salvar o funil. Tente novamente.");
    }
  }
  
  // Funções para gerenciar etapas do funil
  function handleNovo() {
    setEditEtapa(null);
    setModalOpen(true);
  }
  
  async function handleSalvarEtapa(nova: {
    nome: string;
    cor: string;
    ordem: number;
  }) {
    if (!funilSelecionado || !currentCompany) return;
    
    try {
      if (editEtapa) {
        // Atualizar etapa existente
        const { error } = await supabase
          .from('funil_etapas')
          .update({
            nome: nova.nome,
            cor: nova.cor,
            ordem: nova.ordem
          })
          .eq('id', editEtapa.id)
          .eq('funil_id', funilSelecionado.id);
          
        if (error) throw error;
        
        // Atualizar estado local
        const novasEtapas = etapas.map(e => e.id === editEtapa.id ? {
          ...e,
          ...nova
        } : e);
        
        setEtapas(novasEtapas);
        
        // Atualizar etapas do funil selecionado
        setFunis(prev => prev.map(f => {
          if (f.id === funilSelecionado.id) {
            return {
              ...f,
              etapas: novasEtapas
            };
          }
          return f;
        }));
        
        toast.success("Etapa atualizada com sucesso!");
      } else {
        // Criar nova etapa
        const { data: novaEtapaData, error } = await supabase
          .from('funil_etapas')
          .insert([{
            funil_id: funilSelecionado.id,
            nome: nova.nome,
            cor: nova.cor,
            ordem: nova.ordem
          }])
          .select('*')
          .single();
          
        if (error) throw error;
        
        // Atualizar estado local
        const novaEtapa: EtapaFunil = {
          id: novaEtapaData.id,
          nome: novaEtapaData.nome,
          cor: novaEtapaData.cor,
          ordem: novaEtapaData.ordem
        };
        
        const novasEtapas = [...etapas, novaEtapa];
        setEtapas(novasEtapas);
        
        // Atualizar etapas do funil selecionado
        setFunis(prev => prev.map(f => {
          if (f.id === funilSelecionado.id) {
            return {
              ...f,
              etapas: novasEtapas
            };
          }
          return f;
        }));
        
        toast.success("Nova etapa adicionada com sucesso!");
      }
      
      setModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar etapa:", error);
      toast.error("Não foi possível salvar a etapa. Tente novamente.");
    }
  }
  
  function handleEditar(etapa: EtapaFunil) {
    setEditEtapa(etapa);
    setModalOpen(true);
  }
  
  async function handleExcluir(id: string) {
    if (!funilSelecionado || !currentCompany) return;
    
    if (etapas.length <= 1) {
      toast.error("Não é possível excluir a única etapa do funil.");
      return;
    }
    
    try {
      // Verificar se a etapa está sendo utilizada em leads
      const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('etapa_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error("Esta etapa está sendo utilizada em leads ativos e não pode ser excluída.");
        return;
      }
      
      // Excluir etapa
      const { error } = await supabase
        .from('funil_etapas')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar estado local
      const novasEtapas = etapas.filter(e => e.id !== id);
      setEtapas(novasEtapas);
      
      // Atualizar etapas do funil selecionado
      setFunis(prev => prev.map(f => {
        if (f.id === funilSelecionado.id) {
          return {
            ...f,
            etapas: novasEtapas
          };
        }
        return f;
      }));
      
      toast.success("Etapa excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir etapa:", error);
      toast.error("Não foi possível excluir a etapa. Tente novamente.");
    }
  }
  
  // Carregar dados iniciais
  useEffect(() => {
    if (currentCompany) {
      carregarFunis();
    }
  }, [currentCompany]);

  // Se estiver carregando, exiba indicador de carregamento
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando funis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">Configuração do Funil de Vendas</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus funis de vendas e suas etapas</p>
        </div>
        <Button variant="blue" size="sm" onClick={criarNovoFunil}>
          <Plus className="mr-1" />
          Novo Funil
        </Button>
      </div>

      <Tabs defaultValue="funis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funis">Funis</TabsTrigger>
          <TabsTrigger value="etapas">Etapas do Funil</TabsTrigger>
        </TabsList>
        
        {/* Conteúdo da tab Funis */}
        <TabsContent value="funis">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Funis de Vendas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead className="text-center">Etapas</TableHead>
                      <TableHead className="w-[100px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhum funil encontrado. Crie um novo funil.
                        </TableCell>
                      </TableRow>
                    ) : (
                      funis.map(funil => (
                        <TableRow key={funil.id} className={`hover:bg-accent/30 transition-colors ${funil.id === funilSelecionado?.id ? 'bg-accent/40' : ''}`}>
                          <TableCell className="font-medium">{funil.nome}</TableCell>
                          <TableCell>{funil.descricao || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={funil.ativo ? "success" : "destructive"}
                              className="capitalize"
                            >
                              {funil.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(funil.data_criacao).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-center">{funil.etapas.length}</TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu de ações</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                                  <DropdownMenuItem
                                    onClick={() => editarFunil(funil)}
                                    className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => excluirFunil(funil.id)}
                                    className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => selecionarFunil(funil)}
                                    className="flex items-center gap-2 text-green-500 focus:bg-green-100 focus:text-green-700"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                    Selecionar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {funis.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={6} className="font-normal text-right text-muted-foreground text-xs">
                          Total de funis: <span className="font-semibold text-foreground">{funis.length}</span>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Conteúdo da tab Etapas */}
        <TabsContent value="etapas">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base sm:text-lg">
                Etapas do Funil: {funilSelecionado?.nome}
              </CardTitle>
              <Button variant="blue" size="sm" onClick={handleNovo}>
                <Plus className="mr-1" />
                Nova etapa
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead className="w-32 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etapas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhuma etapa cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      etapas.sort((a, b) => a.ordem - b.ordem).map(etapa => (
                        <TableRow key={etapa.id} className="hover:bg-accent/30 transition-colors">
                          <TableCell>{etapa.nome}</TableCell>
                          <TableCell>
                            <span 
                              className="inline-block w-6 h-6 rounded-full border" 
                              style={{
                                background: etapa.cor,
                                borderColor: "#E5E7EB"
                              }}
                            />
                          </TableCell>
                          <TableCell>{etapa.ordem}</TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu de ações</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                                  <DropdownMenuItem
                                    onClick={() => handleEditar(etapa)}
                                    className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleExcluir(etapa.id)}
                                    className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {etapas.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-normal text-right text-muted-foreground text-xs">
                          Total de etapas: <span className="font-semibold text-foreground">{etapas.length}</span>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal para adicionar/editar etapas */}
      <FunilFormModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onConfirm={handleSalvarEtapa} 
        etapa={editEtapa ? {
          nome: editEtapa.nome,
          cor: editEtapa.cor,
          ordem: editEtapa.ordem
        } : undefined} 
      />
      
      {/* Modal para adicionar/editar funil */}
      <Dialog open={modalFunilOpen} onOpenChange={setModalFunilOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{novoFunil ? 'Criar Novo Funil' : 'Editar Funil'}</DialogTitle>
            <DialogDescription>
              {novoFunil 
                ? 'Preencha os campos abaixo para criar um novo funil de vendas.' 
                : 'Altere as informações do funil conforme necessário.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome do Funil *
              </label>
              <Input
                id="nome"
                value={nomeFunil}
                onChange={(e) => setNomeFunil(e.target.value)}
                placeholder="Ex: Funil de Vendas B2B"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="descricao" className="text-sm font-medium">
                Descrição
              </label>
              <Input
                id="descricao"
                value={descricaoFunil}
                onChange={(e) => setDescricaoFunil(e.target.value)}
                placeholder="Ex: Funil para clientes corporativos"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativo"
                checked={ativoFunil}
                onChange={(e) => setAtivoFunil(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="ativo" className="text-sm font-medium">
                Funil ativo
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="blue" onClick={salvarFunil}>
              {novoFunil ? 'Criar Funil' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
