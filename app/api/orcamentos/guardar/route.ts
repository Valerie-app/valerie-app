import { NextResponse } from "next/server";
import { criarPastaDropbox, uploadJsonParaDropbox } from "@/lib/dropbox";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const analise = body.analise || {};
    const orcamento = body.orcamento || {};

    const referencia = String(
      analise.referencia ||
        body.referencia ||
        `SEM-REF-${Date.now()}`
    ).trim();

    await criarPastaDropbox(referencia);

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
      pasta: `/orcamentos/${referencia}`,
    });
  } catch (error) {
    console.error("Erro ao guardar na Dropbox:", error);

    return NextResponse.json(
      { error: "Erro ao guardar orçamento na Dropbox." },
      { status: 500 }
    );
  }
}