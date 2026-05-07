"use client";

import { useState, type CSSProperties } from "react";
import LogoutButton from "@/components/LogoutButton";

export default function ImportarVALPage() {
  const [loading, setLoading] = useState(false);
  const [vals, setVals] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [importados, setImportados] = useState<Record<string, boolean>>({});
  const [aImportar, setAImportar] = useState<Record<string, boolean>>({});

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

      setAImportar((prev) => ({
        ...prev,
        [val.codigo_val]: true,
      }));

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

      setImportados((prev) => ({
        ...prev,
        [val.codigo_val]: true,
      }));

      setMensagem(`${val.codigo_val} importado com sucesso.`);
    } catch (err: any) {
      setMensagem(String(err));
    } finally {
      setAImportar((prev) => ({
        ...prev,
        [val.codigo_val]: false,
      }));
    }
  }

  function abrirDropbox(caminho: string) {
    if (!caminho) return;
    window.open(`https://www.dropbox.com/home${caminho}`, "_blank");
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          <a href="/admin" style={menuStyle}>Dashboard</a>
          <a href="/admin/processos" style={menuStyle}>Processos</a>
          <a href="/admin/clientes" style={menuStyle}>Clientes</a>
          <a href="/admin/precos" style={menuStyle}>Preços</a>
          <a href="/admin/financeiro" style={menuStyle}>Financeiro</a>
          <a href="/admin/calendario" style={menuStyle}>Calendário</a>
          <a href="/admin/importar-val" style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}>
            Importar VAL
          </a>
          <a href="/aprovacao-clientes" style={menuStyle}>Aprovação Clientes</a>
        </div>

        <div style={{ marginTop: 16 }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle}>
        <div style={heroStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>Migração / Arranque</div>
            <h1 style={titleStyle}>Importar VAL existentes</h1>
            <p style={subtitleStyle}>
              Lê os VAL já criados manualmente no Dropbox e importa para a app.
            </p>
          </div>

          <button
            onClick={listarVAL}
            disabled={loading}
            style={botaoPrincipalStyle}
          >
            {loading ? "A carregar..." : "Listar VAL Dropbox"}
          </button>
        </div>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}

        <div style={cardStyle}>
          <div style={listaStyle}>
            {vals.length === 0 ? (
              <div style={emptyStyle}>
                Clica em “Listar VAL Dropbox” para carregar os VAL.
              </div>
            ) : (
              vals.map((val, index) => {
                const importado = importados[val.codigo_val];
                const estaAImportar = aImportar[val.codigo_val];

                return (
                  <div
                    key={`${val.codigo_val}-${index}`}
                    style={{
                      ...valCardStyle,
                      background: importado
                        ? "rgba(63,163,107,0.14)"
                        : "rgba(255,255,255,0.06)",
                      border: importado
                        ? "1px solid rgba(63,163,107,0.45)"
                        : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 18, wordBreak: "break-word" }}>
                        {val.codigo_val || "Sem VAL"}
                      </strong>

                      <div style={{ marginTop: 6, wordBreak: "break-word" }}>
                        {val.nome_pasta || val.nome_obra || "Sem nome"}
                      </div>

                      <div style={subtextoStyle}>
                        {val.estado_dropbox || "Dropbox"} · {val.caminho_dropbox || ""}
                      </div>
                    </div>

                    <div style={acoesCardStyle}>
                      <button
                        onClick={() => importarVAL(val)}
                        disabled={importado || estaAImportar}
                        style={{
                          ...botaoImportarStyle,
                          cursor: importado || estaAImportar ? "not-allowed" : "pointer",
                          background: importado
                            ? "rgba(63,163,107,0.35)"
                            : "rgba(63,163,107,0.22)",
                        }}
                      >
                        {importado
                          ? "Importado ✅"
                          : estaAImportar
                          ? "A importar..."
                          : "Importar VAL"}
                      </button>

                      <button
                        onClick={() => abrirDropbox(val.caminho_dropbox)}
                        style={botaoSecundarioStyle}
                      >
                        Abrir Dropbox
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  flexDirection: "column",
  overflowX: "hidden",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: "100%",
  minHeight: "auto",
  padding: "18px 16px",
  background: "rgba(0,0,0,0.14)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxSizing: "border-box",
  flexShrink: 0,
};

const logoStyle: CSSProperties = {
  fontSize: 28,
  letterSpacing: 6,
  marginBottom: 18,
};

const menuContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: 12,
  overflowX: "auto",
  paddingBottom: 6,
};

const menuStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: 16,
  overflowX: "hidden",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  alignItems: "flex-start",
  gap: 16,
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 20,
  overflow: "hidden",
  boxSizing: "border-box",
};

const eyebrowStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  wordBreak: "break-word",
};

const subtitleStyle: CSSProperties = {
  marginTop: 10,
  opacity: 0.82,
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const cardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const listaStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const valCardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
  alignItems: "center",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const acoesCardStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  width: "100%",
};

const subtextoStyle: CSSProperties = {
  marginTop: 6,
  opacity: 0.75,
  fontSize: 13,
  wordBreak: "break-all",
};

const emptyStyle: CSSProperties = {
  padding: 18,
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  opacity: 0.75,
  wordBreak: "break-word",
};

const botaoPrincipalStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
  boxSizing: "border-box",
};

const botaoImportarStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(63,163,107,0.45)",
  color: "white",
  fontWeight: "bold",
  width: "100%",
  boxSizing: "border-box",
};

const botaoSecundarioStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
  boxSizing: "border-box",
};

const mensagemStyle: CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 12,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  wordBreak: "break-word",
};
