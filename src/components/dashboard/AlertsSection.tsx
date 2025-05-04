import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CalendarClock, CreditCard, Clock, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ContaReceber } from "@/components/contas-a-receber/contas-a-receber-table";
import { LeadInteracao } from "@/pages/crm/leads/types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AlertsSectionProps {
  parcelasVencidas: ContaReceber[];
  parcelasHoje: ContaReceber[];
  interacoesPendentes: LeadInteracao[];
  isLoading: boolean;
}

export function AlertsSection({ parcelasVencidas, parcelasHoje, interacoesPendentes, isLoading }: AlertsSectionProps) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<string>("tudo");
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null);
  
  // Filtrando apenas interações com status "Aberto"
  const interacoesAbertas = interacoesPendentes.filter(interacao => interacao.status === "Aberto");
  
  // Contar totais para cada categoria
  const totalInteracoes = interacoesAbertas.length;
  const totalParcelas = parcelasVencidas.length + parcelasHoje.length;
  const total = totalInteracoes + totalParcelas;
  
  // Função para formatar data no padrão DD/MM/YYYY sem timezone
  function formatDate(data: Date | string): string {
    if (!data) return "-";
    
    // Se já for uma string no formato DD/MM/YYYY, retornar como está
    if (typeof data === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      return data;
    }
    
    // Se for uma string no formato ISO YYYY-MM-DD
    if (typeof data === "string" && data.includes("-")) {
      // Extrair a parte da data (sem a hora)
      const [dataCompleta] = data.split("T");
      const [ano, mes, dia] = dataCompleta.split("-");
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
    }
    
    // Para objetos Date
    if (data instanceof Date) {
      const dia = String(data.getDate()).padStart(2, "0");
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    // Tentar converter para Date como último recurso
    try {
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        const dia = String(dataObj.getDate()).padStart(2, "0");
        const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
        const ano = dataObj.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
    } catch (e) {
      console.error("Erro ao formatar data:", e);
    }
    
    // Fallback
    return typeof data === "string" ? data : "-";
  }
  
  // Função para navegar para a página de contas a receber
  const navegarParaContasReceber = () => {
    navigate("/financeiro/contas-receber");
  };
  
  // Função para navegar para a página de contas a pagar
  const navegarParaContasPagar = () => {
    navigate("/financeiro/contas-a-pagar");
  };
  
  // Função para navegar para a página de leads
  const navegarParaLead = (leadId: string) => {
    navigate(`/crm/leads?leadId=${leadId}`);
  };
  
  // Função para marcar interação como concluída
  const marcarInteracaoConcluida = async (interacao: LeadInteracao) => {
    try {
      setAtualizandoStatus(interacao.id);
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('leads_interacoes')
        .update({ status: "Realizado" })
        .eq('id', interacao.id);
      
      if (error) {
        throw error;
      }
      
      toast.success("Interação marcada como concluída");
      
      // Remover da lista localmente - não podemos modificar o array original
      const novasInteracoes = interacoesAbertas.filter(i => i.id !== interacao.id);
      // Note que isso não atualiza o estado real, apenas remove da visualização local
      // No próximo carregamento do dashboard os dados serão atualizados
      
    } catch (error) {
      console.error('Erro ao atualizar status da interação:', error);
      toast.error('Erro ao atualizar status', {
        description: 'Não foi possível atualizar o status da interação.'
      });
    } finally {
      setAtualizandoStatus(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Alertas e Pendências
          </CardTitle>
          <CardDescription>Carregando alertas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-500" />
            Alertas e Pendências
          </CardTitle>
          <CardDescription>Visão geral de pendências e alertas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-lg font-medium">Nenhuma pendência</h3>
            <p className="text-muted-foreground mt-1">
              Você não possui tarefas pendentes ou alertas ativos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Alertas e Pendências
              {total > 0 && (
                <Badge variant="destructive" className="ml-2 rounded-full">
                  {total}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Visão geral de pendências e alertas</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tudo" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4 grid grid-cols-3">
            <TabsTrigger value="tudo">
              Tudo
              {total > 0 && <Badge variant="destructive" className="ml-1.5">{total}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="financeiro">
              Financeiro
              {totalParcelas > 0 && <Badge variant="destructive" className="ml-1.5">{totalParcelas}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="crm">
              CRM
              {totalInteracoes > 0 && <Badge variant="destructive" className="ml-1.5">{totalInteracoes}</Badge>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tudo" className="space-y-4">
            {/* Contas a receber em atraso */}
            {parcelasVencidas.filter(p => p.tipo === 'receber').length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Contas a Receber em atraso
                </h3>
                <div className="divide-y">
                  {parcelasVencidas.filter(p => p.tipo === 'receber').slice(0, 3).map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarClock className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-red-600">
                              Vencido em {formatDate(parcela.dataVencimento)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-destructive">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {parcelasVencidas.filter(p => p.tipo === 'receber').length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={navegarParaContasReceber}>
                      Ver mais {parcelasVencidas.filter(p => p.tipo === 'receber').length - 3} contas a receber em atraso
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Contas a pagar em atraso */}
            {parcelasVencidas.filter(p => p.tipo === 'pagar').length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Contas a Pagar em atraso
                </h3>
                <div className="divide-y">
                  {parcelasVencidas.filter(p => p.tipo === 'pagar').slice(0, 3).map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarClock className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-red-600">
                              Vencido em {formatDate(parcela.dataVencimento)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-destructive">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {parcelasVencidas.filter(p => p.tipo === 'pagar').length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={navegarParaContasPagar}>
                      Ver mais {parcelasVencidas.filter(p => p.tipo === 'pagar').length - 3} contas a pagar em atraso
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Parcelas a receber que vencem hoje */}
            {parcelasHoje.filter(p => p.tipo === 'receber').length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-amber-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Contas a Receber vencem hoje
                </h3>
                <div className="divide-y">
                  {parcelasHoje.filter(p => p.tipo === 'receber').slice(0, 3).map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-600">Vence hoje</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-600">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {parcelasHoje.filter(p => p.tipo === 'receber').length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={navegarParaContasReceber}>
                      Ver mais {parcelasHoje.filter(p => p.tipo === 'receber').length - 3} contas a receber para hoje
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Parcelas a pagar que vencem hoje */}
            {parcelasHoje.filter(p => p.tipo === 'pagar').length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-amber-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Contas a Pagar vencem hoje
                </h3>
                <div className="divide-y">
                  {parcelasHoje.filter(p => p.tipo === 'pagar').slice(0, 3).map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-600">Vence hoje</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-600">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {parcelasHoje.filter(p => p.tipo === 'pagar').length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={navegarParaContasPagar}>
                      Ver mais {parcelasHoje.filter(p => p.tipo === 'pagar').length - 3} contas a pagar para hoje
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Interações pendentes - agora exibindo apenas com status "Aberto" */}
            {interacoesAbertas.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-blue-600 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Interações pendentes
                </h3>
                <div className="divide-y">
                  {interacoesAbertas.slice(0, 3).map(interacao => (
                    <div key={interacao.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {interacao.tipo}
                            </Badge>
                            <p className="font-medium truncate max-w-[180px]">{interacao.descricao}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {interacao.responsavelNome || "Responsável não atribuído"}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span className={new Date(interacao.data) < new Date() ? "text-red-600" : "text-blue-600"}>
                              {new Date(interacao.data) < new Date() 
                                ? `Atrasado desde ${formatDate(interacao.data)}` 
                                : formatDate(interacao.data)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="px-2 h-8"
                            onClick={() => navegarParaLead(interacao.leadId)}
                          >
                            Ver lead
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="px-2 h-8"
                            onClick={() => marcarInteracaoConcluida(interacao)}
                            disabled={atualizandoStatus === interacao.id}
                          >
                            {atualizandoStatus === interacao.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent" />
                            ) : (
                              "Concluir"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {interacoesAbertas.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/crm/leads")}>
                      Ver mais {interacoesAbertas.length - 3} interações pendentes
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="financeiro" className="space-y-4">
            {/* Contas a Receber em atraso */}
            {parcelasVencidas.filter(p => p.tipo === 'receber').length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Contas a Receber em atraso
                </h3>
                <div className="divide-y">
                  {parcelasVencidas.filter(p => p.tipo === 'receber').map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarClock className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-red-600">
                              Vencido em {formatDate(parcela.dataVencimento)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-destructive">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contas a Pagar em atraso */}
            {parcelasVencidas.filter(p => p.tipo === 'pagar').length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Contas a Pagar em atraso
                </h3>
                <div className="divide-y">
                  {parcelasVencidas.filter(p => p.tipo === 'pagar').map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarClock className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-red-600">
                              Vencido em {formatDate(parcela.dataVencimento)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-destructive">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contas a receber para hoje */}
            {parcelasHoje.filter(p => p.tipo === 'receber').length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-amber-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Contas a Receber vencem hoje
                </h3>
                <div className="divide-y">
                  {parcelasHoje.filter(p => p.tipo === 'receber').map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-600">Vence hoje</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-600">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contas a pagar para hoje */}
            {parcelasHoje.filter(p => p.tipo === 'pagar').length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-amber-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Contas a Pagar vencem hoje
                </h3>
                <div className="divide-y">
                  {parcelasHoje.filter(p => p.tipo === 'pagar').map(parcela => (
                    <div key={parcela.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{parcela.cliente}</p>
                          <p className="text-sm text-muted-foreground">{parcela.descricao || "Sem descrição"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-600">Vence hoje</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-600">{formatCurrency(parcela.valor)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{parcela.numeroParcela}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {parcelasVencidas.filter(p => p.tipo === 'receber').length === 0 && parcelasVencidas.filter(p => p.tipo === 'pagar').length === 0 && 
             parcelasHoje.filter(p => p.tipo === 'receber').length === 0 && parcelasHoje.filter(p => p.tipo === 'pagar').length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <h3 className="text-lg font-medium">Sem pendências financeiras</h3>
                <p className="text-muted-foreground mt-1">
                  Não há contas vencidas ou a vencer hoje.
                </p>
              </div>
            )}
            
            {/* Botões de ação - removidos os botões duplicados, mantido apenas um conjunto */}
            {(parcelasVencidas.filter(p => p.tipo === 'receber').length > 0 || parcelasVencidas.filter(p => p.tipo === 'pagar').length > 0 || 
              parcelasHoje.filter(p => p.tipo === 'receber').length > 0 || parcelasHoje.filter(p => p.tipo === 'pagar').length > 0) && (
              <div className="grid gap-4 grid-cols-2 pt-4">
                <Button onClick={navegarParaContasReceber}>
                  Gerenciar contas a receber
                </Button>
                <Button onClick={navegarParaContasPagar}>
                  Gerenciar contas a pagar
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="crm" className="space-y-4">
            {/* Interações pendentes - agora exibindo apenas com status "Aberto" */}
            {interacoesAbertas.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium text-blue-600 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Interações pendentes
                </h3>
                <div className="divide-y">
                  {interacoesAbertas.map(interacao => (
                    <div key={interacao.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {interacao.tipo}
                            </Badge>
                            <p className="font-medium truncate max-w-[180px]">{interacao.descricao}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {interacao.responsavelNome || "Responsável não atribuído"}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span className={new Date(interacao.data) < new Date() ? "text-red-600" : "text-blue-600"}>
                              {new Date(interacao.data) < new Date() 
                                ? `Atrasado desde ${formatDate(interacao.data)}` 
                                : formatDate(interacao.data)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="px-2 h-8"
                            onClick={() => navegarParaLead(interacao.leadId)}
                          >
                            Ver lead
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="px-2 h-8"
                            onClick={() => marcarInteracaoConcluida(interacao)}
                            disabled={atualizandoStatus === interacao.id}
                          >
                            {atualizandoStatus === interacao.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent" />
                            ) : (
                              "Concluir"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-4">
                  <Button onClick={() => navigate("/crm/leads")}>
                    Gerenciar leads
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <h3 className="text-lg font-medium">Sem interações pendentes</h3>
                <p className="text-muted-foreground mt-1">
                  Não há interações pendentes ou atrasadas.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
