
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FavorecidosForm } from "@/components/favorecidos/favorecidos-form";
import { PlanoContasForm } from "@/components/plano-contas/plano-contas-form";
import { useMovimentacaoForm } from "@/hooks/useMovimentacaoForm";
import { useMovimentacaoDados } from "@/hooks/useMovimentacaoDados";
import { TransferenciaForm } from "@/components/movimentacao/TransferenciaForm";
import { PagamentoForm } from "@/components/movimentacao/PagamentoForm";
import { RecebimentoForm } from "@/components/movimentacao/RecebimentoForm";
import { DateInput } from "@/components/movimentacao/DateInput";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  let movimentacaoParaEditar = location.state?.movimentacao;
  const modoVisualizacao = location.state?.modoVisualizacao;
  
  // Garantir que as datas das parcelas sejam objetos Date
  if (movimentacaoParaEditar && movimentacaoParaEditar.parcelas) {
    movimentacaoParaEditar = {
      ...movimentacaoParaEditar,
      parcelas: movimentacaoParaEditar.parcelas.map(parcela => ({
        ...parcela,
        dataVencimento: parcela.data_vencimento ? new Date(formatDate(parcela.data_vencimento)) : new Date()
      }))
    };
    
    // Log para diagnóstico
    console.log('Parcelas processadas:', movimentacaoParaEditar.parcelas);
  }

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
    tipoTitulo,
    setTipoTitulo,
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
    handleSalvar,
    parcelas,
    atualizarValorParcela,
    atualizarDataVencimento,
    mesReferencia,
    setMesReferencia,
    documentoPdf,
    handleDocumentoChange,
    isLoading
  } = useMovimentacaoForm(movimentacaoParaEditar);

  const { favorecidos, categorias, contasCorrente, tiposTitulos } = useMovimentacaoDados();
  
  // Filtrar tipos de títulos baseado na operação
  const tiposTitulosFiltrados = tiposTitulos.filter(tipo => {
    if (operacao === "pagar") return tipo.tipo === "pagar";
    if (operacao === "receber") return tipo.tipo === "receber";
    return false;
  });

  const [isModalNovoFavorecido, setIsModalNovoFavorecido] = useState(false);
  const [isModalNovaCategoria, setIsModalNovaCategoria] = useState(false);
  
  // Efeito para definir o tipoTitulo quando carregamos a movimentação
  useEffect(() => {
    if (movimentacaoParaEditar?.tipo_titulo_id) {
      setTipoTitulo(movimentacaoParaEditar.tipo_titulo_id);
    }
  }, [movimentacaoParaEditar, setTipoTitulo]);
  
  // Log para diagnóstico de parcelas
  useEffect(() => {
    if (parcelas && parcelas.length > 0) {
      console.log('Parcelas carregadas:', parcelas);
    }
  }, [parcelas]);

  const handleSalvarNovoFavorecido = () => {
    // Implementação do salvamento do novo favorecido
    setIsModalNovoFavorecido(false);
    toast.success("Novo favorecido cadastrado com sucesso!");
  };
  
  const handleSalvarNovaCategoria = () => {
    // Implementação do salvamento da nova categoria
    setIsModalNovaCategoria(false);
    toast.success("Nova categoria cadastrada com sucesso!");
  };

  // Função para formatar o mês de referência
  const handleMesReferenciaChange = (e) => {
    let value = e.target.value.replace(/[^0-9/]/g, '');
    
    // Formatar como MM/YYYY
    if (value.length > 2 && value.indexOf('/') === -1) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    
    // Limitar o tamanho máximo (MM/YYYY = 7 caracteres)
    if (value.length <= 7) {
      setMesReferencia(value);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {modoVisualizacao ? "Visualizar Movimentação" : movimentacaoParaEditar ? "Editar Movimentação" : "Incluir Movimentação"}
      </h1>
      
      <div className="bg-white shadow rounded flex flex-col gap-6">
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 items-end mb-6">
            <div className="flex flex-col gap-1">
              <Label>Operação</Label>
              <Select 
                value={operacao} 
                onValueChange={v => setOperacao(v as any)}
                disabled={modoVisualizacao}
              >
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
            
            <div>
              <DateInput
                label="Data de Emissão"
                value={dataEmissao}
                onChange={setDataEmissao}
                disabled={modoVisualizacao}
              />
            </div>
            
            <div>
              <DateInput
                label="Data de Lançamento"
                value={dataLancamento}
                onChange={setDataLancamento}
                disabled={modoVisualizacao}
              />
            </div>
          </div>

          {/* Campos adicionais para todos os tipos de operação */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <Label>Mês de Referência (MM/AAAA)</Label>
              <Input
                value={mesReferencia}
                onChange={handleMesReferenciaChange}
                placeholder="05/2025"
                className="bg-white"
                maxLength={7}
                disabled={modoVisualizacao}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <Label>Documento (PDF)</Label>
              <div className="flex items-center">
                {documentoPdf ? (
                  <div className="flex gap-2 w-full">
                    <a 
                      href={documentoPdf} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 underline flex-grow truncate"
                    >
                      Ver documento
                    </a>
                    {!modoVisualizacao && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-10"
                        onClick={() => document.getElementById('documento-upload').click()}
                      >
                        Alterar
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full">
                    <Input
                      type="file"
                      id="documento-upload"
                      onChange={handleDocumentoChange}
                      className="hidden"
                      accept=".pdf"
                      disabled={modoVisualizacao}
                    />
                    {!modoVisualizacao && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={() => document.getElementById('documento-upload').click()}
                      >
                        <Upload size={16} />
                        Anexar documento
                      </Button>
                    )}
                  </div>
                )}
              </div>
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
              readOnly={modoVisualizacao}
            />
          ) : operacao === "pagar" ? (
            <PagamentoForm
              numDoc={numDoc}
              onNumDocChange={(e) => setNumDoc(e.target.value)}
              tipoTituloId={tipoTitulo}
              onTipoTituloChange={setTipoTitulo}
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
              tiposTitulos={tiposTitulosFiltrados}
              favorecidos={favorecidos}
              categorias={categorias}
              formasPagamento={formasPagamento}
              onNovoFavorecido={() => setIsModalNovoFavorecido(true)}
              onNovaCategoria={() => setIsModalNovaCategoria(true)}
              parcelas={parcelas || []}
              onParcelaValorChange={atualizarValorParcela}
              onParcelaDataChange={atualizarDataVencimento}
              readOnly={modoVisualizacao}
            />
          ) : operacao === "receber" ? (
            <RecebimentoForm
              numDoc={numDoc}
              onNumDocChange={(e) => setNumDoc(e.target.value)}
              tipoTituloId={tipoTitulo}
              onTipoTituloChange={setTipoTitulo}
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
              tiposTitulos={tiposTitulosFiltrados}
              favorecidos={favorecidos}
              categorias={categorias}
              formasPagamento={formasPagamento}
              onNovoFavorecido={() => setIsModalNovoFavorecido(true)}
              onNovaCategoria={() => setIsModalNovaCategoria(true)}
              parcelas={parcelas || []}
              readOnly={modoVisualizacao}
            />
          ) : null}
          
          {/* Botões de ação */}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              {modoVisualizacao ? "Voltar" : "Cancelar"}
            </Button>
            {!modoVisualizacao && (
              <Button 
                variant="blue" 
                onClick={handleSalvar} 
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
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
