"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "valerie_novo_orcamento";

type FicheiroMeta = {
  id: number;
  nome: string;
  tipo: string;
  tamanho: number;
};

type DadosRoupeiro = {
  nomeArtigo: string;
  altura: string;
  largura: string;
  profundidade: string;
  gavetas: string;
  prateleiras: string;
  tipoPortas: string;
  led: string;
  acabamento: string;
  embalagem: string;
  montagem: string;
  kmIda: string;
  kmRegresso: string;
  tempoMontagem: string;
  numeroPessoas: string;
  temVaroes: string;
  quantidadeVaroes: string;
  temGavetasJoias: string;
  quantidadeGavetasJoias: string;
  temCalceiros: string;
  quantidadeCalceiros: string;
  temSapateiras: string;
  quantidadeSapateiras: string;
  temDivisorias: string;
  quantidadeDivisorias: string;
  outrosAcessorios: string;
  ficheirosArtigo: FicheiroMeta[];
};

type Artigo = {
  id: number;
  tipo: string;
  nome: string;
  resumo?: string;
  dados?: DadosRoupeiro;
};

type DadosOrcamento = {
  nomeCliente: string;
  nomeObra: string;
  localizacao: string;
  observacoes: string;
  ficheirosObra: FicheiroMeta[];
  artigos: Artigo[];
};

