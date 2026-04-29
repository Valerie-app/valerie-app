"use client";

import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

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
  ficheirosObra?: unknown[];
  artigos: Artigo[];
};

const menuCliente = [
  { label: "Dashboard", path: "/dashboard-cliente" },
  { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
  { label: "Processos", path: "/processos-cliente" },
  { label: "Perfil", path: "/perfil-cliente" },
];

export default function CozinhaPage() {
  return (
    <Suspense fallback={<main style={mainStyle}>A carregar...</main>}>
      <CozinhaConteudo />
    </Suspense>
  );
}

function CozinhaConteudo() {
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    if (!editarId) return;

    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return;

    try {
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
    } catch (error) {
      console.error(error);
    }
  }, [editarId]);

  function criarResumoCozinha(dados: DadosCozinha) {
    return `${dados.metrosLineares || "—"} m corridos • ${
      dados.numeroModulos || "0"
    } módulos • ${dados.numeroPortas || "0"} portas • ${
      dados.numeroGavetas || "0"
    } gavetas • Portas: ${dados.tipoPortas || "—"} • LED: ${
      dados.led || "Não"
    } • Ilha: ${dados.ilha || "Não"}`;
  }

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
          ficheirosObra: [],
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
    router.push("/novo-orcamento-cliente");
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          {menuCliente.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              style={{
                ...menuStyle,
                ...(pathname === item.path ? menuActiveStyle : {}),
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle}>
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
            <label style={labelStyle}>Nome do Artigo</label>
            <input
              value={nomeArtigo}
              onChange={(e) => setNomeArtigo(e.target.value)}
              placeholder="Ex: Cozinha Moradia T3"
              style={inputStyle}
            />
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Medidas Base</h2>
            <div style={grid3Style}>
              <div>
                <label style={labelStyle}>Metros Corridos</label>
                <input value={metrosLineares} onChange={(e) => setMetrosLineares(e.target.value)} style={inputStyle} />
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
            <h2 style={{ marginTop: 0 }}>Composição</h2>
            <div style={grid3Style}>
              <div>
                <label style={labelStyle}>Número de Módulos</label>
                <input value={numeroModulos} onChange={(e) => setNumeroModulos(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Número de Portas</label>
                <input value={numeroPortas} onChange={(e) => setNumeroPortas(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Número de Gavetas</label>
                <input value={numeroGavetas} onChange={(e) => setNumeroGavetas(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Portas e Equipamento</h2>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Tipo de Portas</label>
                <select value={tipoPortas} onChange={(e) => setTipoPortas(e.target.value)} style={inputStyle}>
                  <option value="" style={optionStyle}>Selecionar</option>
                  <option value="Abrir" style={optionStyle}>Portas de Abrir</option>
                  <option value="Correr" style={optionStyle}>Portas de Correr</option>
                  <option value="Misto" style={optionStyle}>Misto</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>LED</label>
                <select value={led} onChange={(e) => setLed(e.target.value)} style={inputStyle}>
                  <option value="Não" style={optionStyle}>Não</option>
                  <option value="Sim" style={optionStyle}>Sim</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tampo</label>
                <input value={tampo} onChange={(e) => setTampo(e.target.value)} placeholder="Ex: Compacto / Pedra / MDF" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Eletrodomésticos Incluídos</label>
                <select value={eletrodomesticos} onChange={(e) => setEletrodomesticos(e.target.value)} style={inputStyle}>
                  <option value="Não" style={optionStyle}>Não</option>
                  <option value="Sim" style={optionStyle}>Sim</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Ilha</label>
                <select value={ilha} onChange={(e) => setIlha(e.target.value)} style={inputStyle}>
                  <option value="Não" style={optionStyle}>Não</option>
                  <option value="Sim" style={optionStyle}>Sim</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Penínsulas / Extras</label>
                <input value={peninsulas} onChange={(e) => setPeninsulas(e.target.value)} placeholder="Ex: 1 península" style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Acabamento e Embalagem</h2>
            <div style={grid2Style}>
              <div>
                <label style={labelStyle}>Acabamento</label>
                <select value={acabamento} onChange={(e) => setAcabamento(e.target.value)} style={inputStyle}>
                  <option value="" style={optionStyle}>Selecionar</option>
                  <option value="Lacado Mate" style={optionStyle}>Lacado Mate</option>
                  <option value="Lacado Brilho" style={optionStyle}>Lacado Brilho</option>
                  <option value="Folheado Mate" style={optionStyle}>Folheado Mate</option>
                  <option value="Folheado Brilho" style={optionStyle}>Folheado Brilho</option>
                  <option value="HPL Standard" style={optionStyle}>HPL Standard</option>
                  <option value="Fenix" style={optionStyle}>Fenix</option>
                  <option value="Premium" style={optionStyle}>Premium</option>
                  <option value="Melamina Lisa EGGER" style={optionStyle}>Melamina Lisa EGGER</option>
                  <option value="Melamina Madeira EGGER" style={optionStyle}>Melamina Madeira EGGER</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Embalagem</label>
                <select value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} style={inputStyle}>
                  <option value="" style={optionStyle}>Selecionar</option>
                  <option value="Simples" style={optionStyle}>Simples</option>
                  <option value="Reforçada" style={optionStyle}>Reforçada</option>
                </select>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Montagem</h2>

            <label style={labelStyle}>Pretende Montagem?</label>
            <select value={montagem} onChange={(e) => setMontagem(e.target.value)} style={inputStyle}>
              <option value="Não" style={optionStyle}>Não</option>
              <option value="Sim" style={optionStyle}>Sim</option>
            </select>

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
            <h2 style={{ marginTop: 0 }}>Outros Acessórios / Observações</h2>
            <textarea value={outrosAcessorios} onChange={(e) => setOutrosAcessorios(e.target.value)} rows={4} placeholder="Ex: pormenores técnicos, acessórios extra, notas importantes..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Resumo Atual</h2>
            <p><strong>Nome:</strong> {nomeArtigo || "—"}</p>
            <p><strong>Metros Corridos:</strong> {metrosLineares || "—"}</p>
            <p><strong>Módulos:</strong> {numeroModulos || "—"}</p>
            <p><strong>Portas:</strong> {numeroPortas || "—"}</p>
            <p><strong>Gavetas:</strong> {numeroGavetas || "—"}</p>
            <p><strong>LED:</strong> {led}</p>
            <p><strong>Ilha:</strong> {ilha}</p>
            <p><strong>Acabamento:</strong> {acabamento || "—"}</p>
          </div>

          <div style={acoesStyle}>
            <button type="button" onClick={() => router.push("/novo-orcamento-cliente")} style={botaoVoltarStyle}>
              Voltar
            </button>

            <button type="button" onClick={guardarCozinha} style={botaoPrincipalStyle}>
              {editarId ? "Atualizar Artigo" : "Adicionar ao Orçamento"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100dvh",
  background: "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: "260px",
  minHeight: "100dvh",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: "30px 20px",
  flexShrink: 0,
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "40px",
  overflowX: "hidden",
};

const logoStyle: CSSProperties = {
  fontSize: "38px",
  letterSpacing: "10px",
  marginBottom: "40px",
};

const menuContainerStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const menuStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textAlign: "left",
  fontWeight: "bold",
  cursor: "pointer",
};

const menuActiveStyle: CSSProperties = {
  background: "rgba(92,115,199,0.35)",
  border: "1px solid rgba(92,115,199,0.65)",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
};

const cardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const optionStyle: CSSProperties = {
  color: "black",
};

const grid2Style: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const grid3Style: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
};

const grid4Style: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
};

const acoesStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
  gap: "12px",
};

const botaoPrincipalStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};

const botaoVoltarStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};