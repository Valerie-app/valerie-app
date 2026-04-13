"use client";

import { useEffect, useState } from "react";

type SessaoCliente = {
  autenticado: boolean;
  nome: string;
  email: string;
};

export default function PerfilPage() {
  const [cliente, setCliente] = useState<SessaoCliente | null>(null);

  useEffect(() => {
    const sessaoGuardada = localStorage.getItem("valerie_cliente_sessao");

    if (!sessaoGuardada) {
      window.location.href = "/login";
      return;
    }

    try {
      const dadosSessao: SessaoCliente = JSON.parse(sessaoGuardada);

      if (!dadosSessao?.autenticado) {
        window.location.href = "/login";
        return;
      }

      setCliente(dadosSessao);
    } catch (error) {
      console.error(error);
      window.location.href = "/login";
    }
  }, []);

  function terminarSessao() {
    localStorage.removeItem("valerie_cliente_sessao");
    window.location.href = "/login";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
        color: "white",
        display: "flex",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <aside
        style={{
          width: "260px",
          minHeight: "100vh",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.12)",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            fontSize: "38px",
            letterSpacing: "10px",
            marginBottom: "40px",
          }}
        >
          VALERIE
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a href="/" style={menuStyle}>
            Dashboard
          </a>

          <a href="/novo-orcamento" style={menuStyle}>
            Novo Orçamento
          </a>

          <a href="/processos" style={menuStyle}>
            Os Meus Processos
          </a>

          <a href="/documentos" style={menuStyle}>
            Documentos
          </a>

          <a href="/mensagens" style={menuStyle}>
            Mensagens
          </a>

          <a
            href="/perfil"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Perfil
          </a>

          <button
            onClick={terminarSessao}
            style={{
              ...menuStyle,
              textAlign: "left",
              border: "none",
              cursor: "pointer",
            }}
          >
            Terminar Sessão
          </button>
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "38px", margin: 0 }}>Perfil</h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Consulte os dados da sua conta e o estado de acesso à app.
          </p>
        </div>

        <div
          style={{
            maxWidth: "1000px",
            display: "grid",
            gap: "20px",
          }}
        >
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Dados da Conta</h2>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <div style={labelStyle}>Nome do Cliente</div>
                <div style={valorStyle}>{cliente?.nome || "—"}</div>
              </div>

              <div>
                <div style={labelStyle}>Email</div>
                <div style={valorStyle}>{cliente?.email || "—"}</div>
              </div>

              <div>
                <div style={labelStyle}>Estado da Conta</div>
                <div style={valorStyle}>Aprovada</div>
              </div>

              <div>
                <div style={labelStyle}>Sessão</div>
                <div style={valorStyle}>
                  {cliente?.autenticado ? "Ativa" : "Inativa"}
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Acesso Rápido</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <a href="/novo-orcamento" style={atalhoStyle}>
                Novo Orçamento
              </a>

              <a href="/processos" style={atalhoStyle}>
                Os Meus Processos
              </a>

              <a href="/documentos" style={atalhoStyle}>
                Documentos
              </a>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Sessão</h2>
            <p style={{ opacity: 0.85, marginBottom: "18px" }}>
              Pode terminar a sessão em qualquer momento.
            </p>

            <button onClick={terminarSessao} style={botaoPrincipalStyle}>
              Terminar Sessão
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const menuStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
};

const cardStyle: React.CSSProperties = {
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  opacity: 0.7,
  marginBottom: "6px",
};

const valorStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "bold",
};

const atalhoStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  textDecoration: "none",
  textAlign: "center",
  fontWeight: "bold",
};

const botaoPrincipalStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #4b5f9e 0%, #34457c 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};