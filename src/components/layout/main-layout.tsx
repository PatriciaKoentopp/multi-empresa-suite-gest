
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/contexts/auth-context";
import { Navigate } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Se loading, mostrar estado de carregamento
  if (isLoading) {
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
