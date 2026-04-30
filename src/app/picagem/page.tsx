"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Estado = "carregar" | "sucesso" | "erro";

function PicagemContent() {
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<Estado>("carregar");
  const [mensagem, setMensagem] = useState("A registar picagem...");

  useEffect(() => {
    async function registarPicagem() {
      try {
        const processoId = searchParams.get("processo");
        const fase = searchParams.get("fase");

        if (!processoId || !fase) {
          setEstado("erro");
          setMensagem("Link inválido. Falta processo ou fase.");
          return;
        }

        if (!["producao", "acabamentos", "montagem"].includes(fase)) {
          setEstado("erro");
          setMensagem("Fase inválida.");
          return;
        }

        const { error } = await supabase.from("picagens_qr").insert({
          processo_id: processoId,
          fase,
          criado_por: "QR Code",
          observacao: "Picagem registada via QR Code",
        });

        if (error) throw error;

        setEstado("sucesso");
        setMensagem("Picagem registada com sucesso.");
      } catch (error: any) {
        console.error(error);
        setEstado("erro");
        setMensagem(error?.message || "Erro ao registar picagem.");
      }
    }

    void registarPicagem();
  }, [searchParams]);

  return (
    <main style={{
      minHeight: "100dvh",
      background: "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    }}>
      <section style={{
        width: "100%",
        maxWidth: "520px",
        padding: "28px",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        textAlign: "center",
      }}>
        <h1>
          {estado === "sucesso"
            ? "Picagem registada"
            : estado === "erro"
            ? "Erro na picagem"
            : "A processar"}
        </h1>

        <p>{mensagem}</p>
        <p style={{ opacity: 0.55, fontSize: "13px", marginTop: "22px" }}>
          Sistema VALERIE
        </p>
      </section>
    </main>
  );
}

export default function PicagemPage() {
  return (
    <Suspense fallback={<div>A carregar...</div>}>
      <PicagemContent />
    </Suspense>
  );
}