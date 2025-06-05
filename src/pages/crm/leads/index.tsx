
import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { LeadCard } from "./components/LeadCard";
import { LeadModal } from "./components/LeadModal";

interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  valor?: number;
  status: string;
  etapa_id: string;
  funil_id: string;
  origem_id?: string;
  responsavel_id?: string;
  data_criacao: string;
  produto?: string;
  observacoes?: string;
  empresa_id: string;
}

interface Funil {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Etapa {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  funil_id: string;
}

interface Origem {
  id: string;
  nome: string;
  status: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (currentCompany?.id) {
      loadData();
    }
  }, [currentCompany?.id]);

  const loadData = async () => {
    try {
      console.log('Carregando dados...');
      
      // Carregar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('empresa_id', currentCompany?.id);

      if (leadsError) {
        console.error('Erro ao carregar leads:', leadsError);
        throw leadsError;
      }

      console.log('Leads carregados:', leadsData);
      setLeads(leadsData || []);

      // Carregar funis
      const { data: funisData, error: funisError } = await supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('ativo', true);

      if (funisError) {
        console.error('Erro ao carregar funis:', funisError);
        throw funisError;
      }

      console.log('Funis carregados:', funisData);
      setFunis(funisData || []);

      // Carregar etapas
      const { data: etapasData, error: etapasError } = await supabase
        .from('funil_etapas')
        .select('*')
        .order('ordem');

      if (etapasError) {
        console.error('Erro ao carregar etapas:', etapasError);
        throw etapasError;
      }

      console.log('Etapas carregadas:', etapasData);
      setEtapas(etapasData || []);

      // Carregar origens
      const { data: origensData, error: origensError } = await supabase
        .from('origens')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (origensError) {
        console.error('Erro ao carregar origens:', origensError);
        throw origensError;
      }

      console.log('Origens carregadas:', origensData);
      setOrigens(origensData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleCreateLead = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Lead excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    try {
      if (editingLead) {
        // Atualizar lead existente
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id);

        if (error) throw error;
        toast.success('Lead atualizado com sucesso!');
      } else {
        // Criar novo lead
        const { error } = await supabase
          .from('leads')
          .insert([{
            ...leadData,
            empresa_id: currentCompany?.id,
            data_criacao: new Date().toISOString().split('T')[0],
            status: 'ativo'
          }]);

        if (error) throw error;
        toast.success('Lead criado com sucesso!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.empresa && lead.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getEtapaNome = (etapaId: string) => {
    const etapa = etapas.find(e => e.id === etapaId);
    return etapa?.nome || 'Sem etapa';
  };

  const getEtapaCor = (etapaId: string) => {
    const etapa = etapas.find(e => e.id === etapaId);
    return etapa?.cor || '#cccccc';
  };

  const getOrigemNome = (origemId?: string) => {
    if (!origemId) return 'Não informada';
    const origem = origens.find(o => o.id === origemId);
    return origem?.nome || 'Não informada';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={handleCreateLead} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, empresa ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLeads.length > 0 ? (
          filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              etapaNome={getEtapaNome(lead.etapa_id)}
              etapaCor={getEtapaCor(lead.etapa_id)}
              origemNome={getOrigemNome(lead.origem_id)}
              onEdit={() => handleEditLead(lead)}
              onDelete={() => handleDeleteLead(lead.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              {leads.length === 0 
                ? "Nenhum lead cadastrado. Clique em 'Novo Lead' para criar o primeiro." 
                : "Nenhum lead encontrado com os filtros aplicados."}
            </p>
          </div>
        )}
      </div>

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={editingLead}
        funis={funis}
        etapas={etapas}
        origens={origens}
        onSave={handleSaveLead}
      />
    </div>
  );
}
