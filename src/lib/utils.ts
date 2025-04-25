
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para mesclar classes CSS, mantendo a original
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar datas sem considerar timezone
export function formatDate(date: Date | undefined | string, formatString = "dd/MM/yyyy"): string {
  if (!date) return "";
  
  // Se for uma string no formato ISO ou YYYY-MM-DD, convertemos para Date
  let dateObj: Date;
  if (typeof date === "string") {
    // Trata datas no formato YYYY-MM-DD diretamente
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      // Usando UTC para preservar o dia exato
      dateObj = new Date(Date.UTC(year, month - 1, day));
    } else {
      // Qualquer outro formato de string de data
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Extrair componentes de data sem considerar timezone
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  
  // Criar uma nova data com UTC para evitar ajustes de timezone
  const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  return format(utcDate, formatString, { locale: ptBR });
}

// Função para converter string DD/MM/YYYY para Date sem ajuste de timezone
export function parseDateString(dateString: string): Date | undefined {
  if (!dateString || dateString.length !== 10) return undefined;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return undefined;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // mês em JS é 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
  
  // Criar data em UTC para preservar o dia exato
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

// Função para converter Date para formato YYYY-MM-DD para banco de dados
export function dateToISOString(date: Date | undefined): string | null {
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Função para formatação de valores monetários
export function formatCurrency(valor?: number): string {
  if (valor === undefined || valor === null) return "-";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
