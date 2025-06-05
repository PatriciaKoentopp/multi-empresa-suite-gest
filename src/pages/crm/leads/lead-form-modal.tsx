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

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSave: (lead: Lead) => void;
  funis: Funil[];
  etapas: Etapa[];
  origens: Origem[];
  motivosPerda: MotivoPerda[];
  favorecidos: any[];
  servicos: any[];
  produtos: any[];
}

interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  valor?: number;
  produto?: string;
  observacoes?: string;
  etapa_id: string;
  funil_id: string;
  origem_id?: string;
  responsavel_id?: string;
  data_criacao: string;
  ultimo_contato?: string;
  status: string;
  empresa_id: string;
  favorecido_id?: string;
  servico_id?: string;
  produto_id?: string;
}

interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

interface Etapa {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  cor?: string;
  funil_id: string;
  status: string;
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

interface Interacao {
  id?: string;
  lead_id: string;
  tipo: string;
  descricao: string;
  data: string;
  status: string;
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
  const [formData, setFormData] = useState<Partial<Lead>>({
    status: "ativo",
  });
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);

  useEffect(() => {
    if (lead) {
      setFormData(lead);
      loadInteracoes(lead.id);
    } else {
      setFormData({ status: "ativo" });
    }
  }, [lead]);

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

    setIsLoading(true);
    try {
      if (lead) {
        // Atualizar lead existente
        const { data, error } = await supabase
          .from('leads')
          .update({
            ...formData,
            empresa_id: currentCompany.id
          })
          .eq('id', lead.id)
          .select()
          .single();

        if (error) throw error;
        toast.success("Lead atualizado com sucesso!");
        onSave(data as Lead);
      } else {
        // Criar novo lead
        const { data, error } = await supabase
          .from('leads')
          .insert({
            ...formData,
            empresa_id: currentCompany.id,
            data_criacao: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Lead criado com sucesso!");
        onSave(data as Lead);
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
        .from('interacoes')
        .select('*')
        .eq('lead_id', leadId)
        .order('data', { ascending: false });

      if (error) throw error;
      setInteracoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar interações:', error);
      toast.error('Erro ao carregar interações');
    }
  };

  const handleCreateInteracao = async (interacao: Interacao) => {
    try {
      const { data, error } = await supabase
        .from('interacoes')
        .insert({
          ...interacao,
          empresa_id: currentCompany?.id
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Interação criada com sucesso!");
      setInteracoes(prev => [data, ...prev]);
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
        lead_id: lead.id,
        tipo: "whatsapp",
        descricao: `Mensagem enviada via WhatsApp para ${phoneNumber}`,
        data: new Date().toISOString().split('T')[0],
        status: "Concluído"
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
          <TabsContent value="fechamento" className="space-y-2">
            {lead && (
              <LeadFechamentoTab
                lead={lead}
                motivosPerda={motivosPerda}
                handleChange={handleChange}
              />
            )}
          </TabsContent>
          <TabsContent value="interacoes" className="space-y-2">
            {lead && (
              <InteracoesTab
                leadId={lead.id}
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
