"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "valerie_novo_orcamento";

type DadosCozinha = {
  nomeArtigo: string;
  metrosLineares: string;
  altura: string;
  profundidade: string;
  numeroModulos: string;
  numeroPortas: string;
  numeroGavetas: string;
  tipoPortas: string;
  led: string;
  acabamento: string;
  tampo: string;
  eletrodomesticos: string;
  ilha: string;
  peninsulas: string;
  embalagem: string;
  montagem: string;
  kmIda: string;
  kmRegresso: string;
  tempoMontagem: string;
  numeroPessoas: string;
  outrosAcessorios: string;
};

type Artigo = {
  id: number;
  tipo: string;
  nome: string;
  resumo?: string;
  dados?: unknown;
};

type DadosOrcamento = {
  nomeCliente: string;
  nomeObra: string;
  localizacao: string;
  observacoes: string;
  artigos: Artigo[];
};

export default function CozinhaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editarId = searchParams.get("editar");

  const [nomeArtigo, setNomeArtigo] = useState("");
  const [metrosLineares, setMetrosLineares] = useState("");
  const [altura, setAltura] = useState("");
  const [profundidade, setProfundidade] = useState("");
  const [numeroModulos, setNumeroModulos] = useState("");
  const [numeroPortas, setNumeroPortas] = useState("");
  const [numeroGavetas, setNumeroGavetas] = useState("");
  const [tipoPortas, setTipoPortas] = useState("");
  const [led, setLed] = useState("Não");
  const [acabamento, setAcabamento] = useState("");
  const [tampo, setTampo] = useState("");
  const [eletrodomesticos, setEletrodomesticos] = useState("Não");
  const [ilha, setIlha] = useState("Não");
  const [peninsulas, setPeninsulas] = useState("");
  const [embalagem, setEmbalagem] = useState("");
  const [montagem, setMontagem] = useState("Não");
  const [kmIda, setKmIda] = useState("");
  const [kmRegresso, setKmRegresso] = useState("");
  const [tempoMontagem, setTempoMontagem] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState("");
  const [outrosAcessorios, setOutrosAcessorios] = useState("");

  function criarResumoCozinha(dados: DadosCozinha) {
    return `${dados.metrosLineares || "—"} m corridos • ${
      dados.numeroModulos || "0"
    } módulos • ${dados.numeroPortas || "0"} portas • ${
      dados.numeroGavetas || "0"
    } gavetas • Portas: ${dados.tipoPortas || "—"} • LED: ${
      dados.led || "Não"
    } • Ilha: ${dados.ilha || "Não"}`;
  }

  useEffect(() => {
    if (!editarId) return;

    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return;

    const dados: DadosOrcamento = JSON.parse(guardado);
    const artigo = dados.artigos.find((a) => String(a.id) === editarId);

    if (!artigo || artigo.tipo !== "Cozinha" || !artigo.dados) return;

    const d = artigo.dados as DadosCozinha;

    setNomeArtigo(d.nomeArtigo || "");
    setMetrosLineares(d.metrosLineares || "");
    setAltura(d.altura || "");
    setProfundidade(d.profundidade || "");
    setNumeroModulos(d.numeroModulos || "");
    setNumeroPortas(d.numeroPortas || "");
    setNumeroGavetas(d.numeroGavetas || "");
    setTipoPortas(d.tipoPortas || "");
    setLed(d.led || "Não");
    setAcabamento(d.acabamento || "");
    setTampo(d.tampo || "");
    setEletrodomesticos(d.eletrodomesticos || "Não");
    setIlha(d.ilha || "Não");
    setPeninsulas(d.peninsulas || "");
    setEmbalagem(d.embalagem || "");
    setMontagem(d.montagem || "Não");
    setKmIda(d.kmIda || "");
    setKmRegresso(d.kmRegresso || "");
    setTempoMontagem(d.tempoMontagem || "");
    setNumeroPessoas(d.numeroPessoas || "");
    setOutrosAcessorios(d.outrosAcessorios || "");
  }, [editarId]);

  function guardarCozinha() {
    const dadosCozinha: DadosCozinha = {
      nomeArtigo,
      metrosLineares,
      altura,
      profundidade,
      numeroModulos,
      numeroPortas,
      numeroGavetas,
      tipoPortas,
      led,
      acabamento,
      tampo,
      eletrodomesticos,
      ilha,
      peninsulas,
      embalagem,
      montagem,
      kmIda,
      kmRegresso,
      tempoMontagem,
      numeroPessoas,
      outrosAcessorios,
    };

    const guardado = localStorage.getItem(STORAGE_KEY);
    const dadosOrcamento: DadosOrcamento = guardado
      ? JSON.parse(guardado)
      : {
          nomeCliente: "",
          nomeObra: "",
          localizacao: "",
          observacoes: "",
          artigos: [],
        };

    const resumo = criarResumoCozinha(dadosCozinha);

    if (editarId) {
      dadosOrcamento.artigos = dadosOrcamento.artigos.map((artigo) =>
        String(artigo.id) === editarId
          ? {
              ...artigo,
              nome: nomeArtigo || "Cozinha",
              resumo,
              dados: dadosCozinha,
            }
          : artigo
      );
    } else {
      dadosOrcamento.artigos.push({
        id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
        tipo: "Cozinha",
        nome: nomeArtigo || "Cozinha",
        resumo,
        dados: dadosCozinha,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosOrcamento));
    router.push("/novo-orcamento");
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
          <a href="/" style={menuStyle}>Dashboard</a>
          <a
            href="/novo-orcamento"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Novo Orçamento
          </a>
          <a href="/processos" style={menuStyle}>Os Meus Processos</a>
          <a href="/documentos" style={menuStyle}>Documentos</a>
          <a href="/mensagens" style={menuStyle}>Mensagens</a>
          <a href="/perfil" style={menuStyle}>Perfil</a>
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "38px", margin: 0 }}>
            {editarId ? "Editar Cozinha" : "Configurar Cozinha"}
          </h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Preencha as medidas e opções pretendidas para este artigo.
          </p>
        </div>

        <div style={{ maxWidth: "1000px", display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Identificação do Artigo</h2>
            <div>
              <label style={labelStyle}>Nome do Artigo</label>
              <input
                value={nomeArtigo}
                onChange={(e) => setNomeArtigo(e.target.value)}
                placeholder="Ex: Cozinha Moradia T3"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Medidas Base</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Metros Corridos</label>
                <input
                  value={metrosLineares}
                  onChange={(e) => setMetrosLineares(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Altura (cm)</label>
                <input
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Profundidade (cm)</label>
                <input
                  value={profundidade}
                  onChange={(e) => setProfundidade(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Composição</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Número de Módulos</label>
                <input
                  value={numeroModulos}
                  onChange={(e) => setNumeroModulos(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Número de Portas</label>
                <input
                  value={numeroPortas}
                  onChange={(e) => setNumeroPortas(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Número de Gavetas</label>
                <input
                  value={numeroGavetas}
                  onChange={(e) => setNumeroGavetas(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Portas e Equipamento</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Tipo de Portas</label>
                <select
                  value={tipoPortas}
                  onChange={(e) => setTipoPortas(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecionar</option>
                  <option value="Abrir">Portas de Abrir</option>
                  <option value="Correr">Portas de Correr</option>
                  <option value="Misto">Misto</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>LED</label>
                <select
                  value={led}
                  onChange={(e) => setLed(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tampo</label>
                <input
                  value={tampo}
                  onChange={(e) => setTampo(e.target.value)}
                  placeholder="Ex: Compacto / Pedra / MDF"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Eletrodomésticos Incluídos</label>
                <select
                  value={eletrodomesticos}
                  onChange={(e) => setEletrodomesticos(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Ilha</label>
                <select
                  value={ilha}
                  onChange={(e) => setIlha(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Penínsulas / Extras</label>
                <input
                  value={peninsulas}
                  onChange={(e) => setPeninsulas(e.target.value)}
                  placeholder="Ex: 1 península"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Acabamento e Embalagem</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Acabamento</label>
                <select
                  value={acabamento}
                  onChange={(e) => setAcabamento(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecionar</option>
                  <option value="Lacado Mate">Lacado Mate</option>
                  <option value="Lacado Brilho">Lacado Brilho</option>
                  <option value="Folheado Mate">Folheado Mate</option>
                  <option value="Folheado Brilho">Folheado Brilho</option>
                  <option value="HPL Standard">HPL Standard</option>
                  <option value="Fenix">Fenix</option>
                  <option value="Premium">Premium</option>
                  <option value="Melamina Lisa EGGER">Melamina Lisa EGGER</option>
                  <option value="Melamina Madeira EGGER">
                    Melamina Madeira EGGER
                  </option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Embalagem</label>
                <select
                  value={embalagem}
                  onChange={(e) => setEmbalagem(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecionar</option>
                  <option value="Simples">Simples</option>
                  <option value="Reforçada">Reforçada</option>
                </select>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Montagem</h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Pretende Montagem?</label>
              <select
                value={montagem}
                onChange={(e) => setMontagem(e.target.value)}
                style={inputStyle}
              >
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>

            {montagem === "Sim" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>Km ida</label>
                  <input
                    value={kmIda}
                    onChange={(e) => setKmIda(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Km regresso</label>
                  <input
                    value={kmRegresso}
                    onChange={(e) => setKmRegresso(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tempo de montagem</label>
                  <input
                    value={tempoMontagem}
                    onChange={(e) => setTempoMontagem(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Número de pessoas</label>
                  <input
                    value={numeroPessoas}
                    onChange={(e) => setNumeroPessoas(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Outros Acessórios / Observações</h2>
            <textarea
              value={outrosAcessorios}
              onChange={(e) => setOutrosAcessorios(e.target.value)}
              rows={4}
              placeholder="Ex: pormenores técnicos, acessórios extra, notas importantes..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Resumo Atual da Cozinha</h2>
            <p><strong>Nome do Artigo:</strong> {nomeArtigo || "—"}</p>
            <p><strong>Metros Corridos:</strong> {metrosLineares || "—"}</p>
            <p><strong>Altura:</strong> {altura || "—"} cm</p>
            <p><strong>Profundidade:</strong> {profundidade || "—"} cm</p>
            <p><strong>Módulos:</strong> {numeroModulos || "—"}</p>
            <p><strong>Portas:</strong> {numeroPortas || "—"}</p>
            <p><strong>Gavetas:</strong> {numeroGavetas || "—"}</p>
            <p><strong>Tipo de Portas:</strong> {tipoPortas || "—"}</p>
            <p><strong>LED:</strong> {led || "—"}</p>
            <p><strong>Tampo:</strong> {tampo || "—"}</p>
            <p><strong>Eletrodomésticos:</strong> {eletrodomesticos || "—"}</p>
            <p><strong>Ilha:</strong> {ilha || "—"}</p>
            <p><strong>Penínsulas:</strong> {peninsulas || "—"}</p>
            <p><strong>Acabamento:</strong> {acabamento || "—"}</p>
            <p><strong>Embalagem:</strong> {embalagem || "—"}</p>
            <p><strong>Montagem:</strong> {montagem || "—"}</p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
              gap: "12px",
            }}
          >
            <button
              onClick={() => router.push("/novo-orcamento")}
              style={botaoVoltarStyle}
            >
              Voltar
            </button>

            <button onClick={guardarCozinha} style={botaoPrincipalStyle}>
              {editarId ? "Atualizar Artigo" : "Adicionar ao Orçamento"}
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

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
};

const cardStyle: React.CSSProperties = {
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
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

const botaoVoltarStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};