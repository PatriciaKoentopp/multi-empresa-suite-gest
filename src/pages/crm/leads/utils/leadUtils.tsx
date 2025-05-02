
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

// Função para formatar data
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  if (typeof date === 'string') {
    // Se já estiver no formato DD/MM/YYYY, retornar como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
    
    // Converter string para objeto Date
    const dateObj = new Date(date);
    return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
  } else {
    // Se for um objeto Date
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
};
