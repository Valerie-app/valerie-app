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
        texto: `Email enviado para a contabilidade para emissão da fatura proforma às ${horaFormatada}`,
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
            href="/"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Dashboard
          </a>

          <a
            href="/novo-orcamento"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Novo Orçamento
          </a>

          <a
            href="/processos"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Os Meus Processos
          </a>

          <a
            href="/documentos"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Documentos
          </a>

          <a
            href="/mensagens"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Mensagens
          </a>

          <a
            href="/perfil"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Perfil
          </a>
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "38px", margin: 0 }}>Moradia Vila Verde</h1>
            <p style={{ opacity: 0.8, marginTop: "10px" }}>
              Processo PR-1351 • Braga
            </p>
          </div>

          {estado !== "Validado" ? (
            <button
              onClick={validarOrcamento}
              style={{
                background: "#3fa36b",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "14px 20px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              ✔ Validar Orçamento
            </button>
          ) : (
            <div
              style={{
                background: "rgba(63, 163, 107, 0.2)",
                color: "#c8f5d8",
                padding: "14px 18px",
                borderRadius: "10px",
                fontWeight: "bold",
              }}
            >
              Orçamento Validado
            </div>
          )}
        </div>

        {mensagem && (
          <div
            style={{
              marginBottom: "20px",
              padding: "16px 18px",
              borderRadius: "12px",
              background: "rgba(63, 163, 107, 0.15)",
              border: "1px solid rgba(63, 163, 107, 0.3)",
              color: "#dff7e7",
            }}
          >
            {mensagem}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Resumo do Processo</h2>
            <p>
              <strong>Estado:</strong> {estado}
            </p>
            <p>
              <strong>Data da submissão:</strong> 27/04/2024
            </p>
            <p>
              <strong>Número de artigos:</strong> 3
            </p>
          </div>

          <div
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Documentos Disponíveis</h2>
            <p>Orçamento_1351.pdf</p>

            <button
              style={{
                marginTop: "10px",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "10px 14px",
              }}
            >
              Ver Orçamento
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Artigos do Pedido</h2>
            <p>Roupeiro — 250 x 300 x 60 cm</p>
            <p>Móvel TV — 200 x 45 cm</p>
            <p>Móvel WC — 100 x 50 cm</p>
          </div>

          <div
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Próxima Etapa</h2>
            <p style={{ opacity: 0.85 }}>
              Após a validação do orçamento, a equipa será notificada para emissão
              da fatura proforma e seguimento do processo.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Histórico do Processo</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {historico.map((evento, index) => (
              <div
                key={index}
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {evento.texto}
                </div>
                <div style={{ opacity: 0.7, fontSize: "14px" }}>{evento.data}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}