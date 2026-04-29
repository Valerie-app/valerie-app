"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type UnidadePreco = "m²" | "m corrido" | "unidade" | "hora" | "km";

type Preco = {
  id: string;
  categoria: string | null;
  nome: string | null;
  valor: number | null;
  unidade: UnidadePreco | null;
  created_at: string | null;
};

type PrecoEditavel = {
  id: string;
  categoria: string;
  nome: string;
  valor: string;
  unidade: UnidadePreco;
  isNew?: boolean;
};

type CategoriaBase = {
  id: string;
  nome: string;
  itens: {
    nome: string;
    valor: string;
    unidade: UnidadePreco;
  }[];
};

const categoriasIniciais: CategoriaBase[] = [
  {
    id: "precos_base_artigos",
    nome: "Preços Base dos Artigos",
    itens: [
      { nome: "Roupeiro", valor: "0", unidade: "m²" },
      { nome: "Cozinha", valor: "0", unidade: "m corrido" },
      { nome: "Móvel TV", valor: "0", unidade: "m²" },
      { nome: "Móvel WC", valor: "0", unidade: "m²" },
    ],
  },
  {
    id: "materiais_acabamentos",
    nome: "Materiais e Acabamentos",
    itens: [
      { nome: "Melamina Lisa EGGER", valor: "0", unidade: "m²" },
      { nome: "Melamina Madeira EGGER", valor: "0", unidade: "m²" },
      { nome: "Fenix", valor: "0", unidade: "m²" },
      { nome: "HPL Standard", valor: "0", unidade: "m²" },
      { nome: "Lacado Mate", valor: "0", unidade: "m²" },
      { nome: "Lacado Brilho", valor: "0", unidade: "m²" },
      { nome: "Folheado Mate", valor: "0", unidade: "m²" },
      { nome: "Folheado Brilho", valor: "0", unidade: "m²" },
      { nome: "Premium", valor: "0", unidade: "m²" },
      { nome: "LED", valor: "0", unidade: "m²" },
    ],
  },
  {
    id: "ferragens_extras",
    nome: "Ferragens e Extras",
    itens: [
      { nome: "Dobradiça", valor: "0", unidade: "unidade" },
      { nome: "Varão", valor: "0", unidade: "unidade" },
      { nome: "Gaveta de Joias", valor: "0", unidade: "unidade" },
      { nome: "Calceiro", valor: "0", unidade: "unidade" },
      { nome: "Sapateira", valor: "0", unidade: "unidade" },
      { nome: "Divisória", valor: "0", unidade: "unidade" },
      { nome: "Porta de Abrir", valor: "0", unidade: "unidade" },
      { nome: "Porta de Correr", valor: "0", unidade: "unidade" },
    ],
  },
  {
    id: "montagem_transporte",
    nome: "Montagem e Transporte",
    itens: [
      { nome: "Preço Hora", valor: "0", unidade: "hora" },
      { nome: "Preço por Pessoa", valor: "0", unidade: "unidade" },
      { nome: "Preço por Km", valor: "0", unidade: "km" },
    ],
  },
  {
    id: "embalagem",
    nome: "Embalagem",
    itens: [
      { nome: "Embalagem Simples", valor: "0", unidade: "unidade" },
      { nome: "Embalagem Reforçada", valor: "0", unidade: "unidade" },
    ],
  },
];

const unidadesDisponiveis: UnidadePreco[] = [
  "m²",
  "m corrido",
  "unidade",
  "hora",
  "km",
];

