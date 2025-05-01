
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { ParcelasForm } from "@/components/movimentacao/ParcelasForm";
import { useOrcamentoForm, formasPagamento } from "@/hooks/useOrcamentoForm";
import { CabecalhoForm } from "@/components/vendas/orcamento/CabecalhoForm";
import { DetalhesProjetoForm } from "@/components/vendas/orcamento/DetalhesProjetoForm";
import { ServicosForm } from "@/components/vendas/orcamento/ServicosForm";
import { TotalVendaDisplay } from "@/components/vendas/orcamento/TotalVendaDisplay";
import { PagamentoForm } from "@/components/vendas/orcamento/PagamentoForm";
import { NotaFiscalForm } from "@/components/vendas/orcamento/NotaFiscalForm";

export default function OrcamentoPage() {
  const [searchParams] = useSearchParams();
  
  // Obter parâmetros da URL
  const orcamentoId = searchParams.get('id');
  const isVisualizacao = searchParams.get('visualizar') === '1';
  
  // Estado para controlar a validação de parcelas apenas durante o submit
  const [validandoParcelas, setValidandoParcelas] = useState(false);
  
  // Usar o hook personalizado para gerenciar o formulário
  const {
    // Estado do formulário
    data,
    setData,
    codigoVenda,
    setCodigoVenda,
    favorecidoId,
    setFavorecidoId,
    codigoProjeto,
    setCodigoProjeto,
    observacoes,
    setObservacoes,
    formaPagamento,
    setFormaPagamento,
    numeroParcelas,
    setNumeroParcelas,
    servicos,
    dataNotaFiscal,
    setDataNotaFiscal,
    numeroNotaFiscal,
    setNumeroNotaFiscal,
    notaFiscalPdfUrl,
    
    // Dados carregados
    favorecidos,
    servicosDisponiveis,
    
    // Handlers
    handleServicoChange,
    handleAddServico,
    handleRemoveServico,
    handleParcelaDataChange,
    handleParcelaValorChange,
    handleNotaFiscalPdfChange,
    handleCancel,
    handleSubmit,
    
    // Valores calculados
    total,
    parcelas,
    somaParcelas,
    
    // Estado de UI
    isLoading,
    isUploading,
    isVisualizacao: isVizualizacaoProp
  } = useOrcamentoForm(orcamentoId, isVisualizacao);

  // Função personalizada para lidar com o envio do formulário
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidandoParcelas(true); // Ativar validação apenas ao tentar salvar
    handleSubmit(e);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {orcamentoId 
            ? isVisualizacao 
              ? "Visualizar Orçamento" 
              : "Editar Orçamento" 
            : "Novo Orçamento"
          }
        </h2>
      </div>
      
      <Card>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
            <CabecalhoForm
              data={data}
              onDataChange={setData}
              codigoVenda={codigoVenda}
              onCodigoVendaChange={(e) => setCodigoVenda(e.target.value)}
              favorecidoId={favorecidoId}
              onFavorecidoChange={setFavorecidoId}
              favorecidos={favorecidos}
              disabled={isVisualizacao}
            />
            
            <DetalhesProjetoForm
              codigoProjeto={codigoProjeto}
              onCodigoProjetoChange={(e) => setCodigoProjeto(e.target.value)}
              observacoes={observacoes}
              onObservacoesChange={(e) => setObservacoes(e.target.value)}
              disabled={isVisualizacao}
            />

            <ServicosForm
              servicos={servicos}
              servicosDisponiveis={servicosDisponiveis}
              onServicoChange={handleServicoChange}
              onAddServico={handleAddServico}
              onRemoveServico={handleRemoveServico}
              disabled={isVisualizacao}
            />
            
            <TotalVendaDisplay 
              total={total} 
              somaParcelas={somaParcelas}
              mostrarAlerta={validandoParcelas} 
            />

            <PagamentoForm
              formaPagamento={formaPagamento}
              onFormaPagamentoChange={setFormaPagamento}
              numeroParcelas={numeroParcelas}
              onNumeroParcelasChange={(e) => setNumeroParcelas(Number(e.target.value) || 1)}
              formasPagamento={formasPagamento}
              disabled={isVisualizacao}
            />

            <div>
              <label className="block text-sm mb-1">
                Parcelas e Datas de Vencimento
              </label>
              <div className="flex flex-col gap-2">
                <ParcelasForm 
                  parcelas={parcelas.map(p => ({
                    numero: parseInt(p.numeroParcela.split('/')[1]),
                    valor: p.valor,
                    dataVencimento: parseDateString(p.dataVencimento) // Usamos a função parseDateString ao invés de new Date()
                  }))}
                  onValorChange={handleParcelaValorChange}
                  onDataChange={handleParcelaDataChange}
                  readOnly={isVisualizacao}
                  mostrarAlertaDiferenca={false}
                  valorTotal={total}
                  somaParcelas={somaParcelas}
                />
              </div>
            </div>

            <NotaFiscalForm
              dataNotaFiscal={dataNotaFiscal}
              onDataNotaFiscalChange={(e) => setDataNotaFiscal(e.target.value)}
              numeroNotaFiscal={numeroNotaFiscal}
              onNumeroNotaFiscalChange={(e) => setNumeroNotaFiscal(e.target.value)}
              onNotaFiscalPdfChange={handleNotaFiscalPdfChange}
              notaFiscalPdfUrl={notaFiscalPdfUrl}
              isUploading={isUploading}
              disabled={isVisualizacao}
            />

            <div className="flex gap-2 mt-2">
              {!isVisualizacao && (
                <Button 
                  type="submit" 
                  variant="blue"
                  disabled={isLoading || isUploading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    orcamentoId ? "Atualizar Orçamento" : "Salvar Orçamento"
                  )}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleCancel}>
                Voltar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Importar a função parseDateString de utils.ts
import { parseDateString } from '@/lib/utils';
