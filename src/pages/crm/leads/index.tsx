import React, { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { LeadCard } from "./lead-card";
import { LeadFormModal } from "./lead-form-modal";
import { StageFilterCheckbox } from "@/components/crm/leads/StageFilterCheckbox";
import { LeadFormData, EtapaFunil } from "./types";

interface MotivoPerda {
  id: string;
  nome: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

interface Origem {
  id: string;
  nome: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export default function LeadsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leads, setLeads] = useState<LeadFormData[]>([]);
  const [editingLead, setEditingLead] = useState<LeadFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [funilId, setFunilId] = useState<string>("todos");
  const [funis, setFunis] = useState<Funil[]>([]);
  const [etapas, setEtapas] = useState<EtapaFunil[]>([]);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [motivosPerda, setMotivosPerda] = useState<MotivoPerda[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const { currentCompany } = useCompany();
  const [etapasSelecionadas, setEtapasSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    if (currentCompany?.id) {
      loadLeads();
      loadFunis();
      loadEtapas();
      loadOrigens();
      loadMotivosPerda();
      loadServicos();
      loadProdutos();
      loadUsuarios();
    }
  }, [currentCompany?.id]);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('empresa_id', currentCompany?.id);

      if (error) throw error;
      setLeads((data as LeadFormData[]) || []);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    }
  };

  const loadFunis = async () => {
    try {
      const { data, error } = await supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('ativo', true);

      if (error) throw error;
      
      // Filtrar funis válidos
      const funisValidos = (data || []).filter(funil => 
        funil.id && 
        typeof funil.id === 'string' && 
        funil.id.trim() !== ""
      );
      
      setFunis(funisValidos);
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
      toast.error('Erro ao carregar funis');
    }
  };

  const loadEtapas = async () => {
    try {
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*')
        .order('ordem');

      if (error) throw error;
      
      // Filtrar e mapear etapas válidas
      const etapasValidas: EtapaFunil[] = (data || [])
        .filter(etapa => 
          etapa.id && 
          typeof etapa.id === 'string' && 
          etapa.id.trim() !== "" && 
          etapa.nome
        )
        .map(etapa => ({
          id: etapa.id,
          nome: etapa.nome,
          cor: etapa.cor || '#000000',
          ordem: etapa.ordem,
          funil_id: etapa.funil_id
        }));
      
      setEtapas(etapasValidas);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas');
    }
  };

  const loadOrigens = async () => {
    try {
      const { data, error } = await supabase
        .from('origens')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      
      // Filtrar origens válidas
      const origensValidas = (data || []).filter(origem => 
        origem.id && 
        typeof origem.id === 'string' && 
        origem.id.trim() !== ""
      );
      
      setOrigens(origensValidas);
    } catch (error) {
      console.error('Erro ao carregar origens:', error);
      toast.error('Erro ao carregar origens');
    }
  };

  const loadMotivosPerda = async () => {
    try {
      const { data, error } = await supabase
        .from('motivos_perda')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setMotivosPerda((data as MotivoPerda[]) || []);
    } catch (error) {
      console.error('Erro ao carregar motivos de perda:', error);
      toast.error('Erro ao carregar motivos de perda');
    }
  };

  const loadServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setServicos((data as Servico[]) || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    }
  };

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setProdutos((data as Produto[]) || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const handleOpenModal = (lead?: LeadFormData) => {
    setEditingLead(lead || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleSaveLead = async (leadData: LeadFormData) => {
    try {
      const { data, error } = editingLead
        ? await supabase
            .from('leads')
            .update(leadData)
            .eq('id', editingLead.id)
            .select()
        : await supabase
            .from('leads')
            .insert([leadData])
            .select();

      if (error) throw error;

      toast.success(`Lead ${editingLead ? 'atualizado' : 'criado'} com sucesso!`);
      loadLeads();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
    } finally {
      handleCloseModal();
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Lead excluído com sucesso!');
      loadLeads();
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const filteredLeads = React.useMemo(() => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.empresa && lead.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.telefone && lead.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (funilId !== "todos") {
      filtered = filtered.filter(lead => lead.funil_id === funilId);
    }

    if (etapasSelecionadas.length > 0) {
      filtered = filtered.filter(lead => etapasSelecionadas.includes(lead.etapa_id));
    }

    return filtered;
  }, [leads, searchTerm, funilId, etapasSelecionadas]);

  const etapasDoFunil = React.useMemo(() => {
    return etapas.filter(etapa => etapa.funil_id === funilId || funilId === "todos");
  }, [etapas, funilId]);

  const handleEtapaFilterChange = (etapaId: string, checked: boolean) => {
    setEtapasSelecionadas(prev => {
      if (checked) {
        return [...prev, etapaId];
      } else {
        return prev.filter(id => id !== etapaId);
      }
    });
  };

  // Filtrar funis válidos para o Select
  const funisValidosParaSelect = funis.filter(funil => 
    funil.id && 
    typeof funil.id === 'string' && 
    funil.id.trim() !== "" && 
    funil.nome
  );

  // Filtrar etapas válidas para renderização
  const etapasValidasParaRender = etapasDoFunil.filter(etapa => 
    etapa.id && 
    typeof etapa.id === 'string' && 
    etapa.id.trim() !== "" && 
    etapa.nome
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-5 w-5 text-gray-500 absolute right-2 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={funilId} onValueChange={setFunilId}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por Funil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Funis</SelectItem>
                  {funisValidosParaSelect.map(funil => (
                    <SelectItem key={funil.id} value={funil.id}>
                      {funil.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Etapas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            {etapasValidasParaRender.map(etapa => (
              <StageFilterCheckbox
                key={etapa.id}
                id={etapa.id}
                label={etapa.nome}
                color={etapa.cor}
                checked={etapasSelecionadas.includes(etapa.id)}
                onCheckedChange={(checked) => handleEtapaFilterChange(etapa.id, checked)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLeads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => handleOpenModal(lead)}
            onDelete={() => handleDeleteLead(lead.id!)}
            etapas={etapas}
            origens={origens}
            usuarios={usuarios}
          />
        ))}
      </div>

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        lead={editingLead}
        onSave={handleSaveLead}
        funis={funis}
        etapas={etapas}
        origens={origens}
        motivosPerda={motivosPerda}
        favorecidos={[]}
        servicos={servicos}
        produtos={produtos}
      />
    </div>
  );
}
