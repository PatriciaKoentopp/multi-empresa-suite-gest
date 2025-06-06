import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { TabelaPreco, Servico, TabelaPrecoItem, Produto } from "@/types";
import { useCompany } from "@/contexts/company-context";
import { DateInput } from "@/components/movimentacao/DateInput";
import { formatDate, parseDateString } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabelaPrecoModalProps {
  open: boolean;
  onClose: () => void;
  tabela?: TabelaPreco | null;
  servicosACadastrar: Servico[];
  produtosACadastrar: Produto[];
  modo: "visualizar" | "editar" | "novo";
  onSalvar: (tabela: TabelaPreco) => void;
}

interface TabelaPrecoItemComNome extends TabelaPrecoItem {
  nome?: string;
}

export const TabelaPrecoModal: React.FC<TabelaPrecoModalProps> = ({
  open,
  onClose,
  tabela,
  servicosACadastrar,
  produtosACadastrar,
  modo,
  onSalvar,
}) => {
  const { currentCompany } = useCompany();
  const somenteLeitura = modo === "visualizar";

  const [nome, setNome] = useState("");
  const [vigenciaInicial, setVigenciaInicial] = useState<Date | null>(null);
  const [vigenciaFinal, setVigenciaFinal] = useState<Date | null>(null);
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [servicosTabela, setServicosTabela] = useState<TabelaPrecoItemComNome[]>([]);
  const [produtosTabela, setProdutosTabela] = useState<TabelaPrecoItemComNome[]>([]);
  const [tipoItem, setTipoItem] = useState<"servicos" | "produtos">("servicos");

  const [novoServicoId, setNovoServicoId] = useState<string>("");
  const [novoProdutoId, setNovoProdutoId] = useState<string>("");
  const [novoPreco, setNovoPreco] = useState<string>("");
  const [tabelaId, setTabelaId] = useState<string>("");
  
  useEffect(() => {
    if (open && tabela) {
      setNome(tabela.nome);
      setVigenciaInicial(tabela.vigencia_inicial);
      setVigenciaFinal(tabela.vigencia_final);
      setStatus(tabela.status as "ativo" | "inativo");
      setTabelaId(tabela.id);
      carregarItensDaTabela(tabela.id);
    } else {
      resetForm();
    }
  }, [open, tabela]);

  async function carregarItensDaTabela(tabelaId: string) {
    try {
      // Carregar serviços
      const { data: dataServicos, error: errorServicos } = await supabase
        .from('tabelas_precos_itens')
        .select(`
          *,
          servicos (
            nome
          )
        `)
        .eq('tabela_id', tabelaId)
        .not('servico_id', 'is', null);

      if (errorServicos) throw errorServicos;

      // Transformar os dados para o formato esperado
      const servicosConvertidos: TabelaPrecoItemComNome[] = dataServicos?.map(item => ({
        id: item.id,
        tabela_id: item.tabela_id,
        servico_id: item.servico_id,
        produto_id: null,
        preco: item.preco,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        nome: item.servicos?.nome // Campo adicional não persistido
      })) || [];

      setServicosTabela(servicosConvertidos);

      // Carregar produtos
      const { data: dataProdutos, error: errorProdutos } = await supabase
        .from('tabelas_precos_itens')
        .select(`
          *,
          produtos (
            nome
          )
        `)
        .eq('tabela_id', tabelaId)
        .not('produto_id', 'is', null);

      if (errorProdutos) throw errorProdutos;

      // Transformar os dados para o formato esperado
      const produtosConvertidos: TabelaPrecoItemComNome[] = dataProdutos?.map(item => ({
        id: item.id,
        tabela_id: item.tabela_id,
        servico_id: null,
        produto_id: item.produto_id,
        preco: item.preco,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        nome: item.produtos?.nome // Campo adicional não persistido
      })) || [];

      setProdutosTabela(produtosConvertidos);
    } catch (error) {
      console.error('Erro ao carregar itens da tabela:', error);
      toast({
        title: "Erro ao carregar itens",
        description: "Ocorreu um erro ao carregar os itens da tabela de preços.",
        variant: "destructive",
      });
    }
  }

  function resetForm() {
    setNome("");
    setVigenciaInicial(null);
    setVigenciaFinal(null);
    setStatus("ativo");
    setServicosTabela([]);
    setProdutosTabela([]);
    setNovoServicoId("");
    setNovoProdutoId("");
    setNovoPreco("");
    setTabelaId("");
    setTipoItem("servicos");
  }

  async function adicionarServico() {
    if (!novoServicoId || novoPreco === "") return;
    
    const servicoExistente = servicosTabela.find(s => s.servico_id === novoServicoId);
    if (servicoExistente) {
      toast({
        title: "Serviço já adicionado",
        description: "Este serviço já está na tabela de preços.",
        variant: "destructive",
      });
      return;
    }

    const servicoSelecionado = servicosACadastrar.find(s => s.id === novoServicoId);
    
    try {
      // Se estiver editando uma tabela existente
      if (tabela && tabela.id) {
        const { data, error } = await supabase
          .from('tabelas_precos_itens')
          .insert({
            tabela_id: tabela.id,
            servico_id: novoServicoId,
            produto_id: null,
            preco: parseFloat(novoPreco.replace(',', '.'))
          })
          .select();

        if (error) throw error;

        // Se inseriu com sucesso, adiciona ao estado local
        if (data && data.length > 0) {
          setServicosTabela(prev => [
            ...prev,
            {
              id: data[0].id,
              tabela_id: data[0].tabela_id,
              servico_id: data[0].servico_id,
              produto_id: null,
              preco: data[0].preco,
              created_at: new Date(data[0].created_at),
              updated_at: new Date(data[0].updated_at),
              nome: servicoSelecionado?.nome
            }
          ]);
        }
      } else {
        // Está criando uma nova tabela, então só adiciona ao estado local
        // Os itens só serão salvos depois que a tabela for criada
        setServicosTabela(prev => [
          ...prev,
          {
            id: `temp-${Date.now()}`, // ID temporário
            tabela_id: 'temp', // Será substituído pelo ID real da tabela
            servico_id: novoServicoId,
            produto_id: null,
            preco: parseFloat(novoPreco.replace(',', '.')),
            created_at: new Date(),
            updated_at: new Date(),
            nome: servicoSelecionado?.nome
          }
        ]);
      }

      // Limpar campos
      setNovoServicoId("");
      setNovoPreco("");

      toast({ title: "Serviço adicionado com sucesso!" });
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      toast({
        title: "Erro ao adicionar serviço",
        description: "Ocorreu um erro ao adicionar o serviço.",
        variant: "destructive",
      });
    }
  }

  async function adicionarProduto() {
    if (!novoProdutoId || novoPreco === "") return;
    
    const produtoExistente = produtosTabela.find(p => p.produto_id === novoProdutoId);
    if (produtoExistente) {
      toast({
        title: "Produto já adicionado",
        description: "Este produto já está na tabela de preços.",
        variant: "destructive",
      });
      return;
    }

    const produtoSelecionado = produtosACadastrar.find(p => p.id === novoProdutoId);
    
    try {
      // Se estiver editando uma tabela existente
      if (tabela && tabela.id) {
        const { data, error } = await supabase
          .from('tabelas_precos_itens')
          .insert({
            tabela_id: tabela.id,
            servico_id: null,
            produto_id: novoProdutoId,
            preco: parseFloat(novoPreco.replace(',', '.'))
          })
          .select();

        if (error) throw error;

        // Se inseriu com sucesso, adiciona ao estado local
        if (data && data.length > 0) {
          setProdutosTabela(prev => [
            ...prev,
            {
              id: data[0].id,
              tabela_id: data[0].tabela_id,
              servico_id: null,
              produto_id: data[0].produto_id,
              preco: data[0].preco,
              created_at: new Date(data[0].created_at),
              updated_at: new Date(data[0].updated_at),
              nome: produtoSelecionado?.nome
            }
          ]);
        }
      } else {
        // Está criando uma nova tabela, então só adiciona ao estado local
        // Os itens só serão salvos depois que a tabela for criada
        setProdutosTabela(prev => [
          ...prev,
          {
            id: `temp-${Date.now()}`, // ID temporário
            tabela_id: 'temp', // Será substituído pelo ID real da tabela
            servico_id: null,
            produto_id: novoProdutoId,
            preco: parseFloat(novoPreco.replace(',', '.')),
            created_at: new Date(),
            updated_at: new Date(),
            nome: produtoSelecionado?.nome
          }
        ]);
      }

      // Limpar campos
      setNovoProdutoId("");
      setNovoPreco("");

      toast({ title: "Produto adicionado com sucesso!" });
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: "Erro ao adicionar produto",
        description: "Ocorreu um erro ao adicionar o produto.",
        variant: "destructive",
      });
    }
  }

  async function removerServico(servicoId: string) {
    try {
      // Se estiver editando uma tabela existente, remover do banco
      if (tabela && tabela.id) {
        const { error } = await supabase
          .from('tabelas_precos_itens')
          .delete()
          .eq('tabela_id', tabela.id)
          .eq('servico_id', servicoId);

        if (error) throw error;
      }

      // Atualizar estado local
      setServicosTabela(prev => prev.filter(s => s.servico_id !== servicoId));
      
      toast({ title: "Serviço removido com sucesso!" });
    } catch (error) {
      console.error('Erro ao remover serviço:', error);
      toast({
        title: "Erro ao remover serviço",
        description: "Ocorreu um erro ao remover o serviço.",
        variant: "destructive",
      });
    }
  }

  async function removerProduto(produtoId: string) {
    try {
      // Se estiver editando uma tabela existente, remover do banco
      if (tabela && tabela.id) {
        const { error } = await supabase
          .from('tabelas_precos_itens')
          .delete()
          .eq('tabela_id', tabela.id)
          .eq('produto_id', produtoId);

        if (error) throw error;
      }

      // Atualizar estado local
      setProdutosTabela(prev => prev.filter(p => p.produto_id !== produtoId));
      
      toast({ title: "Produto removido com sucesso!" });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      toast({
        title: "Erro ao remover produto",
        description: "Ocorreu um erro ao remover o produto.",
        variant: "destructive",
      });
    }
  }

  async function handleSalvar() {
    // Validações básicas
    if (!nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a tabela de preços.",
        variant: "destructive",
      });
      return;
    }

    if (!vigenciaInicial || !vigenciaFinal) {
      toast({
        title: "Vigência obrigatória",
        description: "Por favor, selecione as datas de vigência.",
        variant: "destructive",
      });
      return;
    }

    if (servicosTabela.length === 0 && produtosTabela.length === 0) {
      toast({
        title: "Adicione pelo menos um item",
        description: "Por favor, adicione pelo menos um serviço ou produto à tabela de preços.",
        variant: "destructive",
      });
      return;
    }

    const tabelaParaSalvar: TabelaPreco = {
      id: tabela?.id || '',
      empresa_id: currentCompany?.id || '',
      nome,
      vigencia_inicial: vigenciaInicial,
      vigencia_final: vigenciaFinal,
      status,
      created_at: tabela?.created_at || new Date(),
      updated_at: new Date()
    };

    onSalvar(tabelaParaSalvar);

    // Se for um novo registro, precisamos salvar os itens depois que a tabela for criada
    if (!tabela) {
      // Buscamos a tabela recém-criada para obter seu ID
      setTimeout(async () => {
        try {
          const { data: tabelasRecentes, error: errorBusca } = await supabase
            .from('tabelas_precos')
            .select('*')
            .eq('empresa_id', currentCompany?.id)
            .eq('nome', nome)
            .order('created_at', { ascending: false })
            .limit(1);

          if (errorBusca) throw errorBusca;

          if (tabelasRecentes && tabelasRecentes.length > 0) {
            const novaTabelaId = tabelasRecentes[0].id;

            // Inserir serviços da tabela
            for (const item of servicosTabela) {
              const { error: errorItem } = await supabase
                .from('tabelas_precos_itens')
                .insert({
                  tabela_id: novaTabelaId,
                  servico_id: item.servico_id,
                  produto_id: null,
                  preco: item.preco
                });

              if (errorItem) throw errorItem;
            }

            // Inserir produtos da tabela
            for (const item of produtosTabela) {
              const { error: errorItem } = await supabase
                .from('tabelas_precos_itens')
                .insert({
                  tabela_id: novaTabelaId,
                  servico_id: null,
                  produto_id: item.produto_id,
                  preco: item.preco
                });

              if (errorItem) throw errorItem;
            }

            toast({ title: "Itens adicionados com sucesso à tabela!" });
          }
        } catch (error) {
          console.error('Erro ao salvar itens da tabela:', error);
          toast({
            title: "Erro ao salvar itens",
            description: "Ocorreu um erro ao salvar os itens da tabela.",
            variant: "destructive",
          });
        }
      }, 1000); // Espera 1 segundo para garantir que a tabela foi criada
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {modo === "visualizar" && "Detalhes da Tabela"}
            {modo === "editar" && "Editar Tabela"}
            {modo === "novo" && "Nova Tabela de Preços"}
          </DialogTitle>
        </DialogHeader>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (!somenteLeitura) handleSalvar();
          }}
          className="px-6 pt-5 pb-4 grid gap-4"
        >
          <div>
            <label className="block font-medium mb-1">Nome</label>
            <Input 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              disabled={somenteLeitura} 
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Vigência (início)</label>
              <DateInput 
                value={vigenciaInicial}
                onChange={setVigenciaInicial}
                disabled={somenteLeitura}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Vigência (final)</label>
              <DateInput 
                value={vigenciaFinal}
                onChange={setVigenciaFinal}
                disabled={somenteLeitura}
              />
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Itens e Preços
            </h2>

            <Tabs value={tipoItem} onValueChange={(value) => setTipoItem(value as "servicos" | "produtos")}>
              <TabsList className="grid grid-cols-2 mb-4 w-full md:w-auto">
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="servicos">
                {!somenteLeitura && (
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                    <select
                      className="border rounded px-2 py-1 md:col-span-4 bg-white"
                      value={novoServicoId}
                      onChange={(e) => setNovoServicoId(e.target.value)}
                    >
                      <option value="">Selecione um serviço...</option>
                      {servicosACadastrar
                        .filter(s => !servicosTabela.some(st => st.servico_id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                    </select>
                    <Input
                      placeholder="Preço (R$)"
                      type="text"
                      className="md:col-span-3"
                      value={novoPreco}
                      onChange={(e) => {
                        const valorSemFormatacao = e.target.value.replace(/[^\d,]/g, '');
                        setNovoPreco(valorSemFormatacao);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="md:col-span-1"
                      onClick={adicionarServico}
                      variant="secondary"
                      disabled={!novoServicoId || !novoPreco}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                )}

                {/* Listagem dos serviços adicionados */}
                <div className="mt-3">
                  {servicosTabela.length === 0 && (
                    <div className="text-muted-foreground text-sm">Nenhum serviço adicionado ainda.</div>
                  )}
                  {servicosTabela.length > 0 && (
                    <table className="w-full border mt-2 rounded text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="py-1 px-2 font-bold text-left">Serviço</th>
                          <th className="py-1 px-2 font-bold text-left">Preço (R$)</th>
                          {!somenteLeitura && <th />}
                        </tr>
                      </thead>
                      <tbody>
                        {servicosTabela.map(srv => (
                          <tr key={srv.servico_id} className="border-t">
                            <td className="py-1 px-2">{srv.nome}</td>
                            <td className="py-1 px-2">
                              {srv.preco.toLocaleString("pt-BR", { 
                                style: "currency", 
                                currency: "BRL", 
                                minimumFractionDigits: 2 
                              })}
                            </td>
                            {!somenteLeitura && (
                              <td className="py-1 px-2 text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => srv.servico_id && removerServico(srv.servico_id)}
                                >
                                  Remover
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="produtos">
                {!somenteLeitura && (
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                    <select
                      className="border rounded px-2 py-1 md:col-span-4 bg-white"
                      value={novoProdutoId}
                      onChange={(e) => setNovoProdutoId(e.target.value)}
                    >
                      <option value="">Selecione um produto...</option>
                      {produtosACadastrar
                        .filter(p => !produtosTabela.some(pt => pt.produto_id === p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                    <Input
                      placeholder="Preço (R$)"
                      type="text"
                      className="md:col-span-3"
                      value={novoPreco}
                      onChange={(e) => {
                        const valorSemFormatacao = e.target.value.replace(/[^\d,]/g, '');
                        setNovoPreco(valorSemFormatacao);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="md:col-span-1"
                      onClick={adicionarProduto}
                      variant="secondary"
                      disabled={!novoProdutoId || !novoPreco}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                )}

                {/* Listagem dos produtos adicionados */}
                <div className="mt-3">
                  {produtosTabela.length === 0 && (
                    <div className="text-muted-foreground text-sm">Nenhum produto adicionado ainda.</div>
                  )}
                  {produtosTabela.length > 0 && (
                    <table className="w-full border mt-2 rounded text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="py-1 px-2 font-bold text-left">Produto</th>
                          <th className="py-1 px-2 font-bold text-left">Preço (R$)</th>
                          {!somenteLeitura && <th />}
                        </tr>
                      </thead>
                      <tbody>
                        {produtosTabela.map(prod => (
                          <tr key={prod.produto_id} className="border-t">
                            <td className="py-1 px-2">{prod.nome}</td>
                            <td className="py-1 px-2">
                              {prod.preco.toLocaleString("pt-BR", { 
                                style: "currency", 
                                currency: "BRL", 
                                minimumFractionDigits: 2 
                              })}
                            </td>
                            {!somenteLeitura && (
                              <td className="py-1 px-2 text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => prod.produto_id && removerProduto(prod.produto_id)}
                                >
                                  Remover
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex-row gap-2">
            {!somenteLeitura && (
              <>
                <Button 
                  type="submit" 
                  variant="blue"
                  disabled={
                    !nome || 
                    !vigenciaInicial || 
                    !vigenciaFinal || 
                    (servicosTabela.length === 0 && produtosTabela.length === 0)
                  }
                >
                  {modo === "editar" ? "Salvar Alterações" : "Salvar Tabela"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </>
            )}
            {somenteLeitura && (
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
