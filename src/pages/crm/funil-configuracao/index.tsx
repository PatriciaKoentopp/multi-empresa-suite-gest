
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { FunilFormModal } from "./funil-form-modal";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EtapaFunil {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}

interface Funil {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  dataCriacao: string;
  etapas: EtapaFunil[];
}

const etapasIniciais: EtapaFunil[] = [{
  id: 1,
  nome: "Prospecção",
  cor: "#0EA5E9",
  ordem: 1
}, {
  id: 2,
  nome: "Contato Inicial",
  cor: "#F59E0B",
  ordem: 2
}, {
  id: 3,
  nome: "Proposta Enviada",
  cor: "#10B981",
  ordem: 3
}, {
  id: 4,
  nome: "Negociação",
  cor: "#8B5CF6",
  ordem: 4
}, {
  id: 5,
  nome: "Fechamento",
  cor: "#F97316",
  ordem: 5
}];

// Funil padrão para inicializar o sistema
const funilPadrao: Funil = {
  id: 1,
  nome: "Funil de Vendas Padrão",
  descricao: "Funil de vendas padrão do sistema",
  ativo: true,
  dataCriacao: "21/04/2025",
  etapas: etapasIniciais
};

export default function FunilConfiguracaoPage() {
  // Lista de funis
  const [funis, setFunis] = useState<Funil[]>([funilPadrao]);
  
  // Estado para novo funil ou edição de funil existente
  const [novoFunil, setNovoFunil] = useState(false);
  const [funilSelecionado, setFunilSelecionado] = useState<Funil | null>(null);
  
  // Estados para etapas do funil
  const [etapas, setEtapas] = useState<EtapaFunil[]>(etapasIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEtapa, setEditEtapa] = useState<EtapaFunil | null>(null);
  
  // Estado para o painel lateral de criação/edição de funil
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nomeFunil, setNomeFunil] = useState("");
  const [descricaoFunil, setDescricaoFunil] = useState("");
  const [ativoFunil, setAtivoFunil] = useState(true);
  
  // Função para selecionar um funil para edição
  function selecionarFunil(funil: Funil) {
    setFunilSelecionado(funil);
    setEtapas(funil.etapas);
  }
  
  // Função para abrir painel de novo funil
  function criarNovoFunil() {
    setNovoFunil(true);
    setFunilSelecionado(null);
    setNomeFunil("");
    setDescricaoFunil("");
    setAtivoFunil(true);
    setSheetOpen(true);
  }
  
  // Função para abrir painel de edição de funil
  function editarFunil(funil: Funil) {
    setNovoFunil(false);
    setFunilSelecionado(funil);
    setNomeFunil(funil.nome);
    setDescricaoFunil(funil.descricao);
    setAtivoFunil(funil.ativo);
    setSheetOpen(true);
  }
  
  // Função para excluir um funil
  function excluirFunil(id: number) {
    if (funis.length <= 1) {
      toast.error("Não é possível excluir o único funil existente.");
      return;
    }
    
    setFunis(prev => {
      const novaLista = prev.filter(f => f.id !== id);
      // Se o funil excluído era o selecionado, seleciona o primeiro da lista
      if (funilSelecionado && funilSelecionado.id === id) {
        selecionarFunil(novaLista[0]);
      }
      return novaLista;
    });
    
    toast.success("Funil excluído com sucesso!");
  }
  
  // Função para salvar novo funil ou atualizar existente
  function salvarFunil() {
    if (!nomeFunil.trim()) {
      toast.error("O nome do funil é obrigatório");
      return;
    }
    
    // Cria data de criação formatada
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const dataFormatada = `${dia}/${mes}/${ano}`;
    
    if (novoFunil) {
      // Cria novo funil
      const novoId = Math.max(...funis.map(f => f.id)) + 1;
      const novoFunilObj: Funil = {
        id: novoId,
        nome: nomeFunil,
        descricao: descricaoFunil,
        ativo: ativoFunil,
        dataCriacao: dataFormatada,
        etapas: [...etapasIniciais] // Copia as etapas iniciais para o novo funil
      };
      
      setFunis(prev => [...prev, novoFunilObj]);
      selecionarFunil(novoFunilObj);
      toast.success("Novo funil criado com sucesso!");
    } else if (funilSelecionado) {
      // Atualiza funil existente
      const funilAtualizado: Funil = {
        ...funilSelecionado,
        nome: nomeFunil,
        descricao: descricaoFunil,
        ativo: ativoFunil
      };
      
      setFunis(prev => prev.map(f => f.id === funilSelecionado.id ? funilAtualizado : f));
      selecionarFunil(funilAtualizado);
      toast.success("Funil atualizado com sucesso!");
    }
    
    setSheetOpen(false);
  }
  
  // Funções para gerenciar etapas do funil
  function handleNovo() {
    setEditEtapa(null);
    setModalOpen(true);
  }
  
  function handleSalvarEtapa(nova: {
    nome: string;
    cor: string;
    ordem: number;
  }) {
    if (!funilSelecionado) return;
    
    let novasEtapas: EtapaFunil[];
    
    if (editEtapa) {
      novasEtapas = etapas.map(e => e.id === editEtapa.id ? {
        ...e,
        ...nova
      } : e);
    } else {
      // Cria nova etapa com id incremental calculado
      const proxId = etapas.length > 0 ? Math.max(...etapas.map(x => x.id)) + 1 : 1;
      novasEtapas = [...etapas, {
        id: proxId,
        ...nova
      }];
    }
    
    setEtapas(novasEtapas);
    
    // Atualiza etapas do funil selecionado
    setFunis(prev => prev.map(f => {
      if (f.id === funilSelecionado.id) {
        return {
          ...f,
          etapas: novasEtapas
        };
      }
      return f;
    }));
    
    setModalOpen(false);
  }
  
  function handleEditar(etapa: EtapaFunil) {
    setEditEtapa(etapa);
    setModalOpen(true);
  }
  
  function handleExcluir(id: number) {
    if (!funilSelecionado) return;
    
    if (etapas.length <= 1) {
      toast.error("Não é possível excluir a única etapa do funil.");
      return;
    }
    
    const novasEtapas = etapas.filter(e => e.id !== id);
    setEtapas(novasEtapas);
    
    // Atualiza etapas do funil selecionado
    setFunis(prev => prev.map(f => {
      if (f.id === funilSelecionado.id) {
        return {
          ...f,
          etapas: novasEtapas
        };
      }
      return f;
    }));
  }
  
  // Se não houver funil selecionado, seleciona o primeiro
  React.useEffect(() => {
    if (funis.length > 0 && !funilSelecionado) {
      selecionarFunil(funis[0]);
    }
  }, [funis, funilSelecionado]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">Configuração do Funil de Vendas</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus funis de vendas e suas etapas</p>
        </div>
        <Button variant="blue" size="sm" onClick={criarNovoFunil}>
          <Plus className="mr-1" />
          Novo Funil
        </Button>
      </div>

      <Tabs defaultValue="funis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funis">Funis</TabsTrigger>
          <TabsTrigger value="etapas">Etapas do Funil</TabsTrigger>
        </TabsList>
        
        {/* Conteúdo da tab Funis */}
        <TabsContent value="funis">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Funis de Vendas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead className="text-center">Etapas</TableHead>
                      <TableHead className="w-[100px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funis.map(funil => (
                      <TableRow key={funil.id} className={`hover:bg-accent/30 transition-colors ${funil.id === funilSelecionado?.id ? 'bg-accent/40' : ''}`}>
                        <TableCell className="font-medium">{funil.nome}</TableCell>
                        <TableCell>{funil.descricao}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${funil.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {funil.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell>{funil.dataCriacao}</TableCell>
                        <TableCell className="text-center">{funil.etapas.length}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-blue-500 hover:bg-blue-100 focus:bg-blue-100" 
                              onClick={() => editarFunil(funil)}
                            >
                              <Edit />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:bg-red-100 focus:bg-red-100" 
                              onClick={() => excluirFunil(funil.id)}
                            >
                              <Trash2 />
                              <span className="sr-only">Excluir</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-500 hover:bg-green-100 focus:bg-green-100" 
                              onClick={() => selecionarFunil(funil)}
                            >
                              <ArrowRight />
                              <span className="sr-only">Selecionar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} className="font-normal text-right text-muted-foreground text-xs">
                        Total de funis: <span className="font-semibold text-foreground">{funis.length}</span>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Conteúdo da tab Etapas */}
        <TabsContent value="etapas">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base sm:text-lg">
                Etapas do Funil: {funilSelecionado?.nome}
              </CardTitle>
              <Button variant="blue" size="sm" onClick={handleNovo}>
                <Plus className="mr-1" />
                Nova etapa
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead className="w-32 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etapas.length === 0 ? <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhuma etapa cadastrada
                        </TableCell>
                      </TableRow> : etapas.sort((a, b) => a.ordem - b.ordem).map(etapa => <TableRow key={etapa.id} className="hover:bg-accent/30 transition-colors">
                          <TableCell>{etapa.nome}</TableCell>
                          <TableCell>
                            <span className="inline-block w-6 h-6 rounded-full border" style={{
                        background: etapa.cor,
                        borderColor: "#E5E7EB"
                      }}></span>
                          </TableCell>
                          <TableCell>{etapa.ordem}</TableCell>
                          <TableCell className="flex gap-2 justify-center">
                            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100 focus:bg-blue-100" onClick={() => handleEditar(etapa)}>
                              <Edit />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 focus:bg-red-100" onClick={() => handleExcluir(etapa.id)}>
                              <Trash2 />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </TableCell>
                        </TableRow>)}
                  </TableBody>
                  {etapas.length > 0 && <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-normal text-right text-muted-foreground text-xs">
                          Total de etapas: <span className="font-semibold text-foreground">{etapas.length}</span>
                        </TableCell>
                      </TableRow>
                    </TableFooter>}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal para adicionar/editar etapas */}
      <FunilFormModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onConfirm={handleSalvarEtapa} 
        etapa={editEtapa ? {
          nome: editEtapa.nome,
          cor: editEtapa.cor,
          ordem: editEtapa.ordem
        } : undefined} 
      />
      
      {/* Sheet para adicionar/editar funil */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{novoFunil ? 'Criar Novo Funil' : 'Editar Funil'}</SheetTitle>
            <SheetDescription>
              {novoFunil 
                ? 'Preencha os campos abaixo para criar um novo funil de vendas.' 
                : 'Altere as informações do funil conforme necessário.'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome do Funil *
              </label>
              <Input
                id="nome"
                value={nomeFunil}
                onChange={(e) => setNomeFunil(e.target.value)}
                placeholder="Ex: Funil de Vendas B2B"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="descricao" className="text-sm font-medium">
                Descrição
              </label>
              <Input
                id="descricao"
                value={descricaoFunil}
                onChange={(e) => setDescricaoFunil(e.target.value)}
                placeholder="Ex: Funil para clientes corporativos"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativo"
                checked={ativoFunil}
                onChange={(e) => setAtivoFunil(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="ativo" className="text-sm font-medium">
                Funil ativo
              </label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Cancelar
              </Button>
              <Button variant="blue" onClick={salvarFunil}>
                {novoFunil ? 'Criar Funil' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
