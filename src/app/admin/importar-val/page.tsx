"use client";

import { useState } from "react";

export default function ImportarVALPage() {
  const [loading, setLoading] = useState(false);
  const [vals, setVals] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState("");

  async function listarVAL() {
    try {
      setLoading(true);
      setMensagem("");

      const res = await fetch("/api/listar-val-dropbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!data?.sucesso) {
        setMensagem(data?.erro || "Erro ao listar VAL.");
        return;
      }

      setVals(data?.vals || []);
      setMensagem("VAL carregados com sucesso.");
    } catch (err: any) {
      setMensagem(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#1f2540",
        color: "white",
        padding: 40,
        fontFamily: "Arial",
      }}
    >
      <h1>Importar VAL existentes</h1>

      <button
        onClick={listarVAL}
        style={{
          padding: "14px 20px",
          borderRadius: 10,
          border: "none",
          background: "#5c73c7",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: 20,
        }}
      >
        {loading ? "A carregar..." : "Listar VAL Dropbox"}
      </button>

      {mensagem && (
        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          {mensagem}
        </div>
      )}

      <div
        style={{
          marginTop: 30,
          display: "grid",
          gap: 12,
        }}
      >
        {vals.map((val, index) => (
          <div
            key={index}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <strong>{val.nome || "Sem nome"}</strong>
          </div>
        ))}
      </div>
    </main>
  );
}
