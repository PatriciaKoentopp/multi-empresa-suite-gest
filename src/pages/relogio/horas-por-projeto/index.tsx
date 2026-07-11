import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  Check,
  ChevronsUpDown,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useProjetosRelogio } from "@/hooks/useProjetosRelogio";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { cn } from "@/lib/utils";
import { formatHoursMinutes } from "@/utils/timeUtils";

type StatusFilter = "todos" | "ativo" | "arquivado";

export default function HorasPorProjetoPage() {
  const { projetos, isLoading } = useProjetosRelogio();
  const { currentCompany } = useCompany();

  const { data: favorecidos = [] } = useQuery({
    queryKey: ["favorecidos-lite", currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorecidos")
        .select("id, nome")
        .eq("empresa_id", currentCompany!.id)
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  const { data: tiposProjeto = [] } = useQuery({
    queryKey: ["tipos-projeto-lite", currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relogio_tipos_projeto")
        .select("id, nome")
        .eq("empresa_id", currentCompany!.id)
        .order("nome");
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["relogio-tarefas-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relogio_tarefas")
        .select("id, nome");
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  const { data: horasAgg = { porProjeto: new Map<string, number>(), porTarefa: new Map<string, Map<string, number>>() } } = useQuery({
    queryKey: ["horas-por-projeto-tarefa", currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const porProjeto = new Map<string, number>();
      const porTarefa = new Map<string, Map<string, number>>();
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("relogio_apontamentos")
          .select("projeto_id, tarefa_id, duracao_decimal")
          .eq("empresa_id", currentCompany!.id)
          .eq("status", "concluido")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const rows = (data || []) as { projeto_id: string; tarefa_id: string | null; duracao_decimal: number }[];
        rows.forEach((r) => {
          const d = Number(r.duracao_decimal) || 0;
          porProjeto.set(r.projeto_id, (porProjeto.get(r.projeto_id) || 0) + d);
          let inner = porTarefa.get(r.projeto_id);
          if (!inner) {
            inner = new Map<string, number>();
            porTarefa.set(r.projeto_id, inner);
          }
          const key = r.tarefa_id ?? "sem-tarefa";
          inner.set(key, (inner.get(key) || 0) + d);
        });
        if (rows.length < pageSize) break;
        from += pageSize;
      }
      return { porProjeto, porTarefa };
    },
  });

  const favorecidoNome = useMemo(() => {
    const m = new Map<string, string>();
    favorecidos.forEach((f) => m.set(f.id, f.nome));
    return m;
  }, [favorecidos]);

  const tipoProjetoNome = useMemo(() => {
    const m = new Map<string, string>();
    tiposProjeto.forEach((t) => m.set(t.id, t.nome));
    return m;
  }, [tiposProjeto]);

  const tarefaNome = useMemo(() => {
    const m = new Map<string, string>();
    tarefas.forEach((t) => m.set(t.id, t.nome));
    return m;
  }, [tarefas]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ativo");
  const [clienteFilter, setClienteFilter] = useState<string>("todos");
  const [clienteOpen, setClienteOpen] = useState(false);
  const [tipoProjetoFilter, setTipoProjetoFilter] = useState<string>("todos");
  const [tipoOpen, setTipoOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const result = projetos.filter((p) => {
      const matchSearch =
        !term ||
        p.codigo.toLowerCase().includes(term) ||
        p.nome.toLowerCase().includes(term);
      const matchStatus = statusFilter === "todos" || p.status === statusFilter;
      const matchCliente = clienteFilter === "todos" || p.favorecido_id === clienteFilter;
      const matchTipo = tipoProjetoFilter === "todos" || p.tipo_projeto_id === tipoProjetoFilter;
      return matchSearch && matchStatus && matchCliente && matchTipo;
    });
    result.sort((a, b) => a.codigo.localeCompare(b.codigo));
    return result;
  }, [projetos, debouncedSearch, statusFilter, clienteFilter, tipoProjetoFilter]);

  const clienteSelecionadoNome =
    clienteFilter === "todos" ? "Todos os clientes" : favorecidoNome.get(clienteFilter) ?? "Cliente";

  const tipoProjetoSelecionadoNome =
    tipoProjetoFilter === "todos" ? "Todos os tipos" : tipoProjetoNome.get(tipoProjetoFilter) ?? "Tipo de Projeto";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Horas por Projeto</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-[240px]">
              <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clienteOpen}
                    className="w-full justify-between bg-white dark:bg-gray-900 font-normal"
                  >
                    <span className="truncate">{clienteSelecionadoNome}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 bg-white dark:bg-gray-800" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setClienteFilter("todos");
                            setClienteOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", clienteFilter === "todos" ? "opacity-100" : "opacity-0")} />
                          Todos os clientes
                        </CommandItem>
                        {favorecidos.map((f) => (
                          <CommandItem
                            key={f.id}
                            value={f.nome}
                            onSelect={() => {
                              setClienteFilter(f.id);
                              setClienteOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", clienteFilter === f.id ? "opacity-100" : "opacity-0")} />
                            {f.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex w-full sm:w-[240px]">
              <Popover open={tipoOpen} onOpenChange={setTipoOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tipoOpen}
                    className="w-full justify-between bg-white dark:bg-gray-900 font-normal"
                  >
                    <span className="truncate">{tipoProjetoSelecionadoNome}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 bg-white dark:bg-gray-800" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar tipo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setTipoProjetoFilter("todos");
                            setTipoOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", tipoProjetoFilter === "todos" ? "opacity-100" : "opacity-0")} />
                          Todos os tipos
                        </CommandItem>
                        {tiposProjeto.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.nome}
                            onSelect={() => {
                              setTipoProjetoFilter(t.id);
                              setTipoOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", tipoProjetoFilter === t.id ? "opacity-100" : "opacity-0")} />
                            {t.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex w-full sm:w-[180px]">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome do Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Total de Horas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum projeto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const total = horasAgg.porProjeto.get(p.id) || 0;
                    const isOpen = expanded.has(p.id);
                    const tarefasMap = horasAgg.porTarefa.get(p.id);
                    const tarefasList = tarefasMap
                      ? Array.from(tarefasMap.entries())
                          .map(([tid, horas]) => ({
                            id: tid,
                            nome: tid === "sem-tarefa" ? "Sem tarefa" : tarefaNome.get(tid) ?? "Sem tarefa",
                            horas,
                          }))
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                      : [];
                    return (
                      <Fragment key={p.id}>
                        <TableRow className="hover:bg-muted/40">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-neutral-500 hover:bg-gray-100"
                              onClick={() => toggleExpand(p.id)}
                              aria-label={isOpen ? "Recolher" : "Expandir"}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{p.codigo}</TableCell>
                          <TableCell>{p.nome}</TableCell>
                          <TableCell>
                            {p.favorecido_id ? favorecidoNome.get(p.favorecido_id) ?? "—" : "—"}
                          </TableCell>
                          <TableCell>
                            {p.tipo_projeto_id ? tipoProjetoNome.get(p.tipo_projeto_id) ?? "—" : "—"}
                          </TableCell>
                          <TableCell className="text-right">{formatHoursMinutes(total)}</TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={6} className="p-0">
                              <div className="px-8 py-3">
                                {tarefasList.length === 0 ? (
                                  <div className="text-sm text-muted-foreground py-2">
                                    Nenhum apontamento registrado
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Tarefa</TableHead>
                                        <TableHead className="text-right w-40">Horas</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tarefasList.map((t) => (
                                        <TableRow key={t.id}>
                                          <TableCell>{t.nome}</TableCell>
                                          <TableCell className="text-right">
                                            {formatHoursMinutes(t.horas)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
