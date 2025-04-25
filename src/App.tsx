
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { CompanyProvider } from "./contexts/company-context";
import { MainLayout } from "./components/layout/main-layout";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import NotFound from "./pages/NotFound";
import EmpresasPage from "./pages/empresas";
import GrupoFavorecidosPage from "./pages/cadastros/grupo-favorecidos";
import FavorecidosPage from "./pages/cadastros/favorecidos";
import ProfissoesPage from "./pages/cadastros/profissoes";
import OrigensPage from "./pages/cadastros/origens";
import MotivosPerdaPage from "./pages/cadastros/motivos-perda";
import PlanoContasPage from "./pages/contabil/plano-contas";
import ContaCorrentePage from "./pages/cadastros/conta-corrente";
import StyleGuidePage from "./pages/style-guide";
import IncluirMovimentacaoModal from "./pages/financeiro/incluir-movimentacao";
import ContasAPagarPage from "./pages/financeiro/contas-a-pagar";
import FluxoCaixaPage from "./pages/financeiro/fluxo-caixa";
import ServicosPage from "./pages/vendas/servicos";
import OrcamentoPage from "./pages/vendas/orcamento";
import FaturamentoPage from "./pages/vendas/faturamento";
import ContasAReceberPage from "./pages/financeiro/contas-a-receber";
import TabelaPrecosPage from "./pages/vendas/tabela-precos";
import UsuariosPage from "./pages/admin/usuarios";
import FunilConfiguracaoPage from "./pages/crm/funil-configuracao";
import LeadsPage from "./pages/crm/leads";
import LancamentosPage from "./pages/contabil/lancamentos";
import DrePage from "./pages/contabil/dre";
import BalancoPage from "./pages/contabil/balanco";
import TiposTitulosPage from "./pages/cadastros/tipos-titulos";
import MovimentacaoPage from "./pages/financeiro/movimentacao";
import PainelVendasPage from "./pages/vendas/painel-vendas"; // Importando a nova página

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect from root to dashboard or login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Admin routes */}
                <Route path="/admin/empresas" element={<EmpresasPage />} />
                <Route path="/admin/usuarios" element={<UsuariosPage />} />
                <Route path="/admin/permissoes" element={<p className="p-4">Gestão de Permissões</p>} />
                <Route path="/admin/parametros" element={<p className="p-4">Parâmetros do Sistema</p>} />
                
                {/* Cadastros routes */}
                <Route path="/cadastros/grupo-favorecidos" element={<GrupoFavorecidosPage />} />
                <Route path="/cadastros/favorecidos" element={<FavorecidosPage />} />
                <Route path="/cadastros/profissoes" element={<ProfissoesPage />} />
                <Route path="/cadastros/origens" element={<OrigensPage />} />
                <Route path="/cadastros/motivos-perda" element={<MotivosPerdaPage />} />
                <Route path="/cadastros/conta-corrente" element={<ContaCorrentePage />} />
                <Route path="/cadastros/tipos-titulos" element={<TiposTitulosPage />} /> 
                
                {/* Contábil routes */}
                <Route path="/contabil/plano-contas" element={<PlanoContasPage />} />
                <Route path="/contabil/lancamentos" element={<LancamentosPage />} />
                <Route path="/contabil/dre" element={<DrePage />} />
                <Route path="/contabil/balanco" element={<BalancoPage />} />
                
                {/* Style Guide */}
                <Route path="/style-guide" element={<StyleGuidePage />} />
                
                {/* Vendas routes */}
                <Route path="/vendas/painel-vendas" element={<PainelVendasPage />} /> {/* Nova rota para o painel de vendas */}
                <Route path="/vendas/servicos" element={<ServicosPage />} />
                <Route path="/vendas/orcamento" element={<OrcamentoPage />} />
                <Route path="/vendas/faturamento" element={<FaturamentoPage />} />
                <Route path="/vendas/tabela-precos" element={<TabelaPrecosPage />} />
                
                {/* Financeiro routes */}
                <Route path="/financeiro/incluir-movimentacao" element={<IncluirMovimentacaoModal />} />
                <Route path="/financeiro/contas-a-pagar" element={<ContasAPagarPage />} />
                <Route path="/financeiro/movimentacao" element={<MovimentacaoPage />} />
                <Route path="/financeiro/contas-receber" element={<ContasAReceberPage />} />
                <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixaPage />} />
                
                {/* CRM routes */}
                <Route path="/crm/funil-configuracao" element={<FunilConfiguracaoPage />} />
                <Route path="/crm/leads" element={<LeadsPage />} />
                <Route path="/crm/marketing" element={<p className="p-4">Campanhas e automações</p>} />
                
                {/* User routes */}
                <Route path="/perfil" element={<p className="p-4">Perfil do Usuário</p>} />
                <Route path="/configuracoes" element={<p className="p-4">Configurações</p>} />
                <Route path="/ajuda" element={<p className="p-4">Ajuda</p>} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CompanyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
