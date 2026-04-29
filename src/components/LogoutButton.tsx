"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SESSAO_KEY = "valerie_cliente_sessao";

type LogoutButtonProps = {
  redirectTo?: string;
  label?: string;
  fullWidth?: boolean;
};

export default function LogoutButton({
  redirectTo = "/login",
  label = "Logout",
  fullWidth = false,
}: LogoutButtonProps) {
  const router = useRouter();
  const [aSair, setASair] = useState(false);

  async function terminarSessao() {
    try {
      setASair(true);

      await supabase.auth.signOut();
      localStorage.removeItem(SESSAO_KEY);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao terminar sessão:", error);
      localStorage.removeItem(SESSAO_KEY);
      router.replace("/login");
    } finally {
      setASair(false);
    }
  }

  return (
    <button
      onClick={terminarSessao}
      disabled={aSair}
      style={{
        ...botaoLogoutStyle,
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {aSair ? "A sair..." : label}
    </button>
  );
}

const botaoLogoutStyle: CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};