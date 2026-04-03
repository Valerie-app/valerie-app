function bufferToUint8Array(buffer: Buffer) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

async function getDropboxAccessToken() {
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Faltam variáveis da Dropbox.");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
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
    body: bufferToUint8Array(contents),
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
    body: bufferToUint8Array(buffer),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Erro ao enviar ficheiro para Dropbox: ${text}`);
  }

  return text;
}