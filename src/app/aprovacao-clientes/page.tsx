"use client";

import { useEffect, useState } from "react";

type PedidoConta = {
  nome: string;
  email: string;
  password: string;
  estado: "pendente" | "aprovado" | "rejeitado";
};

export default function AprovacaoClientesPage() {
  const [clientes, setClientes] = useState<PedidoConta[]>([]);

  function carregarClientes() {
    const guardados = localStorage.getItem("valerie_clientes_pendentes");
    const lista: PedidoConta[] = guardados ? JSON.parse(guardados) : [];
    setClientes(lista);
  }

  function atualizarEstado(email: string, novoEstado: "aprovado" | "rejeitado") {
    const atualizados = clientes.map((cliente) =>
      cliente.email === email ? { ...cliente, estado: novoEstado } : cliente
    );

    setClientes(atualizados);
    localStorage.setItem("valerie_clientes_pendentes", JSON.stringify(atualizados));
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "38px", marginTop: 0 }}>Aprovação de Clientes</h1>
      <p style={{ opacity: 0.8, marginBottom: "30px" }}>
        Aprove ou rejeite os pedidos de conta para acesso à app.
      </p>

      <div
        style={{
          maxWidth: "1000px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {clientes.length === 0 ? (
          <div style={cardStyle}>Sem pedidos de conta.</div>
        ) : (
          clientes.map((cliente) => (
            <div key={cliente.email} style={cardStyle}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                  {cliente.nome}
                </div>
                <div style={{ opacity: 0.8, marginTop: "6px" }}>{cliente.email}</div>
                <div style={{ opacity: 0.8, marginTop: "6px" }}>
                  Estado: {cliente.estado}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  onClick={() => atualizarEstado(cliente.email, "aprovado")}
                  style={botaoAprovarStyle}
                >
                  Aprovar
                </button>

                <button
                  onClick={() => atualizarEstado(cliente.email, "rejeitado")}
                  style={botaoRejeitarStyle}
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const botaoAprovarStyle: React.CSSProperties = {
  background: "rgba(63, 163, 107, 0.2)",
  color: "white",
  border: "1px solid rgba(63, 163, 107, 0.35)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoRejeitarStyle: React.CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};