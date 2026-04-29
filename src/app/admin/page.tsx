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
};

type MetaFaturacao = {
  id: string;
  ano: number;
  mes: number;
  objetivo_mensal: number;
  dias_uteis: number;
  created_at: string | null;
};

type ExtraArtigo = {
  nome?: string;
  quantidade?: string | number;
};

type DadosArtigo = {
  largura?: number;
  altura?: number;
  profundidade?: number;
  material?: string;
  extras?: ExtraArtigo[];
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

type ClienteResumo = {
  id: string;
  estado: string | null;
};

type CalculoArtigo = {
  area: number;
  precoBase: number;
  precoMaterial: number;
  subtotalBase: number;
  subtotalExtras: number;
  subtotalTotal: number;
};

type Ordenacao =
  | "dias_desc"
  | "dias_asc"
  | "valor_desc"
  | "margem_desc"
  | "recentes";

type FiltroEstado =
  | "todos"
  | "Pedido Submetido"
  | "Em Análise"
  | "Orçamento Enviado"
  | "Validado"
  | "Rejeitado";

const FATOR_CUSTO_BASE = 0.55;
const FATOR_CUSTO_EXTRAS = 0.7;

export default function AdminDashboardPage() {
  const router = useRouter();

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const [larguraJanela, setLarguraJanela] = useState(1280);

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [precos, setPrecos] = useState<Preco[]>([]);
  const [metaAtual, setMetaAtual] = useState<MetaFaturacao | null>(null);
  const [clientesPendentes, setClientesPendentes] = useState(0);

  const [processoAberto, setProcessoAberto] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [aCarregar, setACarregar] = useState(true);
  const [aVerificar, setAVerificar] = useState(true);
  const [aAtualizar, setAAtualizar] = useState(false);
  const [processoEmAcao, setProcessoEmAcao] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("dias_desc");

  const [valorFinalEdit, setValorFinalEdit] = useState<Record<string, string>>(
    {}
  );
  const [notasAdminEdit, setNotasAdminEdit] = useState<Record<string, string>>(
    {}
  );
  const [custoEstimadoEdit, setCustoEstimadoEdit] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    function atualizarLargura() {
      setLarguraJanela(window.innerWidth);
    }

    atualizarLargura();
    window.addEventListener("resize", atualizarLargura);
    return () => window.removeEventListener("resize", atualizarLargura);
  }, []);

  const eDesktop = larguraJanela >= 1024;
  const eTablet = larguraJanela >= 768 && larguraJanela < 1024;

  useEffect(() => {
    void validarAdmin();
  }, []);

  function mostrarMensagem(
    texto: string,
    tipo: "sucesso" | "erro" = "sucesso"
  ) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

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
      mostrarMensagem("Erro ao validar acesso admin.", "erro");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarTudo(silencioso = false) {
    try {
      if (silencioso) {
        setAAtualizar(true);
      } else {
        setACarregar(true);
      }

      setMensagem("");

      const [
        processosRes,
        artigosRes,
        precosRes,
        metaRes,
        clientesPendentesRes,
      ] = await Promise.all([
        supabase.from("processos").select("*").order("created_at", {
          ascending: false,
        }),
        supabase.from("artigos").select("*").order("created_at", {
          ascending: true,
        }),
        supabase.from("precos").select("id, nome, valor, categoria, unidade"),
        supabase
          .from("metas_faturacao")
          .select("*")
          .eq("ano", anoAtual)
          .eq("mes", mesAtual)
          .maybeSingle(),
        supabase.from("clientes").select("id, estado").eq("estado", "pendente"),
      ]);

      if (processosRes.error) throw processosRes.error;
      if (artigosRes.error) throw artigosRes.error;
      if (precosRes.error) throw precosRes.error;
      if (metaRes.error) throw metaRes.error;
      if (clientesPendentesRes.error) throw clientesPendentesRes.error;

      const listaProcessos = (processosRes.data || []) as Processo[];
      const listaArtigosBruta = (artigosRes.data || []) as ArtigoDB[];

      const listaArtigos: Artigo[] = listaArtigosBruta.map((artigo) => {
        let dadosConvertidos: DadosArtigo | null = null;

        if (artigo.dados && typeof artigo.dados === "object") {
          dadosConvertidos = artigo.dados as DadosArtigo;
        }

        return {
          id: artigo.id,
          processo_id: artigo.processo_id,
          tipo: artigo.tipo,
          nome: artigo.nome,
          resumo: artigo.resumo,
          dados: dadosConvertidos,
          created_at: artigo.created_at,
        };
      });

      setProcessos(listaProcessos);
      setArtigos(listaArtigos);
      setPrecos((precosRes.data || []) as Preco[]);
      setMetaAtual((metaRes.data || null) as MetaFaturacao | null);
      setClientesPendentes(
        ((clientesPendentesRes.data || []) as ClienteResumo[]).length
      );
      setUltimaAtualizacao(new Date());

      const valoresIniciais: Record<string, string> = {};
      const notasIniciais: Record<string, string> = {};
      const custosIniciais: Record<string, string> = {};

      for (const processo of listaProcessos) {
        valoresIniciais[processo.id] =
          processo.valor_final !== null && processo.valor_final !== undefined
            ? String(processo.valor_final)
            : "";

        notasIniciais[processo.id] = processo.notas_admin || "";

        custosIniciais[processo.id] =
          processo.custo_estimado_total !== null &&
          processo.custo_estimado_total !== undefined
            ? String(processo.custo_estimado_total)
            : "";
      }

      setValorFinalEdit(valoresIniciais);
      setNotasAdminEdit(notasIniciais);
      setCustoEstimadoEdit(custosIniciais);
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao carregar dashboard admin.", "erro");
    } finally {
      setACarregar(false);
      setAAtualizar(false);
    }
  }

  function formatarEuro(valor: number | null | undefined, fallback = "—") {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
      return fallback;
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

  function formatarDataHora(valor: Date | null) {
    if (!valor) return "—";
    return valor.toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function obterArtigosDoProcesso(processoId: string) {
    return artigos.filter((artigo) => artigo.processo_id === processoId);
  }

  function obterPrecoPorNome(nome: string | null | undefined) {
    if (!nome) return 0;
    const encontrado = precos.find((p) => (p.nome || "").trim() === nome.trim());
    return Number(encontrado?.valor || 0);
  }

  function calcularArtigo(artigo: Artigo): CalculoArtigo {
    const dados = artigo.dados || {};
    const largura = Number(dados.largura || 0);
    const altura = Number(dados.altura || 0);
    const area = largura * altura;

    const precoBase = obterPrecoPorNome(artigo.tipo);
    const precoMaterial = obterPrecoPorNome(dados.material);

    const subtotalBase = (precoBase + precoMaterial) * area;

    let subtotalExtras = 0;
    for (const extra of dados.extras || []) {
      const precoExtra = obterPrecoPorNome(extra.nome);
      const quantidade = Number(extra.quantidade || 0);
      subtotalExtras += precoExtra * quantidade;
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
    const artigosDoProcesso = obterArtigosDoProcesso(processoId);

    return artigosDoProcesso.reduce((acc, artigo) => {
      const calculo = calcularArtigo(artigo);
      const custoBase = calculo.subtotalBase * FATOR_CUSTO_BASE;
      const custoExtras = calculo.subtotalExtras * FATOR_CUSTO_EXTRAS;
      return acc + custoBase + custoExtras;
    }, 0);
  }

  function obterCustoEfetivoParaCalculo(processo: Processo) {
    const custoGuardado = Number(processo.custo_estimado_total || 0);

    if (custoGuardado > 0) return custoGuardado;

    return obterCustoSugeridoPorArtigos(processo.id);
  }

  function obterObjetivoDiario() {
    const objetivoMensal = Number(metaAtual?.objetivo_mensal || 0);
    const diasUteis = Number(metaAtual?.dias_uteis || 22);

    if (diasUteis <= 0) return 0;
    return objetivoMensal / diasUteis;
  }

  function obterValorFinanceiroProcesso(processo: Processo) {
    return Number(
      processo.valor_final ??
        processo.valor_estimado_com_desconto ??
        processo.valor_estimado ??
        0
    );
  }

  function obterDiasFinanceiros(processo: Processo) {
    const objetivoDiario = obterObjetivoDiario();
    const valorFinanceiro = obterValorFinanceiroProcesso(processo);

    if (objetivoDiario <= 0) return 0;
    return valorFinanceiro / objetivoDiario;
  }

  function obterCorDiasFinanceiros(diasFinanceiros: number) {
    if (diasFinanceiros >= 5) {
      return {
        background: "rgba(52,168,83,0.18)",
        border: "1px solid rgba(52,168,83,0.45)",
        color: "#9df5b4",
      };
    }

    if (diasFinanceiros >= 2) {
      return {
        background: "rgba(244,180,0,0.16)",
        border: "1px solid rgba(244,180,0,0.40)",
        color: "#ffd76c",
      };
    }

    return {
      background: "rgba(66,133,244,0.16)",
      border: "1px solid rgba(66,133,244,0.40)",
      color: "#9fc3ff",
    };
  }

  function obterPrioridadeFinanceira(diasFinanceiros: number) {
    if (diasFinanceiros >= 5) {
      return {
        texto: "Prioridade Alta",
        background: "rgba(52,168,83,0.18)",
        border: "1px solid rgba(52,168,83,0.45)",
        color: "#9df5b4",
      };
    }

    if (diasFinanceiros >= 2) {
      return {
        texto: "Prioridade Média",
        background: "rgba(244,180,0,0.16)",
        border: "1px solid rgba(244,180,0,0.40)",
        color: "#ffd76c",
      };
    }

    return {
      texto: "Prioridade Baixa",
      background: "rgba(66,133,244,0.16)",
      border: "1px solid rgba(66,133,244,0.40)",
      color: "#9fc3ff",
    };
  }

  function calcularLucroEstimado(processo: Processo) {
    const valorFinanceiro = obterValorFinanceiroProcesso(processo);
    const custo = obterCustoEfetivoParaCalculo(processo);
    return valorFinanceiro - custo;
  }

  function calcularMargemPercentual(processo: Processo) {
    const valorFinanceiro = obterValorFinanceiroProcesso(processo);
    const lucro = calcularLucroEstimado(processo);

    if (!valorFinanceiro || valorFinanceiro <= 0) return 0;
    return (lucro / valorFinanceiro) * 100;
  }

  function obterCorMargem(margem: number) {
    if (margem >= 30) {
      return {
        background: "rgba(52,168,83,0.18)",
        border: "1px solid rgba(52,168,83,0.45)",
        color: "#9df5b4",
        texto: "Margem Boa",
      };
    }

    if (margem >= 15) {
      return {
        background: "rgba(244,180,0,0.16)",
        border: "1px solid rgba(244,180,0,0.40)",
        color: "#ffd76c",
        texto: "Margem Média",
      };
    }

    return {
      background: "rgba(234,67,53,0.16)",
      border: "1px solid rgba(234,67,53,0.45)",
      color: "#ff9d9d",
      texto: "Margem Fraca",
    };
  }

  async function atualizarEstado(processoId: string, novoEstado: string) {
    try {
      setProcessoEmAcao(processoId);
      setMensagem("");

      const { error } = await supabase
        .from("processos")
        .update({ estado: novoEstado })
        .eq("id", processoId);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((processo) =>
          processo.id === processoId
            ? { ...processo, estado: novoEstado }
            : processo
        )
      );

      mostrarMensagem(`Estado atualizado para "${novoEstado}".`, "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao atualizar estado do processo.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  async function guardarDadosAdmin(processoId: string) {
    try {
      setProcessoEmAcao(processoId);
      setMensagem("");

      const processoAtual = processos.find((p) => p.id === processoId);

      const valorTexto = (valorFinalEdit[processoId] || "").trim();
      const valorNumero =
        valorTexto === "" ? null : Number(valorTexto.replace(",", "."));

      const custoTexto = (custoEstimadoEdit[processoId] || "").trim();
      const custoNumero =
        custoTexto === "" ? null : Number(custoTexto.replace(",", "."));

      if (valorTexto !== "" && Number.isNaN(valorNumero)) {
        mostrarMensagem("O valor final introduzido não é válido.", "erro");
        return;
      }

      if (custoTexto !== "" && Number.isNaN(custoNumero)) {
        mostrarMensagem("O custo estimado introduzido não é válido.", "erro");
        return;
      }

      const valorFinanceiro = Number(
        valorNumero ??
          processoAtual?.valor_estimado_com_desconto ??
          processoAtual?.valor_estimado ??
          0
      );

      const custoFinal =
        custoNumero !== null
          ? Number(custoNumero)
          : obterCustoSugeridoPorArtigos(processoId);

      const lucroEstimado = valorFinanceiro - custoFinal;
      const margemPercentual =
        valorFinanceiro > 0 ? (lucroEstimado / valorFinanceiro) * 100 : 0;

      const payload = {
        valor_final: valorNumero,
        notas_admin: notasAdminEdit[processoId] || "",
        custo_estimado_total: custoFinal,
        lucro_estimado: lucroEstimado,
        margem_percentual: margemPercentual,
      };

      const { error } = await supabase
        .from("processos")
        .update(payload)
        .eq("id", processoId);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((processo) =>
          processo.id === processoId
            ? {
                ...processo,
                ...payload,
              }
            : processo
        )
      );

      mostrarMensagem("Dados do admin guardados com sucesso.", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao guardar dados do processo.", "erro");
    } finally {
      setProcessoEmAcao(null);
    }
  }

  const processosFiltradosOrdenados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    let lista = [...processos];

    if (termo) {
      lista = lista.filter((processo) => {
        const nomeObra = (processo.nome_obra || "").toLowerCase();
        const nomeCliente = (processo.nome_cliente || "").toLowerCase();
        const localizacao = (processo.localizacao || "").toLowerCase();
        const estado = (processo.estado || "").toLowerCase();
        const observacoes = (processo.observacoes || "").toLowerCase();

        return (
          nomeObra.includes(termo) ||
          nomeCliente.includes(termo) ||
          localizacao.includes(termo) ||
          estado.includes(termo) ||
          observacoes.includes(termo)
        );
      });
    }

    if (filtroEstado !== "todos") {
      lista = lista.filter((processo) => processo.estado === filtroEstado);
    }

    lista.sort((a, b) => {
      if (ordenacao === "dias_desc") {
        return obterDiasFinanceiros(b) - obterDiasFinanceiros(a);
      }

      if (ordenacao === "dias_asc") {
        return obterDiasFinanceiros(a) - obterDiasFinanceiros(b);
      }

      if (ordenacao === "valor_desc") {
        return obterValorFinanceiroProcesso(b) - obterValorFinanceiroProcesso(a);
      }

      if (ordenacao === "margem_desc") {
        return calcularMargemPercentual(b) - calcularMargemPercentual(a);
      }

      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dataB - dataA;
    });

    return lista;
  }, [processos, ordenacao, filtroEstado, pesquisa, artigos, precos, metaAtual]);

  const processosPrioritarios = useMemo(() => {
    return [...processos]
      .sort((a, b) => obterDiasFinanceiros(b) - obterDiasFinanceiros(a))
      .slice(0, 5);
  }, [processos, artigos, precos, metaAtual]);

  const proximasEntregas = useMemo(() => {
    return [...processos]
      .filter((p) => p.data_entrega_prevista)
      .sort((a, b) => {
        const dataA = a.data_entrega_prevista
          ? new Date(a.data_entrega_prevista).getTime()
          : Infinity;
        const dataB = b.data_entrega_prevista
          ? new Date(b.data_entrega_prevista).getTime()
          : Infinity;
        return dataA - dataB;
      })
      .slice(0, 5);
  }, [processos]);

  const resumo = useMemo(() => {
    const objetivoDiario = obterObjetivoDiario();
    const valorPipeline = processos.reduce(
      (acc, processo) => acc + obterValorFinanceiroProcesso(processo),
      0
    );
    const lucroTotal = processos.reduce(
      (acc, processo) => acc + calcularLucroEstimado(processo),
      0
    );

    return {
      total: processos.length,
      pendentes: processos.filter((p) => p.estado === "Pedido Submetido").length,
      analise: processos.filter((p) => p.estado === "Em Análise").length,
      validados: processos.filter((p) => p.estado === "Validado").length,
      objetivoDiario,
      clientesPendentes,
      valorPipeline,
      lucroTotal,
    };
  }, [processos, metaAtual, clientesPendentes, artigos, precos]);

  if (aVerificar) {
    return (
      <main style={mainStyle(eDesktop)}>
        <section style={contentStyle(eDesktop, eTablet)}>
          <h1 style={{ marginTop: 0 }}>Dashboard Admin</h1>
          <p style={{ opacity: 0.8 }}>A verificar acesso...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={mainStyle(eDesktop)}>
      <aside style={asideStyle(eDesktop)}>
        <div style={logoStyle(eDesktop)}>VALERIE</div>

        <div style={menuContainerStyle(eDesktop)}>
          <a
            href="/admin"
            style={{ ...menuStyle(eDesktop), background: "rgba(255,255,255,0.08)" }}
          >
            Dashboard
          </a>

          <a href="/admin/processos" style={menuStyle(eDesktop)}>
            Processos
          </a>

          <a href="/admin/clientes" style={menuStyle(eDesktop)}>
            Clientes
          </a>

          <a href="/admin/precos" style={menuStyle(eDesktop)}>
            Preços
          </a>

          <a href="/admin/financeiro" style={menuStyle(eDesktop)}>
            Financeiro
          </a>

          <a href="/admin/calendario" style={menuStyle(eDesktop)}>
            Calendário
          </a>

          <a href="/aprovacao-clientes" style={menuStyle(eDesktop)}>
            Aprovação Clientes
          </a>
        </div>

        <div style={{ marginTop: "16px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle(eDesktop, eTablet)}>
        <div style={heroStyle(eDesktop)}>
          <div>
            <div style={eyebrowStyle}>Painel Administrativo</div>
            <h1 style={{ fontSize: eDesktop ? "40px" : "30px", margin: 0 }}>
              Dashboard Admin
            </h1>
            <p style={heroDescricaoStyle}>
              Vista geral da operação, prioridades financeiras, entregas e gestão
              rápida dos processos.
            </p>
            <div style={heroMetaStyle}>
              Última atualização: {formatarDataHora(ultimaAtualizacao)}
            </div>
          </div>

          <div style={heroActionsStyle(eDesktop)}>
            <button
              type="button"
              onClick={() => carregarTudo(true)}
              style={botaoAtualizarStyle}
              disabled={aAtualizar}
            >
              {aAtualizar ? "A atualizar..." : "Atualizar Dashboard"}
            </button>

            <a href="/admin/processos" style={botaoHeroLinkStyle}>
              Abrir Processos
            </a>

            <a href="/aprovacao-clientes" style={botaoHeroSecundarioStyle}>
              Ver Aprovações
            </a>
          </div>
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

        <div style={resumoGridStyle(eDesktop, eTablet)}>
          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>{resumo.total}</div>
            <div>Total de Processos</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>{resumo.pendentes}</div>
            <div>Pedidos Submetidos</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>{resumo.analise}</div>
            <div>Em Análise</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>{resumo.validados}</div>
            <div>Validados</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>
              {resumo.clientesPendentes}
            </div>
            <div>Clientes Pendentes</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>
              {formatarEuro(resumo.objetivoDiario)}
            </div>
            <div>Objetivo Diário</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>
              {formatarEuro(resumo.valorPipeline)}
            </div>
            <div>Valor Pipeline</div>
          </div>

          <div style={resumoCardStyle}>
            <div style={resumoNumeroStyle(eDesktop)}>
              {formatarEuro(resumo.lucroTotal)}
            </div>
            <div>Lucro Potencial</div>
          </div>
        </div>

        <div style={painelTopoGridStyle(eDesktop)}>
          <div style={cardStyle}>
            <div style={topoSecaoStyle}>
              <div>
                <h2 style={{ margin: 0 }}>Top Prioridades</h2>
                <p style={descricaoSecaoStyle}>
                  Processos com maior peso financeiro face ao objetivo diário.
                </p>
              </div>
            </div>

            {processosPrioritarios.length === 0 ? (
              <p style={{ opacity: 0.75 }}>Sem processos para analisar.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {processosPrioritarios.map((processo) => {
                  const diasFinanceiros = obterDiasFinanceiros(processo);
                  const prioridade = obterPrioridadeFinanceira(diasFinanceiros);

                  return (
                    <button
                      key={processo.id}
                      type="button"
                      onClick={() => setProcessoAberto(processo.id)}
                      style={itemResumoBotaoStyle}
                    >
                      <div>
                        <div style={itemResumoTituloStyle}>
                          {processo.nome_obra || "Sem nome de obra"}
                        </div>
                        <div style={itemResumoSubtextoStyle}>
                          {processo.nome_cliente || "—"}
                        </div>
                      </div>

                      <div
                        style={{
                          ...badgeStyle,
                          marginTop: 0,
                          background: prioridade.background,
                          border: prioridade.border,
                          color: prioridade.color,
                        }}
                      >
                        {diasFinanceiros.toFixed(2)} dias
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={topoSecaoStyle}>
              <div>
                <h2 style={{ margin: 0 }}>Próximas Entregas</h2>
                <p style={descricaoSecaoStyle}>
                  Obras mais próximas da data prevista de entrega.
                </p>
              </div>
            </div>

            {proximasEntregas.length === 0 ? (
              <p style={{ opacity: 0.75 }}>Sem entregas previstas.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {proximasEntregas.map((processo) => (
                  <button
                    key={processo.id}
                    type="button"
                    onClick={() => setProcessoAberto(processo.id)}
                    style={itemResumoBotaoStyle}
                  >
                    <div>
                      <div style={itemResumoTituloStyle}>
                        {processo.nome_obra || "Sem nome de obra"}
                      </div>
                      <div style={itemResumoSubtextoStyle}>
                        {processo.nome_cliente || "—"}
                      </div>
                    </div>

                    <div style={itemResumoDataStyle}>
                      {formatarData(processo.data_entrega_prevista)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={topoSecaoStyle}>
            <div>
              <h2 style={{ margin: 0 }}>Processos</h2>
              <p style={descricaoSecaoStyle}>
                Gestão rápida com pesquisa, filtros, prioridade financeira e edição
                interna.
              </p>
            </div>

            <div style={countBadgeStyle}>
              {processosFiltradosOrdenados.length}{" "}
              {processosFiltradosOrdenados.length === 1 ? "resultado" : "resultados"}
            </div>
          </div>

          <div style={filtrosGridStyle(eDesktop)}>
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar por obra, cliente, localização, estado..."
              style={inputStyle}
            />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              style={selectStyle}
            >
              <option value="todos">Todos os estados</option>
              <option value="Pedido Submetido">Pedido Submetido</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Orçamento Enviado">Orçamento Enviado</option>
              <option value="Validado">Validado</option>
              <option value="Rejeitado">Rejeitado</option>
            </select>

            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
              style={selectStyle}
            >
              <option value="dias_desc">Maior prioridade financeira</option>
              <option value="dias_asc">Menor prioridade financeira</option>
              <option value="valor_desc">Maior valor</option>
              <option value="margem_desc">Maior margem</option>
              <option value="recentes">Mais recentes</option>
            </select>
          </div>

          {aCarregar ? (
            <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={skeletonLinhaStyle} />
              ))}
            </div>
          ) : processosFiltradosOrdenados.length === 0 ? (
            <p style={{ opacity: 0.75, marginTop: "18px" }}>
              Nenhum processo encontrado.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
              {processosFiltradosOrdenados.map((processo) => {
                const artigosDoProcesso = obterArtigosDoProcesso(processo.id);
                const aberto = processoAberto === processo.id;
                const valorFinanceiro = obterValorFinanceiroProcesso(processo);
                const diasFinanceiros = obterDiasFinanceiros(processo);
                const prioridade = obterPrioridadeFinanceira(diasFinanceiros);
                const margem = calcularMargemPercentual(processo);
                const estiloMargem = obterCorMargem(margem);
                const custoSugerido = obterCustoSugeridoPorArtigos(processo.id);
                const custoMostrado = obterCustoEfetivoParaCalculo(processo);

                return (
                  <div key={processo.id} style={linhaStyle}>
                    <div style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: eDesktop ? "18px" : "16px",
                          }}
                        >
                          {processo.nome_obra || "Sem nome de obra"}
                        </div>

                        <div style={estadoBadgeBaseStyle}>
                          {processo.estado || "—"}
                        </div>
                      </div>

                      <div style={subtextoStyle}>
                        Cliente: {processo.nome_cliente || "—"}
                      </div>

                      <div style={subtextoStyle}>
                        Localização: {processo.localizacao || "—"}
                      </div>

                      <div style={subtextoStyle}>
                        Artigos: {artigosDoProcesso.length}
                      </div>

                      <div style={subtextoStyle}>
                        Valor financeiro: {formatarEuro(valorFinanceiro)}
                      </div>

                      <div style={subtextoStyle}>
                        Custo estimado: {formatarEuro(custoMostrado)}
                      </div>

                      <div style={subtextoStyle}>
                        Lucro estimado: {formatarEuro(calcularLucroEstimado(processo))}
                      </div>

                      <div
                        style={{
                          ...badgeStyle,
                          ...obterCorDiasFinanceiros(diasFinanceiros),
                        }}
                      >
                        Dias financeiros: {diasFinanceiros.toFixed(2)}
                      </div>

                      <div
                        style={{
                          ...badgeStyle,
                          background: prioridade.background,
                          border: prioridade.border,
                          color: prioridade.color,
                        }}
                      >
                        {prioridade.texto}
                      </div>

                      <div
                        style={{
                          ...badgeStyle,
                          background: estiloMargem.background,
                          border: estiloMargem.border,
                          color: estiloMargem.color,
                        }}
                      >
                        {estiloMargem.texto} · {margem.toFixed(2)}%
                      </div>
                    </div>

                    <div style={acoesWrapStyle(eDesktop)}>
                      <button
                        onClick={() =>
                          setProcessoAberto(aberto ? null : processo.id)
                        }
                        style={botaoSecundarioStyle(eDesktop)}
                      >
                        {aberto ? "Fechar" : "Abrir"}
                      </button>

                      <button
                        onClick={() => atualizarEstado(processo.id, "Validado")}
                        style={botaoAprovarStyle(eDesktop)}
                        disabled={processoEmAcao === processo.id}
                      >
                        {processoEmAcao === processo.id
                          ? "A processar..."
                          : "Validar"}
                      </button>

                      <button
                        onClick={() => atualizarEstado(processo.id, "Em Análise")}
                        style={botaoSecundarioStyle(eDesktop)}
                        disabled={processoEmAcao === processo.id}
                      >
                        Em Análise
                      </button>

                      <button
                        onClick={() => atualizarEstado(processo.id, "Rejeitado")}
                        style={botaoRejeitarStyle(eDesktop)}
                        disabled={processoEmAcao === processo.id}
                      >
                        Rejeitar
                      </button>
                    </div>

                    {aberto && (
                      <div style={detalheStyle}>
                        <h3 style={{ marginTop: 0 }}>Detalhe do Processo</h3>

                        <div style={infoGridStyle(eDesktop)}>
                          <div>
                            <p>
                              <strong>Cliente:</strong> {processo.nome_cliente || "—"}
                            </p>
                            <p>
                              <strong>Obra:</strong> {processo.nome_obra || "—"}
                            </p>
                            <p>
                              <strong>Localização:</strong>{" "}
                              {processo.localizacao || "—"}
                            </p>
                            <p>
                              <strong>Observações:</strong>{" "}
                              {processo.observacoes || "—"}
                            </p>
                            <p>
                              <strong>Estado:</strong> {processo.estado || "—"}
                            </p>
                            <p>
                              <strong>Entrega prevista:</strong>{" "}
                              {formatarData(processo.data_entrega_prevista)}
                            </p>
                          </div>

                          <div>
                            <p>
                              <strong>Valor estimado base:</strong>{" "}
                              {formatarEuro(processo.valor_estimado)}
                            </p>
                            <p>
                              <strong>Desconto:</strong>{" "}
                              {processo.desconto_percentual !== null &&
                              processo.desconto_percentual !== undefined
                                ? `${Number(processo.desconto_percentual).toFixed(2)}%`
                                : "0.00%"}
                            </p>
                            <p>
                              <strong>Valor com desconto:</strong>{" "}
                              {formatarEuro(processo.valor_estimado_com_desconto)}
                            </p>
                            <p>
                              <strong>Valor final:</strong>{" "}
                              {formatarEuro(processo.valor_final)}
                            </p>
                            <p>
                              <strong>Custo sugerido:</strong>{" "}
                              {formatarEuro(custoSugerido)}
                            </p>
                            <p>
                              <strong>Margem:</strong> {margem.toFixed(2)}%
                            </p>
                          </div>
                        </div>

                        <div style={{ marginTop: "20px" }}>
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

                        <div style={{ marginTop: "16px" }}>
                          <label style={labelStyle}>Custo estimado total</label>
                          <input
                            value={
                              custoEstimadoEdit[processo.id] ||
                              (processo.custo_estimado_total === null
                                ? custoSugerido.toFixed(2)
                                : "")
                            }
                            onChange={(e) =>
                              setCustoEstimadoEdit((prev) => ({
                                ...prev,
                                [processo.id]: e.target.value,
                              }))
                            }
                            placeholder="Ex: 8500"
                            style={inputStyle}
                          />
                          <div style={subtextoStyle}>
                            Sugestão automática: {formatarEuro(custoSugerido)}
                          </div>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                          <label style={labelStyle}>Notas do admin</label>
                          <textarea
                            value={notasAdminEdit[processo.id] || ""}
                            onChange={(e) =>
                              setNotasAdminEdit((prev) => ({
                                ...prev,
                                [processo.id]: e.target.value,
                              }))
                            }
                            placeholder="Notas internas sobre este processo"
                            style={textareaStyle}
                          />
                        </div>

                        <div style={guardarWrapStyle(eDesktop)}>
                          <button
                            onClick={() => guardarDadosAdmin(processo.id)}
                            style={botaoGuardarStyle(eDesktop)}
                            disabled={processoEmAcao === processo.id}
                          >
                            {processoEmAcao === processo.id
                              ? "A guardar..."
                              : "Guardar Dados Admin"}
                          </button>
                        </div>

                        <h4 style={{ marginTop: "28px" }}>Artigos</h4>

                        {artigosDoProcesso.length === 0 ? (
                          <p style={{ opacity: 0.75 }}>Sem artigos associados.</p>
                        ) : (
                          <div style={{ display: "grid", gap: "12px" }}>
                            {artigosDoProcesso.map((artigo) => {
                              const dados = artigo.dados || {};
                              const extras = Array.isArray(dados.extras)
                                ? dados.extras
                                : [];
                              const calculo = calcularArtigo(artigo);

                              return (
                                <div key={artigo.id} style={artigoStyle}>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      fontSize: eDesktop ? "17px" : "16px",
                                    }}
                                  >
                                    {artigo.nome || "Artigo"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Tipo:</strong> {artigo.tipo || "—"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Resumo:</strong> {artigo.resumo || "—"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Material:</strong> {dados.material || "—"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Largura:</strong>{" "}
                                    {dados.largura !== undefined
                                      ? `${dados.largura} m`
                                      : "—"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Altura:</strong>{" "}
                                    {dados.altura !== undefined
                                      ? `${dados.altura} m`
                                      : "—"}
                                  </div>

                                  <div style={subtextoStyle}>
                                    <strong>Profundidade:</strong>{" "}
                                    {dados.profundidade !== undefined
                                      ? `${dados.profundidade} m`
                                      : "—"}
                                  </div>

                                  <div style={calculoBoxStyle}>
                                    <div style={extraLinhaStyle}>
                                      <span>Área</span>
                                      <span>{calculo.area.toFixed(2)} m²</span>
                                    </div>
                                    <div style={extraLinhaStyle}>
                                      <span>Preço base / m²</span>
                                      <span>{formatarEuro(calculo.precoBase)}</span>
                                    </div>
                                    <div style={extraLinhaStyle}>
                                      <span>Preço material / m²</span>
                                      <span>{formatarEuro(calculo.precoMaterial)}</span>
                                    </div>
                                    <div style={extraLinhaStyle}>
                                      <span>Subtotal base</span>
                                      <span>{formatarEuro(calculo.subtotalBase)}</span>
                                    </div>
                                    <div style={extraLinhaStyle}>
                                      <span>Subtotal extras</span>
                                      <span>{formatarEuro(calculo.subtotalExtras)}</span>
                                    </div>
                                    <div style={extraLinhaStyleDestaque}>
                                      <span>Total artigo</span>
                                      <span>{formatarEuro(calculo.subtotalTotal)}</span>
                                    </div>
                                  </div>

                                  <div style={{ marginTop: "10px" }}>
                                    <strong>Extras:</strong>
                                    {extras.length === 0 ? (
                                      <div style={subtextoStyle}>Sem extras</div>
                                    ) : (
                                      <div
                                        style={{
                                          display: "grid",
                                          gap: "6px",
                                          marginTop: "8px",
                                        }}
                                      >
                                        {extras.map((extra, index) => (
                                          <div key={index} style={extraLinhaStyle}>
                                            <span>{extra.nome || "Extra"}</span>
                                            <span>Qtd: {extra.quantidade ?? "—"}</span>
                                          </div>
                                        ))}
                                      </div>
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

const mainStyle = (eDesktop: boolean): CSSProperties => ({
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  flexDirection: eDesktop ? "row" : "column",
  overflowX: "hidden",
  fontFamily: "Arial, sans-serif",
});

const asideStyle = (eDesktop: boolean): CSSProperties => ({
  width: eDesktop ? "260px" : "100%",
  minHeight: eDesktop ? "100dvh" : "auto",
  borderRight: eDesktop ? "1px solid rgba(255,255,255,0.08)" : "none",
  borderBottom: eDesktop ? "none" : "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: eDesktop ? "30px 20px" : "18px 16px",
  flexShrink: 0,
});

const contentStyle = (eDesktop: boolean, eTablet: boolean): CSSProperties => ({
  flex: 1,
  padding: eDesktop ? "40px" : eTablet ? "20px" : "16px",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
});

const heroStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "1.2fr auto" : "1fr",
  gap: "18px",
  marginBottom: "20px",
  padding: eDesktop ? "24px" : "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.16)",
});

const heroActionsStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "1fr" : "1fr",
  gap: "10px",
  alignSelf: "center",
  minWidth: eDesktop ? "220px" : "100%",
});

const eyebrowStyle: CSSProperties = {
  fontSize: "12px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: "10px",
};

const heroDescricaoStyle: CSSProperties = {
  opacity: 0.82,
  marginTop: "10px",
  lineHeight: 1.5,
  marginBottom: "12px",
  maxWidth: "760px",
};

const heroMetaStyle: CSSProperties = {
  fontSize: "13px",
  opacity: 0.72,
};

const logoStyle = (eDesktop: boolean): CSSProperties => ({
  fontSize: eDesktop ? "38px" : "28px",
  letterSpacing: eDesktop ? "10px" : "6px",
  marginBottom: eDesktop ? "40px" : "18px",
});

const menuContainerStyle = (eDesktop: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: eDesktop ? "column" : "row",
  gap: "12px",
  overflowX: eDesktop ? "visible" : "auto",
  paddingBottom: eDesktop ? 0 : "4px",
});

const menuStyle = (eDesktop: boolean): CSSProperties => ({
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
  whiteSpace: "nowrap",
  fontSize: eDesktop ? "16px" : "14px",
  flexShrink: 0,
});

const resumoGridStyle = (eDesktop: boolean, eTablet: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop
    ? "repeat(4, minmax(0, 1fr))"
    : eTablet
    ? "repeat(2, minmax(0, 1fr))"
    : "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  width: "100%",
  marginBottom: "16px",
});

const resumoCardStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};

const resumoNumeroStyle = (eDesktop: boolean): CSSProperties => ({
  fontSize: eDesktop ? "28px" : "20px",
  fontWeight: "bold",
  marginBottom: "6px",
  wordBreak: "break-word",
});

const painelTopoGridStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "1fr 1fr" : "1fr",
  gap: "16px",
});

const cardStyle: CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "16px",
  minWidth: 0,
};

const topoSecaoStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const descricaoSecaoStyle: CSSProperties = {
  margin: "6px 0 0 0",
  opacity: 0.75,
  lineHeight: 1.4,
};

const countBadgeStyle: CSSProperties = {
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
};

const filtrosGridStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "1.5fr 1fr 1fr" : "1fr",
  gap: "12px",
  marginBottom: "12px",
});

const selectStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const linhaStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: "16px",
};

const skeletonLinhaStyle: CSSProperties = {
  height: "130px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const detalheStyle: CSSProperties = {
  marginTop: "10px",
  padding: "18px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const infoGridStyle = (eDesktop: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: eDesktop ? "1fr 1fr" : "1fr",
  gap: "16px",
});

const artigoStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const calculoBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  marginTop: "12px",
};

const extraLinhaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 10px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.04)",
};

const extraLinhaStyleDestaque: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "rgba(92,115,199,0.20)",
  border: "1px solid rgba(92,115,199,0.35)",
  fontWeight: "bold",
};

const subtextoStyle: CSSProperties = {
  opacity: 0.85,
  fontSize: "14px",
  marginTop: "4px",
  lineHeight: 1.35,
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

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "120px",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  resize: "vertical",
};

const mensagemSucessoStyle: CSSProperties = {
  width: "100%",
  marginBottom: "16px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(63, 163, 107, 0.15)",
  border: "1px solid rgba(63, 163, 107, 0.35)",
};

const mensagemErroStyle: CSSProperties = {
  width: "100%",
  marginBottom: "16px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
};

const acoesWrapStyle = (eDesktop: boolean): CSSProperties => ({
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  flexDirection: eDesktop ? "row" : "column",
});

const guardarWrapStyle = (eDesktop: boolean): CSSProperties => ({
  marginTop: "18px",
  display: "flex",
  justifyContent: eDesktop ? "flex-end" : "stretch",
});

const botaoAtualizarStyle: CSSProperties = {
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
};

const botaoHeroLinkStyle: CSSProperties = {
  background: "rgba(63,163,107,0.18)",
  color: "white",
  border: "1px solid rgba(63,163,107,0.35)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
};

const botaoHeroSecundarioStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
};

const botaoAprovarStyle = (eDesktop: boolean): CSSProperties => ({
  background: "rgba(63, 163, 107, 0.18)",
  color: "white",
  border: "1px solid rgba(63, 163, 107, 0.35)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
  width: eDesktop ? "auto" : "100%",
});

const botaoRejeitarStyle = (eDesktop: boolean): CSSProperties => ({
  background: "rgba(180,50,50,0.18)",
  color: "white",
  border: "1px solid rgba(180,50,50,0.35)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
  width: eDesktop ? "auto" : "100%",
});

const botaoSecundarioStyle = (eDesktop: boolean): CSSProperties => ({
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
  width: eDesktop ? "auto" : "100%",
});

const botaoGuardarStyle = (eDesktop: boolean): CSSProperties => ({
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "12px 18px",
  fontWeight: "bold",
  cursor: "pointer",
  width: eDesktop ? "auto" : "100%",
});

const badgeStyle: CSSProperties = {
  marginTop: "10px",
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "13px",
  width: "fit-content",
  maxWidth: "100%",
};

const estadoBadgeBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "12px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const itemResumoBotaoStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  textAlign: "left",
};

const itemResumoTituloStyle: CSSProperties = {
  fontWeight: "bold",
  marginBottom: "4px",
};

const itemResumoSubtextoStyle: CSSProperties = {
  fontSize: "13px",
  opacity: 0.76,
};

const itemResumoDataStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: "bold",
  opacity: 0.9,
};