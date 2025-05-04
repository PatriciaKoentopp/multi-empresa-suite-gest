
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Função para mesclar classes CSS, mantendo a original
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar datas sem considerar timezone, mantendo o formato original
export function formatDate(date: Date | undefined | string, formatString = "dd/MM/yyyy"): string {
  if (!date) return "";
  
  // Se for string no formato ISO YYYY-MM-DD
  if (typeof date === "string") {
    // Caso seja apenas data: YYYY-MM-DD
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Caso seja ISO com tempo: YYYY-MM-DDThh:mm:ss
    if (date.includes('T')) {
      const dataPart = date.split('T')[0];
      const [year, month, day] = dataPart.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Se já estiver no formato DD/MM/YYYY, retorne como está
    if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return date;
    }
  }
  
  try {
    // Para objetos Date, extrair componentes e formatar manualmente
    if (date instanceof Date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Último recurso: tentar criar um Date e formatar manualmente
    const dateObj = new Date(date as any);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return String(date);
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
