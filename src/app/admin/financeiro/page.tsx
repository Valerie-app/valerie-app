"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type ProcessoFinanceiro = {
  id: string;
  nome_cliente: string | null;
  nome_obra: string | null;
  localizacao: string | null;
  estado: string | null;
  valor_estimado: number | null;
  valor_estimado_com_desconto: number | null;
  valor_final: number | null;
  custo_estimado_total: number | null;
  lucro_estimado: number | null;
  margem_percentual: number | null;
  desconto_percentual: number | null;
  data_entrega_prevista: string | null;
  created_at: string | null;
};

type BloqueioCalendario = {
  id: string;
  data: string;
  motivo: string | null;
};

type MetaFaturacao = {
  id: string;
  ano: number;
  mes: number;
  objetivo_mensal: number;
  dias_uteis: number;
  created_at: string | null;
};

type ClienteDB = {
  id: string;
  tipo_utilizador: string | null;
};

type EstadoFiltro =
  | "Todos"
  | "Pedido Submetido"
  | "Em Análise"
  | "Orçamento Enviado"
  | "Validado"
  | "Rejeitado";

type Ordenacao =
  | "recentes"
  | "valor_desc"
  | "valor_asc"
  | "lucro_desc"
  | "margem_desc"
  | "risco_desc";

type AlertaFinanceiro = {
  tipo: "sucesso" | "aviso" | "perigo";
  titulo: string;
  texto: string;
};

