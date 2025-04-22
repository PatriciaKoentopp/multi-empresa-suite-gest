
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userNavigation } from "@/config/navigation";
import { LogOutIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Função auxiliar para obter o nome do usuário da tabela usuarios
async function fetchUsuarioNome(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("nome")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data.nome || null;
}

export function UserNav() {
  const { user, logout } = useAuth();
  const [nome, setNome] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUsuarioNome(user.id).then((res) => {
        setNome(res);
      });
    }
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  // Utiliza o nome (da tabela usuarios) se existir, senão fallback para o email
  const displayName = nome || user.email || "Usuário";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {userNavigation.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link to={item.href}>{item.name}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Sair</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
