"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

const STORAGE_KEY = "valerie_novo_orcamento";

type Artigo = {
  id: number;
  tipo: string;
  nome: string;
  resumo?: string;
  dados?: unknown;
};

type DadosOrcamento = {
  nomeCliente: string;
  nomeObra: string;
  localizacao: string;
  observacoes: string;
  artigos: Artigo[];
};

type ClienteDB = {
  id: string;
  nome: string | null;
  email: string | null;
  tipo_utilizador: string | null;
  estado: string | null;
  aprovado: boolean | null;
};

const menuCliente = [
  { label: "Dashboard", path: "/dashboard-cliente" },
  { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
  { label: "Processos", path: "/processos-cliente" },
  { label: "Perfil", path: "/perfil-cliente" },
];

const tiposArtigo = [
  { label: "Roupeiro", tipo: "Roupeiro", path: "/novo-orcamento-cliente/artigos/roupeiro" },
  { label: "Cozinha", tipo: "Cozinha", path: "/novo-orcamento-cliente/artigos/cozinha" },
  { label: "Móvel TV", tipo: "Móvel TV", path: "/novo-orcamento-cliente/artigos/movel-tv" },
  { label: "Móvel WC", tipo: "Móvel WC", path: "/novo-orcamento-cliente/artigos/movel-wc" },
  { label: "Artigo Livre", tipo: "Artigo Livre", path: "/novo-orcamento-cliente/artigos/artigo-livre" },
];

export default function NovoOrcamentoClientePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [clienteId, setClienteId] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [nomeObra, setNomeObra] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [aVerificar, setAVerificar] = useState(true);
  const [aSubmeter, setASubmeter] = useState(false);

  useEffect(() => {
    async function iniciar() {
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

        if (cliente.estado === "pendente" || cliente.estado === "rejeitado" || cliente.aprovado === false) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        setClienteId(cliente.id);
        setNomeCliente(cliente.nome || "Cliente");

        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado) {
          const dados = JSON.parse(guardado) as DadosOrcamento;
          setNomeObra(dados.nomeObra || "");
          setLocalizacao(dados.localizacao || "");
          setObservacoes(dados.observacoes || "");
          setArtigos(dados.artigos || []);
        }
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        setAVerificar(false);
      }
    }

    void iniciar();
  }, [router]);

  useEffect(() => {
    if (aVerificar) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nomeCliente,
        nomeObra,
        localizacao,
        observacoes,
        artigos,
      })
    );
  }, [aVerificar, nomeCliente, nomeObra, localizacao, observacoes, artigos]);

  function gerarId() {
    return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
  }

  function adicionarArtigo(tipo: string, path: string) {
    const novoArtigo: Artigo = {
      id: gerarId(),
      tipo,
      nome: tipo,
      resumo: "Ainda por configurar",
    };

    const novosArtigos = [...artigos, novoArtigo];
    setArtigos(novosArtigos);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nomeCliente,
        nomeObra,
        localizacao,
        observacoes,
        artigos: novosArtigos,
      })
    );

    router.push(`${path}?editar=${novoArtigo.id}`);
  }

  function configurarArtigo(artigo: Artigo) {
    const item = tiposArtigo.find((t) => t.tipo === artigo.tipo);
    if (!item) return;

    router.push(`${item.path}?editar=${artigo.id}`);
  }

  function removerArtigo(id: number) {
    setArtigos((lista) => lista.filter((artigo) => artigo.id !== id));
  }

  function limparOrcamento() {
    localStorage.removeItem(STORAGE_KEY);
    setNomeObra("");
    setLocalizacao("");
    setObservacoes("");
    setArtigos([]);
    setMensagem("");
  }

  async function submeterPedido() {
    try {
      setASubmeter(true);
      setMensagem("");

      if (!nomeObra.trim()) {
        setTipoMensagem("erro");
        setMensagem("Preenche o nome da obra.");
        return;
      }

      if (artigos.length === 0) {
        setTipoMensagem("erro");
        setMensagem("Adiciona pelo menos um artigo.");
        return;
      }

      const resposta = await fetch("/api/submeter-orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          nomeCliente,
          nomeObra,
          localizacao,
          observacoes,
          artigos,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados.error || "Erro ao submeter orçamento.");
      }

      localStorage.removeItem(STORAGE_KEY);
      setNomeObra("");
      setLocalizacao("");
      setObservacoes("");
      setArtigos([]);

      setTipoMensagem("sucesso");
      setMensagem("Pedido submetido com sucesso.");

      router.push("/processos-cliente");
    } catch (error) {
      console.error(error);
      setTipoMensagem("erro");
      setMensagem(error instanceof Error ? error.message : "Erro ao submeter pedido.");
    } finally {
      setASubmeter(false);
    }
  }

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <section style={contentStyle}>
          <div style={cardStyle}>A verificar sessão...</div>
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

      <section style={contentStyle}>
        <div style={topBarStyle}>
          <div>
            <h1 style={{ fontSize: "38px", margin: 0 }}>Novo Orçamento</h1>
            <p style={{ opacity: 0.8, marginTop: "10px" }}>
              Preenche os dados da obra e adiciona os artigos pretendidos.
            </p>
          </div>

          <button onClick={limparOrcamento} style={botaoSecundarioStyle}>
            Limpar
          </button>
        </div>

        {mensagem && (
          <div
            style={
              tipoMensagem === "sucesso"
                ? mensagemSucessoStyle
                : mensagemErroStyle
            }
          >
            {mensagem}
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Dados da Obra</h2>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Cliente</label>
              <input value={nomeCliente} disabled style={inputStyle} />
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
              <label style={labelStyle}>Localização</label>
              <input
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Braga"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={labelStyle}>Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas, prazos, materiais, referências..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Adicionar Artigos</h2>

          <div style={tiposGridStyle}>
            {tiposArtigo.map((item) => (
              <button
                key={item.tipo}
                onClick={() => adicionarArtigo(item.tipo, item.path)}
                style={botaoTipoStyle}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Artigos Adicionados</h2>

          {artigos.length === 0 ? (
            <p style={{ opacity: 0.75 }}>Ainda não adicionaste artigos.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {artigos.map((artigo) => (
                <div key={artigo.id} style={artigoCardStyle}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "17px" }}>
                      {artigo.nome}
                    </div>
                    <div style={{ opacity: 0.75, marginTop: "4px" }}>
                      {artigo.resumo || "Ainda por configurar"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button onClick={() => configurarArtigo(artigo)} style={botaoSecundarioStyle}>
                      Configurar
                    </button>

                    <button onClick={() => removerArtigo(artigo.id)} style={botaoRemoverStyle}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={submeterPedido}
            disabled={aSubmeter}
            style={botaoPrincipalStyle}
          >
            {aSubmeter ? "A submeter..." : "Submeter Pedido"}
          </button>
        </div>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: "flex",
  minHeight: "100dvh",
  background: "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: "260px",
  padding: "30px 20px",
  background: "rgba(0,0,0,0.14)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
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
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "24px",
};

const cardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "20px",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
};

const tiposGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "14px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const artigoCardStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
};

const botaoTipoStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoPrincipalStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
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

const botaoRemoverStyle: CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const mensagemSucessoStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(63,163,107,0.16)",
  border: "1px solid rgba(63,163,107,0.35)",
};

const mensagemErroStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
};