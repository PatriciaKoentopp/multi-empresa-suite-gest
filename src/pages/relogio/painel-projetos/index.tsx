import { useMemo, useState } from "react";
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
  Filter,
  Check,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useProjetosRelogio } from "@/hooks/useProjetosRelogio";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { cn, parseDateString, formatDate } from "@/lib/utils";

type StatusFilter = "todos" | "ativo" | "arquivado";

const fmt = (d: string | null) => {
  if (!d) return "—";
  const parsed = parseDateString(d);
  return parsed ? formatDate(parsed) : "—";
};

export default function PainelProjetosRelogioPage() {
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

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ativo");
  const [clienteFilter, setClienteFilter] = useState<string>("todos");
  const [clienteOpen, setClienteOpen] = useState(false);
  const [tipoProjetoFilter, setTipoProjetoFilter] = useState<string>("todos");
  const [tipoOpen, setTipoOpen] = useState(false);
  const [sortCodigoDir, setSortCodigoDir] = useState<"asc" | "desc">("asc");

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
    result.sort((a, b) => {
      const cmp = a.codigo.localeCompare(b.codigo);
      return sortCodigoDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [projetos, debouncedSearch, statusFilter, clienteFilter, tipoProjetoFilter, sortCodigoDir]);

  const clienteSelecionadoNome =
    clienteFilter === "todos" ? "Todos os clientes" : favorecidoNome.get(clienteFilter) ?? "Cliente";

  const tipoProjetoSelecionadoNome =
    tipoProjetoFilter === "todos" ? "Todos os tipos" : tipoProjetoNome.get(tipoProjetoFilter) ?? "Tipo de Projeto";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel de Projetos</h1>
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
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              clienteFilter === "todos" ? "opacity-100" : "opacity-0"
                            )}
                          />
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                clienteFilter === f.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {f.nome}
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
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                  <SelectItem value="arquivado" className="text-red-600">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="w-[120px] cursor-pointer select-none"
                    onClick={() =>
                      setSortCodigoDir((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                  >
                    <div className="flex items-center gap-1">
                      Código
                      {sortCodigoDir === "asc" ? (
                        <ArrowUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[120px]">Data Fotos</TableHead>
                  <TableHead className="w-[120px]">Data Prévia</TableHead>
                  <TableHead className="w-[120px]">Data Seleção</TableHead>
                  <TableHead className="w-[120px]">Data Prazo</TableHead>
                  <TableHead className="w-[120px]">Data Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{p.codigo}</TableCell>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell>{favorecidoNome.get(p.favorecido_id) ?? "—"}</TableCell>
                      <TableCell>{fmt(p.data_fotos)}</TableCell>
                      <TableCell>{fmt(p.data_previa)}</TableCell>
                      <TableCell>{fmt(p.data_selecao)}</TableCell>
                      <TableCell>{fmt(p.data_prazo)}</TableCell>
                      <TableCell>{fmt(p.data_entrega)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
