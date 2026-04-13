"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AdminDashboardPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);

  useEffect(() => {
    const guardados = localStorage.getItem("valerie_processos");
    const lista: Processo[] = guardados ? JSON.parse(guardados) : [];
    setProcessos(lista);
  }, []);

  const resumo = useMemo(() => {
    return {
      total: processos.length,
      submetidos: processos.filter((p) => p.estado === "Pedido Submetido").length,
      analise: processos.filter((p) => p.estado === "Em Análise").length,
      enviados: processos.filter((p) => p.estado === "Orçamento Enviado").length,
      adjudicados: processos.filter((p) => p.estado === "Adjudicado").length,
      producao: processos.filter((p) => p.estado === "Em Produção").length,
      montagem: processos.filter((p) => p.estado === "Em Montagem").length,
      concluidos: processos.filter((p) => p.estado === "Concluído").length,
      naoAdjudicados: processos.filter((p) => p.estado === "Não Adjudicado").length,
    };
  }, [processos]);

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
          <a
            href="/admin"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Dashboard Admin
          </a>

          <a href="/admin/processos" style={menuStyle}>
            Processos
          </a>

          <a href="/aprovacao-clientes" style={menuStyle}>
            Aprovação Clientes
          </a>

          <a href="/login" style={menuStyle}>
            Ir para Login
          </a>
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "38px", margin: 0 }}>Dashboard Admin</h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Vista geral dos processos e do estado atual da operação.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            maxWidth: "1200px",
            marginBottom: "24px",
          }}
        >
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Total Processos</div>
            <div style={statValueStyle}>{resumo.total}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>Pedidos Submetidos</div>
            <div style={statValueStyle}>{resumo.submetidos}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>Em Análise</div>
            <div style={statValueStyle}>{resumo.analise}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>Orçamentos Enviados</div>
            <div style={statValueStyle}>{resumo.enviados}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>Adjudicados</div>
            <div style={statValueStyle}>{resumo.adjudicados}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>Em Produção</div>
            <div style={statValueStyle}>{resumo.producao}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>Em Montagem</div>
            <div style={statValueStyle}>{resumo.montagem}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>Concluídos</div>
            <div style={statValueStyle}>{resumo.concluidos}</div>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1200px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Acesso Rápido</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <a href="/admin/processos" style={atalhoStyle}>
                Gerir Processos
              </a>

              <a href="/aprovacao-clientes" style={atalhoStyle}>
                Aprovar Clientes
              </a>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Resumo Comercial</h2>

            <p style={textoStyle}>
              <strong>Não Adjudicados:</strong> {resumo.naoAdjudicados}
            </p>
            <p style={textoStyle}>
              <strong>Taxa bruta de adjudicação:</strong>{" "}
              {resumo.total > 0
                ? `${Math.round((resumo.adjudicados / resumo.total) * 100)}%`
                : "0%"}
            </p>
            <p style={textoStyle}>
              <strong>Próximo passo:</strong> depois metemos aqui os gráficos por cliente.
            </p>
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

const statCardStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const statLabelStyle: React.CSSProperties = {
  opacity: 0.75,
  fontSize: "13px",
  marginBottom: "8px",
};

const statValueStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
};

const atalhoStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
};

const textoStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "10px",
};