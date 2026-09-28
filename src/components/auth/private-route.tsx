import React from "react";
import { Navigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/auth-context";

// Authentication wrapper (moved from src/App.tsx during the TanStack Start migration)
interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};
