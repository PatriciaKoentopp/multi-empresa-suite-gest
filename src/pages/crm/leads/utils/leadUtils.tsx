
import React from 'react';
import { Mail, Phone, Calendar, MessageCircle, MessageSquare, Send } from 'lucide-react';

// Ícone para cada tipo de interação
export const getIconForInteraction = (tipo: string) => {
  switch (tipo) {
    case "email":
      return <Mail className="h-4 w-4" />;
    case "ligacao":
      return <Phone className="h-4 w-4" />;
    case "reuniao":
      return <Calendar className="h-4 w-4" />;
    case "mensagem":
      return <MessageCircle className="h-4 w-4" />;
    case "whatsapp":
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case "telegram":
      return <Send className="h-4 w-4 text-blue-500" />;
    case "instagram":
      return <MessageCircle className="h-4 w-4 text-pink-500" />;
    case "facebook":
      return <MessageCircle className="h-4 w-4 text-blue-600" />;
    default:
      return <MessageCircle className="h-4 w-4" />;
  }
};

// Função para formatar data no padrão DD/MM/YYYY
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  // Se for uma string já no formato DD/MM/YYYY, retornar como está
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }
  
  // Se for uma string no formato ISO (YYYY-MM-DD)
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [ano, mes, dia] = date.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  
  // Para datas em formato de objeto Date ou outras strings
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dia = String(dateObj.getDate()).padStart(2, '0');
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const ano = dateObj.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (e) {
    // Em caso de erro, retornar string vazia ou a string original
    return typeof date === 'string' ? date : '';
  }
};

// Função para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};