const ESTADOS: EstadoFiltro[] = [
  "Todos",
  "Pedido Submetido",
  "Em Análise",
  "Orçamento Enviado",
  "Validado",
  "Rejeitado",
];

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function AdminFinanceiroPage() {
  const router = useRouter();

  const [processos, setProcessos] = useState<ProcessoFinanceiro[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioCalendario[]>([]);
  const [metaAtual, setMetaAtual] = useState<MetaFaturacao | null>(null);

  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [aGuardarMeta, setAGuardarMeta] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("Todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");

  const [mesAtual, setMesAtual] = useState<Date>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const [metaMensalEdit, setMetaMensalEdit] = useState("");

  useEffect(() => {
    void validarAdmin();
  }, []);

  useEffect(() => {
    if (!aVerificar) {
      void carregarDados();
    }
  }, [mesAtual]);

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
        .single<ClienteDB>();

      if (clienteError || !cliente || cliente.tipo_utilizador !== "admin") {
        router.replace("/login");
        return;
      }

      await carregarDados();
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao validar acesso financeiro.", "erro");
      router.replace("/login");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarDados() {
    try {
      setACarregar(true);
      limparMensagem();

      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth() + 1;

      const [processosRes, bloqueiosRes, metaRes] = await Promise.all([
        supabase
          .from("processos")
          .select(
            "id, nome_cliente, nome_obra, localizacao, estado, valor_estimado, valor_estimado_com_desconto, valor_final, custo_estimado_total, lucro_estimado, margem_percentual, desconto_percentual, data_entrega_prevista, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("bloqueios_calendario")
          .select("id, data, motivo")
          .order("data", { ascending: true }),
        supabase
          .from("metas_faturacao")
          .select("*")
          .eq("ano", ano)
          .eq("mes", mes)
          .maybeSingle(),
      ]);

      if (processosRes.error) throw processosRes.error;
      if (bloqueiosRes.error) throw bloqueiosRes.error;
      if (metaRes.error) throw metaRes.error;

      setProcessos((processosRes.data || []) as ProcessoFinanceiro[]);
      setBloqueios((bloqueiosRes.data || []) as BloqueioCalendario[]);
      setMetaAtual((metaRes.data || null) as MetaFaturacao | null);

      setMetaMensalEdit(
        metaRes.data?.objetivo_mensal !== null &&
          metaRes.data?.objetivo_mensal !== undefined
          ? String(metaRes.data.objetivo_mensal)
          : ""
      );
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao carregar financeiro.", "erro");
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

    const data = new Date(valor.includes("T") ? valor : `${valor}T00:00:00`);

    if (Number.isNaN(data.getTime())) return "—";

    return data.toLocaleDateString("pt-PT");
  }

  function formatarMesAno(data: Date) {
    return data.toLocaleDateString("pt-PT", {
      month: "long",
      year: "numeric",
    });
  }

  function formatarDataISO(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function eFimDeSemana(data: Date) {
    const diaSemana = data.getDay();
    return diaSemana === 0 || diaSemana === 6;
  }

  function existeBloqueio(data: Date) {
    const chave = formatarDataISO(data);
    return bloqueios.some((bloqueio) => bloqueio.data === chave);
  }

  function eDiaUtilReal(data: Date) {
    return !eFimDeSemana(data) && !existeBloqueio(data);
  }

  function contarDiasUteisMes(ano: number, mesIndex: number) {
    let total = 0;
    const data = new Date(ano, mesIndex, 1);

    while (data.getMonth() === mesIndex) {
      if (eDiaUtilReal(data)) total += 1;
      data.setDate(data.getDate() + 1);
    }

    return total;
  }

  function contarDiasUteisAno(ano: number) {
    let total = 0;
    const data = new Date(ano, 0, 1);

    while (data.getFullYear() === ano) {
      if (eDiaUtilReal(data)) total += 1;
      data.setDate(data.getDate() + 1);
    }

    return total;
  }

  function obterValorProcesso(processo: ProcessoFinanceiro) {
    return Number(
      processo.valor_final ??
        processo.valor_estimado_com_desconto ??
        processo.valor_estimado ??
        0
    );
  }

  function obterCustoProcesso(processo: ProcessoFinanceiro) {
    return Number(processo.custo_estimado_total || 0);
  }

  function obterLucroProcesso(processo: ProcessoFinanceiro) {
    const lucroGuardado = Number(processo.lucro_estimado || 0);

    if (lucroGuardado !== 0) return lucroGuardado;

    return obterValorProcesso(processo) - obterCustoProcesso(processo);
  }

  function obterMargemProcesso(processo: ProcessoFinanceiro) {
    const margemGuardada = Number(processo.margem_percentual || 0);

    if (margemGuardada !== 0) return margemGuardada;

    const valor = obterValorProcesso(processo);

    if (valor <= 0) return 0;

    return (obterLucroProcesso(processo) / valor) * 100;
  }

  function obterDataReferencia(processo: ProcessoFinanceiro) {
    return processo.data_entrega_prevista || processo.created_at;
  }

  function processoPertenceAoMes(processo: ProcessoFinanceiro) {
    const dataRef = obterDataReferencia(processo);

    if (!dataRef) return false;

    const data = new Date(dataRef.includes("T") ? dataRef : `${dataRef}T00:00:00`);

    return (
      data.getFullYear() === mesAtual.getFullYear() &&
      data.getMonth() === mesAtual.getMonth()
    );
  }

  function obterCorMargem(margem: number) {
    if (margem >= 35) return "#9df5b4";
    if (margem >= 20) return "#ffd76c";
    return "#ff9d9d";
  }

  function obterRiscoProcesso(processo: ProcessoFinanceiro) {
    const valor = obterValorProcesso(processo);
    const custo = obterCustoProcesso(processo);
    const margem = obterMargemProcesso(processo);

    let risco = 0;

    if (valor <= 0) risco += 40;
    if (custo <= 0) risco += 25;
    if (margem < 20) risco += 25;
    if (processo.estado === "Rejeitado") risco += 10;

    return Math.min(risco, 100);
  }

  function obterCorRisco(risco: number) {
    if (risco >= 60) return "#ff9d9d";
    if (risco >= 30) return "#ffd76c";
    return "#9df5b4";
  }

  function irMesAnterior() {
    setMesAtual(
      (anterior) =>
        new Date(anterior.getFullYear(), anterior.getMonth() - 1, 1)
    );
  }

  function irMesSeguinte() {
    setMesAtual(
      (anterior) =>
        new Date(anterior.getFullYear(), anterior.getMonth() + 1, 1)
    );
  }

  function irHoje() {
    const hoje = new Date();
    setMesAtual(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  }

  function limparFiltros() {
    setPesquisa("");
    setFiltroEstado("Todos");
    setOrdenacao("recentes");
  }

  async function guardarMetaMensal() {
    try {
      setAGuardarMeta(true);
      limparMensagem();

      const valorTexto = metaMensalEdit.trim().replace(",", ".");
      const valorNumero = Number(valorTexto);

      if (!valorTexto || Number.isNaN(valorNumero) || valorNumero <= 0) {
        mostrarMensagem("Introduz uma meta mensal válida.", "erro");
        return;
      }

      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth() + 1;
      const diasUteisReaisMes = contarDiasUteisMes(ano, mesAtual.getMonth());

      const { error } = await supabase.from("metas_faturacao").upsert(
        {
          ano,
          mes,
          objetivo_mensal: valorNumero,
          dias_uteis: diasUteisReaisMes,
        },
        { onConflict: "ano,mes" }
      );

      if (error) throw error;

      mostrarMensagem("Meta mensal guardada com sucesso.", "sucesso");
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      mostrarMensagem(error?.message || "Erro ao guardar meta mensal.", "erro");
    } finally {
      setAGuardarMeta(false);
    }
  }

  const processosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    let lista = processos.filter((processo) => {
      const passaPesquisa =
        !termo ||
        normalizarTexto(processo.nome_cliente).includes(termo) ||
        normalizarTexto(processo.nome_obra).includes(termo) ||
        normalizarTexto(processo.localizacao).includes(termo) ||
        normalizarTexto(processo.estado).includes(termo);

      const passaEstado =
        filtroEstado === "Todos" || processo.estado === filtroEstado;

      return passaPesquisa && passaEstado;
    });

    lista = [...lista].sort((a, b) => {
      if (ordenacao === "valor_desc") return obterValorProcesso(b) - obterValorProcesso(a);
      if (ordenacao === "valor_asc") return obterValorProcesso(a) - obterValorProcesso(b);
      if (ordenacao === "lucro_desc") return obterLucroProcesso(b) - obterLucroProcesso(a);
      if (ordenacao === "margem_desc") return obterMargemProcesso(b) - obterMargemProcesso(a);
      if (ordenacao === "risco_desc") return obterRiscoProcesso(b) - obterRiscoProcesso(a);

      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;

      return dataB - dataA;
    });

    return lista;
  }, [processos, pesquisa, filtroEstado, ordenacao]);

  const processosDoMes = useMemo(() => {
    return processosFiltrados.filter((processo) => processoPertenceAoMes(processo));
  }, [processosFiltrados, mesAtual]);

  const resumo = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mesIndex = mesAtual.getMonth();

    const objetivoMensal = Number(metaAtual?.objetivo_mensal || 0);
    const objetivoAnual = objetivoMensal * 12;

    const diasUteisReaisMes = contarDiasUteisMes(ano, mesIndex);
    const diasUteisReaisAno = contarDiasUteisAno(ano);

    const objetivoDiario =
      diasUteisReaisAno > 0 ? objetivoAnual / diasUteisReaisAno : 0;

    const objetivoMensalReal = objetivoDiario * diasUteisReaisMes;

    const faturacaoPrevistaMes = processosDoMes.reduce(
      (acc, processo) => acc + obterValorProcesso(processo),
      0
    );

    const custoPrevistoMes = processosDoMes.reduce(
      (acc, processo) => acc + obterCustoProcesso(processo),
      0
    );

    const lucroPrevistoMes = processosDoMes.reduce(
      (acc, processo) => acc + obterLucroProcesso(processo),
      0
    );

    const margemMedia =
      faturacaoPrevistaMes > 0 ? (lucroPrevistoMes / faturacaoPrevistaMes) * 100 : 0;

    const diasVendidos =
      objetivoDiario > 0 ? faturacaoPrevistaMes / objetivoDiario : 0;

    const diasEmFalta = Math.max(diasUteisReaisMes - diasVendidos, 0);

    const percentagemMeta =
      objetivoMensalReal > 0 ? (faturacaoPrevistaMes / objetivoMensalReal) * 100 : 0;

    const ticketMedio =
      processosDoMes.length > 0 ? faturacaoPrevistaMes / processosDoMes.length : 0;

    const custoPercentagem =
      faturacaoPrevistaMes > 0 ? (custoPrevistoMes / faturacaoPrevistaMes) * 100 : 0;

    return {
      objetivoMensal,
      objetivoAnual,
      objetivoDiario,
      objetivoMensalReal,
      diasUteisReaisMes,
      diasUteisReaisAno,
      faturacaoPrevistaMes,
      custoPrevistoMes,
      lucroPrevistoMes,
      margemMedia,
      diasVendidos,
      diasEmFalta,
      percentagemMeta,
      ticketMedio,
      custoPercentagem,
    };
  }, [processosDoMes, metaAtual, mesAtual, bloqueios]);

  const graficoMensal = useMemo(() => {
    const ano = mesAtual.getFullYear();

    return MESES_CURTOS.map((nome, mesIndex) => {
      const processosMes = processosFiltrados.filter((processo) => {
        const dataRef = obterDataReferencia(processo);
        if (!dataRef) return false;

        const data = new Date(dataRef.includes("T") ? dataRef : `${dataRef}T00:00:00`);

        return data.getFullYear() === ano && data.getMonth() === mesIndex;
      });

      const faturacao = processosMes.reduce(
        (acc, processo) => acc + obterValorProcesso(processo),
        0
      );

      const lucro = processosMes.reduce(
        (acc, processo) => acc + obterLucroProcesso(processo),
        0
      );

      return {
        nome,
        faturacao,
        lucro,
      };
    });
  }, [processosFiltrados, mesAtual]);

  const graficoEstados = useMemo(() => {
    const estados = ESTADOS.filter((estado) => estado !== "Todos");

    return estados.map((estado) => {
      const lista = processosDoMes.filter((processo) => processo.estado === estado);
      const valor = lista.reduce((acc, processo) => acc + obterValorProcesso(processo), 0);

      return {
        estado,
        quantidade: lista.length,
        valor,
      };
    });
  }, [processosDoMes]);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, { nome: string; valor: number; lucro: number; quantidade: number }>();

    for (const processo of processosDoMes) {
      const nome = processo.nome_cliente || "Cliente por definir";
      const atual = mapa.get(nome) || { nome, valor: 0, lucro: 0, quantidade: 0 };

      atual.valor += obterValorProcesso(processo);
      atual.lucro += obterLucroProcesso(processo);
      atual.quantidade += 1;

      mapa.set(nome, atual);
    }

    return [...mapa.values()]
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [processosDoMes]);

  const alertas = useMemo<AlertaFinanceiro[]>(() => {
    const lista: AlertaFinanceiro[] = [];

    if (resumo.objetivoMensalReal > 0 && resumo.percentagemMeta < 70) {
      lista.push({
        tipo: "perigo",
        titulo: "Meta em risco",
        texto: `Só tens ${resumo.percentagemMeta.toFixed(1)}% da meta real do mês.`,
      });
    }

    if (resumo.margemMedia > 0 && resumo.margemMedia < 25) {
      lista.push({
        tipo: "aviso",
        titulo: "Margem baixa",
        texto: `Margem média atual de ${resumo.margemMedia.toFixed(1)}%.`,
      });
    }

    if (resumo.diasEmFalta > 0 && resumo.diasEmFalta < 3) {
      lista.push({
        tipo: "aviso",
        titulo: "Capacidade apertada",
        texto: `Faltam ${resumo.diasEmFalta.toFixed(2)} dias financeiros para fechar a meta.`,
      });
    }

    const semCusto = processosDoMes.filter((processo) => obterCustoProcesso(processo) <= 0);

    if (semCusto.length > 0) {
      lista.push({
        tipo: "aviso",
        titulo: "Custos por preencher",
        texto: `${semCusto.length} processo(s) sem custo estimado.`,
      });
    }

    if (lista.length === 0) {
      lista.push({
        tipo: "sucesso",
        titulo: "Financeiro saudável",
        texto: "Sem alertas críticos neste mês.",
      });
    }

    return lista;
  }, [resumo, processosDoMes]);

  const maxGraficoMensal = Math.max(
    ...graficoMensal.map((item) => Math.max(item.faturacao, item.lucro)),
    1
  );

  const maxGraficoEstados = Math.max(
    ...graficoEstados.map((item) => item.valor),
    1
  );

  const maxTopClientes = Math.max(
    ...topClientes.map((item) => item.valor),
    1
  );

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <section style={contentStyle}>
          <h1>Financeiro</h1>
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
          <a href="/admin" style={menuStyle}>
            Dashboard
          </a>
          <a href="/admin/processos" style={menuStyle}>
            Processos
          </a>
          <a href="/admin/clientes" style={menuStyle}>
            Clientes
          </a>
          <a href="/admin/precos" style={menuStyle}>
            Preços
          </a>
          <a
            href="/admin/financeiro"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Financeiro
          </a>
          <a href="/admin/calendario" style={menuStyle}>
            Calendário
          </a>
          <a href="/aprovacao-clientes" style={menuStyle}>
            Aprovação Clientes
          </a>
        </div>

        <div style={{ marginTop: 16 }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle}>
        <div style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>Painel Financeiro</div>
            <h1 style={titleStyle}>Financeiro</h1>
            <p style={subtitleStyle}>
              Faturação, custos, lucro, margem, metas reais, alertas e gráficos para decisões rápidas.
            </p>
          </div>

          <div style={topActionsStyle}>
            <button type="button" onClick={irHoje} style={botaoSecundarioStyle}>
              Hoje
            </button>
            <button type="button" onClick={irMesAnterior} style={botaoSecundarioStyle}>
              ←
            </button>
            <button type="button" onClick={irMesSeguinte} style={botaoSecundarioStyle}>
              →
            </button>
            <button type="button" onClick={carregarDados} style={botaoPrincipalStyle}>
              Atualizar
            </button>
          </div>
        </div>

        <div style={mesAtualStyle}>{formatarMesAno(mesAtual)}</div>

        {mensagem && (
          <div style={tipoMensagem === "sucesso" ? mensagemSucessoStyle : mensagemErroStyle}>
            {mensagem}
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Meta e capacidade</h2>

          <div style={metaGridStyle}>
            <div>
              <label style={labelStyle}>Meta mensal desejada</label>
              <input
                value={metaMensalEdit}
                onChange={(e) => setMetaMensalEdit(e.target.value)}
                placeholder="Ex: 120000"
                style={inputStyle}
              />
            </div>

            <div style={miniCardStyle}>
              <span>Meta anual automática</span>
              <strong>{formatarMoeda((Number(metaMensalEdit.replace(",", ".")) || 0) * 12)}</strong>
            </div>

            <div style={miniCardStyle}>
              <span>Dias úteis reais do mês</span>
              <strong>{resumo.diasUteisReaisMes}</strong>
            </div>

            <button
              type="button"
              onClick={guardarMetaMensal}
              style={botaoPrincipalStyle}
              disabled={aGuardarMeta}
            >
              {aGuardarMeta ? "A guardar..." : "Guardar Meta"}
            </button>
          </div>

          <p style={notaStyle}>
            A meta diária é calculada pela meta anual dividida pelos dias úteis reais do ano.
            Sábados, domingos e bloqueios do calendário não contam.
          </p>
        </div>

        {aCarregar ? (
          <div style={cardStyle}>
            <p>A carregar financeiro...</p>
          </div>
        ) : (
          <>
            <div style={resumoGridStyle}>
              <Kpi titulo="Faturação prevista" valor={formatarMoeda(resumo.faturacaoPrevistaMes)} />
              <Kpi titulo="Meta real do mês" valor={formatarMoeda(resumo.objetivoMensalReal)} />
              <Kpi titulo="Meta atingida" valor={`${resumo.percentagemMeta.toFixed(1)}%`} />
              <Kpi titulo="Custo previsto" valor={formatarMoeda(resumo.custoPrevistoMes)} />
              <Kpi titulo="Lucro previsto" valor={formatarMoeda(resumo.lucroPrevistoMes)} />
              <Kpi
                titulo="Margem média"
                valor={`${resumo.margemMedia.toFixed(2)}%`}
                color={obterCorMargem(resumo.margemMedia)}
              />
              <Kpi titulo="Ticket médio" valor={formatarMoeda(resumo.ticketMedio)} />
              <Kpi titulo="Custo / faturação" valor={`${resumo.custoPercentagem.toFixed(1)}%`} />
              <Kpi titulo="Dias vendidos" valor={resumo.diasVendidos.toFixed(2)} />
              <Kpi titulo="Dias em falta" valor={resumo.diasEmFalta.toFixed(2)} />
              <Kpi titulo="Objetivo diário" valor={formatarMoeda(resumo.objetivoDiario)} />
              <Kpi titulo="Processos do mês" valor={String(processosDoMes.length)} />
            </div>

            <div style={progressCardStyle}>
              <div style={progressHeaderStyle}>
                <strong>Progresso da meta real do mês</strong>
                <span>{resumo.percentagemMeta.toFixed(1)}%</span>
              </div>

              <div style={progressOuterStyle}>
                <div
                  style={{
                    ...progressInnerStyle,
                    width: `${Math.min(resumo.percentagemMeta, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div style={alertasGridStyle}>
              {alertas.map((alerta, index) => (
                <div
                  key={`${alerta.titulo}-${index}`}
                  style={{
                    ...alertaCardStyle,
                    border:
                      alerta.tipo === "sucesso"
                        ? "1px solid rgba(63, 163, 107, 0.35)"
                        : alerta.tipo === "aviso"
                        ? "1px solid rgba(244, 180, 0, 0.40)"
                        : "1px solid rgba(180,50,50,0.40)",
                    background:
                      alerta.tipo === "sucesso"
                        ? "rgba(63, 163, 107, 0.12)"
                        : alerta.tipo === "aviso"
                        ? "rgba(244, 180, 0, 0.12)"
                        : "rgba(180,50,50,0.16)",
                  }}
                >
                  <strong>{alerta.titulo}</strong>
                  <span>{alerta.texto}</span>
                </div>
              ))}
            </div>

            <div style={graficosGridStyle}>
              <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Faturação e lucro por mês</h2>

                <div style={barChartStyle}>
                  {graficoMensal.map((item) => (
                    <div key={item.nome} style={barColumnStyle}>
                      <div style={barAreaStyle}>
                        <div
                          title={`Faturação: ${formatarMoeda(item.faturacao)}`}
                          style={{
                            ...barPrimaryStyle,
                            height: `${Math.max((item.faturacao / maxGraficoMensal) * 100, item.faturacao > 0 ? 4 : 0)}%`,
                          }}
                        />
                        <div
                          title={`Lucro: ${formatarMoeda(item.lucro)}`}
                          style={{
                            ...barSecondaryStyle,
                            height: `${Math.max((item.lucro / maxGraficoMensal) * 100, item.lucro > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                      <div style={barLabelStyle}>{item.nome}</div>
                    </div>
                  ))}
                </div>

                <div style={legendInlineStyle}>
                  <span><i style={{ ...dotStyle, background: "#7f96ff" }} /> Faturação</span>
                  <span><i style={{ ...dotStyle, background: "#9df5b4" }} /> Lucro</span>
                </div>
              </div>

              <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Valor por estado</h2>

                <div style={{ display: "grid", gap: 12 }}>
                  {graficoEstados.map((item) => (
                    <div key={item.estado}>
                      <div style={smallBarHeaderStyle}>
                        <strong>{item.estado}</strong>
                        <span>{formatarMoeda(item.valor)} · {item.quantidade}</span>
                      </div>
                      <div style={smallBarOuterStyle}>
                        <div
                          style={{
                            ...smallBarInnerStyle,
                            width: `${Math.min((item.valor / maxGraficoEstados) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Top clientes do mês</h2>

                {topClientes.length === 0 ? (
                  <p style={{ opacity: 0.75 }}>Sem clientes neste mês.</p>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {topClientes.map((cliente) => (
                      <div key={cliente.nome}>
                        <div style={smallBarHeaderStyle}>
                          <strong>{cliente.nome}</strong>
                          <span>{formatarMoeda(cliente.valor)}</span>
                        </div>
                        <div style={smallBarOuterStyle}>
                          <div
                            style={{
                              ...smallBarInnerStyle,
                              width: `${Math.min((cliente.valor / maxTopClientes) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div style={subtextoStyle}>
                          {cliente.quantidade} processo(s) · Lucro: {formatarMoeda(cliente.lucro)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Saúde financeira</h2>

                <div style={healthGridStyle}>
                  <HealthItem titulo="Margem" valor={`${resumo.margemMedia.toFixed(1)}%`} cor={obterCorMargem(resumo.margemMedia)} />
                  <HealthItem titulo="Meta" valor={`${resumo.percentagemMeta.toFixed(1)}%`} cor={resumo.percentagemMeta >= 100 ? "#9df5b4" : resumo.percentagemMeta >= 75 ? "#ffd76c" : "#ff9d9d"} />
                  <HealthItem titulo="Custo" valor={`${resumo.custoPercentagem.toFixed(1)}%`} cor={resumo.custoPercentagem <= 65 ? "#9df5b4" : resumo.custoPercentagem <= 80 ? "#ffd76c" : "#ff9d9d"} />
                  <HealthItem titulo="Dias" valor={resumo.diasEmFalta.toFixed(1)} cor={resumo.diasEmFalta <= 0 ? "#9df5b4" : "#ffd76c"} />
                </div>
              </div>
            </div>

            <div style={filtrosStyle}>
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar cliente, obra, localização ou estado"
                style={inputStyle}
              />

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoFiltro)}
                style={inputStyle}
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>

              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                style={inputStyle}
              >
                <option value="recentes">Mais recentes</option>
                <option value="valor_desc">Maior valor</option>
                <option value="valor_asc">Menor valor</option>
                <option value="lucro_desc">Maior lucro</option>
                <option value="margem_desc">Maior margem</option>
                <option value="risco_desc">Maior risco</option>
              </select>

              <button type="button" onClick={limparFiltros} style={botaoSecundarioStyle}>
                Limpar
              </button>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Processos financeiros do mês</h2>

              {processosDoMes.length === 0 ? (
                <p style={{ opacity: 0.75 }}>Não há processos financeiros para este mês.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {processosDoMes.map((processo) => {
                    const valor = obterValorProcesso(processo);
                    const custo = obterCustoProcesso(processo);
                    const lucro = obterLucroProcesso(processo);
                    const margem = obterMargemProcesso(processo);
                    const risco = obterRiscoProcesso(processo);
                    const diasEquivalentes =
                      resumo.objetivoDiario > 0 ? valor / resumo.objetivoDiario : 0;

                    return (
                      <div key={processo.id} style={linhaStyle}>
                        <div style={linhaHeaderStyle}>
                          <div>
                            <h3 style={{ margin: 0 }}>
                              {processo.nome_obra || "Sem nome da obra"}
                            </h3>
                            <p style={subtextoStyle}>
                              Cliente: {processo.nome_cliente || "—"}
                            </p>
                            <p style={subtextoStyle}>
                              Localização: {processo.localizacao || "—"}
                            </p>
                            <p style={subtextoStyle}>
                              Estado: {processo.estado || "—"} | Entrega:{" "}
                              {formatarData(processo.data_entrega_prevista)}
                            </p>
                          </div>

                          <div style={badgeStyle}>{processo.estado || "Sem estado"}</div>
                        </div>

                        <div style={metricsGridStyle}>
                          <div style={miniCardStyle}>
                            <span>Valor</span>
                            <strong>{formatarMoeda(valor)}</strong>
                          </div>

                          <div style={miniCardStyle}>
                            <span>Custo</span>
                            <strong>{formatarMoeda(custo)}</strong>
                          </div>

                          <div style={miniCardStyle}>
                            <span>Lucro</span>
                            <strong>{formatarMoeda(lucro)}</strong>
                          </div>

                          <div style={miniCardStyle}>
                            <span>Margem</span>
                            <strong style={{ color: obterCorMargem(margem) }}>
                              {margem.toFixed(2)}%
                            </strong>
                          </div>

                          <div style={miniCardStyle}>
                            <span>Dias financeiros</span>
                            <strong>{diasEquivalentes.toFixed(2)}</strong>
                          </div>

                          <div style={miniCardStyle}>
                            <span>Risco</span>
                            <strong style={{ color: obterCorRisco(risco) }}>
                              {risco}%
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Kpi({
  titulo,
  valor,
  color,
}: {
  titulo: string;
  valor: string;
  color?: string;
}) {
  return (
    <div style={resumoCardStyle}>
      <span>{titulo}</span>
      <strong style={{ color }}>{valor}</strong>
    </div>
  );
}

function HealthItem({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <div style={healthItemStyle}>
      <div style={{ ...healthCircleStyle, borderColor: cor, color: cor }}>
        {valor}
      </div>
      <strong>{titulo}</strong>
    </div>
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
  marginBottom: 16,
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
  fontSize: 42,
};

const subtitleStyle: CSSProperties = {
  opacity: 0.82,
  marginTop: 10,
  lineHeight: 1.45,
  maxWidth: 820,
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const mesAtualStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: "bold",
  textTransform: "capitalize",
  marginBottom: 16,
};

const cardStyle: CSSProperties = {
  padding: 24,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 18,
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr auto",
  gap: 12,
  alignItems: "end",
};

const resumoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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

const progressCardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 18,
};

const progressHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const progressOuterStyle: CSSProperties = {
  height: 14,
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressInnerStyle: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #5c73c7 0%, #9df5b4 100%)",
};

const alertasGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const alertaCardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  display: "grid",
  gap: 8,
};

const graficosGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr",
  gap: 18,
  marginBottom: 18,
};

const filtrosStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr 1fr auto",
  gap: 12,
  marginBottom: 18,
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
};

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
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

const subtextoStyle: CSSProperties = {
  opacity: 0.82,
  fontSize: 14,
  marginTop: 4,
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "7px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.16)",
  fontWeight: "bold",
  fontSize: 12,
  height: "fit-content",
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

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontWeight: "bold",
};

const notaStyle: CSSProperties = {
  marginBottom: 0,
  marginTop: 14,
  opacity: 0.75,
  fontSize: 13,
  lineHeight: 1.45,
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

const barChartStyle: CSSProperties = {
  height: 260,
  display: "grid",
  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
  gap: 10,
  alignItems: "end",
};

const barColumnStyle: CSSProperties = {
  height: "100%",
  display: "grid",
  gridTemplateRows: "1fr auto",
  gap: 8,
  minWidth: 0,
};

const barAreaStyle: CSSProperties = {
  height: "100%",
  display: "flex",
  alignItems: "end",
  justifyContent: "center",
  gap: 4,
  borderRadius: 12,
  background: "rgba(255,255,255,0.035)",
  padding: "8px 4px",
};

const barPrimaryStyle: CSSProperties = {
  width: "40%",
  borderRadius: "8px 8px 3px 3px",
  background: "linear-gradient(180deg, #7f96ff 0%, #4057a8 100%)",
  minHeight: 0,
};

const barSecondaryStyle: CSSProperties = {
  width: "40%",
  borderRadius: "8px 8px 3px 3px",
  background: "linear-gradient(180deg, #9df5b4 0%, #34a853 100%)",
  minHeight: 0,
};

const barLabelStyle: CSSProperties = {
  textAlign: "center",
  fontSize: 12,
  opacity: 0.8,
};

const legendInlineStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  marginTop: 14,
  fontSize: 13,
  opacity: 0.85,
};

const dotStyle: CSSProperties = {
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: 999,
  marginRight: 6,
};

const smallBarHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 6,
  fontSize: 14,
};

const smallBarOuterStyle: CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const smallBarInnerStyle: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #5c73c7 0%, #9df5b4 100%)",
};

const healthGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const healthItemStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  gap: 10,
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const healthCircleStyle: CSSProperties = {
  width: 92,
  height: 92,
  borderRadius: 999,
  border: "8px solid",
  display: "grid",
  placeItems: "center",
  fontWeight: "bold",
  fontSize: 16,
};
