
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { useCompany } from "./company-context";

interface UserData {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  status: string;
  vendedor: string;
  empresa_id: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  userData: UserData | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, nome: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

// Função auxiliar para limpar o estado de autenticação
const cleanupAuthState = () => {
  // Remove tokens padrão
  localStorage.removeItem('supabase.auth.token');
  
  // Remove todas as chaves do Supabase relacionadas à autenticação no localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { fetchCompanyById } = useCompany();

  // Função para buscar dados do usuário na tabela usuarios
  const fetchUserData = async (userId: string) => {
    try {
      console.log("[AuthContext] Buscando dados do usuário:", userId);
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[AuthContext] Erro ao buscar dados do usuário:", error);
        throw error;
      }
      
      if (data) {
        console.log("[AuthContext] Dados do usuário encontrados:", data);
        setUserData(data as UserData);
        
        // Se o usuário tem uma empresa associada, carregamos essa empresa específica
        if (data.empresa_id) {
          console.log("[AuthContext] Carregando empresa do usuário:", data.empresa_id);
          fetchCompanyById(data.empresa_id);
        }
      } else {
        console.log("[AuthContext] Nenhum dado de usuário encontrado");
      }
    } catch (error) {
      console.error("[AuthContext] Erro ao buscar dados do usuário:", error);
    }
  };

  useEffect(() => {
    // Configurar listener de mudança de estado de autenticação primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthContext] Evento de autenticação:", event);
      
      setUser(session?.user ?? null);
      setSession(session ?? null);
      
      // Quando o estado de autenticação muda e temos um usuário, buscamos seus dados
      if (session?.user) {
        // Usar setTimeout para evitar potenciais problemas de deadlock
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setUserData(null);
      }
    });

    // Em seguida, verificar se já existe uma sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthContext] Verificação inicial de sessão:", !!session);
      
      setUser(session?.user ?? null);
      setSession(session ?? null);
      
      // Se já temos um usuário logado, buscamos seus dados
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Limpar qualquer estado de autenticação existente
      cleanupAuthState();
      
      // Tentar fazer logout global para garantir
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        // Ignorar erros no logout, apenas garantir que tentamos
        console.log("[AuthContext] Erro ao fazer logout global antes do login:", e);
      }
      
      // Fazer login
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("[AuthContext] Erro no login:", error);
        throw new Error(error.message);
      }
      
      console.log("[AuthContext] Login bem-sucedido:", !!data.user);
      setUser(data.user);
      setSession(data.session);
      
      // Após o login bem-sucedido, buscamos os dados do usuário
      if (data.user) {
        await fetchUserData(data.user.id);
      }
    } catch (error: any) {
      console.error("[AuthContext] Erro no processo de login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Novo: cadastra usuário no auth e insere na tabela usuarios
  const register = async (email: string, password: string, nome: string) => {
    setIsLoading(true);

    try {
      // Limpar qualquer estado de autenticação existente
      cleanupAuthState();
      
      // Cria o usuário no auth
      const { error, data } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw new Error(error.message);
      }

      // Cria o registro na tabela usuarios (campos mínimos obrigatórios)
      const id = data.user?.id;
      if (id) {
        const { error: userDbError } = await supabase
          .from("usuarios")
          .insert([
            {
              id,
              nome,
              email,
              status: "ativo",
              tipo: "Administrador",
              vendedor: "nao",
              empresa_id: null // O administrador deve vincular o usuário a uma empresa posteriormente
            }
          ]);
        if (userDbError) {
          throw new Error(userDbError.message);
        }
      } else {
        throw new Error("Erro ao criar usuário.");
      }

      setUser(data.user);
      setSession(data.session);
    } catch (error: any) {
      console.error("[AuthContext] Erro no registro:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      console.log("[AuthContext] Iniciando logout");
      
      // Limpar estado de autenticação primeiro
      cleanupAuthState();
      
      // Tentar fazer logout global
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error("[AuthContext] Erro no logout:", error);
        throw error;
      }
      
      console.log("[AuthContext] Logout bem-sucedido");
      
      // Limpar estados
      setUser(null);
      setUserData(null);
      setSession(null);
      
      // Forçar recarregamento da página para limpar completamente o estado
      window.location.href = '/login';
    } catch (error) {
      console.error("[AuthContext] Erro no processo de logout:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
