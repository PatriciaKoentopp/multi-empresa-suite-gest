import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FavorecidosForm } from "@/components/favorecidos/favorecidos-form";
import { PlanoContasForm } from "@/components/plano-contas/plano-contas-form";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { TipoTitulo } from "@/types/tipos-titulos";
import { Movimentacao } from "@/types/movimentacoes";
import { useMovimentacaoForm } from "@/hooks/useMovimentacaoForm";
import { useMovimentacaoDados } from "@/hooks/useMovimentacaoDados";
import { TransferenciaForm } from "@/components/movimentacao/TransferenciaForm";
import { DateInput } from "@/components/movimentacao/DateInput";

export default function IncluirMovimentacaoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const movimentacaoParaEditar = location.state?.movimentacao;

  const {
    operacao,
    setOperacao,
    dataEmissao,
    setDataEmissao,
    dataLancamento,
    setDataLancamento,
    numDoc,
    setNumDoc,
    favorecido,
    setFavorecido,
    categoria,
    setCategoria,
    descricao,
    setDescricao,
    valor,
    handleValorChange,
    formaPagamento,
    setFormaPagamento,
    numParcelas,
    setNumParcelas,
    dataPrimeiroVenc,
    setDataPrimeiroVenc,
    considerarDRE,
    setConsiderarDRE,
    contaOrigem,
    setContaOrigem,
    contaDestino,
    setContaDestino,
    handleSalvar
  } = useMovimentacaoForm(movimentacaoParaEditar);

  const { favorecidos, categorias, contasCorrente, tiposTitulos } = useMovimentacaoDados();

  // Formas de pagamento fixas
  const formasPagamento = [
    { id: "1", nome: "Dinheiro" },
    { id: "2", nome: "Cartão" },
    { id: "3", nome: "Boleto" },
    { id: "4", nome: "Transferência" }
  ];

  const [isModalNovoFavorecido, setIsModalNovoFavorecido] = useState(false);
  const [isModalNovaCategoria, setIsModalNovaCategoria] = useState(false);
  const [tipoTituloId, setTipoTituloId] = useState("");

  // Resetar tipo de título ao mudar operação
  useEffect(() => {
    setTipoTituloId("");
  }, [operacao]);

  // Filtrar tipos de títulos conforme a operação
  const tiposTitulosFiltrados = tiposTitulos.filter(tipo => {
    if (operacao === "pagar") return tipo.tipo === "pagar";
    if (operacao === "receber") return tipo.tipo === "receber";
    return false; // não mostra nenhum para transferência
  });

  // Modal Favorecido
  async function handleSalvarNovoFavorecido(data: any) {
    try {
      if (!currentCompany?.id) {
        toast.error("Empresa não selecionada");
        return;
      }
      
      // Inserir novo favorecido no Supabase
      const { data: novoFavorecido, error } = await supabase
        .from("favorecidos")
        .insert([{
          empresa_id: currentCompany.id,
          nome: data.nome,
          tipo: data.tipo || "cliente",
          documento: data.documento || "",
          tipo_documento: data.tipoDocumento || "cpf",
          status: "ativo"
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar lista local de favorecidos
      setFavorecidos(prev => [...prev, { id: novoFavorecido.id, nome: novoFavorecido.nome }]);
      setFavorecido(novoFavorecido.id);
      setIsModalNovoFavorecido(false);
      toast.success("Favorecido cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar favorecido:", error);
      toast.error("Erro ao cadastrar favorecido");
    }
  }

  // Modal Categoria Financeira
  async function handleSalvarNovaCategoria(data: any) {
    try {
      if (!currentCompany?.id) {
        toast.error("Empresa não selecionada");
        return;
      }
      
      // Inserir nova categoria no Supabase
      const { data: novaCategoria, error } = await supabase
        .from("plano_contas")
        .insert([{
          empresa_id: currentCompany.id,
          descricao: data.descricao,
          codigo: data.codigo || "",
          tipo: data.tipo || "despesa",
          status: "ativo",
          categoria: "movimentação"
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar lista local de categorias
      setCategorias(prev => [...prev, { id: novaCategoria.id, nome: novaCategoria.descricao }]);
      setCategoria(novaCategoria.id);
      setIsModalNovaCategoria(false);
      toast.success("Categoria cadastrada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast.error("Erro ao cadastrar categoria");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Incluir Movimentação</h1>
      
      <div className="bg-white shadow rounded flex flex-col gap-6">
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 items-end mb-6">
            <div className="flex flex-col gap-1">
              <Label>Operação</Label>
              <Select value={operacao} onValueChange={v => setOperacao(v as any)}>
                <SelectTrigger className="bg-white z-50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="pagar">Pagar</SelectItem>
                  <SelectItem value="receber">Receber</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {operacao === "transferencia" ? (
            <TransferenciaForm
              dataLancamento={dataLancamento}
              onDataLancamentoChange={setDataLancamento}
              contaOrigem={contaOrigem}
              onContaOrigemChange={setContaOrigem}
              contaDestino={contaDestino}
              onContaDestinoChange={setContaDestino}
              valor={valor}
              onValorChange={handleValorChange}
              descricao={descricao}
              onDescricaoChange={(e) => setDescricao(e.target.value)}
              contasCorrente={contasCorrente}
              onSalvar={handleSalvar}
              onCancel={() => navigate(-1)}
            />
          ) : (
            <>
              {/* Linha 2: Número do Documento, Favorecido */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo do Título</Label>
                  <Select
                    value={tipoTituloId}
                    onValueChange={setTipoTituloId}
                  >
                    <SelectTrigger className="bg-white z-50">
                      <SelectValue placeholder="Selecione o tipo do título" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {tiposTitulosFiltrados.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Favorecido</Label>
                  <div className="flex gap-2 items-end">
                    <Select value={favorecido} onValueChange={setFavorecido}>
                      <SelectTrigger className="bg-white z-50">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {favorecidos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                      </SelectContent>
                      </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsModalNovoFavorecido(true)}
                      className="border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                      aria-label="Novo favorecido"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* Linha 3: Categoria Financeira, Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do Documento</Label>
                  <Input value={numDoc} onChange={e => setNumDoc(e.target.value)} />
                </div>
                <div>
                  <Label>Categoria Financeira</Label>
                  <div className="flex gap-2 items-end">
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger className="bg-white z-50">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsModalNovaCategoria(true)}
                      className="border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                      aria-label="Nova categoria financeira"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* Linha 3: Categoria Financeira, Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger className="bg-white z-50">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {formasPagamento.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Linha 4: Descrição */}
              <div>
                <Label>Descrição</Label>
                <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              {/* Linha 5: Valor, Número de Parcelas, Primeiro Vencimento */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <Label>Valor</Label>
                  <div className="relative flex items-center">
                    <Input value={valor} onChange={handleValorChange} placeholder="0,00" inputMode="decimal" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none select-none">
                      R$
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Número de Parcelas</Label>
                  <Input type="number" min={1} max={36} value={numParcelas} onChange={e => setNumParcelas(Math.max(1, Math.min(36, Number(e.target.value) || 1)))} />
                </div>
                <div className="flex flex-col gap-1">
                  <DateInput label="Primeiro Vencimento" value={dataPrimeiroVenc} onChange={setDataPrimeiroVenc} />
                </div>
              </div>
              {/* Checkbox DRE */}
              <div className="flex items-center gap-2">
                <Checkbox checked={considerarDRE} onCheckedChange={v => setConsiderarDRE(!!v)} id="dre" />
                <Label htmlFor="dre">Movimentação aparece no DRE?</Label>
              </div>
              {/* Botões */}
              <div className="flex gap-2 justify-end mt-2">
                <Button type="button" variant="blue" onClick={handleSalvar}>
                  Salvar
                </Button>
                <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal Novo Favorecido */}
      <Dialog open={isModalNovoFavorecido} onOpenChange={setIsModalNovoFavorecido}>
        <DialogContent className="bg-white p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Novo Favorecido</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <FavorecidosForm 
              grupos={[]} 
              profissoes={[]} 
              onSubmit={handleSalvarNovoFavorecido} 
              onCancel={() => setIsModalNovoFavorecido(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Categoria */}
      <Dialog open={isModalNovaCategoria} onOpenChange={setIsModalNovaCategoria}>
        <DialogContent className="bg-white p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Nova Categoria Financeira</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <PlanoContasForm 
              onSubmit={handleSalvarNovaCategoria} 
              onCancel={() => setIsModalNovaCategoria(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
