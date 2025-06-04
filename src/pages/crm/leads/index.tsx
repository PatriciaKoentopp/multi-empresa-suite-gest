import React, { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { LeadCard } from "./lead-card";
import { LeadFormModal } from "./lead-form-modal";
import { Funil, Origem, Usuario, MotivoPerda, Lead } from "@/types";
import { EtapaFunil } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [etapas, setEtapas] = useState<EtapaFunil[]>([]);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [motivosPerda, setMotivosPerda] = useState<MotivoPerda[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [funilFilter, setFunilFilter] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (currentCompany) {
      carregarLeads();
      carregarFunis();
      carregarEtapas();
      carregarOrigens();
      carregarUsuarios();
      carregarMotivosPerda();
    }
  }, [currentCompany]);

  const carregarLeads = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, nome, empresa, email, telefone, etapa_id, funil_id, valor, origem_id,
          data_criacao, ultimo_contato, responsavel_id, produto, status,
          favorecido_id, produto_id, servico_id,
          origens ( nome )
        `)
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;

      const leadsComNomes: Lead[] = data ? data.map((lead: any) => ({
        id: lead.id,
        nome: lead.nome,
        empresa: lead.empresa || "",
        email: lead.email || "",
        telefone: lead.telefone || "",
        etapaId: lead.etapa_id,
        funilId: lead.funil_id,
        valor: lead.valor || 0,
        origemId: lead.origem_id,
        dataCriacao: lead.data_criacao,
        ultimoContato: lead.ultimo_contato,
        responsavelId: lead.responsavel_id,
        produto: lead.produto || "",
        status: lead.status as "ativo" | "inativo" | "fechado",
        origemNome: lead.origens?.nome || "Desconhecida",
        responsavelNome: "Não atribuído",
        favorecido_id: lead.favorecido_id,
        produto_id: lead.produto_id,
        servico_id: lead.servico_id,
      })) : [];

      setLeads(leadsComNomes);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    }
  };

  const carregarFunis = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;
      setFunis((data as Funil[]) || []);
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
      toast.error('Erro ao carregar funis');
    }
  };

  const carregarEtapas = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*');

      if (error) throw error;
      setEtapas((data as EtapaFunil[]) || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas');
    }
  };

  const carregarOrigens = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('origens')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setOrigens((data as Origem[]) || []);
    } catch (error) {
      console.error('Erro ao carregar origens:', error);
      toast.error('Erro ao carregar origens');
    }
  };

  const carregarUsuarios = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setUsuarios((data as Usuario[]) || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const carregarMotivosPerda = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('motivos_perda')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setMotivosPerda((data as MotivoPerda[]) || []);
    } catch (error) {
      console.error('Erro ao carregar motivos de perda:', error);
      toast.error('Erro ao carregar motivos de perda');
    }
  };

  const handleOpenModal = (lead?: Lead) => {
    setEditingLead(lead ? { ...lead } : null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleConfirm = async (leadData: any) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update({
            nome: leadData.nome,
            empresa: leadData.empresa || "",
            email: leadData.email,
            telefone: leadData.telefone,
            etapa_id: leadData.etapaId,
            funil_id: leadData.funilId,
            valor: leadData.valor,
            origem_id: leadData.origemId,
            responsavel_id: leadData.responsavelId,
            produto: leadData.produto,
            status: leadData.status,
            favorecido_id: leadData.favorecido_id,
            produto_id: leadData.produto_id,
            servico_id: leadData.servico_id,
          })
          .eq('id', editingLead.id);

        if (error) throw error;
        toast.success("Lead atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('leads')
          .insert({
            nome: leadData.nome,
            empresa: leadData.empresa || "",
            email: leadData.email,
            telefone: leadData.telefone,
            etapa_id: leadData.etapaId,
            funil_id: leadData.funilId,
            valor: leadData.valor,
            origem_id: leadData.origemId,
            responsavel_id: leadData.responsavelId,
            produto: leadData.produto,
            status: leadData.status,
            favorecido_id: leadData.favorecido_id,
            produto_id: leadData.produto_id,
            servico_id: leadData.servico_id,
            empresa_id: currentCompany.id,
            data_criacao: new Date().toISOString().split('T')[0],
            ultimo_contato: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
        toast.success("Lead criado com sucesso!");
      }
      carregarLeads();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      toast.error("Erro ao salvar lead");
    }
  };

  const etapasFiltradas = funilFilter
    ? etapas.filter(etapa => etapa.funil_id === funilFilter)
    : etapas;

  const leadsFiltrados = leads.filter(lead => {
    const searchRegex = new RegExp(searchTerm, 'i');
    const searchMatch = searchRegex.test(lead.nome) || searchRegex.test(lead.empresa || '') || searchRegex.test(lead.email || '');
    const funilMatch = !funilFilter || lead.funilId === funilFilter;
    const etapaMatch = !etapaFilter || lead.etapaId === etapaFilter;

    return searchMatch && funilMatch && etapaMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={() => handleOpenModal()} variant="blue">
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lead..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Select value={funilFilter || "all_funnels"} onValueChange={(value) => setFunilFilter(value === "all_funnels" ? "" : value)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Filtrar por funil..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_funnels">Todos os funis</SelectItem>
                  {funis.map(funil => (
                    <SelectItem key={funil.id} value={funil.id}>{funil.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={etapaFilter || "all_stages"} onValueChange={(value) => setEtapaFilter(value === "all_stages" ? "" : value)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Filtrar por etapa..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_stages">Todas as etapas</SelectItem>
                  {etapasFiltradas.map(etapa => (
                    <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {leadsFiltrados.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={() => handleOpenModal(lead)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <LeadFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        lead={editingLead}
        etapas={etapas}
        origens={origens}
        usuarios={usuarios}
        motivosPerda={motivosPerda}
      />
    </div>
  );
}
