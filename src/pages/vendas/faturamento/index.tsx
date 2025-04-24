import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "@/hooks/use-toast";
import { Orcamento, Favorecido } from "@/types";

// Opções de tipo
const tipos = ["Todos", "Orçamento", "Venda"];

function formatDateBR(date: Date | string | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString();
  return `${day}/${month}/${year}`;
}

export default function FaturamentoPage() {
  const { currentCompany } = useCompany();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [dataInicial, setDataInicial] = useState<Date>();
  const [dataFinal, setDataFinal] = useState<Date>();
  const [faturamentos, setFaturamentos] = useState<Orcamento[]>([]);
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);

  const navigate = useNavigate();

  // Novo estado para controlar o diálogo de confirmação
  const [excluirId, setExcluirId] = useState<string | null>(null);

  // Buscar orçamentos e vendas
  useEffect(() => {
    if (currentCompany?.id) {
      carregarFaturamentos();
      carregarFavorecidos();
    }
  }, [currentCompany?.id]);

  async function carregarFaturamentos() {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          favorecido:favorecidos(nome),
          itens:orcamentos_itens(valor)
        `)
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo');

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

  // Função para abrir diálogo de confirmação
  function handleConfirmarExclusao(id: string) {
    setExcluirId(id);
  }

  // Função para cancelar exclusão
  function handleCancelarExclusao() {
    setExcluirId(null);
  }

  // Função para confirmar e excluir
  async function handleConfirmarEExcluir() {
    if (!excluirId) return;

    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'inativo' })
        .eq('id', excluirId);

      if (error) throw error;

      toast({ title: "Registro excluído com sucesso!" });
      carregarFaturamentos(); // Recarrega a lista
      setExcluirId(null); // Fecha o diálogo
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir registro",
        variant: "destructive",
      });
    }
  }

  // Filtros aplicados
  const itemsFiltrados = faturamentos.filter(item => {
    const buscaMatch = busca
      ? (
          item.codigo.toLowerCase().includes(busca.toLowerCase()) ||
          item.favorecido?.nome.toLowerCase().includes(busca.toLowerCase()) ||
          item.codigo_projeto?.toLowerCase()?.includes(busca.toLowerCase())
        )
      : true;
    
    const tipoMatch = tipo && tipo !== "Todos" ? item.tipo === tipo.toLowerCase() : true;
    const favMatch = favorecido ? item.favorecido_id === favorecido : true;
    const dataI_Match = dataInicial ? new Date(item.data) >= dataInicial : true;
    const dataF_Match = dataFinal ? new Date(item.data) <= dataFinal : true;

    return buscaMatch && tipoMatch && favMatch && dataI_Match && dataF_Match;
  });

  // Função Visualizar: abre orçamento em modo visualização
  function handleVisualizar(item: typeof faturamentos[0]) {
    navigate(`/vendas/orcamento?codigo=${item.codigo}&visualizar=1`);
  }

  // Função Editar: abre orçamento para edição
  function handleEditar(item: typeof faturamentos[0]) {
    navigate(`/vendas/orcamento?codigo=${item.codigo}`);
  }

  // Função Excluir: marca orçamento como inativo
  async function handleExcluir(item: typeof faturamentos[0]) {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'inativo' })
        .eq('id', item.id);

      if (error) throw error;

      toast({ title: "Registro excluído com sucesso!" });
      carregarFaturamentos(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir registro",
        variant: "destructive",
      });
    }
  }

  // Calcular total de valor dos itens filtrados
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center bg-white border p-4 rounded-md mb-1">
        {/* Campo de busca com ícone ao lado */}
        <div className="relative flex items-center max-w-xs">
          <Search className="absolute left-2 text-gray-400 h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Buscar por código, favorecido ou projeto"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Select de Tipo */}
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-[140px]">
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

        {/* Select de Favorecido */}
        <Select value={favorecido} onValueChange={setFavorecido}>
          <SelectTrigger className="w-[170px]">
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

        {/* Data Inicial */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[135px] justify-start bg-white"
            >
              {dataInicial ? (
                formatDateBR(dataInicial)
              ) : (
                <span>Data inicial</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto bg-white z-50" align="start">
            <Calendar
              mode="single"
              selected={dataInicial}
              onSelect={setDataInicial}
              className="p-3 pointer-events-auto"
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Data Final */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[135px] justify-start bg-white"
            >
              {dataFinal ? (
                formatDateBR(dataFinal)
              ) : (
                <span>Data final</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto bg-white z-50" align="start">
            <Calendar
              mode="single"
              selected={dataFinal}
              onSelect={setDataFinal}
              className="p-3 pointer-events-auto"
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" className="ml-2" title="Filtrar">
          <Filter className="w-4 h-4" />
        </Button>
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
              <TableHead className="w-20 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum faturamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              itemsFiltrados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.tipo === "orcamento" ? "Orçamento" : "Venda"}
                  </TableCell>
                  <TableCell>{item.codigo}</TableCell>
                  <TableCell>{formatDateBR(item.data)}</TableCell>
                  <TableCell>{item.favorecido?.nome}</TableCell>
                  <TableCell>{item.codigo_projeto}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.valor).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
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
                        <DropdownMenuItem
                          onClick={() => handleConfirmarExclusao(item.id)}
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
              <TableCell />
            </TableRow>
          </tfoot>
        </Table>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={!!excluirId} onOpenChange={() => setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelarExclusao}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarEExcluir}
              className="flex-1 sm:flex-none"
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
