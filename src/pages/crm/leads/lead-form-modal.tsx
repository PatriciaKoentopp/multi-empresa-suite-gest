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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Origem, Usuario } from "@/types";
import { format } from "date-fns";
import { Send, UserRound, Phone, Calendar, Mail, MessageCircle, Eye, Edit, Trash2 } from "lucide-react";

interface Lead {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: number;
  valor: number;
  origemId: string;
  dataCriacao: string;
  ultimoContato: string;
  responsavelId: string;
}

interface EtapaFunil {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}

// Interface para as interações com o lead
interface LeadInteracao {
  id: number;
  leadId: number;
  tipo: "email" | "ligacao" | "reuniao" | "mensagem" | "outro";
  descricao: string;
  data: string;
  responsavelId: string;
}

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lead: Omit<Lead, "id">) => void;
  lead?: Lead | null;
  etapas: EtapaFunil[];
  origens: Origem[];
  usuarios: Usuario[];
}

export function LeadFormModal({ open, onClose, onConfirm, lead, etapas, origens, usuarios }: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    telefone: "",
    etapaId: 1,
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
    data: new Date().toLocaleDateString("pt-BR"),
    responsavelId: "",
  });

  // Estados para visualizar/editar interação
  const [interacaoSelecionada, setInteracaoSelecionada] = useState<LeadInteracao | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [interacaoEditavel, setInteracaoEditavel] = useState<LeadInteracao | null>(null);

  // Mock de interações para o lead atual
  const [interacoes, setInteracoes] = useState<LeadInteracao[]>([]);

  // Carregar interações mock quando um lead é editado
  useEffect(() => {
    if (lead?.id) {
      // Aqui estamos adicionando dados mock para demonstração
      const mockInteracoes: LeadInteracao[] = [
        {
          id: 1,
          leadId: lead.id,
          tipo: "email",
          descricao: "Envio de proposta comercial detalhada.",
          data: "10/04/2025",
          responsavelId: lead.responsavelId,
        },
        {
          id: 2,
          leadId: lead.id,
          tipo: "ligacao",
          descricao: "Ligação para esclarecer dúvidas sobre os serviços oferecidos.",
          data: "12/04/2025",
          responsavelId: lead.responsavelId,
        },
        {
          id: 3,
          leadId: lead.id,
          tipo: "reuniao",
          descricao: "Reunião online para apresentação detalhada do produto.",
          data: "15/04/2025",
          responsavelId: lead.responsavelId,
        }
      ];
      
      setInteracoes(mockInteracoes);
    } else {
      setInteracoes([]);
    }
  }, [lead]);

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome,
        empresa: lead.empresa,
        email: lead.email,
        telefone: lead.telefone,
        etapaId: lead.etapaId,
        valor: lead.valor,
        origemId: lead.origemId,
        dataCriacao: lead.dataCriacao,
        ultimoContato: lead.ultimoContato,
        responsavelId: lead.responsavelId,
      });
      
      // Inicializa a nova interação com o responsável atual do lead
      setNovaInteracao(prev => ({
        ...prev,
        responsavelId: lead.responsavelId
      }));
    } else {
      // Encontrar o primeiro usuário vendedor ativo, se existir
      const primeiroVendedor = usuarios.find(u => u.vendedor === "sim" && u.status === "ativo")?.id || "";
      
      setFormData({
        nome: "",
        empresa: "",
        email: "",
        telefone: "",
        etapaId: etapas.length > 0 ? etapas[0].id : 1,
        valor: 0,
        origemId: origens.length > 0 ? origens[0].id : "",
        dataCriacao: new Date().toLocaleDateString("pt-BR"),
        ultimoContato: new Date().toLocaleDateString("pt-BR"),
        responsavelId: primeiroVendedor,
      });
      
      // Inicializa a nova interação com o primeiro vendedor
      setNovaInteracao(prev => ({
        ...prev,
        responsavelId: primeiroVendedor
      }));
    }
  }, [lead, etapas, origens, usuarios]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "valor" ? Number(value) : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === "etapaId" ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  // Handler para mudanças no formulário de nova interação
  const handleInteracaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  // Handler para seleção no formulário de nova interação
  const handleInteracaoSelectChange = (name: string, value: string) => {
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  // Adicionar nova interação
  const adicionarInteracao = () => {
    if (novaInteracao.descricao.trim() === "" || !novaInteracao.responsavelId) {
      return;
    }

    const novaInteracaoCompleta: LeadInteracao = {
      id: Date.now(), // ID temporário baseado no timestamp
      leadId: lead?.id || 0,
      tipo: novaInteracao.tipo,
      descricao: novaInteracao.descricao,
      data: novaInteracao.data,
      responsavelId: novaInteracao.responsavelId
    };

    setInteracoes(prev => [...prev, novaInteracaoCompleta]);
    
    // Resetar o formulário de nova interação, mantendo o responsável
    setNovaInteracao(prev => ({
      tipo: "mensagem",
      descricao: "",
      data: new Date().toLocaleDateString("pt-BR"),
      responsavelId: prev.responsavelId
    }));
    
    // Atualizar a data do último contato no lead
    setFormData(prev => ({
      ...prev,
      ultimoContato: new Date().toLocaleDateString("pt-BR")
    }));
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
  const confirmarEdicaoInteracao = () => {
    if (interacaoEditavel) {
      setInteracoes(prev => prev.map(item => 
        item.id === interacaoEditavel.id ? interacaoEditavel : item
      ));
      setIsEditDialogOpen(false);
      setInteracaoEditavel(null);
    }
  };

  // Função para abrir o diálogo de confirmação de exclusão
  const prepararExclusaoInteracao = (interacao: LeadInteracao) => {
    setInteracaoSelecionada(interacao);
    setIsDeleteDialogOpen(true);
  };

  // Função para excluir uma interação
  const excluirInteracao = () => {
    if (interacaoSelecionada) {
      setInteracoes(prev => prev.filter(item => item.id !== interacaoSelecionada.id));
      setIsDeleteDialogOpen(false);
      setInteracaoSelecionada(null);
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
      default:
        return <MessageCircle className="h-4 w-4" />;
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
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="dados" className="p-6 mt-0">
                  <form id="dadosLeadForm" onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome</Label>
                          <Input
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            placeholder="Nome do contato"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="empresa">Empresa</Label>
                          <Input
                            id="empresa"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleChange}
                            placeholder="Nome da empresa"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            placeholder="Telefone"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="etapa">Etapa do Funil</Label>
                          <Select
                            value={String(formData.etapaId)}
                            onValueChange={(value) => handleSelectChange("etapaId", value)}
                          >
                            <SelectTrigger id="etapa" className="bg-white">
                              <SelectValue placeholder="Selecione a etapa" />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-50">
                              {etapas.map((etapa) => (
                                <SelectItem key={etapa.id} value={String(etapa.id)}>
                                  {etapa.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="valor">Valor (R$)</Label>
                          <Input
                            id="valor"
                            name="valor"
                            type="number"
                            value={formData.valor}
                            onChange={handleChange}
                            placeholder="Valor"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="origem">Origem</Label>
                          <Select 
                            value={formData.origemId}
                            onValueChange={(value) => handleSelectChange("origemId", value)}
                          >
                            <SelectTrigger id="origem" className="bg-white">
                              <SelectValue placeholder="Selecione a origem" />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-50">
                              {origensAtivas.map((origem) => (
                                <SelectItem key={origem.id} value={origem.id}>
                                  {origem.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="responsavel">Responsável</Label>
                          <Select
                            value={formData.responsavelId}
                            onValueChange={(value) => handleSelectChange("responsavelId", value)}
                          >
                            <SelectTrigger id="responsavel" className="bg-white">
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-50">
                              {vendedoresAtivos.length > 0 ? (
                                vendedoresAtivos.map((vendedor) => (
                                  <SelectItem key={vendedor.id} value={vendedor.id}>
                                    {vendedor.nome}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  Nenhum vendedor disponível
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dataCriacao">Data de Criação</Label>
                          <Input
                            id="dataCriacao"
                            value={formData.dataCriacao}
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ultimoContato">Último Contato</Label>
                          <Input
                            id="ultimoContato"
                            value={formData.ultimoContato}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="interacoes" className="p-6 mt-0 space-y-6">
                  {lead ? (
                    <>
                      {/* Lista de interações existentes */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Histórico de Interações</h3>
                        <div className="space-y-4">
                          {interacoes.length > 0 ? (
                            interacoes.map((interacao) => (
                              <div key={interacao.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {getIconForInteraction(interacao.tipo)}
                                    <span className="font-medium capitalize">
                                      {interacao.tipo}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground mr-2">{interacao.data}</span>
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
                                </div>
                                <p className="text-sm line-clamp-2">{interacao.descricao}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <UserRound className="h-3 w-3" />
                                  <span>{getNomeResponsavel(interacao.responsavelId)}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              Nenhuma interação registrada.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Formulário para nova interação */}
                      <div className="border-t pt-6">
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
                    </>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      As interações estarão disponíveis após criar o lead.
                    </div>
                  )}
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

      {/* Diálogo para visualizar detalhes da interação */}
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
                  <span>{getNomeResponsavel(interacaoSelecionada.responsavelId)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar interação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Interação</DialogTitle>
            <DialogDescription>
              Altere as informações da interação
            </DialogDescription>
          </DialogHeader>
          
          {interacaoEditavel && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="editTipo">Tipo de Interação</Label>
                <Select
                  value={interacaoEditavel.tipo}
                  onValueChange={(value) => handleInteracaoEditavelSelectChange("tipo", value)}
                >
                  <SelectTrigger id="editTipo" className="bg-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="mensagem">Mensagem</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editDescricao">Descrição</Label>
                <Textarea
                  id="editDescricao"
                  name="descricao"
                  value={interacaoEditavel.descricao}
                  onChange={handleInteracaoEditavelChange}
                  className="resize-none"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editResponsavel">Responsável</Label>
                <Select
                  value={interacaoEditavel.responsavelId}
                  onValueChange={(value) => handleInteracaoEditavelSelectChange("responsavelId", value)}
                >
                  <SelectTrigger id="editResponsavel" className="bg-white">
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
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="blue" onClick={confirmarEdicaoInteracao}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta interação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {interacaoSelecionada && (
            <div className="border rounded-md p-3 bg-gray-50 my-4">
              <p className="font-medium capitalize">
                {interacaoSelecionada.tipo} - {interacaoSelecionada.data}
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {interacaoSelecionada.descricao}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={excluirInteracao}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
