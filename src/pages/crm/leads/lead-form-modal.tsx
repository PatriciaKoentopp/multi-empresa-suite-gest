import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Origem, Usuario, MotivoPerda } from "@/types";
import { LeadDadosTab } from "./LeadDadosTab";
import { LeadFechamentoTab } from "./LeadFechamentoTab";
import { InteracoesTab } from "./components/InteracoesTab";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "./utils/leadUtils";
import { toast } from "sonner";
import { LeadInteracao, EtapaFunil } from "./types";
import { format } from "date-fns";

import { abrirWhatsApp } from "./utils/whatsappUtils";

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lead: any) => void;
  lead?: any;
  etapas: EtapaFunil[];
  origens: Origem[];
  usuarios: Usuario[];
  motivosPerda: MotivoPerda[];
}

export function LeadFormModal({ 
  open, 
  onClose, 
  onConfirm, 
  lead, 
  etapas, 
  origens, 
  usuarios, 
  motivosPerda 
}: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    favorecido_id: "",
    produto: "",
    produto_id: "",
    servico_id: "",
    email: "",
    telefone: "",
    etapaId: "",
    valor: 0,
    origemId: "",
    dataCriacao: new Date().toLocaleDateString("pt-BR"),
    ultimoContato: new Date().toLocaleDateString("pt-BR"),
    responsavelId: "",
  });

  // Estado para a nova interação
  const [novaInteracao, setNovaInteracao] = useState({
    tipo: "mensagem" as const,
    descricao: "",
    data: new Date(),
    responsavelId: "",
  });

  // Estado para armazenar interações do lead atual
  const [interacoes, setInteracoes] = useState<LeadInteracao[]>([]);
  const [carregandoInteracoes, setCarregandoInteracoes] = useState(false);

  // Estado para dados de fechamento
  const [fechamento, setFechamento] = useState<{
    status: "sucesso" | "perda";
    motivoPerdaId?: string;
    descricao: string;
    data: Date;
  } | null>(null);

  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState("dados");
  
  // Carregar interações quando um lead é editado
  useEffect(() => {
    if (lead?.id) {
      buscarInteracoes(lead.id);
      buscarFechamento(lead.id);
    } else {
      setInteracoes([]);
      setFechamento(null);
    }
  }, [lead]);

  const buscarInteracoes = async (leadId: string) => {
  setCarregandoInteracoes(true);
  console.log('Buscando interações para lead ID:', leadId);
  
  try {
    // Consulta principal para buscar todas as interações do lead
    const { data, error } = await supabase
      .from('leads_interacoes')
      .select('*')
      .eq('lead_id', leadId)
      .order('data', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar interações:', error);
      throw error;
    }
    
    console.log('Interações encontradas:', data?.length, data);
    
    if (!data || data.length === 0) {
      setInteracoes([]);
      setCarregandoInteracoes(false);
      return;
    }
    
    // Agora vamos buscar os dados dos responsáveis
    const responsaveisIds = data
      .filter(item => item.responsavel_id)
      .map(item => item.responsavel_id);
    
    let responsaveisMap = new Map();
    
    if (responsaveisIds.length > 0) {
      const { data: responsaveisData, error: responsaveisError } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', responsaveisIds);
      
      if (responsaveisError) {
        console.error('Erro ao buscar responsáveis:', responsaveisError);
      } else if (responsaveisData) {
        // Criar mapa de ID -> nome para fácil acesso
        responsaveisData.forEach(resp => {
          responsaveisMap.set(resp.id, resp.nome);
        });
      }
    }
    
    // Formatar as interações com nomes de responsáveis, mas sem converter as datas
    const interacoesFormatadas = data.map(item => ({
      id: item.id,
      leadId: item.lead_id,
      tipo: item.tipo,
      descricao: item.descricao,
      data: item.data,  // Usar a data exatamente como vem do banco
      responsavelId: item.responsavel_id,
      responsavelNome: item.responsavel_id ? (responsaveisMap.get(item.responsavel_id) || 'Desconhecido') : 'Não atribuído',
      status: item.status || 'Aberto'
    }));
    
    console.log('Interações formatadas:', interacoesFormatadas);
    setInteracoes(interacoesFormatadas);
  } catch (error) {
    console.error('Erro ao buscar interações:', error);
  } finally {
    setCarregandoInteracoes(false);
  }
};

  const buscarFechamento = async (leadId: string) => {
    try {
      console.log("Buscando fechamento para lead ID:", leadId);
      const { data, error } = await supabase
        .from('leads_fechamento')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar dados de fechamento:', error);
        return;
      }
      
      if (data) {
        console.log('Fechamento encontrado:', data);
        setFechamento({
          status: data.status,
          motivoPerdaId: data.motivo_perda_id,
          descricao: data.descricao || '',
          data: new Date(data.data)
        });
      } else {
        console.log('Nenhum fechamento encontrado para este lead');
        setFechamento(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de fechamento:', error);
    }
  };

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || "",
        empresa: lead.empresa || "",
        favorecido_id: lead.favorecido_id || "",
        produto: lead.produto || "",
        produto_id: lead.produto_id || "",
        servico_id: lead.servico_id || "",
        email: lead.email || "",
        telefone: lead.telefone || "",
        etapaId: lead.etapaId || (etapas.length > 0 ? etapas[0].id : ""),
        valor: lead.valor || 0,
        origemId: lead.origemId || "",
        dataCriacao: lead.dataCriacao || new Date().toLocaleDateString("pt-BR"),
        ultimoContato: lead.ultimoContato || new Date().toLocaleDateString("pt-BR"),
        responsavelId: lead.responsavelId || "",
      });
      
      // Inicializa a nova interação com o responsável atual do lead
      setNovaInteracao(prev => ({
        ...prev,
        data: new Date(),
        responsavelId: lead.responsavelId || ""
      }));
    } else {
      // Encontrar o primeiro usuário vendedor ativo, se existir
      const primeiroVendedor = usuarios.find(u => u.vendedor === "sim" && u.status === "ativo")?.id || "";
      const primeiraEtapa = etapas.length > 0 ? etapas[0].id : "";
      const primeiraOrigem = origens.length > 0 ? origens[0].id : "";
      
      setFormData({
        nome: "",
        empresa: "",
        favorecido_id: "",
        produto: "",
        produto_id: "",
        servico_id: "",
        email: "",
        telefone: "",
        etapaId: primeiraEtapa,
        valor: 0,
        origemId: primeiraOrigem,
        dataCriacao: new Date().toLocaleDateString("pt-BR"),
        ultimoContato: new Date().toLocaleDateString("pt-BR"),
        responsavelId: primeiroVendedor,
      });
      
      // Inicializa a nova interação com o primeiro vendedor
      setNovaInteracao(prev => ({
        ...prev,
        data: new Date(),
        responsavelId: primeiroVendedor
      }));

      // Reset do fechamento para null quando criamos um novo lead
      setFechamento(null);
    }
  }, [lead, etapas, origens, usuarios, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "valor" ? Number(value) : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para o campo Produto (aba dados)
  const handleProdutoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, produto: value }));
  };

  // Handler para mudanças em inputs EXCETO o campo data
  const handleInteracaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  // Handler para data
  const handleInteracaoDataChange = (date: Date) => {
    setNovaInteracao(prev => ({ ...prev, data: date }));
  };

  // Handler para seleção no formulário de nova interação
  const handleInteracaoSelectChange = (name: string, value: string) => {
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  // Adicionar interação ao banco de dados
  const adicionarInteracao = async () => {
    if (!lead?.id || novaInteracao.descricao.trim() === "" || !novaInteracao.responsavelId) {
      return;
    }

    try {
      const dataFormatada = format(novaInteracao.data, "yyyy-MM-dd");
      
      // Salvar no Supabase
      const { data, error } = await supabase
        .from('leads_interacoes')
        .insert([
          {
            lead_id: lead.id,
            tipo: novaInteracao.tipo,
            descricao: novaInteracao.descricao,
            data: dataFormatada,
            responsavel_id: novaInteracao.responsavelId,
            status: 'Aberto' // Definir o status inicial como "Aberto"
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Atualizar último contato do lead
      await supabase
        .from('leads')
        .update({ ultimo_contato: dataFormatada })
        .eq('id', lead.id);
      
      // Atualizar a lista local
      if (data && data[0]) {
        const novaInteracaoCompleta = {
          id: data[0].id,
          leadId: data[0].lead_id,
          tipo: data[0].tipo,
          descricao: data[0].descricao,
          data: formatDate(data[0].data),
          responsavelId: data[0].responsavel_id,
          responsavelNome: usuarios.find(u => u.id === data[0].responsavel_id)?.nome || 'Desconhecido',
          status: data[0].status || 'Aberto'
        };

        setInteracoes(prev => [novaInteracaoCompleta, ...prev]);
      }

      // Se o tipo de interação for WhatsApp, abrir o WhatsApp com a mensagem
      if (novaInteracao.tipo === "whatsapp" && lead.telefone) {
        abrirWhatsApp(lead.telefone, novaInteracao.descricao);
      }

      // Limpar o formulário
      setNovaInteracao({
        tipo: "mensagem",
        descricao: "",
        data: new Date(),
        responsavelId: novaInteracao.responsavelId
      });

    } catch (error) {
      console.error('Erro ao salvar interação:', error);
    }
  };

  // Função para excluir uma interação
  const excluirInteracao = async (interacaoId: string | number) => {
    if (!interacaoId) return;
    
    try {
      // Verificar o status da interação antes de excluir
      const interacaoParaExcluir = interacoes.find(item => item.id === interacaoId);
      if (interacaoParaExcluir && interacaoParaExcluir.status !== "Aberto") {
        toast.error("Não é possível excluir", {
          description: "Somente interações com status Aberto podem ser excluídas."
        });
        return;
      }
      
      const { error } = await supabase
        .from('leads_interacoes')
        .delete()
        .eq('id', interacaoId);
      
      if (error) throw error;
      
      // Atualizar a lista local
      setInteracoes(prev => prev.filter(item => item.id !== interacaoId));
      
      toast.success("Interação excluída com sucesso");
      
    } catch (error) {
      console.error('Erro ao excluir interação:', error);
      toast.error("Erro ao excluir", {
        description: "Ocorreu um erro ao excluir a interação."
      });
    }
  };

  // Função para confirmar a edição da interação
  const confirmarEdicaoInteracao = async (interacaoEditada: LeadInteracao) => {
  if (!interacaoEditada) return;
  
  try {
    // Verificar o tipo de dado da data
    let dataFormatada = interacaoEditada.data;
    
    // Se for um objeto Date, formatar para string (formato ISO) antes de enviar para o banco
    if (interacaoEditada.data instanceof Date) {
      dataFormatada = format(interacaoEditada.data, "yyyy-MM-dd");
    }
    
    const { error } = await supabase
      .from('leads_interacoes')
      .update({
        tipo: interacaoEditada.tipo,
        descricao: interacaoEditada.descricao,
        data: dataFormatada,
        responsavel_id: interacaoEditada.responsavelId,
        status: interacaoEditada.status || 'Aberto'
      })
      .eq('id', interacaoEditada.id);
    
    if (error) throw error;
    
    // Atualizar a lista local
    setInteracoes(prev => prev.map(item => 
      item.id === interacaoEditada.id ? {
        ...interacaoEditada,
        responsavelNome: usuarios.find(u => u.id === interacaoEditada.responsavelId)?.nome || 'Desconhecido'
      } : item
    ));
    
  } catch (error) {
    console.error('Erro ao atualizar interação:', error);
  }
};

  // Filtrar apenas origens ativas
  const origensAtivas = origens.filter(origem => origem.status === "ativo");
  
  // Filtrar apenas usuários que são vendedores e estão ativos
  const vendedoresAtivos = usuarios.filter(usuario => usuario.vendedor === "sim" && usuario.status === "ativo");

  // Função para obter o nome do responsável por ID
  const getNomeResponsavel = (id: string): string => {
    return usuarios.find(u => u.id === id)?.nome || "Não atribuído";
  };

  // Obter o ID da empresa
  const getEmpresaId = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data?.id;
    } catch (error) {
      console.error('Erro ao obter ID da empresa:', error);
      return null;
    }
  };

  // Função para salvar lead
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Salvando dados do lead...');
      // Obter o ID da empresa
      const empresaId = await getEmpresaId();
      
      if (!empresaId) {
        console.error('ID da empresa não encontrado');
        toast.error("Erro ao salvar", {
          description: "ID da empresa não encontrado"
        });
        return;
      }
      
      // Adicionar o ID da empresa aos dados do lead
      const leadDataWithCompany = {
        ...formData,
        empresa_id: empresaId
      };
      
      // Chamar a função original para salvar os dados do lead
      console.log('Salvando dados do lead:', leadDataWithCompany);
      onConfirm(leadDataWithCompany);
      
      // Fechar o modal após salvar
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error("Erro ao salvar os dados", {
        description: "Ocorreu um erro ao salvar o lead."
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-full p-0 overflow-y-auto">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>{lead ? `Editar Lead: ${lead.nome}` : "Novo Lead"}</SheetTitle>
              <SheetDescription>
                {lead ? "Atualize as informações e gerencie as interações do lead" : "Preencha as informações para criar um novo lead"}
              </SheetDescription>
            </SheetHeader>

            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="border-b px-6">
                <TabsList className="bg-transparent border-b-0 p-0">
                  <TabsTrigger 
                    value="dados" 
                    className="pb-2 pt-2 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                  >
                    Dados do Lead
                  </TabsTrigger>
                  <TabsTrigger 
                    value="interacoes" 
                    className="pb-2 pt-2 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                  >
                    Interações
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fechamento"
                    className="pb-2 pt-2 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                  >
                    Fechamento
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-auto">
                {/* DADOS */}
                <TabsContent value="dados" className="p-6 mt-0">
                  <form id="dadosLeadForm" onSubmit={handleSubmit}>
                    <LeadDadosTab
                      formData={formData}
                      handleChange={handleChange}
                      handleSelectChange={handleSelectChange}
                      etapas={etapas}
                      origensAtivas={origensAtivas}
                      vendedoresAtivos={vendedoresAtivos}
                    />
                  </form>
                </TabsContent>

                {/* INTERAÇÕES */}
                <TabsContent value="interacoes" className="mt-0 flex flex-col overflow-hidden">
                  <InteracoesTab
                    lead={lead}
                    interacoes={interacoes}
                    carregandoInteracoes={carregandoInteracoes}
                    novaInteracao={novaInteracao}
                    handleInteracaoChange={handleInteracaoChange}
                    handleInteracaoSelectChange={handleInteracaoSelectChange}
                    handleInteracaoDataChange={handleInteracaoDataChange}
                    adicionarInteracao={adicionarInteracao}
                    vendedoresAtivos={vendedoresAtivos}
                    getNomeResponsavel={getNomeResponsavel}
                  />
                </TabsContent>

                {/* FECHAMENTO */}
                <TabsContent value="fechamento" className="p-6 mt-0">
                  <LeadFechamentoTab
                    fechamento={fechamento}
                    setFechamento={setFechamento}
                    motivosPerda={motivosPerda}
                    leadId={lead?.id}
                  />
                </TabsContent>
              </div>
            </Tabs>
            
            <SheetFooter className="border-t p-6">
              <div className="flex justify-end gap-2 w-full">
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </SheetClose>
                <Button 
                  type="submit" 
                  form="dadosLeadForm" 
                  variant="blue"
                >
                  {lead ? "Salvar Alterações" : "Criar Lead"}
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
