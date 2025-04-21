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
import { Origem, Usuario } from "@/types"; // Importar tipos Origem e Usuario

// Mock data para etapas do funil de vendas
const etapasFunil = [
  { id: 1, nome: "Qualificação", cor: "#3498db", ordem: 1 },
  { id: 2, nome: "Apresentação", cor: "#2ecc71", ordem: 2 },
  { id: 3, nome: "Proposta", cor: "#f39c12", ordem: 3 },
  { id: 4, nome: "Negociação", cor: "#9b59b6", ordem: 4 },
  { id: 5, nome: "Fechamento", cor: "#e74c3c", ordem: 5 },
];

// Mock data para leads - Atualizado para usar responsavelId em vez de responsavel
const initialLeads = [
  {
    id: 1,
    nome: "João Silva",
    empresa: "Tech Solutions",
    email: "joao@techsolutions.com",
    telefone: "(11) 98765-4321",
    etapaId: 1,
    valor: 5000,
    origemId: "1",
    dataCriacao: "10/04/2025",
    ultimoContato: "15/04/2025",
    responsavelId: "1", // Atualizado para usar ID do responsável
  },
  {
    id: 2,
    nome: "Maria Oliveira",
    empresa: "Inovação Digital",
    email: "maria@inovacaodigital.com",
    telefone: "(11) 91234-5678",
    etapaId: 2,
    valor: 8500,
    origemId: "2",
    dataCriacao: "05/04/2025",
    ultimoContato: "12/04/2025",
    responsavelId: "2", // Atualizado para usar ID do responsável
  },
  {
    id: 3,
    nome: "Pedro Santos",
    empresa: "Global Services",
    email: "pedro@globalservices.com",
    telefone: "(11) 97777-8888",
    etapaId: 3,
    valor: 12000,
    origemId: "3",
    dataCriacao: "01/04/2025",
    ultimoContato: "09/04/2025",
    responsavelId: "3", // Atualizado para usar ID do responsável
  },
];

// Mock data para origens
const initialOrigens: Origem[] = [
  {
    id: "1",
    nome: "Site",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    nome: "Indicação",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    nome: "LinkedIn",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    nome: "Evento",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    nome: "Ligação",
    status: "ativo",
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
  const [editingLead, setEditingLead] = useState<typeof initialLeads[0] | null>(
    null
  );
  const [origens, setOrigens] = useState<Origem[]>(initialOrigens);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);

  // Função para filtrar leads
  useEffect(() => {
    let filtered = [...leads];

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
  }, [leads, searchTerm, etapaFilter]);

  // Função para buscar origens e usuários (mock)
  useEffect(() => {
    // Em um cenário real, aqui faria uma chamada para API
    setOrigens(initialOrigens);
    setUsuarios(initialUsuarios);
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
    if (editingLead) {
      // Atualizar lead existente
      const updatedLeads = leads.map((lead) =>
        lead.id === editingLead.id ? { ...leadData, id: lead.id } : lead
      );
      setLeads(updatedLeads);
      toast.success("Lead atualizado com sucesso!");
    } else {
      // Criar novo lead
      const newLead = {
        ...leadData,
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

  // Agrupar leads por etapa do funil
  const leadsByStage = etapasFunil.map(etapa => {
    const stageLeads = filteredLeads.filter(lead => lead.etapaId === etapa.id);
    return {
      etapa,
      leads: stageLeads
    };
  });

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
                  {etapasFunil.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id.toString()}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Layout Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-auto">
            {leadsByStage.map(({ etapa, leads }) => (
              <div key={etapa.id} className="min-w-[250px]">
                <div 
                  className="text-sm font-semibold mb-2 p-2 rounded-md"
                  style={{ backgroundColor: `${etapa.cor}20`, color: etapa.cor }}
                >
                  <span>{etapa.nome}</span>
                  <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs">
                    {leads.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {leads.length > 0 ? (
                    leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        etapas={etapasFunil}
                        origens={origens}
                        usuarios={usuarios}
                        onEdit={() => handleOpenFormModal(lead)}
                        onDelete={() => handleDeleteLead(lead.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-md">
                      Nenhum lead nesta etapa
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <LeadFormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        onConfirm={handleSaveLead}
        lead={editingLead}
        etapas={etapasFunil}
        origens={origens}
        usuarios={usuarios}
      />
    </div>
  );
}
