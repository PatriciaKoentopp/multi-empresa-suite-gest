
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
                <Route path="/admin/empresas/nova" element={<EmpresasPage />} />
                <Route path="/admin/usuarios" element={<p className="p-4">Gerenciamento de Usuários</p>} />
                <Route path="/admin/permissoes" element={<p className="p-4">Gestão de Permissões</p>} />
                <Route path="/admin/parametros" element={<p className="p-4">Parâmetros do Sistema</p>} />
                
                {/* Cadastros routes */}
                <Route path="/cadastros/clientes" element={<p className="p-4">Cadastro de Clientes</p>} />
                <Route path="/cadastros/fornecedores" element={<p className="p-4">Cadastro de Fornecedores</p>} />
                <Route path="/cadastros/funcionarios" element={<p className="p-4">Cadastro de Funcionários</p>} />
                <Route path="/cadastros/parceiros" element={<p className="p-4">Cadastro de Parceiros</p>} />
                
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
