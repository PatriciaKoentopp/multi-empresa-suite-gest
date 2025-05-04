
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Verificação mais robusta para evitar redirecionamentos inadequados
    if (!isLoading) {
      if (isAuthenticated) {
        console.log("Usuário autenticado, redirecionando para o dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        console.log("Usuário não autenticado, redirecionando para o login");
        navigate("/login", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

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
