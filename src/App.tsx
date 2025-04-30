
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Index } from "./pages/Index";
import { Login } from "./pages/login";
import { Dashboard } from "./pages/dashboard";
import { MainLayout } from "./components/layout/main-layout";
import { CompanyProvider } from "./contexts/company-context";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { NotFound } from "./pages/NotFound";
import { Toaster } from "./components/ui/sonner";
import StyleGuide from "./pages/style-guide";
import Empresas from "./pages/empresas";

// Admin
import Usuarios from "./pages/admin/usuarios";

// Cadastros
import GrupoFavorecidos from "./pages/cadastros/grupo-favorecidos";
import Favorecidos from "./pages/cadastros/favorecidos";
import Origens from "./pages/cadastros/origens";
import Profissoes from "./pages/cadastros/profissoes";
import MotivosPerdas from "./pages/cadastros/motivos-perda";
import ContaCorrente from "./pages/cadastros/conta-corrente";
import TiposTitulos from "./pages/cadastros/tipos-titulos";

// Financeiro
import FluxoCaixa from "./pages/financeiro/fluxo-caixa";
import ContasAPagar from "./pages/financeiro/contas-a-pagar";
import ContasAReceber from "./pages/financeiro/contas-a-receber";
import Movimentacao from "./pages/financeiro/movimentacao";
import IncluirMovimentacao from "./pages/financeiro/incluir-movimentacao";

// Contábil
import PlanoContas from "./pages/contabil/plano-contas";
import Lancamentos from "./pages/contabil/lancamentos";
import DRE from "./pages/contabil/dre";
import Balanco from "./pages/contabil/balanco";

// Vendas
import PainelVendas from "./pages/vendas/painel-vendas";
import Servicos from "./pages/vendas/servicos";
import TabelaPrecos from "./pages/vendas/tabela-precos";
import Orcamento from "./pages/vendas/orcamento";
import Faturamento from "./pages/vendas/faturamento";

// CRM
import FunilConfiguracao from "./pages/crm/funil-configuracao";
import Leads from "./pages/crm/leads";

// Relatórios
import Relatorios from "./pages/relatorios";
import RelatorioFavorecido from "./pages/relatorios/favorecido";

// Authentication wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/usuarios"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Usuarios />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/empresas"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Empresas />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Cadastros */}
            <Route
              path="/cadastros/grupo-favorecidos"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <GrupoFavorecidos />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/cadastros/favorecidos"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Favorecidos />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/cadastros/profissoes"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Profissoes />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/cadastros/origens"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Origens />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/cadastros/motivos-perda"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <MotivosPerdas />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/cadastros/conta-corrente"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ContaCorrente />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/cadastros/tipos-titulos"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <TiposTitulos />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Financeiro */}
            <Route
              path="/financeiro/fluxo-caixa"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <FluxoCaixa />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/financeiro/movimentacao"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Movimentacao />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/financeiro/incluir-movimentacao"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <IncluirMovimentacao />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/financeiro/contas-a-pagar"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ContasAPagar />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/financeiro/contas-receber"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ContasAReceber />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Contábil */}
            <Route
              path="/contabil/plano-contas"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <PlanoContas />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/contabil/lancamentos"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Lancamentos />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/contabil/dre"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <DRE />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/contabil/balanco"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Balanco />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Vendas */}
            <Route
              path="/vendas/painel-vendas"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <PainelVendas />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/vendas/servicos"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Servicos />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/vendas/tabela-precos"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <TabelaPrecos />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/vendas/orcamento"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Orcamento />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/vendas/faturamento"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Faturamento />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* CRM */}
            <Route
              path="/crm/funil-configuracao"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <FunilConfiguracao />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/crm/leads"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Leads />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Relatórios */}
            <Route
              path="/relatorios"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Relatorios />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/relatorios/favorecido"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <RelatorioFavorecido />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Style Guide */}
            <Route
              path="/style-guide"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <StyleGuide />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
