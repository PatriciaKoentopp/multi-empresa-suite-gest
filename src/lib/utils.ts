
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para mesclar classes CSS, mantendo a original
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar datas sem considerar timezone
export function formatDate(date: Date | undefined, formatString = "dd/MM/yyyy"): string {
  if (!date) return "";
  return format(date, formatString);
}
