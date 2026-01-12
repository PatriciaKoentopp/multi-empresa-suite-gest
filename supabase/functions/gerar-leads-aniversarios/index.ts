import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Receber user_id do body da requisição
    const { user_id } = await req.json().catch(() => ({}));
    console.log("User ID recebido:", user_id);

    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    console.log(`Executando geração de leads de aniversários - ${dia}/${mes}/${anoAtual}`);
    console.log(`Gerando leads de ${dia}/${mes}/${anoAtual} até 31/12/${anoAtual}`);

    // 1. Buscar todos os funis "Aniversários" ativos
    const { data: funis, error: funisError } = await supabase
      .from("funis")
      .select("id, empresa_id, nome")
      .ilike("nome", "%aniversário%")
      .eq("ativo", true);

    if (funisError) {
      console.error("Erro ao buscar funis:", funisError);
      throw funisError;
    }

    if (!funis || funis.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum funil de aniversários encontrado",
          leadsGerados: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontrados ${funis.length} funis de aniversários`);

    let totalLeadsCriados = 0;
    const resultados: Array<{
      funil: string;
      empresa_id: string;
      leadsGerados: number;
      aniversariantesEncontrados: number;
    }> = [];

    for (const funil of funis) {
      // 2. Buscar primeira etapa do funil
      const { data: etapas, error: etapasError } = await supabase
        .from("funil_etapas")
        .select("id")
        .eq("funil_id", funil.id)
        .order("ordem", { ascending: true })
        .limit(1);

      if (etapasError || !etapas || etapas.length === 0) {
        console.log(`Funil ${funil.nome} não tem etapas configuradas`);
        continue;
      }

      const primeiraEtapaId = etapas[0].id;

      // 3. Buscar a origem "Já é Cliente" para esta empresa
      const { data: origemJaCliente } = await supabase
        .from("origens")
        .select("id")
        .eq("empresa_id", funil.empresa_id)
        .ilike("nome", "Já é Cliente")
        .eq("status", "ativo")
        .limit(1)
        .single();

      const origemId = origemJaCliente?.id || null;
      console.log(`Origem "Já é Cliente" para empresa ${funil.empresa_id}:`, origemId);

      // 4. Buscar favorecidos ativos com data de aniversário
      const { data: favorecidos, error: favError } = await supabase
        .from("favorecidos")
        .select("id, nome, email, telefone, tipo, data_aniversario")
        .eq("empresa_id", funil.empresa_id)
        .eq("status", "ativo")
        .not("data_aniversario", "is", null);

      if (favError) {
        console.error(`Erro ao buscar favorecidos da empresa ${funil.empresa_id}:`, favError);
        continue;
      }

      if (!favorecidos || favorecidos.length === 0) {
        console.log(`Nenhum favorecido com data de aniversário na empresa ${funil.empresa_id}`);
        continue;
      }

      // 4. Filtrar aniversariantes de HOJE até 31/12 do ano atual
      const aniversariantesRestantes = favorecidos.filter((fav) => {
        if (!fav.data_aniversario) return false;
        
        const dataAniversario = new Date(fav.data_aniversario);
        const diaAniv = dataAniversario.getUTCDate();
        const mesAniv = dataAniversario.getUTCMonth() + 1;
        
        // Criar data de aniversário no ano atual para comparação
        const aniversarioEsteAno = new Date(anoAtual, mesAniv - 1, diaAniv);
        const hojeData = new Date(anoAtual, mes - 1, dia);
        hojeData.setHours(0, 0, 0, 0);
        aniversarioEsteAno.setHours(0, 0, 0, 0);
        
        // Incluir se aniversário for >= hoje
        return aniversarioEsteAno >= hojeData;
      });

      console.log(`Empresa ${funil.empresa_id}: ${aniversariantesRestantes.length} aniversariantes de hoje até 31/12`);

      let leadsGeradosNesteFunil = 0;

      // 5. Para cada aniversariante restante, verificar se já existe lead no ano atual
      for (const fav of aniversariantesRestantes) {
        const { data: leadsExistentes, error: leadsError } = await supabase
          .from("leads")
          .select("id")
          .eq("favorecido_id", fav.id)
          .eq("funil_id", funil.id)
          .gte("data_criacao", `${anoAtual}-01-01`)
          .lte("data_criacao", `${anoAtual}-12-31`);

        if (leadsError) {
          console.error(`Erro ao verificar leads existentes para ${fav.nome}:`, leadsError);
          continue;
        }

        if (leadsExistentes && leadsExistentes.length > 0) {
          console.log(`Lead já existe para ${fav.nome} no ano ${anoAtual}`);
          continue;
        }

        // Calcular a data de aniversário no ano atual
        const dataAniversario = new Date(fav.data_aniversario);
        const diaAniv = dataAniversario.getUTCDate();
        const mesAniv = dataAniversario.getUTCMonth() + 1;
        const dataAniversarioAnoAtual = `${anoAtual}-${mesAniv.toString().padStart(2, "0")}-${diaAniv.toString().padStart(2, "0")}`;

        // 7. Criar novo lead com data_aniversario, origem e responsável preenchidos
        const { data: novoLead, error: insertError } = await supabase
          .from("leads")
          .insert({
            empresa_id: funil.empresa_id,
            funil_id: funil.id,
            etapa_id: primeiraEtapaId,
            favorecido_id: fav.id,
            nome: fav.nome,
            email: fav.email,
            telefone: fav.telefone,
            status: "ativo",
            data_criacao: hoje.toISOString().split("T")[0],
            data_aniversario: dataAniversarioAnoAtual,
            origem_id: origemId,
            responsavel_id: user_id || null,
            observacoes: `🎂 Lead de aniversário gerado automaticamente - Aniversário: ${diaAniv.toString().padStart(2, "0")}/${mesAniv.toString().padStart(2, "0")}/${anoAtual}`,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Erro ao criar lead para ${fav.nome}:`, insertError);
          continue;
        }

        console.log(`Lead criado com sucesso para ${fav.nome} (aniversário: ${dataAniversarioAnoAtual})`);

        // 8. Criar interação automática para o lead
        if (novoLead) {
          const { error: interacaoError } = await supabase
            .from("leads_interacoes")
            .insert({
              lead_id: novoLead.id,
              tipo: "mensagem",
              descricao: "Parabenizar pelo aniversário",
              data: dataAniversarioAnoAtual,
              responsavel_id: user_id || null,
              status: "pendente"
            });

          if (interacaoError) {
            console.error(`Erro ao criar interação para ${fav.nome}:`, interacaoError);
          } else {
            console.log(`Interação criada para ${fav.nome} na data ${dataAniversarioAnoAtual}`);
          }
        }
        leadsGeradosNesteFunil++;
        totalLeadsCriados++;
      }

      resultados.push({
        funil: funil.nome,
        empresa_id: funil.empresa_id,
        leadsGerados: leadsGeradosNesteFunil,
        aniversariantesEncontrados: aniversariantesRestantes.length,
      });
    }

    console.log(`Total de leads criados: ${totalLeadsCriados}`);

    return new Response(
      JSON.stringify({
        success: true,
        leadsGerados: totalLeadsCriados,
        dataExecucao: hoje.toISOString(),
        periodo: `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}/${anoAtual} até 31/12/${anoAtual}`,
        detalhes: resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na execução:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
