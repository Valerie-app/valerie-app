"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

type Operador = {
  id: string;
  nome: string;
};

const tarefas = [
  { nome: "SECCIONADORA", icone: "🪚", descricao: "Corte e seccionamento" },
  { nome: "CNC", icone: "⚙️", descricao: "Maquinação CNC" },
  { nome: "ORLADORA", icone: "🧵", descricao: "Aplicação de orla" },
  { nome: "ESQUADREJADEIRA", icone: "📐", descricao: "Acerto e esquadria" },
  { nome: "PRENSA", icone: "🧱", descricao: "Prensagem" },
  { nome: "CALIBRADORA", icone: "📏", descricao: "Calibração" },
  { nome: "MARCENEIROS", icone: "🔧", descricao: "Montagem / acabamento" },
];

export default function ProducaoPage() {
  const [codigoVal, setCodigoVal] = useState("");
  const [lote, setLote] = useState(1);
  const [artigoId, setArtigoId] = useState("");
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [operadoresSelecionados, setOperadoresSelecionados] = useState<string[]>([]);
  const [tipoTrabalho, setTipoTrabalho] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [ultimoEstado, setUltimoEstado] = useState("");
  const [inicioCronometro, setInicioCronometro] = useState<Date | null>(null);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCodigoVal(params.get("codigo_val") || "");
    setLote(Number(params.get("lote") || 1));
    setArtigoId(params.get("artigo_id") || "");

    void carregarOperadores();
  }, []);

  useEffect(() => {
    if (!inicioCronometro || ultimoEstado !== "iniciado") return;

    const interval = window.setInterval(() => {
      const diff = Math.floor((Date.now() - inicioCronometro.getTime()) / 1000);
      setSegundos(diff);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [inicioCronometro, ultimoEstado]);

  const tarefaSelecionada = useMemo(
    () => tarefas.find((tarefa) => tarefa.nome === tipoTrabalho),
    [tipoTrabalho]
  );

  async function carregarOperadores() {
    const { data, error } = await supabase
      .from("operadores")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      setMensagem("Erro ao carregar operadores.");
      return;
    }

    setOperadores(data || []);
  }

  function formatarTempo(totalSegundos: number) {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segs = totalSegundos % 60;

    return [horas, minutos, segs]
      .map((valor) => String(valor).padStart(2, "0"))
      .join(":");
  }

  function alternarOperador(nome: string) {
    setOperadoresSelecionados((prev) => {
      if (prev.includes(nome)) {
        return prev.filter((operador) => operador !== nome);
      }

      return [...prev, nome];
    });
  }

  function alternarTodosOperadores() {
    if (operadoresSelecionados.length === operadores.length) {
      setOperadoresSelecionados([]);
      return;
    }

    setOperadoresSelecionados(operadores.map((operador) => operador.nome));
  }

  async function registar(estado: string) {
    try {
      setAEnviar(true);
      setMensagem("");

      if (!codigoVal) {
        setMensagem("Falta o código VAL no QR Code.");
        return;
      }

      if (!tipoTrabalho || operadoresSelecionados.length === 0) {
        setMensagem("Seleciona a tarefa e pelo menos um operador.");
        return;
      }

      const resultados = await Promise.all(
        operadoresSelecionados.map(async (operador) => {
          const res = await fetch("/api/registar-tempo-producao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              codigo_val: codigoVal,
              lote,
              artigo_id: artigoId || null,
              tipo_trabalho: tipoTrabalho,
              operador,
              estado,
            }),
          });

          const data = await res.json();

          return {
            operador,
            sucesso: Boolean(data.sucesso),
            erro: data.erro || "Erro ao registar.",
          };
        })
      );

      const falhados = resultados.filter((resultado) => !resultado.sucesso);

      if (falhados.length > 0) {
        setMensagem(
          `Erro em ${falhados.length} operador(es): ${falhados
            .map((resultado) => resultado.operador)
            .join(", ")}`
        );
        return;
      }

      setUltimoEstado(estado);

      if (estado === "iniciado") {
        setInicioCronometro(new Date());
        setSegundos(0);
      }

      if (estado === "terminado") {
        setInicioCronometro(null);
      }

      setMensagem(
        `Registo ${estado} com sucesso para ${operadoresSelecionados.length} operador(es).`
      );
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao registar.");
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={phoneStyle}>
        <header style={headerStyle}>
          <div style={backButtonStyle}>‹</div>
          <div>
            <div style={headerTitleStyle}>Produção</div>
            <div style={headerSubtitleStyle}>{codigoVal || "VAL não definido"}</div>
          </div>
          <div style={avatarStyle}>👥</div>
        </header>

        <section style={obraCardStyle}>
          <div>
            <div style={labelAzulStyle}>▣ OBRA</div>
            <h1 style={obraTitleStyle}>{codigoVal || "VAL não definido"}</h1>
            <p style={obraLineStyle}>📦 Lote {lote}</p>
            {artigoId && <p style={obraLineStyle}>🏷️ Artigo associado</p>}
          </div>

          <div style={miniImageStyle}>
            <span>VAL</span>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span>Operadores</span>
            <button type="button" onClick={alternarTodosOperadores} style={miniButtonStyle}>
              {operadoresSelecionados.length === operadores.length ? "Limpar" : "Todos"}
            </button>
          </div>

          <div style={operadoresGridStyle}>
            {operadores.length === 0 ? (
              <div style={emptyStyle}>Sem operadores ativos.</div>
            ) : (
              operadores.map((op) => {
                const ativo = operadoresSelecionados.includes(op.nome);

                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => alternarOperador(op.nome)}
                    style={{
                      ...operadorButtonStyle,
                      ...(ativo ? operadorSelecionadoStyle : {}),
                    }}
                  >
                    <span style={operadorAvatarStyle}>
                      {op.nome.slice(0, 1).toUpperCase()}
                    </span>
                    <span style={{ flex: 1 }}>{op.nome}</span>
                    <span style={checkStyle}>{ativo ? "✓" : ""}</span>
                  </button>
                );
              })
            )}
          </div>

          <div style={sectionHeaderStyle}>
            <span>Tarefas de produção</span>
            <span style={pillStyle}>{tarefas.length} tarefas</span>
          </div>

          <div style={tarefasGridStyle}>
            {tarefas.map((tarefa) => {
              const ativa = tipoTrabalho === tarefa.nome;

              return (
                <button
                  key={tarefa.nome}
                  type="button"
                  onClick={() => setTipoTrabalho(tarefa.nome)}
                  style={{
                    ...tarefaButtonStyle,
                    ...(ativa ? tarefaSelecionadaStyle : {}),
                  }}
                >
                  <span style={taskIconStyle}>{tarefa.icone}</span>
                  <span style={{ flex: 1 }}>
                    <strong>{tarefa.nome}</strong>
                    <small style={taskSmallStyle}>
                      {ativa
                        ? ultimoEstado === "iniciado"
                          ? "Em progresso"
                          : "Selecionada"
                        : tarefa.descricao}
                    </small>
                  </span>
                  <span style={chevronStyle}>›</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={activeCardStyle}>
          <div style={labelAzulStyle}>
            {tarefaSelecionada?.nome || "Selecionar tarefa"}
          </div>

          <h2 style={estadoTitleStyle}>
            {tipoTrabalho
              ? ultimoEstado === "iniciado"
                ? "Em progresso"
                : "Pronta para iniciar"
              : "Escolhe uma tarefa"}
          </h2>

          <p style={obraLineStyle}>
            {operadoresSelecionados.length > 0
              ? `👥 ${operadoresSelecionados.length} operador(es): ${operadoresSelecionados.join(", ")}`
              : "👥 Operadores por selecionar"}
          </p>

          <div style={timerStyle}>{formatarTempo(segundos)}</div>

          <div style={acoesStyle}>
            <button
              type="button"
              onClick={() => registar("iniciado")}
              disabled={aEnviar}
              style={botaoIniciarStyle}
            >
              ▶ Iniciar
            </button>

            <button
              type="button"
              onClick={() => registar("pausado")}
              disabled={aEnviar}
              style={botaoPausarStyle}
            >
              ⏸ Pausar
            </button>

            <button
              type="button"
              onClick={() => registar("terminado")}
              disabled={aEnviar}
              style={botaoTerminarStyle}
            >
              ■ Terminar
            </button>
          </div>
        </section>

        <section style={notaCardStyle}>
          <strong>Notas</strong>
          <p style={{ margin: "8px 0 0", opacity: 0.7 }}>
            Podes selecionar vários operadores. O sistema cria um registo separado para cada operador.
          </p>
        </section>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #1d2f5a 0%, #101a31 45%, #070d1b 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const phoneStyle: CSSProperties = {
  width: "100%",
  maxWidth: 430,
  minHeight: "calc(100dvh - 32px)",
  borderRadius: 32,
  background:
    "linear-gradient(180deg, rgba(14,26,49,0.98), rgba(7,13,27,0.98))",
  border: "1px solid rgba(130,160,220,0.22)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  padding: 18,
  display: "grid",
  gap: 14,
};

const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px 1fr 42px",
  alignItems: "center",
  gap: 10,
  padding: "4px 2px 8px",
};

const backButtonStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  fontSize: 34,
  background: "rgba(255,255,255,0.06)",
  color: "#dbe8ff",
};

const avatarStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.12)",
};

const headerTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

const headerSubtitleStyle: CSSProperties = {
  marginTop: 2,
  color: "#68a8ff",
  fontWeight: 800,
};

const obraCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 112px",
  gap: 12,
  padding: 16,
  borderRadius: 18,
  background:
    "linear-gradient(135deg, rgba(20,43,78,0.95), rgba(14,28,55,0.96))",
  border: "1px solid rgba(115,150,210,0.18)",
};

const labelAzulStyle: CSSProperties = {
  color: "#6db2ff",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

const obraTitleStyle: CSSProperties = {
  margin: "8px 0",
  fontSize: 24,
  lineHeight: 1.1,
};

const obraLineStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "rgba(255,255,255,0.72)",
  fontSize: 14,
};

const miniImageStyle: CSSProperties = {
  borderRadius: 14,
  background:
    "linear-gradient(135deg, rgba(104,168,255,0.22), rgba(255,255,255,0.08))",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  color: "#dbe8ff",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "rgba(255,255,255,0.66)",
  textTransform: "uppercase",
  fontSize: 12,
  letterSpacing: 0.6,
  fontWeight: 800,
};

const pillStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.70)",
  textTransform: "none",
  letterSpacing: 0,
};

const miniButtonStyle: CSSProperties = {
  border: "1px solid rgba(104,168,255,0.35)",
  background: "rgba(104,168,255,0.12)",
  color: "#dbe8ff",
  borderRadius: 999,
  padding: "6px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const operadoresGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const operadorButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 10,
  minHeight: 48,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(20,36,67,0.92)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "left",
};

const operadorSelecionadoStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(63,163,107,0.72), rgba(25,93,65,0.88))",
  border: "1px solid rgba(116,255,175,0.45)",
};

const operadorAvatarStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.14)",
  fontSize: 13,
};

const checkStyle: CSSProperties = {
  marginLeft: "auto",
  color: "#d9ffe8",
  fontWeight: 900,
};

const emptyStyle: CSSProperties = {
  gridColumn: "1 / -1",
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.70)",
};

const tarefasGridStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const tarefaButtonStyle: CSSProperties = {
  width: "100%",
  padding: 13,
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(20,36,67,0.92)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
  textAlign: "left",
};

const tarefaSelecionadaStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(30,72,122,0.96), rgba(23,55,100,0.96))",
  border: "1px solid rgba(104,168,255,0.42)",
  boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
};

const taskIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 13,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.08)",
  fontSize: 22,
};

const taskSmallStyle: CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "rgba(255,255,255,0.58)",
  fontWeight: 500,
};

const chevronStyle: CSSProperties = {
  fontSize: 28,
  color: "rgba(255,255,255,0.45)",
};

const activeCardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background:
    "linear-gradient(135deg, rgba(13,37,73,0.96), rgba(12,25,50,0.96))",
  border: "1px solid rgba(104,168,255,0.18)",
};

const estadoTitleStyle: CSSProperties = {
  margin: "8px 0 4px",
  fontSize: 24,
};

const timerStyle: CSSProperties = {
  marginTop: 16,
  padding: "18px 10px",
  borderRadius: 14,
  background: "rgba(7,18,38,0.82)",
  border: "1px solid rgba(104,168,255,0.12)",
  textAlign: "center",
  fontSize: 44,
  fontWeight: 900,
  letterSpacing: 1.5,
};

const acoesStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 10,
  marginTop: 12,
};

const botaoBaseStyle: CSSProperties = {
  padding: "14px 8px",
  borderRadius: 12,
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: 14,
};

const botaoIniciarStyle: CSSProperties = {
  ...botaoBaseStyle,
  background: "rgba(63, 163, 107, 0.75)",
  border: "1px solid rgba(63, 163, 107, 0.75)",
};

const botaoPausarStyle: CSSProperties = {
  ...botaoBaseStyle,
  background: "rgba(244, 180, 0, 0.78)",
  border: "1px solid rgba(244, 180, 0, 0.75)",
  color: "#1b1b1b",
};

const botaoTerminarStyle: CSSProperties = {
  ...botaoBaseStyle,
  background: "rgba(205, 72, 72, 0.82)",
  border: "1px solid rgba(205, 72, 72, 0.75)",
};

const notaCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const mensagemStyle: CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
};
