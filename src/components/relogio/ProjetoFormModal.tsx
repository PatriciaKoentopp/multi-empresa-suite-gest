import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateToISOString, parseDateString } from "@/lib/utils";
import { DateInput } from "@/components/movimentacao/DateInput";
import { useFavorecidos } from "@/hooks/useFavorecidos";
import { useTiposProjetoRelogio } from "@/hooks/useTiposProjetoRelogio";
import type { RelogioProjeto } from "@/types/relogio";
import type { ProjetoPayload } from "@/hooks/useProjetosRelogio";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projeto?: RelogioProjeto;
  onSubmit: (data: ProjetoPayload) => Promise<void>;
}

export function ProjetoFormModal({ open, onOpenChange, projeto, onSubmit }: Props) {
  const { data: favorecidos = [] } = useFavorecidos();
  const { tiposProjeto } = useTiposProjetoRelogio();
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [favorecidoId, setFavorecidoId] = useState("");
  const [tipoProjetoId, setTipoProjetoId] = useState("");
  const [fotosTiradas, setFotosTiradas] = useState("0");
  const [fotosEnviadas, setFotosEnviadas] = useState("0");
  const [fotosVendidas, setFotosVendidas] = useState("0");
  const [status, setStatus] = useState<"ativo" | "arquivado">("ativo");
  const [cidade, setCidade] = useState("");
  const [dataFotos, setDataFotos] = useState<Date | undefined>(undefined);
  const [dataPrevia, setDataPrevia] = useState<Date | undefined>(undefined);
  const [dataSelecao, setDataSelecao] = useState<Date | undefined>(undefined);
  const [dataPrazo, setDataPrazo] = useState<Date | undefined>(undefined);
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [clientePopoverOpen, setClientePopoverOpen] = useState(false);

  const tiposAtivos = useMemo(
    () => tiposProjeto.filter((t) => t.status === "ativo" || t.id === projeto?.tipo_projeto_id),
    [tiposProjeto, projeto?.tipo_projeto_id]
  );

  useEffect(() => {
    if (open) {
      setCodigo(projeto?.codigo ?? "");
      setNome(projeto?.nome ?? "");
      setFavorecidoId(projeto?.favorecido_id ?? "");
      setFotosTiradas(String(projeto?.fotos_tiradas ?? 0));
      setFotosEnviadas(String(projeto?.fotos_enviadas ?? 0));
      setFotosVendidas(String(projeto?.fotos_vendidas ?? 0));
      setStatus((projeto?.status as "ativo" | "arquivado") ?? "ativo");
      setCidade(projeto?.cidade ?? "");
      setDataFotos(projeto?.data_fotos ? parseDateString(projeto.data_fotos) : undefined);
      setDataPrevia(projeto?.data_previa ? parseDateString(projeto.data_previa) : undefined);
      setDataSelecao(projeto?.data_selecao ? parseDateString(projeto.data_selecao) : undefined);
      setDataPrazo(projeto?.data_prazo ? parseDateString(projeto.data_prazo) : undefined);
      setDataEntrega(projeto?.data_entrega ? parseDateString(projeto.data_entrega) : undefined);
      if (projeto?.tipo_projeto_id) {
        setTipoProjetoId(projeto.tipo_projeto_id);
      } else {
        const fotografia = tiposProjeto.find((t) => t.nome.toLowerCase() === "fotografia");
        setTipoProjetoId(fotografia?.id ?? "");
      }
    }
  }, [open, projeto, tiposProjeto]);

  const clienteSelecionado = useMemo(
    () => favorecidos.find((f) => f.id === favorecidoId),
    [favorecidos, favorecidoId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nome.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        codigo: codigo.trim(),
        nome: nome.trim(),
        favorecido_id: favorecidoId || null,
        tipo_projeto_id: tipoProjetoId || null,
        fotos_tiradas: Number(fotosTiradas) || 0,
        fotos_enviadas: Number(fotosEnviadas) || 0,
        fotos_vendidas: Number(fotosVendidas) || 0,
        status,
        cidade: cidade.trim() || null,
        data_fotos: dateToISOString(dataFotos),
        data_previa: dateToISOString(dataPrevia),
        data_selecao: dateToISOString(dataSelecao),
        data_prazo: dateToISOString(dataPrazo),
        data_entrega: dateToISOString(dataEntrega),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{projeto ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Projeto</Label>
              <Select
                value={tipoProjetoId || "__sem_tipo__"}
                onValueChange={(v) => setTipoProjetoId(v === "__sem_tipo__" ? "" : v)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Selecione o tipo de projeto" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-72">
                  <SelectItem value="__sem_tipo__">
                    <span className="text-muted-foreground">Sem tipo</span>
                  </SelectItem>
                  {tiposAtivos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
          </div>


          <div className="space-y-2">
            <Label>Cliente</Label>
            <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-white dark:bg-gray-900"
                >
                  {clienteSelecionado ? clienteSelecionado.nome : "Selecione um cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__sem_cliente__"
                        onSelect={() => {
                          setFavorecidoId("");
                          setClientePopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !favorecidoId ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-muted-foreground">Sem cliente</span>
                      </CommandItem>
                      {favorecidos.map((f) => (
                        <CommandItem
                          key={f.id}
                          value={f.nome}
                          onSelect={() => {
                            setFavorecidoId(f.id);
                            setClientePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              favorecidoId === f.id ? "opacity-100" : "opacity-0"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fotos_tiradas">Fotos Tiradas</Label>
              <Input
                id="fotos_tiradas"
                type="number"
                min="0"
                value={fotosTiradas}
                onChange={(e) => setFotosTiradas(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fotos_enviadas">Fotos Enviadas</Label>
              <Input
                id="fotos_enviadas"
                type="number"
                min="0"
                value={fotosEnviadas}
                onChange={(e) => setFotosEnviadas(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fotos_vendidas">Fotos Vendidas</Label>
              <Input
                id="fotos_vendidas"
                type="number"
                min="0"
                value={fotosVendidas}
                onChange={(e) => setFotosVendidas(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data Fotos</Label>
              <DateInput value={dataFotos} onChange={(d) => setDataFotos(d ?? undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Data Prévia</Label>
              <DateInput value={dataPrevia} onChange={(d) => setDataPrevia(d ?? undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Data Seleção</Label>
              <DateInput value={dataSelecao} onChange={(d) => setDataSelecao(d ?? undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Data Prazo</Label>
              <DateInput value={dataPrazo} onChange={(d) => setDataPrazo(d ?? undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Data Entrega</Label>
              <DateInput value={dataEntrega} onChange={(d) => setDataEntrega(d ?? undefined)} />
            </div>
          </div>


          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "ativo" | "arquivado")}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                <SelectItem value="arquivado" className="text-red-600">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
