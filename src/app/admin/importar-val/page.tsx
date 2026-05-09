"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import LogoutButton from "@/components/LogoutButton";

type ValDropbox = {
  codigo_val?: string | null;
  nome_pasta?: string | null;
  nome_obra?: string | null;
  nome_cliente?: string | null;
  estado_dropbox?: string | null;
  caminho_dropbox?: string | null;
  ano?: number | string | null;
  [key: string]: any;
};

const ANO_ATUAL = new Date().getFullYear();

export default function ImportarVALPage() {
  const [loading, setLoading] = useState(false);
  const [vals, setVals] = useState<ValDropbox[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [importados, setImportados] = useState<Record<string, boolean>>({});
  const [aImportar, setAImportar] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  const [anoPesquisa, setAnoPesquisa] = useState(String(ANO_ATUAL));
  const [textoPesquisa, setTextoPesquisa] = useState("");
  const [mostrarPesquisaAntiga, setMostrarPesquisaAntiga] = useState(false);

  useEffect(() => {
    function verificarTamanho() {
      setIsMobile(window.innerWidth <= 768);
    }

    verificarTamanho();
    window.addEventListener("resize", verificarTamanho);

    return () => window.removeEventListener("resize", verificarTamanho);
  }, []);

  useEffect(() => {
    void listarVAL(String(ANO_ATUAL));
  }, []);

  const anosDisponiveis = useMemo(() => {
    const anoInicial = ANO_ATUAL;
    return Array.from({ length: 8 }, (_, index) => String(anoInicial - index));
  }, []);

  const valsFiltrados = useMemo(() => {
    const texto = normalizarTexto(textoPesquisa);
    const ano = anoPesquisa.trim();

    return vals.filter((val) => {
      const passaAno = !ano || obterAnoVAL(val) === ano;

      const textoCompleto = normalizarTexto(
        [
          val.codigo_val,
          val.nome_pasta,
          val.nome_obra,
          val.nome_cliente,
          val.estado_dropbox,
          val.caminho_dropbox,
        ]
          .filter(Boolean)
          .join(" "),
      );

      const passaTexto = !texto || textoCompleto.includes(texto);

      return passaAno && passaTexto;
    });
  }, [vals, textoPesquisa, anoPesquisa]);

  async function listarVAL(anoForcado?: string) {
    const anoAUsar = anoForcado || anoPesquisa || String(ANO_ATUAL);

    try {
      setLoading(true);
      setMensagem("");

      const res = await fetch("/api/listar-val-dropbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ano: anoAUsar,
          incluirAnosAntigos: anoAUsar !== String(ANO_ATUAL),
          pesquisa: textoPesquisa.trim() || null,
        }),
      });

      const data = await res.json();

      if (!data?.sucesso) {
        setMensagem(data?.erro || "Erro ao listar VAL.");
        return;
      }

      const listaRecebida = (data?.vals || []) as ValDropbox[];
      setVals(listaRecebida);

      const totalAno = listaRecebida.filter((val) => obterAnoVAL(val) === anoAUsar).length;

      setMensagem(
        anoAUsar === String(ANO_ATUAL)
          ? `VAL de ${anoAUsar} carregados: ${totalAno || listaRecebida.length}.`
          : `Pesquisa em ${anoAUsar} concluída. Resultados encontrados: ${
              totalAno || listaRecebida.length
            }.`,
      );
    } catch (err: any) {
      setMensagem(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function pesquisarVALAntigos() {
    await listarVAL(anoPesquisa);
  }

  async function importarVAL(val: ValDropbox) {
    const chave = obterChaveVAL(val);

    try {
      setMensagem("");

      setAImportar((prev) => ({
        ...prev,
        [chave]: true,
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
        [chave]: true,
      }));

      setMensagem(`${val.codigo_val || "VAL"} importado com sucesso.`);
    } catch (err: any) {
      setMensagem(String(err));
    } finally {
      setAImportar((prev) => ({
        ...prev,
        [chave]: false,
      }));
    }
  }

  function abrirDropbox(caminho: string | null | undefined) {
    if (!caminho) return;
    window.open(`https://www.dropbox.com/home${caminho}`, "_blank");
  }

  function limparPesquisa() {
    setTextoPesquisa("");
    setAnoPesquisa(String(ANO_ATUAL));
    setMostrarPesquisaAntiga(false);
    void listarVAL(String(ANO_ATUAL));
  }

  return (
    <main style={isMobile ? mainMobileStyle : mainStyle}>
      <aside style={isMobile ? asideMobileStyle : asideStyle}>
        <div style={isMobile ? logoMobileStyle : logoStyle}>VALERIE</div>

        <div style={isMobile ? menuContainerMobileStyle : menuContainerStyle}>
          <a href="/admin" style={isMobile ? menuMobileStyle : menuStyle}>
            Dashboard
          </a>
          <a href="/admin/processos" style={isMobile ? menuMobileStyle : menuStyle}>
            Processos
          </a>
          <a href="/admin/clientes" style={isMobile ? menuMobileStyle : menuStyle}>
            Clientes
          </a>
          <a href="/admin/precos" style={isMobile ? menuMobileStyle : menuStyle}>
            Preços
          </a>
          <a href="/admin/financeiro" style={isMobile ? menuMobileStyle : menuStyle}>
            Financeiro
          </a>
          <a href="/admin/calendario" style={isMobile ? menuMobileStyle : menuStyle}>
            Calendário
          </a>
          <a
            href="/admin/importar-val"
            style={{
              ...(isMobile ? menuMobileStyle : menuStyle),
              background: "rgba(255,255,255,0.08)",
            }}
          >
            Importar VAL
          </a>
          <a href="/aprovacao-clientes" style={isMobile ? menuMobileStyle : menuStyle}>
            Aprovação Clientes
          </a>
        </div>

        <div style={{ marginTop: 16 }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={isMobile ? contentMobileStyle : contentStyle}>
        <div style={isMobile ? heroMobileStyle : heroStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>Migração / Arranque</div>
            <h1 style={isMobile ? titleMobileStyle : titleStyle}>
              Importar VAL existentes
            </h1>
            <p style={subtitleStyle}>
              Mostra primeiro os VAL de {ANO_ATUAL}. Para obras antigas, pesquisa pelo
              ano, código VAL, cliente ou nome da obra.
            </p>
          </div>

          <div style={isMobile ? heroActionsMobileStyle : heroActionsStyle}>
            <button
              onClick={() => listarVAL(String(ANO_ATUAL))}
              disabled={loading}
              style={isMobile ? botaoPrincipalMobileStyle : botaoPrincipalStyle}
            >
              {loading ? "A carregar..." : `Listar VAL ${ANO_ATUAL}`}
            </button>

            <button
              onClick={() => setMostrarPesquisaAntiga((prev) => !prev)}
              style={isMobile ? botaoSecundarioMobileStyle : botaoSecundarioStyle}
            >
              {mostrarPesquisaAntiga ? "Fechar pesquisa" : "Pesquisar VAL antigo"}
            </button>
          </div>
        </div>

        {mostrarPesquisaAntiga && (
          <div style={isMobile ? pesquisaCardMobileStyle : pesquisaCardStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Pesquisar VAL antigos</h2>
              <p style={sectionTextStyle}>
                Escolhe o ano e escreve parte do código, cliente, obra ou pasta.
              </p>
            </div>

            <div style={isMobile ? pesquisaGridMobileStyle : pesquisaGridStyle}>
              <div style={campoStyle}>
                <label style={labelStyle}>Ano</label>
                <select
                  value={anoPesquisa}
                  onChange={(event) => setAnoPesquisa(event.target.value)}
                  style={inputStyle}
                >
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano} style={{ color: "black" }}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>

              <div style={campoStyle}>
                <label style={labelStyle}>Pesquisar</label>
                <input
                  value={textoPesquisa}
                  onChange={(event) => setTextoPesquisa(event.target.value)}
                  placeholder="Ex: VAL085.25, cliente, obra..."
                  style={inputStyle}
                />
              </div>

              <button
                onClick={pesquisarVALAntigos}
                disabled={loading}
                style={isMobile ? botaoPrincipalMobileStyle : botaoPrincipalStyle}
              >
                {loading ? "A pesquisar..." : "Pesquisar"}
              </button>

              <button
                onClick={limparPesquisa}
                style={isMobile ? botaoSecundarioMobileStyle : botaoSecundarioStyle}
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}

        <div style={isMobile ? cardMobileStyle : cardStyle}>
          <div style={listHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                {anoPesquisa === String(ANO_ATUAL) && !mostrarPesquisaAntiga
                  ? `VAL de ${ANO_ATUAL}`
                  : `Resultados ${anoPesquisa}`}
              </h2>
              <p style={sectionTextStyle}>
                A mostrar {valsFiltrados.length} de {vals.length} VAL carregados.
              </p>
            </div>
          </div>

          <div style={listaStyle}>
            {valsFiltrados.length === 0 ? (
              <div style={emptyStyle}>
                {vals.length === 0
                  ? `A carregar automaticamente os VAL de ${ANO_ATUAL}. Também podes clicar em “Listar VAL ${ANO_ATUAL}”.`
                  : "Sem resultados para esta pesquisa."}
              </div>
            ) : (
              valsFiltrados.map((val, index) => {
                const chave = obterChaveVAL(val);
                const importado = importados[chave];
                const estaAImportar = aImportar[chave];

                return (
                  <div
                    key={`${chave}-${index}`}
                    style={{
                      ...(isMobile ? valCardMobileStyle : valCardStyle),
                      background: importado
                        ? "rgba(63,163,107,0.14)"
                        : "rgba(255,255,255,0.06)",
                      border: importado
                        ? "1px solid rgba(63,163,107,0.45)"
                        : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={valHeaderStyle}>
                        <strong style={{ fontSize: 18, wordBreak: "break-word" }}>
                          {val.codigo_val || "Sem VAL"}
                        </strong>

                        <span style={anoBadgeStyle}>{obterAnoVAL(val) || "Sem ano"}</span>
                      </div>

                      <div style={{ marginTop: 6, wordBreak: "break-word" }}>
                        {val.nome_pasta || val.nome_obra || "Sem nome"}
                      </div>

                      {val.nome_cliente && (
                        <div style={clienteStyle}>Cliente: {val.nome_cliente}</div>
                      )}

                      <div style={subtextoStyle}>
                        {val.estado_dropbox || "Dropbox"} · {val.caminho_dropbox || ""}
                      </div>
                    </div>

                    <div style={isMobile ? acoesCardMobileStyle : acoesCardStyle}>
                      <button
                        onClick={() => importarVAL(val)}
                        disabled={importado || estaAImportar}
                        style={{
                          ...(isMobile ? botaoImportarMobileStyle : botaoImportarStyle),
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
                        style={isMobile ? botaoSecundarioMobileStyle : botaoSecundarioStyle}
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

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function obterChaveVAL(val: ValDropbox) {
  return String(val.codigo_val || val.caminho_dropbox || val.nome_pasta || crypto.randomUUID());
}

function obterAnoVAL(val: ValDropbox) {
  if (val.ano) return String(val.ano);

  const fontes = [val.codigo_val, val.nome_pasta, val.nome_obra, val.caminho_dropbox]
    .filter(Boolean)
    .map(String)
    .join(" ");

  const anoCompleto = fontes.match(/\b(20\d{2})\b/);
  if (anoCompleto?.[1]) return anoCompleto[1];

  const sufixoVal = fontes.match(/VAL[\s._-]*\d+[\s._-]*(\d{2})\b/i);
  if (sufixoVal?.[1]) return `20${sufixoVal[1]}`;

  return "";
}

/* DESKTOP ORIGINAL */

const mainStyle: CSSProperties = {
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: 260,
  minHeight: "100dvh",
  padding: "30px 20px",
  background: "rgba(0,0,0,0.14)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  flexShrink: 0,
  boxSizing: "border-box",
};

const logoStyle: CSSProperties = {
  fontSize: 36,
  letterSpacing: 9,
  marginBottom: 36,
};

const menuContainerStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const menuStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: 40,
  overflowX: "hidden",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  padding: 28,
  borderRadius: 22,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 20,
  overflow: "hidden",
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
  fontSize: 38,
  wordBreak: "break-word",
};

const subtitleStyle: CSSProperties = {
  marginTop: 10,
  opacity: 0.82,
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const cardStyle: CSSProperties = {
  padding: 24,
  borderRadius: 18,
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
  gridTemplateColumns: "1fr 180px",
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
  boxSizing: "border-box",
};

const botaoImportarStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(63,163,107,0.45)",
  color: "white",
  fontWeight: "bold",
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

const heroActionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  flexShrink: 0,
};

const pesquisaCardStyle: CSSProperties = {
  padding: 22,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 18,
  boxSizing: "border-box",
};

const pesquisaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "160px 1fr auto auto",
  gap: 12,
  alignItems: "end",
  marginTop: 14,
};

const campoStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: "bold",
  opacity: 0.82,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const sectionTextStyle: CSSProperties = {
  margin: "6px 0 0",
  opacity: 0.75,
  fontSize: 14,
};

const listHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
};

const valHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const anoBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "4px 8px",
  borderRadius: 999,
  background: "rgba(92,115,199,0.22)",
  border: "1px solid rgba(92,115,199,0.45)",
  fontSize: 12,
  fontWeight: "bold",
};

const clienteStyle: CSSProperties = {
  marginTop: 6,
  opacity: 0.86,
  fontSize: 14,
};

/* MOBILE */

const mainMobileStyle: CSSProperties = {
  ...mainStyle,
  flexDirection: "column",
  overflowX: "hidden",
};

const asideMobileStyle: CSSProperties = {
  width: "100%",
  minHeight: "auto",
  padding: "18px 16px",
  background: "rgba(0,0,0,0.14)",
  borderRight: "none",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxSizing: "border-box",
  flexShrink: 0,
};

const logoMobileStyle: CSSProperties = {
  fontSize: 28,
  letterSpacing: 6,
  marginBottom: 18,
};

const menuContainerMobileStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: 12,
  overflowX: "auto",
  paddingBottom: 6,
};

const menuMobileStyle: CSSProperties = {
  ...menuStyle,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const contentMobileStyle: CSSProperties = {
  flex: 1,
  padding: 16,
  overflowX: "hidden",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroMobileStyle: CSSProperties = {
  ...heroStyle,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
  padding: 18,
  borderRadius: 18,
  boxSizing: "border-box",
};

const titleMobileStyle: CSSProperties = {
  ...titleStyle,
  fontSize: 30,
};

const cardMobileStyle: CSSProperties = {
  ...cardStyle,
  padding: 18,
};

const valCardMobileStyle: CSSProperties = {
  ...valCardStyle,
  gridTemplateColumns: "1fr",
};

const acoesCardMobileStyle: CSSProperties = {
  ...acoesCardStyle,
  gridTemplateColumns: "1fr",
};

const botaoPrincipalMobileStyle: CSSProperties = {
  ...botaoPrincipalStyle,
  width: "100%",
};

const botaoImportarMobileStyle: CSSProperties = {
  ...botaoImportarStyle,
  width: "100%",
};

const botaoSecundarioMobileStyle: CSSProperties = {
  ...botaoSecundarioStyle,
  width: "100%",
};

const heroActionsMobileStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  width: "100%",
};

const pesquisaCardMobileStyle: CSSProperties = {
  ...pesquisaCardStyle,
  padding: 18,
};

const pesquisaGridMobileStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
  marginTop: 14,
};
