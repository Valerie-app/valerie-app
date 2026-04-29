import { NextResponse } from "next/server";
import { calcularOrcamento } from "@/lib/orcamento";

export async function POST(req: Request) {
  const body = await req.json();
  const resultado = calcularOrcamento(body);
  return NextResponse.json(resultado);
}