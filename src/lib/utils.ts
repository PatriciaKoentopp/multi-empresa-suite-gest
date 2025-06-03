
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Função para mesclar classes CSS, mantendo a original
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar datas sem considerar timezone, mantendo o formato original
export function formatDate(date: Date | undefined | string | null, formatString = "dd/MM/yyyy"): string {
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
    // Para objetos Date, extrair componentes e formatar manualmente sem depender do timezone
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

// Função para converter string DD/MM/YYYY para Date - CORRIGIDA para evitar problemas de timezone
export function parseDateString(dateString: string | Date): Date | undefined {
  if (!dateString) return undefined;
  
  // Se já for um objeto Date, retorna ele mesmo
  if (dateString instanceof Date) return dateString;
  
  // Se for string no formato ISO YYYY-MM-DD
  if (typeof dateString === 'string') {
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // Cria uma data preservando dia/mês/ano sem ajuste de timezone
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }
    
    // Se estiver no formato DD/MM/YYYY
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateString.split('/').map(Number);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
      
      // Cria uma data preservando dia/mês/ano sem ajuste de timezone
      // Definir hora para meio-dia para evitar problemas de DST
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }
  }
  
  // Tentativa genérica de conversão
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return undefined;
    
    // Extrai os componentes e cria uma nova data sem depender de timezone
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    return new Date(year, month, day, 12, 0, 0, 0);
  } catch (error) {
    console.error("Erro ao converter data:", error);
    return undefined;
  }
}

// Função para converter Date para formato YYYY-MM-DD para banco de dados - CORRIGIDA
export function dateToISOString(date: Date | undefined | null): string | null {
  if (!date) return null;
  
  // Usar getFullYear, getMonth e getDate para evitar problemas de timezone
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
