"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "valerie_novo_orcamento";

type DadosArtigoLivre = {
  nomeArtigo: string;
  categoria: string;
  largura: string;
  altura: string;
  profundidade: string;
  descricao: string;
  acabamento: string;
  led: string;
  embalagem: string;
  montagem: string;
  kmIda: string;
  kmRegresso: string;
  tempoMontagem: string;
  numeroPessoas: string;
  observacoesTecnicas: string;
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

export default function ArtigoLivrePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editarId = searchParams.get("editar");

  const [nomeArtigo, setNomeArtigo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [profundidade, setProfundidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [acabamento, setAcabamento] = useState("");
  const [led, setLed] = useState("Não");
  const [embalagem, setEmbalagem] = useState("");
  const [montagem, setMontagem] = useState("Não");
  const [kmIda, setKmIda] = useState("");
  const [kmRegresso, setKmRegresso] = useState("");
  const [tempoMontagem, setTempoMontagem] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState("");
  const [observacoesTecnicas, setObservacoesTecnicas] = useState("");

  function criarResumoArtigoLivre(dados: DadosArtigoLivre) {
    return `${dados.categoria || "Artigo livre"} • ${dados.largura || "—"} x ${
      dados.altura || "—"
    } x ${dados.profundidade || "—"} cm • LED: ${dados.led || "Não"} • ${
      dados.acabamento || "Sem acabamento definido"
    }`;
  }

  useEffect(() => {
    if (!editarId) return;

    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return;

    const dados: DadosOrcamento = JSON.parse(guardado);
    const artigo = dados.artigos.find((a) => String(a.id) === editarId);

    if (!artigo || artigo.tipo !== "Artigo Livre" || !artigo.dados) return;

    const d = artigo.dados as DadosArtigoLivre;

    setNomeArtigo(d.nomeArtigo || "");
    setCategoria(d.categoria || "");
    setLargura(d.largura || "");
    setAltura(d.altura || "");
    setProfundidade(d.profundidade || "");
    setDescricao(d.descricao || "");
    setAcabamento(d.acabamento || "");
    setLed(d.led || "Não");
    setEmbalagem(d.embalagem || "");
    setMontagem(d.montagem || "Não");
    setKmIda(d.kmIda || "");
    setKmRegresso(d.kmRegresso || "");
    setTempoMontagem(d.tempoMontagem || "");
    setNumeroPessoas(d.numeroPessoas || "");
    setObservacoesTecnicas(d.observacoesTecnicas || "");
  }, [editarId]);

  function guardarArtigoLivre() {
    const dadosArtigoLivre: DadosArtigoLivre = {
      nomeArtigo,
      categoria,
      largura,
      altura,
      profundidade,
      descricao,
      acabamento,
      led,
      embalagem,
      montagem,
      kmIda,
      kmRegresso,
      tempoMontagem,
      numeroPessoas,
      observacoesTecnicas,
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

    const resumo = criarResumoArtigoLivre(dadosArtigoLivre);

    if (editarId) {
      dadosOrcamento.artigos = dadosOrcamento.artigos.map((artigo) =>
        String(artigo.id) === editarId
          ? {
              ...artigo,
              nome: nomeArtigo || "Artigo Livre",
              resumo,
              dados: dadosArtigoLivre,
            }
          : artigo
      );
    } else {
      dadosOrcamento.artigos.push({
        id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
        tipo: "Artigo Livre",
        nome: nomeArtigo || "Artigo Livre",
        resumo,
        dados: dadosArtigoLivre,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosOrcamento));
    router.push("/novo-orcamento");
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          <a href="/" style={menuStyle}>Dashboard</a>
          <a href="/novo-orcamento" style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}>
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
            {editarId ? "Editar Artigo Livre" : "Configurar Artigo Livre"}
          </h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Use esta página para artigos que não encaixam nos modelos standard.
          </p>
        </div>

        <div style={{ maxWidth: "1000px", display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Identificação</h2>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Nome do Artigo</label>
                <input
                  value={nomeArtigo}
                  onChange={(e) => setNomeArtigo(e.target.value)}
                  placeholder="Ex: Consola Entrada"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Categoria</label>
                <input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: Hall / Escritório / Quarto"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Medidas</h2>
            <div style={grid3Style}>
              <div>
                <label style={labelStyle}>Largura (cm)</label>
                <input value={largura} onChange={(e) => setLargura(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Altura (cm)</label>
                <input value={altura} onChange={(e) => setAltura(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Profundidade (cm)</label>
                <input value={profundidade} onChange={(e) => setProfundidade(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Descrição Técnica</h2>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              placeholder="Descreva o artigo, composição, pormenores e o que pretende."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Acabamento e Opções</h2>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Acabamento</label>
                <select value={acabamento} onChange={(e) => setAcabamento(e.target.value)} style={inputStyle}>
                  <option value="">Selecionar</option>
                  <option value="Lacado Mate">Lacado Mate</option>
                  <option value="Lacado Brilho">Lacado Brilho</option>
                  <option value="Folheado Mate">Folheado Mate</option>
                  <option value="Folheado Brilho">Folheado Brilho</option>
                  <option value="HPL Standard">HPL Standard</option>
                  <option value="Fenix">Fenix</option>
                  <option value="Premium">Premium</option>
                  <option value="Melamina Lisa EGGER">Melamina Lisa EGGER</option>
                  <option value="Melamina Madeira EGGER">Melamina Madeira EGGER</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>LED</label>
                <select value={led} onChange={(e) => setLed(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Embalagem</label>
                <select value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} style={inputStyle}>
                  <option value="">Selecionar</option>
                  <option value="Simples">Simples</option>
                  <option value="Reforçada">Reforçada</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Pretende Montagem?</label>
                <select value={montagem} onChange={(e) => setMontagem(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
            </div>

            {montagem === "Sim" && (
              <div style={{ ...grid4Style, marginTop: "16px" }}>
                <div>
                  <label style={labelStyle}>Km ida</label>
                  <input value={kmIda} onChange={(e) => setKmIda(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Km regresso</label>
                  <input value={kmRegresso} onChange={(e) => setKmRegresso(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tempo de montagem</label>
                  <input value={tempoMontagem} onChange={(e) => setTempoMontagem(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Número de pessoas</label>
                  <input value={numeroPessoas} onChange={(e) => setNumeroPessoas(e.target.value)} style={inputStyle} />
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Observações Técnicas</h2>
            <textarea
              value={observacoesTecnicas}
              onChange={(e) => setObservacoesTecnicas(e.target.value)}
              rows={4}
              placeholder="Notas técnicas, ferragens especiais, detalhes de execução..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Resumo Atual do Artigo Livre</h2>
            <p><strong>Nome do Artigo:</strong> {nomeArtigo || "—"}</p>
            <p><strong>Categoria:</strong> {categoria || "—"}</p>
            <p><strong>Largura:</strong> {largura || "—"} cm</p>
            <p><strong>Altura:</strong> {altura || "—"} cm</p>
            <p><strong>Profundidade:</strong> {profundidade || "—"} cm</p>
            <p><strong>Acabamento:</strong> {acabamento || "—"}</p>
            <p><strong>LED:</strong> {led || "—"}</p>
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

            <button onClick={guardarArtigoLivre} style={botaoPrincipalStyle}>
              {editarId ? "Atualizar Artigo" : "Adicionar ao Orçamento"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: React.CSSProperties = {
  width: "260px",
  minHeight: "100vh",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: "30px 20px",
};

const logoStyle: React.CSSProperties = {
  fontSize: "38px",
  letterSpacing: "10px",
  marginBottom: "40px",
};

const menuContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

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

const grid2Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const grid3Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
};

const grid4Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
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