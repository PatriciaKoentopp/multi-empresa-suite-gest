import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompany } from "@/contexts/company-context";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { BanknoteIcon, CalendarX, CreditCard, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ContaReceber } from "@/types/financeiro";
import { ContaCorrente } from "@/types/conta-corrente";
import { useAuth } from "@/contexts/auth-context";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { LeadInteracao } from "@/pages/crm/leads/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardCardConfigurator } from "@/components/dashboard/DashboardCardConfigurator";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface TopCliente {
  id: string;
  nome: string;
  nomeFantasia: string;
  totalVendas: number;
}

interface DashboardData {
  totalVendas: number;
  totalOrcamentos: number;
  contasReceber: number;
  contasPagar: number;
  parcelasEmAtraso: ContaReceber[];
  parcelasHoje: ContaReceber[];
  saldoContas: {
    id: string;
    nome: string;
    saldo: number;
    considerar_saldo: boolean;
  }[];
  totalSaldo: number;
  interacoesPendentes: LeadInteracao[];
  topClientesAnoAtual: TopCliente[];
  topClientesAnoAnterior: TopCliente[];
}

export function Dashboard() {
  const { currentCompany, loading: companyLoading } = useCompany();
  const { toast } = useToast();
  const { userData, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isCardVisible, refetch: refetchCardsConfig } = useDashboardCards('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalVendas: 0,
    totalOrcamentos: 0,
    contasReceber: 0,
    contasPagar: 0,
    parcelasEmAtraso: [],
    parcelasHoje: [],
    saldoContas: [],
    totalSaldo: 0,
    interacoesPendentes: [],
    topClientesAnoAtual: [],
    topClientesAnoAnterior: []
  });

  // Função para recarregar a configuração dos cards
  const handleConfigChange = () => {
    refetchCardsConfig();
  };

  // Verificar se a autenticação e a empresa foram carregados
  useEffect(() => {
    if (!authLoading && !companyLoading) {
      setIsInitialized(true);
    }
  }, [authLoading, companyLoading]);

  // Buscar dados somente após inicialização
  useEffect(() => {
    if (!isInitialized) return;
    
    const fetchDados = async () => {
      try {
        setIsLoading(true);
        if (!currentCompany?.id) {
          setIsLoading(false);
          return;
        }

        // Verificar se o usuário tem acesso a esta empresa
        if (userData && userData.empresa_id && userData.empresa_id !== currentCompany.id) {
          toast({
            variant: "destructive",
            title: "Erro de permissão",
            description: "Você não tem permissão para acessar os dados desta empresa"
          });
          setIsLoading(false);
          return;
        }

        // Data atual e primeiro dia do mês
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const anoAnterior = anoAtual - 1;
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

        // Formato para o Supabase: YYYY-MM-DD
        const hojeFormatado = hoje.toISOString().split('T')[0];
        const inicioMesFormatado = inicioMes.toISOString().split('T')[0];
        const inicioMesAnteriorFormatado = inicioMesAnterior.toISOString().split('T')[0];
        const inicioAnoAtual = `${anoAtual}-01-01`;
        const fimAnoAtual = `${anoAtual}-12-31`;
        const inicioAnoAnterior = `${anoAnterior}-01-01`;
        const fimAnoAnterior = `${anoAnterior}-12-31`;

        // 1. Buscar contas correntes e seus saldos
        const { data: contasCorrentes, error: erroContasCorrentes } = await supabase
          .from('contas_correntes')
          .select('id, nome, saldo_inicial, status, considerar_saldo')
          .eq('empresa_id', currentCompany.id)
          .eq('status', 'ativo');

        if (erroContasCorrentes) throw erroContasCorrentes;

        // Contas com saldos iniciais
        const saldoContas = [];
        let totalSaldo = 0;

        if (contasCorrentes && contasCorrentes.length > 0) {
          // Para cada conta, buscar TODAS as movimentações ordenadas por data
          for (const conta of contasCorrentes) {
            const { data: movimentacoes, error: erroMovimentacoes } = await supabase
              .from('fluxo_caixa')
              .select('*')
              .eq('conta_corrente_id', conta.id)
              .eq('empresa_id', currentCompany.id)
              .order('data_movimentacao', { ascending: true });

            if (erroMovimentacoes) throw erroMovimentacoes;

            // Calcular o saldo como na página de fluxo de caixa
            let saldoAtual = Number(conta.saldo_inicial || 0);

            if (movimentacoes && movimentacoes.length > 0) {
              // Somar todas as movimentações ordenadas cronologicamente
              for (const mov of movimentacoes) {
                saldoAtual += Number(mov.valor);
              }
            }

            saldoContas.push({
              id: conta.id,
              nome: conta.nome,
              saldo: saldoAtual,
              considerar_saldo: conta.considerar_saldo
            });

            // Adicionar ao total APENAS se a conta deve ser considerada no saldo
            if (conta.considerar_saldo) {
              totalSaldo += saldoAtual;
            }
          }
        }
        
        
        // 1. Buscar total de vendas do mês atual
        const {
          data: vendas,
          error: erroVendas
        } = await supabase.from('orcamentos').select(`
            id,
            orcamentos_itens (valor)
          `).eq('empresa_id', currentCompany.id).eq('tipo', 'venda').eq('status', 'ativo').gte('data_venda', inicioMesFormatado);
        if (erroVendas) throw erroVendas;
        const totalVendas = vendas?.reduce((acc, orcamento) => {
          const valorOrcamento = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          return acc + valorOrcamento;
        }, 0) || 0;

        // Novo: Buscar todos os orçamentos do tipo "orcamento" (sem filtrar por data)
        const {
          data: orcamentos,
          error: erroOrcamentos
        } = await supabase.from('orcamentos').select(`
            id,
            orcamentos_itens (valor)
          `).eq('empresa_id', currentCompany.id).eq('tipo', 'orcamento').eq('status', 'ativo');
        if (erroOrcamentos) throw erroOrcamentos;
        const totalOrcamentos = orcamentos?.reduce((acc, orcamento) => {
          const valorOrcamento = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          return acc + valorOrcamento;
        }, 0) || 0;

        // 2. Buscar contas a receber em aberto
        const {
          data: contasReceber,
          error: erroContasReceber
        } = await supabase.from('movimentacoes_parcelas').select(`
            id,
            valor,
            data_vencimento,
            movimentacao:movimentacao_id(
              tipo_operacao,
              favorecido_id,
              empresa_id,
              descricao,
              numero_documento
            )
          `).is('data_pagamento', null).eq('movimentacao.tipo_operacao', 'receber').eq('movimentacao.empresa_id', currentCompany.id);
        if (erroContasReceber) throw erroContasReceber;
        
        // Corrigido: Verificar explicitamente o tipo_operacao antes de somar
        const totalContasReceber = contasReceber?.reduce((acc, conta) => {
          if (conta.movimentacao?.tipo_operacao === 'receber') {
            return acc + (Number(conta.valor) || 0);
          }
          return acc;
        }, 0) || 0;

        // Buscar parcelas em atraso e as que vencem hoje
        const parcelasEmAtraso: ContaReceber[] = [];
        const parcelasHoje: ContaReceber[] = [];

        // Buscar contas a pagar em aberto
        const {
          data: contasPagar,
          error: erroContasPagar
        } = await supabase.from('movimentacoes_parcelas').select(`
            id,
            valor,
            data_vencimento,
            movimentacao:movimentacao_id(
              tipo_operacao,
              favorecido_id,
              empresa_id,
              descricao,
              numero_documento
            )
          `).is('data_pagamento', null).eq('movimentacao.tipo_operacao', 'pagar').eq('movimentacao.empresa_id', currentCompany.id);
        if (erroContasPagar) throw erroContasPagar;

        // Calculando corretamente o total das contas a pagar
        const totalContasPagar = contasPagar?.reduce((acc, conta) => {
          // Verificando se é realmente uma conta a pagar
          if (conta.movimentacao?.tipo_operacao === 'pagar') {
            return acc + (Number(conta.valor) || 0);
          }
          return acc;
        }, 0) || 0;

        // Combinar contas a pagar e receber para processamento conjunto
        const todasParcelas = [...(contasReceber || []), ...(contasPagar || [])];

        if (todasParcelas.length > 0) {
          // Buscar IDs dos favorecidos únicos
          const favorecidoIds = todasParcelas
            .map(p => p.movimentacao?.favorecido_id)
            .filter(Boolean) as string[];

          // Buscar dados dos favorecidos
          const {
            data: favorecidos
          } = await supabase
            .from('favorecidos')
            .select('id, nome')
            .in('id', favorecidoIds);
          
          const favorecidosMap = new Map();
          if (favorecidos) {
            favorecidos.forEach(fav => favorecidosMap.set(fav.id, fav.nome));
          }

          // Separar parcelas em atraso e as que vencem hoje
          todasParcelas.forEach(parcela => {
            if (!parcela.movimentacao) return;
            
            const dataVencimento = parcela.data_vencimento;
            const dataHoje = hojeFormatado;
            
            const favorecidoNome = favorecidosMap.get(parcela.movimentacao.favorecido_id) || 'Desconhecido';
            
            const parcelaFormatada: ContaReceber = {
              id: parcela.id,
              cliente: favorecidoNome,
              descricao: parcela.movimentacao.descricao || 'Sem descrição',
              dataVencimento: dataVencimento,
              data_vencimento: dataVencimento,
              valor: Number(parcela.valor),
              status: 'em_aberto' as 'em_aberto',
              numeroParcela: parcela.movimentacao.numero_documento || '-',
              origem: 'Movimentação',
              tipo: parcela.movimentacao.tipo_operacao,
              movimentacao: parcela.movimentacao
            };

            // Comparar as strings de data diretamente
            if (dataVencimento < dataHoje) {
              parcelasEmAtraso.push(parcelaFormatada);
            } else if (dataVencimento === dataHoje) {
              parcelasHoje.push(parcelaFormatada);
            }
          });
        }
        
        // Buscar top 5 clientes para o ano atual - Alterado para incluir nome_fantasia
        const { data: vendasAnoAtual, error: erroVendasAnoAtual } = await supabase
          .from('orcamentos')
          .select(`
            favorecido_id,
            favorecido:favorecidos!inner(nome, nome_fantasia),
            orcamentos_itens(valor)
          `)
          .eq('empresa_id', currentCompany.id)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', inicioAnoAtual)
          .lte('data_venda', fimAnoAtual);
          
        if (erroVendasAnoAtual) throw erroVendasAnoAtual;
        
        // Buscar top 5 clientes para o ano anterior - Alterado para incluir nome_fantasia
        const { data: vendasAnoAnterior, error: erroVendasAnoAnterior } = await supabase
          .from('orcamentos')
          .select(`
            favorecido_id,
            favorecido:favorecidos!inner(nome, nome_fantasia),
            orcamentos_itens(valor)
          `)
          .eq('empresa_id', currentCompany.id)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', inicioAnoAnterior)
          .lte('data_venda', fimAnoAnterior);
          
        if (erroVendasAnoAnterior) throw erroVendasAnoAnterior;
        
        // Agregar dados por cliente para o ano atual - Alterado para incluir nome_fantasia
        const clientesAnoAtual: Record<string, TopCliente> = {};
        if (vendasAnoAtual) {
          vendasAnoAtual.forEach(venda => {
            if (!venda.favorecido_id) return;
            
            const valorTotal = venda.orcamentos_itens.reduce(
              (sum, item) => sum + (Number(item.valor) || 0), 0
            );
            
            if (!clientesAnoAtual[venda.favorecido_id]) {
              clientesAnoAtual[venda.favorecido_id] = {
                id: venda.favorecido_id,
                nome: venda.favorecido?.nome || 'Cliente não identificado',
                nomeFantasia: venda.favorecido?.nome_fantasia || '',
                totalVendas: 0
              };
            }
            
            clientesAnoAtual[venda.favorecido_id].totalVendas += valorTotal;
          });
        }
        
        // Agregar dados por cliente para o ano anterior - Alterado para incluir nome_fantasia
        const clientesAnoAnterior: Record<string, TopCliente> = {};
        if (vendasAnoAnterior) {
          vendasAnoAnterior.forEach(venda => {
            if (!venda.favorecido_id) return;
            
            const valorTotal = venda.orcamentos_itens.reduce(
              (sum, item) => sum + (Number(item.valor) || 0), 0
            );
            
            if (!clientesAnoAnterior[venda.favorecido_id]) {
              clientesAnoAnterior[venda.favorecido_id] = {
                id: venda.favorecido_id,
                nome: venda.favorecido?.nome || 'Cliente não identificado',
                nomeFantasia: venda.favorecido?.nome_fantasia || '',
                totalVendas: 0
              };
            }
            
            clientesAnoAnterior[venda.favorecido_id].totalVendas += valorTotal;
          });
        }
        
        // Obter top 5 clientes do ano atual
        const topClientesAnoAtual = Object.values(clientesAnoAtual)
          .sort((a, b) => b.totalVendas - a.totalVendas)
          .slice(0, 5);
        
        // Obter top 5 clientes do ano anterior
        const topClientesAnoAnterior = Object.values(clientesAnoAnterior)
          .sort((a, b) => b.totalVendas - a.totalVendas)
          .slice(0, 5);
          
        
        // 6. Buscar interações de leads pendentes com status "Aberto" e data igual ou anterior a hoje
        const dataLimiteInteracoes = new Date();
        dataLimiteInteracoes.setHours(23, 59, 59, 999); // Final do dia hoje
        
        // MODIFICAÇÃO: Buscar apenas interações com status "Aberto" e data igual ou anterior a hoje
        const {
          data: interacoes,
          error: erroInteracoes
        } = await supabase
          .from('leads_interacoes')
          .select('*')
          .eq('status', 'Aberto')
          .lte('data', hojeFormatado);
        
        if (erroInteracoes) throw erroInteracoes;

        // Precisamos buscar as informações dos leads separadamente
        let interacoesPendentes: LeadInteracao[] = [];
        
        if (interacoes && interacoes.length > 0) {
          // Filtrar apenas interações de leads da empresa atual e com status ativo
          const leadIds = [...new Set(interacoes.map(i => i.lead_id))];
          
          const { data: leadsInfo } = await supabase
            .from('leads')
            .select('id, nome, empresa, empresa_id, status')
            .in('id', leadIds)
            .eq('empresa_id', currentCompany.id)
            .eq('status', 'ativo'); // MODIFICAÇÃO: Apenas leads com status "ativo"
            
          // Criar um mapa para lookups rápidos
          const leadsMap = new Map();
          if (leadsInfo) {
            leadsInfo.forEach(lead => leadsMap.set(lead.id, lead));
          }
          
          // Buscar informações dos responsáveis
          const responsavelIds = [...new Set(interacoes.map(i => i.responsavel_id).filter(Boolean))];
          
          const { data: usuariosInfo } = await supabase
            .from('usuarios')
            .select('id, nome')
            .in('id', responsavelIds);
            
          const usuariosMap = new Map();
          if (usuariosInfo) {
            usuariosInfo.forEach(user => usuariosMap.set(user.id, user));
          }
          
          // Agora formatamos as interações apenas para leads da empresa atual e com status "ativo"
          interacoesPendentes = interacoes
            .filter(interacao => {
              const lead = leadsMap.get(interacao.lead_id);
              return lead && lead.empresa_id === currentCompany.id && lead.status === 'ativo';
            })
            .map(interacao => {
              const lead = leadsMap.get(interacao.lead_id);
              const responsavel = usuariosMap.get(interacao.responsavel_id);
              
              return {
                id: interacao.id,
                leadId: interacao.lead_id,
                tipo: interacao.tipo as any,
                descricao: interacao.descricao,
                data: interacao.data,
                responsavelId: interacao.responsavel_id,
                responsavelNome: responsavel?.nome || "Não atribuído",
                status: interacao.status,
                leadNome: lead?.nome || "Lead não encontrado",
                leadEmpresa: lead?.empresa || ""
              };
            });
        }

        // Atualizar o estado com todos os dados obtidos
        setDashboardData({
          totalVendas,
          totalOrcamentos,
          contasReceber: totalContasReceber,
          contasPagar: totalContasPagar,
          parcelasEmAtraso,
          parcelasHoje,
          saldoContas,
          totalSaldo,
          interacoesPendentes,
          topClientesAnoAtual,
          topClientesAnoAnterior
        });
        
        console.log("[Dashboard] Dados carregados com sucesso");
        setIsLoading(false);
      } catch (error: any) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: error.message || "Não foi possível carregar os dados do dashboard"
        });
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated && currentCompany?.id) {
      console.log("[Dashboard] Iniciando carregamento de dados");
      fetchDados();
    } else {
      console.log("[Dashboard] Aguardando autenticação ou empresa");
      setIsLoading(false);
    }
  }, [isInitialized, currentCompany?.id, isAuthenticated, userData, toast]);

  // Estado de loading combinado: carregando autenticação, empresa ou dashboard
  const showLoading = authLoading || companyLoading || (isInitialized && isLoading);

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da empresa {currentCompany?.nomeFantasia || currentCompany?.nome_fantasia || ""}
          </p>
        </div>
        <DashboardCardConfigurator pageId="dashboard" onConfigChange={handleConfigChange} />
      </div>
      
      {showLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Seção de alertas - renderizada se visível */}
          {isCardVisible('alertas') && (
            <div className="grid gap-6">
              <div className="col-span-1">
                <AlertsSection 
                  parcelasVencidas={dashboardData.parcelasEmAtraso}
                  parcelasHoje={dashboardData.parcelasHoje}
                  interacoesPendentes={dashboardData.interacoesPendentes}
                  isLoading={false}
                />
              </div>
            </div>
          )}

          {/* Grid de cards financeiros - renderiza apenas cards visíveis */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {isCardVisible('vendas-mes') && (
              <SalesDashboardCard 
                title="Vendas do Mês" 
                value={formatCurrency(dashboardData.totalVendas)} 
                description="Total do mês atual" 
                icon="money" 
              />
            )}
            {isCardVisible('total-orcamentos') && (
              <SalesDashboardCard 
                title="Total de Orçamentos" 
                value={formatCurrency(dashboardData.totalOrcamentos)} 
                description="Soma de todos os orçamentos ativos" 
                icon="chart" 
              />
            )}
            {isCardVisible('contas-pagar') && (
              <SalesDashboardCard 
                title="Contas a Pagar" 
                value={formatCurrency(dashboardData.contasPagar)} 
                description="Pagamentos pendentes" 
                icon="sales" 
              />
            )}
            {isCardVisible('contas-receber') && (
              <SalesDashboardCard 
                title="Contas a Receber" 
                value={formatCurrency(dashboardData.contasReceber)} 
                description={`${dashboardData.parcelasEmAtraso.filter(p => p.tipo === 'receber').length} título(s) em atraso`} 
                icon="users" 
              />
            )}
          </div>
          
          {/* Card para Saldo das Contas - renderizado se visível */}
          {isCardVisible('saldo-contas') && (
            <div>
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-500" /> 
                    Saldo das Contas
                  </CardTitle>
                  <CardDescription>
                    Saldo atual em contas correntes consideradas no cálculo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.saldoContas.length > 0 ? (
                    <div className="space-y-4">
                      {/* Total geral */}
                      <div className="flex items-center justify-between border-b pb-2">
                        <p className="font-semibold text-lg">Saldo Total</p>
                        <p className={`font-bold text-lg ${dashboardData.totalSaldo > 0 ? 'text-green-600' : dashboardData.totalSaldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {formatCurrency(dashboardData.totalSaldo)}
                        </p>
                      </div>
                      
                      {/* Lista de contas - Filtrar apenas as contas que devem ser consideradas no saldo */}
                      <div className="space-y-2">
                        {dashboardData.saldoContas
                          .filter(conta => conta.considerar_saldo)
                          .map(conta => (
                            <div key={conta.id} className="flex items-center justify-between">
                              <p className="text-gray-800">{conta.nome}</p>
                              <p className={`${conta.saldo > 0 ? 'text-green-600' : conta.saldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                {formatCurrency(conta.saldo)}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhuma conta corrente encontrada
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Card Top 5 Clientes - renderizado se visível */}
          {isCardVisible('top-clientes') && (
            <div className="grid gap-6 md:grid-cols-1">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BanknoteIcon className="h-5 w-5 text-blue-500" />
                    Top 5 Clientes
                  </CardTitle>
                  <CardDescription>
                    Clientes com maior valor de vendas em {new Date().getFullYear()} e {new Date().getFullYear() - 1}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2 pr-2 w-[25%]">Cliente</th>
                          <th className="text-right pb-2 pr-8 w-[25%]">{new Date().getFullYear()}</th>
                          <th className="text-left pb-2 pl-8 w-[25%]">Cliente</th>
                          <th className="text-right pb-2 w-[25%]">{new Date().getFullYear() - 1}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 font-medium pr-2">
                              {dashboardData.topClientesAnoAtual[index]?.nomeFantasia || 
                               dashboardData.topClientesAnoAtual[index]?.nome || "-"}
                            </td>
                            <td className="py-2 text-right pr-8">
                              {dashboardData.topClientesAnoAtual[index]
                                ? formatCurrency(dashboardData.topClientesAnoAtual[index].totalVendas)
                                : "-"}
                            </td>
                            <td className="py-2 font-medium pl-8 border-l">
                              {dashboardData.topClientesAnoAnterior[index]?.nomeFantasia || 
                               dashboardData.topClientesAnoAnterior[index]?.nome || "-"}
                            </td>
                            <td className="py-2 text-right">
                              {dashboardData.topClientesAnoAnterior[index]
                                ? formatCurrency(dashboardData.topClientesAnoAnterior[index].totalVendas)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>;
}

export default Dashboard;
