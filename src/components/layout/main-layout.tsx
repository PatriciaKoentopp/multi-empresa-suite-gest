
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/contexts/auth-context";
import { Navigate } from "react-router-dom";
import { useCompany } from "@/contexts/company-context";
import { useEffect } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading: authLoading, userData } = useAuth();
  const { currentCompany, loading: companyLoading, refreshCompanies } = useCompany();
  
  // Verificar e carregar a empresa do usuário, se necessário
  useEffect(() => {
    if (userData?.empresa_id && !currentCompany) {
      console.log("[MainLayout] Carregando empresa do usuário:", userData.empresa_id);
      refreshCompanies();
    }
  }, [userData, currentCompany, refreshCompanies]);
  
  // Se loading de auth ou empresa, mostrar estado de carregamento
  if (authLoading || companyLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    console.log("[MainLayout] Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" replace />;
  }

  // Se o usuário estiver autenticado mas não tiver uma empresa carregada, continuar mostrando o carregamento
  if (isAuthenticated && userData?.empresa_id && !currentCompany) {
    console.log("[MainLayout] Aguardando carregamento da empresa...");
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
          <p className="text-sm text-muted-foreground">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  console.log("[MainLayout] Usuário autenticado, renderizando layout principal");
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          <p>ERP Multi-empresa © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
