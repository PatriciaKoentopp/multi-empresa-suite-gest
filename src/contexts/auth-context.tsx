
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { fetchCompanyById } = useCompany();

  // Função para buscar dados do usuário na tabela usuarios
  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setUserData(data as UserData);
        
        // Se o usuário tem uma empresa associada, carregamos essa empresa específica
        if (data.empresa_id) {
          fetchCompanyById(data.empresa_id);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);
      
      // Quando o estado de autenticação muda e temos um usuário, buscamos seus dados
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserData(null);
      }
    });

    // Verificação inicial da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);
      
      // Se já temos um usuário logado, buscamos seus dados
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
    setUser(data.user);
    setSession(data.session);
    
    // Após o login bem-sucedido, buscamos os dados do usuário
    if (data.user) {
      await fetchUserData(data.user.id);
    }
    
    setIsLoading(false);
  };

  // Novo: cadastra usuário no auth e insere na tabela usuarios
  const register = async (email: string, password: string, nome: string) => {
    setIsLoading(true);

    // Cria o usuário no auth
    const { error, data } = await supabase.auth.signUp({ email, password });

    if (error) {
      setIsLoading(false);
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
        setIsLoading(false);
        throw new Error(userDbError.message);
      }
    } else {
      setIsLoading(false);
      throw new Error("Erro ao criar usuário.");
    }

    setUser(data.user);
    setSession(data.session);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setUserData(null);
    setSession(null);
    setIsLoading(false);
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
