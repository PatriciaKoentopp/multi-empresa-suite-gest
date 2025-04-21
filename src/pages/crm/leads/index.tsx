
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDown } from "lucide-react";
import { LeadCard } from "./lead-card";
import { LeadFormModal } from "./lead-form-modal";
import { useToast } from "@/components/ui/use-toast";

interface Lead {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: number;
  valor: number;
  origem: string;
  dataCriacao: string;
  ultimoContato: string;
  responsavel: string;
}

interface EtapaFunil {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}

// Dados mockados para etapas do funil
const etapasIniciais: EtapaFunil[] = [
  {
    id: 1,
    nome: "Prospecção",
    cor: "#0EA5E9",
    ordem: 1
  },
  {
    id: 2,
    nome: "Contato Inicial",
    cor: "#F59E0B",
    ordem: 2
  },
  {
    id: 3,
    nome: "Proposta Enviada",
    cor: "#10B981",
    ordem: 3
  },
  {
    id: 4,
    nome: "Negociação",
    cor: "#8B5CF6",
    ordem: 4
  },
  {
    id: 5,
    nome: "Fechamento",
    cor: "#F97316",
    ordem: 5
  }
];

// Dados mockados para leads
const leadsIniciais: Lead[] = [
  {
    id: 1,
    nome: "João Silva",
    empresa: "Tech Solutions",
    email: "joao@techsolutions.com",
    telefone: "(11) 98765-4321",
    etapaId: 1,
    valor: 5000,
    origem: "Site",
    dataCriacao: "15/04/2025",
    ultimoContato: "15/04/2025",
    responsavel: "Ana Vendas"
  },
  {
    id: 2,
    nome: "Maria Oliveira",
    empresa: "Consultoria ABC",
    email: "maria@consultoriaabc.com",
    telefone: "(11) 91234-5678",
    etapaId: 2,
    valor: 10000,
    origem: "Indicação",
    dataCriacao: "10/04/2025",
    ultimoContato: "18/04/2025",
    responsavel: "Carlos Comercial"
  },
  {
    id: 3,
    nome: "Pedro Souza",
    empresa: "Distribuição XYZ",
    email: "pedro@xyzdistr.com",
    telefone: "(11) 92222-3333",
    etapaId: 3,
    valor: 15000,
    origem: "LinkedIn",
    dataCriacao: "05/04/2025",
    ultimoContato: "19/04/2025",
    responsavel: "Ana Vendas"
  },
  {
    id: 4,
    nome: "Lucia Ferreira",
    empresa: "Indústrias LF",
    email: "lucia@lfindustrias.com",
    telefone: "(11) 94444-5555",
    etapaId: 4,
    valor: 25000,
    origem: "Evento",
    dataCriacao: "01/04/2025",
    ultimoContato: "17/04/2025",
    responsavel: "Carlos Comercial"
  },
  {
    id: 5,
    nome: "Rafael Mendes",
    empresa: "Serviços RM",
    email: "rafael@rmservicos.com",
    telefone: "(11) 96666-7777",
    etapaId: 5,
    valor: 8000,
    origem: "Site",
    dataCriacao: "20/03/2025",
    ultimoContato: "16/04/2025",
    responsavel: "Ana Vendas"
  },
  {
    id: 6,
    nome: "Carla Rodrigues",
    empresa: "Agência Digital",
    email: "carla@agenciadigital.com",
    telefone: "(11) 98888-9999",
    etapaId: 1,
    valor: 12000,
    origem: "Indicação",
    dataCriacao: "25/03/2025",
    ultimoContato: "20/04/2025",
    responsavel: "Pedro Marketing"
  },
  {
    id: 7,
    nome: "Marcos Almeida",
    empresa: "Construtora MA",
    email: "marcos@construtorama.com",
    telefone: "(11) 97777-8888",
    etapaId: 2,
    valor: 30000,
    origem: "Site",
    dataCriacao: "18/03/2025",
    ultimoContato: "19/04/2025",
    responsavel: "Pedro Marketing"
  }
];

