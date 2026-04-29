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
  desconto_percentual: number | null;
  created_at: string | null;
};

type TipoMensagem = "sucesso" | "erro";

const ESTADOS_FILTRO = ["todos", "aprovado", "pendente", "rejeitado"] as const;
const TIPOS_UTILIZADOR = ["cliente", "admin"] as const;
const TIPOS_CLIENTE = [
  "Particular",
  "Profissional",
  "Arquiteto",
  "Designer",
  "Outro",
] as const;

export default function AdminClientesPage() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [aAtualizar, setAAtualizar] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>("sucesso");

  const [clienteEmAcao, setClienteEmAcao] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] =
    useState<(typeof ESTADOS_FILTRO)[number]>("todos");

  const [larguraJanela, setLarguraJanela] = useState<number>(1400);
  const [adminAtualId, setAdminAtualId] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const [descontosEdit, setDescontosEdit] = useState<Record<string, string>>({});
  const [tiposUtilizadorEdit, setTiposUtilizadorEdit] = useState<
    Record<string, string>
  >({});
  const [tiposClienteEdit, setTiposClienteEdit] = useState<Record<string, string>>(
    {}
  );
  const [contactosEdit, setContactosEdit] = useState<Record<string, string>>({});
  const [nifsEdit, setNifsEdit] = useState<Record<string, string>>({});
  const [moradasEdit, setMoradasEdit] = useState<Record<string, string>>({});

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

  async function validarAdmin() {
    try {
      const { data: sessaoData, error: sessaoError } =
        await supabase.auth.getSession();

      if (sessaoError) throw sessaoError;

      const user = sessaoData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      setAdminAtualId(user.id);

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
      definirMensagem("Erro ao validar acesso admin.", "erro");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarClientes(silencioso = false) {
    try {
      if (silencioso) {
        setAAtualizar(true);
      } else {
        setACarregar(true);
      }

      limparMensagem();

      const { data, error } = await supabase
        .from("clientes")
        .select(
          "id, nome, email, nif, contacto, morada, tipo_cliente, tipo_utilizador, aprovado, estado, desconto_percentual, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const lista = (data || []) as Cliente[];
      setClientes(lista);
      setUltimaAtualizacao(new Date());

      const descontos: Record<string, string> = {};
      const tiposUtilizador: Record<string, string> = {};
      const tiposCliente: Record<string, string> = {};
      const contactos: Record<string, string> = {};
      const nifs: Record<string, string> = {};
      const moradas: Record<string, string> = {};

      for (const cliente of lista) {
        descontos[cliente.id] =
          cliente.desconto_percentual !== null &&
          cliente.desconto_percentual !== undefined
            ? String(cliente.desconto_percentual)
            : "0";

        tiposUtilizador[cliente.id] = cliente.tipo_utilizador || "cliente";
        tiposCliente[cliente.id] = cliente.tipo_cliente || "Particular";
        contactos[cliente.id] = cliente.contacto || "";
        nifs[cliente.id] = cliente.nif || "";
        moradas[cliente.id] = cliente.morada || "";
      }

      setDescontosEdit(descontos);
      setTiposUtilizadorEdit(tiposUtilizador);
      setTiposClienteEdit(tiposCliente);
      setContactosEdit(contactos);
      setNifsEdit(nifs);
      setMoradasEdit(moradas);
    } catch (error) {
      console.error(error);
      definirMensagem("Erro ao carregar clientes.", "erro");
    } finally {
      setACarregar(false);
      setAAtualizar(false);
    }
  }

  function limparMensagem() {
    setMensagem("");
  }

  function definirMensagem(texto: string, tipo: TipoMensagem) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  function formatarData(valor: string | null) {
    if (!valor) return "—";
    return new Date(valor).toLocaleString("pt-PT");
  }

  function formatarDataHora(valor: Date | null) {
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
        cor: "#a8f0c3",
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

    if (estado === "rejeitado") {
      return {
        texto: "Rejeitado",
        fundo: "rgba(180,50,50,0.18)",
        borda: "1px solid rgba(180,50,50,0.35)",
        cor: "#ffb3b3",
      };
    }

    return {
      texto: estado || "Sem estado",
      fundo: "rgba(255,255,255,0.08)",
      borda: "1px solid rgba(255,255,255,0.10)",
      cor: "white",
    };
  }

  async function guardarCliente(clienteId: string) {
    try {
      setClienteEmAcao(clienteId);
      limparMensagem();

      const descontoTexto = (descontosEdit[clienteId] || "0").trim();
      const descontoNumero = Number(descontoTexto.replace(",", "."));
      const tipoUtilizador = tiposUtilizadorEdit[clienteId] || "cliente";
      const tipoCliente = (tiposClienteEdit[clienteId] || "Particular").trim();
      const contacto = (contactosEdit[clienteId] || "").trim();
      const nif = (nifsEdit[clienteId] || "").trim().toUpperCase();
      const morada = (moradasEdit[clienteId] || "").trim();

      if (
        Number.isNaN(descontoNumero) ||
        descontoNumero < 0 ||
        descontoNumero > 100
      ) {
        definirMensagem("O desconto tem de estar entre 0 e 100.", "erro");
        return;
      }

      if (clienteId === adminAtualId && tipoUtilizador !== "admin") {
        definirMensagem(
          "Não podes remover o teu próprio acesso de administrador nesta página.",
          "erro"
        );
        return;
      }

      const payload = {
        desconto_percentual: descontoNumero,
        tipo_utilizador: tipoUtilizador,
        tipo_cliente: tipoCliente || null,
        contacto: contacto || null,
        nif: nif || null,
        morada: morada || null,
      };

      const { error } = await supabase
        .from("clientes")
        .update(payload)
        .eq("id", clienteId);

      if (error) throw error;

      setClientes((prev) =>
        prev.map((cliente) =>
          cliente.id === clienteId
            ? {
                ...cliente,
                ...payload,
              }
            : cliente
        )
      );

      definirMensagem("Cliente atualizado com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      definirMensagem("Erro ao guardar alterações do cliente.", "erro");
    } finally {
      setClienteEmAcao(null);
    }
  }

  function limparFiltros() {
    setPesquisa("");
    setFiltroEstado("todos");
  }

  const clientesFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const nome = (cliente.nome || "").toLowerCase();
      const email = (cliente.email || "").toLowerCase();
      const nif = (cliente.nif || "").toLowerCase();
      const contacto = (cliente.contacto || "").toLowerCase();
      const morada = (cliente.morada || "").toLowerCase();
      const tipoCliente = (cliente.tipo_cliente || "").toLowerCase();
      const estado = (cliente.estado || "").toLowerCase();

      const passaPesquisa =
        !termo ||
        nome.includes(termo) ||
        email.includes(termo) ||
        nif.includes(termo) ||
        contacto.includes(termo) ||
        morada.includes(termo) ||
        tipoCliente.includes(termo);

      const passaEstado = filtroEstado === "todos" || estado === filtroEstado;

      return passaPesquisa && passaEstado;
    });
  }, [clientes, pesquisa, filtroEstado]);

  const resumo = useMemo(() => {
    return {
      total: clientes.length,
      aprovados: clientes.filter((c) => c.estado === "aprovado").length,
      pendentes: clientes.filter((c) => c.estado === "pendente").length,
      admins: clientes.filter((c) => c.tipo_utilizador === "admin").length,
    };
  }, [clientes]);

  if (aVerificar) {
    return (
      <main style={estilos.mainStyle}>
        <section style={estilos.contentStyle}>
          <h1 style={{ marginTop: 0 }}>Clientes</h1>
          <p style={{ opacity: 0.8 }}>A verificar acesso...</p>
        </section>
      </main>
    );
  }

  const mensagemStyleFinal =
    tipoMensagem === "sucesso"
      ? estilos.mensagemSucessoStyle
      : estilos.mensagemErroStyle;

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

          <a
            href="/admin/clientes"
            style={{ ...estilos.menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
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

          <a href="/aprovacao-clientes" style={estilos.menuStyle}>
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
            <div style={estilos.eyebrowStyle}>Gestão Comercial</div>
            <h1 style={{ fontSize: eDesktop ? "38px" : "30px", margin: 0 }}>
              Clientes
            </h1>
            <p style={estilos.heroDescricaoStyle}>
              Gestão interna de clientes, descontos, dados de contacto e permissões
              numa vista mais clara e profissional.
            </p>
            <div style={estilos.heroMetaStyle}>
              Última atualização: {formatarDataHora(ultimaAtualizacao)}
            </div>
          </div>

          <div style={estilos.heroActionsStyle}>
            <button
              type="button"
              onClick={() => carregarClientes(true)}
              style={estilos.botaoAtualizarStyle}
              disabled={aAtualizar}
            >
              {aAtualizar ? "A atualizar..." : "Atualizar"}
            </button>
          </div>
        </div>

        {mensagem && <div style={mensagemStyleFinal}>{mensagem}</div>}

        <div style={estilos.resumoGridStyle}>
          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.total}</div>
            <div>Total</div>
          </div>
          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.aprovados}</div>
            <div>Aprovados</div>
          </div>
          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.pendentes}</div>
            <div>Pendentes</div>
          </div>
          <div style={estilos.resumoCardStyle}>
            <div style={estilos.resumoNumeroStyle}>{resumo.admins}</div>
            <div>Admins</div>
          </div>
        </div>

        <div style={estilos.cardStyle}>
          <div style={estilos.topoCardStyle}>
            <div>
              <h2 style={{ margin: 0 }}>Lista de Clientes</h2>
              <p style={{ margin: "8px 0 0", opacity: 0.75 }}>
                Pesquisa, filtra e edita cada cliente sem sair da página.
              </p>
            </div>

            <div style={estilos.filtrosWrapStyle}>
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar por nome, email, NIF, contacto ou morada"
                style={estilos.inputPesquisaStyle}
              />

              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value as (typeof ESTADOS_FILTRO)[number]
                  )
                }
                style={estilos.selectStyle}
              >
                <option value="todos" style={estilos.optionStyle}>
                  Todos os estados
                </option>
                <option value="aprovado" style={estilos.optionStyle}>
                  Aprovado
                </option>
                <option value="pendente" style={estilos.optionStyle}>
                  Pendente
                </option>
                <option value="rejeitado" style={estilos.optionStyle}>
                  Rejeitado
                </option>
              </select>

              <button onClick={limparFiltros} style={estilos.botaoSecundarioStyle}>
                Limpar
              </button>
            </div>
          </div>

          <div style={estilos.countBadgeWrapStyle}>
            <div style={estilos.countBadgeStyle}>
              {clientesFiltrados.length}{" "}
              {clientesFiltrados.length === 1 ? "resultado" : "resultados"}
            </div>
          </div>

          {aCarregar ? (
            <div style={{ display: "grid", gap: "14px" }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} style={estilos.skeletonLinhaStyle} />
              ))}
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <p style={{ opacity: 0.75 }}>Não foram encontrados clientes.</p>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {clientesFiltrados.map((cliente) => {
                const estadoVisual = obterEstadoVisual(cliente.estado);

                return (
                  <div key={cliente.id} style={estilos.linhaStyle}>
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div style={estilos.nomeClienteStyle}>
                          {cliente.nome || "—"}
                        </div>

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

                        <div style={estilos.badgeSecundariaStyle}>
                          {cliente.tipo_utilizador || "cliente"}
                        </div>
                      </div>

                      <div style={estilos.infoGridStyle}>
                        <div style={estilos.infoCardStyle}>
                          <div style={estilos.infoLabelStyle}>Email</div>
                          <div style={estilos.infoValorStyle}>
                            {cliente.email || "—"}
                          </div>
                        </div>

                        <div style={estilos.infoCardStyle}>
                          <div style={estilos.infoLabelStyle}>NIF / ID Fiscal</div>
                          <div style={estilos.infoValorStyle}>
                            {cliente.nif || "—"}
                          </div>
                        </div>

                        <div style={estilos.infoCardStyle}>
                          <div style={estilos.infoLabelStyle}>Contacto</div>
                          <div style={estilos.infoValorStyle}>
                            {cliente.contacto || "—"}
                          </div>
                        </div>

                        <div style={estilos.infoCardStyle}>
                          <div style={estilos.infoLabelStyle}>Tipo de cliente</div>
                          <div style={estilos.infoValorStyle}>
                            {cliente.tipo_cliente || "—"}
                          </div>
                        </div>

                        <div style={estilos.infoCardStyle}>
                          <div style={estilos.infoLabelStyle}>Desconto</div>
                          <div style={estilos.infoValorStyle}>
                            {Number(cliente.desconto_percentual || 0).toFixed(2)}%
                          </div>
                        </div>

                        <div style={estilos.infoCardStyle}>
                          <div style={estilos.infoLabelStyle}>Criado em</div>
                          <div style={estilos.infoValorStyle}>
                            {formatarData(cliente.created_at)}
                          </div>
                        </div>
                      </div>

                      <div style={estilos.moradaBoxStyle}>
                        <strong>Morada:</strong> {cliente.morada || "—"}
                      </div>
                    </div>

                    <div style={estilos.painelEdicaoStyle}>
                      <div style={estilos.duasColunasStyle}>
                        <div>
                          <label style={estilos.labelStyle}>Desconto (%)</label>
                          <input
                            value={descontosEdit[cliente.id] || ""}
                            onChange={(e) =>
                              setDescontosEdit((prev) => ({
                                ...prev,
                                [cliente.id]: e.target.value,
                              }))
                            }
                            placeholder="0"
                            style={estilos.inputStyle}
                          />
                        </div>

                        <div>
                          <label style={estilos.labelStyle}>Tipo de utilizador</label>
                          <select
                            value={tiposUtilizadorEdit[cliente.id] || "cliente"}
                            onChange={(e) =>
                              setTiposUtilizadorEdit((prev) => ({
                                ...prev,
                                [cliente.id]: e.target.value,
                              }))
                            }
                            style={estilos.selectStyle}
                          >
                            {TIPOS_UTILIZADOR.map((tipo) => (
                              <option
                                key={tipo}
                                value={tipo}
                                style={estilos.optionStyle}
                              >
                                {tipo}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={estilos.duasColunasStyle}>
                        <div>
                          <label style={estilos.labelStyle}>Tipo de cliente</label>
                          <select
                            value={tiposClienteEdit[cliente.id] || "Particular"}
                            onChange={(e) =>
                              setTiposClienteEdit((prev) => ({
                                ...prev,
                                [cliente.id]: e.target.value,
                              }))
                            }
                            style={estilos.selectStyle}
                          >
                            {TIPOS_CLIENTE.map((tipo) => (
                              <option
                                key={tipo}
                                value={tipo}
                                style={estilos.optionStyle}
                              >
                                {tipo}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={estilos.labelStyle}>Contacto</label>
                          <input
                            value={contactosEdit[cliente.id] || ""}
                            onChange={(e) =>
                              setContactosEdit((prev) => ({
                                ...prev,
                                [cliente.id]: e.target.value,
                              }))
                            }
                            placeholder="Contacto"
                            style={estilos.inputStyle}
                          />
                        </div>
                      </div>

                      <div style={estilos.duasColunasStyle}>
                        <div>
                          <label style={estilos.labelStyle}>NIF / ID Fiscal</label>
                          <input
                            value={nifsEdit[cliente.id] || ""}
                            onChange={(e) =>
                              setNifsEdit((prev) => ({
                                ...prev,
                                [cliente.id]: e.target.value,
                              }))
                            }
                            placeholder="NIF ou identificador fiscal estrangeiro"
                            style={estilos.inputStyle}
                          />
                        </div>

                        <div>
                          <label style={estilos.labelStyle}>Morada</label>
                          <input
                            value={moradasEdit[cliente.id] || ""}
                            onChange={(e) =>
                              setMoradasEdit((prev) => ({
                                ...prev,
                                [cliente.id]: e.target.value,
                              }))
                            }
                            placeholder="Morada do cliente"
                            style={estilos.inputStyle}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => guardarCliente(cliente.id)}
                        style={estilos.botaoGuardarStyle}
                        disabled={clienteEmAcao === cliente.id}
                      >
                        {clienteEmAcao === cliente.id ? "A guardar..." : "Guardar"}
                      </button>
                    </div>
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
      gridTemplateColumns: eDesktop ? "1.3fr auto" : "1fr",
      gap: "18px",
      marginBottom: "20px",
      padding: eDesktop ? "24px" : "18px",
      borderRadius: "18px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.16)",
    },

    heroActionsStyle: {
      display: "grid",
      alignSelf: "center",
      minWidth: eDesktop ? "220px" : "100%",
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
      lineHeight: 1.45,
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

    topBarStyle: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: eDesktop ? "center" : "flex-start",
      gap: "16px",
      marginBottom: "24px",
      flexDirection: eDesktop ? "row" : "column",
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
    },

    resumoNumeroStyle: {
      fontSize: eDesktop ? "34px" : "24px",
      fontWeight: "bold",
      marginBottom: "8px",
    },

    cardStyle: {
      width: "100%",
      maxWidth: "100%",
      padding: eDesktop ? "24px" : "16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      marginBottom: "20px",
    },

    topoCardStyle: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: eDesktop ? "center" : "flex-start",
      gap: "16px",
      marginBottom: "20px",
      flexDirection: eDesktop ? "row" : "column",
    },

    filtrosWrapStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "minmax(320px, 420px) 220px auto" : "1fr",
      gap: "10px",
      width: eDesktop ? "auto" : "100%",
    },

    inputPesquisaStyle: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
    },

    linhaStyle: {
      padding: eDesktop ? "18px" : "14px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "grid",
      gridTemplateColumns: eDesktop ? "1.25fr 1fr" : "1fr",
      gap: "18px",
      alignItems: "start",
    },

    skeletonLinhaStyle: {
      height: "180px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
    },

    infoGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop
        ? "repeat(3, minmax(0, 1fr))"
        : "repeat(2, minmax(0, 1fr))",
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

    painelEdicaoStyle: {
      display: "grid",
      gap: "14px",
    },

    duasColunasStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "1fr 1fr" : "1fr",
      gap: "12px",
    },

    subtextoStyle: {
      opacity: 0.85,
      fontSize: "14px",
      marginTop: "2px",
    },

    labelStyle: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      fontSize: "14px",
    },

    inputStyle: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
    },

    selectStyle: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
    },

    optionStyle: {
      color: "black",
    },

    mensagemSucessoStyle: {
      width: "100%",
      marginBottom: "20px",
      padding: "16px 18px",
      borderRadius: "12px",
      background: "rgba(63, 163, 107, 0.15)",
      border: "1px solid rgba(63, 163, 107, 0.35)",
    },

    mensagemErroStyle: {
      width: "100%",
      marginBottom: "20px",
      padding: "16px 18px",
      borderRadius: "12px",
      background: "rgba(180,50,50,0.18)",
      border: "1px solid rgba(180,50,50,0.35)",
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

    botaoGuardarStyle: {
      background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "12px 18px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "auto" : "100%",
    },

    botaoSecundarioStyle: {
      background: "rgba(255,255,255,0.08)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      padding: "12px 16px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "auto" : "100%",
    },

    badgeEstadoStyle: {
      display: "inline-flex",
      alignItems: "center",
      padding: "7px 12px",
      borderRadius: "999px",
      fontWeight: "bold",
      fontSize: "12px",
    },

    badgeSecundariaStyle: {
      display: "inline-flex",
      alignItems: "center",
      padding: "7px 12px",
      borderRadius: "999px",
      fontWeight: "bold",
      fontSize: "12px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.10)",
    },

    countBadgeWrapStyle: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "14px",
    },

    countBadgeStyle: {
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 12px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: "13px",
      fontWeight: "bold",
    },

    nomeClienteStyle: {
      fontWeight: "bold",
      fontSize: "18px",
      wordBreak: "break-word",
    },
  };
}