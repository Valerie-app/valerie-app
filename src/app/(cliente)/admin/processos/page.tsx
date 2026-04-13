"use client";

import { useEffect, useState } from "react";

type Artigo = {
  id: number;
  tipo: string;
  nome: string;
  resumo?: string;
};

type Processo = {
  id: number;
  nomeCliente: string;
  nomeObra: string;
  localizacao: string;
  observacoes: string;
  artigos: Artigo[];
  estado: string;
  dataCriacao: string;
};

const ESTADOS = [
  "Pedido Submetido",
  "Em Análise",
  "Orçamento Enviado",
  "Adjudicado",
  "Em Produção",
  "Em Montagem",
  "Concluído",
  "Não Adjudicado",
];

export default function AdminProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);

  function carregarProcessos() {
    const guardados = localStorage.getItem("valerie_processos");
    const lista: Processo[] = guardados ? JSON.parse(guardados) : [];
    setProcessos(lista);
  }

  function atualizarEstado(id: number, novoEstado: string) {
    const atualizados = processos.map((p) =>
      p.id === id ? { ...p, estado: novoEstado } : p
    );

    setProcessos(atualizados);
    localStorage.setItem("valerie_processos", JSON.stringify(atualizados));
  }

  useEffect(() => {
    carregarProcessos();
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
          <a href="/admin" style={menuStyle}>
            Dashboard Admin
          </a>

          <a
            href="/admin/processos"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Processos
          </a>

          <a href="/aprovacao-clientes" style={menuStyle}>
            Aprovação Clientes
          </a>
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "38px", margin: 0 }}>Tabela de Processos</h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Gestão interna dos processos e alteração rápida de estados.
          </p>
        </div>

        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Obra</th>
                <th style={thStyle}>Localização</th>
                <th style={thStyle}>Artigos</th>
                <th style={thStyle}>Data</th>
                <th style={thStyle}>Estado</th>
              </tr>
            </thead>

            <tbody>
              {processos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={tdStyle}>
                    Sem processos registados.
                  </td>
                </tr>
              ) : (
                processos
                  .slice()
                  .reverse()
                  .map((processo) => (
                    <tr key={processo.id}>
                      <td style={tdStyle}>{processo.nomeCliente}</td>
                      <td style={tdStyle}>{processo.nomeObra}</td>
                      <td style={tdStyle}>{processo.localizacao || "—"}</td>
                      <td style={tdStyle}>{processo.artigos.length}</td>
                      <td style={tdStyle}>{processo.dataCriacao}</td>
                      <td style={tdStyle}>
                        <select
                          value={processo.estado}
                          onChange={(e) =>
                            atualizarEstado(processo.id, e.target.value)
                          }
                          style={selectStyle}
                        >
                          {ESTADOS.map((estado) => (
                            <option key={estado} value={estado}>
                              {estado}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
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

const tableWrapperStyle: React.CSSProperties = {
  maxWidth: "1200px",
  overflowX: "auto",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: "14px",
  opacity: 0.8,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  verticalAlign: "top",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "180px",
  padding: "10px",
  borderRadius: "8px",
  background: "#1e293b",
  color: "white",
  border: "none",
};