import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Filter, Search, Cake, Loader2 } from "lucide-react";
import { LeadCard } from "./lead-card";
import { LeadFormModal } from "./lead-form-modal";
import { Origem, Usuario } from "@/types"; 
import { EtapaFunil, Funil } from "./types";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "./utils/leadUtils";
import { StageFilterCheckbox } from "@/components/crm/leads/StageFilterCheckbox";
import { useAuth } from "@/contexts/auth-context";

export default function LeadsPage() {
  const { user, userData, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEtapas, setSelectedEtapas] = useState<string[]>([]);
  const [allStagesSelected, setAllStagesSelected] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ativo");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [motivosPerda, setMotivosPerda] = useState<any[]>([]);
  const [selectedFunilId, setSelectedFunilId] = useState<string>("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gerandoLeadsAniversarios, setGerandoLeadsAniversarios] = useState(false);

  // Obter o funil selecionado
  const selectedFunil = funis.find(funil => funil.id === selectedFunilId) || (funis.length > 0 ? funis[0] : null);
  const isFunilAniversarios = selectedFunil?.nome?.toLowerCase().includes("aniversário") || 
                              selectedFunil?.nome?.toLowerCase().includes("aniversario");

  // Esperar que a autenticação seja carregada antes de buscar dados
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('Auth carregada, usuário autenticado:', userData);
      fetchAllData();
    } else if (!authLoading && !isAuthenticated) {
      console.log('Usuário não está autenticado');
      setLoadError("Usuário não autenticado");
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, userData]);

  // Função para buscar todos os dados necessários
  const fetchAllData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      console.log('Iniciando fetchAllData com userData:', userData);
      
      // Obter empresa_id do contexto de autenticação
      let empresaIdToUse = userData?.empresa_id;
      
      // Se o usuário não tem empresa_id, buscar da tabela empresas
      if (!empresaIdToUse) {
        console.log('Buscando empresa_id da tabela empresas');
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('id')
          .limit(1)
          .single();
          
        if (empresaError) {
          console.error('Erro ao buscar empresa:', empresaError);
          throw empresaError;
        }
        
        empresaIdToUse = empresaData?.id;
        console.log('Empresa ID obtido:', empresaIdToUse);
      } else {
        console.log('Usando empresa_id do usuário:', empresaIdToUse);
      }
      
      if (!empresaIdToUse) {
        throw new Error('Não foi possível obter o ID da empresa');
      }
      
      setEmpresaId(empresaIdToUse);
      
      // Buscar funis
      const { data: funisData, error: funisError } = await supabase
        .from('funis')
        .select('*, etapas:funil_etapas(id, nome, cor, ordem)')
        .eq('ativo', true)
        .eq('empresa_id', empresaIdToUse)
        .order('nome');

      if (funisError) {
        console.error('Erro ao buscar funis:', funisError);
        throw funisError;
      }
      
      console.log('Funis obtidos:', funisData?.length);
      
      // Transformar dados dos funis para o formato esperado
      const funisFormatados = (funisData || []).map(funil => ({
        id: funil.id,
        nome: funil.nome,
        descricao: funil.descricao,
        ativo: funil.ativo,
        empresa_id: funil.empresa_id,
        data_criacao: funil.data_criacao,
        etapas: (funil.etapas || []).sort((a: any, b: any) => a.ordem - b.ordem),
        created_at: funil.created_at ? new Date(funil.created_at) : undefined,
        updated_at: funil.updated_at ? new Date(funil.updated_at) : undefined
      }));
      
      console.log('Funis formatados:', funisFormatados?.length);
      setFunis(funisFormatados);
      
      // Definir o funil padrão como o primeiro da lista
      if (funisFormatados.length > 0) {
        console.log('Definindo funil padrão:', funisFormatados[0].id);
        setSelectedFunilId(funisFormatados[0].id);
      } else {
        console.log('Nenhum funil encontrado');
      }

      // Buscar origens
      const { data: origensData, error: origensError } = await supabase
        .from('origens')
        .select('*')
        .eq('empresa_id', empresaIdToUse)
        .order('nome');

      if (origensError) {
        console.error('Erro ao buscar origens:', origensError);
        throw origensError;
      }
      
      console.log('Origens obtidas:', origensData?.length);
      setOrigens(origensData || []);

      // Buscar usuários vendedores
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', empresaIdToUse)
        .order('nome');

      if (usuariosError) {
        console.error('Erro ao buscar vendedores:', usuariosError);
        throw usuariosError;
      }
      
      console.log('Usuários obtidos:', usuariosData?.length);
      
      const usuariosFormatados = (usuariosData || []).map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        status: usuario.status,
        vendedor: usuario.vendedor || 'nao',
        empresa_id: usuario.empresa_id,
        created_at: usuario.created_at ? new Date(usuario.created_at) : undefined,
        updated_at: usuario.updated_at ? new Date(usuario.updated_at) : undefined
      }));
      
      setUsuarios(usuariosFormatados);

      // Buscar motivos de perda
      const { data: motivosPerdaData, error: motivosPerdaError } = await supabase
        .from('motivos_perda')
        .select('*')
        .eq('status', 'ativo')
        .eq('empresa_id', empresaIdToUse)
        .order('nome');

      if (motivosPerdaError) {
        console.error('Erro ao buscar motivos de perda:', motivosPerdaError);
        throw motivosPerdaError;
      }
      
      console.log('Motivos de perda obtidos:', motivosPerdaData?.length);
      setMotivosPerda(motivosPerdaData || []);
      
      // Buscar leads após ter os dados de funis
      if (funisFormatados.length > 0) {
        await fetchLeads(empresaIdToUse, funisFormatados[0].id, funisFormatados);
      } else {
        setLeads([]);
        toast.error("Nenhum funil encontrado", {
          description: "Cadastre um funil para gerenciar seus leads."
        });
      }
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setLoadError(`Erro ao carregar dados: ${error.message}`);
      toast.error("Erro ao carregar dados", {
        description: "Não foi possível buscar os dados necessários."
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar leads baseado no funil selecionado
  const fetchLeads = async (
    empId: string | null = null, 
    funilId: string | null = null,
    funisData: Funil[] | null = null
  ) => {
    try {
      // Se não temos funil selecionado ainda, retorna
      const empresaIdToUse = empId || empresaId;
      if (!empresaIdToUse) {
        console.log('Sem empresa ID, não é possível buscar leads');
        return;
      }
      
      // Usar funisData se passado, senão usar o estado funis
      const funisParaBusca = funisData || funis;
      
      const funilIdToFetch = funilId || selectedFunilId || (funisParaBusca.length > 0 ? funisParaBusca[0].id : null);
      
      if (!funilIdToFetch) {
        console.log('Sem funil ID, não é possível buscar leads');
        setLeads([]);
        return;
      }
      
      console.log('Buscando leads para o funil:', funilIdToFetch);
      
      // Verificar se é funil de aniversários para aplicar filtro especial
      const funilParaFiltro = funisParaBusca.find(f => f.id === funilIdToFetch);
      const isFunilAniversariosLocal = funilParaFiltro?.nome?.toLowerCase().includes("aniversário") || 
                                       funilParaFiltro?.nome?.toLowerCase().includes("aniversario");

      // Modificar a consulta para incluir TODOS os campos necessários
      let query = supabase
        .from('leads')
        .select(`
          id, 
          nome, 
          empresa, 
          email, 
          telefone, 
          etapa_id, 
          funil_id,
          valor, 
          origem_id, 
          origens:origem_id (nome), 
          data_criacao, 
          ultimo_contato, 
          responsavel_id,
          produto,
          produto_id,
          servico_id,
          favorecido_id,
          status,
          data_aniversario
        `)
        .eq('funil_id', funilIdToFetch)
        .eq('empresa_id', empresaIdToUse)
        .eq('status', statusFilter);

      // Se for funil de aniversários, filtrar por data_aniversario <= hoje
      if (isFunilAniversariosLocal) {
        const hojeFormatado = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        query = query.lte('data_aniversario', hojeFormatado);
        console.log('Aplicando filtro de aniversário: data_aniversario <=', hojeFormatado);
      }

      const { data: leadsData, error: leadsError } = await query;

      if (leadsError) {
        console.error('Erro ao buscar leads:', leadsError);
        throw leadsError;
      }
      
      console.log('Leads encontrados:', leadsData?.length);
      
      if (!leadsData || leadsData.length === 0) {
        console.log('Nenhum lead encontrado');
        setLeads([]);
        return;
      }
      
      // Buscar informações dos responsáveis após obter os leads
      const responsaveisIds = leadsData
        .filter(lead => lead.responsavel_id)
        .map(lead => lead.responsavel_id);
      
      // Só busca usuários se houver IDs de responsáveis
      let responsaveisMap = new Map();
      
      if (responsaveisIds.length > 0) {
        const { data: responsaveisData, error: responsaveisError } = await supabase
          .from('usuarios')
          .select('id, nome')
          .in('id', responsaveisIds);
        
        if (responsaveisError) {
          console.error('Erro ao buscar responsáveis:', responsaveisError);
        } else if (responsaveisData) {
          // Criar mapa de ID -> nome para fácil acesso
          responsaveisData.forEach(resp => {
            responsaveisMap.set(resp.id, resp.nome);
          });
        }
      }
      
      // Transformar os dados para o formato esperado pelo componente
      const leadsFormatados = leadsData.map(lead => ({
        id: lead.id,
        nome: lead.nome,
        empresa: lead.empresa,
        email: lead.email || '',
        telefone: lead.telefone || '',
        etapaId: lead.etapa_id,
        funilId: lead.funil_id,
        valor: Number(lead.valor || 0),
        origemId: lead.origem_id || '',
        origemNome: lead.origens?.nome || 'Desconhecida',
        dataCriacao: lead.data_criacao ? new Date(lead.data_criacao).toLocaleDateString('pt-BR') : '',
        ultimoContato: lead.ultimo_contato ? new Date(lead.ultimo_contato).toLocaleDateString('pt-BR') : null,
        responsavelId: lead.responsavel_id || '',
        responsavelNome: lead.responsavel_id ? responsaveisMap.get(lead.responsavel_id) || 'Não atribuído' : 'Não atribuído',
        produto: lead.produto || '',
        produto_id: lead.produto_id || '',
        servico_id: lead.servico_id || '',
        favorecido_id: lead.favorecido_id || '',
        status: lead.status || 'ativo'
      }));

      console.log('Leads formatados:', leadsFormatados.length);
      setLeads(leadsFormatados);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast.error("Erro ao buscar leads", {
        description: "Não foi possível buscar os dados dos leads."
      });
    }
  };

  // Função para filtrar leads com base no funil selecionado e outros filtros
  useEffect(() => {
    if (!selectedFunil) return;
    
    console.log('Chamando fetchLeads devido à alteração em selectedFunilId ou statusFilter');
    fetchLeads();
  }, [selectedFunilId, statusFilter]);

  // Filtrar leads baseado no termo de busca e etapas selecionadas
  useEffect(() => {
    let filtered = [...(leads || [])];

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Aplicar filtro de etapas
    if (!allStagesSelected && selectedEtapas.length > 0) {
      filtered = filtered.filter(
        (lead) => selectedEtapas.includes(lead.etapaId)
      );
    }

    console.log('Leads filtrados:', filtered.length);
    setFilteredLeads(filtered);
  }, [leads, searchTerm, selectedEtapas, allStagesSelected]);

  const handleGerarLeadsAniversarios = async () => {
    if (!empresaId) {
      toast.error("Erro ao gerar leads", {
        description: "ID da empresa não encontrado."
      });
      return;
    }

    setGerandoLeadsAniversarios(true);
    
    try {
      const response = await fetch(
        "https://vbbfmmjohdmocnaxgmmd.supabase.co/functions/v1/gerar-leads-aniversarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Leads de aniversário gerados!`, {
          description: `${data.leadsGerados} lead(s) criado(s) com sucesso.`
        });
        
        await fetchLeads();
      } else {
        throw new Error(data.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro ao gerar leads de aniversários:", error);
      toast.error("Erro ao gerar leads", {
        description: error.message
      });
    } finally {
      setGerandoLeadsAniversarios(false);
    }
  };

  const handleOpenFormModal = (lead = null) => {
    setEditingLead(lead);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingLead(null);
    setIsFormModalOpen(false);
  };

  const handleSaveLead = async (leadData: any) => {
    try {
      if (!leadData.empresa_id && !empresaId) {
        toast.error("Erro ao salvar lead", {
          description: "ID da empresa não encontrado."
        });
        return;
      }
      
      // Verificar se etapaId está vazio e usar a primeira etapa disponível
      const etapaIdToUse = leadData.etapaId || (selectedFunil?.etapas?.[0]?.id);
      
      if (!etapaIdToUse) {
        toast.error("Erro ao salvar lead", {
          description: "Nenhuma etapa disponível para o funil selecionado."
        });
        return;
      }
      
      const leadToSave = {
        nome: leadData.nome,
        empresa: leadData.empresa,
        email: leadData.email,
        telefone: leadData.telefone,
        etapa_id: etapaIdToUse,
        funil_id: selectedFunilId,
        valor: leadData.valor,
        origem_id: leadData.origemId,
        responsavel_id: leadData.responsavelId,
        produto: leadData.produto,
        produto_id: leadData.produto_id,
        servico_id: leadData.servico_id,
        favorecido_id: leadData.favorecido_id,
        empresa_id: leadData.empresa_id || empresaId,
        status: leadData.status || 'ativo'
      };

      console.log('Dados a serem salvos:', leadToSave);

      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadToSave)
          .eq('id', editingLead.id);

        if (error) throw error;
        
        toast.success("Lead atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadToSave]);

        if (error) throw error;
        
        toast.success("Lead criado com sucesso!");
      }
      
      fetchLeads();
      handleCloseFormModal();
    } catch (error: any) {
      console.error('Erro ao salvar lead:', error);
      toast.error("Erro ao salvar lead", {
        description: "Não foi possível salvar as alterações. Detalhes: " + error.message
      });
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'inativo' })
        .eq('id', id);

      if (error) throw error;
      
      setLeads(leads.filter((lead) => lead.id !== id));
      toast.success("Lead removido com sucesso!");
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      toast.error("Erro ao remover lead", {
        description: "Não foi possível remover o lead."
      });
    }
  };

  const handleMoveLead = async (leadId: string, newEtapaId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ etapa_id: newEtapaId })
        .eq('id', leadId);

      if (error) throw error;
      
      const updatedLeads = leads.map(lead => 
        lead.id === leadId ? { ...lead, etapaId: newEtapaId } : lead
      );
      setLeads(updatedLeads);
      
      toast.success("Lead movido com sucesso!");
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast.error("Erro ao mover lead", {
        description: "Não foi possível mover o lead para a etapa selecionada."
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const targetEtapaId = destination.droppableId;
    const leadId = draggableId;

    handleMoveLead(leadId, targetEtapaId);
  };

  const handleFunilChange = (funilId: string) => {
    console.log('Alterando funil para:', funilId);
    setSelectedFunilId(funilId);
    setAllStagesSelected(true);
    setSelectedEtapas([]);
  };

  const handleStatusChange = (status: string) => {
    console.log('Alterando status para:', status);
    setStatusFilter(status);
  };
  
  const handleAllStagesToggle = (checked: boolean) => {
    console.log('Alterando seleção "todas as etapas" para:', checked);
    setAllStagesSelected(checked);
    if (checked) {
      setSelectedEtapas([]);
    }
  };
  
  const handleStageToggle = (etapaId: string, checked: boolean) => {
    console.log('Alterando seleção da etapa', etapaId, 'para:', checked);
    if (checked) {
      setSelectedEtapas(prev => [...prev, etapaId]);
      setAllStagesSelected(false);
    } else {
      setSelectedEtapas(prev => prev.filter(id => id !== etapaId));
      if (selectedEtapas.filter(id => id !== etapaId).length === 0) {
        setAllStagesSelected(true);
      }
    }
  };

  // Obter apenas etapas do funil selecionado para o filtro
  const etapasFunilSelecionado = selectedFunil ? (selectedFunil.etapas || []) : [];

  // Agrupar leads por etapa do funil
  const leadsByStage = (selectedFunil?.etapas || []).map(etapa => {
    const stageLeads = (filteredLeads || []).filter(lead => lead.etapaId === etapa.id);
    const totalValor = stageLeads.reduce((total, lead) => total + (lead.valor || 0), 0);
    
    return {
      etapa,
      leads: stageLeads,
      totalValor
    };
  });

  // Filtrar as etapas que devem ser exibidas com base na seleção do usuário
  const filteredStages = allStagesSelected
    ? leadsByStage
    : leadsByStage.filter(stage => selectedEtapas.includes(stage.etapa.id));

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Carregando...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex justify-center items-center h-64 flex-col">
        <div className="text-red-500 mb-4">{loadError}</div>
        <Button onClick={fetchAllData} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex gap-2">
            {isFunilAniversarios && (
              <Button 
                onClick={handleGerarLeadsAniversarios}
                variant="outline"
                disabled={gerandoLeadsAniversarios}
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                {gerandoLeadsAniversarios ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Cake className="mr-2 h-4 w-4" />
                )}
                Gerar Leads de Aniversários
              </Button>
            )}
            <Button 
              onClick={() => handleOpenFormModal()} 
              variant="blue"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Seletor de Funil */}
            <div className="w-full md:w-[250px]">
              <Select
                value={selectedFunilId || ""}
                onValueChange={handleFunilChange}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecionar funil" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {funis.map((funil) => (
                    <SelectItem key={funil.id} value={funil.id}>
                      {funil.nome}
                      {!funil.ativo && (
                        <Badge variant="secondary" className="ml-2">
                          Inativo
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Status */}
            <div className="w-full md:w-[180px]">
              <Select
                value={statusFilter}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="fechado">Fechados</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filtro de Etapas com Checkboxes */}
            <div className="w-full md:w-[200px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>Filtrar por etapa</span>
                    </div>
                    <Badge className="ml-2">
                      {allStagesSelected ? "Todas" : selectedEtapas.length}
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4 bg-white" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium mb-3">Etapas</h4>
                    
                    {/* Opção "Todas as etapas" */}
                    <StageFilterCheckbox
                      id="all-stages"
                      label="Todas as etapas"
                      checked={allStagesSelected}
                      onCheckedChange={handleAllStagesToggle}
                    />
                    
                    <div className="border-t my-2"></div>
                    
                    {/* Lista de etapas do funil selecionado */}
                    {etapasFunilSelecionado.map((etapa) => (
                      <StageFilterCheckbox
                        key={etapa.id}
                        id={etapa.id}
                        label={etapa.nome}
                        color={etapa.cor}
                        checked={allStagesSelected || selectedEtapas.includes(etapa.id)}
                        onCheckedChange={(checked) => handleStageToggle(etapa.id, checked)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Layout Kanban com Drag and Drop */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {filteredStages.map(({ etapa, leads, totalValor }) => (
                <div key={etapa.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                  <div 
                    className="text-sm font-semibold mb-2 p-2 rounded-md flex justify-between items-center"
                    style={{ backgroundColor: `${etapa.cor}20`, color: etapa.cor }}
                  >
                    <div>
                      <span>{etapa.nome}</span>
                      <div className="text-xs mt-1 opacity-90">
                        {formatCurrency(totalValor)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-white rounded-full text-xs">
                      {leads.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={etapa.id.toString()}>
                    {(provided) => (
                      <div 
                        className="space-y-2 min-h-[50px]" 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {leads.length > 0 ? (
                          leads.map((lead, index) => (
                            <Draggable 
                              key={lead.id} 
                              draggableId={lead.id.toString()} 
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="cursor-grab"
                                >
                                  <LeadCard
                                    lead={lead}
                                    etapas={etapasFunilSelecionado}
                                    origens={origens}
                                    usuarios={usuarios}
                                    onEdit={() => handleOpenFormModal(lead)}
                                    onDelete={() => handleDeleteLead(lead.id)}
                                    onMove={handleMoveLead}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-md">
                            Nenhum lead nesta etapa
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <LeadFormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        onConfirm={handleSaveLead}
        lead={editingLead}
        etapas={etapasFunilSelecionado}
        origens={origens}
        usuarios={usuarios}
        motivosPerda={motivosPerda}
      />
    </div>
  );
}
