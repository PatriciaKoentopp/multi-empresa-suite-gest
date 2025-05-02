
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Filter, Search } from "lucide-react";
import { LeadCard } from "./lead-card";
import { LeadFormModal } from "./lead-form-modal";
import { Origem, Usuario, Funil } from "@/types"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [motivosPerda, setMotivosPerda] = useState([]);
  const [selectedFunilId, setSelectedFunilId] = useState<string>("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  // Obter o funil selecionado
  const selectedFunil = funis.find(funil => funil.id === selectedFunilId) || funis[0];

  // Carregar dados do Supabase quando a página carregar
  useEffect(() => {
    fetchAllData();
  }, []);

  // Função para buscar todos os dados necessários
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Buscar empresa ID primeiro (necessário para todas as outras operações)
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .limit(1)
        .single();
        
      if (empresaError) throw empresaError;
      setEmpresaId(empresaData.id);
      
      // Buscar funis
      const { data: funisData, error: funisError } = await supabase
        .from('funis')
        .select('*, etapas:funil_etapas(id, nome, cor, ordem)')
        .eq('ativo', true)
        .eq('empresa_id', empresaData.id)
        .order('nome');

      if (funisError) throw funisError;
      
      // Transformar dados dos funis para o formato esperado
      const funisFormatados = funisData.map(funil => ({
        id: funil.id,
        nome: funil.nome,
        descricao: funil.descricao,
        ativo: funil.ativo,
        dataCriacao: new Date(funil.data_criacao).toLocaleDateString('pt-BR'),
        etapas: funil.etapas.sort((a, b) => a.ordem - b.ordem)
      }));
      
      setFunis(funisFormatados);
      
      // Definir o funil padrão como o primeiro da lista
      if (funisFormatados.length > 0 && !selectedFunilId) {
        setSelectedFunilId(funisFormatados[0].id);
      }

      // Buscar origens
      const { data: origensData, error: origensError } = await supabase
        .from('origens')
        .select('*')
        .eq('empresa_id', empresaData.id)
        .order('nome');

      if (origensError) throw origensError;
      setOrigens(origensData);

      // Buscar usuários vendedores
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('vendedor', 'sim')
        .eq('empresa_id', empresaData.id)
        .order('nome');

      if (usuariosError) throw usuariosError;
      setUsuarios(usuariosData);

      // Buscar motivos de perda
      const { data: motivosPerdaData, error: motivosPerdaError } = await supabase
        .from('motivos_perda')
        .select('*')
        .eq('status', 'ativo')
        .eq('empresa_id', empresaData.id)
        .order('nome');

      if (motivosPerdaError) throw motivosPerdaError;
      setMotivosPerda(motivosPerdaData);

      // Buscar leads após ter os dados de funis
      await fetchLeads(empresaData.id, funisFormatados.length > 0 ? funisFormatados[0].id : null);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error("Erro ao carregar dados", {
        description: "Não foi possível buscar os dados necessários."
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar leads baseado no funil selecionado
  const fetchLeads = async (empId: string = null, funilId: string = null) => {
    try {
      // Se não temos funil selecionado ainda, retorna
      const empresaIdToUse = empId || empresaId;
      if (!empresaIdToUse) return;
      
      const funilIdToFetch = funilId || selectedFunilId || (funis.length > 0 ? funis[0].id : null);
      
      if (!funilIdToFetch) return;
      
      const { data: leadsData, error: leadsError } = await supabase
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
          usuarios:responsavel_id (nome),
          produto
        `)
        .eq('funil_id', funilIdToFetch)
        .eq('empresa_id', empresaIdToUse)
        .eq('status', 'ativo');

      if (leadsError) throw leadsError;

      // Transformar os dados para o formato esperado pelo componente
      const leadsFormatados = leadsData.map(lead => ({
        id: lead.id,
        nome: lead.nome,
        empresa: lead.empresa,
        email: lead.email,
        telefone: lead.telefone,
        etapaId: lead.etapa_id,
        funilId: lead.funil_id,
        valor: Number(lead.valor),
        origemId: lead.origem_id,
        origemNome: lead.origens?.nome || 'Desconhecida',
        dataCriacao: new Date(lead.data_criacao).toLocaleDateString('pt-BR'),
        ultimoContato: lead.ultimo_contato ? new Date(lead.ultimo_contato).toLocaleDateString('pt-BR') : null,
        responsavelId: lead.responsavel_id,
        responsavelNome: lead.usuarios?.nome || 'Não atribuído',
        produto: lead.produto
      }));

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
    
    fetchLeads();
  }, [selectedFunilId]);

  // Filtrar leads baseado no termo de busca e etapa selecionada
  useEffect(() => {
    let filtered = [...leads];

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (etapaFilter !== "all") {
      filtered = filtered.filter(
        (lead) => lead.etapaId === etapaFilter
      );
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, etapaFilter]);

  const handleOpenFormModal = (lead = null) => {
    setEditingLead(lead);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingLead(null);
    setIsFormModalOpen(false);
  };

  // Função para salvar um novo lead ou atualizar um existente
  const handleSaveLead = async (leadData) => {
    try {
      // Garantir que temos um ID de empresa válido
      if (!leadData.empresa_id && !empresaId) {
        toast.error("Erro ao salvar lead", {
          description: "ID da empresa não encontrado."
        });
        return;
      }
      
      // Preparar os dados para o formato da tabela no Supabase
      const leadToSave = {
        nome: leadData.nome,
        empresa: leadData.empresa,
        email: leadData.email,
        telefone: leadData.telefone,
        etapa_id: leadData.etapaId,
        funil_id: selectedFunilId,
        valor: leadData.valor,
        origem_id: leadData.origemId,
        responsavel_id: leadData.responsavelId,
        produto: leadData.produto,
        empresa_id: leadData.empresa_id || empresaId
      };

      console.log('Dados a serem salvos:', leadToSave);

      if (editingLead) {
        // Atualizar lead existente
        const { error } = await supabase
          .from('leads')
          .update(leadToSave)
          .eq('id', editingLead.id);

        if (error) throw error;
        
        toast.success("Lead atualizado com sucesso!");
      } else {
        // Criar novo lead
        const { error } = await supabase
          .from('leads')
          .insert([leadToSave]);

        if (error) throw error;
        
        toast.success("Lead criado com sucesso!");
      }
      
      // Recarregar dados após salvar
      fetchLeads();
      handleCloseFormModal();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error("Erro ao salvar lead", {
        description: "Não foi possível salvar as alterações. Detalhes: " + error.message
      });
    }
  };

  // Função para deletar um lead
  const handleDeleteLead = async (id) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'inativo' })
        .eq('id', id);

      if (error) throw error;
      
      // Atualizar a lista de leads localmente
      setLeads(leads.filter((lead) => lead.id !== id));
      toast.success("Lead removido com sucesso!");
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      toast.error("Erro ao remover lead", {
        description: "Não foi possível remover o lead."
      });
    }
  };

  // Função para mover lead para outra etapa
  const handleMoveLead = async (leadId: string, newEtapaId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ etapa_id: newEtapaId })
        .eq('id', leadId);

      if (error) throw error;
      
      // Atualizar a lista de leads localmente
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

  // Função para lidar com o fim do drag and drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não tiver destino ou o destino for o mesmo que a origem, não faz nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Convertendo o id da etapa de destino para número
    const targetEtapaId = destination.droppableId;
    // Convertendo o id do lead para número
    const leadId = draggableId;

    // Chamando a função de mover lead
    handleMoveLead(leadId, targetEtapaId);
  };

  // Agrupar leads por etapa do funil
  const leadsByStage = selectedFunil?.etapas.map(etapa => {
    const stageLeads = filteredLeads.filter(lead => lead.etapaId === etapa.id);
    return {
      etapa,
      leads: stageLeads
    };
  }) || [];

  // Manipulador para quando o funil é alterado
  const handleFunilChange = (funilId: string) => {
    setSelectedFunilId(funilId);
    setEtapaFilter("all"); // Reset do filtro de etapa quando mudar o funil
  };

  // Obter apenas etapas do funil selecionado para o filtro
  const etapasFunilSelecionado = selectedFunil ? selectedFunil.etapas : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button 
          onClick={() => handleOpenFormModal()} 
          variant="blue"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Seletor de Funil */}
            <div className="w-full md:w-[250px]">
              <Select
                value={selectedFunilId || (funis.length > 0 ? funis[0].id : "")}
                onValueChange={handleFunilChange}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecionar funil" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
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

            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select
                value={etapaFilter}
                onValueChange={setEtapaFilter}
              >
                <SelectTrigger className="w-full bg-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por etapa" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {etapasFunilSelecionado.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Layout Kanban com Drag and Drop */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {leadsByStage?.map(({ etapa, leads }) => (
                <div key={etapa.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                  <div 
                    className="text-sm font-semibold mb-2 p-2 rounded-md flex justify-between items-center"
                    style={{ backgroundColor: `${etapa.cor}20`, color: etapa.cor }}
                  >
                    <span>{etapa.nome}</span>
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
