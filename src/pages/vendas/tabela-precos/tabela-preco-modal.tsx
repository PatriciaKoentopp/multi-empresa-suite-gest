import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Servico = { id: number; nome: string; precoPadrao: number };
type Vigencia = { dataInicial: Date | null; dataFinal: Date | null };

type TabelaPreco = {
  id?: number;
  nome: string;
  vigencia: Vigencia;
  servicos: { servicoId: number; nome: string; preco: number }[];
};

interface TabelaPrecoModalProps {
  open: boolean;
  onClose: () => void;
  tabela?: TabelaPreco | null;
  servicosACadastrar: Servico[];
  onSalvar: (tabela: TabelaPreco) => void;
  modo: "visualizar" | "editar" | "novo";
}

export const TabelaPrecoModal: React.FC<TabelaPrecoModalProps> = ({
  open,
  onClose,
  tabela,
  servicosACadastrar,
  onSalvar,
  modo,
}) => {
  // Modo visualização: campos desabilitados
  const somenteLeitura = modo === "visualizar";

  const [nome, setNome] = useState(tabela?.nome || "");
  const [vigencia, setVigencia] = useState<Vigencia>({
    dataInicial: tabela?.vigencia.dataInicial || null,
    dataFinal: tabela?.vigencia.dataFinal || null,
  });
  const [servicosTabela, setServicosTabela] = useState<
    { servicoId: number; nome: string; preco: number }[]
  >(tabela?.servicos ? [...tabela.servicos] : []);
  const [novoServicoId, setNovoServicoId] = useState<number | "">("");
  const [novoPreco, setNovoPreco] = useState<string>("");

  // Resetar ao abrir outro modal (corrige bug do react de manter estados)
  React.useEffect(() => {
    if (tabela) {
      setNome(tabela.nome);
      setVigencia({
        dataInicial: tabela.vigencia.dataInicial,
        dataFinal: tabela.vigencia.dataFinal,
      });
      setServicosTabela([...tabela.servicos]);
    } else {
      setNome("");
      setVigencia({ dataInicial: null, dataFinal: null });
      setServicosTabela([]);
    }
    setNovoServicoId("");
    setNovoPreco("");
  }, [open, tabela]);

  function adicionarServico() {
    if (!novoServicoId || novoPreco === "") return;
    if (servicosTabela.find((s) => s.servicoId === novoServicoId)) return;
    const servicoObj = servicosACadastrar.find((s) => s.id === novoServicoId);
    if (!servicoObj) return;
    setServicosTabela((prev) => [
      ...prev,
      { servicoId: servicoObj.id, nome: servicoObj.nome, preco: parseFloat(novoPreco.replace(",", ".")) },
    ]);
    setNovoServicoId("");
    setNovoPreco("");
  }

  function removerServico(servicoId: number) {
    setServicosTabela((prev) => prev.filter((s) => s.servicoId !== servicoId));
  }

  function handleSalvar() {
    // Checar validade dos campos
    if (!nome.trim() || !vigencia.dataInicial || !vigencia.dataFinal || !servicosTabela.length) {
      return;
    }
    onSalvar({
      ...tabela,
      nome,
      vigencia: { ...vigencia },
      servicos: [...servicosTabela],
    } as TabelaPreco);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!somenteLeitura) handleSalvar();
          }}
        >
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {modo === "visualizar" && <>Detalhes da Tabela</>}
              {modo === "editar" && <>Editar Tabela</>}
              {modo === "novo" && <>Nova Tabela de Preços</>}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute top-4 right-4"><X /></Button>
            </DialogClose>
          </DialogHeader>
          <div className="px-6 pt-5 pb-4 grid gap-4">
            <div>
              <label className="block font-medium mb-1">Nome</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} disabled={somenteLeitura} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Vigência (início)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/60 hover:bg-white/80",
                        !vigencia.dataInicial && "text-muted-foreground"
                      )}
                      type="button"
                      disabled={somenteLeitura}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {vigencia.dataInicial
                        ? format(vigencia.dataInicial, "dd/MM/yyyy", { locale: ptBR })
                        : <span>Selecione...</span>
                      }
                    </Button>
                  </PopoverTrigger>
                  {!somenteLeitura && (
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={vigencia.dataInicial}
                        onSelect={date => setVigencia(prev => ({ ...prev, dataInicial: date ?? null }))}
                        initialFocus
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </div>
              <div>
                <label className="block font-medium mb-1">Vigência (final)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/60 hover:bg-white/80",
                        !vigencia.dataFinal && "text-muted-foreground"
                      )}
                      type="button"
                      disabled={somenteLeitura}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {vigencia.dataFinal
                        ? format(vigencia.dataFinal, "dd/MM/yyyy", { locale: ptBR })
                        : <span>Selecione...</span>
                      }
                    </Button>
                  </PopoverTrigger>
                  {!somenteLeitura && (
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={vigencia.dataFinal}
                        onSelect={date => setVigencia(prev => ({ ...prev, dataFinal: date ?? null }))}
                        initialFocus
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Serviços e Preços
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                <select
                  className="border rounded px-2 py-1 md:col-span-4 bg-white"
                  value={novoServicoId}
                  disabled={somenteLeitura}
                  onChange={e => setNovoServicoId(Number(e.target.value) || "")}
                >
                  <option value="">Selecione um serviço...</option>
                  {servicosACadastrar
                    .filter(s => !servicosTabela.some(st => st.servicoId === s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                </select>
                <Input
                  placeholder="Preço (R$)"
                  type="number"
                  step="0.01"
                  min={0}
                  className="md:col-span-3"
                  value={novoPreco}
                  onChange={e => setNovoPreco(e.target.value)}
                  disabled={!novoServicoId || somenteLeitura}
                />
                <Button
                  type="button"
                  size="sm"
                  className="md:col-span-1"
                  onClick={adicionarServico}
                  variant="secondary"
                  disabled={!novoServicoId || !novoPreco || somenteLeitura}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
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
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {servicosTabela.map(srv => (
                        <tr key={srv.servicoId} className="border-t">
                          <td className="py-1 px-2">{srv.nome}</td>
                          <td className="py-1 px-2">
                            {srv.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            {!somenteLeitura && (
                              <Button variant="outline" size="sm" onClick={() => removerServico(srv.servicoId)}>
                                Remover
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-4 flex-row gap-2">
            {!somenteLeitura && (
              <>
                <Button
                  type="submit"
                  variant="blue"
                  disabled={!nome || !vigencia.dataInicial || !vigencia.dataFinal || !servicosTabela.length}
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
