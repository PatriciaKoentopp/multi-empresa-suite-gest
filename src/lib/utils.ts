
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
  
  // Formatar a data preservando o dia exato sem ajuste de timezone
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Criar uma nova data com UTC para evitar ajustes de timezone
  const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  return format(utcDate, formatString);
}
