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
import { Send, UserRound, Phone, Calendar, Mail, MessageCircle, Eye, Edit, Trash2 } from "lucide-react";

import { LeadDadosTab } from "./LeadDadosTab";
import { LeadFechamentoTab } from "./LeadFechamentoTab";
import { LeadInteracaoDataField } from "./LeadInteracaoDataField";

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
  motivosPerda: MotivoPerda[];
}

export function LeadFormModal({ open, onClose, onConfirm, lead, etapas, origens, usuarios, motivosPerda }: any) {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    produto: "", // campo produto adicionado
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
    data: new Date(),  // agora guarda Date
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

  // Estados para o fechamento do lead
  const [fechamentoStatus, setFechamentoStatus] = useState<"sucesso" | "perda" | null>(null);
  const [motivoPerdaSelecionado, setMotivoPerdaSelecionado] = useState("");
  const [descricaoFechamento, setDescricaoFechamento] = useState("");

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
        produto: lead.produto || "", // busca produto do lead se existir
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
        data: new Date(), // agora Date
        responsavelId: lead.responsavelId
      }));
    } else {
      // Encontrar o primeiro usuário vendedor ativo, se existir
      const primeiroVendedor = usuarios.find(u => u.vendedor === "sim" && u.status === "ativo")?.id || "";
      
      setFormData({
        nome: "",
        empresa: "",
        produto: "",
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
        data: new Date(), // agora Date
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

  // Handler para mudanças em inputs EXCETO o campo data
  const handleInteracaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  // Novo handler para data
  const handleInteracaoDataChange = (date: Date) => {
    setNovaInteracao(prev => ({ ...prev, data: date }));
  };

  // Handler para seleção no formulário de nova interação
  const handleInteracaoSelectChange = (name: string, value: string) => {
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  // Ao adicionar interação, formata a data para DD/MM/YYYY
  const adicionarInteracao = () => {
    if (novaInteracao.descricao.trim() === "" || !novaInteracao.responsavelId) {
      return;
    }
    const dataFormatada = novaInteracao.data
      ? format(novaInteracao.data, "dd/MM/yyyy")
      : new Date().toLocaleDateString("pt-BR");

    const novaInteracaoCompleta: LeadInteracao = {
      id: Date.now(),
      leadId: lead?.id || 0,
      tipo: novaInteracao.tipo,
      descricao: novaInteracao.descricao,
      data: dataFormatada,
      responsavelId: novaInteracao.responsavelId
    };

    setInteracoes(prev => [...prev, novaInteracaoCompleta]);

    setNovaInteracao(prev => ({
      tipo: "mensagem",
      descricao: "",
      data: new Date(), // Volta ao hoje
      responsavelId: prev.responsavelId
    }));

    setFormData(prev => ({
      ...prev,
      ultimoContato: dataFormatada
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
                  <TabsTrigger 
                    value="fechamento"
                    className="pb-2 pt-2 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                  >
                    Fechamento
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="dados" className="p-6 mt-0">
                  <form id="dadosLeadForm" onSubmit={handleSubmit}>
                    <LeadDadosTab
                      formData={formData}
                      handleChange={handleChange}
                      handleSelectChange={handleSelectChange}
                      etapas={etapas}
                      origensAtivas={origens.filter(origem => origem.status === "ativo")}
                      vendedoresAtivos={usuarios.filter(usuario => usuario.vendedor === "sim" && usuario.status === "ativo")}
                    />
                  </form>
                </TabsContent>

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

                            {/* Novo campo data interação */}
                            <div className="space-y-2">
                              <Label>Data da Interação</Label>
                              <LeadInteracaoDataField
                                date={novaInteracao.data || new Date()}
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

                        {/* Lista de interações existentes - Modificada para linhas de tabela */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Histórico de Interações</h3>
                          {interacoes.length > 0 ? (
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
                                    <TableCell>{getNomeResponsavel(interacao.responsavelId)}</TableCell>
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
                
                <TabsContent value="fechamento" className="p-6 mt-0">
                  <LeadFechamentoTab
                    fechamentoStatus={fechamentoStatus}
                    setFechamentoStatus={setFechamentoStatus}
                    motivoPerdaSelecionado={motivoPerdaSelecionado}
                    setMotivoPerdaSelecionado={setMotivoPerdaSelecionado}
                    descricaoFechamento={descricaoFechamento}
                    setDescricaoFechamento={setDescricaoFechamento}
                    motivosPerda={motivosPerda || []}
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
