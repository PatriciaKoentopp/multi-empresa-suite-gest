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

// Mock data para funis
const initialFunis: Funil[] = [
  {
    id: 1,
    nome: "Vendas Padrão",
    descricao: "Funil padrão de vendas",
    ativo: true,
    dataCriacao: "01/04/2025",
    etapas: [
      { id: 1, nome: "Qualificação", cor: "#3498db", ordem: 1 },
      { id: 2, nome: "Apresentação", cor: "#2ecc71", ordem: 2 },
      { id: 3, nome: "Proposta", cor: "#f39c12", ordem: 3 },
      { id: 4, nome: "Negociação", cor: "#9b59b6", ordem: 4 },
      { id: 5, nome: "Fechamento", cor: "#e74c3c", ordem: 5 },
    ]
  },
  {
    id: 2,
    nome: "Marketing Digital",
    descricao: "Funil de captação via marketing digital",
    ativo: true,
    dataCriacao: "05/04/2025",
    etapas: [
      { id: 6, nome: "Interesse", cor: "#1abc9c", ordem: 1 },
      { id: 7, nome: "Avaliação", cor: "#3498db", ordem: 2 },
      { id: 8, nome: "Decisão", cor: "#f39c12", ordem: 3 },
      { id: 9, nome: "Contratação", cor: "#27ae60", ordem: 4 },
    ]
  },
  {
    id: 3,
    nome: "Suporte",
    descricao: "Funil de suporte ao cliente",
    ativo: true,
    dataCriacao: "10/04/2025",
    etapas: [
      { id: 10, nome: "Abertura", cor: "#e74c3c", ordem: 1 },
      { id: 11, nome: "Análise", cor: "#f39c12", ordem: 2 },
      { id: 12, nome: "Resolução", cor: "#2ecc71", ordem: 3 },
      { id: 13, nome: "Feedback", cor: "#3498db", ordem: 4 },
    ]
  }
];

// Mock data para leads (atualizado com funilId)
const initialLeads = [
  {
    id: 1,
    nome: "João Silva",
    empresa: "Tech Solutions",
    email: "joao@techsolutions.com",
    telefone: "(11) 98765-4321",
    etapaId: 1,
    funilId: 1, // Funil Vendas Padrão
    valor: 5000,
    origemId: "1",
    dataCriacao: "10/04/2025",
    ultimoContato: "15/04/2025",
    responsavelId: "1",
  },
  {
    id: 2,
    nome: "Maria Oliveira",
    empresa: "Inovação Digital",
    email: "maria@inovacaodigital.com",
    telefone: "(11) 91234-5678",
    etapaId: 2,
    funilId: 1, // Funil Vendas Padrão
    valor: 8500,
    origemId: "2",
    dataCriacao: "05/04/2025",
    ultimoContato: "12/04/2025",
    responsavelId: "2",
  },
  {
    id: 3,
    nome: "Pedro Santos",
    empresa: "Global Services",
    email: "pedro@globalservices.com",
    telefone: "(11) 97777-8888",
    etapaId: 3,
    funilId: 1, // Funil Vendas Padrão
    valor: 12000,
    origemId: "3",
    dataCriacao: "01/04/2025",
    ultimoContato: "09/04/2025",
    responsavelId: "3",
  },
  {
    id: 4,
    nome: "Ana Costa",
    empresa: "Marketing Pro",
    email: "ana@marketingpro.com",
    telefone: "(11) 95555-6666",
    etapaId: 6,
    funilId: 2, // Funil Marketing Digital
    valor: 7500,
    origemId: "4",
    dataCriacao: "07/04/2025",
    ultimoContato: "14/04/2025",
    responsavelId: "1",
  },
  {
    id: 5,
    nome: "Carlos Mendes",
    empresa: "Suporte Tech",
    email: "carlos@suportetech.com",
    telefone: "(11) 94444-3333",
    etapaId: 10,
    funilId: 3, // Funil Suporte
    valor: 3000,
    origemId: "5",
    dataCriacao: "12/04/2025",
    ultimoContato: "16/04/2025",
    responsavelId: "3",
  },
];

