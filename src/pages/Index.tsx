
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useModulosParametros } from "@/hooks/useModulosParametros";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { isModuloAtivo } = useModulosParametros();

  useEffect(() => {
    // Verificação mais robusta para evitar redirecionamentos inadequados
    if (!isLoading) {
      if (isAuthenticated) {
        console.log("Usuário autenticado, verificando se dashboard está ativo");
        
        // Verificar se o dashboard está ativo nos parâmetros
        const dashboardAtivo = isModuloAtivo('dashboard');
        console.log("Dashboard ativo:", dashboardAtivo);
        
        if (dashboardAtivo) {
          console.log("Dashboard ativo, redirecionando para o dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          console.log("Dashboard inativo, verificando outras rotas disponíveis");
          // Se dashboard não estiver ativo, redirecionar para a primeira rota disponível
          // ou manter na página atual
          navigate("/admin/parametros", { replace: true });
        }
      } else {
        console.log("Usuário não autenticado, redirecionando para o login");
        navigate("/login", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, isModuloAtivo]);

  // Se estiver carregando, exibe um indicador de carregamento
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
        <p className="text-sm text-gray-600">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;
