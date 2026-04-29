"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type Cliente = {
  id: string;
  nome: string | null;
  email: string | null;
  nif: string | null;
  contacto: string | null;
  morada: string | null;
  tipo_cliente: string | null;
  tipo_utilizador: string | null;
  aprovado: boolean | null;
  estado: string | null;
  created_at: string | null;
};

type TipoMensagem = "sucesso" | "erro";
type FiltroEstado = "todos" | "pendente" | "aprovado";
type Ordenacao = "recentes" | "antigos" | "nome_asc" | "nome_desc";

export default function AprovacaoClientesPage() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>("sucesso");
  const [aCarregar, setACarregar] = useState(true);
  const [aVerificar, setAVerificar] = useState(true);
  const [clienteEmAcao, setClienteEmAcao] = useState<string | null>(null);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");

  const [larguraJanela, setLarguraJanela] = useState<number>(1400);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  useEffect(() => {
    function atualizarLargura() {
      setLarguraJanela(window.innerWidth);
    }

    atualizarLargura();
    window.addEventListener("resize", atualizarLargura);

    return () => window.removeEventListener("resize", atualizarLargura);
  }, []);

  useEffect(() => {
    void validarAdmin();
  }, []);

  const eDesktop = larguraJanela >= 1024;
  const eTablet = larguraJanela >= 768 && larguraJanela < 1024;
  const estilos = obterEstilosResponsivos(eDesktop, eTablet);

  function limparMensagem() {
    setMensagem("");
  }

  function mostrarMensagem(texto: string, tipo: TipoMensagem) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  async function validarAdmin() {
    try {
      const { data: sessaoData, error: sessaoError } =
        await supabase.auth.getSession();

      if (sessaoError) {
        throw sessaoError;
      }

      const user = sessaoData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id, tipo_utilizador")
        .eq("id", user.id)
        .single<{ id: string; tipo_utilizador: string | null }>();

      if (clienteError || !cliente || cliente.tipo_utilizador !== "admin") {
        router.replace("/login");
        return;
      }

      await carregarClientes();
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao validar acesso admin.", "erro");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarClientes() {
    try {
      setACarregar(true);
      limparMensagem();

      const { data, error } = await supabase
        .from("clientes")
        .select(
          "id, nome, email, nif, contacto, morada, tipo_cliente, tipo_utilizador, aprovado, estado, created_at"
        )
        .neq("estado", "rejeitado")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setClientes((data || []) as Cliente[]);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao carregar clientes.", "erro");
    } finally {
      setACarregar(false);
    }
  }

  async function aprovarCliente(cliente: Cliente) {
    try {
      limparMensagem();
      setClienteEmAcao(cliente.id);

      const { error } = await supabase
        .from("clientes")
        .update({
          aprovado: true,
          estado: "aprovado",
          tipo_utilizador: cliente.tipo_utilizador || "cliente",
        })
        .eq("id", cliente.id);

      if (error) {
        throw error;
      }

      setClientes((prev) =>
        prev.map((item) =>
          item.id === cliente.id
            ? {
                ...item,
                aprovado: true,
                estado: "aprovado",
                tipo_utilizador: item.tipo_utilizador || "cliente",
              }
            : item
        )
      );

      if (cliente.email) {
        try {
          await fetch("/api/notificar-cliente-aprovado", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nome: cliente.nome || "",
              email: cliente.email,
            }),
          });
        } catch (emailError) {
          console.error("Erro ao enviar email de aprovação:", emailError);
        }
      }

      mostrarMensagem("Cliente aprovado com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao aprovar cliente.", "erro");
      await carregarClientes();
    } finally {
      setClienteEmAcao(null);
    }
  }

  async function rejeitarCliente(cliente: Cliente) {
    try {
      limparMensagem();
      setClienteEmAcao(cliente.id);

      const { error } = await supabase
        .from("clientes")
        .update({
          aprovado: false,
          estado: "rejeitado",
        })
        .eq("id", cliente.id);

      if (error) {
        throw error;
      }

      setClientes((prev) => prev.filter((item) => item.id !== cliente.id));
      mostrarMensagem("Cliente rejeitado com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao rejeitar cliente.", "erro");
      await carregarClientes();
    } finally {
      setClienteEmAcao(null);
    }
  }

  function formatarData(valor: string | null) {
    if (!valor) return "—";
    return new Date(valor).toLocaleString("pt-PT");
  }

  function formatarDataCurta(valor: Date | null) {
    if (!valor) return "—";
    return valor.toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function obterEstadoVisual(estado: string | null) {
    if (estado === "aprovado") {
      return {
        texto: "Aprovado",
        fundo: "rgba(63,163,107,0.16)",
        borda: "1px solid rgba(63,163,107,0.35)",
        cor: "#a7f0c3",
      };
    }

    if (estado === "pendente") {
      return {
        texto: "Pendente",
        fundo: "rgba(244,180,0,0.16)",
        borda: "1px solid rgba(244,180,0,0.35)",
        cor: "#ffe08a",
      };
    }

    return {
      texto: estado || "Sem estado",
      fundo: "rgba(255,255,255,0.08)",
      borda: "1px solid rgba(255,255,255,0.10)",
      cor: "white",
    };
  }

  const clientesFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    let lista = [...clientes];

    if (termo) {
      lista = lista.filter((cliente) => {
        const nome = (cliente.nome || "").toLowerCase();
        const email = (cliente.email || "").toLowerCase();
        const nif = (cliente.nif || "").toLowerCase();
        const contacto = (cliente.contacto || "").toLowerCase();
        const morada = (cliente.morada || "").toLowerCase();
        const tipoCliente = (cliente.tipo_cliente || "").toLowerCase();

        return (
          nome.includes(termo) ||
          email.includes(termo) ||
          nif.includes(termo) ||
          contacto.includes(termo) ||
          morada.includes(termo) ||
          tipoCliente.includes(termo)
        );
      });
    }

    if (filtroEstado !== "todos") {
      lista = lista.filter((cliente) => cliente.estado === filtroEstado);
    }

    lista.sort((a, b) => {
      if (ordenacao === "nome_asc") {
        return (a.nome || "").localeCompare(b.nome || "", "pt");
      }

      if (ordenacao === "nome_desc") {
        return (b.nome || "").localeCompare(a.nome || "", "pt");
      }

      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (ordenacao === "antigos") {
        return dataA - dataB;
      }

      return dataB - dataA;
    });

    return lista;
  }, [clientes, pesquisa, filtroEstado, ordenacao]);

  const pendentes = useMemo(
    () => clientesFiltrados.filter((cliente) => cliente.estado === "pendente"),
    [clientesFiltrados]
  );

  const aprovados = useMemo(
    () => clientesFiltrados.filter((cliente) => cliente.estado === "aprovado"),
    [clientesFiltrados]
  );

  const resumo = useMemo(() => {
    return {
      total: clientes.length,
      pendentes: clientes.filter((c) => c.estado === "pendente").length,
      aprovados: clientes.filter((c) => c.estado === "aprovado").length,
      resultados: clientesFiltrados.length,
    };
  }, [clientes, clientesFiltrados]);

  function renderClienteCard(
    cliente: Cliente,
    tipoAcaoPrincipal: "aprovar" | "rejeitar"
  ) {
    const estadoVisual = obterEstadoVisual(cliente.estado);
    const emAcao = clienteEmAcao === cliente.id;

    return (
      <div key={cliente.id} style={estilos.linhaStyle}>
        <div style={{ display: "grid", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={estilos.nomeClienteStyle}>{cliente.nome || "—"}</div>

            <div
              style={{
                ...estilos.badgeEstadoStyle,
                background: estadoVisual.fundo,
                border: estadoVisual.borda,
                color: estadoVisual.cor,
              }}
            >
              {estadoVisual.texto}
            </div>
          </div>

          <div style={estilos.infoGridStyle}>
            <div style={estilos.infoCardStyle}>
              <div style={estilos.infoLabelStyle}>Email</div>
              <div style={estilos.infoValorStyle}>{cliente.email || "—"}</div>
            </div>

            <div style={estilos.infoCardStyle}>
              <div style={estilos.infoLabelStyle}>NIF / ID fiscal</div>
              <div style={estilos.infoValorStyle}>{cliente.nif || "—"}</div>
            </div>

            <div style={estilos.infoCardStyle}>
              <div style={estilos.infoLabelStyle}>Contacto</div>
              <div style={estilos.infoValorStyle}>{cliente.contacto || "—"}</div>
            </div>

            <div style={estilos.infoCardStyle}>
              <div style={estilos.infoLabelStyle}>Tipo de cliente</div>
              <div style={estilos.infoValorStyle}>
                {cliente.tipo_cliente || "—"}
              </div>
            </div>
          </div>

          <div style={estilos.moradaBoxStyle}>
            <strong>Morada:</strong> {cliente.morada || "—"}
          </div>

          <div style={estilos.subtextoStyle}>
            Registo: {formatarData(cliente.created_at)}
          </div>
        </div>

        <div style={estilos.acoesWrapStyle}>
          {tipoAcaoPrincipal === "aprovar" ? (
            <>
              <button
                onClick={() => aprovarCliente(cliente)}
                style={estilos.botaoAprovarStyle}
                disabled={emAcao}
              >
                {emAcao ? "A processar..." : "Aprovar"}
              </button>

              <button
                onClick={() => rejeitarCliente(cliente)}
                style={estilos.botaoSecundarioPerigoStyle}
                disabled={emAcao}
              >
                {emAcao ? "A processar..." : "Rejeitar"}
              </button>
            </>
          ) : (
            <button
              onClick={() => rejeitarCliente(cliente)}
              style={estilos.botaoRejeitarStyle}
              disabled={emAcao}
            >
              {emAcao ? "A processar..." : "Rejeitar"}
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderSecao(
    titulo: string,
    descricao: string,
    itens: Cliente[],
    tipoAcaoPrincipal: "aprovar" | "rejeitar"
  ) {
    return (
      <div style={estilos.cardStyle}>
        <div style={estilos.secaoHeaderStyle}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "6px" }}>{titulo}</h2>
            <p style={estilos.secaoDescricaoStyle}>{descricao}</p>
          </div>

          <div style={estilos.countBadgeStyle}>{itens.length}</div>
        </div>

        {aCarregar ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={estilos.skeletonStyle} />
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div style={estilos.vazioBoxStyle}>Sem resultados nesta secção.</div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {itens.map((cliente) => renderClienteCard(cliente, tipoAcaoPrincipal))}
          </div>
        )}
      </div>
    );
  }

  if (aVerificar) {
    return (
      <main style={estilos.mainStyle}>
        <section style={estilos.contentStyle}>
          <h1 style={{ marginTop: 0 }}>Aprovação de Clientes</h1>
          <p style={{ opacity: 0.8 }}>A verificar acesso...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={estilos.mainStyle}>
      <aside style={estilos.asideStyle}>
        <div style={estilos.logoStyle}>VALERIE</div>

        <div style={estilos.menuContainerStyle}>
          <a href="/admin" style={estilos.menuStyle}>
            Dashboard
          </a>

          <a href="/admin/processos" style={estilos.menuStyle}>
            Processos
          </a>

          <a href="/admin/clientes" style={estilos.menuStyle}>
            Clientes
          </a>

          <a href="/admin/precos" style={estilos.menuStyle}>
            Preços
          </a>

          <a href="/admin/financeiro" style={estilos.menuStyle}>
            Financeiro
          </a>

          <a href="/admin/calendario" style={estilos.menuStyle}>
            Calendário
          </a>

          <a
            href="/aprovacao-clientes"
            style={{ ...estilos.menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Aprovação Clientes
          </a>
        </div>

        <div style={{ marginTop: "20px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={estilos.contentStyle}>
        <div style={estilos.heroStyle}>
          <div>
            <div style={estilos.eyebrowStyle}>Gestão Administrativa</div>
            <h1 style={{ fontSize: eDesktop ? "40px" : "30px", margin: 0 }}>
              Aprovação de Clientes
            </h1>
            <p style={estilos.heroDescricaoStyle}>
              Aprove ou rejeite pedidos de acesso à plataforma com uma gestão mais
              clara, rápida e profissional.
            </p>
            <div style={estilos.heroMetaStyle}>
              Última atualização: {formatarDataCurta(ultimaAtualizacao)}
            </div>
          </div>

          <div style={estilos.topBarActionsStyle}>
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar por nome, email, NIF, contacto, morada..."
              style={estilos.inputPesquisaStyle}
            />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              style={estilos.selectStyle}
            >
              <option value="todos" style={estilos.optionStyle}>
                Todos os estados
              </option>
              <option value="pendente" style={estilos.optionStyle}>
                Pendentes
              </option>
              <option value="aprovado" style={estilos.optionStyle}>
                Aprovados
              </option>
            </select>

            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
              style={estilos.selectStyle}
            >
              <option value="recentes" style={estilos.optionStyle}>
                Mais recentes
              </option>
              <option value="antigos" style={estilos.optionStyle}>
                Mais antigos
              </option>
              <option value="nome_asc" style={estilos.optionStyle}>
                Nome A-Z
              </option>
              <option value="nome_desc" style={estilos.optionStyle}>
                Nome Z-A
              </option>
            </select>

            <button
              type="button"
              onClick={carregarClientes}
              style={estilos.botaoAtualizarStyle}
              disabled={aCarregar}
            >
              {aCarregar ? "A atualizar..." : "Atualizar"}
            </button>
          </div>
        </div>

        {mensagem && (
          <div
            style={
              tipoMensagem === "sucesso"
                ? estilos.mensagemSucessoStyle
                : estilos.mensagemErroStyle
            }
          >
            {mensagem}
          </div>
        )}

        <div style={estilos.resumoGridStyle}>
          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.total}</div>
            <div>Total visível</div>
          </div>

          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.pendentes}</div>
            <div>Pendentes</div>
          </div>

          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.aprovados}</div>
            <div>Aprovados</div>
          </div>

          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.resultados}</div>
            <div>Resultados</div>
          </div>
        </div>

        {renderSecao(
          "Pedidos Pendentes",
          "Clientes à espera de aprovação para entrar na plataforma.",
          pendentes,
          "aprovar"
        )}

        {renderSecao(
          "Clientes Aprovados",
          "Clientes que já têm acesso autorizado.",
          aprovados,
          "rejeitar"
        )}
      </section>
    </main>
  );
}

function obterEstilosResponsivos(
  eDesktop: boolean,
  eTablet: boolean
): Record<string, CSSProperties> {
  return {
    mainStyle: {
      minHeight: "100dvh",
      background:
        "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
      color: "white",
      display: "flex",
      flexDirection: eDesktop ? "row" : "column",
      fontFamily: "Arial, sans-serif",
      overflowX: "hidden",
    },

    asideStyle: {
      width: eDesktop ? "260px" : "100%",
      minHeight: eDesktop ? "100dvh" : "auto",
      borderRight: eDesktop ? "1px solid rgba(255,255,255,0.08)" : "none",
      borderBottom: eDesktop ? "none" : "1px solid rgba(255,255,255,0.08)",
      background: "rgba(0,0,0,0.12)",
      padding: eDesktop ? "30px 20px" : "18px 16px",
      flexShrink: 0,
    },

    contentStyle: {
      flex: 1,
      padding: eDesktop ? "40px" : eTablet ? "24px" : "16px",
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden",
    },

    heroStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "1.1fr 1fr" : "1fr",
      gap: "18px",
      marginBottom: "24px",
      padding: eDesktop ? "24px" : "18px",
      borderRadius: "18px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.16)",
    },

    eyebrowStyle: {
      fontSize: "12px",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      opacity: 0.7,
      marginBottom: "10px",
    },

    heroDescricaoStyle: {
      opacity: 0.82,
      marginTop: "10px",
      lineHeight: 1.5,
      marginBottom: "12px",
      maxWidth: "760px",
    },

    heroMetaStyle: {
      fontSize: "13px",
      opacity: 0.72,
    },

    logoStyle: {
      fontSize: eDesktop ? "38px" : "28px",
      letterSpacing: eDesktop ? "10px" : "6px",
      marginBottom: eDesktop ? "40px" : "18px",
    },

    menuContainerStyle: {
      display: "flex",
      flexDirection: eDesktop ? "column" : "row",
      gap: "12px",
      overflowX: eDesktop ? "visible" : "auto",
      paddingBottom: eDesktop ? 0 : "4px",
    },

    menuStyle: {
      padding: "14px 16px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.04)",
      color: "white",
      textDecoration: "none",
      whiteSpace: "nowrap",
      flexShrink: 0,
    },

    topBarActionsStyle: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "10px",
      width: "100%",
      maxWidth: "100%",
      alignSelf: eDesktop ? "center" : "stretch",
    },

    inputPesquisaStyle: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
    },

    selectStyle: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
    },

    optionStyle: {
      color: "black",
    },

    botaoAtualizarStyle: {
      background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "12px 16px",
      fontWeight: "bold",
      cursor: "pointer",
      width: "100%",
    },

    resumoGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop
        ? "repeat(4, minmax(0, 1fr))"
        : "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      width: "100%",
      marginBottom: "20px",
    },

    resumoCardStyle: {
      padding: eDesktop ? "20px" : "16px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
    },

    resumoNumeroStyle: {
      fontSize: eDesktop ? "34px" : "24px",
      fontWeight: "bold",
      marginBottom: "8px",
    },

    cardStyle: {
      width: "100%",
      padding: eDesktop ? "24px" : "16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      marginBottom: "20px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
    },

    secaoHeaderStyle: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: eDesktop ? "center" : "flex-start",
      flexDirection: eDesktop ? "row" : "column",
      gap: "10px",
      marginBottom: "16px",
    },

    secaoDescricaoStyle: {
      margin: 0,
      opacity: 0.75,
      lineHeight: 1.4,
    },

    countBadgeStyle: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "42px",
      padding: "8px 12px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontWeight: "bold",
      fontSize: "13px",
    },

    linhaStyle: {
      padding: eDesktop ? "16px" : "14px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "grid",
      gridTemplateColumns: eDesktop ? "1.5fr auto" : "1fr",
      gap: "16px",
      alignItems: "start",
    },

    skeletonStyle: {
      height: "140px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
    },

    nomeClienteStyle: {
      fontWeight: "bold",
      fontSize: "18px",
      minWidth: 0,
      wordBreak: "break-word",
    },

    badgeEstadoStyle: {
      display: "inline-flex",
      alignItems: "center",
      padding: "7px 12px",
      borderRadius: "999px",
      fontWeight: "bold",
      fontSize: "12px",
    },

    infoGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop
        ? "repeat(4, minmax(0, 1fr))"
        : eTablet
        ? "repeat(2, minmax(0, 1fr))"
        : "1fr",
      gap: "10px",
    },

    infoCardStyle: {
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      minWidth: 0,
    },

    infoLabelStyle: {
      fontSize: "12px",
      opacity: 0.75,
      marginBottom: "6px",
    },

    infoValorStyle: {
      fontSize: "14px",
      fontWeight: "bold",
      lineHeight: 1.35,
      wordBreak: "break-word",
    },

    moradaBoxStyle: {
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      lineHeight: 1.45,
      fontSize: "14px",
      wordBreak: "break-word",
    },

    subtextoStyle: {
      opacity: 0.78,
      fontSize: "13px",
      marginTop: "2px",
    },

    acoesWrapStyle: {
      display: "flex",
      flexDirection: eDesktop ? "column" : "row",
      gap: "10px",
      width: eDesktop ? "180px" : "100%",
    },

    vazioBoxStyle: {
      padding: "14px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      opacity: 0.8,
    },

    mensagemSucessoStyle: {
      width: "100%",
      marginBottom: "20px",
      padding: "16px 18px",
      borderRadius: "12px",
      background: "rgba(63,163,107,0.15)",
      border: "1px solid rgba(63,163,107,0.35)",
    },

    mensagemErroStyle: {
      width: "100%",
      marginBottom: "20px",
      padding: "16px 18px",
      borderRadius: "12px",
      background: "rgba(180,50,50,0.18)",
      border: "1px solid rgba(180,50,50,0.35)",
    },

    botaoAprovarStyle: {
      background: "rgba(63,163,107,0.18)",
      color: "white",
      border: "1px solid rgba(63,163,107,0.35)",
      borderRadius: "10px",
      padding: "12px 14px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "100%" : "auto",
    },

    botaoRejeitarStyle: {
      background: "rgba(180,50,50,0.18)",
      color: "white",
      border: "1px solid rgba(180,50,50,0.35)",
      borderRadius: "10px",
      padding: "12px 14px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "100%" : "auto",
    },

    botaoSecundarioPerigoStyle: {
      background: "rgba(255,255,255,0.08)",
      color: "#ffb3b3",
      border: "1px solid rgba(180,50,50,0.25)",
      borderRadius: "10px",
      padding: "12px 14px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "100%" : "auto",
    },
  };
}