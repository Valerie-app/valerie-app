"use client";

import { useState } from "react";

type EventoHistorico = {
  data: string;
  texto: string;
};

export default function ProcessoDetalhePage() {
  const [estado, setEstado] = useState("Orçamento Enviado");
  const [mensagem, setMensagem] = useState("");
  const [historico, setHistorico] = useState<EventoHistorico[]>([
    { data: "24/04/2024", texto: "Pedido submetido" },
    { data: "25/04/2024", texto: "Em análise" },
    { data: "27/04/2024", texto: "Orçamento enviado" },
  ]);

  async function validarOrcamento() {
    const agora = new Date();

    const dataFormatada = agora.toLocaleDateString("pt-PT");
    const horaFormatada = agora.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setEstado("Validado");
    setMensagem(
      `Orçamento validado com sucesso em ${dataFormatada} às ${horaFormatada}. Email enviado para a contabilidade.`
    );

    setHistorico((anterior) => [
      ...anterior,
      {
        data: dataFormatada,
        texto: `Orçamento validado pelo cliente às ${horaFormatada}`,
      },
      {
        data: dataFormatada,
        texto: `Email enviado para a contabilidade às ${horaFormatada}`,
      },
    ]);

    try {
      await fetch("/api/validar-orcamento", {
        method: "POST",
      });
    } catch (error) {
      console.error("Erro ao chamar a rota:", error);
    }
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuStyle}>
          <a href="/dashboard-cliente" style={linkStyle}>Dashboard</a>
          <a href="/novo-orcamento-cliente" style={linkStyle}>Novo Orçamento</a>
          <a href="/processos-cliente" style={linkActiveStyle}>Processos</a>
          <a href="#" style={linkStyle}>Documentos</a>
          <a href="#" style={linkStyle}>Mensagens</a>
          <a href="/perfil-cliente" style={linkStyle}>Perfil</a>
        </div>
      </aside>

      <section style={contentStyle}>
        <div style={topoStyle}>
          <div>
            <h1 style={{ margin: 0 }}>Moradia Vila Verde</h1>
            <p style={{ opacity: 0.8 }}>Processo PR-1351 • Braga</p>
          </div>

          {estado !== "Validado" ? (
            <button onClick={validarOrcamento} style={botaoValidarStyle}>
              ✔ Validar Orçamento
            </button>
          ) : (
            <div style={estadoValidadoStyle}>Orçamento Validado</div>
          )}
        </div>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}

        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2>Resumo</h2>
            <p><strong>Estado:</strong> {estado}</p>
            <p><strong>Data:</strong> 27/04/2024</p>
            <p><strong>Artigos:</strong> 3</p>
          </div>

          <div style={cardStyle}>
            <h2>Documentos</h2>
            <p>Orçamento_1351.pdf</p>
            <button style={botaoSecundarioStyle}>Ver Orçamento</button>
          </div>
        </div>

        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2>Artigos</h2>
            <p>Roupeiro — 250 x 300 x 60 cm</p>
            <p>Móvel TV — 200 x 45 cm</p>
            <p>Móvel WC — 100 x 50 cm</p>
          </div>

          <div style={cardStyle}>
            <h2>Próxima Etapa</h2>
            <p style={{ opacity: 0.8 }}>
              Após validação, será emitida a fatura proforma.
            </p>
          </div>
        </div>

        <div style={cardStyle}>
          <h2>Histórico</h2>
          {historico.map((evento, i) => (
            <div key={i} style={historicoItemStyle}>
              <strong>{evento.texto}</strong>
              <div style={{ opacity: 0.7 }}>{evento.data}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* STYLES */

const mainStyle = {
  minHeight: "100vh",
  display: "flex",
  background: "#1f2540",
  color: "white",
  fontFamily: "Arial",
};

const asideStyle = {
  width: "260px",
  padding: "30px 20px",
  background: "rgba(0,0,0,0.2)",
};

const logoStyle = {
  fontSize: "32px",
  marginBottom: "30px",
};

const menuStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const linkStyle = {
  padding: "12px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  textDecoration: "none",
};

const linkActiveStyle = {
  ...linkStyle,
  background: "rgba(255,255,255,0.1)",
};

const contentStyle = {
  flex: 1,
  padding: "40px",
};

const topoStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "20px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "20px",
};

const cardStyle = {
  padding: "20px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
};

const botaoValidarStyle = {
  background: "#3fa36b",
  color: "white",
  border: "none",
  padding: "12px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};

const estadoValidadoStyle = {
  background: "rgba(63,163,107,0.2)",
  padding: "12px",
  borderRadius: "8px",
};

const mensagemStyle = {
  marginBottom: "20px",
  padding: "12px",
  background: "rgba(63,163,107,0.2)",
  borderRadius: "8px",
};

const historicoItemStyle = {
  padding: "10px",
  marginTop: "10px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
};

const botaoSecundarioStyle = {
  marginTop: "10px",
  background: "rgba(255,255,255,0.1)",
  color: "white",
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
};