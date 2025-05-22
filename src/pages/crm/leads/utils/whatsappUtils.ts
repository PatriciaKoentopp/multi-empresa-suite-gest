
import { toast } from "sonner";

/**
 * Formata o número de telefone para o padrão internacional usado pelo WhatsApp
 */
export const formatarNumeroWhatsApp = (numero: string): string => {
  if (!numero) return '';
  
  // Remove todos os caracteres não numéricos
  const apenasNumeros = numero.replace(/\D/g, '');
  
  // Verifica se o número já começa com 55 (código do Brasil)
  if (apenasNumeros.startsWith('55') && apenasNumeros.length >= 12) {
    return apenasNumeros;
  }
  
  // Se começar com 0, remover
  const semZeroInicial = apenasNumeros.startsWith('0') 
    ? apenasNumeros.substring(1) 
    : apenasNumeros;
    
  // Se tiver 11 dígitos (com DDD), adicionar o código do Brasil (55)
  if (semZeroInicial.length >= 10) {
    return `55${semZeroInicial}`;
  }
  
  return semZeroInicial;
};

/**
 * Abre o WhatsApp com a mensagem pré-preenchida para o número especificado
 */
export const abrirWhatsApp = (telefone: string, mensagem: string): void => {
  const numeroFormatado = formatarNumeroWhatsApp(telefone);
  
  if (!numeroFormatado || numeroFormatado.length < 8) {
    console.error('Número de telefone inválido ou não fornecido');
    toast.error("Não foi possível abrir o WhatsApp", {
      description: "O telefone do contato não está disponível ou é inválido."
    });
    return;
  }
  
  // Codifica a mensagem para URL
  const mensagemCodificada = encodeURIComponent(mensagem);
  
  // Cria a URL do WhatsApp
  const whatsappUrl = `https://wa.me/${numeroFormatado}?text=${mensagemCodificada}`;
  
  // Abre em uma nova aba/janela
  window.open(whatsappUrl, '_blank');
  
  // Mostra um feedback para o usuário
  toast.success("WhatsApp aberto", {
    description: "Uma nova janela foi aberta para enviar a mensagem via WhatsApp."
  });
};
