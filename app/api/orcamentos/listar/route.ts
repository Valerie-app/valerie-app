import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "orcamentos.json");

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }

    const file = fs.readFileSync(filePath, "utf-8");
    const dados = JSON.parse(file);

    return NextResponse.json(dados);
  } catch (error) {
    console.error("Erro ao listar orçamentos:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao listar orçamentos" },
      { status: 500 }
    );
  }
}