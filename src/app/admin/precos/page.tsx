"use client";

import { useEffect, useState } from "react";

type UnidadePreco = "m²" | "m corrido" | "unidade" | "hora" | "km";

type ItemPreco = {
  id: number;
  nome: string;
  valor: string;
  unidade: UnidadePreco;
};

type CategoriaPrecos = {
  id: string;
  nome: string;
  itens: ItemPreco[];
};

const STORAGE_KEY = "valerie_tabela_precos";

const categoriasIniciais: CategoriaPrecos[] = [
  {
    id: "precos_base_artigos",
    nome: "Preços Base dos Artigos",
    itens: [
      { id: 1, nome: "Roupeiro", valor: "0", unidade: "m²" },
      { id: 2, nome: "Cozinha", valor: "0", unidade: "m corrido" },
      { id: 3, nome: "Móvel TV", valor: "0", unidade: "m²" },
      { id: 4, nome: "Móvel WC", valor: "0", unidade: "m²" },
    ],
  },
  {
    id: "materiais_acabamentos",
    nome: "Materiais e Acabamentos",
    itens: [
      { id: 5, nome: "Melamina Lisa EGGER", valor: "0", unidade: "m²" },
      { id: 6, nome: "Melamina Madeira EGGER", valor: "0", unidade: "m²" },
      { id: 7, nome: "Fenix", valor: "0", unidade: "m²" },
      { id: 8, nome: "HPL Standard", valor: "0", unidade: "m²" },
      { id: 9, nome: "Lacado Mate", valor: "0", unidade: "m²" },
      { id: 10, nome: "Lacado Brilho", valor: "0", unidade: "m²" },
      { id: 11, nome: "Folheado Mate", valor: "0", unidade: "m²" },
      { id: 12, nome: "Folheado Brilho", valor: "0", unidade: "m²" },
      { id: 13, nome: "Premium", valor: "0", unidade: "m²" },
      { id: 14, nome: "LED", valor: "0", unidade: "m²" },
    ],
  },
  {
    id: "ferragens_extras",
    nome: "Ferragens e Extras",
    itens: [
      { id: 15, nome: "Dobradiça", valor: "0", unidade: "unidade" },
      { id: 16, nome: "Varão", valor: "0", unidade: "unidade" },
      { id: 17, nome: "Gaveta de Joias", valor: "0", unidade: "unidade" },
      { id: 18, nome: "Calceiro", valor: "0", unidade: "unidade" },
      { id: 19, nome: "Sapateira", valor: "0", unidade: "unidade" },
      { id: 20, nome: "Divisória", valor: "0", unidade: "unidade" },
      { id: 21, nome: "Porta de Abrir", valor: "0", unidade: "unidade" },
      { id: 22, nome: "Porta de Correr", valor: "0", unidade: "unidade" },
    ],
  },
  {
    id: "montagem_transporte",
    nome: "Montagem e Transporte",
    itens: [
      { id: 23, nome: "Preço Hora", valor: "0", unidade: "hora" },
      { id: 24, nome: "Preço por Pessoa", valor: "0", unidade: "unidade" },
      { id: 25, nome: "Preço por Km", valor: "0", unidade: "km" },
    ],
  },
  {
    id: "embalagem",
    nome: "Embalagem",
    itens: [
      { id: 26, nome: "Embalagem Simples", valor: "0", unidade: "unidade" },
      { id: 27, nome: "Embalagem Reforçada", valor: "0", unidade: "unidade" },
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

export default function AdminPrecosPage() {
  const [categorias, setCategorias] = useState<CategoriaPrecos[]>(categoriasIniciais);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const guardados = localStorage.getItem(STORAGE_KEY);

    if (guardados) {
      try {
        setCategorias(JSON.parse(guardados));
      } catch (error) {
        console.error("Erro ao ler tabela de preços:", error);
      }
    }
  }, []);

  function gerarIdUnico() {
    return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
  }

  function guardarAlteracoes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
    setMensagem("Alterações guardadas com sucesso.");

    setTimeout(() => {
      setMensagem("");
    }, 2500);
  }

  function atualizarNomeItem(categoriaId: string, itemId: number, novoNome: string) {
    setCategorias((anteriores) =>
      anteriores.map((categoria) =>
        categoria.id === categoriaId
          ? {
              ...categoria,
              itens: categoria.itens.map((item) =>
                item.id === itemId ? { ...item, nome: novoNome } : item
              ),
            }
          : categoria
      )
    );
  }

  function atualizarValorItem(categoriaId: string, itemId: number, novoValor: string) {
    setCategorias((anteriores) =>
      anteriores.map((categoria) =>
        categoria.id === categoriaId
          ? {
              ...categoria,
              itens: categoria.itens.map((item) =>
                item.id === itemId ? { ...item, valor: novoValor } : item
              ),
            }
          : categoria
      )
    );
  }

  function atualizarUnidadeItem(
    categoriaId: string,
    itemId: number,
    novaUnidade: UnidadePreco
  ) {
    setCategorias((anteriores) =>
      anteriores.map((categoria) =>
        categoria.id === categoriaId
          ? {
              ...categoria,
              itens: categoria.itens.map((item) =>
                item.id === itemId ? { ...item, unidade: novaUnidade } : item
              ),
            }
          : categoria
      )
    );
  }

  function adicionarItem(categoriaId: string) {
    setCategorias((anteriores) =>
      anteriores.map((categoria) =>
        categoria.id === categoriaId
          ? {
              ...categoria,
              itens: [
                ...categoria.itens,
                {
                  id: gerarIdUnico(),
                  nome: "Novo Artigo",
                  valor: "0",
                  unidade: "unidade",
                },
              ],
            }
          : categoria
      )
    );
  }

  function removerItem(categoriaId: string, itemId: number) {
    setCategorias((anteriores) =>
      anteriores.map((categoria) =>
        categoria.id === categoriaId
          ? {
              ...categoria,
              itens: categoria.itens.filter((item) => item.id !== itemId),
            }
          : categoria
      )
    );
  }

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
          <a href="/admin" style={menuStyle}>
            Dashboard Admin
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
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "38px", margin: 0 }}>Tabela de Preços</h1>
          <p style={{ opacity: 0.8, marginTop: "10px" }}>
            Aqui define os preços internos da empresa. O cliente não vê qualquer
            valor na área dele.
          </p>
        </div>

        {mensagem && (
          <div
            style={{
              maxWidth: "1150px",
              marginBottom: "20px",
              padding: "16px 18px",
              borderRadius: "12px",
              background: "rgba(63, 163, 107, 0.15)",
              border: "1px solid rgba(63, 163, 107, 0.35)",
            }}
          >
            {mensagem}
          </div>
        )}

        <div style={{ maxWidth: "1150px", display: "grid", gap: "20px" }}>
          {categorias.map((categoria) => (
            <div key={categoria.id} style={cardStyle}>
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
                  {categoria.id === "precos_base_artigos" && (
                    <p style={{ opacity: 0.75, marginTop: "8px", marginBottom: 0 }}>
                      Defina aqui o valor base por m², m corrido ou outra medida
                      dos artigos principais.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => adicionarItem(categoria.id)}
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
                          atualizarNomeItem(categoria.id, item.id, e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Valor Base</label>
                      <input
                        value={item.valor}
                        onChange={(e) =>
                          atualizarValorItem(categoria.id, item.id, e.target.value)
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
                          atualizarUnidadeItem(
                            categoria.id,
                            item.id,
                            e.target.value as UnidadePreco
                          )
                        }
                        style={inputStyle}
                      >
                        {unidadesDisponiveis.map((unidade) => (
                          <option key={unidade} value={unidade}>
                            {unidade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => removerItem(categoria.id, item.id)}
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
            <button onClick={guardarAlteracoes} style={botaoPrincipalStyle}>
              Guardar Alterações
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const menuStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
};

const cardStyle: React.CSSProperties = {
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const botaoPrincipalStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #4b5f9e 0%, #34457c 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};

const botaoSecundarioStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoRemoverStyle: React.CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "14px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};