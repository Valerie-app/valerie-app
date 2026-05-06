import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL não definida.");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida.");

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const val = await req.json();

    if (!val.codigo_val || !val.caminho_dropbox) {
      return Response.json(
        {
          sucesso: false,
          erro: "Faltam codigo_val ou caminho_dropbox.",
        },
        { status: 400 }
      );
    }

    const anoAtual = new Date().getFullYear();

    const match = String(val.codigo_val).match(/^VAL(\d{3})\.(\d{2})$/i);
    const numeroSequencial = match ? Number(match[1]) : 0;
    const ano = match ? Number(`20${match[2]}`) : anoAtual;

    const estadoDropbox =
      val.estado_dropbox === "encomenda" ? "encomenda" : "orcamento";

    const estadoProcesso =
      estadoDropbox === "encomenda" ? "Validado" : "Orçamento Enviado";

    const nomeObra =
      val.nome_obra || val.nome_pasta || val.codigo_val || "Sem nome";

    const nomeCliente = val.nome_cliente || "Cliente não definido";

    const projetoPayload = {
      ano,
      numero_sequencial: numeroSequencial,
      codigo_val: val.codigo_val,
      nome_empresa: nomeObra,
      nome_cliente: nomeCliente,
      nome_pasta_dropbox: val.nome_pasta || val.codigo_val,
      caminho_dropbox: val.caminho_dropbox,
      estado: estadoDropbox,
    };

    const { error: projetoError } = await supabase
      .from("projetos")
      .upsert(projetoPayload, { onConflict: "codigo_val" });

    if (projetoError) {
      return Response.json({
        sucesso: false,
        etapa: "projetos",
        erro: projetoError.message,
      });
    }

    const processoPayload = {
      nome_cliente: nomeCliente,
      nome_obra: nomeObra,
      estado: estadoProcesso,
      codigo_val: val.codigo_val,
      caminho_dropbox: val.caminho_dropbox,
      estado_dropbox: estadoDropbox,
      lote_atual: 1,
      calendario_arquivado: false,
    };

    const { data: existente, error: buscaError } = await supabase
      .from("processos")
      .select("id")
      .eq("codigo_val", val.codigo_val)
      .maybeSingle<{ id: string }>();

    if (buscaError) {
      return Response.json({
        sucesso: false,
        etapa: "buscar_processo",
        erro: buscaError.message,
      });
    }

    if (existente?.id) {
      const { error: updateError } = await supabase
        .from("processos")
        .update(processoPayload)
        .eq("id", existente.id);

      if (updateError) {
        return Response.json({
          sucesso: false,
          etapa: "atualizar_processo",
          erro: updateError.message,
        });
      }

      return Response.json({
        sucesso: true,
        acao: "atualizado",
        processo_id: existente.id,
      });
    }

    const { data: novoProcesso, error: insertError } = await supabase
      .from("processos")
      .insert(processoPayload)
      .select("id")
      .single<{ id: string }>();

    if (insertError) {
      return Response.json({
        sucesso: false,
        etapa: "criar_processo",
        erro: insertError.message,
      });
    }

    return Response.json({
      sucesso: true,
      acao: "criado",
      processo_id: novoProcesso?.id,
    });
  } catch (err: any) {
    return Response.json(
      {
        sucesso: false,
        etapa: "erro_geral",
        erro: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}