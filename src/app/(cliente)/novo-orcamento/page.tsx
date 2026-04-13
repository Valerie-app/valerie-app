"use client";

import { useEffect, useState } from "react";

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
  ficheirosArtigo?: FicheiroMeta[];
};

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

type DadosMovelTV = {
  nomeArtigo: string;
  largura: string;
  altura: string;
  profundidade: string;
  numeroPortas: string;
  numeroGavetas: string;
  numeroNichos: string;
  led: string;
  acabamento: string;
  suspenso: string;
  painelRipado: string;
  embalagem: string;
  montagem: string;
  kmIda: string;
  kmRegresso: string;
  tempoMontagem: string;
  numeroPessoas: string;
  outrosAcessorios: string;
};

type DadosMovelWC = {
  nomeArtigo: string;
  largura: string;
  altura: string;
  profundidade: string;
  numeroPortas: string;
  numeroGavetas: string;
  lavatorio: string;
  espelho: string;
  led: string;
  acabamento: string;
  suspenso: string;
  embalagem: string;
  montagem: string;
  kmIda: string;
  kmRegresso: string;
  tempoMontagem: string;
  numeroPessoas: string;
  outrosAcessorios: string;
};

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

type DadosArtigo =
  | DadosRoupeiro
  | DadosCozinha
  | DadosMovelTV
  | DadosMovelWC
  | DadosArtigoLivre
  | undefined;

type Artigo = {
  id: number;
  tipo: string;
  nome: string;
  resumo?: string;
  dados?: DadosArtigo;
};

type DadosOrcamento = {
  nomeCliente: string;
  nomeObra: string;
  localizacao: string;
  observacoes: string;
  ficheirosObra: FicheiroMeta[];
  artigos: Artigo[];
};

type RespostaSubmissao = {
  success: boolean;
  message?: string;
  error?: string;
};

type SessaoCliente = {
  autenticado: boolean;
  nome: string;
  email: string;
};

type Processo = {
  id: number;
  nomeCliente: string;
  nomeObra: string;
  localizacao: string;
  observacoes: string;
  ficheirosObra: FicheiroMeta[];
  artigos: Artigo[];
  estado: string;
  dataCriacao: string;
};

const STORAGE_KEY = "valerie_novo_orcamento";
const PROCESSOS_KEY = "valerie_processos";

