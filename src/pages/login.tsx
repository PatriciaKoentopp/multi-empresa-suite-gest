
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigate } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState(""); // somente usado no registro
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false); // alterna entre login e registro
  const { login, isAuthenticated, register } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (isRegister && !nome)) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsLoading(true);
      if (isRegister) {
        await register(email, password, nome);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      if (isRegister) {
        setError("Erro ao registrar. " + (err.message || ""));
      } else {
        setError("Credenciais inválidas. Por favor, tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">ERP - MJPM</CardTitle>
            <CardDescription>
              {isRegister
                ? "Insira seus dados para criar sua conta de acesso"
                : "Entre com suas credenciais para acessar o sistema"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {!isRegister && (
                    <a
                      href="/esqueci-senha"
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? isRegister
                    ? "Registrando..."
                    : "Entrando..."
                  : isRegister
                  ? "Registrar"
                  : "Entrar"}
              </Button>
              <button
                type="button"
                className="text-sm text-primary hover:underline mt-2"
                onClick={() => {
                  setIsRegister((prev) => !prev);
                  setError(null);
                }}
                disabled={isLoading}
              >
                {isRegister
                  ? "Já tem uma conta? Entrar"
                  : "Não tem cadastro? Criar uma conta"}
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default Login;
