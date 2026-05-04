"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
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
  custo_estimado_total: number | null;
  lucro_estimado: number | null;
  margem_percentual: number | null;
  dias_totais_previstos?: number | null;
  data_entrega_prevista?: string | null;
  created_at: string | null;
  codigo_val: string | null;
  caminho_dropbox: string | null;
  estado_dropbox: string | null;
  lote_atual: number | null;
};

type ExtraArtigo = {
  nome?: string;
  quantidade?: string | number;
};

type DadosArtigo = {
  largura?: number | string;
  altura?: number | string;
  profundidade?: number | string;
  material?: string;
  acabamento?: string;
  extras?: ExtraArtigo[];
  [key: string]: any;
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

type Preco = {
  id: string;
  nome: string | null;
  valor: number | null;
  categoria?: string | null;
  unidade?: string | null;
};

type CalculoArtigo = {
  area: number;
  precoBase: number;
  precoMaterial: number;
  subtotalBase: number;
  subtotalExtras: number;
  subtotalTotal: number;
};

const ESTADOS = [
  "Pedido Submetido",
  "Em Análise",
  "Orçamento Enviado",
  "Validado",
  "Rejeitado",
];

const FATOR_CUSTO_BASE = 0.55;
const FATOR_CUSTO_EXTRAS = 0.7;

export default function AdminProcessosPage() {
  const router = useRouter();

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [precos, setPrecos] = useState<Preco[]>([]);
  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [processoAberto, setProcessoAberto] = useState<string | null>(null);
  const [processoEmAcao, setProcessoEmAcao] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [valorFinalEdit, setValorFinalEdit] = useState<Record<string, string>>({});
  const [custoEstimadoEdit, setCustoEstimadoEdit] = useState<Record<string, string>>({});
  const [notasAdminEdit, setNotasAdminEdit] = useState<Record<string, string>>({});

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

      await carregarTudo();
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao validar admin.", "erro");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarTudo() {
    try {
      setACarregar(true);

      const [processosRes, artigosRes, precosRes] = await Promise.all([
        supabase.from("processos").select("*").order("created_at", { ascending: false }),
        supabase.from("artigos").select("*").order("created_at", { ascending: true }),
        supabase.from("precos").select("id, nome, valor, categoria, unidade"),
      ]);

      if (processosRes.error) throw processosRes.error;
      if (artigosRes.error) throw artigosRes.error;
      if (precosRes.error) throw precosRes.error;

      const listaProcessos = (processosRes.data || []) as Processo[];
      const listaArtigosBruta = (artigosRes.data || []) as ArtigoDB[];

      const listaArtigos: Artigo[] = listaArtigosBruta.map((artigo) => ({
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

      const valores: Record<string, string> = {};
      const custos: Record<string, string> = {};
      const notas: Record<string, string> = {};

      for (const processo of listaProcessos) {
        valores[processo.id] =
          processo.valor_final !== null && processo.valor_final !== undefined
            ? String(processo.valor_final)
            : "";

        custos[processo.id] =
          processo.custo_estimado_total !== null &&
          processo.custo_estimado_total !== undefined
            ? String(processo.custo_estimado_total)
            : "";

        notas[processo.id] = processo.notas_admin || "";
      }

      setProcessos(listaProcessos);
      setArtigos(listaArtigos);
      setPrecos((precosRes.data || []) as Preco[]);
      setValorFinalEdit(valores);
      setCustoEstimadoEdit(custos);
      setNotasAdminEdit(notas);
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao carregar processos.", "erro");
    } finally {
      setACarregar(false);
    }
  }

  function mostrarMensagem(texto: string, tipo: "sucesso" | "erro") {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  function limparMensagem() {
    setMensagem("");
  }

  function numeroSeguro(valor: unknown) {
    const numero = Number(String(valor ?? "0").replace(",", "."));
    return Number.isFinite(numero) ? numero : 0;
  }

  function converterParaMetros(valor: number) {
    if (valor > 20) return valor / 100;
    return valor;
  }

  function normalizarTexto(valor: string | null | undefined) {
    return String(valor || "").trim().toLowerCase();
  }

  function formatarMoeda(valor: number | null | undefined) {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
      return "—";
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

  function obterArtigosDoProcesso(processoId: string) {
    return artigos.filter((artigo) => artigo.processo_id === processoId);
  }

  function obterPrecoPorNome(nome: string | null | undefined) {
    if (!nome) return 0;

    const encontrado = precos.find(
      (p) => normalizarTexto(p.nome) === normalizarTexto(nome)
    );

    return Number(encontrado?.valor || 0);
  }

  function calcularArtigo(artigo: Artigo): CalculoArtigo {
    const dados = artigo.dados || {};
    const larguraOriginal = numeroSeguro(dados.largura);
    const alturaOriginal = numeroSeguro(dados.altura);
    const largura = converterParaMetros(larguraOriginal);
    const altura = converterParaMetros(alturaOriginal);
    const area = largura * altura;
    const material = dados.material || dados.acabamento || "";
    const precoBase = obterPrecoPorNome(artigo.tipo);
    const precoMaterial = obterPrecoPorNome(material);
    const subtotalBase = area * (precoBase + precoMaterial);

    let subtotalExtras = 0;
    for (const extra of dados.extras || []) {
      subtotalExtras += obterPrecoPorNome(extra.nome) * numeroSeguro(extra.quantidade);
    }

    return {
      area,
      precoBase,
      precoMaterial,
      subtotalBase,
      subtotalExtras,
      subtotalTotal: subtotalBase + subtotalExtras,
    };
  }

  function obterCustoSugeridoPorArtigos(processoId: string) {
    return obterArtigosDoProcesso(processoId).reduce((acc, artigo) => {
      const calculo = calcularArtigo(artigo);
      return (
        acc +
        calculo.subtotalBase * FATOR_CUSTO_BASE +
        calculo.subtotalExtras * FATOR_CUSTO_EXTRAS
      );
    }, 0);
  }

  function obterValorFinanceiro(processo: Processo) {
    return Number(
      processo.valor_final ??
        processo.valor_estimado_com_desconto ??
        processo.valor_estimado ??
        0
    );
  }

  function obterCustoEfetivo(processo: Processo) {
    const custo = Number(processo.custo_estimado_total || 0);
    if (custo > 0) return custo;
    return obterCustoSugeridoPorArtigos(processo.id);
  }

  function obterLucro(processo: Processo) {
    return obterValorFinanceiro(processo) - obterCustoEfetivo(processo);
  }

  function obterMargem(processo: Processo) {
    const valor = obterValorFinanceiro(processo);
    if (valor <= 0) return 0;
    return (obterLucro(processo) / valor) * 100;
  }

  function obterUrlProducao(processo: Processo) {
    if (!processo.codigo_val) return "";

    const params = new URLSearchParams({
      codigo_val: processo.codigo_val,
      lote: String(processo.lote_atual || 1),
    });

    return `/producao?${params.toString()}`;
  }

  function abrirProducao(processo: Processo) {
    if (!processo.codigo_val) {
      mostrarMensagem("Este processo ainda não tem VAL.", "erro");
      return;
    }

    window.open(obterUrlProducao(processo), "_blank");
  }

  async function copiarLinkProducao(processo: Processo) {
    try {
      if (!processo.codigo_val) {
        mostrarMensagem("Este processo ainda não tem VAL.", "erro");
        return;
      }

      const urlRelativa = obterUrlProducao(processo);
      const urlCompleta = `${window.location.origin}${urlRelativa}`;

      await navigator.clipboard.writeText(urlCompleta);
      mostrarMensagem("Link/QR da produção copiado com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao copiar link da produção.", "erro");
    }
  }

  async function gerarQRArtigos(processo: Processo) {
    try {
      setProcessoEmAcao(processo.id);
      limparMensagem();

      if (!processo.codigo_val) {
        mostrarMensagem("Este processo ainda não tem VAL.", "erro");
        return;
      }

      const artigosDoProcesso = obterArtigosDoProcesso(processo.id);

      if (artigosDoProcesso.length === 0) {
        mostrarMensagem("Este processo não tem artigos associados.", "erro");
        return;
      }

      const res = await fetch("/api/gerar-qr-artigos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processo_id: processo.id,
          codigo_val: processo.codigo_val,
          lote: processo.lote_atual || 1,
          caminho_dropbox: processo.caminho_dropbox,
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        mostrarMensagem(data.erro || "Erro ao gerar QR dos artigos.", "erro");
        return;
      }

      mostrarMensagem(`QR dos artigos criados com sucesso (${data.total || 0}).`, "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao gerar QR dos artigos.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  async function atualizarEstado(processoId: string, estado: string) {
    try {
      setProcessoEmAcao(processoId);
      limparMensagem();

      const { error } = await supabase
        .from("processos")
        .update({ estado })
        .eq("id", processoId);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((p) => (p.id === processoId ? { ...p, estado } : p))
      );

      mostrarMensagem("Estado atualizado com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao atualizar estado.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  async function criarValParaProcesso(processo: Processo) {
    try {
      setProcessoEmAcao(processo.id);
      limparMensagem();

      const res = await fetch("/api/criar-projeto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome_empresa: processo.nome_obra || "Sem nome",
          nome_cliente: processo.nome_cliente || "Cliente",
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        mostrarMensagem(data.erro || "Erro ao criar VAL.", "erro");
        return;
      }

      const { error } = await supabase
        .from("processos")
        .update({
          codigo_val: data.codigo,
          caminho_dropbox: data.caminho,
          estado_dropbox: "orcamento",
          lote_atual: 1,
        })
        .eq("id", processo.id);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((p) =>
          p.id === processo.id
            ? {
                ...p,
                codigo_val: data.codigo,
                caminho_dropbox: data.caminho,
                estado_dropbox: "orcamento",
                lote_atual: 1,
              }
            : p
        )
      );

      mostrarMensagem(`VAL criado com sucesso: ${data.codigo}`, "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao criar VAL para o processo.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  async function criarNovoLote(processo: Processo) {
    try {
      setProcessoEmAcao(processo.id);
      limparMensagem();

      if (!processo.codigo_val) {
        mostrarMensagem("Este processo ainda não tem VAL.", "erro");
        return;
      }

      const res = await fetch("/api/criar-lote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_val: processo.codigo_val,
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        mostrarMensagem(data.erro || "Erro ao criar novo lote.", "erro");
        return;
      }

      const { error } = await supabase
        .from("processos")
        .update({
          lote_atual: data.lote,
        })
        .eq("id", processo.id);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((p) =>
          p.id === processo.id
            ? {
                ...p,
                lote_atual: data.lote,
              }
            : p
        )
      );

      mostrarMensagem(`${data.nome_lote} criado com sucesso.`, "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao criar novo lote.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  async function aprovarOrcamentoDropbox(processo: Processo) {
    try {
      setProcessoEmAcao(processo.id);
      limparMensagem();

      if (!processo.codigo_val) {
        mostrarMensagem("Este processo ainda não tem VAL.", "erro");
        return;
      }

      const res = await fetch("/api/aprovar-orcamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_val: processo.codigo_val,
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        mostrarMensagem(data.erro || "Erro ao mover para Encomendas.", "erro");
        return;
      }

      const { error } = await supabase
        .from("processos")
        .update({
          caminho_dropbox: data.caminho_novo,
          estado_dropbox: "encomenda",
          estado: "Validado",
        })
        .eq("id", processo.id);

      if (error) throw error;

      const processoAtualizado: Processo = {
        ...processo,
        caminho_dropbox: data.caminho_novo,
        estado_dropbox: "encomenda",
        estado: "Validado",
      };

      setProcessos((prev) =>
        prev.map((p) => (p.id === processo.id ? processoAtualizado : p))
      );

      const qrRes = await fetch("/api/gerar-qr-artigos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processo_id: processo.id,
          codigo_val: processo.codigo_val,
          lote: processo.lote_atual || 1,
          caminho_dropbox: data.caminho_novo,
        }),
      });

      const qrData = await qrRes.json();

      if (!qrData.sucesso) {
        mostrarMensagem(
          `Processo aprovado, mas houve erro ao gerar QR: ${
            qrData.erro || "erro desconhecido"
          }`,
          "erro"
        );
        return;
      }

      mostrarMensagem(
        `Processo aprovado, movido para Encomendas e QR criados (${qrData.total || 0}).`,
        "sucesso"
      );
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao aprovar orçamento.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  function abrirPastaDropbox(caminho: string | null) {
    if (!caminho) {
      mostrarMensagem("Este processo ainda não tem pasta Dropbox.", "erro");
      return;
    }

    window.open(`https://www.dropbox.com/home${caminho}`, "_blank");
  }

  async function uploadFicheiroProcesso(processo: Processo, file: File) {
    try {
      setProcessoEmAcao(processo.id);
      limparMensagem();

      if (!processo.codigo_val) {
        mostrarMensagem("Este processo ainda não tem VAL.", "erro");
        return;
      }

      const base64 = await fileToBase64(file);

      const res = await fetch("/api/upload-ficheiro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_val: processo.codigo_val,
          lote: processo.lote_atual || 1,
          nome_ficheiro: file.name,
          ficheiro_base64: base64,
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        mostrarMensagem(data.erro || "Erro ao enviar ficheiro.", "erro");
        return;
      }

      mostrarMensagem(
        `Ficheiro enviado para ${processo.codigo_val} / Lote ${processo.lote_atual || 1}.`,
        "sucesso"
      );
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao enviar ficheiro.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function recalcularProcesso(processo: Processo) {
    try {
      setProcessoEmAcao(processo.id);
      limparMensagem();

      const artigosDoProcesso = obterArtigosDoProcesso(processo.id);

      const novoTotal = artigosDoProcesso.reduce((acc, artigo) => {
        return acc + calcularArtigo(artigo).subtotalTotal;
      }, 0);

      const desconto = Number(processo.desconto_percentual || 0);
      const novoTotalComDesconto = novoTotal - (novoTotal * desconto) / 100;

      const custoFinal = obterCustoSugeridoPorArtigos(processo.id);
      const lucroEstimado = novoTotalComDesconto - custoFinal;
      const margemPercentual =
        novoTotalComDesconto > 0
          ? (lucroEstimado / novoTotalComDesconto) * 100
          : 0;

      const payload = {
        valor_estimado: novoTotal,
        valor_estimado_com_desconto: novoTotalComDesconto,
        custo_estimado_total: custoFinal,
        lucro_estimado: lucroEstimado,
        margem_percentual: margemPercentual,
      };

      const { error } = await supabase
        .from("processos")
        .update(payload)
        .eq("id", processo.id);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((p) => (p.id === processo.id ? { ...p, ...payload } : p))
      );

      setCustoEstimadoEdit((prev) => ({
        ...prev,
        [processo.id]: custoFinal.toFixed(2),
      }));

      mostrarMensagem("Processo recalculado com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao recalcular processo.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  async function guardarDadosAdmin(processo: Processo) {
    try {
      setProcessoEmAcao(processo.id);
      limparMensagem();

      const valorTexto = (valorFinalEdit[processo.id] || "").trim();
      const custoTexto = (custoEstimadoEdit[processo.id] || "").trim();

      const valorFinal =
        valorTexto === "" ? null : Number(valorTexto.replace(",", "."));

      const custoFinal =
        custoTexto === ""
          ? obterCustoSugeridoPorArtigos(processo.id)
          : Number(custoTexto.replace(",", "."));

      if (valorTexto !== "" && Number.isNaN(valorFinal)) {
        mostrarMensagem("Valor final inválido.", "erro");
        return;
      }

      if (custoTexto !== "" && Number.isNaN(custoFinal)) {
        mostrarMensagem("Custo estimado inválido.", "erro");
        return;
      }

      const valorFinanceiro = Number(
        valorFinal ??
          processo.valor_estimado_com_desconto ??
          processo.valor_estimado ??
          0
      );

      const lucroEstimado = valorFinanceiro - custoFinal;
      const margemPercentual =
        valorFinanceiro > 0 ? (lucroEstimado / valorFinanceiro) * 100 : 0;

      const payload = {
        valor_final: valorFinal,
        custo_estimado_total: custoFinal,
        lucro_estimado: lucroEstimado,
        margem_percentual: margemPercentual,
        notas_admin: notasAdminEdit[processo.id] || "",
      };

      const { error } = await supabase
        .from("processos")
        .update(payload)
        .eq("id", processo.id);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((p) => (p.id === processo.id ? { ...p, ...payload } : p))
      );

      mostrarMensagem("Dados guardados com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao guardar dados.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  const processosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    return processos.filter((p) => {
      const passaPesquisa =
        !termo ||
        normalizarTexto(p.nome_cliente).includes(termo) ||
        normalizarTexto(p.nome_obra).includes(termo) ||
        normalizarTexto(p.localizacao).includes(termo) ||
        normalizarTexto(p.estado).includes(termo) ||
        normalizarTexto(p.codigo_val).includes(termo);

      const passaEstado = filtroEstado === "Todos" || p.estado === filtroEstado;

      return passaPesquisa && passaEstado;
    });
  }, [processos, pesquisa, filtroEstado]);

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <section style={contentStyle}>
          <h1>Processos</h1>
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
          <a href="/admin/processos" style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}>Processos</a>
          <a href="/admin/clientes" style={menuStyle}>Clientes</a>
          <a href="/admin/precos" style={menuStyle}>Preços</a>
          <a href="/admin/financeiro" style={menuStyle}>Financeiro</a>
          <a href="/admin/calendario" style={menuStyle}>Calendário</a>
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
            <div style={eyebrowStyle}>Gestão Operacional</div>
            <h1 style={{ margin: 0, fontSize: 38 }}>Processos</h1>
            <p style={{ opacity: 0.8 }}>
              Gestão de pedidos, valores, artigos, estado e recalcular orçamentos.
            </p>
          </div>

          <button onClick={carregarTudo} style={botaoPrincipalStyle}>
            Atualizar
          </button>
        </div>

        <div style={filtrosStyle}>
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar cliente, obra, local, estado ou VAL"
            style={inputStyle}
          />

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={inputStyle}
          >
            <option value="Todos">Todos</option>
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>

        {mensagem && (
          <div style={tipoMensagem === "sucesso" ? mensagemSucessoStyle : mensagemErroStyle}>
            {mensagem}
          </div>
        )}

        <div style={resumoGridStyle}>
          <div style={resumoCardStyle}>
            <strong>{processosFiltrados.length}</strong>
            <span>Total</span>
          </div>
          <div style={resumoCardStyle}>
            <strong>{formatarMoeda(processosFiltrados.reduce((a, p) => a + obterValorFinanceiro(p), 0))}</strong>
            <span>Total financeiro</span>
          </div>
          <div style={resumoCardStyle}>
            <strong>{formatarMoeda(processosFiltrados.reduce((a, p) => a + obterLucro(p), 0))}</strong>
            <span>Lucro estimado</span>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Lista de Processos</h2>

          {aCarregar ? (
            <p>A carregar...</p>
          ) : processosFiltrados.length === 0 ? (
            <p>Ainda não existem processos.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {processosFiltrados.map((processo) => {
                const aberto = processoAberto === processo.id;
                const artigosDoProcesso = obterArtigosDoProcesso(processo.id);
                const valor = obterValorFinanceiro(processo);
                const custo = obterCustoEfetivo(processo);
                const lucro = obterLucro(processo);
                const margem = obterMargem(processo);
                const urlProducao = obterUrlProducao(processo);

                return (
                  <div key={processo.id} style={linhaStyle}>
                    <div style={linhaHeaderStyle}>
                      <div>
                        <h3 style={{ margin: 0 }}>{processo.nome_obra || "Sem nome da obra"}</h3>
                        <p style={subtextoStyle}>Cliente: {processo.nome_cliente || "—"}</p>
                        <p style={subtextoStyle}>Localização: {processo.localizacao || "—"}</p>
                        <p style={subtextoStyle}>Criado em: {formatarData(processo.created_at)}</p>
                        <p style={subtextoStyle}>
                          <strong>VAL:</strong>{" "}
                          {processo.codigo_val || "Ainda não criado"}
                          {processo.codigo_val && (
                            <>
                              {" "} | <strong>Lote atual:</strong> {processo.lote_atual || 1}
                              {" "} | <strong>Dropbox:</strong> {processo.estado_dropbox || "orcamento"}
                            </>
                          )}
                        </p>

                        {processo.codigo_val && (
                          <p style={subtextoStyle}>
                            <strong>QR Produção:</strong>{" "}
                            <a href={urlProducao} target="_blank" style={linkInlineStyle}>
                              Abrir folha de tempos
                            </a>
                          </p>
                        )}

                        <span style={badgeStyle}>{processo.estado || "Sem estado"}</span>
                      </div>

                      <div style={acoesStyle}>
                        <button
                          onClick={() => setProcessoAberto(aberto ? null : processo.id)}
                          style={botaoSecundarioStyle}
                        >
                          {aberto ? "Fechar" : "Abrir"}
                        </button>

                        {!processo.codigo_val ? (
                          <button
                            onClick={() => criarValParaProcesso(processo)}
                            style={botaoPrincipalStyle}
                            disabled={processoEmAcao === processo.id}
                          >
                            Criar VAL
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => abrirPastaDropbox(processo.caminho_dropbox)}
                              style={botaoSecundarioStyle}
                            >
                              Abrir Pasta
                            </button>

                            <button
                              onClick={() => criarNovoLote(processo)}
                              style={botaoSecundarioStyle}
                              disabled={processoEmAcao === processo.id}
                            >
                              Novo Lote
                            </button>

                            <button
                              onClick={() => abrirProducao(processo)}
                              style={botaoProducaoStyle}
                              disabled={processoEmAcao === processo.id}
                            >
                              QR Produção
                            </button>

                            <button
                              onClick={() => copiarLinkProducao(processo)}
                              style={botaoSecundarioStyle}
                              disabled={processoEmAcao === processo.id}
                            >
                              Copiar Link QR
                            </button>

                            {processo.estado === "Validado" && (
                              <button
                                onClick={() => gerarQRArtigos(processo)}
                                style={botaoPrincipalStyle}
                                disabled={processoEmAcao === processo.id}
                              >
                                Gerar QR Artigos
                              </button>
                            )}

                            <label style={botaoSecundarioStyle}>
                              Upload Ficheiro
                              <input
                                type="file"
                                style={{ display: "none" }}
                                disabled={processoEmAcao === processo.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  void uploadFicheiroProcesso(processo, file);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>

                            {processo.estado_dropbox !== "encomenda" && (
                              <button
                                onClick={() => aprovarOrcamentoDropbox(processo)}
                                style={botaoAprovarStyle}
                                disabled={processoEmAcao === processo.id}
                              >
                                Aprovar Dropbox
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => recalcularProcesso(processo)}
                          style={botaoSecundarioStyle}
                          disabled={processoEmAcao === processo.id}
                        >
                          Recalcular
                        </button>

                        <button
                          onClick={() => atualizarEstado(processo.id, "Em Análise")}
                          style={botaoSecundarioStyle}
                          disabled={processoEmAcao === processo.id}
                        >
                          Em Análise
                        </button>

                        <button
                          onClick={() => atualizarEstado(processo.id, "Validado")}
                          style={botaoAprovarStyle}
                          disabled={processoEmAcao === processo.id}
                        >
                          Validar
                        </button>

                        <button
                          onClick={() => atualizarEstado(processo.id, "Rejeitado")}
                          style={botaoRejeitarStyle}
                          disabled={processoEmAcao === processo.id}
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>

                    <div style={metricasStyle}>
                      <div style={miniCardStyle}><span>Valor</span><strong>{formatarMoeda(valor)}</strong></div>
                      <div style={miniCardStyle}><span>Custo</span><strong>{formatarMoeda(custo)}</strong></div>
                      <div style={miniCardStyle}><span>Lucro</span><strong>{formatarMoeda(lucro)}</strong></div>
                      <div style={miniCardStyle}><span>Margem</span><strong>{margem.toFixed(2)}%</strong></div>
                    </div>

                    {aberto && (
                      <div style={detalheStyle}>
                        <h3>Detalhe</h3>

                        <p><strong>Observações:</strong> {processo.observacoes || "—"}</p>
                        <p><strong>VAL:</strong> {processo.codigo_val || "Ainda não criado"}</p>
                        <p><strong>Estado Dropbox:</strong> {processo.estado_dropbox || "sem_val"}</p>
                        <p><strong>Lote atual:</strong> {processo.lote_atual || 1}</p>

                        {processo.codigo_val && (
                          <div style={qrInfoBoxStyle}>
                            <strong>Produção / QR Code</strong>
                            <p style={{ marginTop: 8, marginBottom: 10 }}>
                              Link da folha de tempos para este VAL e lote:
                            </p>
                            <a href={urlProducao} target="_blank" style={linkInlineStyle}>
                              {urlProducao}
                            </a>
                            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button type="button" onClick={() => abrirProducao(processo)} style={botaoProducaoStyle}>
                                Abrir QR Produção
                              </button>
                              <button type="button" onClick={() => copiarLinkProducao(processo)} style={botaoSecundarioStyle}>
                                Copiar Link
                              </button>
                              {processo.estado === "Validado" && (
                                <button type="button" onClick={() => gerarQRArtigos(processo)} style={botaoPrincipalStyle}>
                                  Gerar QR Artigos
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <p><strong>Estimativa base:</strong> {formatarMoeda(processo.valor_estimado)}</p>
                        <p><strong>Desconto:</strong> {Number(processo.desconto_percentual || 0).toFixed(2)}%</p>
                        <p><strong>Estimativa com desconto:</strong> {formatarMoeda(processo.valor_estimado_com_desconto)}</p>
                        <p><strong>Entrega prevista:</strong> {formatarData(processo.data_entrega_prevista)}</p>

                        <div style={{ marginTop: 18 }}>
                          <label style={labelStyle}>Valor final</label>
                          <input
                            value={valorFinalEdit[processo.id] || ""}
                            onChange={(e) =>
                              setValorFinalEdit((prev) => ({
                                ...prev,
                                [processo.id]: e.target.value,
                              }))
                            }
                            placeholder="Ex: 1250"
                            style={inputStyle}
                          />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <label style={labelStyle}>Custo estimado total</label>
                          <input
                            value={custoEstimadoEdit[processo.id] || ""}
                            onChange={(e) =>
                              setCustoEstimadoEdit((prev) => ({
                                ...prev,
                                [processo.id]: e.target.value,
                              }))
                            }
                            placeholder={`Sugestão: ${obterCustoSugeridoPorArtigos(processo.id).toFixed(2)}`}
                            style={inputStyle}
                          />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <label style={labelStyle}>Notas admin</label>
                          <textarea
                            value={notasAdminEdit[processo.id] || ""}
                            onChange={(e) =>
                              setNotasAdminEdit((prev) => ({
                                ...prev,
                                [processo.id]: e.target.value,
                              }))
                            }
                            style={textareaStyle}
                          />
                        </div>

                        <button
                          onClick={() => guardarDadosAdmin(processo)}
                          style={{ ...botaoPrincipalStyle, marginTop: 16 }}
                          disabled={processoEmAcao === processo.id}
                        >
                          Guardar Dados Admin
                        </button>

                        <h3 style={{ marginTop: 28 }}>Artigos</h3>

                        {artigosDoProcesso.length === 0 ? (
                          <p>Sem artigos associados.</p>
                        ) : (
                          <div style={{ display: "grid", gap: 12 }}>
                            {artigosDoProcesso.map((artigo) => {
                              const dados = artigo.dados || {};
                              const material = dados.material || dados.acabamento || "";
                              const calculo = calcularArtigo(artigo);
                              const extras = Array.isArray(dados.extras) ? dados.extras : [];

                              return (
                                <div key={artigo.id} style={artigoStyle}>
                                  <h4 style={{ marginTop: 0 }}>{artigo.nome || "Artigo"}</h4>
                                  <p><strong>Tipo:</strong> {artigo.tipo || "—"}</p>
                                  <p><strong>Resumo:</strong> {artigo.resumo || "—"}</p>
                                  <p><strong>Material:</strong> {material || "—"}</p>
                                  <p><strong>Largura original:</strong> {dados.largura ?? "—"}</p>
                                  <p><strong>Altura original:</strong> {dados.altura ?? "—"}</p>
                                  <p><strong>Área corrigida:</strong> {calculo.area.toFixed(2)} m²</p>

                                  <div style={calculoBoxStyle}>
                                    <div style={linhaCalculoStyle}><span>Preço base / m²</span><strong>{formatarMoeda(calculo.precoBase)}</strong></div>
                                    <div style={linhaCalculoStyle}><span>Preço material / m²</span><strong>{formatarMoeda(calculo.precoMaterial)}</strong></div>
                                    <div style={linhaCalculoStyle}><span>Subtotal base</span><strong>{formatarMoeda(calculo.subtotalBase)}</strong></div>
                                    <div style={linhaCalculoStyle}><span>Subtotal extras</span><strong>{formatarMoeda(calculo.subtotalExtras)}</strong></div>
                                    <div style={linhaCalculoDestaqueStyle}><span>Total artigo</span><strong>{formatarMoeda(calculo.subtotalTotal)}</strong></div>
                                  </div>

                                  <div style={{ marginTop: 12 }}>
                                    <strong>Extras:</strong>
                                    {extras.length === 0 ? (
                                      <p style={subtextoStyle}>Sem extras</p>
                                    ) : (
                                      extras.map((extra, index) => (
                                        <p key={index} style={subtextoStyle}>
                                          {extra.nome || "Extra"} — Qtd: {extra.quantidade ?? "—"}
                                        </p>
                                      ))
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

const contentStyle: CSSProperties = {
  flex: 1,
  padding: 40,
  overflowX: "hidden",
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

const filtrosStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr",
  gap: 12,
  marginBottom: 18,
};

const cardStyle: CSSProperties = {
  padding: 24,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const resumoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const resumoCardStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 18,
  borderRadius: 14,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const linhaStyle: CSSProperties = {
  padding: 18,
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: 14,
};

const linhaHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const acoesStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const metricasStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const miniCardStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const detalheStyle: CSSProperties = {
  padding: 18,
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const artigoStyle: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const qrInfoBoxStyle: CSSProperties = {
  marginTop: 14,
  marginBottom: 18,
  padding: 14,
  borderRadius: 12,
  background: "rgba(92,115,199,0.16)",
  border: "1px solid rgba(92,115,199,0.40)",
};

const linkInlineStyle: CSSProperties = {
  color: "#9fc3ff",
  fontWeight: "bold",
  textDecoration: "underline",
  wordBreak: "break-all",
};

const calculoBoxStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 12,
};

const linhaCalculoStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "9px 12px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.04)",
};

const linhaCalculoDestaqueStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "11px 12px",
  borderRadius: 8,
  background: "rgba(92,115,199,0.22)",
  border: "1px solid rgba(92,115,199,0.45)",
};

const subtextoStyle: CSSProperties = {
  opacity: 0.82,
  fontSize: 14,
  marginTop: 4,
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  marginTop: 8,
  padding: "7px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.16)",
  fontWeight: "bold",
  fontSize: 12,
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

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontWeight: "bold",
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

const botaoProducaoStyle: CSSProperties = {
  background: "rgba(92,115,199,0.34)",
  color: "white",
  border: "1px solid rgba(157,195,255,0.45)",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoSecundarioStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoAprovarStyle: CSSProperties = {
  background: "rgba(63, 163, 107, 0.18)",
  color: "white",
  border: "1px solid rgba(63, 163, 107, 0.35)",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoRejeitarStyle: CSSProperties = {
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const mensagemSucessoStyle: CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 12,
  background: "rgba(63, 163, 107, 0.15)",
  border: "1px solid rgba(63, 163, 107, 0.35)",
};

const mensagemErroStyle: CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 12,
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
};
