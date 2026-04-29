"use client";

import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

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

const menuCliente = [
  { label: "Dashboard", path: "/dashboard-cliente" },
  { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
  { label: "Processos", path: "/processos-cliente" },
  { label: "Perfil", path: "/perfil-cliente" },
];

export default function RoupeiroPage() {
  return (
    <Suspense fallback={<main style={mainStyle}>A carregar...</main>}>
      <RoupeiroConteudo />
    </Suspense>
  );
}

function RoupeiroConteudo() {
  const router = useRouter();
  const pathname = usePathname();
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
    return `${dados.largura || "—"} x ${dados.altura || "—"} x ${
      dados.profundidade || "—"
    } cm • ${dados.gavetas || "0"} gavetas • ${
      dados.prateleiras || "0"
    } prateleiras • Portas: ${dados.tipoPortas || "—"} • LED: ${
      dados.led || "Não"
    } • Ficheiros: ${dados.ficheirosArtigo.length}`;
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
    setFicheirosArtigo((anterior) =>
      anterior.filter((ficheiro) => ficheiro.id !== id)
    );
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
                  <div key={ficheiro.id} style={fileRowStyle}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{ficheiro.nome}</div>
                      <div style={{ opacity: 0.75, fontSize: "13px" }}>
                        {ficheiro.tipo} • {(ficheiro.tamanho / 1024).toFixed(1)} KB
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
            <div style={grid3Style}>
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
            <div style={grid2Style}>
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
            <div style={grid2Style}>
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

            {[
              ["Varões", temVaroes, setTemVaroes, quantidadeVaroes, setQuantidadeVaroes],
              ["Gavetas de Joias", temGavetasJoias, setTemGavetasJoias, quantidadeGavetasJoias, setQuantidadeGavetasJoias],
              ["Calceiros", temCalceiros, setTemCalceiros, quantidadeCalceiros, setQuantidadeCalceiros],
              ["Sapateiras", temSapateiras, setTemSapateiras, quantidadeSapateiras, setQuantidadeSapateiras],
              ["Divisórias", temDivisorias, setTemDivisorias, quantidadeDivisorias, setQuantidadeDivisorias],
            ].map(([label, tem, setTem, qtd, setQtd]) => (
              <div key={String(label)} style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>{String(label)}</label>
                <select
                  value={String(tem)}
                  onChange={(e) =>
                    (setTem as React.Dispatch<React.SetStateAction<string>>)(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>

                {tem === "Sim" && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={labelStyle}>Quantidade</label>
                    <input
                      value={String(qtd)}
                      onChange={(e) =>
                        (setQtd as React.Dispatch<React.SetStateAction<string>>)(
                          e.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            ))}

            <label style={labelStyle}>Outros Acessórios / Ferragens</label>
            <textarea
              value={outrosAcessorios}
              onChange={(e) => setOutrosAcessorios(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Acabamento e Embalagem</h2>
            <div style={grid2Style}>
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
                  <option value="Melamina Fantasia Madeira EGGER">Melamina Fantasia de Madeira EGGER</option>
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
            <label style={labelStyle}>Pretende Montagem?</label>
            <select value={montagem} onChange={(e) => setMontagem(e.target.value)} style={inputStyle}>
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </select>

            {montagem === "Sim" && (
              <div style={{ ...grid4Style, marginTop: "16px" }}>
                <input placeholder="Km ida" value={kmIda} onChange={(e) => setKmIda(e.target.value)} style={inputStyle} />
                <input placeholder="Km regresso" value={kmRegresso} onChange={(e) => setKmRegresso(e.target.value)} style={inputStyle} />
                <input placeholder="Tempo de montagem" value={tempoMontagem} onChange={(e) => setTempoMontagem(e.target.value)} style={inputStyle} />
                <input placeholder="Número de pessoas" value={numeroPessoas} onChange={(e) => setNumeroPessoas(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Resumo Atual do Roupeiro</h2>
            <p><strong>Nome:</strong> {nomeArtigo || "—"}</p>
            <p><strong>Altura:</strong> {altura || "—"} cm</p>
            <p><strong>Largura:</strong> {largura || "—"} cm</p>
            <p><strong>Profundidade:</strong> {profundidade || "—"} cm</p>
            <p><strong>Gavetas:</strong> {gavetas || "—"}</p>
            <p><strong>Prateleiras:</strong> {prateleiras || "—"}</p>
            <p><strong>Ficheiros:</strong> {ficheirosArtigo.length}</p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <button onClick={() => router.push("/novo-orcamento-cliente")} style={botaoVoltarStyle}>
              Voltar
            </button>

            <button onClick={adicionarAoOrcamento} style={botaoPrincipalStyle}>
              {editarId ? "Atualizar Artigo" : "Adicionar ao Orçamento"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: "260px",
  minHeight: "100vh",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: "30px 20px",
};

const logoStyle: CSSProperties = {
  fontSize: "38px",
  letterSpacing: "10px",
  marginBottom: "40px",
};

const menuContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const menuStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.06)",
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

const fileRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const botaoPrincipalStyle: CSSProperties = {
  background: "linear-gradient(180deg, #4b5f9e 0%, #34457c 100%)",
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

const botaoRemoverStyle: CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};