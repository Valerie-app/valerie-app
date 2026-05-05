import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DROPBOX_REFRESH_TOKEN = Deno.env.get("DROPBOX_REFRESH_TOKEN")!;
const DROPBOX_CLIENT_ID = Deno.env.get("DROPBOX_CLIENT_ID")!;
const DROPBOX_CLIENT_SECRET = Deno.env.get("DROPBOX_CLIENT_SECRET")!;

// 🔑 gerar token automático
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

async function uploadDropbox(path: string, bytes: Uint8Array, token: string) {
  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": dropboxApiArg({
        path,
        mode: "add",
        autorename: true,
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

function base64ToBytes(base64: string) {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function normalizarLote(lote: any) {
  const numero = Number(lote || 1);
  if (!Number.isFinite(numero) || numero < 1) return 1;
  return Math.floor(numero);
}

serve(async (req) => {
  try {
    const token = await getDropboxAccessToken();

    const { codigo_val, lote, nome_ficheiro, ficheiro_base64 } = await req.json();

    if (!codigo_val || !nome_ficheiro || !ficheiro_base64) {
      return Response.json({
        sucesso: false,
        erro: "Faltam dados obrigatórios.",
      });
    }

    const numeroLote = normalizarLote(lote);

    const res = await supabaseFetch(
      `projetos?codigo_val=ilike.${encodeURIComponent(codigo_val)}&limit=1`
    );

    const data = await res.json();

    if (!data || data.length === 0) {
      return Response.json({
        sucesso: false,
        erro: "Projeto não encontrado.",
      });
    }

    const projeto = data[0];

    const caminho = `${projeto.caminho_dropbox}/Ficheiro cliente/Lote ${numeroLote}/${nome_ficheiro}`;

    const bytes = base64ToBytes(ficheiro_base64);

    const upload = await uploadDropbox(caminho, bytes, token);

    if (!upload.ok) {
      return Response.json({
        sucesso: false,
        erro: upload.text,
      });
    }

    return Response.json({
      sucesso: true,
      caminho,
    });

  } catch (err) {
    return Response.json({
      sucesso: false,
      erro: String(err),
    });
  }
});