// Mock data para origens - adicionado empresa_id que estava faltando
const initialOrigens: Origem[] = [
  {
    id: "1",
    nome: "Site",
    status: "ativo",
    empresa_id: "1", // Adicionado o campo empresa_id
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    nome: "Indicação",
    status: "ativo",
    empresa_id: "1", // Adicionado o campo empresa_id
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    nome: "LinkedIn",
    status: "ativo",
    empresa_id: "1", // Adicionado o campo empresa_id
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    nome: "Evento",
    status: "ativo",
    empresa_id: "1", // Adicionado o campo empresa_id
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    nome: "Ligação",
    status: "ativo",
    empresa_id: "1", // Adicionado o campo empresa_id
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock data para usuários (vendedores)
const initialUsuarios: Usuario[] = [
  {
    id: "1",
    nome: "Ana Vendas",
    email: "ana@exemplo.com",
    senha: "senha123",
    tipo: "Usuário",
    status: "ativo",
    vendedor: "sim",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    nome: "Carlos Comercial",
    email: "carlos@exemplo.com",
    senha: "senha123",
    tipo: "Usuário",
    status: "ativo",
    vendedor: "sim",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    nome: "Pedro Marketing",
    email: "pedro@exemplo.com",
    senha: "senha123",
    tipo: "Usuário",
    status: "ativo",
    vendedor: "sim",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function LeadsPage() {
  const [leads, setLeads] = useState(initialLeads);
  const [filteredLeads, setFilteredLeads] = useState(initialLeads);
  const [searchTerm, setSearchTerm] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<typeof initialLeads[0] | null>(null);
  const [origens, setOrigens] = useState<Origem[]>(initialOrigens);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [funis, setFunis] = useState<Funil[]>(initialFunis);
  const [selectedFunilId, setSelectedFunilId] = useState<number>(1); // Padrão: primeiro funil

  // Obter o funil selecionado
  const selectedFunil = funis.find(funil => funil.id === selectedFunilId) || funis[0];

  // Função para filtrar leads com base no funil selecionado e outros filtros
  useEffect(() => {
    let filtered = [...leads].filter(lead => lead.funilId === selectedFunilId);

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (etapaFilter !== "all") {
      filtered = filtered.filter(
        (lead) => lead.etapaId === parseInt(etapaFilter)
      );
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, etapaFilter, selectedFunilId]);

  // Função para buscar origens e usuários (mock)
  useEffect(() => {
    // Em um cenário real, aqui faria uma chamada para API
    setOrigens(initialOrigens);
    setUsuarios(initialUsuarios);
    setFunis(initialFunis);
  }, []);

  const handleOpenFormModal = (lead = null) => {
    setEditingLead(lead);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingLead(null);
    setIsFormModalOpen(false);
  };

  // Função para salvar um novo lead ou atualizar um existente
  const handleSaveLead = (leadData) => {
    // Garantir que o lead seja salvo com o funilId selecionado
    const leadWithFunil = {
      ...leadData,
      funilId: selectedFunilId
    };

    if (editingLead) {
      // Atualizar lead existente
      const updatedLeads = leads.map((lead) =>
        lead.id === editingLead.id ? { ...leadWithFunil, id: lead.id } : lead
      );
      setLeads(updatedLeads);
      toast.success("Lead atualizado com sucesso!");
    } else {
      // Criar novo lead
      const newLead = {
        ...leadWithFunil,
        id: leads.length > 0 ? Math.max(...leads.map((l) => l.id)) + 1 : 1,
      };
      setLeads([...leads, newLead]);
      toast.success("Lead criado com sucesso!");
    }
    handleCloseFormModal();
  };

  // Função para deletar um lead
  const handleDeleteLead = (id) => {
    setLeads(leads.filter((lead) => lead.id !== id));
    toast.success("Lead removido com sucesso!");
  };

  // Função para mover lead para outra etapa
  const handleMoveLead = (leadId: number, newEtapaId: number) => {
    const updatedLeads = leads.map(lead => 
      lead.id === leadId ? { ...lead, etapaId: newEtapaId } : lead
    );
    setLeads(updatedLeads);
    toast.success("Lead movido com sucesso!");
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
    const targetEtapaId = parseInt(destination.droppableId);
    // Convertendo o id do lead para número
    const leadId = parseInt(draggableId);

    // Atualizando o lead
    const updatedLeads = leads.map(lead => 
      lead.id === leadId ? { ...lead, etapaId: targetEtapaId } : lead
    );

    setLeads(updatedLeads);
    toast.success("Lead movido com sucesso!");
  };

  // Agrupar leads por etapa do funil
  const leadsByStage = selectedFunil.etapas.map(etapa => {
    const stageLeads = filteredLeads.filter(lead => lead.etapaId === etapa.id);
    return {
      etapa,
      leads: stageLeads
    };
  });

  // Manipulador para quando o funil é alterado
  const handleFunilChange = (funilId: string) => {
    setSelectedFunilId(Number(funilId));
    setEtapaFilter("all"); // Reset do filtro de etapa quando mudar o funil
  };

  // Obter apenas etapas do funil selecionado para o filtro
  const etapasFunilSelecionado = selectedFunil ? selectedFunil.etapas : [];

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
                value={selectedFunilId.toString()}
                onValueChange={handleFunilChange}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecionar funil" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {funis.map((funil) => (
                    <SelectItem key={funil.id} value={funil.id.toString()}>
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
                    <SelectItem key={etapa.id} value={etapa.id.toString()}>
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
              {leadsByStage.map(({ etapa, leads }) => (
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
      />
    </div>
  );
}
