"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  nome: string | null;
  email: string | null;
  tipo_utilizador: string | null;
  estado: string | null;
  aprovado: boolean | null;
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
type Ordenacao = "recentes" | "antigos" | "valor_desc" | "valor_asc";

export default function ProcessosClientePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [larguraJanela, setLarguraJanela] = useState(1400);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState("");

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
    validarCliente();
  }, []);

  async function validarCliente() {
    try {
      const { data: sessaoData, error: sessaoError } =
        await supabase.auth.getSession();

      if (sessaoError) throw sessaoError;

      const user = sessaoData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id, nome, email, tipo_utilizador, estado, aprovado")
        .eq("id", user.id)
        .single<ClienteDB>();

      if (clienteError || !cliente) {
        throw clienteError || new Error("Cliente não encontrado.");
      }

      if (cliente.tipo_utilizador === "admin") {
        router.replace("/admin");
        return;
      }

      if (cliente.estado === "pendente" || cliente.aprovado === false) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (cliente.estado === "rejeitado") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setClienteId(cliente.id);
      setNomeCliente(cliente.nome || "Cliente");

      await carregarDados(cliente.id);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao validar sessão do cliente.");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarDados(userId: string, silencioso = false) {
    try {
      if (silencioso) {
        setAAtualizar(true);
      } else {
        setACarregar(true);
      }

      setMensagem("");

      const { data: processosData, error: processosError } = await supabase
        .from("processos")
        .select("*")
        .eq("cliente_id", userId)
        .order("created_at", { ascending: false });

      if (processosError) throw processosError;

      const listaProcessos = (processosData || []) as Processo[];
      const idsProcessos = listaProcessos.map((p) => p.id);

      let listaArtigos: Artigo[] = [];

      if (idsProcessos.length > 0) {
        const { data: artigosData, error: artigosError } = await supabase
          .from("artigos")
          .select("*")
          .in("processo_id", idsProcessos)
          .order("created_at", { ascending: true });

        if (artigosError) throw artigosError;

        listaArtigos = ((artigosData || []) as ArtigoDB[]).map((artigo) => ({
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
        }));
      }

      setProcessos(listaProcessos);
      setArtigos(listaArtigos);

      setProcessoAberto((atual) => {
        if (!atual) return null;
        return listaProcessos.some((p) => p.id === atual) ? atual : null;
      });
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar os seus processos.");
    } finally {
      setACarregar(false);
      setAAtualizar(false);
    }
  }

  async function atualizarAgora() {
    if (!clienteId) return;
    await carregarDados(clienteId, true);
  }

  function navegar(path: string) {
    router.push(path);
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
        const localizacao = (processo.localizacao || "").toLowerCase();
        const estado = (processo.estado || "").toLowerCase();
        const observacoes = (processo.observacoes || "").toLowerCase();

        return (
          nomeObra.includes(termo) ||
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

      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (ordenacao === "antigos") return dataA - dataB;

      return dataB - dataA;
    });

    return lista;
  }, [processos, pesquisa, filtroEstado, ordenacao]);

  const resumo = useMemo(() => {
    return {
      total: processos.length,
      submetidos: processos.filter((p) => p.estado === "Pedido Submetido").length,
      analise: processos.filter((p) => p.estado === "Em Análise").length,
      enviados: processos.filter(
        (p) => p.estado === "Orçamento Enviado" || p.estado === "Validado"
      ).length,
    };
  }, [processos]);

  const menu = [
    { label: "Dashboard", path: "/dashboard-cliente" },
    { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
    { label: "Processos", path: "/processos-cliente" },
    { label: "Perfil", path: "/perfil-cliente" },
  ];

  if (aVerificar) {
    return (
      <main style={mainLayoutStyle(eDesktop)}>
        <section style={contentStyle(eDesktop, eTablet)}>
          <div style={cardStyle}>
            <h1 style={{ marginTop: 0 }}>Processos</h1>
            <p style={{ opacity: 0.8 }}>A verificar sessão...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={mainLayoutStyle(eDesktop)}>
      <aside style={asideStyle(eDesktop)}>
        <div style={logoStyle(eDesktop)}>VALERIE</div>

        <div style={menuContainerStyle(eDesktop)}>
          {menu.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navegar(item.path)}
              style={{
                ...menuButtonStyle,
                ...(pathname === item.path ? menuButtonActiveStyle : {}),
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

      <section style={contentStyle(eDesktop, eTablet)}>
        <div style={topBarStyle(eDesktop)}>
          <div>
            <h1 style={{ fontSize: eDesktop ? "38px" : "30px", margin: 0 }}>
              Processos
            </h1>
            <p style={{ opacity: 0.8, marginTop: "10px", lineHeight: 1.45 }}>
              {nomeCliente
                ? `Aqui pode acompanhar todos os pedidos de ${nomeCliente}.`
                : "Aqui pode acompanhar todos os seus pedidos."}
            </p>
          </div>

          <div style={topBarActionsStyle(eDesktop)}>
            <button
              type="button"
              onClick={atualizarAgora}
              disabled={aAtualizar}
              style={botaoSecundarioStyle}
            >
              {aAtualizar ? "A atualizar..." : "Atualizar"}
            </button>

            <button
              type="button"
              onClick={() => navegar("/novo-orcamento-cliente")}
              style={botaoPrincipalStyle}
            >
              Novo Orçamento
            </button>
          </div>
        </div>

        {mensagem && <div style={mensagemErroStyle}>{mensagem}</div>}

        <div
          style={{
            ...resumoGridStyle,
            gridTemplateColumns: eDesktop
              ? "repeat(4, minmax(0, 1fr))"
              : "repeat(2, minmax(0, 1fr))",
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
            <div>Enviados / Validados</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={filtrosGridStyle(eDesktop)}>
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar por obra, localização, estado ou observações"
              style={inputStyle}
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
            </select>
          </div>

          {aCarregar ? (
            <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={skeletonLinhaStyle} />
              ))}
            </div>
          ) : processosFiltrados.length === 0 ? (
            <div style={vazioStyle}>
              {processos.length === 0
                ? "Ainda não existem processos submetidos nesta conta."
                : "Nenhum processo corresponde aos filtros aplicados."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
              {processosFiltrados.map((processo) => {
                const aberto = processoAberto === processo.id;
                const estadoVisual = obterEstadoVisual(processo.estado);
                const artigosDoProcesso = obterArtigosDoProcesso(processo.id);

                return (
                  <div key={processo.id} style={linhaStyle}>
                    <div style={linhaHeaderStyle(eDesktop)}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={tituloLinhaStyle}>
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

                        <div style={metaGridStyle}>
                          <Info label="Localização" valor={processo.localizacao} />
                          <Info
                            label="Data do pedido"
                            valor={formatarData(processo.created_at)}
                          />
                          <Info
                            label="Entrega prevista"
                            valor={formatarData(processo.data_entrega_prevista)}
                          />
                          <Info
                            label="Artigos"
                            valor={String(artigosDoProcesso.length)}
                          />
                        </div>
                      </div>

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

                    <div style={valoresGridStyle(eDesktop)}>
                      <Info
                        label="Estimativa"
                        valor={formatarEuro(processo.valor_estimado)}
                      />
                      <Info
                        label="Com desconto"
                        valor={formatarEuro(processo.valor_estimado_com_desconto)}
                      />
                      <Info
                        label="Valor final"
                        valor={formatarEuro(processo.valor_final, "A aguardar")}
                      />
                      <Info
                        label="Desconto"
                        valor={
                          processo.desconto_percentual !== null &&
                          processo.desconto_percentual !== undefined
                            ? `${Number(processo.desconto_percentual).toFixed(2)}%`
                            : "0.00%"
                        }
                      />
                    </div>

                    {aberto && (
                      <div style={detalheStyle}>
                        <h3 style={{ marginTop: 0 }}>Detalhe do Processo</h3>

                        <div style={detalheGridStyle(eDesktop)}>
                          <div style={blocoDetalheStyle}>
                            <h4 style={{ marginTop: 0 }}>Informação Geral</h4>
                            <p>
                              <strong>Obra:</strong> {processo.nome_obra || "—"}
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
                              <strong>Estado:</strong> {processo.estado || "—"}
                            </p>
                            <p>
                              <strong>Dias previstos:</strong>{" "}
                              {processo.dias_totais_previstos ?? "—"}
                            </p>
                          </div>

                          <div style={blocoDetalheStyle}>
                            <h4 style={{ marginTop: 0 }}>Notas e Valores</h4>
                            <p>
                              <strong>Valor estimado:</strong>{" "}
                              {formatarEuro(processo.valor_estimado)}
                            </p>
                            <p>
                              <strong>Valor com desconto:</strong>{" "}
                              {formatarEuro(processo.valor_estimado_com_desconto)}
                            </p>
                            <p>
                              <strong>Valor final:</strong>{" "}
                              {formatarEuro(processo.valor_final, "A aguardar")}
                            </p>
                            <p>
                              <strong>Notas da equipa:</strong>{" "}
                              {processo.notas_admin || "—"}
                            </p>
                          </div>
                        </div>

                        <h4 style={{ marginTop: "24px" }}>Artigos</h4>

                        {artigosDoProcesso.length === 0 ? (
                          <p style={{ opacity: 0.75 }}>Sem artigos associados.</p>
                        ) : (
                          <div style={{ display: "grid", gap: "12px" }}>
                            {artigosDoProcesso.map((artigo) => {
                              const dados = artigo.dados || {};
                              const extras = Array.isArray(dados.extras)
                                ? dados.extras
                                : [];

                              return (
                                <div key={artigo.id} style={artigoStyle}>
                                  <div style={{ fontWeight: "bold", fontSize: "17px" }}>
                                    {artigo.nome || "Artigo"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Tipo:</strong> {artigo.tipo || "—"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Resumo:</strong> {artigo.resumo || "—"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Material:</strong> {dados.material || "—"}
                                  </div>

                                  <div style={dimensoesGridStyle(eDesktop)}>
                                    <Info
                                      label="Largura"
                                      valor={
                                        dados.largura !== undefined
                                          ? `${dados.largura} m`
                                          : "—"
                                      }
                                    />
                                    <Info
                                      label="Altura"
                                      valor={
                                        dados.altura !== undefined
                                          ? `${dados.altura} m`
                                          : "—"
                                      }
                                    />
                                    <Info
                                      label="Profundidade"
                                      valor={
                                        dados.profundidade !== undefined
                                          ? `${dados.profundidade} m`
                                          : "—"
                                      }
                                    />
                                  </div>

                                  <div style={{ marginTop: "12px" }}>
                                    <strong>Extras</strong>
                                    {extras.length === 0 ? (
                                      <div style={subtextoStyle}>Sem extras</div>
                                    ) : (
                                      <div style={{ display: "grid", gap: "6px", marginTop: "8px" }}>
                                        {extras.map((extra, index) => (
                                          <div key={index} style={extraLinhaStyle}>
                                            <span>{extra.nome || "Extra"}</span>
                                            <span>Qtd: {extra.quantidade ?? "—"}</span>
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
      </section>
    </main>
  );
}

function Info({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValorStyle}>{valor || "—"}</div>
    </div>
  );
}

const mainLayoutStyle = (eDesktop: boolean): CSSProperties => ({
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  flexDirection: eDesktop ? "row" : "column",
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden",
});

const asideStyle = (eDesktop: boolean): CSSProperties => ({
  width: eDesktop ? "260px" : "100%",
  minHeight: eDesktop ? "100dvh" : "auto",
  borderRight: eDesktop ? "1px solid rgba(255,255,255,0.08)" : "none",
  borderBottom: eDesktop ? "none" : "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: eDesktop ? "30px 20px" : "18px 16px",
  flexShrink: 0,
});

const contentStyle = (eDesktop: boolean, eTablet: boolean): CSSProperties => ({
  flex: 1,
  padding: eDesktop ? "40px" : eTablet ? "24px" : "16px",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
});

const logoStyle = (eDesktop: boolean): CSSProperties => ({
  fontSize: eDesktop ? "38px" : "28px",
  letterSpacing: eDesktop ? "10px" : "6px",
  marginBottom: eDesktop ? "40px" : "18px",
});

const menuContainerStyle = (eDesktop: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: eDesktop ? "column" : "row",
  gap: "12px",
  overflowX: eDesktop ? "visible" : "auto",
  paddingBottom: eDesktop ? 0 : "4px",
});

const menuButtonStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "16px",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const menuButtonActiveStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
};

const topBarStyle = (eDesktop: boolean): CSSProperties => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: eDesktop ? "center" : "stretch",
  flexDirection: eDesktop ? "row" : "column",
  gap: "16px",
  marginBottom: "24px",
});

const topBarActionsStyle = (eDesktop: boolean): CSSProperties => ({
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  width: eDesktop ? "auto" : "100%",
});

const resumoGridStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  marginBottom: "20px",
};

const resumoCardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const resumoNumeroStyle: CSSProperties = {
  fontSize: "32px",
  fontWeight: "bold",
  marginBottom: "8px",
};

const cardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "20px",
};

const filtrosGridStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "1.4fr 1fr 1fr" : "1fr",
  gap: "12px",
  marginBottom: "10px",
});

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const selectStyle: CSSProperties = {
  ...inputStyle,
};

const optionStyle: CSSProperties = {
  color: "black",
};

const linhaStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: "16px",
};

const linhaHeaderStyle = (eDesktop: boolean): CSSProperties => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: eDesktop ? "flex-start" : "stretch",
  flexDirection: eDesktop ? "row" : "column",
  gap: "16px",
});

const tituloLinhaStyle: CSSProperties = {
  fontWeight: "bold",
  fontSize: "20px",
  marginBottom: "10px",
};

const estadoBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "12px",
  marginBottom: "12px",
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
};

const valoresGridStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop
    ? "repeat(4, minmax(0, 1fr))"
    : "repeat(2, minmax(0, 1fr))",
  gap: "10px",
});

const infoCardStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const infoLabelStyle: CSSProperties = {
  fontSize: "12px",
  opacity: 0.75,
  marginBottom: "6px",
};

const infoValorStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: "bold",
  lineHeight: 1.3,
  wordBreak: "break-word",
};

const detalheStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const detalheGridStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "1fr 1fr" : "1fr",
  gap: "16px",
});

const blocoDetalheStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const artigoStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const dimensoesGridStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "repeat(3, minmax(0, 1fr))" : "1fr",
  gap: "10px",
  marginTop: "12px",
});

const extraLinhaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 10px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.04)",
};

const subtextoStyle: CSSProperties = {
  opacity: 0.85,
  fontSize: "14px",
  marginTop: "4px",
  lineHeight: 1.4,
};

const skeletonLinhaStyle: CSSProperties = {
  height: "120px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const vazioStyle: CSSProperties = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  opacity: 0.85,
};

const mensagemErroStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
};

const botaoSecundarioStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoPrincipalStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};