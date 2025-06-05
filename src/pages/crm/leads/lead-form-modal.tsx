
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { LeadDadosTab } from "./LeadDadosTab";
import { LeadFechamentoTab } from "./LeadFechamentoTab";
import { InteracoesTab } from "./components/InteracoesTab";
import { LeadFormData, EtapaFunil } from "./types";

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: LeadFormData | null;
  onSave: () => void;
}

export function LeadFormModal({ isOpen, onClose, lead, onSave }: LeadFormModalProps) {
  const [formData, setFormData] = useState<Partial<LeadFormData>>({});
  const [funis, setFunis] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<EtapaFunil[]>([]);
  const [origens, setOrigens] = useState<any[]>([]);
  const [favorecidos, setFavorecidos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [motivosPerda, setMotivosPerda] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      if (lead) {
        setFormData(lead);
      } else {
        setFormData({
          nome: '',
          empresa: '',
          email: '',
          telefone: '',
          valor: 0,
          funil_id: '',
          etapa_id: '',
          origem_id: '',
          produto: '',
          observacoes: '',
          status: 'ativo',
          empresa_id: currentCompany?.id || '',
          data_criacao: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, lead, currentCompany]);

  const loadFormData = async () => {
    if (!currentCompany?.id) return;

    try {
      // Carregar funis
      const { data: funisData } = await supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('ativo', true);

      setFunis(funisData || []);

      // Carregar etapas
      const { data: etapasData } = await supabase
        .from('funil_etapas')
        .select('*')
        .order('ordem');

      setEtapas(etapasData || []);

      // Carregar origens
      const { data: origensData } = await supabase
        .from('origens')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo');

      setOrigens(origensData || []);

      // Carregar motivos de perda
      const { data: motivosData } = await supabase
        .from('motivos_perda')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo');

      setMotivosPerda(motivosData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: number | undefined) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsAppClick = () => {
    if (formData.telefone) {
      const telefone = formData.telefone.replace(/\D/g, '');
      const url = `https://wa.me/55${telefone}`;
      window.open(url, '_blank');
    }
  };

  const handleSave = async () => {
    if (!formData.nome?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.funil_id) {
      toast.error('Funil é obrigatório');
      return;
    }

    if (!formData.etapa_id) {
      toast.error('Etapa é obrigatória');
      return;
    }

    setLoading(true);

    try {
      // Garantir que os campos obrigatórios estão presentes
      const leadData = {
        nome: formData.nome,
        empresa: formData.empresa || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        etapa_id: formData.etapa_id,
        funil_id: formData.funil_id,
        valor: formData.valor || 0,
        origem_id: formData.origem_id || null,
        data_criacao: formData.data_criacao || new Date().toISOString().split('T')[0],
        ultimo_contato: formData.ultimo_contato || null,
        responsavel_id: formData.responsavel_id || null,
        produto: formData.produto || null,
        observacoes: formData.observacoes || null,
        status: formData.status || 'ativo',
        empresa_id: currentCompany?.id,
        favorecido_id: formData.favorecido_id || null,
        servico_id: formData.servico_id || null,
        produto_id: formData.produto_id || null,
        motivo_perda_id: formData.motivo_perda_id || null
      };

      if (lead?.id) {
        // Atualizar
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', lead.id);

        if (error) throw error;
        toast.success('Lead atualizado com sucesso!');
      } else {
        // Criar
        const { error } = await supabase
          .from('leads')
          .insert(leadData);

        if (error) throw error;
        toast.success('Lead criado com sucesso!');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
            <TabsTrigger value="interacoes" disabled={!lead?.id}>Interações</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            <LeadDadosTab
              formData={formData}
              handleChange={handleChange}
              handleNumberChange={handleNumberChange}
              funis={funis}
              etapas={etapas}
              origens={origens}
              favorecidos={favorecidos}
              servicos={servicos}
              produtos={produtos}
              onWhatsAppClick={handleWhatsAppClick}
            />
          </TabsContent>

          <TabsContent value="fechamento" className="space-y-4">
            <LeadFechamentoTab
              lead={formData as LeadFormData}
              motivosPerda={motivosPerda}
              handleChange={handleChange}
            />
          </TabsContent>

          <TabsContent value="interacoes" className="space-y-4">
            {lead?.id && <InteracoesTab lead={lead} />}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
