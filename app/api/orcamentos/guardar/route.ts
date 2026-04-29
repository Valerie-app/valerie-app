import { NextResponse } from "next/server";
import { uploadJsonParaDropbox } from "@/lib/dropbox";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const analise = body.analise || {};
    const orcamento = body.orcamento || {};

    const referencia = String(
      analise.referencia || body.referencia || `SEM-REF-${Date.now()}`
    ).trim();

    await uploadJsonParaDropbox(referencia, "analise", analise);
    await uploadJsonParaDropbox(referencia, "orcamento", orcamento);
    await uploadJsonParaDropbox(referencia, "completo", {
      referencia,
      criadoEm: new Date().toISOString(),
      analise,
      orcamento,
    });

    return NextResponse.json({
      ok: true,
      referencia,
    });
  } catch (error) {
    console.error("Erro ao guardar na Dropbox:", error);

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao guardar na Dropbox.";

    return NextResponse.json(
      { error: mensagem },
      { status: 500 }
    );
  }
}