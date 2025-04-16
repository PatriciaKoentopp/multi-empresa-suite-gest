
import { User } from "@/types";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // TODO: Implement actual login with Supabase
      // For now, using mock data
      const mockUser: User = {
        id: "1",
        email,
        name: "Usuário de Demonstração",
        role: "admin",
        companies: [
          {
            id: "1",
            razaoSocial: "Empresa Demonstração LTDA",
            nomeFantasia: "Demo ERP",
            cnpj: "00.000.000/0001-00",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ],
        currentCompanyId: "1",
      };
      
      setUser(mockUser);
      localStorage.setItem("erp-user", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // TODO: Implement actual logout with Supabase
      setUser(null);
      localStorage.removeItem("erp-user");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("erp-user", JSON.stringify(updatedUser));
  };

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("erp-user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
