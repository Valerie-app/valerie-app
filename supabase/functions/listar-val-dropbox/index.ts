import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

function extrairInfoVAL(nome: string, estadoDropBox: "orcamento" | "encomenda", caminho: string) {
  const match = nome.match(/^(VAL\d{3}\.\d{2})(?:\s*-\s*(.*))?$/i);

  if (!match) return null;

  const codigoVal = match[1].toUpperCase();
  const resto = String(match[2] || "").trim();

  let nomeObra = resto;
  let nomeCliente = "";

  if (resto.includes(" - ")) {
    const partes = resto.split(" - ").map((p) => p.trim()).filter(Boolean);
    nomeObra = partes[0] || "";
    nomeCliente = partes.slice(1).join(" - ");
  }

  return {
    codigo_val: codigoVal,
    nome_pasta: nome,
    nome_obra: nomeObra,
    nome_cliente: nomeCliente,
    caminho_dropbox: caminho,
    estado_dropbox: estadoDropBox,
    estado: estadoDropBox === "encomenda" ? "Validado" : "Orçamento Enviado",
  };
}

async function listarPasta(path: string, estadoDropBox: "orcamento" | "encomenda", token: string) {
  const res = await dropboxPost(
    "files/list_folder",
    {
      path,
      recursive: false,
      include_deleted: false,
    },
    token
  );

  if (!res.ok) {
    return {
      ok: false,
      erro: res.text,
      path,
      vals: [],
    };
  }

  const vals = [];

  for (const item of res.json?.entries || []) {
    if (item[".tag"] !== "folder") continue;

    const info = extrairInfoVAL(item.name, estadoDropBox, item.path_display || `${path}/${item.name}`);

    if (info) {
      vals.push(info);
    }
  }

  return {
    ok: true,
    erro: "",
    path,
    vals,
  };
}

serve(async (req) => {
  try {
    const token = await getDropboxAccessToken();

    let body: any = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const ano = Number(body.ano || new Date().getFullYear());

    const pastaAno = `/VAL ${ano} - PROJETOS`;

    const pastaOrcamentos = `${pastaAno}/Orçamentos`;
    const pastaEncomendas = `${pastaAno}/Encomendas`;

    const [orcamentos, encomendas] = await Promise.all([
      listarPasta(pastaOrcamentos, "orcamento", token),
      listarPasta(pastaEncomendas, "encomenda", token),
    ]);

    const vals = [...orcamentos.vals, ...encomendas.vals].sort((a, b) =>
      String(a.codigo_val).localeCompare(String(b.codigo_val))
    );

    return Response.json({
      sucesso: true,
      ano,
      total: vals.length,
      vals,
      debug: {
        orcamentos: {
          ok: orcamentos.ok,
          path: orcamentos.path,
          erro: orcamentos.erro,
          total: orcamentos.vals.length,
        },
        encomendas: {
          ok: encomendas.ok,
          path: encomendas.path,
          erro: encomendas.erro,
          total: encomendas.vals.length,
        },
      },
    });
  } catch (err: any) {
    return Response.json({
      sucesso: false,
      erro: String(err?.message || err),
    });
  }
});