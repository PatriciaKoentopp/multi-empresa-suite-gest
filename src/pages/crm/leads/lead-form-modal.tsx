
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadDadosTab } from "./LeadDadosTab";
import { LeadFechamentoTab } from "./LeadFechamentoTab";
import { InteracoesTab } from "./components/InteracoesTab";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { LeadFormData, EtapaFunil, LeadInteracao } from "./types";

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: LeadFormData | null;
  onSave: (lead: LeadFormData) => void;
  funis: Funil[];
  etapas: EtapaFunil[];
  origens: Origem[];
  motivosPerda: MotivoPerda[];
  favorecidos: any[];
  servicos: any[];
  produtos: any[];
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

interface MotivoPerda {
  id: string;
  nome: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export function LeadFormModal({ 
  isOpen, 
  onClose, 
  lead, 
  onSave, 
  funis, 
  etapas, 
  origens, 
  motivosPerda, 
  favorecidos, 
  servicos, 
  produtos 
}: LeadFormModalProps) {
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState("dados");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<LeadFormData>>({
    status: "ativo",
  });
  const [interacoes, setInteracoes] = useState<LeadInteracao[]>([]);

  useEffect(() => {
    if (lead) {
      setFormData(lead);
      loadInteracoes(lead.id!);
    } else {
      setFormData({ 
        status: "ativo",
        data_criacao: new Date().toISOString().split('T')[0],
        etapa_id: "",
        funil_id: "",
        empresa_id: currentCompany?.id || "",
        nome: ""
      });
    }
  }, [lead, currentCompany?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (name: string, value: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!currentCompany?.id) {
      toast.error("Empresa não selecionada");
      return;
    }

    if (!formData.nome || !formData.etapa_id || !formData.funil_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      const leadToSave: LeadFormData = {
        ...formData as LeadFormData,
        empresa_id: currentCompany.id,
        nome: formData.nome!,
        etapa_id: formData.etapa_id!,
        funil_id: formData.funil_id!,
        data_criacao: lead ? lead.data_criacao : new Date().toISOString().split('T')[0]
      };

      if (lead) {
        // Atualizar lead existente
        const { data, error } = await supabase
          .from('leads')
          .update(leadToSave)
          .eq('id', lead.id)
          .select()
          .single();

        if (error) throw error;
        toast.success("Lead atualizado com sucesso!");
        onSave(data as LeadFormData);
      } else {
        // Criar novo lead
        const { data, error } = await supabase
          .from('leads')
          .insert(leadToSave)
          .select()
          .single();

        if (error) throw error;
        toast.success("Lead criado com sucesso!");
        onSave(data as LeadFormData);
      }
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar lead:", error);
      toast.error(error.message || "Erro ao salvar lead");
    } finally {
      setIsLoading(false);
    }
  };

  const loadInteracoes = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads_interacoes')
        .select('*')
        .eq('lead_id', leadId)
        .order('data', { ascending: false });

      if (error) throw error;
      
      // Converter para LeadInteracao
      const interacoesFormatadas: LeadInteracao[] = (data || []).map(item => ({
        id: item.id,
        leadId: item.lead_id,
        tipo: item.tipo as any,
        descricao: item.descricao,
        data: item.data,
        responsavelId: item.responsavel_id || "",
        status: item.status
      }));
      
      setInteracoes(interacoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar interações:', error);
      toast.error('Erro ao carregar interações');
    }
  };

  const handleCreateInteracao = async (interacao: LeadInteracao) => {
    try {
      const { data, error } = await supabase
        .from('leads_interacoes')
        .insert({
          lead_id: interacao.leadId,
          tipo: interacao.tipo,
          descricao: interacao.descricao,
          data: interacao.data,
          responsavel_id: interacao.responsavelId,
          status: interacao.status
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Interação criada com sucesso!");
      
      const novaInteracao: LeadInteracao = {
        id: data.id,
        leadId: data.lead_id,
        tipo: data.tipo,
        descricao: data.descricao,
        data: data.data,
        responsavelId: data.responsavel_id,
        status: data.status
      };
      
      setInteracoes(prev => [novaInteracao, ...prev]);
    } catch (error: any) {
      console.error("Erro ao criar interação:", error);
      toast.error(error.message || "Erro ao criar interação");
    }
  };

  const handleWhatsAppClick = () => {
    if (!formData.telefone) {
      toast.error("Número de telefone não informado");
      return;
    }

    let phoneNumber = formData.telefone.replace(/\D/g, "");
    
    if (phoneNumber.length === 11 && phoneNumber.startsWith("0")) {
      phoneNumber = phoneNumber.substring(1);
    }
    
    if (phoneNumber.length === 10) {
      phoneNumber = phoneNumber.substring(0, 2) + "9" + phoneNumber.substring(2);
    }
    
    if (!phoneNumber.startsWith("55")) {
      phoneNumber = "55" + phoneNumber;
    }

    const message = encodeURIComponent(`Olá ${formData.nome}, tudo bem?`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');

    // Registrar interação automática
    if (lead?.id && activeTab === "dados") {
      handleCreateInteracao({
        id: "",
        leadId: lead.id,
        tipo: "whatsapp",
        descricao: `Mensagem enviada via WhatsApp para ${phoneNumber}`,
        data: new Date().toISOString().split('T')[0],
        status: "Concluído",
        responsavelId: ""
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="fechamento" disabled={!lead}>Fechamento</TabsTrigger>
            <TabsTrigger value="interacoes" disabled={!lead}>Interações</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="space-y-2">
            <LeadDadosTab
              formData={formData as any}
              handleChange={handleChange}
              handleNumberChange={handleNumberChange}
              funis={funis}
              etapas={etapas as any}
              origens={origens}
              favorecidos={favorecidos}
              servicos={servicos}
              produtos={produtos}
              onWhatsAppClick={handleWhatsAppClick}
            />
          </TabsContent>
          <TabsContent value="fechamento" className="space-y-2">
            {lead && (
              <LeadFechamentoTab
                leadData={lead as any}
                motivosPerda={motivosPerda}
                handleChange={handleChange}
              />
            )}
          </TabsContent>
          <TabsContent value="interacoes" className="space-y-2">
            {lead && (
              <InteracoesTab
                leadId={lead.id!}
                interacoes={interacoes}
                onCreateInteracao={handleCreateInteracao}
              />
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
