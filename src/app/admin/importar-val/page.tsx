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
      setMensagem(`VAL carregados com sucesso: ${data?.vals?.length || 0}`);
    } catch (err: any) {
      setMensagem(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function importarVAL(val: any) {
    try {
      setMensagem("");

      const res = await fetch("/api/importar-val", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(val),
      });

      const data = await res.json();

      if (!data?.sucesso) {
        setMensagem(data?.erro || "Erro ao importar VAL.");
        return;
      }

      setMensagem(`${val.codigo_val} importado com sucesso.`);
    } catch (err: any) {
      setMensagem(String(err));
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
            key={`${val.codigo_val}-${index}`}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div>
              <strong style={{ fontSize: 18 }}>
                {val.codigo_val || "Sem VAL"}
              </strong>

              <div style={{ marginTop: 6 }}>
                {val.nome_pasta || val.nome_obra || "Sem nome"}
              </div>

              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                {val.estado_dropbox || "Dropbox"} · {val.caminho_dropbox || ""}
              </div>
            </div>

            <button
              onClick={() => importarVAL(val)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(63,163,107,0.45)",
                background: "rgba(63,163,107,0.22)",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Importar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}