const UFS: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
  "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA",
  paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

/** Converte nome completo do estado para a sigla (UF); mantém siglas em maiúsculas. */
export function toUF(valor: string | null | undefined): string {
  const v = (valor || "").trim();
  if (v.length <= 2) return v.toUpperCase();
  const chave = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return UFS[chave] || v.slice(0, 2).toUpperCase();
}
