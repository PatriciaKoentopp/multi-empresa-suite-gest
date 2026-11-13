/**
 * O Supabase devolve no máximo 1.000 linhas por consulta. Use esta função em
 * listagens/relatórios que podem passar desse limite: ela busca em lotes até
 * trazer tudo. A fábrica deve recriar a consulta a cada chamada.
 */
const PAGE_SIZE = 1000;

export async function fetchAll<T = any>(
  build: () => any,
  options: { orderById?: boolean } = {},
): Promise<{ data: T[]; error: any }> {
  const { orderById = true } = options;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let q = build();
    if (orderById) q = q.order("id", { ascending: true });
    const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error };
    const rows = (data || []) as T[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return { data: all, error: null };
}
