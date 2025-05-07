import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AuthProvider } from './contexts/auth-context';
import { CompanyProvider } from './contexts/company-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from "@/components/ui/use-toast"

const LoginPage = lazy(() => import('./pages/login'));
const RegisterPage = lazy(() => import('./pages/register'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Faturamento = lazy(() => import('./pages/vendas/faturamento'));
const NovoOrcamento = lazy(() => import('./pages/vendas/novo-orcamento'));
const EditarOrcamento = lazy(() => import('./pages/vendas/editar-orcamento'));
const VisualizarOrcamento = lazy(() => import('./pages/vendas/visualizar-orcamento'));
const Relatorios = lazy(() => import('./pages/relatorios'));
const RelatorioFavorecido = lazy(() => import('./pages/relatorios/favorecido'));
const RelatorioVendas = lazy(() => import('./pages/relatorios/vendas'));
const RelatorioFinanceiro = lazy(() => import('./pages/relatorios/financeiro'));
const RelatorioGeral = lazy(() => import('./pages/relatorios/geral'));
const Favorecidos = lazy(() => import('./pages/cadastros/favorecidos'));
const NovoFavorecido = lazy(() => import('./pages/cadastros/novo-favorecido'));
const EditarFavorecido = lazy(() => import('./pages/cadastros/editar-favorecido'));
const Servicos = lazy(() => import('./pages/cadastros/servicos'));
const NovoServico = lazy(() => import('./pages/cadastros/novo-servico'));
const EditarServico = lazy(() => import('./pages/cadastros/editar-servico'));
const FluxoCaixa = lazy(() => import('./pages/financeiro/fluxo-caixa'));
const ContasCorrentes = lazy(() => import('./pages/financeiro/contas-correntes'));
const NovaContaCorrente = lazy(() => import('./pages/financeiro/nova-conta-corrente'));
const EditarContaCorrente = lazy(() => import('./pages/financeiro/editar-conta-corrente'));
const LeadsPage = lazy(() => import('./pages/crm/leads'));
const NovoLead = lazy(() => import('./pages/crm/leads/novo-lead'));
const EditarLead = lazy(() => import('./pages/crm/leads/editar-lead'));
const VisualizarLead = lazy(() => import('./pages/crm/leads/visualizar-lead'));
const UsuariosPage = lazy(() => import('./pages/usuarios'));
const NovoUsuario = lazy(() => import('./pages/usuarios/novo-usuario'));
const EditarUsuario = lazy(() => import('./pages/usuarios/editar-usuario'));
const TabelaPrecos = lazy(() => import('./pages/tabelas-de-preco'));
const NovaTabelaPreco = lazy(() => import('./pages/tabelas-de-preco/nova-tabela-preco'));
const EditarTabelaPreco = lazy(() => import('./pages/tabelas-de-preco/editar-tabela-preco'));
const ClassificacaoABC = lazy(() => import('./pages/relatorios/classificacao-abc'));
import { Toaster } from "@/components/ui/sonner";

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Aqui você implementaria a lógica de verificação de autenticação
  // Por enquanto, só retorna os children para permitir que a aplicação funcione
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="container mx-auto py-12 flex-grow">
              <Suspense fallback={<div>Carregando...</div>}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                  <Route path="/relatorios/favorecido" element={<ProtectedRoute><RelatorioFavorecido /></ProtectedRoute>} />
                  <Route path="/cadastros/favorecidos" element={<ProtectedRoute><Favorecidos /></ProtectedRoute>} />
                  <Route path="/relatorios/classificacao-abc" element={<ProtectedRoute><ClassificacaoABC /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </main>
            <SiteFooter />
          </div>
          <Toaster />
        </Router>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
