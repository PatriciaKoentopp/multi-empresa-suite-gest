
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: SupabaseUser | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);
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
            vendedor: "nao"
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
    setSession(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
