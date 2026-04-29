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
  data_entrega_prevista?: string | null;
  dias_totais_previstos?: number | null;
  created_at: string | null;
};

type ClienteDB = {
  id: string;
  nome: string | null;
  email: string | null;
  tipo_utilizador: string | null;
  estado?: string | null;
  aprovado?: boolean | null;
};

const menuCliente = [
  { label: "Dashboard", path: "/dashboard-cliente" },
  { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
  { label: "Processos", path: "/processos-cliente" },
  { label: "Perfil", path: "/perfil-cliente" },
];

export default function DashboardClientePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [nomeCliente, setNomeCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [aAtualizar, setAAtualizar] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  useEffect(() => {
    async function validarCliente() {
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
          .select("id, nome, email, tipo_utilizador, estado, aprovado")
          .eq("id", user.id)
          .single<ClienteDB>();

        if (clienteError || !cliente) {
          router.replace("/login");
          return;
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
        await carregarProcessos(cliente.id);
      } catch (error) {
        console.error(error);
        setMensagem("Erro ao validar sessão do cliente.");
      } finally {
        setAVerificar(false);
      }
    }

    void validarCliente();
  }, [router]);

  async function carregarProcessos(userId: string) {
    try {
      setACarregar(true);
      setMensagem("");

      const { data, error } = await supabase
        .from("processos")
        .select("*")
        .eq("cliente_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProcessos((data || []) as Processo[]);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar processos.");
    } finally {
      setACarregar(false);
      setAAtualizar(false);
    }
  }

  async function atualizarAgora() {
    if (!clienteId) return;
    setAAtualizar(true);
    await carregarProcessos(clienteId);
  }

  function irPara(path: string) {
    window.location.href = path;
  }

  function formatarEuro(valor: number | null | undefined) {
    if (valor === null || valor === undefined) return "—";

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

  function valorProcesso(processo: Processo) {
    return Number(
      processo.valor_final ??
        processo.valor_estimado_com_desconto ??
        processo.valor_estimado ??
        0
    );
  }

  function estadoStyle(estado: string | null): CSSProperties {
    if (estado === "Pedido Submetido") return badgeNeutroStyle;
    if (estado === "Em Análise") return badgeAmareloStyle;
    if (estado === "Orçamento Enviado") return badgeAzulStyle;
    if (estado === "Validado") return badgeVerdeStyle;
    if (estado === "Rejeitado") return badgeVermelhoStyle;
    return badgeNeutroStyle;
  }

  const processosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return processos.filter((processo) => {
      const passaPesquisa =
        !termo ||
        (processo.nome_obra || "").toLowerCase().includes(termo) ||
        (processo.localizacao || "").toLowerCase().includes(termo) ||
        (processo.estado || "").toLowerCase().includes(termo);

      const passaEstado =
        filtroEstado === "Todos" || processo.estado === filtroEstado;

      return passaPesquisa && passaEstado;
    });
  }, [processos, pesquisa, filtroEstado]);

  const resumo = useMemo(() => {
    return {
      total: processos.length,
      submetidos: processos.filter((p) => p.estado === "Pedido Submetido").length,
      analise: processos.filter((p) => p.estado === "Em Análise").length,
      enviados: processos.filter(
        (p) => p.estado === "Orçamento Enviado" || p.estado === "Validado"
      ).length,
      valorTotal: processos.reduce((acc, p) => acc + valorProcesso(p), 0),
      proximasEntregas: processos
        .filter((p) => p.data_entrega_prevista)
        .slice()
        .sort(
          (a, b) =>
            new Date(a.data_entrega_prevista || "").getTime() -
            new Date(b.data_entrega_prevista || "").getTime()
        )
        .slice(0, 4),
    };
  }, [processos]);

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <aside style={asideStyle}>
          <div style={logoStyle}>VALERIE</div>
        </aside>

        <section style={contentStyle}>
          <div style={cardStyle}>
            <h1 style={{ marginTop: 0 }}>Área Cliente</h1>
            <p style={{ opacity: 0.8 }}>A verificar sessão...</p>
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
          {menuCliente.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => irPara(item.path)}
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
        <div style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>Painel do Cliente</div>
            <h1 style={titleStyle}>Área Cliente</h1>
            <p style={subtitleStyle}>
              Bem-vindo, <strong>{nomeCliente}</strong>. Acompanhe os seus
              pedidos, estados, valores e próximas entregas.
            </p>
          </div>

          <div style={heroActionsStyle}>
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
              onClick={() => irPara("/novo-orcamento-cliente")}
              style={botaoPrincipalStyle}
            >
              Novo Orçamento
            </button>
          </div>
        </div>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}

        <div style={resumoGridStyle}>
          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle}>{resumo.total}</div>
            <div>Total de Processos</div>
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

          <div style={resumoCardStyle}>
            <div style={{ ...resumoNumeroStyle, fontSize: "24px" }}>
              {formatarEuro(resumo.valorTotal)}
            </div>
            <div>Valor Total</div>
          </div>
        </div>

        <div style={duasColunasStyle}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>Os Meus Processos</h2>
                <p style={cardTextStyle}>
                  Consulte rapidamente os seus pedidos mais recentes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => irPara("/processos-cliente")}
                style={botaoSecundarioStyle}
              >
                Ver todos
              </button>
            </div>

            <div style={filtrosStyle}>
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar por obra, localização ou estado"
                style={inputStyle}
              />

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={selectStyle}
              >
                <option value="Todos" style={optionStyle}>Todos</option>
                <option value="Pedido Submetido" style={optionStyle}>Pedido Submetido</option>
                <option value="Em Análise" style={optionStyle}>Em Análise</option>
                <option value="Orçamento Enviado" style={optionStyle}>Orçamento Enviado</option>
                <option value="Validado" style={optionStyle}>Validado</option>
                <option value="Rejeitado" style={optionStyle}>Rejeitado</option>
              </select>
            </div>

            {aCarregar ? (
              <p style={{ opacity: 0.75 }}>A carregar...</p>
            ) : processosFiltrados.length === 0 ? (
              <p style={{ opacity: 0.75 }}>Ainda não existem pedidos submetidos.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {processosFiltrados.slice(0, 5).map((processo) => (
                  <div key={processo.id} style={processoCardStyle}>
                    <div>
                      <div style={processoTituloStyle}>
                        {processo.nome_obra || "Sem nome de obra"}
                      </div>

                      <div style={subtextoStyle}>
                        Localização: {processo.localizacao || "—"}
                      </div>

                      <div style={subtextoStyle}>
                        Criado em: {formatarData(processo.created_at)}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>
                      <div style={{ ...badgeStyle, ...estadoStyle(processo.estado) }}>
                        {processo.estado || "Sem estado"}
                      </div>

                      <div style={{ fontWeight: "bold" }}>
                        {formatarEuro(valorProcesso(processo))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Próximas Entregas</h2>
            <p style={cardTextStyle}>As próximas datas previstas dos seus projetos.</p>

            {resumo.proximasEntregas.length === 0 ? (
              <p style={{ opacity: 0.75 }}>Ainda não existem entregas previstas.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {resumo.proximasEntregas.map((processo) => (
                  <div key={processo.id} style={entregaCardStyle}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {processo.nome_obra || "Sem nome de obra"}
                      </div>
                      <div style={subtextoStyle}>
                        Estado: {processo.estado || "—"}
                      </div>
                    </div>

                    <div style={dataEntregaStyle}>
                      {formatarData(processo.data_entrega_prevista)}
                    </div>
                  </div>
                ))}
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
  display: "flex",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
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
  alignItems: "center",
  padding: "28px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  fontSize: "12px",
  letterSpacing: "1.6px",
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: "8px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "46px",
  lineHeight: 1,
};

const subtitleStyle: CSSProperties = {
  maxWidth: "720px",
  marginTop: "14px",
  marginBottom: 0,
  opacity: 0.85,
  fontSize: "17px",
  lineHeight: 1.45,
};

const heroActionsStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const resumoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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
  fontSize: "34px",
  fontWeight: "bold",
  marginBottom: "8px",
};

const duasColunasStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 1fr",
  gap: "20px",
};

const cardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  marginBottom: "18px",
};

const cardTextStyle: CSSProperties = {
  opacity: 0.75,
  marginTop: "8px",
  marginBottom: 0,
};

const filtrosStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr",
  gap: "12px",
  marginBottom: "18px",
};

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

const processoCardStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
};

const processoTituloStyle: CSSProperties = {
  fontSize: "17px",
  fontWeight: "bold",
  marginBottom: "6px",
};

const subtextoStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "14px",
  marginTop: "4px",
};

const entregaCardStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const dataEntregaStyle: CSSProperties = {
  fontWeight: "bold",
  padding: "8px 10px",
  borderRadius: "10px",
  background: "rgba(92,115,199,0.18)",
  height: "fit-content",
};

const botaoPrincipalStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "13px 18px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoSecundarioStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const mensagemStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold",
};

const badgeNeutroStyle: CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const badgeAmareloStyle: CSSProperties = {
  background: "rgba(244,180,0,0.16)",
  border: "1px solid rgba(244,180,0,0.40)",
  color: "#ffd76c",
};

const badgeAzulStyle: CSSProperties = {
  background: "rgba(66,133,244,0.16)",
  border: "1px solid rgba(66,133,244,0.40)",
  color: "#9fc3ff",
};

const badgeVerdeStyle: CSSProperties = {
  background: "rgba(52,168,83,0.18)",
  border: "1px solid rgba(52,168,83,0.45)",
  color: "#9df5b4",
};

const badgeVermelhoStyle: CSSProperties = {
  background: "rgba(234,67,53,0.16)",
  border: "1px solid rgba(234,67,53,0.45)",
  color: "#ff9d9d",
};