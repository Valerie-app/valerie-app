import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DROPBOX_REFRESH_TOKEN = Deno.env.get("DROPBOX_REFRESH_TOKEN")!;
const DROPBOX_CLIENT_ID = Deno.env.get("DROPBOX_CLIENT_ID")!;
const DROPBOX_CLIENT_SECRET = Deno.env.get("DROPBOX_CLIENT_SECRET")!;

async function getDropboxAccessToken() {
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: DROPBOX_REFRESH_TOKEN,
      client_id: DROPBOX_CLIENT_ID,
      client_secret: DROPBOX_CLIENT_SECRET,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(`Erro ao renovar token Dropbox: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

async function supabaseFetch(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

function dropboxApiArg(arg: any) {
  return JSON.stringify(arg).replace(/[\u007f-\uffff]/g, (c) => {
    return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
  });
}

async function dropboxPost(endpoint: string, body: any, token: string) {
  const res = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === null ? "null" : dropboxApiArg(body),
  });

  const text = await res.text();

  return {
    ok: res.ok,
    status: res.status,
    text,
    json: text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })()
      : null,
  };
}

async function downloadDropbox(path: string, token: string) {
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": dropboxApiArg({ path }),
    },
  });

  const text = await res.text();

  return {
    ok: res.ok,
    status: res.status,
    text,
  };
}

async function uploadDropbox(path: string, content: string, token: string) {
  const bytes = new TextEncoder().encode(content);

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": dropboxApiArg({
        path,
        mode: "overwrite",
        autorename: false,
        mute: false,
        strict_conflict: false,
      }),
    },
    body: bytes,
  });

  const text = await res.text();

  return {
    ok: res.ok,
    status: res.status,
    text,
  };
}

async function criarPastaDropbox(path: string, token: string) {
  const res = await dropboxPost(
    "files/create_folder_v2",
    {
      path,
      autorename: false,
    },
    token
  );

  if (res.ok || res.text.includes("path/conflict/folder")) {
    return { ok: true, text: res.text };
  }

  return res;
}

function limparCampo(valor: unknown) {
  return String(valor ?? "")
    .replace(/"/g, '""')
    .replace(/\r?\n/g, " ")
    .trim();
}

function linhaCsv(campos: unknown[]) {
  return campos.map((campo) => `"${limparCampo(campo)}"`).join(";") + "\n";
}

function formatarDataHoraIso() {
  return new Date().toISOString();
}

serve(async (req) => {
  try {
    const token = await getDropboxAccessToken();

    const {
      codigo_val,
      lote,
      artigo_id,
      tipo_trabalho,
      operador,
      estado,
    } = await req.json();

    if (!codigo_val || !tipo_trabalho || !operador || !estado) {
      return Response.json({
        sucesso: false,
        etapa: "validacao",
        erro: "Faltam codigo_val, tipo_trabalho, operador ou estado.",
      });
    }

    const processoRes = await supabaseFetch(
      `processos?codigo_val=ilike.${encodeURIComponent(String(codigo_val).trim())}&limit=1`
    );

    const processos = await processoRes.json();
    const processo = processos?.[0];

    if (!processo) {
      return Response.json({
        sucesso: false,
        etapa: "processo_nao_encontrado",
        erro: "Processo não encontrado.",
      });
    }

    let artigoNome = "";
    let artigoTipo = "";

    if (artigo_id) {
      const artigoRes = await supabaseFetch(
        `artigos?id=eq.${encodeURIComponent(String(artigo_id))}&limit=1`
      );

      const artigos = await artigoRes.json();
      const artigo = artigos?.[0];

      artigoNome = artigo?.nome || "";
      artigoTipo = artigo?.tipo || "";
    }

    const caminhoBase =
      processo.caminho_dropbox || `/Encomendas/${processo.codigo_val}`;

    const pastaTempos = `${caminhoBase}/Ajudas/Tempos`;
    const nomeFicheiro = `tempos-${processo.codigo_val}-lote-${Number(lote || 1)}.csv`;
    const caminhoFicheiro = `${pastaTempos}/${nomeFicheiro}`;

    const criarPasta = await criarPastaDropbox(pastaTempos, token);

    if (!criarPasta.ok) {
      return Response.json({
        sucesso: false,
        etapa: "erro_criar_pasta_tempos",
        erro: criarPasta.text,
        debug: { pastaTempos },
      });
    }

    let csv = "";

    const existente = await downloadDropbox(caminhoFicheiro, token);

    if (existente.ok) {
      csv = existente.text;
    } else {
      csv = linhaCsv([
        "data_hora",
        "codigo_val",
        "lote",
        "processo_id",
        "artigo_id",
        "artigo_nome",
        "artigo_tipo",
        "tipo_trabalho",
        "operador",
        "estado",
      ]);
    }

    const dataHora = formatarDataHoraIso();

    csv += linhaCsv([
      dataHora,
      processo.codigo_val,
      Number(lote || 1),
      processo.id,
      artigo_id || "",
      artigoNome,
      artigoTipo,
      tipo_trabalho,
      operador,
      estado,
    ]);

    const upload = await uploadDropbox(caminhoFicheiro, csv, token);

    if (!upload.ok) {
      return Response.json({
        sucesso: false,
        etapa: "erro_upload_tempos",
        erro: upload.text,
        debug: {
          caminhoFicheiro,
          status: upload.status,
        },
      });
    }

    return Response.json({
      sucesso: true,
      caminho: caminhoFicheiro,
      pasta: pastaTempos,
      codigo_val: processo.codigo_val,
      lote: Number(lote || 1),
    });
  } catch (err: any) {
    return Response.json({
      sucesso: false,
      etapa: "erro_geral",
      erro: String(err?.message || err),
    });
  }
});