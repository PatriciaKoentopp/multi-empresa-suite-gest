import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// Envia o token do usuário logado para as funções de servidor protegidas.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
