import { NextResponse } from "next/server";
import { analisarImagem } from "@/lib/ia";

export async function POST(req: Request) {
  const formData = await req.formData();

  const imagem = formData.get("imagem");
  const cliente = String(formData.get("cliente") || "");
  const referencia = String(formData.get("referencia") || "");
  const tipo_cliente = String(formData.get("tipo_cliente") || "Particular");
  const local_obra = String(formData.get("local_obra") || "");
  const km_calculados = Number(formData.get("km_calculados") || 0);

  const quer_montagem =
    String(formData.get("quer_montagem") || "true") === "true";
  const precisa_transporte =
    String(formData.get("precisa_transporte") || "false") === "true";
  const precisa_voos =
    String(formData.get("precisa_voos") || "false") === "true";
  const precisa_tir =
    String(formData.get("precisa_tir") || "false") === "true";
  const quer_led =
    String(formData.get("quer_led") || "false") === "true";
  const quer_material_1 =
    String(formData.get("quer_material_1") || "true") === "true";
  const quer_material_2 =
    String(formData.get("quer_material_2") || "true") === "true";

  if (!imagem) {
    return NextResponse.json({ error: "Imagem em falta" }, { status: 400 });
  }

  const extraido = await analisarImagem(imagem as File);

  return NextResponse.json({
    ...extraido,
    cliente,
    referencia,
    tipo_cliente,
    local_obra,
    km_calculados,
    quer_montagem,
    precisa_transporte,
    precisa_voos,
    precisa_tir,
    quer_led,
    quer_material_1,
    quer_material_2,
  });
}