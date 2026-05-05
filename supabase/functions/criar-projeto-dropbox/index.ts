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

async function supabaseFetch(path: string, options: any = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
}

async function dropboxPost(endpoint: string, body: any, token: string) {
  const res = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === null ? "null" : JSON.stringify(body),
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

function gerarCodigo(numero: number, ano: number) {
  return `VAL${String(numero).padStart(3, "0")}.${String(ano).slice(-2)}`;
}

function extrairNumeroVAL(nome: string, anoCurto: string) {
  const match = nome.match(new RegExp(`^VAL(\\d{3})\\.${anoCurto}`));
  return match ? Number(match[1]) : 0;
}

async function maiorNumeroDropbox(path: string, anoCurto: string, token: string) {
  const res = await dropboxPost(
    "files/list_folder",
    {
      path,
      recursive: false,
      include_deleted: false,
    },
    token
  );

  if (!res.ok) return 0;

  let maior = 0;

  for (const item of res.json?.entries || []) {
    if (item[".tag"] === "folder") {
      const n = extrairNumeroVAL(item.name, anoCurto);
      if (n > maior) maior = n;
    }
  }

  return maior;
}

serve(async (req) => {
  try {
    const token = await getDropboxAccessToken();

    const { nome_empresa, nome_cliente } = await req.json();

    if (!nome_empresa || !nome_cliente) {
      return Response.json({
        sucesso: false,
        erro: "Faltam nome_empresa ou nome_cliente",
      });
    }

    const ano = new Date().getFullYear();
    const anoCurto = String(ano).slice(-2);

    const pastaAno = `/VAL ${ano} - PROJETOS`;
    const pastaOrcamentos = `${pastaAno}/Orçamentos`;
    const pastaEncomendas = `${pastaAno}/Encomendas`;
    const pastaBase = `${pastaOrcamentos}/VAL000.${anoCurto}- Base`;

    const supabaseRes = await supabaseFetch(
      `projetos?ano=eq.${ano}&order=numero_sequencial.desc&limit=1`
    );

    const supabaseData = await supabaseRes.json();
    const maiorSupabase =
      supabaseData.length > 0 ? supabaseData[0].numero_sequencial : 0;

    const maiorOrcamentos = await maiorNumeroDropbox(
      pastaOrcamentos,
      anoCurto,
      token
    );
    const maiorEncomendas = await maiorNumeroDropbox(
      pastaEncomendas,
      anoCurto,
      token
    );

    const maiorNumero = Math.max(
      maiorSupabase,
      maiorOrcamentos,
      maiorEncomendas,
      6
    );

    const numero = maiorNumero + 1;
    const codigo = gerarCodigo(numero, ano);
    const nomePasta = `${codigo} - ${nome_empresa} - ${nome_cliente}`;
    const caminho = `${pastaOrcamentos}/${nomePasta}`;

    const copia = await dropboxPost(
      "files/copy_v2",
      {
        from_path: pastaBase,
        to_path: caminho,
        autorename: false,
      },
      token
    );

    if (!copia.ok) {
      return Response.json({
        sucesso: false,
        erro: copia.text,
      });
    }

    const guardar = await supabaseFetch("projetos", {
      method: "POST",
      body: JSON.stringify({
        ano,
        numero_sequencial: numero,
        codigo_val: codigo,
        nome_empresa,
        nome_cliente,
        nome_pasta_dropbox: nomePasta,
        caminho_dropbox: caminho,
        estado: "orcamento",
      }),
    });

    if (!guardar.ok) {
      return Response.json({
        sucesso: false,
        erro: await guardar.text(),
      });
    }

    return Response.json({
      sucesso: true,
      codigo,
      caminho,
      estado: "orcamento",
    });
  } catch (err: any) {
    return Response.json({
      sucesso: false,
      erro: String(err?.message || err),
    });
  }
});