function gerarIdTemporario() {
  return `tmp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export default function AdminPrecosPage() {
  const [precos, setPrecos] = useState<PrecoEditavel[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [aCarregar, setACarregar] = useState(true);
  const [aVerificar, setAVerificar] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [aSemear, setASemear] = useState(false);

  useEffect(() => {
    validarAdmin();
  }, []);

  async function validarAdmin() {
    try {
      const { data: sessaoData, error: sessaoError } =
        await supabase.auth.getSession();

      if (sessaoError) {
        throw sessaoError;
      }

      const user = sessaoData.session?.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id, tipo_utilizador")
        .eq("id", user.id)
        .single<{ id: string; tipo_utilizador: string | null }>();

      if (clienteError || !cliente || cliente.tipo_utilizador !== "admin") {
        window.location.href = "/login";
        return;
      }

      await carregarPrecos();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao validar acesso admin.");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarPrecos() {
    try {
      setACarregar(true);
      setMensagem("");

      const { data, error } = await supabase
        .from("precos")
        .select("*")
        .order("categoria", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      const lista = ((data || []) as Preco[]).map((item) => ({
        id: item.id,
        categoria: item.categoria || "",
        nome: item.nome || "",
        valor:
          item.valor !== null && item.valor !== undefined ? String(item.valor) : "0",
        unidade: item.unidade || "unidade",
      }));

      setPrecos(lista);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar preços.");
    } finally {
      setACarregar(false);
    }
  }

  async function carregarTabelaBase() {
    try {
      setASemear(true);
      setMensagem("");

      const linhas = categoriasIniciais.flatMap((categoria) =>
        categoria.itens.map((item) => ({
          categoria: categoria.nome,
          nome: item.nome,
          valor: Number(item.valor.replace(",", ".")),
          unidade: item.unidade,
        }))
      );

      const { error } = await supabase.from("precos").insert(linhas);

      if (error) {
        throw error;
      }

      setMensagem("Tabela base carregada com sucesso.");
      await carregarPrecos();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar tabela base.");
    } finally {
      setASemear(false);
    }
  }

  function atualizarCampo(
    id: string,
    campo: keyof Pick<PrecoEditavel, "nome" | "valor" | "unidade">,
    valor: string
  ) {
    setPrecos((anteriores) =>
      anteriores.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  }

  function adicionarItem(categoria: string) {
    setPrecos((anteriores) => [
      ...anteriores,
      {
        id: gerarIdTemporario(),
        categoria,
        nome: "Novo Artigo",
        valor: "0",
        unidade: "unidade",
        isNew: true,
      },
    ]);
  }

  async function removerItem(item: PrecoEditavel) {
    try {
      setMensagem("");

      if (item.isNew || item.id.startsWith("tmp_")) {
        setPrecos((anteriores) => anteriores.filter((p) => p.id !== item.id));
        return;
      }

      const { error } = await supabase.from("precos").delete().eq("id", item.id);

      if (error) {
        throw error;
      }

      setMensagem("Artigo removido com sucesso.");
      await carregarPrecos();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao remover artigo.");
    }
  }

  async function guardarAlteracoes() {
    try {
      setAGuardar(true);
      setMensagem("");

      for (const item of precos) {
        if (!item.nome.trim()) {
          setMensagem("Existe um artigo sem nome.");
          return;
        }

        const valorNumero = Number(item.valor.replace(",", "."));

        if (Number.isNaN(valorNumero)) {
          setMensagem(`O valor do artigo "${item.nome}" não é válido.`);
          return;
        }

        if (item.isNew || item.id.startsWith("tmp_")) {
          const { error } = await supabase.from("precos").insert({
            categoria: item.categoria,
            nome: item.nome.trim(),
            valor: valorNumero,
            unidade: item.unidade,
          });

          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("precos")
            .update({
              categoria: item.categoria,
              nome: item.nome.trim(),
              valor: valorNumero,
              unidade: item.unidade,
            })
            .eq("id", item.id);

          if (error) {
            throw error;
          }
        }
      }

      setMensagem("Alterações guardadas com sucesso.");
      await carregarPrecos();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao guardar alterações.");
    } finally {
      setAGuardar(false);
    }
  }

  const categoriasAgrupadas = useMemo(() => {
    const nomesBase = categoriasIniciais.map((c) => c.nome);

    const agrupadas = nomesBase.map((nomeCategoria) => ({
      nome: nomeCategoria,
      itens: precos.filter((item) => item.categoria === nomeCategoria),
    }));

    const categoriasExtra = Array.from(
      new Set(
        precos
          .map((item) => item.categoria)
          .filter((categoria) => categoria && !nomesBase.includes(categoria))
      )
    );

    for (const categoriaExtra of categoriasExtra) {
      agrupadas.push({
        nome: categoriaExtra,
        itens: precos.filter((item) => item.categoria === categoriaExtra),
      });
    }

    return agrupadas;
  }, [precos]);

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <section style={{ flex: 1, padding: "40px" }}>
          <h1 style={{ marginTop: 0 }}>Tabela de Preços</h1>
          <p style={{ opacity: 0.8 }}>A verificar acesso...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          <a href="/admin" style={menuStyle}>
            Dashboard
          </a>

          <a href="/admin/processos" style={menuStyle}>
            Processos
          </a>

          <a href="/admin/clientes" style={menuStyle}>
            Clientes
          </a>

          <a
            href="/admin/precos"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Preços
          </a>

          <a href="/aprovacao-clientes" style={menuStyle}>
            Aprovação Clientes
          </a>
        </div>

        <div style={{ marginTop: "20px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "38px", margin: 0 }}>Tabela de Preços</h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Aqui define os preços internos da empresa. O cliente não vê qualquer
            valor na área dele.
          </p>
        </div>

        {mensagem && <div style={mensagemStyle}>{mensagem}</div>}

        {aCarregar ? (
          <div style={cardStyle}>
            <p style={{ opacity: 0.75 }}>A carregar...</p>
          </div>
        ) : precos.length === 0 ? (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Tabela Base</h2>
            <p style={{ opacity: 0.8 }}>
              Ainda não tens preços guardados no Supabase. Podes carregar já a tua
              tabela base completa.
            </p>
            <button
              onClick={carregarTabelaBase}
              style={botaoPrincipalStyle}
              disabled={aSemear}
            >
              {aSemear ? "A carregar..." : "Carregar Tabela Base"}
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: "1150px", display: "grid", gap: "20px" }}>
            {categoriasAgrupadas.map((categoria) => (
              <div key={categoria.nome} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    marginBottom: "18px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0 }}>{categoria.nome}</h2>
                    {categoria.nome === "Preços Base dos Artigos" && (
                      <p
                        style={{
                          opacity: 0.75,
                          marginTop: "8px",
                          marginBottom: 0,
                        }}
                      >
                        Defina aqui o valor base por m², m corrido ou outra medida
                        dos artigos principais.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => adicionarItem(categoria.nome)}
                    style={botaoSecundarioStyle}
                  >
                    + Adicionar Artigo
                  </button>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  {categoria.itens.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.7fr 1fr 1fr auto",
                        gap: "12px",
                        alignItems: "end",
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Nome do Artigo</label>
                        <input
                          value={item.nome}
                          onChange={(e) =>
                            atualizarCampo(item.id, "nome", e.target.value)
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Valor Base</label>
                        <input
                          value={item.valor}
                          onChange={(e) =>
                            atualizarCampo(item.id, "valor", e.target.value)
                          }
                          placeholder="0"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Tipo de Medida</label>
                        <select
                          value={item.unidade}
                          onChange={(e) =>
                            atualizarCampo(item.id, "unidade", e.target.value)
                          }
                          style={selectStyle}
                        >
                          {unidadesDisponiveis.map((unidade) => (
                            <option
                              key={unidade}
                              value={unidade}
                              style={{ color: "black" }}
                            >
                              {unidade}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => removerItem(item)}
                        style={botaoRemoverStyle}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "4px",
              }}
            >
              <button
                onClick={guardarAlteracoes}
                style={botaoPrincipalStyle}
                disabled={aGuardar}
              >
                {aGuardar ? "A guardar..." : "Guardar Alterações"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
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
  padding: "14px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
};

const cardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
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
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const mensagemStyle: CSSProperties = {
  maxWidth: "1150px",
  marginBottom: "20px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(63, 163, 107, 0.15)",
  border: "1px solid rgba(63, 163, 107, 0.35)",
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

const botaoSecundarioStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
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
  padding: "14px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};