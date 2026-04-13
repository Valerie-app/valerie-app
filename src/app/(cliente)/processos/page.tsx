"use client";

import { useEffect, useState } from "react";

type Processo = {
  id: number;
  nomeCliente: string;
  nomeObra: string;
  localizacao: string;
  observacoes: string;
  artigos: {
    id: number;
    tipo: string;
    nome: string;
    resumo?: string;
  }[];
  estado: string;
  dataCriacao: string;
};

type SessaoCliente = {
  autenticado: boolean;
  nome: string;
  email: string;
};

export default function ProcessosPage() {
  const [nomeCliente, setNomeCliente] = useState("");
  const [processos, setProcessos] = useState<Processo[]>([]);

  function obterEstiloEstado(estado: string): React.CSSProperties {
    if (estado === "Pedido Submetido") {
      return {
        background: "rgba(90, 110, 255, 0.18)",
        border: "1px solid rgba(90, 110, 255, 0.35)",
        color: "white",
      };
    }

    if (estado === "Em Análise") {
      return {
        background: "rgba(255, 193, 7, 0.18)",
        border: "1px solid rgba(255, 193, 7, 0.35)",
        color: "white",
      };
    }

    if (estado === "Orçamento Enviado") {
      return {
        background: "rgba(0, 188, 212, 0.18)",
        border: "1px solid rgba(0, 188, 212, 0.35)",
        color: "white",
      };
    }

    if (estado === "Adjudicado") {
      return {
        background: "rgba(63, 163, 107, 0.18)",
        border: "1px solid rgba(63, 163, 107, 0.35)",
        color: "white",
      };
    }

    if (estado === "Em Produção") {
      return {
        background: "rgba(156, 39, 176, 0.18)",
        border: "1px solid rgba(156, 39, 176, 0.35)",
        color: "white",
      };
    }

    if (estado === "Em Montagem") {
      return {
        background: "rgba(255, 87, 34, 0.18)",
        border: "1px solid rgba(255, 87, 34, 0.35)",
        color: "white",
      };
    }

    if (estado === "Concluído") {
      return {
        background: "rgba(46, 204, 113, 0.18)",
        border: "1px solid rgba(46, 204, 113, 0.35)",
        color: "white",
      };
    }

    if (estado === "Não Adjudicado") {
      return {
        background: "rgba(180,50,50,0.18)",
        border: "1px solid rgba(180,50,50,0.35)",
        color: "white",
      };
    }

    return {
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "white",
    };
  }

  useEffect(() => {
    const sessaoGuardada = localStorage.getItem("valerie_cliente_sessao");
    const processosGuardados = localStorage.getItem("valerie_processos");

    if (sessaoGuardada) {
      const sessao: SessaoCliente = JSON.parse(sessaoGuardada);
      setNomeCliente(sessao.nome || "");
    }

    if (processosGuardados && sessaoGuardada) {
      const sessao: SessaoCliente = JSON.parse(sessaoGuardada);
      const lista: Processo[] = JSON.parse(processosGuardados);

      const processosDoCliente = lista.filter(
        (processo) => processo.nomeCliente === sessao.nome
      );

      setProcessos(processosDoCliente);
    }
  }, []);

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

          <a
            href="/processos"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Os Meus Processos
          </a>

          <a href="/documentos" style={menuStyle}>
            Documentos
          </a>

          <a href="/mensagens" style={menuStyle}>
            Mensagens
          </a>

          <a href="/perfil" style={menuStyle}>
            Perfil
          </a>

          <button
            onClick={() => {
              localStorage.removeItem("valerie_cliente_sessao");
              window.location.href = "/login";
            }}
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
          <h1 style={{ fontSize: "38px", margin: 0 }}>Os Meus Processos</h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            {nomeCliente
              ? `Aqui pode acompanhar os pedidos submetidos por ${nomeCliente}.`
              : "Aqui pode acompanhar os seus pedidos submetidos."}
          </p>
        </div>

        <div
          style={{
            maxWidth: "1100px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {processos.length === 0 ? (
            <div style={cardStyle}>
              Ainda não existem processos submetidos nesta conta.
            </div>
          ) : (
            processos
              .slice()
              .reverse()
              .map((processo) => (
                <div key={processo.id} style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "20px",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "320px" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                        {processo.nomeObra}
                      </h2>

                      <div
                        style={{
                          display: "inline-block",
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontWeight: "bold",
                          fontSize: "14px",
                          marginBottom: "16px",
                          ...obterEstiloEstado(processo.estado),
                        }}
                      >
                        {processo.estado}
                      </div>

                      <p style={textoStyle}>
                        <strong>Cliente:</strong> {processo.nomeCliente}
                      </p>

                      <p style={textoStyle}>
                        <strong>Localização:</strong> {processo.localizacao || "—"}
                      </p>

                      <p style={textoStyle}>
                        <strong>Data do pedido:</strong> {processo.dataCriacao}
                      </p>

                      <p style={textoStyle}>
                        <strong>Observações:</strong> {processo.observacoes || "—"}
                      </p>
                    </div>

                    <div
                      style={{
                        minWidth: "280px",
                        flex: 1,
                        padding: "14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                        Artigos do Processo
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {processo.artigos.map((artigo) => (
                          <div
                            key={artigo.id}
                            style={{
                              paddingBottom: "10px",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div style={{ fontWeight: "bold" }}>{artigo.nome}</div>
                            <div style={{ opacity: 0.8, marginTop: "4px" }}>
                              Tipo: {artigo.tipo}
                            </div>
                            <div
                              style={{
                                opacity: 0.75,
                                marginTop: "4px",
                                fontSize: "14px",
                              }}
                            >
                              {artigo.resumo || "Ainda por configurar"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
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

const textoStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "8px",
};