export default function NovoOrcamentoPage() {
  const [nomeCliente, setNomeCliente] = useState("");
  const [nomeObra, setNomeObra] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ficheirosObra, setFicheirosObra] = useState<FicheiroMeta[]>([]);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro" | "">("");
  const [aSubmeter, setASubmeter] = useState(false);

  function gerarIdUnico() {
    return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
  }

  function guardarNoStorage(dados: DadosOrcamento) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  }

  function adicionarArtigo(tipo: string) {
    const novoArtigo: Artigo = {
      id: gerarIdUnico(),
      tipo,
      nome: `${tipo}`,
      resumo: "Ainda por configurar",
    };

    const novosArtigos = [...artigos, novoArtigo];
    setArtigos(novosArtigos);

    guardarNoStorage({
      nomeCliente,
      nomeObra,
      localizacao,
      observacoes,
      ficheirosObra,
      artigos: novosArtigos,
    });
  }

  function abrirConfiguracaoArtigo(artigo: Artigo) {
    if (artigo.tipo === "Roupeiro") {
      window.location.href = `/novo-orcamento/artigos/roupeiro?editar=${artigo.id}`;
      return;
    }

    if (artigo.tipo === "Cozinha") {
      window.location.href = `/novo-orcamento/artigos/cozinha?editar=${artigo.id}`;
      return;
    }

    if (artigo.tipo === "Móvel TV") {
      window.location.href = `/novo-orcamento/artigos/movel-tv?editar=${artigo.id}`;
      return;
    }

    if (artigo.tipo === "Móvel WC") {
      window.location.href = `/novo-orcamento/artigos/movel-wc?editar=${artigo.id}`;
      return;
    }

    if (artigo.tipo === "Artigo Livre") {
      window.location.href = `/novo-orcamento/artigos/artigo-livre?editar=${artigo.id}`;
      return;
    }
  }

  function removerArtigo(id: number) {
    const novosArtigos = artigos.filter((artigo) => artigo.id !== id);
    setArtigos(novosArtigos);

    guardarNoStorage({
      nomeCliente,
      nomeObra,
      localizacao,
      observacoes,
      ficheirosObra,
      artigos: novosArtigos,
    });
  }

  function duplicarArtigo(artigo: Artigo) {
    const novoNome = artigo.nome.includes("(Cópia)")
      ? artigo.nome
      : `${artigo.nome} (Cópia)`;

    const artigoDuplicado: Artigo = {
      ...artigo,
      id: gerarIdUnico(),
      nome: novoNome,
      dados:
        artigo.dados && typeof artigo.dados === "object"
          ? {
              ...artigo.dados,
              nomeArtigo: novoNome,
            }
          : undefined,
    };

    const novosArtigos = [...artigos, artigoDuplicado];
    setArtigos(novosArtigos);

    guardarNoStorage({
      nomeCliente,
      nomeObra,
      localizacao,
      observacoes,
      ficheirosObra,
      artigos: novosArtigos,
    });
  }

  function limparOrcamento() {
    localStorage.removeItem(STORAGE_KEY);
    setNomeObra("");
    setLocalizacao("");
    setObservacoes("");
    setFicheirosObra([]);
    setArtigos([]);
    setMensagem("");
    setTipoMensagem("");
  }

  function guardarProcessoNoHistorico() {
    const processosGuardados = localStorage.getItem(PROCESSOS_KEY);
    const lista: Processo[] = processosGuardados ? JSON.parse(processosGuardados) : [];

    const novoProcesso: Processo = {
      id: gerarIdUnico(),
      nomeCliente,
      nomeObra,
      localizacao,
      observacoes,
      ficheirosObra,
      artigos,
      estado: "Pedido Submetido",
      dataCriacao: new Date().toLocaleString("pt-PT"),
    };

    const novaLista = [...lista, novoProcesso];
    localStorage.setItem(PROCESSOS_KEY, JSON.stringify(novaLista));
  }

  function tratarFicheirosObra(evento: React.ChangeEvent<HTMLInputElement>) {
    const ficheiros = evento.target.files;
    if (!ficheiros) return;

    const novos: FicheiroMeta[] = Array.from(ficheiros).map((ficheiro) => ({
      id: gerarIdUnico(),
      nome: ficheiro.name,
      tipo: ficheiro.type || "desconhecido",
      tamanho: ficheiro.size,
    }));

    const atualizados = [...ficheirosObra, ...novos];
    setFicheirosObra(atualizados);

    guardarNoStorage({
      nomeCliente,
      nomeObra,
      localizacao,
      observacoes,
      ficheirosObra: atualizados,
      artigos,
    });

    evento.target.value = "";
  }

  function removerFicheiroObra(id: number) {
    const atualizados = ficheirosObra.filter((ficheiro) => ficheiro.id !== id);
    setFicheirosObra(atualizados);

    guardarNoStorage({
      nomeCliente,
      nomeObra,
      localizacao,
      observacoes,
      ficheirosObra: atualizados,
      artigos,
    });
  }

  async function submeterPedido() {
    if (aSubmeter) return;

    if (!nomeCliente.trim()) {
      setTipoMensagem("erro");
      setMensagem("Não foi encontrado o nome do cliente na sessão.");
      return;
    }

    if (!nomeObra.trim()) {
      setTipoMensagem("erro");
      setMensagem("Preencha o nome da obra antes de submeter.");
      return;
    }

    if (artigos.length === 0) {
      setTipoMensagem("erro");
      setMensagem("Adicione pelo menos um artigo antes de submeter.");
      return;
    }

    try {
      setASubmeter(true);
      setMensagem("");
      setTipoMensagem("");

      const resposta = await fetch("/api/submeter-orcamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeCliente,
          nomeObra,
          localizacao,
          observacoes,
          ficheirosObra,
          artigos,
        }),
      });

      const dadosResposta: RespostaSubmissao = await resposta.json();

      if (!resposta.ok || !dadosResposta.success) {
        throw new Error(
          dadosResposta.error || "Ocorreu um erro ao submeter o pedido."
        );
      }

      guardarProcessoNoHistorico();

      setTipoMensagem("sucesso");
      setMensagem(
        dadosResposta.message || "Pedido submetido com sucesso. O email foi enviado."
      );

      localStorage.removeItem(STORAGE_KEY);
      setNomeObra("");
      setLocalizacao("");
      setObservacoes("");
      setFicheirosObra([]);
      setArtigos([]);
    } catch (error) {
      console.error(error);

      setTipoMensagem("erro");
      setMensagem(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao submeter o pedido."
      );
    } finally {
      setASubmeter(false);
    }
  }

  useEffect(() => {
    const sessaoGuardada = localStorage.getItem("valerie_cliente_sessao");
    if (sessaoGuardada) {
      const sessao: SessaoCliente = JSON.parse(sessaoGuardada);
      setNomeCliente(sessao.nome || "");
    }

    const guardado = localStorage.getItem(STORAGE_KEY);

    if (guardado) {
      const dados: DadosOrcamento = JSON.parse(guardado);
      setNomeObra(dados.nomeObra || "");
      setLocalizacao(dados.localizacao || "");
      setObservacoes(dados.observacoes || "");
      setFicheirosObra(dados.ficheirosObra || []);
      setArtigos(dados.artigos || []);
    }

    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;

    guardarNoStorage({
      nomeCliente,
      nomeObra,
      localizacao,
      observacoes,
      ficheirosObra,
      artigos,
    });
  }, [nomeCliente, nomeObra, localizacao, observacoes, ficheirosObra, artigos, carregado]);

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

          <button
            onClick={() => {
              localStorage.removeItem("valerie_cliente_sessao");
              window.location.href = "/login";
            }}
            style={{
              ...menuStyle,
              textAlign: "left",
              border: "none",
              cursor: "pointer",
            }}
          >
            Terminar Sessão
          </button>
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div
          style={{
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "38px", margin: 0 }}>Novo Orçamento</h1>
            <p style={{ opacity: 0.8, marginTop: "10px" }}>
              Preencha os dados gerais da obra, carregue os ficheiros e adicione os artigos pretendidos.
            </p>
          </div>

          <button
            onClick={limparOrcamento}
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: "bold",
            }}
          >
            Limpar Orçamento
          </button>
        </div>

        {mensagem && (
          <div
            style={{
              maxWidth: "1000px",
              marginBottom: "20px",
              padding: "16px 18px",
              borderRadius: "12px",
              background:
                tipoMensagem === "sucesso"
                  ? "rgba(63, 163, 107, 0.15)"
                  : "rgba(180,50,50,0.18)",
              border:
                tipoMensagem === "sucesso"
                  ? "1px solid rgba(63, 163, 107, 0.35)"
                  : "1px solid rgba(180,50,50,0.35)",
              color: "white",
            }}
          >
            {mensagem}
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Dados do Cliente / Obra</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={labelStyle}>Nome do Cliente</label>
              <input value={nomeCliente} disabled style={{ ...inputStyle, opacity: 0.8 }} />
            </div>

            <div>
              <label style={labelStyle}>Nome da Obra</label>
              <input
                value={nomeObra}
                onChange={(e) => setNomeObra(e.target.value)}
                placeholder="Ex: Moradia Vila Verde"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Localização da Obra</label>
              <input
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Braga"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Observações Gerais</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: prazo, estilo, materiais, notas importantes..."
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Ficheiros da Obra</h2>
          <p style={{ opacity: 0.8, marginTop: 0, marginBottom: "16px" }}>
            Carregue imagens, PDFs, plantas, medições e outros ficheiros gerais da obra.
          </p>

          <input
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={tratarFicheirosObra}
            style={inputStyle}
          />

          {ficheirosObra.length > 0 && (
            <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
              {ficheirosObra.map((ficheiro) => (
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
                    onClick={() => removerFicheiroObra(ficheiro.id)}
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
          <h2 style={{ marginTop: 0 }}>Adicionar Artigos</h2>
          <p style={{ opacity: 0.85, marginBottom: "20px" }}>
            Escolha o tipo de artigo que pretende adicionar a este pedido.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <button onClick={() => adicionarArtigo("Roupeiro")} style={botaoTipoStyle}>
              Roupeiro
            </button>
            <button onClick={() => adicionarArtigo("Cozinha")} style={botaoTipoStyle}>
              Cozinha
            </button>
            <button onClick={() => adicionarArtigo("Móvel WC")} style={botaoTipoStyle}>
              Móvel WC
            </button>
            <button onClick={() => adicionarArtigo("Móvel TV")} style={botaoTipoStyle}>
              Móvel TV
            </button>
            <button onClick={() => adicionarArtigo("Artigo Livre")} style={botaoTipoStyle}>
              Artigo Livre
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Artigos Adicionados</h2>

          {artigos.length === 0 ? (
            <p style={{ opacity: 0.75 }}>
              Ainda não adicionou nenhum artigo a este pedido.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {artigos.map((artigo) => (
                <div
                  key={artigo.id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>{artigo.nome}</div>
                    <div style={{ opacity: 0.75, marginTop: "4px" }}>
                      Tipo: {artigo.tipo}
                    </div>
                    <div style={{ opacity: 0.75, marginTop: "4px", fontSize: "14px" }}>
                      {artigo.resumo || "Ainda por configurar"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => abrirConfiguracaoArtigo(artigo)}
                      style={botaoConfigurarStyle}
                    >
                      Configurar
                    </button>

                    <button
                      onClick={() => duplicarArtigo(artigo)}
                      style={botaoSecundarioStyle}
                    >
                      Duplicar
                    </button>

                    <button
                      onClick={() => removerArtigo(artigo.id)}
                      style={botaoRemoverStyle}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Resumo Atual</h2>
          <p><strong>Nome do Cliente:</strong> {nomeCliente || "—"}</p>
          <p><strong>Nome da Obra:</strong> {nomeObra || "—"}</p>
          <p><strong>Localização:</strong> {localizacao || "—"}</p>
          <p><strong>Observações:</strong> {observacoes || "—"}</p>
          <p><strong>Ficheiros da Obra:</strong> {ficheirosObra.length}</p>
          <p><strong>Total de artigos:</strong> {artigos.length}</p>
        </div>

        <div
          style={{
            maxWidth: "1000px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={submeterPedido}
            disabled={aSubmeter}
            style={{
              background: "linear-gradient(180deg, #4b5f9e 0%, #34457c 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "14px 20px",
              fontWeight: "bold",
              fontSize: "16px",
              opacity: aSubmeter ? 0.7 : 1,
              cursor: aSubmeter ? "not-allowed" : "pointer",
            }}
          >
            {aSubmeter ? "A submeter..." : "Submeter Pedido"}
          </button>
        </div>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  maxWidth: "1000px",
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "20px",
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const botaoTipoStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontWeight: "bold",
};

const botaoConfigurarStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 14px",
};

const botaoSecundarioStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 14px",
};

const botaoRemoverStyle: React.CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "10px 14px",
};