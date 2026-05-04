import { createClient } from "@supabase/supabase-js";
import { calcularPrazoProcesso, type RegraPrazo } from "@/lib/prazos";

type Extra = {
  nome?: string;
  quantidade?: string | number;
};

type ArtigoPedido = {
  tipo?: string;
  nome?: string;
  resumo?: string;
  dados?: {
    largura?: string | number;
    altura?: string | number;
    profundidade?: string | number;
    material?: string;
    acabamento?: string;
    extras?: Extra[];
    outrosAcessorios?: string;
    [key: string]: any;
  };
  largura?: string | number;
  altura?: string | number;
  profundidade?: string | number;
  material?: string;
  extras?: Extra[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const criarProjetoDropboxUrl =
  "https://sjqvbfaknsaldhxhgys.supabase.co/functions/v1/criar-projeto-dropbox";

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL não definida.");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida.");

const supabase = createClient(supabaseUrl, serviceRoleKey);

function numeroSeguro(valor: unknown) {
  const numero = Number(String(valor ?? "0").replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

function converterParaMetros(valor: number) {
  if (valor > 20) return valor / 100;
  return valor;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const clienteId = body.clienteId || body.cliente_id || null;
    const nomeCliente = body.nomeCliente || body.nome_cliente || null;
    const nomeObra = body.nomeObra || null;
    const localizacao = body.localizacao || null;
    const observacoes = body.observacoes || null;
    const artigos = (body.artigos || []) as ArtigoPedido[];

    if (!clienteId) {
      return Response.json(
        { success: false, sucesso: false, error: "Cliente não identificado." },
        { status: 400 }
      );
    }

    if (!nomeObra || !String(nomeObra).trim()) {
      return Response.json(
        { success: false, sucesso: false, error: "Preencha o nome da obra." },
        { status: 400 }
      );
    }

    if (!artigos.length) {
      return Response.json(
        {
          success: false,
          sucesso: false,
          error: "Adicione pelo menos um artigo.",
        },
        { status: 400 }
      );
    }

    const { data: precos, error: erroPrecos } = await supabase
      .from("precos")
      .select("*");

    if (erroPrecos) throw erroPrecos;

    const { data: regrasPrazo, error: erroRegrasPrazo } = await supabase
      .from("regras_prazo")
      .select("tipo_regra, nome, dias");

    if (erroRegrasPrazo) throw erroRegrasPrazo;

    const { data: cliente, error: erroCliente } = await supabase
      .from("clientes")
      .select("desconto_percentual, nome")
      .eq("id", clienteId)
      .single<{ desconto_percentual: number | null; nome: string | null }>();

    if (erroCliente) throw erroCliente;

    const desconto = Number(cliente?.desconto_percentual || 0);

    function getPreco(nome?: string | null) {
      if (!nome) return 0;

      const item = precos?.find(
        (p) =>
          String(p.nome || "").trim().toLowerCase() ===
          String(nome).trim().toLowerCase()
      );

      return Number(item?.valor || 0);
    }

    function obterDadosArtigo(artigo: ArtigoPedido) {
      const dadosOriginais = artigo.dados || {};

      const larguraOriginal = numeroSeguro(
        dadosOriginais.largura ?? artigo.largura
      );
      const alturaOriginal = numeroSeguro(
        dadosOriginais.altura ?? artigo.altura
      );
      const profundidadeOriginal = numeroSeguro(
        dadosOriginais.profundidade ?? artigo.profundidade
      );

      const largura = converterParaMetros(larguraOriginal);
      const altura = converterParaMetros(alturaOriginal);
      const profundidade = converterParaMetros(profundidadeOriginal);

      const material =
        dadosOriginais.material ||
        dadosOriginais.acabamento ||
        artigo.material ||
        "";

      const extras = Array.isArray(dadosOriginais.extras)
        ? dadosOriginais.extras
        : Array.isArray(artigo.extras)
        ? artigo.extras
        : [];

      return {
        ...dadosOriginais,
        largura,
        altura,
        profundidade,
        largura_original: larguraOriginal,
        altura_original: alturaOriginal,
        profundidade_original: profundidadeOriginal,
        unidade_medida: larguraOriginal > 20 || alturaOriginal > 20 ? "cm" : "m",
        material,
        extras,
      };
    }

    let total = 0;

    for (const artigo of artigos) {
      const dados = obterDadosArtigo(artigo);
      const area = Number(dados.largura || 0) * Number(dados.altura || 0);

      const precoTipo = getPreco(artigo.tipo);
      const precoMaterial = getPreco(dados.material);

      let subtotal = area * (precoTipo + precoMaterial);

      for (const extra of dados.extras) {
        subtotal += getPreco(extra.nome) * numeroSeguro(extra.quantidade);
      }

      total += subtotal;
    }

    const totalComDesconto = total - (total * desconto) / 100;

    const prazo = calcularPrazoProcesso(
      artigos.map((artigo) => {
        const dados = obterDadosArtigo(artigo);

        return {
          tipo: artigo.tipo || "",
          material: dados.material || "",
          extras: dados.extras || [],
        };
      }),
      (regrasPrazo || []) as RegraPrazo[]
    );

    const { data: processo, error: erroProcesso } = await supabase
      .from("processos")
      .insert({
        cliente_id: clienteId,
        nome_cliente: nomeCliente || cliente?.nome || null,
        nome_obra: nomeObra,
        localizacao,
        observacoes,
        estado: "Pedido Submetido",
        valor_estimado: total,
        desconto_percentual: desconto,
        valor_estimado_com_desconto: totalComDesconto,
        valor_final: null,
        notas_admin: "",
        dias_fabrico_previstos: prazo.diasFabrico,
        dias_acabamento_previstos: prazo.diasAcabamento,
        dias_montagem_previstos: prazo.diasMontagem,
        dias_totais_previstos: prazo.diasTotais,
        data_entrega_prevista: prazo.dataEntregaPrevista,
        estado_dropbox: "sem_val",
        lote_atual: 1,
      })
      .select("id")
      .single();

    if (erroProcesso || !processo) throw erroProcesso;

    const resVal = await fetch(criarProjetoDropboxUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${String(serviceRoleKey)}`,
        apikey: String(serviceRoleKey),
      },
      body: JSON.stringify({
        nome_empresa: nomeObra || "Sem nome",
        nome_cliente: nomeCliente || cliente?.nome || "Cliente",
      }),
    });

    const textoVal = await resVal.text();

    let dataVal: any = null;

    try {
      dataVal = textoVal ? JSON.parse(textoVal) : null;
    } catch {
      dataVal = null;
    }

    if (!resVal.ok || !dataVal?.sucesso) {
      throw new Error(
        dataVal?.erro ||
          dataVal?.message ||
          textoVal ||
          "Erro ao criar VAL automaticamente."
      );
    }

    const { error: erroAtualizarVal } = await supabase
      .from("processos")
      .update({
        codigo_val: dataVal.codigo,
        caminho_dropbox: dataVal.caminho,
        estado_dropbox: "orcamento",
        lote_atual: 1,
      })
      .eq("id", processo.id);

    if (erroAtualizarVal) throw erroAtualizarVal;

    const artigosParaInserir = artigos.map((artigo) => {
      const dados = obterDadosArtigo(artigo);

      return {
        processo_id: processo.id,
        tipo: artigo.tipo || null,
        nome: artigo.nome || artigo.tipo || "Artigo",
        resumo: artigo.resumo || "Sem resumo",
        dados,
      };
    });

    const { error: erroArtigos } = await supabase
      .from("artigos")
      .insert(artigosParaInserir);

    if (erroArtigos) throw erroArtigos;

    return Response.json({
      success: true,
      sucesso: true,
      message: "Pedido submetido com sucesso e VAL criado automaticamente.",
      processoId: processo.id,
      codigo_val: dataVal.codigo,
      caminho_dropbox: dataVal.caminho,
      lote_atual: 1,
      total,
      totalComDesconto,
      prazo,
    });
  } catch (error: any) {
    console.error("Erro ao submeter orçamento:", error);

    return Response.json(
      {
        success: false,
        sucesso: false,
        error: error?.message || "Erro ao submeter orçamento.",
      },
      { status: 500 }
    );
  }
}