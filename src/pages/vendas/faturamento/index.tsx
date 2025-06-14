import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "@/hooks/use-toast";
import { Orcamento, Favorecido } from "@/types";
import { EfetivarVendaModal } from "@/components/vendas/EfetivarVendaModal";
import { formatDate } from "@/lib/utils";
import { SalesCard } from "@/components/vendas/SalesCard";
import { DateInput } from "@/components/movimentacao/DateInput";

// Opções de tipo
const tipos = ["Todos", "Orçamento", "Venda"];
const statusOptions = ["ativo", "inativo", "todos"];

function formatDateBR(date: Date | string | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString();
  return `${day}/${month}/${year}`;
}

// Função para obter o primeiro dia do mês atual
function getPrimeiroDiaMes(): Date {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

// Função para converter uma data para o formato YYYY-MM-DD (formato do banco)
function dateToDBFormat(date: Date | undefined): string | null {
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export default function FaturamentoPage() {
  const { currentCompany } = useCompany();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [favorecido, setFavorecido] = useState("");
  // Inicializa com o primeiro dia do mês atual
  const [dataInicial, setDataInicial] = useState<Date | undefined>(getPrimeiroDiaMes());
  const [dataFinal, setDataFinal] = useState<Date | undefined>();
  const [faturamentos, setFaturamentos] = useState<Orcamento[]>([]);
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [showToastConfirm, setShowToastConfirm] = useState(false);
  const [excluirItem, setExcluirItem] = useState<Orcamento | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ativo" | "inativo" | "todos">("ativo");
  const [efetivarVendaItem, setEfetivarVendaItem] = useState<Orcamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (currentCompany?.id) {
      carregarFaturamentos();
      carregarFavorecidos();
    }
  }, [currentCompany?.id, statusFilter]);

  async function carregarFaturamentos() {
    try {
      let query = supabase
        .from('orcamentos')
        .select(`
          *,
          favorecido:favorecidos(nome),
          itens:orcamentos_itens(valor)
        `)
        .eq('empresa_id', currentCompany?.id);

      // Aplica filtro de status se não for "todos"
      if (statusFilter !== "todos") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular valor total somando os itens
      const faturamentosComValor = data?.map(fat => ({
        ...fat,
        valor: fat.itens?.reduce((sum, item) => sum + Number(item.valor), 0) || 0
      })) || [];

      setFaturamentos(faturamentosComValor);
    } catch (error) {
      console.error('Erro ao carregar faturamentos:', error);
      toast({
        title: "Erro ao carregar faturamentos",
        variant: "destructive",
      });
    }
  }

  async function carregarFavorecidos() {
    try {
      const { data, error } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setFavorecidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar favorecidos:', error);
      toast({
        title: "Erro ao carregar favorecidos",
        variant: "destructive",
      });
    }
  }

  const prepararExclusao = (item: Orcamento) => {
    setExcluirItem(item);
    setShowToastConfirm(true);
  };

  const confirmarExclusao = async () => {
    if (!excluirItem) return;
    
    try {
      setIsLoading(true);

      // Se for uma venda, precisamos verificar se há parcelas recebidas e excluir as movimentações
      if (excluirItem.tipo === 'venda') {
        // 1. Buscar a movimentação relacionada à venda
        const { data: movimentacao, error: movError } = await supabase
          .from('movimentacoes')
          .select('id')
          .eq('numero_documento', excluirItem.codigo)
          .single();

        if (movError && movError.code !== 'PGRST116') throw movError;

        if (movimentacao) {
          // 2. Verificar se alguma parcela foi recebida
          const { data: parcelas, error: parcelasError } = await supabase
            .from('movimentacoes_parcelas')
            .select('data_pagamento')
            .eq('movimentacao_id', movimentacao.id);

          if (parcelasError) throw parcelasError;

          const temParcelasRecebidas = parcelas.some(parcela => parcela.data_pagamento !== null);
          
          if (temParcelasRecebidas) {
            toast({
              title: "Não é possível excluir",
              description: "Esta venda já possui parcelas recebidas.",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }

          // 3. Excluir parcelas da movimentação
          const { error: deleteParcelasError } = await supabase
            .from('movimentacoes_parcelas')
            .delete()
            .eq('movimentacao_id', movimentacao.id);

          if (deleteParcelasError) throw deleteParcelasError;

          // 4. Excluir movimentação
          const { error: deleteMovError } = await supabase
            .from('movimentacoes')
            .delete()
            .eq('id', movimentacao.id);

          if (deleteMovError) throw deleteMovError;
        }
      }

      // 5. Atualizar status do orçamento/venda para inativo
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'inativo' })
        .eq('id', excluirItem.id);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: `${excluirItem.tipo === 'venda' ? 'Venda' : 'Orçamento'} excluído com sucesso!` 
      });
      
      carregarFaturamentos(); // Recarrega a lista
      setExcluirItem(null);
      setShowToastConfirm(false);

    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir registro",
        description: "Ocorreu um erro ao tentar excluir o registro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  function handleCancelarExclusao() {
    setExcluirItem(null);
    setShowToastConfirm(false);
  }

  // Função para limpar todos os filtros
  function limparFiltros() {
    setBusca("");
    setTipo("");
    setFavorecido("");
    setDataInicial(undefined);
    setDataFinal(undefined);
    setStatusFilter("ativo");
  }

  const itemsFiltrados = faturamentos.filter(item => {
    const buscaMatch = busca
      ? (
          item.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
          (item.favorecido?.nome && item.favorecido.nome.toLowerCase().includes(busca.toLowerCase())) ||
          item.codigo_projeto?.toLowerCase()?.includes(busca.toLowerCase())
        )
      : true;
    
    const tipoMatch = tipo && tipo !== "Todos" 
      ? (tipo === "Orçamento" && item.tipo === "orcamento") || (tipo === "Venda" && item.tipo === "venda")
      : true;
    
    const favMatch = favorecido ? item.favorecido_id === favorecido : true;
    
    const itemDataStr = item.tipo === 'venda' ? item.data_venda : item.data;
    const dataInicialStr = dateToDBFormat(dataInicial);
    const dataFinalStr = dateToDBFormat(dataFinal);
    
    const dataI_Match = dataInicialStr ? itemDataStr >= dataInicialStr : true;
    const dataF_Match = dataFinalStr ? itemDataStr <= dataFinalStr : true;

    return buscaMatch && tipoMatch && favMatch && dataI_Match && dataF_Match;
  });

  const itemsOrdenados = [...itemsFiltrados].sort((a, b) => {
    if (a.tipo !== b.tipo) {
      return a.tipo === "orcamento" ? -1 : 1;
    }
    return a.codigo.localeCompare(b.codigo);
  });

  const orcamentos = itemsFiltrados.filter(item => item.tipo === 'orcamento');
  const vendas = itemsFiltrados.filter(item => item.tipo === 'venda');
  
  const totalOrcamentos = orcamentos.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const totalVendas = vendas.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  function handleVisualizar(item: Orcamento) {
    const url = `/vendas/orcamento?id=${item.id}&visualizar=1`;
    console.log("Redirecionando para visualização:", url);
    navigate(url);
  }

  function handleEditar(item: Orcamento) {
    const url = `/vendas/orcamento?id=${item.id}`;
    console.log("Redirecionando para edição:", url);
    navigate(url);
  }

  const totalValor = itemsFiltrados.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  return (
    <div className="space-y-4">
      {/* Título e botão de inclusão */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Faturamento</h1>
        <Button
          variant="blue"
          size="default"
          title="Incluir Orçamento"
          className="flex gap-2 items-center"
          onClick={() => navigate("/vendas/orcamento")}
        >
          <span>Incluir Orçamento</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="lucide lucide-file-plus w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 15v-6M6 12h6m9 6V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z" /><path d="M15 2v4a2 2 0 0 0 2 2h4"/></svg>
        </Button>
      </div>

      {/* Filtros com layout compacto */}
      <div className="bg-white border rounded-md p-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Campo de busca com ícone */}
          <div className="relative w-full sm:w-auto sm:min-w-[240px] flex-grow">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <Input
              placeholder="Buscar por código, favorecido ou projeto"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-8 h-9 bg-white border-gray-300"
            />
          </div>

          {/* Select de Status */}
          <div className="w-full sm:w-auto sm:min-w-[120px]">
            <Select value={statusFilter} onValueChange={(value: "ativo" | "inativo" | "todos") => {
              setStatusFilter(value);
            }}>
              <SelectTrigger className="h-9 bg-white border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select de Tipo */}
          <div className="w-full sm:w-auto sm:min-w-[120px]">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-9 bg-white border-gray-300">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map(opt => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select de Favorecido */}
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <Select value={favorecido} onValueChange={setFavorecido}>
              <SelectTrigger className="h-9 bg-white border-gray-300">
                <SelectValue placeholder="Favorecido" />
              </SelectTrigger>
              <SelectContent>
                {favorecidos.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Inicial */}
          <div className="w-full sm:w-auto sm:min-w-[130px]">
            <DateInput
              value={dataInicial}
              onChange={setDataInicial}
              disabled={false}
              label=""
            />
          </div>
          
          {/* Data Final */}
          <div className="w-full sm:w-auto sm:min-w-[130px]">
            <DateInput
              value={dataFinal}
              onChange={setDataFinal}
              disabled={false}
              label=""
            />
          </div>

          {/* Botão para limpar filtros - apenas com ícone X */}
          <div>
            <Button 
              variant="outline"
              onClick={limparFiltros}
              size="icon"
              title="Limpar filtros"
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Limpar filtros</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SalesCard
          title=""
          value={totalOrcamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          description={`${orcamentos.length} orçamento${orcamentos.length !== 1 ? 's' : ''}`}
          icon="sales"
          className="bg-white"
        />
        <SalesCard
          title=""
          value={totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          description={`${vendas.length} venda${vendas.length !== 1 ? 's' : ''}`}
          icon="money"
          className="bg-white"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Tipo</TableHead>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Favorecido</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead className="text-right">Valor (R$)</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-20 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsOrdenados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhum faturamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              itemsOrdenados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.tipo === "orcamento" ? "Orçamento" : "Venda"}
                  </TableCell>
                  <TableCell>{item.codigo}</TableCell>
                  <TableCell>
                    {item.tipo === "orcamento" 
                      ? formatDate(item.data)
                      : formatDate(item.data_venda)}
                  </TableCell>
                  <TableCell>{item.favorecido?.nome}</TableCell>
                  <TableCell>{item.codigo_projeto}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.valor).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      item.status === 'ativo'
                        ? 'bg-blue-50 text-blue-700 ring-blue-700/10'
                        : 'bg-red-50 text-red-700 ring-red-600/10'
                    }`}>
                      {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-neutral-500 hover:bg-gray-100"
                          title="Ações"
                        >
                          <MoreHorizontal className="w-5 h-5 text-[#333]" />
                          <span className="sr-only">Abrir menu de ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
                        <DropdownMenuItem
                          onClick={() => handleVisualizar(item)}
                          className="flex items-center gap-2 text-primary focus:bg-blue-100 focus:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="lucide lucide-eye w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M2 12C4.667 7.333 12 4 12 4s7.333 3.333 10 8c-2.667 4.667-10 8-10 8s-7.333-3.333-10-8Z"/></svg>
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditar(item)}
                          className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        {item.tipo === "orcamento" && (
                          <DropdownMenuItem
                            onClick={() => setEfetivarVendaItem(item)}
                            className="flex items-center gap-2 text-green-500 focus:bg-green-100 focus:text-green-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Efetivar Venda
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => prepararExclusao(item)}
                          className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <tfoot>
            <TableRow>
              <TableCell colSpan={5} className="font-bold text-right">Total</TableCell>
              <TableCell className="font-bold text-right">
                {totalValor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </tfoot>
        </Table>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={showToastConfirm} onOpenChange={setShowToastConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {excluirItem && (
            <div className="border rounded-md p-3 bg-gray-50 my-4">
              <p className="font-medium">
                {excluirItem.tipo === "orcamento" ? "Orçamento" : "Venda"}: {excluirItem.codigo}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDateBR(excluirItem.data)} - {excluirItem.favorecido?.nome}
              </p>
              <p className="text-sm font-medium mt-1">
                Valor: {Number(excluirItem.valor).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}
              </p>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelarExclusao}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicionar o modal de Efetivar Venda */}
      <EfetivarVendaModal
        open={!!efetivarVendaItem}
        onClose={() => setEfetivarVendaItem(null)}
        orcamento={efetivarVendaItem}
        onSuccess={() => {
          setEfetivarVendaItem(null);
          carregarFaturamentos();
        }}
      />
    </div>
  );
}
