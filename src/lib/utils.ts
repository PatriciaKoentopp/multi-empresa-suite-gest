
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para mesclar classes CSS, mantendo a original
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar datas sem considerar timezone
export function formatDate(date: Date | undefined | string, formatString = "dd/MM/yyyy"): string {
  if (!date) return "";
  
  let dateObj: Date;
  
  // Se for string, precisamos converter para Date
  if (typeof date === "string") {
    // Se a data estiver no formato ISO ou YYYY-MM-DD
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } 
    // Se for uma string ISO com data e hora
    else if (date.includes('T')) {
      const datePart = date.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } 
    // Qualquer outro formato de data
    else {
      const parts = date.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        dateObj = new Date(year, month, day);
      } else {
        dateObj = new Date(date);
      }
    }
  } 
  // Se já for um objeto Date
  else {
    dateObj = date;
  }
  
  // Formatar a data usando date-fns
  try {
    return format(dateObj, formatString, { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "";
  }
}

// Função para converter string DD/MM/YYYY para Date
export function parseDateString(dateString: string): Date | undefined {
  if (!dateString || typeof dateString !== 'string') return undefined;
  
  // Se já estiver no formato ISO YYYY-MM-DD
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Se estiver no formato DD/MM/YYYY
  if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // mês em JS é 0-indexed
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
    
    return new Date(year, month, day);
  }
  
  // Tentativa genérica de conversão
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
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
