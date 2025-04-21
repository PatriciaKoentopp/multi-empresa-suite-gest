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
                <Route path="/admin/usuarios" element={<p className="p-4">Gerenciamento de Usuários</p>} />
                <Route path="/admin/permissoes" element={<p className="p-4">Gestão de Permissões</p>} />
                <Route path="/admin/parametros" element={<p className="p-4">Parâmetros do Sistema</p>} />
                
                {/* Cadastros routes */}
                <Route path="/cadastros/grupo-favorecidos" element={<GrupoFavorecidosPage />} />
                <Route path="/cadastros/favorecidos" element={<FavorecidosPage />} />
                <Route path="/cadastros/profissoes" element={<ProfissoesPage />} />
                <Route path="/cadastros/conta-corrente" element={<ContaCorrentePage />} />
                
                {/* Contábil routes */}
                <Route path="/contabil/plano-contas" element={<PlanoContasPage />} />
                
                {/* Style Guide */}
                <Route path="/style-guide" element={<StyleGuidePage />} />
                
                {/* Other module placeholders */}
                <Route path="/vendas/*" element={<p className="p-4">Módulo de Vendas</p>} />
                <Route path="/financeiro/*" element={<p className="p-4">Módulo Financeiro</p>} />
                <Route path="/crm/*" element={<p className="p-4">Módulo CRM</p>} />
                <Route path="/contabil/*" element={<p className="p-4">Módulo Contábil</p>} />
                <Route path="/relatorios/*" element={<p className="p-4">Relatórios e BI</p>} />
                
                {/* User routes */}
                <Route path="/perfil" element={<p className="p-4">Perfil do Usuário</p>} />
                <Route path="/configuracoes" element={<p className="p-4">Configurações</p>} />
                <Route path="/ajuda" element={<p className="p-4">Ajuda</p>} />
                 {/* Financeiro routes */}
                <Route path="/financeiro/incluir-movimentacao" element={<IncluirMovimentacaoModal />} />
                <Route path="/financeiro/contas-a-pagar" element={<ContasAPagarPage />} />
                {/* Corrigido: De /contas-a-receber para /contas-receber */}
                <Route path="/financeiro/contas-receber" element={<ContasAReceberPage />} />
                <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixaPage />} />
                
                {/* Vendas routes */}
                <Route path="/vendas/servicos" element={<ServicosPage />} />
                <Route path="/vendas/orcamento" element={<OrcamentoPage />} />
                {/* Nova página faturamento */}
                <Route path="/vendas/faturamento" element={<FaturamentoPage />} />
                <Route path="/vendas/tabela-precos" element={<TabelaPrecosPage />} />
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
