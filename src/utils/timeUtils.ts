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
