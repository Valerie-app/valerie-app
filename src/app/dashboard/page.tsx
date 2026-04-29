"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type Processo = {
  id: string;
  cliente_id: string | null;
  nome_cliente: string | null;
  nome_obra: string | null;
  localizacao: string | null;
  observacoes: string | null;
  estado: string | null;
  valor_estimado: number | null;
  desconto_percentual: number | null;
  valor_estimado_com_desconto: number | null;
  valor_final: number | null;
  notas_admin: string | null;
  created_at: string | null;
  data_entrega_prevista?: string | null;
  dias_fabrico_previstos?: number | null;
  dias_acabamento_previstos?: number | null;
  dias_montagem_previstos?: number | null;
  dias_totais_previstos?: number | null;
};

type ExtraArtigo = {
  nome?: string;
  quantidade?: string | number;
};

type DadosArtigo = {
  largura?: number;
  altura?: number;
  profundidade?: number;
  material?: string;
  extras?: ExtraArtigo[];
};

type Artigo = {
  id: string;
  processo_id: string;
  tipo: string | null;
  nome: string | null;
  resumo: string | null;
  dados: DadosArtigo | null;
  created_at: string | null;
};

type ArtigoDB = {
  id: string;
  processo_id: string;
  tipo: string | null;
  nome: string | null;
  resumo: string | null;
  dados: unknown;
  created_at: string | null;
};

type ClienteDB = {
  id: string;
  tipo_utilizador: string | null;
};

const ESTADOS_FILTRO = [
  "Todos",
  "Pedido Submetido",
  "Em Análise",
  "Orçamento Enviado",
  "Validado",
  "Rejeitado",
] as const;

type EstadoFiltro = (typeof ESTADOS_FILTRO)[number];

