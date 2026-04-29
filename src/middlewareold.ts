import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔹 Rotas públicas
  const rotasPublicas = ["/login"];

  if (rotasPublicas.includes(pathname)) {
    return NextResponse.next();
  }

  // 🔹 Verifica sessão guardada (localStorage não dá aqui, usamos cookie)
  const session = req.cookies.get("sb-access-token");

  // 🔹 Se não tiver sessão → bloqueia
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔹 Proteção admin
  if (pathname.startsWith("/admin")) {
    const tipo = req.cookies.get("tipo_utilizador");

    if (tipo?.value !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 🔹 Proteção cliente
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}