export default function LeadsPage() {
  const { toast } = useToast();
  const [etapas, setEtapas] = useState<EtapaFunil[]>(etapasIniciais);
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [draggingLead, setDraggingLead] = useState<Lead | null>(null);

  // Buscar etapas do funil (em uma implementação real, isso viria de uma API)
  useEffect(() => {
    // Em uma implementação real, aqui teria uma chamada à API
    setEtapas(etapasIniciais.sort((a, b) => a.ordem - b.ordem));
  }, []);

  // Manipular a criação de um novo lead
  function handleNovoLead() {
    setEditLead(null);
    setModalOpen(true);
  }

  // Salvar lead (novo ou editado)
  function handleSalvarLead(lead: Omit<Lead, "id">) {
    if (editLead) {
      // Atualizar lead existente
      setLeads(prev => prev.map(l => l.id === editLead.id ? { ...l, ...lead } : l));
      toast({
        title: "Lead atualizado",
        description: "As informações do lead foram atualizadas com sucesso!"
      });
    } else {
      // Criar novo lead
      const novoId = leads.length > 0 ? Math.max(...leads.map(l => l.id)) + 1 : 1;
      setLeads(prev => [...prev, { id: novoId, ...lead }]);
      toast({
        title: "Lead criado",
        description: "Novo lead adicionado com sucesso!"
      });
    }
    setModalOpen(false);
  }

  // Editar lead existente
  function handleEditarLead(lead: Lead) {
    setEditLead(lead);
    setModalOpen(true);
  }

  // Manipuladores para drag and drop
  const handleDragStart = (lead: Lead) => {
    setDraggingLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, etapaId: number) => {
    e.preventDefault();
    if (draggingLead && draggingLead.etapaId !== etapaId) {
      // Atualizar a etapa do lead
      setLeads(prev =>
        prev.map(l =>
          l.id === draggingLead.id ? { ...l, etapaId } : l
        )
      );

      toast({
        title: "Lead movido",
        description: `Lead movido para etapa ${etapas.find(e => e.id === etapaId)?.nome}`
      });
    }
    setDraggingLead(null);
  };

  // Organizar leads por etapa
  const getLeadsPorEtapa = (etapaId: number) => {
    return leads.filter(lead => lead.etapaId === etapaId);
  };

  // Calcular o valor total de leads em uma etapa
  const calcularValorEtapa = (etapaId: number) => {
    return getLeadsPorEtapa(etapaId).reduce((acc, lead) => acc + lead.valor, 0);
  };

  return (
    <div className="container mx-auto px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">Gestão de Leads</h2>
          <p className="text-sm text-muted-foreground">Acompanhamento de oportunidades no funil de vendas</p>
        </div>
        <Button variant="blue" size="sm" onClick={handleNovoLead}>
          <Plus className="mr-1" />
          Novo Lead
        </Button>
      </div>

      <ResizablePanelGroup 
        direction="horizontal"
        className="min-h-[600px] w-full rounded-lg border bg-white"
      >
        {etapas.map((etapa, index) => (
          <React.Fragment key={etapa.id}>
            {index > 0 && <ResizableHandle withHandle />}
            <ResizablePanel 
              defaultSize={20} 
              minSize={15}
              className="transition-all duration-200"
            >
              <div 
                className="h-full flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, etapa.id)}
              >
                <div 
                  className="p-3 border-b"
                  style={{ backgroundColor: `${etapa.cor}15` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="block w-3 h-3 rounded-full border" 
                        style={{ backgroundColor: etapa.cor }}
                      ></span>
                      <h3 className="font-medium">{etapa.nome}</h3>
                    </div>
                    <div className="flex items-center text-sm font-medium">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {getLeadsPorEtapa(etapa.id).length}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: R$ {calcularValorEtapa(etapa.id).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2 bg-gray-50/50">
                  {getLeadsPorEtapa(etapa.id).map(lead => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      onEdit={() => handleEditarLead(lead)} 
                      onDragStart={() => handleDragStart(lead)}
                    />
                  ))}
                </div>
              </div>
            </ResizablePanel>
          </React.Fragment>
        ))}
      </ResizablePanelGroup>

      {modalOpen && (
        <LeadFormModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)}
          onConfirm={handleSalvarLead}
          lead={editLead}
          etapas={etapas}
        />
      )}
    </div>
  );
}
