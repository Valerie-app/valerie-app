const DROPBOX_BASE_PATH = "/Orçamentos";

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

function extrairReferenciaBase(texto: string): string {
  const match = texto.match(/VAL\d+\.\d+/i);
  return match ? match[0].toUpperCase() : texto.trim();
}

function getDropboxEnv() {
  const clientId = (process.env.DROPBOX_APP_KEY || "").trim();
  const clientSecret = (process.env.DROPBOX_APP_SECRET || "").trim();
  const refreshToken = (process.env.DROPBOX_REFRESH_TOKEN || "").trim();

  const missing: string[] = [];

  if (!clientId) missing.push("DROPBOX_APP_KEY");
  if (!clientSecret) missing.push("DROPBOX_APP_SECRET");
  if (!refreshToken) missing.push("DROPBOX_REFRESH_TOKEN");

  if (missing.length > 0) {
    throw new Error(`Faltam variáveis da Dropbox: ${missing.join(", ")}`);
  }

  return { clientId, clientSecret, refreshToken };
}

async function getDropboxAccessToken() {
  const { clientId, clientSecret, refreshToken } = getDropboxEnv();

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  const text = await res.text();

  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Erro ao obter access token Dropbox: ${JSON.stringify(data)}`);
  }

  if (!data.access_token) {
    throw new Error("Dropbox não devolveu access_token.");
  }

  return data.access_token as string;
}

function montarPastaReferencia(referencia: string) {
  const refBase = extrairReferenciaBase(referencia);
  return `${DROPBOX_BASE_PATH}/${refBase}`;
}

export async function uploadJsonParaDropbox(
  referencia: string,
  nome: string,
  data: unknown
) {
  const accessToken = await getDropboxAccessToken();
  const pasta = montarPastaReferencia(referencia);
  const contents = Buffer.from(JSON.stringify(data, null, 2), "utf-8");

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `${pasta}/${nome}.json`,
        mode: "overwrite",
        autorename: false,
        mute: false,
      }),
      "Content-Type": "application/octet-stream",
    },
    body: bufferToArrayBuffer(contents) as BodyInit,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Erro ao enviar JSON para Dropbox: ${text}`);
  }

  return text;
}

export async function uploadBufferParaDropbox(
  referencia: string,
  nomeFicheiro: string,
  buffer: Buffer
) {
  const accessToken = await getDropboxAccessToken();
  const pasta = montarPastaReferencia(referencia);

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `${pasta}/${nomeFicheiro}`,
        mode: "overwrite",
        autorename: false,
        mute: false,
      }),
      "Content-Type": "application/octet-stream",
    },
    body: bufferToArrayBuffer(buffer) as BodyInit,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Erro ao enviar ficheiro para Dropbox: ${text}`);
  }

  return text;
}