export default function RoupeiroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editarId = searchParams.get("editar");

  const [nomeArtigo, setNomeArtigo] = useState("");
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");
  const [profundidade, setProfundidade] = useState("");
  const [gavetas, setGavetas] = useState("");
  const [prateleiras, setPrateleiras] = useState("");
  const [tipoPortas, setTipoPortas] = useState("");
  const [led, setLed] = useState("Não");
  const [acabamento, setAcabamento] = useState("");
  const [embalagem, setEmbalagem] = useState("");
  const [montagem, setMontagem] = useState("Não");
  const [kmIda, setKmIda] = useState("");
  const [kmRegresso, setKmRegresso] = useState("");
  const [tempoMontagem, setTempoMontagem] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState("");

  const [temVaroes, setTemVaroes] = useState("Não");
  const [quantidadeVaroes, setQuantidadeVaroes] = useState("");

  const [temGavetasJoias, setTemGavetasJoias] = useState("Não");
  const [quantidadeGavetasJoias, setQuantidadeGavetasJoias] = useState("");

  const [temCalceiros, setTemCalceiros] = useState("Não");
  const [quantidadeCalceiros, setQuantidadeCalceiros] = useState("");

  const [temSapateiras, setTemSapateiras] = useState("Não");
  const [quantidadeSapateiras, setQuantidadeSapateiras] = useState("");

  const [temDivisorias, setTemDivisorias] = useState("Não");
  const [quantidadeDivisorias, setQuantidadeDivisorias] = useState("");

  const [outrosAcessorios, setOutrosAcessorios] = useState("");
  const [ficheirosArtigo, setFicheirosArtigo] = useState<FicheiroMeta[]>([]);

  function gerarIdUnico() {
    return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
  }

  function criarResumoRoupeiro(dados: DadosRoupeiro) {
    const partesExtras: string[] = [];

    if (dados.temVaroes === "Sim") {
      partesExtras.push(`Varões: ${dados.quantidadeVaroes || "—"}`);
    }

    if (dados.temGavetasJoias === "Sim") {
      partesExtras.push(
        `Gavetas de Joias: ${dados.quantidadeGavetasJoias || "—"}`
      );
    }

    if (dados.temCalceiros === "Sim") {
      partesExtras.push(`Calceiros: ${dados.quantidadeCalceiros || "—"}`);
    }

    if (dados.temSapateiras === "Sim") {
      partesExtras.push(`Sapateiras: ${dados.quantidadeSapateiras || "—"}`);
    }

    if (dados.temDivisorias === "Sim") {
      partesExtras.push(`Divisórias: ${dados.quantidadeDivisorias || "—"}`);
    }

    const extrasTexto =
      partesExtras.length > 0 ? ` • ${partesExtras.join(" • ")}` : "";

    return `${dados.largura || "—"} x ${dados.altura || "—"} x ${
      dados.profundidade || "—"
    } cm • ${dados.gavetas || "0"} gavetas • ${
      dados.prateleiras || "0"
    } prateleiras • Portas: ${dados.tipoPortas || "—"} • LED: ${
      dados.led || "Não"
    } • Ficheiros: ${dados.ficheirosArtigo.length}${extrasTexto}`;
  }

  useEffect(() => {
    if (!editarId) return;

    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return;

    const dados: DadosOrcamento = JSON.parse(guardado);
    const artigo = dados.artigos.find((a) => String(a.id) === editarId);

    if (!artigo || !artigo.dados) return;

    const d = artigo.dados;

    setNomeArtigo(d.nomeArtigo || "");
    setAltura(d.altura || "");
    setLargura(d.largura || "");
    setProfundidade(d.profundidade || "");
    setGavetas(d.gavetas || "");
    setPrateleiras(d.prateleiras || "");
    setTipoPortas(d.tipoPortas || "");
    setLed(d.led || "Não");
    setAcabamento(d.acabamento || "");
    setEmbalagem(d.embalagem || "");
    setMontagem(d.montagem || "Não");
    setKmIda(d.kmIda || "");
    setKmRegresso(d.kmRegresso || "");
    setTempoMontagem(d.tempoMontagem || "");
    setNumeroPessoas(d.numeroPessoas || "");
    setTemVaroes(d.temVaroes || "Não");
    setQuantidadeVaroes(d.quantidadeVaroes || "");
    setTemGavetasJoias(d.temGavetasJoias || "Não");
    setQuantidadeGavetasJoias(d.quantidadeGavetasJoias || "");
    setTemCalceiros(d.temCalceiros || "Não");
    setQuantidadeCalceiros(d.quantidadeCalceiros || "");
    setTemSapateiras(d.temSapateiras || "Não");
    setQuantidadeSapateiras(d.quantidadeSapateiras || "");
    setTemDivisorias(d.temDivisorias || "Não");
    setQuantidadeDivisorias(d.quantidadeDivisorias || "");
    setOutrosAcessorios(d.outrosAcessorios || "");
    setFicheirosArtigo(d.ficheirosArtigo || []);
  }, [editarId]);

  function tratarFicheirosArtigo(evento: React.ChangeEvent<HTMLInputElement>) {
    const ficheiros = evento.target.files;
    if (!ficheiros) return;

    const novos: FicheiroMeta[] = Array.from(ficheiros).map((ficheiro) => ({
      id: gerarIdUnico(),
      nome: ficheiro.name,
      tipo: ficheiro.type || "desconhecido",
      tamanho: ficheiro.size,
    }));

    setFicheirosArtigo((anterior) => [...anterior, ...novos]);
    evento.target.value = "";
  }

  function removerFicheiroArtigo(id: number) {
    setFicheirosArtigo((anterior) => anterior.filter((ficheiro) => ficheiro.id !== id));
  }

  function adicionarAoOrcamento() {
    const dadosRoupeiro: DadosRoupeiro = {
      nomeArtigo,
      altura,
      largura,
      profundidade,
      gavetas,
      prateleiras,
      tipoPortas,
      led,
      acabamento,
      embalagem,
      montagem,
      kmIda,
      kmRegresso,
      tempoMontagem,
      numeroPessoas,
      temVaroes,
      quantidadeVaroes,
      temGavetasJoias,
      quantidadeGavetasJoias,
      temCalceiros,
      quantidadeCalceiros,
      temSapateiras,
      quantidadeSapateiras,
      temDivisorias,
      quantidadeDivisorias,
      outrosAcessorios,
      ficheirosArtigo,
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

    const resumo = criarResumoRoupeiro(dadosRoupeiro);

    if (editarId) {
      dadosOrcamento.artigos = dadosOrcamento.artigos.map((artigo) =>
        String(artigo.id) === editarId
          ? {
              ...artigo,
              nome: nomeArtigo || "Roupeiro",
              resumo,
              dados: dadosRoupeiro,
            }
          : artigo
      );
    } else {
      dadosOrcamento.artigos.push({
        id: gerarIdUnico(),
        tipo: "Roupeiro",
        nome: nomeArtigo || "Roupeiro",
        resumo,
        dados: dadosRoupeiro,
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
            {editarId ? "Editar Roupeiro" : "Configurar Roupeiro"}
          </h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Preencha as medidas, ferragens e carregue os ficheiros deste artigo.
          </p>
        </div>

        <div style={{ maxWidth: "1000px", display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Identificação do Artigo</h2>
            <label style={labelStyle}>Nome do Artigo</label>
            <input
              value={nomeArtigo}
              onChange={(e) => setNomeArtigo(e.target.value)}
              placeholder="Ex: Roupeiro Quarto Casal"
              style={inputStyle}
            />
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Ficheiros do Artigo</h2>
            <p style={{ opacity: 0.8, marginTop: 0, marginBottom: "16px" }}>
              Carregue imagens, PDFs, desenhos ou referências deste roupeiro.
            </p>

            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={tratarFicheirosArtigo}
              style={inputStyle}
            />

            {ficheirosArtigo.length > 0 && (
              <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
                {ficheirosArtigo.map((ficheiro) => (
                  <div
                    key={ficheiro.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold" }}>{ficheiro.nome}</div>
                      <div style={{ opacity: 0.75, fontSize: "13px", marginTop: "4px" }}>
                        {ficheiro.tipo || "desconhecido"} • {(ficheiro.tamanho / 1024).toFixed(1)} KB
                      </div>
                    </div>

                    <button
                      onClick={() => removerFicheiroArtigo(ficheiro.id)}
                      style={botaoRemoverStyle}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Medidas</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Altura (cm)</label>
                <input value={altura} onChange={(e) => setAltura(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Largura (cm)</label>
                <input value={largura} onChange={(e) => setLargura(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Profundidade (cm)</label>
                <input value={profundidade} onChange={(e) => setProfundidade(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Configuração Interior</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Número de Gavetas</label>
                <input value={gavetas} onChange={(e) => setGavetas(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Número de Prateleiras</label>
                <input value={prateleiras} onChange={(e) => setPrateleiras(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Portas e Iluminação</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Tipo de Portas</label>
                <select value={tipoPortas} onChange={(e) => setTipoPortas(e.target.value)} style={inputStyle}>
                  <option value="">Selecionar</option>
                  <option value="Abrir">Portas de Abrir</option>
                  <option value="Correr">Portas de Correr</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>LED nas laterais por porta</label>
                <select value={led} onChange={(e) => setLed(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Ferragens e Acessórios</h2>

            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Varões</label>
                <select value={temVaroes} onChange={(e) => setTemVaroes(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>

                {temVaroes === "Sim" && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={labelStyle}>Quantidade de Varões</label>
                    <input
                      value={quantidadeVaroes}
                      onChange={(e) => setQuantidadeVaroes(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Gavetas de Joias</label>
                <select value={temGavetasJoias} onChange={(e) => setTemGavetasJoias(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>

                {temGavetasJoias === "Sim" && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={labelStyle}>Quantidade de Gavetas de Joias</label>
                    <input
                      value={quantidadeGavetasJoias}
                      onChange={(e) => setQuantidadeGavetasJoias(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Calceiros</label>
                <select value={temCalceiros} onChange={(e) => setTemCalceiros(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>

                {temCalceiros === "Sim" && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={labelStyle}>Quantidade de Calceiros</label>
                    <input
                      value={quantidadeCalceiros}
                      onChange={(e) => setQuantidadeCalceiros(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Sapateiras</label>
                <select value={temSapateiras} onChange={(e) => setTemSapateiras(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>

                {temSapateiras === "Sim" && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={labelStyle}>Quantidade de Sapateiras</label>
                    <input
                      value={quantidadeSapateiras}
                      onChange={(e) => setQuantidadeSapateiras(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Divisórias</label>
                <select value={temDivisorias} onChange={(e) => setTemDivisorias(e.target.value)} style={inputStyle}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>

                {temDivisorias === "Sim" && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={labelStyle}>Quantidade de Divisórias</label>
                    <input
                      value={quantidadeDivisorias}
                      onChange={(e) => setQuantidadeDivisorias(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <label style={labelStyle}>Outros Acessórios / Ferragens</label>
              <textarea
                value={outrosAcessorios}
                onChange={(e) => setOutrosAcessorios(e.target.value)}
                placeholder="Ex: ferragens especiais, acessórios interiores, observações..."
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
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
                <select value={acabamento} onChange={(e) => setAcabamento(e.target.value)} style={inputStyle}>
                  <option value="">Selecionar</option>
                  <option value="Lacado Mate">Portas Lacadas Mate</option>
                  <option value="Lacado Brilho">Portas Lacadas Brilho</option>
                  <option value="Folheado Mate">Portas Folheadas Mate</option>
                  <option value="Folheado Brilho">Portas Folheadas Brilho</option>
                  <option value="HPL Standard">HPL Standard</option>
                  <option value="Fenix">Fenix</option>
                  <option value="Premium">Premium</option>
                  <option value="Melamina Lisa EGGER">Melamina Lisa EGGER</option>
                  <option value="Melamina Fantasia Madeira EGGER">
                    Melamina Fantasia de Madeira EGGER
                  </option>
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
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Montagem</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Pretende Montagem?</label>
              <select value={montagem} onChange={(e) => setMontagem(e.target.value)} style={inputStyle}>
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
            <h2 style={{ marginTop: 0 }}>Resumo Atual do Roupeiro</h2>
            <p><strong>Nome do Artigo:</strong> {nomeArtigo || "—"}</p>
            <p><strong>Altura:</strong> {altura || "—"} cm</p>
            <p><strong>Largura:</strong> {largura || "—"} cm</p>
            <p><strong>Profundidade:</strong> {profundidade || "—"} cm</p>
            <p><strong>Gavetas:</strong> {gavetas || "—"}</p>
            <p><strong>Prateleiras:</strong> {prateleiras || "—"}</p>
            <p><strong>Portas:</strong> {tipoPortas || "—"}</p>
            <p><strong>LED:</strong> {led || "—"}</p>
            <p><strong>Ficheiros do Artigo:</strong> {ficheirosArtigo.length}</p>
            <p><strong>Outros Acessórios:</strong> {outrosAcessorios || "—"}</p>
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

            <button
              onClick={adicionarAoOrcamento}
              style={botaoPrincipalStyle}
            >
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

const botaoRemoverStyle: React.CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};