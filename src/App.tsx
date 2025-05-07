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

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <ToastProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <SiteHeader />
              <main className="container mx-auto py-12 flex-grow">
                <Suspense fallback={<div>Carregando...</div>}>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/vendas/faturamento" element={<ProtectedRoute><Faturamento /></ProtectedRoute>} />
                    <Route path="/vendas/novo-orcamento" element={<ProtectedRoute><NovoOrcamento /></ProtectedRoute>} />
                    <Route path="/vendas/editar-orcamento/:id" element={<ProtectedRoute><EditarOrcamento /></ProtectedRoute>} />
                    <Route path="/vendas/visualizar-orcamento/:id" element={<ProtectedRoute><VisualizarOrcamento /></ProtectedRoute>} />
                    <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                    <Route path="/relatorios/favorecido" element={<ProtectedRoute><RelatorioFavorecido /></ProtectedRoute>} />
                    <Route path="/relatorios/vendas" element={<ProtectedRoute><RelatorioVendas /></ProtectedRoute>} />
                    <Route path="/relatorios/financeiro" element={<ProtectedRoute><RelatorioFinanceiro /></ProtectedRoute>} />
                    <Route path="/relatorios/geral" element={<ProtectedRoute><RelatorioGeral /></ProtectedRoute>} />
                    <Route path="/cadastros/favorecidos" element={<ProtectedRoute><Favorecidos /></ProtectedRoute>} />
                    <Route path="/cadastros/novo-favorecido" element={<ProtectedRoute><NovoFavorecido /></ProtectedRoute>} />
                    <Route path="/cadastros/editar-favorecido/:id" element={<ProtectedRoute><EditarFavorecido /></ProtectedRoute>} />
                    <Route path="/cadastros/servicos" element={<ProtectedRoute><Servicos /></ProtectedRoute>} />
                    <Route path="/cadastros/novo-servico" element={<ProtectedRoute><NovoServico /></ProtectedRoute>} />
                    <Route path="/cadastros/editar-servico/:id" element={<ProtectedRoute><EditarServico /></ProtectedRoute>} />
                    <Route path="/financeiro/fluxo-caixa" element={<ProtectedRoute><FluxoCaixa /></ProtectedRoute>} />
                    <Route path="/financeiro/contas-correntes" element={<ProtectedRoute><ContasCorrentes /></ProtectedRoute>} />
                    <Route path="/financeiro/nova-conta-corrente" element={<ProtectedRoute><NovaContaCorrente /></ProtectedRoute>} />
                    <Route path="/financeiro/editar-conta-corrente/:id" element={<ProtectedRoute><EditarContaCorrente /></ProtectedRoute>} />
                    <Route path="/crm/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
                    <Route path="/crm/leads/novo-lead" element={<ProtectedRoute><NovoLead /></ProtectedRoute>} />
                    <Route path="/crm/leads/editar-lead/:id" element={<ProtectedRoute><EditarLead /></ProtectedRoute>} />
                    <Route path="/crm/leads/visualizar-lead/:id" element={<ProtectedRoute><VisualizarLead /></ProtectedRoute>} />
                    <Route path="/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
                    <Route path="/usuarios/novo-usuario" element={<ProtectedRoute><NovoUsuario /></ProtectedRoute>} />
                    <Route path="/usuarios/editar-usuario/:id" element={<ProtectedRoute><EditarUsuario /></ProtectedRoute>} />
                    <Route path="/tabelas-de-preco" element={<ProtectedRoute><TabelaPrecos /></ProtectedRoute>} />
                    <Route path="/tabelas-de-preco/nova-tabela-preco" element={<ProtectedRoute><NovaTabelaPreco /></ProtectedRoute>} />
                    <Route path="/tabelas-de-preco/editar-tabela-preco/:id" element={<ProtectedRoute><EditarTabelaPreco /></ProtectedRoute>} />
                    <Route path="/relatorios/classificacao-abc" element={<ProtectedRoute><React.Suspense fallback={<div>Carregando...</div>}><ClassificacaoABC /></React.Suspense></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </main>
              <SiteFooter />
            </div>
          </Router>
        </ToastProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
