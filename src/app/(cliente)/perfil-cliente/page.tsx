"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type ClienteDB = {
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

export default function PerfilClientePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [cliente, setCliente] = useState<ClienteDB | null>(null);
  const [aVerificar, setAVerificar] = useState(true);
  const [mensagem, setMensagem] = useState("");

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

      const { data, error } = await supabase
        .from("clientes")
        .select(
          "id, nome, email, nif, contacto, morada, tipo_cliente, tipo_utilizador, aprovado, estado, desconto_percentual, created_at"
        )
        .eq("id", user.id)
        .single<ClienteDB>();

      if (error || !data) {
        throw error || new Error("Cliente não encontrado.");
      }

      if (data.tipo_utilizador === "admin") {
        router.replace("/admin");
        return;
      }

      if (data.estado === "pendente" || data.aprovado === false) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (data.estado === "rejeitado") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setCliente(data);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar perfil.");
    } finally {
      setAVerificar(false);
    }
  }

  async function terminarSessao() {
    await supabase.auth.signOut();
    localStorage.removeItem("valerie_cliente_sessao");
    router.replace("/login");
  }

  function navegar(path: string) {
    router.push(path);
  }

  function formatarData(valor: string | null) {
    if (!valor) return "—";
    return new Date(valor).toLocaleString("pt-PT");
  }

  const menu = [
    { label: "Dashboard", path: "/dashboard-cliente" },
    { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
    { label: "Processos", path: "/processos-cliente" },
    { label: "Perfil", path: "/perfil-cliente" },
  ];

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <section style={contentStyle}>
          <div style={cardStyle}>
            <h1 style={{ marginTop: 0 }}>Perfil</h1>
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
          {menu.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navegar(item.path)}
              style={{
                ...menuButtonStyle,
                ...(pathname === item.path ? menuButtonAtivoStyle : {}),
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
          <h1 style={titleStyle}>Perfil</h1>
          <p style={subtitleStyle}>
            Consulte os dados da sua conta e informação de cliente.
          </p>
        </div>

        {mensagem && <div style={mensagemErroStyle}>{mensagem}</div>}

        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Dados da Conta</h2>

            <div style={infoGridStyle}>
              <Info label="Nome" valor={cliente?.nome} />
              <Info label="Email" valor={cliente?.email} />
              <Info label="Estado" valor={cliente?.estado || "—"} />
              <Info
                label="Conta"
                valor={cliente?.aprovado ? "Aprovada" : "Não aprovada"}
              />
              <Info label="Tipo de cliente" valor={cliente?.tipo_cliente} />
              <Info label="Registo" valor={formatarData(cliente?.created_at || null)} />
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Dados Fiscais e Contacto</h2>

            <div style={infoGridStyle}>
              <Info label="NIF / ID fiscal" valor={cliente?.nif} />
              <Info label="Contacto" valor={cliente?.contacto} />
              <Info label="Morada" valor={cliente?.morada} />
              <Info
                label="Desconto"
                valor={`${Number(cliente?.desconto_percentual || 0).toFixed(2)}%`}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Acesso Rápido</h2>

            <div style={atalhosGridStyle}>
              <button
                type="button"
                onClick={() => navegar("/novo-orcamento-cliente")}
                style={atalhoStyle}
              >
                Novo Orçamento
              </button>

              <button
                type="button"
                onClick={() => navegar("/processos-cliente")}
                style={atalhoStyle}
              >
                Processos
              </button>

              <button
                type="button"
                onClick={() => navegar("/dashboard-cliente")}
                style={atalhoStyle}
              >
                Dashboard
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Sessão</h2>
            <p style={{ opacity: 0.85, marginBottom: "18px", lineHeight: 1.45 }}>
              Pode terminar sessão em qualquer momento.
            </p>

            <button onClick={terminarSessao} style={botaoPerigoStyle}>
              Terminar Sessão
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div style={infoCardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valorStyle}>{valor || "—"}</div>
    </div>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  flexDirection: "column",
  overflowX: "hidden",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: "100%",
  minHeight: "auto",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: "18px 16px",
  boxSizing: "border-box",
  flexShrink: 0,
};

const logoStyle: CSSProperties = {
  fontSize: "28px",
  letterSpacing: "6px",
  marginBottom: "18px",
};

const menuContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: "12px",
  overflowX: "auto",
  paddingBottom: "6px",
};

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

const menuButtonAtivoStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "16px",
  overflowX: "hidden",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const titleStyle: CSSProperties = {
  fontSize: "32px",
  lineHeight: 1.08,
  margin: 0,
  wordBreak: "break-word",
};

const subtitleStyle: CSSProperties = {
  opacity: 0.8,
  marginTop: "10px",
  marginBottom: 0,
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const gridStyle: CSSProperties = {
  maxWidth: "1100px",
  display: "grid",
  gap: "20px",
};

const cardStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
};

const infoCardStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  overflow: "hidden",
};

const labelStyle: CSSProperties = {
  fontSize: "13px",
  opacity: 0.7,
  marginBottom: "6px",
};

const valorStyle: CSSProperties = {
  fontSize: "17px",
  fontWeight: "bold",
  wordBreak: "break-word",
};

const atalhosGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
};

const atalhoStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
  boxSizing: "border-box",
};

const botaoPerigoStyle: CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
  width: "100%",
  boxSizing: "border-box",
};

const mensagemErroStyle: CSSProperties = {
  maxWidth: "1100px",
  marginBottom: "20px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
  wordBreak: "break-word",
};
