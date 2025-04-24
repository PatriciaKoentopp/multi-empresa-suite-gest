
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FavorecidosForm } from "@/components/favorecidos/favorecidos-form";
import { PlanoContasForm } from "@/components/plano-contas/plano-contas-form";
import { useMovimentacaoForm } from "@/hooks/useMovimentacaoForm";
import { useMovimentacaoDados } from "@/hooks/useMovimentacaoDados";
import { TransferenciaForm } from "@/components/movimentacao/TransferenciaForm";
import { PagamentoForm } from "@/components/movimentacao/PagamentoForm";
import { RecebimentoForm } from "@/components/movimentacao/RecebimentoForm";
import { DateInput } from "@/components/movimentacao/DateInput";
import { useNavigate, useLocation } from "react-router-dom";

// Formas de pagamento fixas
const formasPagamento = [
  { id: "1", nome: "Dinheiro" },
  { id: "2", nome: "Cartão" },
  { id: "3", nome: "Boleto" },
  { id: "4", nome: "Transferência" }
];

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

  const [isModalNovoFavorecido, setIsModalNovoFavorecido] = useState(false);
  const [isModalNovaCategoria, setIsModalNovaCategoria] = useState(false);
  const [tipoTituloId, setTipoTituloId] = useState("");

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
            
            <div className="col-span-2">
              <DateInput
                label="Data de Lançamento"
                value={dataLancamento}
                onChange={setDataLancamento}
              />
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
          ) : operacao === "pagar" ? (
            <PagamentoForm
              numDoc={numDoc}
              onNumDocChange={(e) => setNumDoc(e.target.value)}
              tipoTituloId={tipoTituloId}
              onTipoTituloChange={setTipoTituloId}
              favorecido={favorecido}
              onFavorecidoChange={setFavorecido}
              categoria={categoria}
              onCategoriaChange={setCategoria}
              formaPagamento={formaPagamento}
              onFormaPagamentoChange={setFormaPagamento}
              descricao={descricao}
              onDescricaoChange={(e) => setDescricao(e.target.value)}
              valor={valor}
              onValorChange={handleValorChange}
              numParcelas={numParcelas}
              onNumParcelasChange={(e) => setNumParcelas(Number(e.target.value))}
              dataPrimeiroVenc={dataPrimeiroVenc}
              onDataPrimeiroVencChange={setDataPrimeiroVenc}
              considerarDRE={considerarDRE}
              onConsiderarDREChange={setConsiderarDRE}
              tiposTitulos={tiposTitulos.filter(t => t.tipo === "pagar")}
              favorecidos={favorecidos}
              categorias={categorias}
              formasPagamento={formasPagamento}
              onNovoFavorecido={() => setIsModalNovoFavorecido(true)}
              onNovaCategoria={() => setIsModalNovaCategoria(true)}
            />
          ) : operacao === "receber" ? (
            <RecebimentoForm
              numDoc={numDoc}
              onNumDocChange={(e) => setNumDoc(e.target.value)}
              tipoTituloId={tipoTituloId}
              onTipoTituloChange={setTipoTituloId}
              favorecido={favorecido}
              onFavorecidoChange={setFavorecido}
              categoria={categoria}
              onCategoriaChange={setCategoria}
              formaPagamento={formaPagamento}
              onFormaPagamentoChange={setFormaPagamento}
              descricao={descricao}
              onDescricaoChange={(e) => setDescricao(e.target.value)}
              valor={valor}
              onValorChange={handleValorChange}
              numParcelas={numParcelas}
              onNumParcelasChange={(e) => setNumParcelas(Number(e.target.value))}
              dataPrimeiroVenc={dataPrimeiroVenc}
              onDataPrimeiroVencChange={setDataPrimeiroVenc}
              considerarDRE={considerarDRE}
              onConsiderarDREChange={setConsiderarDRE}
              tiposTitulos={tiposTitulos}
              favorecidos={favorecidos}
              categorias={categorias}
              formasPagamento={formasPagamento}
              onNovoFavorecido={() => setIsModalNovoFavorecido(true)}
              onNovaCategoria={() => setIsModalNovaCategoria(true)}
            />
          ) : null}
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
