"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Operador = {
  id: string;
  nome: string;
};

const tarefas = [
  "SECCIONADORA",
  "CNC",
  "ORLADORA",
  "ESQUADREJADEIRA",
  "PRENSA",
  "CALIBRADORA",
  "MARCENEIROS",
];

export default function ProducaoPage() {
  const [codigoVal, setCodigoVal] = useState("");
  const [lote, setLote] = useState(1);
  const [operador, setOperador] = useState("");
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [tipoTrabalho, setTipoTrabalho] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCodigoVal(params.get("codigo_val") || "");
    setLote(Number(params.get("lote") || 1));

    carregarOperadores();
  }, []);

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

  async function registar(estado: string) {
    try {
      setAEnviar(true);
      setMensagem("");

      if (!codigoVal) {
        setMensagem("Falta o código VAL no QR Code.");
        return;
      }

      if (!operador || !tipoTrabalho) {
        setMensagem("Seleciona o operador e o tipo de trabalho.");
        return;
      }

      const res = await fetch("/api/registar-tempo-producao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_val: codigoVal,
          lote,
          tipo_trabalho: tipoTrabalho,
          operador,
          estado,
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        setMensagem(data.erro || "Erro ao registar.");
        return;
      }

      setMensagem(`Registo ${estado} com sucesso.`);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao registar.");
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <div style={topoStyle}>
          <div>
            <div style={eyebrowStyle}>Produção</div>
            <h1 style={tituloStyle}>{codigoVal || "VAL não definido"}</h1>
            <p style={subtextoStyle}>Lote {lote}</p>
          </div>
        </div>

        <label style={labelStyle}>Operador</label>
        <select
          value={operador}
          onChange={(e) => setOperador(e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecionar operador</option>
          {operadores.map((op) => (
            <option key={op.id} value={op.nome}>
              {op.nome}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Tipo de trabalho</label>

        <div style={tarefasGridStyle}>
          {tarefas.map((tarefa) => (
            <button
              key={tarefa}
              type="button"
              onClick={() => setTipoTrabalho(tarefa)}
              style={{
                ...tarefaButtonStyle,
                ...(tipoTrabalho === tarefa ? tarefaSelecionadaStyle : {}),
              }}
            >
              {tarefa}
            </button>
          ))}
        </div>

        <div style={acoesStyle}>
          <button
            type="button"
            onClick={() => registar("iniciado")}
            disabled={aEnviar}
            style={botaoIniciarStyle}
          >
            Iniciar
          </button>

          <button
            type="button"
            onClick={() => registar("pausado")}
            disabled={aEnviar}
            style={botaoPausarStyle}
          >
            Pausar
          </button>

          <button
            type="button"
            onClick={() => registar("terminado")}
            disabled={aEnviar}
            style={botaoTerminarStyle}
          >
            Terminar
          </button>
        </div>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}
      </section>
    </main>
  );
}

const mainStyle = {
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle = {
  width: "100%",
  maxWidth: 520,
  padding: 24,
  borderRadius: 22,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
};

const topoStyle = {
  marginBottom: 24,
};

const eyebrowStyle = {
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  opacity: 0.7,
  marginBottom: 8,
};

const tituloStyle = {
  margin: 0,
  fontSize: 34,
};

const subtextoStyle = {
  opacity: 0.8,
  marginTop: 8,
};

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  marginBottom: 8,
  marginTop: 18,
};

const inputStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
};

const tarefasGridStyle = {
  display: "grid",
  gap: 10,
};

const tarefaButtonStyle = {
  width: "100%",
  padding: 15,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: "bold",
  textAlign: "left" as const,
  cursor: "pointer",
};

const tarefaSelecionadaStyle = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  border: "1px solid rgba(157,245,180,0.40)",
};

const acoesStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 10,
  marginTop: 24,
};

const botaoBaseStyle = {
  padding: "14px 10px",
  borderRadius: 12,
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoIniciarStyle = {
  ...botaoBaseStyle,
  background: "rgba(63, 163, 107, 0.25)",
  border: "1px solid rgba(63, 163, 107, 0.45)",
};

const botaoPausarStyle = {
  ...botaoBaseStyle,
  background: "rgba(244, 180, 0, 0.22)",
  border: "1px solid rgba(244, 180, 0, 0.45)",
};

const botaoTerminarStyle = {
  ...botaoBaseStyle,
  background: "rgba(92,115,199,0.35)",
  border: "1px solid rgba(92,115,199,0.65)",
};

const mensagemStyle = {
  marginTop: 18,
  padding: 14,
  borderRadius: 12,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
};