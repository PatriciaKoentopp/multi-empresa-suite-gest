
import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDate } from "@/lib/utils";
import { AntecipacaoTable, Antecipacao } from "@/components/antecipacoes/antecipacao-table";
import { AntecipacaoModal } from "@/components/antecipacoes/antecipacao-modal";

export default function AntecipacoesPage() {
  const { currentCompany } = useCompany();
  const [antecipacoes, setAntecipacoes] = useState<Antecipacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "ativa" | "utilizada" | "cancelada">("ativa");
  const [tipoFilter, setTipoFilter] = useState<"todas" | "receber" | "pagar">("todas");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [isFiltroAvancadoOpen, setIsFiltroAvancadoOpen] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Estado para controlar o dialog de confirmação
  const [antecipacaoParaExcluir, setAntecipacaoParaExcluir] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarAntecipacoes();
    }
  }, [currentCompany]);

  // Função para criar uma data a partir de uma string YYYY-MM-DD sem conversão de timezone
  function criarDataSemTimezone(dataStr?: string): Date | undefined {
    if (!dataStr) return undefined;
    
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  async function carregarAntecipacoes() {
    try {
      setIsLoading(true);
      
      if (!currentCompany?.id) {
        console.log("Empresa não selecionada");
        return;
      }

      console.log("Carregando antecipações para empresa:", currentCompany.id);

      const { data, error } = await supabase
        .from("antecipacoes")
        .select(`
          *,
          favorecido:favorecidos(nome),
          tipo_titulo:tipos_titulos(nome)
        `)
        .eq("empresa_id", currentCompany.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar antecipações:", error);
        throw error;
      }

      console.log("Dados carregados:", data);

      // Transformar dados para o formato esperado pela tabela
      const antecipacoesMapeadas: Antecipacao[] = (data || []).map(item => ({
        id: item.id,
        favorecido: item.favorecido?.nome || "N/A",
        tipoOperacao: item.tipo_operacao as "receber" | "pagar",
        dataAntecipacao: new Date(item.data_lancamento + 'T12:00:00'),
        valorTotal: Number(item.valor_total),
        valorUtilizado: Number(item.valor_utilizado),
        valorDisponivel: Number(item.valor_total) - Number(item.valor_utilizado),
        descricao: item.descricao || "",
        status: item.status as "ativa" | "utilizada" | "cancelada"
      }));

      setAntecipacoes(antecipacoesMapeadas);
    } catch (error) {
      console.error('Erro ao carregar antecipações:', error);
      toast.error('Erro ao carregar as antecipações');
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (antecipacao: Antecipacao) => {
    // TODO: Implementar edição
    toast.info("Funcionalidade de edição será implementada");
  };

  const handleDelete = (id: string) => {
    setAntecipacaoParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!antecipacaoParaExcluir) return;

    try {
      const { error } = await supabase
        .from("antecipacoes")
        .delete()
        .eq("id", antecipacaoParaExcluir);

      if (error) {
        console.error("Erro ao excluir antecipação:", error);
        throw error;
      }

      setAntecipacoes(prev => prev.filter(a => a.id !== antecipacaoParaExcluir));
      toast.success("Antecipação excluída com sucesso");
      setAntecipacaoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir antecipação:', error);
      toast.error("Erro ao excluir antecipação");
      setAntecipacaoParaExcluir(null);
    }
  };

  const handleVisualizar = (antecipacao: Antecipacao) => {
    // TODO: Implementar visualização
    toast.info("Funcionalidade de visualização será implementada");
  };

  const handleCancelar = (antecipacao: Antecipacao) => {
    // TODO: Implementar cancelamento
    toast.info("Funcionalidade de cancelamento será implementada");
  };

  const handleNovaAntecipacao = () => {
    setIsModalOpen(true);
  };

  const handleSalvarAntecipacao = () => {
    // Recarregar dados após salvar
    carregarAntecipacoes();
  };

  const limparFiltros = () => {
    setSearchTerm("");
    setStatusFilter("ativa");
    setTipoFilter("todas");
    setDataInicio("");
    setDataFim("");
    setIsFiltroAvancadoOpen(false);
  };

  const filteredAntecipacoes = useMemo(() => {
    return antecipacoes.filter((antecipacao) => {
      const textoBusca = (antecipacao.favorecido + (antecipacao.descricao || ''))
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || antecipacao.status === statusFilter;
      const tipoOk = tipoFilter === "todas" || antecipacao.tipoOperacao === tipoFilter;
      
      // Aplicar filtros de data
      let dataDentroRange = true;
      if (dataInicio) {
        const dataInicioDate = criarDataSemTimezone(dataInicio)!;
        dataDentroRange = dataDentroRange && antecipacao.dataAntecipacao >= dataInicioDate;
      }
      
      if (dataFim) {
        const dataFimDate = criarDataSemTimezone(dataFim)!;
        dataDentroRange = dataDentroRange && antecipacao.dataAntecipacao <= dataFimDate;
      }

      return textoBusca && statusOk && tipoOk && dataDentroRange;
    });
  }, [antecipacoes, searchTerm, statusFilter, tipoFilter, dataInicio, dataFim]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando antecipações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertDialog open={!!antecipacaoParaExcluir} onOpenChange={() => setAntecipacaoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta antecipação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAntecipacaoParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Antecipações</h1>
        <Button
          variant="blue"
          onClick={handleNovaAntecipacao}
        >
          Nova Antecipação
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative col-span-1 min-w-[240px]">
                <button
                  type="button"
                  className="absolute left-3 top-3 z-10 p-0 m-0 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-blue-500"
                  style={{ lineHeight: 0 }}
                  onClick={handleLupaClick}
                  tabIndex={-1}
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </button>
                <Input
                  ref={inputBuscaRef}
                  placeholder="Buscar favorecido ou descrição"
                  className="pl-10 bg-white border-gray-300 shadow-sm focus:bg-white min-w-[180px] w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      inputBuscaRef.current?.blur();
                    }
                  }}
                  autoComplete="off"
                />
              </div>
              
              <div className="min-w-[160px]">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="todas">Todos Status</SelectItem>
                    <SelectItem value="ativa" className="text-blue-600">Ativa</SelectItem>
                    <SelectItem value="utilizada" className="text-green-600">Utilizada</SelectItem>
                    <SelectItem value="cancelada" className="text-red-600">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[160px]">
                <Select
                  value={tipoFilter}
                  onValueChange={(v) => setTipoFilter(v as any)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="todas">Todos Tipos</SelectItem>
                    <SelectItem value="receber">Recebimento</SelectItem>
                    <SelectItem value="pagar">Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-10"
                  onClick={() => setIsFiltroAvancadoOpen(!isFiltroAvancadoOpen)}
                >
                  {isFiltroAvancadoOpen ? (
                    <>Ocultar filtros <ChevronUp className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Busca avançada <ChevronDown className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={limparFiltros}
                  className="text-gray-500 hover:text-gray-700 h-10 w-10"
                  title="Limpar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isFiltroAvancadoOpen && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-2">
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="text-sm font-medium mb-2 text-gray-700">Data da Antecipação</div>
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">De</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataInicio}
                        max={dataFim || undefined}
                        onChange={e => setDataInicio(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">Até</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataFim}
                        min={dataInicio || undefined}
                        onChange={e => setDataFim(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          
            <div className="mt-6">
              <AntecipacaoTable
                antecipacoes={filteredAntecipacoes}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVisualizar={handleVisualizar}
                onCancelar={handleCancelar}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AntecipacaoModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSalvarAntecipacao}
      />
    </div>
  );
}
