"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type Operador = {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string | null;
};

export default function AdminOperadoresPage() {
  const router = useRouter();

  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [operadorEmAcao, setOperadorEmAcao] = useState<string | null>(null);

  useEffect(() => {
    void validarAdmin();
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
        .select("tipo_utilizador")
        .eq("id", user.id)
        .single<{ tipo_utilizador: string | null }>();

      if (clienteError || cliente?.tipo_utilizador !== "admin") {
        router.replace("/login");
        return;
      }

      await carregarOperadores();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao validar admin.");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarOperadores() {
    try {
      setACarregar(true);
      setMensagem("");

      const { data, error } = await supabase
        .from("operadores")
        .select("id, nome, ativo, created_at")
        .order("nome", { ascending: true });

      if (error) throw error;

      setOperadores((data || []) as Operador[]);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar operadores.");
    } finally {
      setACarregar(false);
    }
  }

  async function criarOperador() {
    try {
      setAGuardar(true);
      setMensagem("");

      const nome = novoNome.trim();

      if (!nome) {
        setMensagem("Escreve o nome do operador.");
        return;
      }

      const { error } = await supabase.from("operadores").insert({
        nome,
        ativo: true,
      });

      if (error) throw error;

      setNovoNome("");
      setMensagem("Operador criado com sucesso.");
      await carregarOperadores();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao criar operador.");
    } finally {
      setAGuardar(false);
    }
  }

  async function alterarEstadoOperador(operador: Operador) {
    try {
      setOperadorEmAcao(operador.id);
      setMensagem("");

      const { error } = await supabase
        .from("operadores")
        .update({ ativo: !operador.ativo })
        .eq("id", operador.id);

      if (error) throw error;

      setMensagem(
        operador.ativo
          ? "Operador desativado com sucesso."
          : "Operador ativado com sucesso."
      );

      await carregarOperadores();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao alterar operador.");
    } finally {
      setOperadorEmAcao(null);
    }
  }

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <section style={contentStyle}>
          <h1>Operadores</h1>
          <p>A verificar acesso...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          <a href="/admin" style={menuStyle}>Dashboard</a>
          <a href="/admin/processos" style={menuStyle}>Processos</a>
          <a href="/admin/clientes" style={menuStyle}>Clientes</a>
          <a href="/admin/precos" style={menuStyle}>Preços</a>
          <a href="/admin/financeiro" style={menuStyle}>Financeiro</a>
          <a href="/admin/calendario" style={menuStyle}>Calendário</a>
          <a href="/admin/operadores" style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}>
            Operadores
          </a>
          <a href="/aprovacao-clientes" style={menuStyle}>Aprovação Clientes</a>
        </div>

        <div style={{ marginTop: 16 }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle}>
        <div style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>Produção</div>
            <h1 style={titleStyle}>Operadores</h1>
            <p style={subtitleStyle}>
              Gere os operadores que aparecem no QR Code da produção.
            </p>
          </div>

          <button onClick={carregarOperadores} style={botaoSecundarioStyle}>
            Atualizar
          </button>
        </div>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Adicionar operador</h2>

          <div style={formGridStyle}>
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome do operador"
              style={inputStyle}
            />

            <button
              type="button"
              onClick={criarOperador}
              disabled={aGuardar}
              style={botaoPrincipalStyle}
            >
              {aGuardar ? "A guardar..." : "Adicionar"}
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Lista de operadores</h2>

          {aCarregar ? (
            <p>A carregar...</p>
          ) : operadores.length === 0 ? (
            <p style={{ opacity: 0.75 }}>Ainda não existem operadores.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {operadores.map((operador) => (
                <div key={operador.id} style={linhaStyle}>
                  <div>
                    <strong style={{ fontSize: 18 }}>{operador.nome}</strong>
                    <div style={subtextoStyle}>
                      Estado: {operador.ativo ? "Ativo" : "Inativo"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alterarEstadoOperador(operador)}
                    disabled={operadorEmAcao === operador.id}
                    style={operador.ativo ? botaoDesativarStyle : botaoAtivarStyle}
                  >
                    {operadorEmAcao === operador.id
                      ? "A atualizar..."
                      : operador.ativo
                      ? "Desativar"
                      : "Ativar"}
                  </button>
                </div>
              ))}
            </div>
          )}
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
  display: "flex",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: 260,
  minHeight: "100dvh",
  padding: "30px 20px",
  background: "rgba(0,0,0,0.14)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  flexShrink: 0,
};

const logoStyle: CSSProperties = {
  fontSize: 36,
  letterSpacing: 9,
  marginBottom: 36,
};

const menuContainerStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const menuStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: 40,
  overflowX: "hidden",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  padding: 28,
  borderRadius: 22,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 20,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 38,
};

const subtitleStyle: CSSProperties = {
  marginTop: 10,
  opacity: 0.82,
};

const cardStyle: CSSProperties = {
  padding: 24,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 18,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const linhaStyle: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
};

const subtextoStyle: CSSProperties = {
  opacity: 0.75,
  fontSize: 14,
  marginTop: 4,
};

const botaoPrincipalStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoSecundarioStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  padding: "12px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoAtivarStyle: CSSProperties = {
  background: "rgba(63, 163, 107, 0.18)",
  color: "white",
  border: "1px solid rgba(63, 163, 107, 0.35)",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoDesativarStyle: CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const mensagemStyle: CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 12,
  background: "rgba(63, 163, 107, 0.15)",
  border: "1px solid rgba(63, 163, 107, 0.35)",
};