/**
 * Converte horas em formato decimal para HH:MM:SS
 * @param decimal - Número de horas em decimal (ex: 5.54 = 5h32m24s)
 * @returns String no formato HH:MM:SS
 */
export const decimalToHHMMSS = (decimal: number): string => {
  const hours = Math.floor(decimal);
  const minutes = Math.floor((decimal - hours) * 60);
  const seconds = Math.round(((decimal - hours) * 60 - minutes) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Converte horas em formato HH:MM:SS para decimal
 * @param hhmmss - String no formato HH:MM:SS
 * @returns Número de horas em decimal
 */
export const hhmmssToDecimal = (hhmmss: string): number => {
  const [hours, minutes, seconds] = hhmmss.split(':').map(Number);
  return hours + (minutes / 60) + (seconds / 3600);
};

/**
 * Formata horas para exibição combinada (decimal e HH:MM)
 * @param decimal - Número de horas em decimal
 * @returns String formatada "XXXh (HH:MM)"
 */
export const formatHoursDisplay = (decimal: number): string => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${decimal.toFixed(2)}h (${hours}h${minutes}m)`;
};

/**
 * Extrai o número do projeto antes do separador "-"
 * @param projectName - Nome completo do projeto (ex: "50 - Sperka e Valentini Advogados")
 * @returns Número do projeto (ex: "50")
 */
export const extractProjectNumber = (projectName: string): string => {
  const match = projectName.match(/^(\d+)\s*-/);
  return match ? match[1] : projectName;
};

/**
 * Converte número serial do Excel para data formatada dd/mm/yyyy
 * @param serial - Número serial do Excel (dias desde 01/01/1900)
 * @returns String no formato dd/mm/yyyy
 */
export const excelSerialToDate = (serial: number | string): string => {
  // Se já for uma string no formato dd/mm/yyyy, retorna direto
  if (typeof serial === 'string' && serial.includes('/')) {
    return serial;
  }
  
  // Converte número serial do Excel para data
  const excelEpoch = new Date(1899, 11, 30); // Excel conta a partir de 30/12/1899
  const days = typeof serial === 'string' ? parseFloat(serial) : serial;
  const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};
