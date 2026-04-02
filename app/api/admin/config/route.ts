import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "config.json");

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Ficheiro config.json não encontrado." },
        { status: 404 }
      );
    }

    const file = fs.readFileSync(filePath, "utf-8");
    const config = JSON.parse(file);

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao ler config:", error);
    return NextResponse.json(
      { error: "Erro ao ler configuração." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao guardar config:", error);
    return NextResponse.json(
      { error: "Erro ao guardar configuração." },
      { status: 500 }
    );
  }
}