import { Dropbox } from "dropbox";

function getDropboxClient() {
  return new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
  });
}

export async function criarPastaDropbox(referencia: string) {
  const dbx = getDropboxClient();

  try {
    await dbx.filesCreateFolderV2({
      path: `/orcamentos/${referencia}`,
      autorename: false,
    });
  } catch (error: any) {
    const texto = JSON.stringify(error);
    if (!texto.includes("conflict")) {
      throw error;
    }
  }
}

export async function uploadJsonParaDropbox(
  referencia: string,
  nome: string,
  data: unknown
) {
  const dbx = getDropboxClient();

  const path = `/orcamentos/${referencia}/${nome}.json`;
  const contents = Buffer.from(JSON.stringify(data, null, 2), "utf-8");

  await dbx.filesUpload({
    path,
    contents,
    mode: { ".tag": "overwrite" },
  });
}