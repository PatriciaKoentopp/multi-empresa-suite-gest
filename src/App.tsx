
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { CompanyProvider } from './contexts/company-context';
import { MainLayout } from './components/layout/main-layout';
import { Toaster } from "sonner";

const LoginPage = lazy(() => import('./pages/login'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Relatorios = lazy(() => import('./pages/relatorios'));
const RelatorioFavorecido = lazy(() => import('./pages/relatorios/favorecido'));
const Favorecidos = lazy(() => import('./pages/cadastros/favorecidos'));
const ClassificacaoABC = lazy(() => import('./pages/relatorios/classificacao-abc'));
const Empresas = lazy(() => import('./pages/empresas'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
              <Route path="/relatorios/favorecido" element={<ProtectedRoute><RelatorioFavorecido /></ProtectedRoute>} />
              <Route path="/cadastros/favorecidos" element={<ProtectedRoute><Favorecidos /></ProtectedRoute>} />
              <Route path="/relatorios/classificacao-abc" element={<ProtectedRoute><ClassificacaoABC /></ProtectedRoute>} />
              <Route path="/admin/empresas" element={<ProtectedRoute><Empresas /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </Router>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