type Ordenacao =
  | "recentes"
  | "antigos"
  | "valor_desc"
  | "valor_asc"
  | "entrega_asc";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [larguraJanela, setLarguraJanela] = useState(1400);

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [processoAberto, setProcessoAberto] = useState<string | null>(null);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("Todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");

  const [mensagem, setMensagem] = useState("");
  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [aAtualizar, setAAtualizar] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const [diasAcabamentoEdit, setDiasAcabamentoEdit] = useState<
    Record<string, string>
  >({});
  const [processoAGuardarAcabamento, setProcessoAGuardarAcabamento] =
    useState<string | null>(null);

  useEffect(() => {
    function atualizarLargura() {
      setLarguraJanela(window.innerWidth);
    }

    atualizarLargura();
    window.addEventListener("resize", atualizarLargura);

    return () => window.removeEventListener("resize", atualizarLargura);
  }, []);

  const eDesktop = larguraJanela >= 1024;
  const eTablet = larguraJanela >= 768 && larguraJanela < 1024;

  useEffect(() => {
    async function iniciar() {
      await validarAdmin();
    }

    void iniciar();
  }, []);

  async function validarAdmin() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      const user = data.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id, tipo_utilizador")
        .eq("id", user.id)
        .single<ClienteDB>();

      if (clienteError || !cliente || cliente.tipo_utilizador !== "admin") {
        router.replace("/login");
        return;
      }

      await carregarDados();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao validar acesso admin.");
      router.replace("/login");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarDados(silencioso = false) {
    try {
      if (silencioso) {
        setAAtualizar(true);
      } else {
        setACarregar(true);
      }

      setMensagem("");

      const [processosRes, artigosRes] = await Promise.all([
        supabase
          .from("processos")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("artigos")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (processosRes.error) throw processosRes.error;
      if (artigosRes.error) throw artigosRes.error;

      const listaProcessos = (processosRes.data || []) as Processo[];

      const listaArtigos = ((artigosRes.data || []) as ArtigoDB[]).map(
        (artigo) => ({
          id: artigo.id,
          processo_id: artigo.processo_id,
          tipo: artigo.tipo,
          nome: artigo.nome,
          resumo: artigo.resumo,
          dados:
            artigo.dados && typeof artigo.dados === "object"
              ? (artigo.dados as DadosArtigo)
              : null,
          created_at: artigo.created_at,
        })
      );

      const diasIniciais: Record<string, string> = {};

      for (const processo of listaProcessos) {
        diasIniciais[processo.id] =
          processo.dias_acabamento_previstos !== null &&
          processo.dias_acabamento_previstos !== undefined
            ? String(processo.dias_acabamento_previstos)
            : "";
      }

      setProcessos(listaProcessos);
      setArtigos(listaArtigos);
      setDiasAcabamentoEdit(diasIniciais);
      setUltimaAtualizacao(new Date());

      setProcessoAberto((atual) => {
        if (!atual) return null;
        return listaProcessos.some((p) => p.id === atual) ? atual : null;
      });
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar dashboard admin.");
    } finally {
      setACarregar(false);
      setAAtualizar(false);
    }
  }

  async function atualizarAgora() {
    await carregarDados(true);
  }

  async function guardarDiasAcabamento(processo: Processo) {
    try {
      setProcessoAGuardarAcabamento(processo.id);
      setMensagem("");

      const valorTexto = (diasAcabamentoEdit[processo.id] || "").trim();
      const diasAcabamento =
        valorTexto === "" ? 0 : Number(valorTexto.replace(",", "."));

      if (Number.isNaN(diasAcabamento) || diasAcabamento < 0) {
        setMensagem("Introduz um número válido de dias de acabamento.");
        return;
      }

      const diasFabrico = Number(processo.dias_fabrico_previstos || 0);
      const diasMontagem = Number(processo.dias_montagem_previstos || 0);

      const diasTotais =
        diasFabrico + Number(diasAcabamento) + diasMontagem > 0
          ? diasFabrico + Number(diasAcabamento) + diasMontagem
          : Number(processo.dias_totais_previstos || 0) || Number(diasAcabamento);

      const payload = {
        dias_acabamento_previstos: Number(diasAcabamento),
        dias_totais_previstos: diasTotais,
      };

      const { error } = await supabase
        .from("processos")
        .update(payload)
        .eq("id", processo.id);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((item) =>
          item.id === processo.id
            ? {
                ...item,
                dias_acabamento_previstos: Number(diasAcabamento),
                dias_totais_previstos: diasTotais,
              }
            : item
        )
      );

      setMensagem("Dias de acabamento guardados com sucesso.");
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao guardar dias de acabamento.");
    } finally {
      setProcessoAGuardarAcabamento(null);
    }
  }

  function limparFiltros() {
    setPesquisa("");
    setFiltroEstado("Todos");
    setOrdenacao("recentes");
  }

  function obterArtigosDoProcesso(processoId: string) {
    return artigos.filter((artigo) => artigo.processo_id === processoId);
  }

  function formatarEuro(valor: number | null | undefined, fallback = "—") {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
      return fallback;
    }

    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(Number(valor));
  }

  function formatarData(valor: string | null | undefined) {
    if (!valor) return "—";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "—";

    return data.toLocaleDateString("pt-PT");
  }

  function formatarDataHora(valor: Date | null) {
    if (!valor) return "—";

    return valor.toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function obterValorFinanceiroProcesso(processo: Processo) {
    return Number(
      processo.valor_final ??
        processo.valor_estimado_com_desconto ??
        processo.valor_estimado ??
        0
    );
  }

  function obterEstadoVisual(estado: string | null) {
    const mapa: Record<
      string,
      { texto: string; background: string; border: string; color: string }
    > = {
      "Pedido Submetido": {
        texto: "Pedido Submetido",
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#ffffff",
      },
      "Em Análise": {
        texto: "Em Análise",
        background: "rgba(244,180,0,0.16)",
        border: "1px solid rgba(244,180,0,0.40)",
        color: "#ffd76c",
      },
      "Orçamento Enviado": {
        texto: "Orçamento Enviado",
        background: "rgba(66,133,244,0.16)",
        border: "1px solid rgba(66,133,244,0.40)",
        color: "#9fc3ff",
      },
      Validado: {
        texto: "Validado",
        background: "rgba(52,168,83,0.18)",
        border: "1px solid rgba(52,168,83,0.45)",
        color: "#9df5b4",
      },
      Rejeitado: {
        texto: "Rejeitado",
        background: "rgba(234,67,53,0.16)",
        border: "1px solid rgba(234,67,53,0.45)",
        color: "#ff9d9d",
      },
    };

    return (
      mapa[estado || ""] || {
        texto: estado || "Sem estado",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "white",
      }
    );
  }

  const processosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    let lista = [...processos];

    if (termo) {
      lista = lista.filter((processo) => {
        const nomeObra = (processo.nome_obra || "").toLowerCase();
        const nomeCliente = (processo.nome_cliente || "").toLowerCase();
        const localizacao = (processo.localizacao || "").toLowerCase();
        const estado = (processo.estado || "").toLowerCase();
        const observacoes = (processo.observacoes || "").toLowerCase();

        return (
          nomeObra.includes(termo) ||
          nomeCliente.includes(termo) ||
          localizacao.includes(termo) ||
          estado.includes(termo) ||
          observacoes.includes(termo)
        );
      });
    }

    if (filtroEstado !== "Todos") {
      lista = lista.filter((processo) => processo.estado === filtroEstado);
    }

    lista.sort((a, b) => {
      if (ordenacao === "valor_desc") {
        return obterValorFinanceiroProcesso(b) - obterValorFinanceiroProcesso(a);
      }

      if (ordenacao === "valor_asc") {
        return obterValorFinanceiroProcesso(a) - obterValorFinanceiroProcesso(b);
      }

      if (ordenacao === "entrega_asc") {
        const entregaA = a.data_entrega_prevista
          ? new Date(a.data_entrega_prevista).getTime()
          : Number.MAX_SAFE_INTEGER;
        const entregaB = b.data_entrega_prevista
          ? new Date(b.data_entrega_prevista).getTime()
          : Number.MAX_SAFE_INTEGER;

        return entregaA - entregaB;
      }

      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (ordenacao === "antigos") {
        return dataA - dataB;
      }

      return dataB - dataA;
    });

    return lista;
  }, [processos, pesquisa, filtroEstado, ordenacao]);

  const resumo = useMemo(() => {
    const valorTotal = processos.reduce(
      (acc, processo) => acc + obterValorFinanceiroProcesso(processo),
      0
    );

    const totalArtigos = artigos.length;

    const proximasEntregas = processos
      .filter((p) => p.data_entrega_prevista)
      .sort((a, b) => {
        const dataA = a.data_entrega_prevista
          ? new Date(a.data_entrega_prevista).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dataB = b.data_entrega_prevista
          ? new Date(b.data_entrega_prevista).getTime()
          : Number.MAX_SAFE_INTEGER;

        return dataA - dataB;
      })
      .slice(0, 3);

    return {
      total: processos.length,
      submetidos: processos.filter((p) => p.estado === "Pedido Submetido").length,
      analise: processos.filter((p) => p.estado === "Em Análise").length,
      enviados: processos.filter((p) => p.estado === "Orçamento Enviado").length,
      validados: processos.filter((p) => p.estado === "Validado").length,
      valorTotal,
      totalArtigos,
      proximasEntregas,
    };
  }, [processos, artigos]);

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <aside style={asideStyle}>
          <div style={logoStyle}>VALERIE</div>
        </aside>

        <section style={contentStyle}>
          <div style={cardStyle}>
            <h1 style={{ marginTop: 0 }}>Dashboard Admin</h1>
            <p style={{ opacity: 0.8 }}>A verificar acesso...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          <a href="/admin" style={{ ...menuStyle, ...menuActiveStyle }}>
            Dashboard
          </a>
          <a href="/admin/processos" style={menuStyle}>
            Processos
          </a>
          <a href="/admin/clientes" style={menuStyle}>
            Clientes
          </a>
          <a href="/admin/precos" style={menuStyle}>
            Preços
          </a>
          <a href="/admin/financeiro" style={menuStyle}>
            Financeiro
          </a>
          <a href="/admin/calendario" style={menuStyle}>
            Calendário
          </a>
          <a href="/aprovacao-clientes" style={menuStyle}>
            Aprovação Clientes
          </a>
        </div>

        <div style={{ marginTop: "20px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle}>
        <div
          style={{
            ...heroStyle,
            flexDirection: eDesktop ? "row" : "column",
            alignItems: eDesktop ? "center" : "stretch",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>Painel Administrativo</div>
            <h1 style={{ ...titleStyle, fontSize: eDesktop ? "48px" : "34px" }}>
              Dashboard Admin
            </h1>
            <p style={subtitleStyle}>
              Gere processos, valida pedidos e ajusta os dias de acabamento para
              cada obra.
            </p>
            <div style={heroMetaStyle}>
              Última atualização: {formatarDataHora(ultimaAtualizacao)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              width: eDesktop ? "auto" : "100%",
            }}
          >
            <button
              type="button"
              onClick={atualizarAgora}
              disabled={aAtualizar}
              style={{
                ...botaoSecundarioStyle,
                width: eDesktop ? "auto" : "100%",
                justifyContent: "center",
                display: "inline-flex",
              }}
            >
              {aAtualizar ? "A atualizar..." : "Atualizar"}
            </button>

            <a
              href="/admin/calendario"
              style={{
                ...botaoLinkStyle,
                width: eDesktop ? "auto" : "100%",
                justifyContent: "center",
              }}
            >
              Abrir Calendário
            </a>
          </div>
        </div>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}

        <div
          style={{
            ...resumoGridStyle,
            gridTemplateColumns: eDesktop
              ? "repeat(7, minmax(0, 1fr))"
              : eTablet
              ? "repeat(3, minmax(0, 1fr))"
              : "1fr 1fr",
          }}
        >
          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle}>{resumo.total}</div>
            <div>Total</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle}>{resumo.submetidos}</div>
            <div>Submetidos</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle}>{resumo.analise}</div>
            <div>Em Análise</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle}>{resumo.enviados}</div>
            <div>Enviados</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle}>{resumo.validados}</div>
            <div>Validados</div>
          </div>

          <div style={resumoCardStyle}>
            <div
              style={{
                ...resumoNumeroStyle,
                fontSize: eDesktop ? "24px" : "20px",
              }}
            >
              {formatarEuro(resumo.valorTotal, "0,00 €")}
            </div>
            <div>Valor Total</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle}>{resumo.totalArtigos}</div>
            <div>Artigos</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: eDesktop ? "1.35fr 1fr" : "1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={cardStyle}>
            <div style={secaoTituloWrapStyle}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: "6px" }}>
                  Processos
                </h2>
                <p style={{ margin: 0, opacity: 0.75 }}>
                  Abre o detalhe para ajustar os dias de acabamento.
                </p>
              </div>

              <div style={countBadgeStyle}>
                {processosFiltrados.length}{" "}
                {processosFiltrados.length === 1 ? "processo" : "processos"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: eDesktop ? "1.5fr 1fr 1fr auto" : "1fr",
                gap: "12px",
                marginTop: "18px",
                marginBottom: "10px",
              }}
            >
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar por obra, cliente, localização, estado ou observações"
                style={inputPesquisaStyle}
              />

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoFiltro)}
                style={selectStyle}
              >
                {ESTADOS_FILTRO.map((estado) => (
                  <option key={estado} value={estado} style={optionStyle}>
                    {estado}
                  </option>
                ))}
              </select>

              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                style={selectStyle}
              >
                <option value="recentes" style={optionStyle}>
                  Mais recentes
                </option>
                <option value="antigos" style={optionStyle}>
                  Mais antigos
                </option>
                <option value="valor_desc" style={optionStyle}>
                  Maior valor
                </option>
                <option value="valor_asc" style={optionStyle}>
                  Menor valor
                </option>
                <option value="entrega_asc" style={optionStyle}>
                  Entrega mais próxima
                </option>
              </select>

              <button
                type="button"
                onClick={limparFiltros}
                style={{
                  ...botaoSecundarioStyle,
                  width: eDesktop ? "auto" : "100%",
                }}
              >
                Limpar
              </button>
            </div>

            {aCarregar ? (
              <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={skeletonLinhaStyle} />
                ))}
              </div>
            ) : processosFiltrados.length === 0 ? (
              <p style={{ opacity: 0.75, marginTop: "18px" }}>
                Nenhum processo encontrado.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
                {processosFiltrados.map((processo) => {
                  const aberto = processoAberto === processo.id;
                  const artigosDoProcesso = obterArtigosDoProcesso(processo.id);
                  const estadoVisual = obterEstadoVisual(processo.estado);

                  return (
                    <div key={processo.id} style={linhaStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "16px",
                          alignItems: eDesktop ? "flex-start" : "stretch",
                          flexDirection: eDesktop ? "row" : "column",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "10px",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "bold",
                                fontSize: eDesktop ? "20px" : "17px",
                                minWidth: 0,
                              }}
                            >
                              {processo.nome_obra || "Sem nome de obra"}
                            </div>

                            <div
                              style={{
                                ...estadoBadgeStyle,
                                background: estadoVisual.background,
                                border: estadoVisual.border,
                                color: estadoVisual.color,
                              }}
                            >
                              {estadoVisual.texto}
                            </div>
                          </div>

                          <div style={metaGridStyle}>
                            <div style={metaMiniCardStyle}>
                              <div style={metaMiniLabelStyle}>Cliente</div>
                              <div style={metaMiniValueStyle}>
                                {processo.nome_cliente || "—"}
                              </div>
                            </div>

                            <div style={metaMiniCardStyle}>
                              <div style={metaMiniLabelStyle}>Localização</div>
                              <div style={metaMiniValueStyle}>
                                {processo.localizacao || "—"}
                              </div>
                            </div>

                            <div style={metaMiniCardStyle}>
                              <div style={metaMiniLabelStyle}>Valor final</div>
                              <div style={metaMiniValueStyle}>
                                {formatarEuro(
                                  processo.valor_final,
                                  "A aguardar"
                                )}
                              </div>
                            </div>

                            <div style={metaMiniCardStyle}>
                              <div style={metaMiniLabelStyle}>Entrega</div>
                              <div style={metaMiniValueStyle}>
                                {formatarData(processo.data_entrega_prevista)}
                              </div>
                            </div>
                          </div>

                          <div style={subtextoStyle}>
                            Artigos associados: {artigosDoProcesso.length}
                          </div>
                        </div>

                        <div style={{ width: eDesktop ? "auto" : "100%" }}>
                          <button
                            type="button"
                            onClick={() =>
                              setProcessoAberto(aberto ? null : processo.id)
                            }
                            style={{
                              ...botaoSecundarioStyle,
                              width: eDesktop ? "auto" : "100%",
                            }}
                          >
                            {aberto ? "Fechar detalhe" : "Ver detalhe"}
                          </button>
                        </div>
                      </div>

                      {aberto && (
                        <div style={detalheStyle}>
                          <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                            Detalhe do Processo
                          </h3>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: eDesktop ? "1fr 1fr" : "1fr",
                              gap: "16px",
                            }}
                          >
                            <div style={blocoDetalheStyle}>
                              <div style={blocoTituloStyle}>
                                Informação Geral
                              </div>

                              <p>
                                <strong>Cliente:</strong>{" "}
                                {processo.nome_cliente || "—"}
                              </p>
                              <p>
                                <strong>Obra:</strong>{" "}
                                {processo.nome_obra || "—"}
                              </p>
                              <p>
                                <strong>Localização:</strong>{" "}
                                {processo.localizacao || "—"}
                              </p>
                              <p>
                                <strong>Observações:</strong>{" "}
                                {processo.observacoes || "—"}
                              </p>
                              <p>
                                <strong>Estado:</strong>{" "}
                                {processo.estado || "—"}
                              </p>
                              <p>
                                <strong>Data de criação:</strong>{" "}
                                {formatarData(processo.created_at)}
                              </p>
                              <p>
                                <strong>Entrega prevista:</strong>{" "}
                                {formatarData(processo.data_entrega_prevista)}
                              </p>
                              <p>
                                <strong>Dias fabrico:</strong>{" "}
                                {processo.dias_fabrico_previstos ?? "—"}
                              </p>
                              <p>
                                <strong>Dias acabamento:</strong>{" "}
                                {processo.dias_acabamento_previstos ?? "—"}
                              </p>
                              <p>
                                <strong>Dias montagem:</strong>{" "}
                                {processo.dias_montagem_previstos ?? "—"}
                              </p>
                              <p>
                                <strong>Dias totais:</strong>{" "}
                                {processo.dias_totais_previstos ?? "—"}
                              </p>
                            </div>

                            <div style={blocoDetalheStyle}>
                              <div style={blocoTituloStyle}>
                                Informação Financeira
                              </div>

                              <p>
                                <strong>Desconto:</strong>{" "}
                                {processo.desconto_percentual !== null &&
                                processo.desconto_percentual !== undefined
                                  ? `${Number(
                                      processo.desconto_percentual
                                    ).toFixed(2)}%`
                                  : "0.00%"}
                              </p>
                              <p>
                                <strong>Valor estimado:</strong>{" "}
                                {formatarEuro(processo.valor_estimado)}
                              </p>
                              <p>
                                <strong>Valor com desconto:</strong>{" "}
                                {formatarEuro(
                                  processo.valor_estimado_com_desconto
                                )}
                              </p>
                              <p>
                                <strong>Valor final:</strong>{" "}
                                {formatarEuro(
                                  processo.valor_final,
                                  "A aguardar"
                                )}
                              </p>
                            </div>
                          </div>

                          <div style={editarAcabamentoBoxStyle}>
                            <div>
                              <div style={blocoTituloStyle}>
                                Ajustar dias de acabamento
                              </div>
                              <div style={subtextoStyle}>
                                Usa este campo quando uma obra precisar de mais
                                ou menos tempo de acabamento.
                              </div>
                            </div>

                            <div
                              style={{
                                ...editarAcabamentoGridStyle,
                                gridTemplateColumns: eDesktop
                                  ? "1fr auto"
                                  : "1fr",
                              }}
                            >
                              <input
                                value={diasAcabamentoEdit[processo.id] || ""}
                                onChange={(e) =>
                                  setDiasAcabamentoEdit((prev) => ({
                                    ...prev,
                                    [processo.id]: e.target.value,
                                  }))
                                }
                                placeholder="Ex: 7"
                                type="number"
                                min="0"
                                step="1"
                                style={inputPesquisaStyle}
                              />

                              <button
                                type="button"
                                onClick={() => guardarDiasAcabamento(processo)}
                                disabled={
                                  processoAGuardarAcabamento === processo.id
                                }
                                style={{
                                  ...botaoLinkStyle,
                                  width: eDesktop ? "auto" : "100%",
                                }}
                              >
                                {processoAGuardarAcabamento === processo.id
                                  ? "A guardar..."
                                  : "Guardar acabamento"}
                              </button>
                            </div>
                          </div>

                          {processo.notas_admin && (
                            <div style={notasBoxStyle}>
                              <strong>Notas da equipa</strong>
                              <div style={{ marginTop: "8px", lineHeight: 1.5 }}>
                                {processo.notas_admin}
                              </div>
                            </div>
                          )}

                          <h4 style={{ marginTop: "26px", marginBottom: "12px" }}>
                            Artigos
                          </h4>

                          {artigosDoProcesso.length === 0 ? (
                            <p style={{ opacity: 0.75 }}>
                              Sem artigos associados.
                            </p>
                          ) : (
                            <div style={{ display: "grid", gap: "12px" }}>
                              {artigosDoProcesso.map((artigo) => {
                                const dados = artigo.dados || {};
                                const extras = Array.isArray(dados.extras)
                                  ? dados.extras
                                  : [];

                                return (
                                  <div key={artigo.id} style={artigoStyle}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        flexDirection: eDesktop
                                          ? "row"
                                          : "column",
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            fontWeight: "bold",
                                            fontSize: "17px",
                                            marginBottom: "6px",
                                          }}
                                        >
                                          {artigo.nome || "Artigo"}
                                        </div>
                                        <div style={subtextoStyle}>
                                          <strong>Tipo:</strong>{" "}
                                          {artigo.tipo || "—"}
                                        </div>
                                        <div style={subtextoStyle}>
                                          <strong>Resumo:</strong>{" "}
                                          {artigo.resumo || "—"}
                                        </div>
                                        <div style={subtextoStyle}>
                                          <strong>Material:</strong>{" "}
                                          {dados.material || "—"}
                                        </div>
                                      </div>

                                      <div style={dimensoesBoxStyle}>
                                        <div style={dimensaoItemStyle}>
                                          <span style={dimensaoLabelStyle}>
                                            Largura
                                          </span>
                                          <span style={dimensaoValorStyle}>
                                            {dados.largura !== undefined
                                              ? `${dados.largura} m`
                                              : "—"}
                                          </span>
                                        </div>
                                        <div style={dimensaoItemStyle}>
                                          <span style={dimensaoLabelStyle}>
                                            Altura
                                          </span>
                                          <span style={dimensaoValorStyle}>
                                            {dados.altura !== undefined
                                              ? `${dados.altura} m`
                                              : "—"}
                                          </span>
                                        </div>
                                        <div style={dimensaoItemStyle}>
                                          <span style={dimensaoLabelStyle}>
                                            Profundidade
                                          </span>
                                          <span style={dimensaoValorStyle}>
                                            {dados.profundidade !== undefined
                                              ? `${dados.profundidade} m`
                                              : "—"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{ marginTop: "14px" }}>
                                      <strong>Extras</strong>
                                      {extras.length === 0 ? (
                                        <div style={subtextoStyle}>Sem extras</div>
                                      ) : (
                                        <div
                                          style={{
                                            display: "grid",
                                            gap: "6px",
                                            marginTop: "8px",
                                          }}
                                        >
                                          {extras.map((extra, index) => (
                                            <div
                                              key={index}
                                              style={extraLinhaStyle}
                                            >
                                              <span>{extra.nome || "Extra"}</span>
                                              <span>
                                                Qtd: {extra.quantidade ?? "—"}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
              Próximas Entregas
            </h2>
            <p style={{ marginTop: 0, opacity: 0.75, marginBottom: "18px" }}>
              As próximas datas previstas dos projetos.
            </p>

            {resumo.proximasEntregas.length === 0 ? (
              <p style={{ opacity: 0.75 }}>
                Ainda não existem entregas previstas.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {resumo.proximasEntregas.map((processo) => {
                  const estadoVisual = obterEstadoVisual(processo.estado);

                  return (
                    <div key={processo.id} style={entregaCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                            {processo.nome_obra || "Sem nome"}
                          </div>
                          <div style={subtextoStyle}>
                            {processo.nome_cliente || "Cliente por definir"}
                          </div>
                        </div>

                        <div
                          style={{
                            ...estadoBadgeStyle,
                            background: estadoVisual.background,
                            border: estadoVisual.border,
                            color: estadoVisual.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {estadoVisual.texto}
                        </div>
                      </div>

                      <div style={entregaMetaRowStyle}>
                        <div style={entregaMetaItemStyle}>
                          <span style={entregaMetaLabelStyle}>Entrega</span>
                          <span style={entregaMetaValueStyle}>
                            {formatarData(processo.data_entrega_prevista)}
                          </span>
                        </div>

                        <div style={entregaMetaItemStyle}>
                          <span style={entregaMetaLabelStyle}>Valor</span>
                          <span style={entregaMetaValueStyle}>
                            {formatarEuro(
                              obterValorFinanceiroProcesso(processo)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
  fontFamily: "Arial, sans-serif",
  display: "flex",
};

const asideStyle: CSSProperties = {
  width: "260px",
  minHeight: "100dvh",
  padding: "30px 20px",
  background: "rgba(0,0,0,0.14)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  flexShrink: 0,
};

const logoStyle: CSSProperties = {
  fontSize: "36px",
  letterSpacing: "9px",
  marginBottom: "36px",
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
  textDecoration: "none",
  display: "block",
};

const menuActiveStyle: CSSProperties = {
  background: "rgba(92,115,199,0.35)",
  border: "1px solid rgba(92,115,199,0.65)",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "40px",
  overflowX: "hidden",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
  padding: "24px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
};

const heroMetaStyle: CSSProperties = {
  marginTop: "14px",
  fontSize: "13px",
  opacity: 0.75,
};

const eyebrowStyle: CSSProperties = {
  fontSize: "12px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: "10px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "48px",
  lineHeight: 1.05,
};

const subtitleStyle: CSSProperties = {
  marginTop: "12px",
  marginBottom: 0,
  opacity: 0.85,
  fontSize: "18px",
  lineHeight: 1.45,
  maxWidth: "760px",
};

const resumoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const resumoCardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
};

const resumoNumeroStyle: CSSProperties = {
  fontSize: "34px",
  fontWeight: "bold",
  marginBottom: "8px",
};

const cardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
};

const secaoTituloWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const linhaStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: "16px",
};

const skeletonLinhaStyle: CSSProperties = {
  height: "120px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const detalheStyle: CSSProperties = {
  marginTop: "4px",
  padding: "18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const blocoDetalheStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const blocoTituloStyle: CSSProperties = {
  fontWeight: "bold",
  fontSize: "15px",
  marginBottom: "10px",
};

const artigoStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  marginTop: "6px",
};

const metaMiniCardStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const metaMiniLabelStyle: CSSProperties = {
  fontSize: "12px",
  opacity: 0.75,
  marginBottom: "6px",
};

const metaMiniValueStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: "bold",
  lineHeight: 1.3,
  wordBreak: "break-word",
};

const dimensoesBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: "220px",
};

const dimensaoItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 10px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.04)",
};

const dimensaoLabelStyle: CSSProperties = {
  opacity: 0.78,
};

const dimensaoValorStyle: CSSProperties = {
  fontWeight: "bold",
};

const extraLinhaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 10px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.04)",
};

const entregaCardStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: "12px",
};

const entregaMetaRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const entregaMetaItemStyle: CSSProperties = {
  padding: "10px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
};

const entregaMetaLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "12px",
  opacity: 0.72,
  marginBottom: "4px",
};

const entregaMetaValueStyle: CSSProperties = {
  fontWeight: "bold",
  fontSize: "14px",
};

const subtextoStyle: CSSProperties = {
  opacity: 0.85,
  fontSize: "14px",
  marginTop: "4px",
  lineHeight: 1.4,
};

const notasBoxStyle: CSSProperties = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "12px",
  background: "rgba(92,115,199,0.14)",
  border: "1px solid rgba(92,115,199,0.30)",
};

const editarAcabamentoBoxStyle: CSSProperties = {
  marginTop: "16px",
  padding: "16px",
  borderRadius: "12px",
  background: "rgba(92,115,199,0.14)",
  border: "1px solid rgba(92,115,199,0.30)",
  display: "grid",
  gap: "14px",
};

const editarAcabamentoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "10px",
  alignItems: "center",
};

const mensagemStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
};

const inputPesquisaStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const optionStyle: CSSProperties = {
  color: "black",
};

const botaoSecundarioStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoLinkStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const estadoBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "12px",
};

const countBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: "13px",
  fontWeight: "bold",
};