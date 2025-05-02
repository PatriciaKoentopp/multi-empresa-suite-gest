
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Origem, Usuario, MotivoPerda } from "@/types";
import { format } from "date-fns";
import { Send, UserRound, Phone, Calendar, Mail, MessageCircle, Eye, Edit, Trash2, MessageSquare } from "lucide-react";

import { LeadDadosTab } from "./LeadDadosTab";
import { LeadFechamentoTab } from "./LeadFechamentoTab";
import { LeadInteracaoDataField } from "./LeadInteracaoDataField";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: string;
  valor: number;
  origemId: string;
  dataCriacao: string;
  ultimoContato: string;
  responsavelId: string;
  produto?: string;
}

interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

// Interface para as interações com o lead
interface LeadInteracao {
  id: number | string;
  leadId: string;
  tipo: "email" | "ligacao" | "reuniao" | "mensagem" | "whatsapp" | "telegram" | "instagram" | "facebook" | "outro";
  descricao: string;
  data: string;
  responsavelId: string;
}

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

export function LeadFormModal({ open, onClose, onConfirm, lead, etapas, origens, usuarios, motivosPerda }: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    produto: "",
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

  // Estados para visualizar/editar interação
  const [interacaoSelecionada, setInteracaoSelecionada] = useState<LeadInteracao | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [interacaoEditavel, setInteracaoEditavel] = useState<LeadInteracao | null>(null);

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

  // Carregar interações quando um lead é editado
  useEffect(() => {
    if (lead?.id) {
      buscarInteracoes(lead.id);
      buscarFechamento(lead.id);
    } else {
      setInteracoes([]);
    }
  }, [lead]);

  const buscarInteracoes = async (leadId: string) => {
    setCarregandoInteracoes(true);
    try {
      // Primeiro, buscar todas as interações do lead
      const { data: interacoesData, error: interacoesError } = await supabase
        .from('leads_interacoes')
        .select(`
          id,
          lead_id,
          tipo,
          descricao,
          data,
          responsavel_id
        `)
        .eq('lead_id', leadId)
        .order('data', { ascending: false });
      
      if (interacoesError) throw interacoesError;
      
      if (interacoesData && interacoesData.length > 0) {
        // Agora vamos buscar os nomes dos responsáveis em uma consulta separada
        const responsaveisIds = interacoesData
          .filter(item => item.responsavel_id)
          .map(item => item.responsavel_id);
        
        // Se temos responsáveis para buscar
        let responsaveisMap = new Map();
        if (responsaveisIds.length > 0) {
          const { data: responsaveisData, error: responsaveisError } = await supabase
            .from('usuarios')
            .select('id, nome')
            .in('id', responsaveisIds);
          
          if (responsaveisError) console.error('Erro ao buscar responsáveis:', responsaveisError);
          
          if (responsaveisData) {
            // Criar um mapa de id -> nome para fácil acesso
            responsaveisData.forEach(resp => {
              responsaveisMap.set(resp.id, resp.nome);
            });
          }
        }
        
        // Formatar as interações com os nomes dos responsáveis
        const interacoesFormatadas = interacoesData.map(item => ({
          id: item.id,
          leadId: item.lead_id,
          tipo: item.tipo,
          descricao: item.descricao,
          data: new Date(item.data).toLocaleDateString('pt-BR'),
          responsavelId: item.responsavel_id,
          responsavelNome: item.responsavel_id ? (responsaveisMap.get(item.responsavel_id) || 'Desconhecido') : 'Não atribuído'
        }));
        
        setInteracoes(interacoesFormatadas);
      } else {
        setInteracoes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
    } finally {
      setCarregandoInteracoes(false);
    }
  };

  const buscarFechamento = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads_fechamento')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setFechamento({
          status: data.status,
          motivoPerdaId: data.motivo_perda_id,
          descricao: data.descricao || '',
          data: new Date(data.data)
        });
      } else {
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
        produto: lead.produto || "",
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
        produto: "",
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
      const dataFormatada = format(novaInteracao.data, 'yyyy-MM-dd');
      
      // Salvar no Supabase
      const { data, error } = await supabase
        .from('leads_interacoes')
        .insert([
          {
            lead_id: lead.id,
            tipo: novaInteracao.tipo,
            descricao: novaInteracao.descricao,
            data: dataFormatada,
            responsavel_id: novaInteracao.responsavelId
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
          data: new Date(data[0].data).toLocaleDateString('pt-BR'),
          responsavelId: data[0].responsavel_id,
          responsavelNome: usuarios.find(u => u.id === data[0].responsavel_id)?.nome || 'Desconhecido'
        };

        setInteracoes(prev => [novaInteracaoCompleta, ...prev]);
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

  // Função para visualizar detalhes de uma interação
  const visualizarInteracao = (interacao: LeadInteracao) => {
    setInteracaoSelecionada(interacao);
    setIsViewDialogOpen(true);
  };

  // Função para editar uma interação
  const prepararEdicaoInteracao = (interacao: LeadInteracao) => {
    setInteracaoEditavel({...interacao});
    setIsEditDialogOpen(true);
  };

  // Função para confirmar a edição da interação
  const confirmarEdicaoInteracao = async () => {
    if (!interacaoEditavel) return;
    
    try {
      // Converter a data de string DD/MM/YYYY para formato ISO
      const partesData = interacaoEditavel.data.split('/');
      const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`; // YYYY-MM-DD
      
      const { error } = await supabase
        .from('leads_interacoes')
        .update({
          tipo: interacaoEditavel.tipo,
          descricao: interacaoEditavel.descricao,
          data: dataFormatada,
          responsavel_id: interacaoEditavel.responsavelId
        })
        .eq('id', interacaoEditavel.id);
      
      if (error) throw error;
      
      // Atualizar a lista local
      setInteracoes(prev => prev.map(item => 
        item.id === interacaoEditavel.id ? {
          ...interacaoEditavel,
          responsavelNome: usuarios.find(u => u.id === interacaoEditavel.responsavelId)?.nome || 'Desconhecido'
        } : item
      ));
      
      setIsEditDialogOpen(false);
      setInteracaoEditavel(null);
      
    } catch (error) {
      console.error('Erro ao atualizar interação:', error);
    }
  };

  // Função para abrir o diálogo de confirmação de exclusão
  const prepararExclusaoInteracao = (interacao: LeadInteracao) => {
    setInteracaoSelecionada(interacao);
    setIsDeleteDialogOpen(true);
  };

  // Função para excluir uma interação
  const excluirInteracao = async () => {
    if (!interacaoSelecionada) return;
    
    try {
      const { error } = await supabase
        .from('leads_interacoes')
        .delete()
        .eq('id', interacaoSelecionada.id);
      
      if (error) throw error;
      
      // Atualizar a lista local
      setInteracoes(prev => prev.filter(item => item.id !== interacaoSelecionada.id));
      setIsDeleteDialogOpen(false);
      setInteracaoSelecionada(null);
      
    } catch (error) {
      console.error('Erro ao excluir interação:', error);
    }
  };

  // Handler para mudanças no formulário de edição de interação
  const handleInteracaoEditavelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (interacaoEditavel) {
      setInteracaoEditavel(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  // Handler para seleção no formulário de edição de interação
  const handleInteracaoEditavelSelectChange = (name: string, value: string) => {
    if (interacaoEditavel) {
      setInteracaoEditavel(prev => prev ? { ...prev, [name]: value } : null);
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

  // Ícone para cada tipo de interação
  const getIconForInteraction = (tipo: string) => {
    switch (tipo) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "ligacao":
        return <Phone className="h-4 w-4" />;
      case "reuniao":
        return <Calendar className="h-4 w-4" />;
      case "mensagem":
        return <MessageCircle className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "telegram":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "instagram":
        return <MessageCircle className="h-4 w-4 text-pink-500" />;
      case "facebook":
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
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

  // Função para salvar lead e fechamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Obter o ID da empresa
      const empresaId = await getEmpresaId();
      
      if (!empresaId) {
        console.error('ID da empresa não encontrado');
        return;
      }
      
      // Se estamos editando um lead e temos dados de fechamento
      if (lead?.id && fechamento) {
        // Formatar a data para o formato do banco
        const dataFormatada = format(fechamento.data, 'yyyy-MM-dd');
        
        // Verificar se já existe um fechamento para este lead
        const { data: fechamentoExistente, error: errorCheck } = await supabase
          .from('leads_fechamento')
          .select('id')
          .eq('lead_id', lead.id)
          .maybeSingle();
        
        if (errorCheck) throw errorCheck;
        
        if (fechamentoExistente) {
          // Atualizar fechamento existente
          const { error } = await supabase
            .from('leads_fechamento')
            .update({
              status: fechamento.status,
              motivo_perda_id: fechamento.motivoPerdaId,
              descricao: fechamento.descricao,
              data: dataFormatada
            })
            .eq('id', fechamentoExistente.id);
          
          if (error) throw error;
        } else {
          // Criar novo fechamento
          const { error } = await supabase
            .from('leads_fechamento')
            .insert([
              {
                lead_id: lead.id,
                status: fechamento.status,
                motivo_perda_id: fechamento.motivoPerdaId,
                descricao: fechamento.descricao,
                data: dataFormatada
              }
            ]);
          
          if (error) throw error;
        }
      }

      // Adicionar o ID da empresa aos dados do lead
      const leadDataWithCompany = {
        ...formData,
        empresa_id: empresaId
      };
      
      // Chamar a função original para salvar os dados do lead
      onConfirm(leadDataWithCompany);
    } catch (error) {
      console.error('Erro ao salvar fechamento:', error);
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

            <Tabs defaultValue="dados" className="flex-1 overflow-hidden">
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
              <div className="flex-1 overflow-y-auto">
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
                      handleProdutoChange={handleProdutoChange}
                    />
                  </form>
                </TabsContent>
                {/* INTERAÇÕES */}
                <TabsContent value="interacoes" className="mt-0">
                  <ScrollArea className="h-full pb-6">
                    {lead ? (
                      <div className="px-6 space-y-6">
                        {/* Formulário para nova interação */}
                        <div className="border-b pb-6">
                          <h3 className="text-lg font-medium mb-4">Nova Interação</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="interacaoTipo">Tipo de Interação</Label>
                                <Select
                                  value={novaInteracao.tipo}
                                  onValueChange={(value) => handleInteracaoSelectChange("tipo", value)}
                                >
                                  <SelectTrigger id="interacaoTipo" className="bg-white">
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white z-50">
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="ligacao">Ligação</SelectItem>
                                    <SelectItem value="reuniao">Reunião</SelectItem>
                                    <SelectItem value="mensagem">Mensagem</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="telegram">Telegram</SelectItem>
                                    <SelectItem value="instagram">Direct do Instagram</SelectItem>
                                    <SelectItem value="facebook">Messenger do Facebook</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="interacaoResponsavel">Responsável</Label>
                                <Select
                                  value={novaInteracao.responsavelId}
                                  onValueChange={(value) => handleInteracaoSelectChange("responsavelId", value)}
                                >
                                  <SelectTrigger id="interacaoResponsavel" className="bg-white">
                                    <SelectValue placeholder="Selecione o responsável" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white z-50">
                                    {vendedoresAtivos.map((vendedor) => (
                                      <SelectItem key={vendedor.id} value={vendedor.id}>
                                        {vendedor.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Campo data interação */}
                            <div className="space-y-2">
                              <Label>Data da Interação</Label>
                              <LeadInteracaoDataField
                                date={novaInteracao.data}
                                onDateChange={handleInteracaoDataChange}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="interacaoDescricao">Descrição</Label>
                              <Textarea
                                id="interacaoDescricao"
                                name="descricao"
                                value={novaInteracao.descricao}
                                onChange={handleInteracaoChange}
                                placeholder="Descreva a interação..."
                                rows={4}
                                className="resize-none"
                              />
                            </div>

                            <Button
                              type="button"
                              onClick={adicionarInteracao}
                              variant="blue"
                              className="w-full sm:w-auto"
                              disabled={novaInteracao.descricao.trim() === "" || !novaInteracao.responsavelId}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Registrar Interação
                            </Button>
                          </div>
                        </div>

                        {/* Lista de interações existentes */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Histórico de Interações</h3>
                          {carregandoInteracoes ? (
                            <div className="text-center py-6">
                              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                              <p className="mt-2 text-sm text-muted-foreground">Carregando interações...</p>
                            </div>
                          ) : interacoes.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>Descrição</TableHead>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Responsável</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {interacoes.map((interacao) => (
                                  <TableRow key={interacao.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {getIconForInteraction(interacao.tipo)}
                                        <span className="capitalize">{interacao.tipo}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                      {interacao.descricao}
                                    </TableCell>
                                    <TableCell>{interacao.data}</TableCell>
                                    <TableCell>
                                      {interacao.responsavelNome || getNomeResponsavel(interacao.responsavelId)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => visualizarInteracao(interacao)}
                                        >
                                          <Eye className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => prepararEdicaoInteracao(interacao)}
                                        >
                                          <Edit className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => prepararExclusaoInteracao(interacao)}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              Nenhuma interação registrada.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 text-center py-10 text-muted-foreground">
                        As interações estarão disponíveis após criar o lead.
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                {/* FECHAMENTO */}
                <TabsContent value="fechamento" className="p-6 mt-0">
                  <LeadFechamentoTab
                    fechamento={fechamento}
                    setFechamento={setFechamento}
                    motivosPerda={motivosPerda}
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
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Interação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a interação
            </DialogDescription>
          </DialogHeader>
          
          {interacaoSelecionada && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 mb-4">
                {getIconForInteraction(interacaoSelecionada.tipo)}
                <span className="font-medium capitalize">
                  {interacaoSelecionada.tipo} - {interacaoSelecionada.data}
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Descrição</Label>
                <div className="border rounded-md p-3 bg-gray-50 min-h-[100px]">
                  {interacaoSelecionada.descricao}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Responsável</Label>
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <span>
                    {interacaoSelecionada.responsavelNome || getNomeResponsavel(interacaoSelecionada.responsavelId)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => setIsViewDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Interação</DialogTitle>
            <DialogDescription>
              Modifique os dados da interação
            </DialogDescription>
          </DialogHeader>
          
          {interacaoEditavel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={interacaoEditavel.tipo}
                    onValueChange={(v) => handleInteracaoEditavelSelectChange('tipo', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="ligacao">Ligação</SelectItem>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                      <SelectItem value="mensagem">Mensagem</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="instagram">Direct do Instagram</SelectItem>
                      <SelectItem value="facebook">Messenger do Facebook</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select
                    value={interacaoEditavel.responsavelId}
                    onValueChange={(v) => handleInteracaoEditavelSelectChange('responsavelId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedoresAtivos.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  name="data"
                  value={interacaoEditavel.data}
                  onChange={handleInteracaoEditavelChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  name="descricao"
                  value={interacaoEditavel.descricao}
                  onChange={handleInteracaoEditavelChange}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={confirmarEdicaoInteracao}
              variant="blue"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Interação</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir esta interação? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={excluirInteracao}
              variant="destructive"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
