function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

function getDropboxEnv(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} {
  const rawClientId = process.env.DROPBOX_APP_KEY?.trim();
  const rawClientSecret = process.env.DROPBOX_APP_SECRET?.trim();
  const rawRefreshToken = process.env.DROPBOX_REFRESH_TOKEN?.trim();

  const missing: string[] = [];

  if (!rawClientId) missing.push("DROPBOX_APP_KEY");
  if (!rawClientSecret) missing.push("DROPBOX_APP_SECRET");
  if (!rawRefreshToken) missing.push("DROPBOX_REFRESH_TOKEN");

  if (missing.length > 0) {
    throw new Error(`Faltam variáveis da Dropbox: ${missing.join(", ")}`);
  }

  const clientId = rawClientId as string;
  const clientSecret = rawClientSecret as string;
  const refreshToken = rawRefreshToken as string;

  return {
    clientId,
    clientSecret,
    refreshToken,
  };
}

async function getDropboxAccessToken() {
  const { clientId, clientSecret, refreshToken } = getDropboxEnv();

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Erro ao obter access token Dropbox: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

export async function criarPastaDropbox(referencia: string) {
  const accessToken = await getDropboxAccessToken();

  const res = await fetch("https://api.dropboxapi.com/2/files/create_folder_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: `/orcamentos/${referencia}`,
      autorename: false,
    }),
  });

  if (res.ok) return;

  const text = await res.text();

  if (text.includes("conflict")) return;

  throw new Error(`Erro ao criar pasta Dropbox: ${text}`);
}

export async function uploadJsonParaDropbox(
  referencia: string,
  nome: string,
  data: unknown
) {
  const accessToken = await getDropboxAccessToken();
  const contents = Buffer.from(JSON.stringify(data, null, 2), "utf-8");

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/orcamentos/${referencia}/${nome}.json`,
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

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/orcamentos/${referencia}/${nomeFicheiro}`,
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