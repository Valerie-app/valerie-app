"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type ValDropbox = {
  codigo_val: string;
  nome_pasta: string;
  nome_obra: string;
  nome_cliente: string;
  caminho_dropbox: string;
  estado_dropbox: "orcamento" | "encomenda";
  estado: string;
};

type ImportacaoResultado = {
  codigo_val: string;
  sucesso: boolean;
  erro?: string;
};

export default function AdminImportarValPage() {
  const router = useRouter();

  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(false);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [vals, setVals] = useState<ValDropbox[]>([]);
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [aImportar, setAImportar] = useState(false);
  const [resultados, setResultados] = useState<ImportacaoResultado[]>([]);

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
        .select("id, tipo_utilizador")
        .eq("id", user.id)
        .single<{ id: string; tipo_utilizador: string | null }>();

      if (clienteError || !cliente || cliente.tipo_utilizador !== "admin") {
        router.replace("/login");
        return;
      }
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao validar admin.", "erro");
      router.replace("/login");
    } finally {
      setAVerificar(false);
    }
  }

  function mostrarMensagem(texto: string, tipo: "sucesso" | "erro") {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  async function listarValDropbox() {
    try {
      setACarregar(true);
      setMensagem("");
      setResultados([]);

      const anoNumero = Number(ano);
      if (!Number.isFinite(anoNumero) || anoNumero < 2000) {
        mostrarMensagem("Ano inválido.", "erro");
        return;
      }

      const res = await fetch("/api/listar-val-dropbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: anoNumero }),
      });

      const data = await res.json();
      if (!data.sucesso) {
        mostrarMensagem(data.erro || "Erro ao listar VAL no Dropbox.", "erro");
        return;
      }

      const lista = (data.vals || []) as ValDropbox[];
      setVals(lista);

      const novosSelecionados: Record<string, boolean> = {};
      for (const val of lista) novosSelecionados[val.codigo_val] = false;
      setSelecionados(novosSelecionados);

      mostrarMensagem(`Foram encontrados ${lista.length} VAL no Dropbox.`, "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao listar VAL no Dropbox.", "erro");
    } finally {
      setACarregar(false);
    }
  }

  function alternarSelecionado(codigoVal: string) {
    setSelecionados((prev) => ({ ...prev, [codigoVal]: !prev[codigoVal] }));
  }

  function selecionarTodos() {
    const todosSelecionados = vals.length > 0 && vals.every((val) => selecionados[val.codigo_val]);
    const novoEstado: Record<string, boolean> = {};
    for (const val of vals) novoEstado[val.codigo_val] = !todosSelecionados;
    setSelecionados(novoEstado);
  }

  async function importarUm(val: ValDropbox) {
    const anoAtual = Number(ano) || new Date().getFullYear();
    const numeroMatch = val.codigo_val.match(/^VAL(\d{3})\.(\d{2})$/i);
    const numeroSequencial = numeroMatch ? Number(numeroMatch[1]) : 0;

    const payloadProcesso = {
      nome_cliente: val.nome_cliente || "Cliente não definido",
      nome_obra: val.nome_obra || val.nome_pasta || val.codigo_val,
      estado: val.estado || (val.estado_dropbox === "encomenda" ? "Validado" : "Orçamento Enviado"),
      codigo_val: val.codigo_val,
      caminho_dropbox: val.caminho_dropbox,
      estado_dropbox: val.estado_dropbox,
      lote_atual: 1,
      calendario_arquivado: false,
    };

    const payloadProjeto = {
      ano: anoAtual,
      numero_sequencial: numeroSequencial,
      codigo_val: val.codigo_val,
      nome_empresa: val.nome_obra || val.nome_pasta || val.codigo_val,
      nome_cliente: val.nome_cliente || "Cliente não definido",
      nome_pasta_dropbox: val.nome_pasta,
      caminho_dropbox: val.caminho_dropbox,
      estado: val.estado_dropbox,
    };

    const { error: projetoError } = await supabase
      .from("projetos")
      .upsert(payloadProjeto, { onConflict: "codigo_val" });

    if (projetoError) throw projetoError;

    const { data: processoExistente, error: processoBuscaError } = await supabase
      .from("processos")
      .select("id")
      .eq("codigo_val", val.codigo_val)
      .maybeSingle<{ id: string }>();

    if (processoBuscaError) throw processoBuscaError;

    if (processoExistente?.id) {
      const { error: updateError } = await supabase
        .from("processos")
        .update(payloadProcesso)
        .eq("id", processoExistente.id);
      if (updateError) throw updateError;
      return;
    }

    const { error: insertError } = await supabase.from("processos").insert(payloadProcesso);
    if (insertError) throw insertError;
  }

  async function importarSelecionados() {
    try {
      setAImportar(true);
      setMensagem("");
      setResultados([]);

      const lista = vals.filter((val) => selecionados[val.codigo_val]);
      if (lista.length === 0) {
        mostrarMensagem("Seleciona pelo menos um VAL para importar.", "erro");
        return;
      }

      const novosResultados: ImportacaoResultado[] = [];
      for (const val of lista) {
        try {
          await importarUm(val);
          novosResultados.push({ codigo_val: val.codigo_val, sucesso: true });
        } catch (error: any) {
          console.error(error);
          novosResultados.push({
            codigo_val: val.codigo_val,
            sucesso: false,
            erro: error?.message || "Erro ao importar.",
          });
        }
        setResultados([...novosResultados]);
      }

      const sucesso = novosResultados.filter((r) => r.sucesso).length;
      const falhas = novosResultados.length - sucesso;

      if (falhas > 0) {
        mostrarMensagem(`Importação concluída com ${sucesso} sucesso(s) e ${falhas} erro(s).`, "erro");
      } else {
        mostrarMensagem(`Importação concluída com sucesso: ${sucesso} VAL importado(s).`, "sucesso");
      }
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao importar VAL.", "erro");
    } finally {
      setAImportar(false);
    }
  }

  const totalSelecionados = vals.filter((val) => selecionados[val.codigo_val]).length;
  const valsOrcamento = vals.filter((val) => val.estado_dropbox === "orcamento").length;
  const valsEncomenda = vals.filter((val) => val.estado_dropbox === "encomenda").length;

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <section style={contentStyle}>
          <h1>Importar VAL</h1>
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
          <a href="/admin/importar-val" style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}>Importar VAL</a>
          <a href="/admin/operadores" style={menuStyle}>Operadores</a>
          <a href="/aprovacao-clientes" style={menuStyle}>Aprovação Clientes</a>
        </div>

        <div style={{ marginTop: 16 }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle}>
        <div style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>Migração / Arranque</div>
            <h1 style={titleStyle}>Importar VAL existentes</h1>
            <p style={subtitleStyle}>
              Lê os VAL já criados manualmente no Dropbox em Orçamentos e Encomendas, e cria/atualiza esses trabalhos na app.
            </p>
          </div>

          <div style={heroActionsStyle}>
            <input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="Ano" style={anoInputStyle} />
            <button type="button" onClick={listarValDropbox} disabled={aCarregar} style={botaoPrincipalStyle}>
              {aCarregar ? "A procurar..." : "Listar VAL Dropbox"}
            </button>
          </div>
        </div>

        {mensagem && (
          <div style={tipoMensagem === "sucesso" ? mensagemSucessoStyle : mensagemErroStyle}>{mensagem}</div>
        )}

        <div style={resumoGridStyle}>
          <div style={resumoCardStyle}><strong>{vals.length}</strong><span>Total encontrados</span></div>
          <div style={resumoCardStyle}><strong>{valsOrcamento}</strong><span>Em Orçamentos</span></div>
          <div style={resumoCardStyle}><strong>{valsEncomenda}</strong><span>Em Encomendas</span></div>
          <div style={resumoCardStyle}><strong>{totalSelecionados}</strong><span>Selecionados</span></div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>VAL encontrados</h2>
              <p style={smallTextStyle}>
                Os VAL em Encomendas entram como Validado. Os VAL em Orçamentos entram como Orçamento Enviado.
              </p>
            </div>

            <div style={acoesStyle}>
              <button type="button" onClick={selecionarTodos} style={botaoSecundarioStyle} disabled={vals.length === 0}>
                {vals.length > 0 && vals.every((val) => selecionados[val.codigo_val]) ? "Limpar seleção" : "Selecionar todos"}
              </button>

              <button type="button" onClick={importarSelecionados} style={botaoAprovarStyle} disabled={aImportar || totalSelecionados === 0}>
                {aImportar ? "A importar..." : `Importar ${totalSelecionados}`}
              </button>
            </div>
          </div>

          {vals.length === 0 ? (
            <div style={emptyStyle}>Ainda não há VAL listados. Clica em “Listar VAL Dropbox”.</div>
          ) : (
            <div style={listaStyle}>
              {vals.map((val) => {
                const selecionado = selecionados[val.codigo_val] === true;
                const resultado = resultados.find((r) => r.codigo_val === val.codigo_val);

                return (
                  <div key={`${val.estado_dropbox}-${val.codigo_val}-${val.caminho_dropbox}`} style={{ ...valCardStyle, ...(selecionado ? valCardSelecionadoStyle : {}) }}>
                    <label style={checkboxLabelStyle}>
                      <input type="checkbox" checked={selecionado} onChange={() => alternarSelecionado(val.codigo_val)} />

                      <div style={{ minWidth: 0 }}>
                        <div style={linhaTituloStyle}>
                          <strong>{val.codigo_val}</strong>
                          <span style={val.estado_dropbox === "encomenda" ? badgeEncomendaStyle : badgeOrcamentoStyle}>
                            {val.estado_dropbox === "encomenda" ? "Encomenda" : "Orçamento"}
                          </span>
                        </div>

                        <div style={obraStyle}>{val.nome_obra || "Sem nome da obra"}</div>
                        <div style={clienteStyle}>Cliente: {val.nome_cliente || "—"}</div>
                        <div style={caminhoStyle}>{val.caminho_dropbox}</div>

                        {resultado && (
                          <div style={resultado.sucesso ? resultadoOkStyle : resultadoErroStyle}>
                            {resultado.sucesso ? "Importado/atualizado com sucesso." : resultado.erro || "Erro ao importar."}
                          </div>
                        )}
                      </div>
                    </label>
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

const mainStyle: CSSProperties = { minHeight: "100dvh", background: "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)", color: "white", display: "flex", fontFamily: "Arial, sans-serif" };
const asideStyle: CSSProperties = { width: 260, minHeight: "100dvh", padding: "30px 20px", background: "rgba(0,0,0,0.14)", borderRight: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 };
const contentStyle: CSSProperties = { flex: 1, padding: 40, overflowX: "hidden" };
const logoStyle: CSSProperties = { fontSize: 36, letterSpacing: 9, marginBottom: 36 };
const menuContainerStyle: CSSProperties = { display: "grid", gap: 12 };
const menuStyle: CSSProperties = { padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "white", textDecoration: "none", fontWeight: "bold" };
const heroStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, padding: 28, borderRadius: 22, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 };
const heroActionsStyle: CSSProperties = { display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" };
const eyebrowStyle: CSSProperties = { fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.7, marginBottom: 8 };
const titleStyle: CSSProperties = { margin: 0, fontSize: 38 };
const subtitleStyle: CSSProperties = { marginTop: 10, opacity: 0.82, maxWidth: 760, lineHeight: 1.45 };
const anoInputStyle: CSSProperties = { width: 100, padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", color: "white", outline: "none" };
const resumoGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 };
const resumoCardStyle: CSSProperties = { display: "grid", gap: 8, padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" };
const cardStyle: CSSProperties = { padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" };
const cardHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 };
const smallTextStyle: CSSProperties = { opacity: 0.75, marginTop: 0, lineHeight: 1.4 };
const acoesStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
const listaStyle: CSSProperties = { display: "grid", gap: 12 };
const valCardStyle: CSSProperties = { padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" };
const valCardSelecionadoStyle: CSSProperties = { background: "rgba(92,115,199,0.18)", border: "1px solid rgba(157,195,255,0.35)" };
const checkboxLabelStyle: CSSProperties = { display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, cursor: "pointer" };
const linhaTituloStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const obraStyle: CSSProperties = { marginTop: 8, fontWeight: "bold" };
const clienteStyle: CSSProperties = { marginTop: 5, opacity: 0.82 };
const caminhoStyle: CSSProperties = { marginTop: 8, fontSize: 12, opacity: 0.65, wordBreak: "break-all" };
const badgeOrcamentoStyle: CSSProperties = { padding: "6px 10px", borderRadius: 999, background: "rgba(244,180,0,0.16)", border: "1px solid rgba(244,180,0,0.40)", color: "#ffd76c", fontSize: 12, fontWeight: "bold" };
const badgeEncomendaStyle: CSSProperties = { padding: "6px 10px", borderRadius: 999, background: "rgba(63, 163, 107, 0.18)", border: "1px solid rgba(63, 163, 107, 0.42)", color: "#9df5b4", fontSize: 12, fontWeight: "bold" };
const emptyStyle: CSSProperties = { padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.04)", opacity: 0.75 };
const botaoPrincipalStyle: CSSProperties = { background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)", color: "white", border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: "bold", cursor: "pointer" };
const botaoSecundarioStyle: CSSProperties = { background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "10px 14px", fontWeight: "bold", cursor: "pointer" };
const botaoAprovarStyle: CSSProperties = { background: "rgba(63, 163, 107, 0.18)", color: "white", border: "1px solid rgba(63, 163, 107, 0.35)", borderRadius: 10, padding: "10px 14px", fontWeight: "bold", cursor: "pointer" };
const mensagemSucessoStyle: CSSProperties = { marginBottom: 18, padding: 16, borderRadius: 12, background: "rgba(63, 163, 107, 0.15)", border: "1px solid rgba(63, 163, 107, 0.35)" };
const mensagemErroStyle: CSSProperties = { marginBottom: 18, padding: 16, borderRadius: 12, background: "rgba(180,50,50,0.18)", border: "1px solid rgba(180,50,50,0.35)" };
const resultadoOkStyle: CSSProperties = { marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(63, 163, 107, 0.14)", border: "1px solid rgba(63, 163, 107, 0.30)", color: "#9df5b4", fontSize: 13 };
const resultadoErroStyle: CSSProperties = { marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(180,50,50,0.15)", border: "1px solid rgba(180,50,50,0.35)", color: "#ffb0b0", fontSize: 13 };
