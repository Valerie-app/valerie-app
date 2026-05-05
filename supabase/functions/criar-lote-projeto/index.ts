import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DROPBOX_REFRESH_TOKEN = Deno.env.get("DROPBOX_REFRESH_TOKEN")!;
const DROPBOX_CLIENT_ID = Deno.env.get("DROPBOX_CLIENT_ID")!;
const DROPBOX_CLIENT_SECRET = Deno.env.get("DROPBOX_CLIENT_SECRET")!;

async function getDropboxAccessToken() {
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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

function extrairNumeroLote(nome: string) {
  const match = nome.match(/^Lote\s+(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

serve(async (req) => {
  try {
    const token = await getDropboxAccessToken();

    const { codigo_val } = await req.json();

    if (!codigo_val) {
      return Response.json({
        sucesso: false,
        etapa: "validacao",
        erro: "Falta codigo_val",
      });
    }

    const projetoRes = await supabaseFetch(
      `projetos?codigo_val=ilike.${encodeURIComponent(String(codigo_val).trim())}&limit=1`
    );

    const projetos = await projetoRes.json();

    if (!projetos || projetos.length === 0) {
      return Response.json({
        sucesso: false,
        etapa: "projeto_nao_encontrado",
        erro: "Projeto não existe no Supabase",
      });
    }

    const projeto = projetos[0];

    const pastaFicheiroCliente = `${projeto.caminho_dropbox}/Ficheiro cliente`;

    const listar = await dropboxPost(
      "files/list_folder",
      {
        path: pastaFicheiroCliente,
        recursive: false,
        include_deleted: false,
      },
      token
    );

    if (!listar.ok) {
      return Response.json({
        sucesso: false,
        etapa: "dropbox_listar_lotes",
        erro: listar.text,
        debug: {
          pastaFicheiroCliente,
          status: listar.status,
        },
      });
    }

    let maiorLote = 0;

    for (const item of listar.json?.entries || []) {
      if (item[".tag"] === "folder") {
        const n = extrairNumeroLote(item.name);
        if (n > maiorLote) maiorLote = n;
      }
    }

    const novoNumero = maiorLote + 1;
    const nomeLote = `Lote ${novoNumero}`;
    const caminhoLote = `${pastaFicheiroCliente}/${nomeLote}`;

    const criar = await dropboxPost(
      "files/create_folder_v2",
      {
        path: caminhoLote,
        autorename: false,
      },
      token
    );

    if (!criar.ok) {
      return Response.json({
        sucesso: false,
        etapa: "dropbox_criar_lote",
        erro: criar.text,
        debug: {
          caminhoLote,
          status: criar.status,
        },
      });
    }

    return Response.json({
      sucesso: true,
      codigo_val: projeto.codigo_val,
      lote: novoNumero,
      nome_lote: nomeLote,
      caminho_lote: caminhoLote,
    });
  } catch (err: any) {
    return Response.json({
      sucesso: false,
      etapa: "erro_geral",
      erro: String(err?.message || err),
    });
  }
});