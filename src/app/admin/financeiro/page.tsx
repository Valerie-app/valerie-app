"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

type ProcessoCalendario = {
  id: string;
  nome_cliente: string | null;
  nome_obra: string | null;
  estado: string | null;
  dias_fabrico_previstos: number | null;
  dias_acabamento_previstos: number | null;
  dias_montagem_previstos: number | null;
  dias_totais_previstos: number | null;
  data_entrega_prevista: string | null;
  valor_estimado: number | null;
  valor_estimado_com_desconto: number | null;
  valor_final: number | null;
  created_at: string | null;
};

type BloqueioCalendario = {
  id: string;
  data: string;
  motivo: string | null;
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

type DiaMes = {
  data: Date;
  chave: string;
  dia: number;
  pertenceAoMesAtual: boolean;
};

const NOMES_DIAS_MOBILE = ["S", "T", "Q", "Q", "S", "S", "D"];
const NOMES_DIAS_DESKTOP = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const ESTADOS_DISPONIVEIS = [
  "Todos",
  "Pedido Submetido",
  "Em Análise",
  "Orçamento Enviado",
  "Validado",
  "Rejeitado",
] as const;

export default function AdminCalendarioPage() {
  const router = useRouter();

  const [processos, setProcessos] = useState<ProcessoCalendario[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioCalendario[]>([]);
  const [metaAtual, setMetaAtual] = useState<MetaFaturacao | null>(null);

  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [mensagem, setMensagem] = useState("");

  const [larguraJanela, setLarguraJanela] = useState<number>(1400);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] =
    useState<(typeof ESTADOS_DISPONIVEIS)[number]>("Todos");

  const [mesAtual, setMesAtual] = useState<Date>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [aGuardarBloqueio, setAGuardarBloqueio] = useState(false);
  const [aRemoverBloqueio, setARemoverBloqueio] = useState(false);

  const [metaMensalEdit, setMetaMensalEdit] = useState("");
  const [aGuardarMeta, setAGuardarMeta] = useState(false);

  useEffect(() => {
    function atualizarLargura() {
      setLarguraJanela(window.innerWidth);
    }

    atualizarLargura();
    window.addEventListener("resize", atualizarLargura);

    return () => {
      window.removeEventListener("resize", atualizarLargura);
    };
  }, []);

  const eDesktop = larguraJanela >= 1024;
  const eTablet = larguraJanela >= 768 && larguraJanela < 1024;
  const nomesDias = eDesktop ? NOMES_DIAS_DESKTOP : NOMES_DIAS_MOBILE;

  useEffect(() => {
    async function iniciar() {
      await validarAdmin();
    }

    iniciar();
  }, []);

  useEffect(() => {
    if (!aVerificar) {
      carregarDados();
    }
  }, [mesAtual]);

  async function validarAdmin() {
    try {
      const { data: sessaoData, error: sessaoError } =
        await supabase.auth.getSession();

      if (sessaoError) {
        throw sessaoError;
      }

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

      await carregarDados();
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao validar acesso ao calendário.");
      router.replace("/login");
    } finally {
      setAVerificar(false);
    }
  }

  async function carregarDados() {
    try {
      setACarregar(true);
      setMensagem("");

      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth() + 1;

      const [processosRes, bloqueiosRes, metaRes] = await Promise.all([
        supabase
          .from("processos")
          .select(
            "id, nome_cliente, nome_obra, estado, dias_fabrico_previstos, dias_acabamento_previstos, dias_montagem_previstos, dias_totais_previstos, data_entrega_prevista, valor_estimado, valor_estimado_com_desconto, valor_final, created_at"
          )
          .order("data_entrega_prevista", { ascending: true }),
        supabase
          .from("bloqueios_calendario")
          .select("id, data, motivo, created_at")
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

      setProcessos((processosRes.data || []) as ProcessoCalendario[]);
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
      setMensagem("Erro ao carregar calendário.");
    } finally {
      setACarregar(false);
    }
  }

  function formatarDataISO(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function formatarData(valor: string | null) {
    if (!valor) return "—";
    return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-PT");
  }

  function formatarDataHora(valor: string | null) {
    if (!valor) return "—";
    return new Date(valor).toLocaleDateString("pt-PT");
  }

  function formatarMesAno(data: Date) {
    return data.toLocaleDateString("pt-PT", {
      month: "long",
      year: "numeric",
    });
  }

  function normalizarTexto(valor: string | null | undefined) {
    return (valor || "").trim().toLowerCase();
  }

  function eDiaUtil(data: Date) {
    const diaSemana = data.getDay();
    return diaSemana !== 0 && diaSemana !== 6;
  }

  function obterBloqueioDoDia(data: Date) {
    const chave = formatarDataISO(data);
    return bloqueios.find((bloqueio) => bloqueio.data === chave) || null;
  }

  function eDiaUtilReal(data: Date) {
    return eDiaUtil(data) && !obterBloqueioDoDia(data);
  }

  function contarDiasUteisAno(ano: number) {
    let total = 0;
    const data = new Date(ano, 0, 1);

    while (data.getFullYear() === ano) {
      if (eDiaUtil(data)) total += 1;
      data.setDate(data.getDate() + 1);
    }

    return total;
  }

  function contarDiasUteisMes(ano: number, mes: number) {
    let total = 0;
    const data = new Date(ano, mes, 1);

    while (data.getMonth() === mes) {
      if (eDiaUtil(data)) total += 1;
      data.setDate(data.getDate() + 1);
    }

    return total;
  }

  function contarBloqueiosUteisAno(ano: number) {
    return bloqueios.filter((bloqueio) => {
      const data = new Date(`${bloqueio.data}T00:00:00`);
      return data.getFullYear() === ano && eDiaUtil(data);
    }).length;
  }

  function contarBloqueiosUteisMes(ano: number, mes: number) {
    return bloqueios.filter((bloqueio) => {
      const data = new Date(`${bloqueio.data}T00:00:00`);
      return data.getFullYear() === ano && data.getMonth() === mes && eDiaUtil(data);
    }).length;
  }

  function obterIntervaloProcesso(processo: ProcessoCalendario) {
    if (!processo.data_entrega_prevista || !processo.dias_totais_previstos) {
      return null;
    }

    const fim = new Date(`${processo.data_entrega_prevista}T00:00:00`);
    fim.setHours(0, 0, 0, 0);

    const diasTotais = Math.max(Number(processo.dias_totais_previstos || 0), 1);

    const inicio = new Date(fim);
    inicio.setDate(fim.getDate() - (diasTotais - 1));
    inicio.setHours(0, 0, 0, 0);

    return { inicio, fim };
  }

  function diaDentroDoProcesso(processo: ProcessoCalendario, dia: Date) {
    const intervalo = obterIntervaloProcesso(processo);

    if (!intervalo) return false;

    return dia >= intervalo.inicio && dia <= intervalo.fim;
  }

  function obterCoresEstado(estado: string | null) {
    if (estado === "Pedido Submetido") {
      return {
        fundo: "rgba(255,255,255,0.16)",
        borda: "rgba(255,255,255,0.30)",
      };
    }

    if (estado === "Em Análise") {
      return {
        fundo: "rgba(244, 180, 0, 0.85)",
        borda: "rgba(244, 180, 0, 1)",
      };
    }

    if (estado === "Orçamento Enviado") {
      return {
        fundo: "rgba(66, 133, 244, 0.85)",
        borda: "rgba(66, 133, 244, 1)",
      };
    }

    if (estado === "Validado") {
      return {
        fundo: "rgba(52, 168, 83, 0.88)",
        borda: "rgba(52, 168, 83, 1)",
      };
    }

    if (estado === "Rejeitado") {
      return {
        fundo: "rgba(234, 67, 53, 0.85)",
        borda: "rgba(234, 67, 53, 1)",
      };
    }

    return {
      fundo: "rgba(127,140,141,0.82)",
      borda: "rgba(127,140,141,1)",
    };
  }

  function obterValorFinanceiroProcesso(processo: ProcessoCalendario) {
    return Number(
      processo.valor_final ??
        processo.valor_estimado_com_desconto ??
        processo.valor_estimado ??
        0
    );
  }

  function obterValorDiarioProcesso(processo: ProcessoCalendario) {
    const valor = obterValorFinanceiroProcesso(processo);
    const dias = Math.max(Number(processo.dias_totais_previstos || 0), 1);
    return valor / dias;
  }

  const processosFiltrados = useMemo(() => {
    const textoPesquisa = normalizarTexto(pesquisa);

    return processos.filter((processo) => {
      const nomeObra = normalizarTexto(processo.nome_obra);
      const nomeCliente = normalizarTexto(processo.nome_cliente);
      const estado = processo.estado || "";

      const passaPesquisa =
        textoPesquisa === "" ||
        nomeObra.includes(textoPesquisa) ||
        nomeCliente.includes(textoPesquisa);

      const passaEstado =
        filtroEstado === "Todos" || estado === filtroEstado;

      return passaPesquisa && passaEstado;
    });
  }, [processos, pesquisa, filtroEstado]);

  const diasDoMes = useMemo<DiaMes[]>(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const primeiroDiaSemana = (primeiroDia.getDay() + 6) % 7;
    const totalDiasMes = ultimoDia.getDate();

    const dias: DiaMes[] = [];

    for (let i = primeiroDiaSemana; i > 0; i--) {
      const data = new Date(ano, mes, 1 - i);
      dias.push({
        data,
        chave: formatarDataISO(data),
        dia: data.getDate(),
        pertenceAoMesAtual: false,
      });
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const data = new Date(ano, mes, dia);
      dias.push({
        data,
        chave: formatarDataISO(data),
        dia,
        pertenceAoMesAtual: true,
      });
    }

    while (dias.length < 42) {
      const ultimo = dias[dias.length - 1].data;
      const proximo = new Date(ultimo);
      proximo.setDate(ultimo.getDate() + 1);

      dias.push({
        data: proximo,
        chave: formatarDataISO(proximo),
        dia: proximo.getDate(),
        pertenceAoMesAtual: false,
      });
    }

    return dias;
  }, [mesAtual]);

  const resumo = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    const objetivoMensal = Number(metaAtual?.objetivo_mensal || 0);
    const objetivoAnual = objetivoMensal * 12;

    const diasUteisAno = contarDiasUteisAno(ano);
    const bloqueiosUteisAno = contarBloqueiosUteisAno(ano);
    const diasUteisReaisAno = Math.max(diasUteisAno - bloqueiosUteisAno, 0);

    const diasUteisMes = contarDiasUteisMes(ano, mes);
    const bloqueiosUteisMes = contarBloqueiosUteisMes(ano, mes);
    const diasUteisReaisMes = Math.max(diasUteisMes - bloqueiosUteisMes, 0);

    const objetivoDiario =
      diasUteisReaisAno > 0 ? objetivoAnual / diasUteisReaisAno : 0;

    const objetivoMensalReal = objetivoDiario * diasUteisReaisMes;

    const processosDoMes = processosFiltrados.filter((processo) => {
      if (!processo.created_at) return false;
      const data = new Date(processo.created_at);
      return data.getFullYear() === ano && data.getMonth() === mes;
    });

    const valorPrevistoMes = processosDoMes.reduce(
      (acc, processo) => acc + obterValorFinanceiroProcesso(processo),
      0
    );

    const diasVendidosMes = processosDoMes.reduce((acc, processo) => {
      if (!objetivoDiario) return acc;
      return acc + obterValorFinanceiroProcesso(processo) / objetivoDiario;
    }, 0);

    return {
      totalProcessos: processosFiltrados.length,
      objetivoMensal,
      objetivoAnual,
      objetivoMensalReal,
      objetivoDiario,
      valorPrevistoMes,
      diasVendidosMes,
      diasUteisAno,
      bloqueiosUteisAno,
      diasUteisReaisAno,
      diasUteisMes,
      bloqueiosUteisMes,
      diasUteisReaisMes,
      diasEmFalta: Math.max(diasUteisReaisMes - diasVendidosMes, 0),
    };
  }, [processosFiltrados, metaAtual, mesAtual, bloqueios]);

  function obterProcessosDoDia(data: Date) {
    return processosFiltrados.filter((processo) =>
      diaDentroDoProcesso(processo, data)
    );
  }

  function obterValorPrevistoDoDia(data: Date) {
    if (!eDiaUtil(data)) return 0;
    if (obterBloqueioDoDia(data)) return 0;

    const processosDoDia = obterProcessosDoDia(data);

    return processosDoDia.reduce(
      (acc, processo) => acc + obterValorDiarioProcesso(processo),
      0
    );
  }

  function obterDiasFinanceirosDoDia(data: Date) {
    if (!resumo.objetivoDiario || resumo.objetivoDiario <= 0) return 0;
    return obterValorPrevistoDoDia(data) / resumo.objetivoDiario;
  }

  function obterEstiloFinanceiroDia(valorDia: number, objetivoDiario: number) {
    if (!objetivoDiario || objetivoDiario <= 0) {
      return {
        fundo: "rgba(255,255,255,0.06)",
        borda: "rgba(255,255,255,0.10)",
        texto: "white",
      };
    }

    const percentagem = valorDia / objetivoDiario;

    if (percentagem >= 1) {
      return {
        fundo: "rgba(52, 168, 83, 0.20)",
        borda: "rgba(52, 168, 83, 0.55)",
        texto: "#9df5b4",
      };
    }

    if (percentagem >= 0.75) {
      return {
        fundo: "rgba(244, 180, 0, 0.18)",
        borda: "rgba(244, 180, 0, 0.50)",
        texto: "#ffd76c",
      };
    }

    return {
      fundo: "rgba(234, 67, 53, 0.16)",
      borda: "rgba(234, 67, 53, 0.50)",
      texto: "#ff9d9d",
    };
  }

  function limparFiltros() {
    setPesquisa("");
    setFiltroEstado("Todos");
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

  function abrirModalBloqueio(data: Date) {
    const bloqueioExistente = obterBloqueioDoDia(data);
    setDiaSelecionado(data);
    setMotivoBloqueio(bloqueioExistente?.motivo || "");
  }

  function fecharModalBloqueio() {
    setDiaSelecionado(null);
    setMotivoBloqueio("");
  }

  async function guardarBloqueio() {
    if (!diaSelecionado) return;

    try {
      setAGuardarBloqueio(true);
      setMensagem("");

      const data = formatarDataISO(diaSelecionado);

      const { error } = await supabase
        .from("bloqueios_calendario")
        .upsert(
          {
            data,
            motivo: motivoBloqueio.trim() || "Dia bloqueado manualmente",
          },
          { onConflict: "data" }
        );

      if (error) {
        console.error("Erro Supabase guardarBloqueio:", error);
        throw new Error(error.message || "Erro ao guardar bloqueio.");
      }

      setMensagem("Dia bloqueado com sucesso.");
      fecharModalBloqueio();
      await carregarDados();
    } catch (error: any) {
      console.error("guardarBloqueio:", error);
      setMensagem(error?.message || "Erro ao bloquear o dia.");
    } finally {
      setAGuardarBloqueio(false);
    }
  }

  async function removerBloqueio() {
    if (!diaSelecionado) return;

    try {
      setARemoverBloqueio(true);
      setMensagem("");

      const data = formatarDataISO(diaSelecionado);

      const { error } = await supabase
        .from("bloqueios_calendario")
        .delete()
        .eq("data", data);

      if (error) {
        console.error("Erro Supabase removerBloqueio:", error);
        throw new Error(error.message || "Erro ao remover bloqueio.");
      }

      setMensagem("Bloqueio removido com sucesso.");
      fecharModalBloqueio();
      await carregarDados();
    } catch (error: any) {
      console.error("removerBloqueio:", error);
      setMensagem(error?.message || "Erro ao remover bloqueio.");
    } finally {
      setARemoverBloqueio(false);
    }
  }

  async function guardarMetaMensal() {
    try {
      setAGuardarMeta(true);
      setMensagem("");

      const valorTexto = metaMensalEdit.trim().replace(",", ".");
      const valorNumero = Number(valorTexto);

      if (!valorTexto || Number.isNaN(valorNumero) || valorNumero <= 0) {
        setMensagem("Introduz uma meta mensal válida.");
        return;
      }

      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth() + 1;
      const diasUteisMes = contarDiasUteisMes(ano, mesAtual.getMonth());
      const bloqueiosUteisMes = contarBloqueiosUteisMes(ano, mesAtual.getMonth());
      const diasUteisReaisMes = Math.max(diasUteisMes - bloqueiosUteisMes, 0);

      const { error } = await supabase.from("metas_faturacao").upsert(
        {
          ano,
          mes,
          objetivo_mensal: valorNumero,
          dias_uteis: diasUteisReaisMes,
        },
        { onConflict: "ano,mes" }
      );

      if (error) {
        throw error;
      }

      setMensagem("Meta mensal guardada com sucesso.");
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao guardar meta mensal.");
    } finally {
      setAGuardarMeta(false);
    }
  }

  const processosDiaSelecionado = diaSelecionado
    ? obterProcessosDoDia(diaSelecionado)
    : [];
  const bloqueioDiaSelecionado = diaSelecionado
    ? obterBloqueioDoDia(diaSelecionado)
    : null;
  const valorDiaSelecionado = diaSelecionado
    ? obterValorPrevistoDoDia(diaSelecionado)
    : 0;
  const diasFinanceirosDiaSelecionado = diaSelecionado
    ? obterDiasFinanceirosDoDia(diaSelecionado)
    : 0;

  const estilos = obterEstilosResponsivos(eDesktop, eTablet);

  if (aVerificar) {
    return (
      <main style={estilos.mainStyle}>
        <section style={estilos.contentStyle}>
          <h1 style={{ marginTop: 0 }}>Calendário</h1>
          <p style={{ opacity: 0.8 }}>A verificar acesso...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={estilos.mainStyle}>
      <aside style={estilos.asideStyle}>
        <div style={estilos.logoStyle}>VALERIE</div>

        <div style={estilos.menuContainerStyle}>
          <a href="/admin" style={estilos.menuStyle}>
            Dashboard
          </a>
          <a href="/admin/processos" style={estilos.menuStyle}>
            Processos
          </a>
          <a href="/admin/clientes" style={estilos.menuStyle}>
            Clientes
          </a>
          <a href="/admin/precos" style={estilos.menuStyle}>
            Preços
          </a>
          <a href="/admin/financeiro" style={estilos.menuStyle}>
            Financeiro
          </a>
          <a
            href="/admin/calendario"
            style={{ ...estilos.menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Calendário
          </a>
          <a href="/aprovacao-clientes" style={estilos.menuStyle}>
            Aprovação Clientes
          </a>
        </div>

        <div style={{ marginTop: "16px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={estilos.contentStyle}>
        <div style={estilos.topBarStyle}>
          <div>
            <h1 style={{ fontSize: eDesktop ? "38px" : "28px", margin: 0 }}>
              Calendário
            </h1>
            <p style={{ opacity: 0.82, marginTop: "10px", lineHeight: 1.35 }}>
              Vista mensal das obras, bloqueios, meta real e distribuição financeira.
            </p>
          </div>

          <div style={estilos.navegacaoStyle}>
            <button onClick={irHoje} style={estilos.botaoCalendarioStyle}>
              Hoje
            </button>
            <button onClick={irMesAnterior} style={estilos.botaoCalendarioStyle}>
              ←
            </button>
            <button onClick={irMesSeguinte} style={estilos.botaoCalendarioStyle}>
              →
            </button>
          </div>
        </div>

        <div style={estilos.mesAtualStyle}>{formatarMesAno(mesAtual)}</div>

        <div style={estilos.filtrosWrapStyle}>
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar obra ou cliente"
            style={estilos.inputFiltroStyle}
          />

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(
                e.target.value as (typeof ESTADOS_DISPONIVEIS)[number]
              )
            }
            style={estilos.selectFiltroStyle}
          >
            {ESTADOS_DISPONIVEIS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>

          <button onClick={limparFiltros} style={estilos.botaoLimparStyle}>
            Limpar filtros
          </button>
        </div>

        <div style={estilos.cardStyle}>
          <h2 style={{ marginTop: 0 }}>Meta de Faturação</h2>

          <div style={estilos.metaEditorWrapStyle}>
            <div style={estilos.metaEditorCampoStyle}>
              <label style={estilos.labelStyle}>Meta mensal desejada</label>
              <input
                value={metaMensalEdit}
                onChange={(e) => setMetaMensalEdit(e.target.value)}
                placeholder="Ex: 120000"
                style={estilos.inputFiltroStyle}
              />
            </div>

            <div style={estilos.metaInfoCardStyle}>
              <div style={estilos.metaInfoTituloStyle}>Meta anual automática</div>
              <div style={estilos.metaInfoValorStyle}>
                {((Number(metaMensalEdit.replace(",", ".")) || 0) * 12).toFixed(2)} €
              </div>
            </div>

            <button
              type="button"
              onClick={guardarMetaMensal}
              style={estilos.botaoPrincipalStyle}
              disabled={aGuardarMeta}
            >
              {aGuardarMeta ? "A guardar..." : "Guardar Meta"}
            </button>
          </div>

          <div style={estilos.metaAjudaStyle}>
            O objetivo diário é calculado pela meta anual dividida apenas pelos dias úteis
            reais do ano. Sábados, domingos e dias bloqueados não entram nas contas.
          </div>
        </div>

        {mensagem && <div style={estilos.mensagemStyle}>{mensagem}</div>}

        {aCarregar ? (
          <div style={estilos.cardStyle}>
            <p style={{ opacity: 0.75 }}>A carregar calendário...</p>
          </div>
        ) : (
          <>
            <div style={estilos.resumoGridStyle}>
              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.objetivoMensal.toFixed(2)} €
                </div>
                <div>Meta mensal</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.objetivoAnual.toFixed(2)} €
                </div>
                <div>Meta anual</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.objetivoDiario.toFixed(2)} €
                </div>
                <div>Objetivo diário real</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.diasUteisReaisAno}
                </div>
                <div>Dias úteis reais do ano</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.bloqueiosUteisAno}
                </div>
                <div>Dias bloqueados úteis</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.objetivoMensalReal.toFixed(2)} €
                </div>
                <div>Meta real do mês</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.valorPrevistoMes.toFixed(2)} €
                </div>
                <div>Previsto no mês</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.diasVendidosMes.toFixed(2)}
                </div>
                <div>Dias vendidos</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.diasUteisReaisMes}
                </div>
                <div>Dias úteis reais do mês</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>
                  {resumo.diasEmFalta.toFixed(2)}
                </div>
                <div>Dias em falta</div>
              </div>
            </div>

            <div style={estilos.cardStyle}>
              <h2 style={{ marginTop: 0 }}>Legenda</h2>

              <div style={estilos.legendaWrapStyle}>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(255,255,255,0.16)" }} />
                  Pedido Submetido
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(244, 180, 0, 0.85)" }} />
                  Em Análise
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(66, 133, 244, 0.85)" }} />
                  Orçamento Enviado
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(52, 168, 83, 0.88)" }} />
                  Validado
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(234, 67, 53, 0.85)" }} />
                  Rejeitado
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(160, 82, 45, 0.90)" }} />
                  Dia bloqueado
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(234, 67, 53, 0.16)" }} />
                  Abaixo do objetivo
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(244, 180, 0, 0.18)" }} />
                  Perto do objetivo
                </div>
                <div style={estilos.legendaItemStyle}>
                  <span style={{ ...estilos.legendaCorStyle, background: "rgba(52, 168, 83, 0.20)" }} />
                  Objetivo atingido
                </div>
              </div>
            </div>

            <div style={estilos.calendarCardStyle}>
              <div style={estilos.diasSemanaHeaderStyle}>
                {nomesDias.map((dia, index) => (
                  <div key={`${dia}-${index}`} style={estilos.diaSemanaHeaderItemStyle}>
                    {dia}
                  </div>
                ))}
              </div>

              <div style={estilos.grelhaMesStyle}>
                {diasDoMes.map((dia) => {
                  const processosDoDia = obterProcessosDoDia(dia.data);
                  const bloqueio = obterBloqueioDoDia(dia.data);
                  const hoje = formatarDataISO(new Date()) === dia.chave;
                  const valorDia = obterValorPrevistoDoDia(dia.data);
                  const diasFinanceirosDia = obterDiasFinanceirosDoDia(dia.data);
                  const estiloFinanceiro = obterEstiloFinanceiroDia(
                    valorDia,
                    resumo.objetivoDiario
                  );

                  const limiteEventos = eDesktop ? 3 : 2;
                  const diaSemana = dia.data.getDay();
                  const fimDeSemana = diaSemana === 0 || diaSemana === 6;

                  return (
                    <button
                      key={dia.chave}
                      type="button"
                      onClick={() => abrirModalBloqueio(dia.data)}
                      style={{
                        ...estilos.diaMesCardStyle,
                        opacity: dia.pertenceAoMesAtual ? 1 : 0.42,
                        border: hoje
                          ? "1px solid rgba(66,133,244,0.95)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: fimDeSemana
                          ? "rgba(255,255,255,0.03)"
                          : bloqueio
                          ? "rgba(160, 82, 45, 0.08)"
                          : "rgba(255,255,255,0.01)",
                      }}
                    >
                      <div style={estilos.topoDiaStyle}>
                        <div
                          style={{
                            ...estilos.numeroDiaStyle,
                            background: hoje
                              ? "rgba(66,133,244,0.95)"
                              : "transparent",
                            color: hoje ? "white" : "inherit",
                          }}
                        >
                          {dia.dia}
                        </div>

                        <div
                          style={{
                            ...estilos.financeBadgeStyle,
                            background: estiloFinanceiro.fundo,
                            border: `1px solid ${estiloFinanceiro.borda}`,
                            color: estiloFinanceiro.texto,
                          }}
                          title={`Previsto: ${valorDia.toFixed(2)} € | Dias cobertos: ${diasFinanceirosDia.toFixed(2)}`}
                        >
                          {valorDia.toFixed(0)} €
                        </div>
                      </div>

                      <div style={estilos.eventosDiaStyle}>
                        {bloqueio && (
                          <div
                            title={`Bloqueado: ${bloqueio.motivo || "Sem motivo"}`}
                            style={{
                              ...estilos.eventoStyle,
                              background: "rgba(160, 82, 45, 0.90)",
                              border: "1px solid rgba(160, 82, 45, 1)",
                            }}
                          >
                            Bloqueado
                          </div>
                        )}

                        {processosDoDia.length === 0 && !bloqueio ? (
                          <div style={estilos.diaVazioStyle}>—</div>
                        ) : (
                          processosDoDia.slice(0, limiteEventos).map((processo) => {
                            const cores = obterCoresEstado(processo.estado);
                            const valorDiario = obterValorDiarioProcesso(processo);

                            return (
                              <div
                                key={`${dia.chave}-${processo.id}`}
                                title={`${processo.nome_obra || "Obra"} | ${
                                  processo.estado || "Sem estado"
                                } | Cliente: ${
                                  processo.nome_cliente || "—"
                                } | Entrega: ${formatarData(
                                  processo.data_entrega_prevista
                                )} | Valor/dia: ${valorDiario.toFixed(2)} €`}
                                style={{
                                  ...estilos.eventoStyle,
                                  background: cores.fundo,
                                  border: `1px solid ${cores.borda}`,
                                }}
                              >
                                {processo.nome_obra || "Sem nome"}
                              </div>
                            );
                          })
                        )}

                        {processosDoDia.length > limiteEventos && (
                          <div style={estilos.maisEventosStyle}>
                            +{processosDoDia.length - limiteEventos} mais
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          ...estilos.rodapeFinanceiroDiaStyle,
                          background: estiloFinanceiro.fundo,
                          border: `1px solid ${estiloFinanceiro.borda}`,
                        }}
                      >
                        <div style={{ color: estiloFinanceiro.texto }}>
                          {diasFinanceirosDia.toFixed(2)} dias
                        </div>
                        <div style={{ opacity: 0.8 }}>
                          Meta: {resumo.objetivoDiario.toFixed(0)} €
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={estilos.cardStyle}>
              <h2 style={{ marginTop: 0 }}>Resumo das Obras</h2>

              {processosFiltrados.length === 0 ? (
                <p style={{ opacity: 0.75 }}>Ainda não existem processos.</p>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  {processosFiltrados.map((processo) => {
                    const valorFinanceiro = obterValorFinanceiroProcesso(processo);
                    const diasFinanceiros =
                      resumo.objetivoDiario > 0
                        ? valorFinanceiro / resumo.objetivoDiario
                        : 0;

                    return (
                      <div key={processo.id} style={estilos.detailRowStyle}>
                        <div>
                          <div style={estilos.obraNomeStyle}>
                            {processo.nome_obra || "Sem nome de obra"}
                          </div>
                          <div style={estilos.subtextoStyle}>
                            Cliente: {processo.nome_cliente || "—"}
                          </div>
                          <div style={estilos.subtextoStyle}>
                            Estado: {processo.estado || "—"}
                          </div>
                          <div style={estilos.subtextoStyle}>
                            Criado em: {formatarDataHora(processo.created_at)}
                          </div>
                        </div>

                        <div style={estilos.metricsGridStyle}>
                          <div style={estilos.miniCardStyle}>
                            <div style={estilos.miniCardTituloStyle}>Valor Obra</div>
                            <div style={estilos.miniCardValorStyle}>
                              {valorFinanceiro.toFixed(2)} €
                            </div>
                          </div>

                          <div style={estilos.miniCardStyle}>
                            <div style={estilos.miniCardTituloStyle}>Dias Técnicos</div>
                            <div style={estilos.miniCardValorStyle}>
                              {Number(processo.dias_totais_previstos || 0)} dias
                            </div>
                          </div>

                          <div style={estilos.miniCardStyle}>
                            <div style={estilos.miniCardTituloStyle}>Dias Financeiros</div>
                            <div style={estilos.miniCardValorStyle}>
                              {diasFinanceiros.toFixed(2)} dias
                            </div>
                          </div>

                          <div style={estilos.miniCardStyle}>
                            <div style={estilos.miniCardTituloStyle}>Valor por Dia</div>
                            <div style={estilos.miniCardValorStyle}>
                              {obterValorDiarioProcesso(processo).toFixed(2)} €
                            </div>
                          </div>

                          <div style={estilos.miniCardStyle}>
                            <div style={estilos.miniCardTituloStyle}>Entrega</div>
                            <div style={estilos.miniCardValorStyle}>
                              {formatarData(processo.data_entrega_prevista)}
                            </div>
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

        {diaSelecionado && (
          <div style={estilos.overlayStyle}>
            <div style={estilos.modalStyle}>
              <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
                Dia {formatarData(formatarDataISO(diaSelecionado))}
              </h3>

              <div style={estilos.modalResumoGridStyle}>
                <div style={estilos.modalResumoCardStyle}>
                  <div style={estilos.modalResumoTituloStyle}>Previsto</div>
                  <div style={estilos.modalResumoValorStyle}>
                    {valorDiaSelecionado.toFixed(2)} €
                  </div>
                </div>

                <div style={estilos.modalResumoCardStyle}>
                  <div style={estilos.modalResumoTituloStyle}>Dias cobertos</div>
                  <div style={estilos.modalResumoValorStyle}>
                    {diasFinanceirosDiaSelecionado.toFixed(2)}
                  </div>
                </div>

                <div style={estilos.modalResumoCardStyle}>
                  <div style={estilos.modalResumoTituloStyle}>Processos</div>
                  <div style={estilos.modalResumoValorStyle}>
                    {processosDiaSelecionado.length}
                  </div>
                </div>
              </div>

              <p style={{ opacity: 0.8, marginTop: "16px", lineHeight: 1.4 }}>
                Podes bloquear manualmente este dia para não aceitar produção.
              </p>

              {bloqueioDiaSelecionado && (
                <div style={estilos.bloqueioInfoStyle}>
                  <strong>Bloqueio atual:</strong>{" "}
                  {bloqueioDiaSelecionado.motivo || "Sem motivo"}
                </div>
              )}

              <label style={estilos.labelStyle}>Motivo do bloqueio</label>
              <textarea
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                placeholder="Ex: Feriado, manutenção, equipa indisponível"
                style={estilos.textareaStyle}
              />

              <div style={{ marginTop: "18px" }}>
                <h4 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Processos deste dia
                </h4>

                {processosDiaSelecionado.length === 0 ? (
                  <div style={estilos.semItensStyle}>Sem processos neste dia.</div>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {processosDiaSelecionado.map((processo) => (
                      <div key={processo.id} style={estilos.processoDiaCardStyle}>
                        <div style={{ fontWeight: "bold" }}>
                          {processo.nome_obra || "Sem nome"}
                        </div>
                        <div style={estilos.subtextoStyle}>
                          Cliente: {processo.nome_cliente || "—"}
                        </div>
                        <div style={estilos.subtextoStyle}>
                          Estado: {processo.estado || "—"}
                        </div>
                        <div style={estilos.subtextoStyle}>
                          Valor/dia: {obterValorDiarioProcesso(processo).toFixed(2)} €
                        </div>
                        <div style={estilos.subtextoStyle}>
                          Entrega: {formatarData(processo.data_entrega_prevista)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={estilos.modalAcoesStyle}>
                <button
                  type="button"
                  onClick={fecharModalBloqueio}
                  style={estilos.botaoSecundarioStyle}
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={removerBloqueio}
                  style={estilos.botaoRemoverStyle}
                  disabled={aRemoverBloqueio}
                >
                  {aRemoverBloqueio ? "A remover..." : "Remover Bloqueio"}
                </button>

                <button
                  type="button"
                  onClick={guardarBloqueio}
                  style={estilos.botaoPrincipalStyle}
                  disabled={aGuardarBloqueio}
                >
                  {aGuardarBloqueio ? "A guardar..." : "Guardar Bloqueio"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function obterEstilosResponsivos(eDesktop: boolean, eTablet: boolean) {
  return {
    mainStyle: {
      minHeight: "100dvh",
      background:
        "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
      color: "white",
      display: "flex",
      flexDirection: eDesktop ? "row" : "column",
      overflowX: "hidden",
      fontFamily: "Arial, sans-serif",
    } satisfies CSSProperties,

    asideStyle: {
      width: eDesktop ? "260px" : "100%",
      minHeight: eDesktop ? "100dvh" : "auto",
      borderRight: eDesktop ? "1px solid rgba(255,255,255,0.08)" : "none",
      borderBottom: eDesktop ? "none" : "1px solid rgba(255,255,255,0.08)",
      background: "rgba(0,0,0,0.12)",
      padding: eDesktop ? "30px 20px" : "18px 16px",
      flexShrink: 0,
    } satisfies CSSProperties,

    contentStyle: {
      flex: 1,
      padding: eDesktop ? "40px" : eTablet ? "20px" : "16px",
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden",
    } satisfies CSSProperties,

    logoStyle: {
      fontSize: eDesktop ? "38px" : "28px",
      letterSpacing: eDesktop ? "10px" : "6px",
      marginBottom: eDesktop ? "40px" : "18px",
    } satisfies CSSProperties,

    menuContainerStyle: {
      display: "flex",
      flexDirection: eDesktop ? "column" : "row",
      gap: "12px",
      overflowX: eDesktop ? "visible" : "auto",
      paddingBottom: eDesktop ? 0 : "4px",
    } satisfies CSSProperties,

    menuStyle: {
      padding: "12px 14px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.04)",
      color: "white",
      textDecoration: "none",
      whiteSpace: "nowrap",
      fontSize: eDesktop ? "16px" : "14px",
      flexShrink: 0,
    } satisfies CSSProperties,

    topBarStyle: {
      display: "flex",
      flexDirection: eDesktop ? "row" : "column",
      justifyContent: "space-between",
      alignItems: eDesktop ? "flex-start" : "stretch",
      gap: "14px",
      marginBottom: "10px",
    } satisfies CSSProperties,

    navegacaoStyle: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    } satisfies CSSProperties,

    botaoCalendarioStyle: {
      background: "rgba(255,255,255,0.08)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      padding: "10px 12px",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "14px",
    } satisfies CSSProperties,

    filtrosWrapStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "1.4fr 1fr auto" : "1fr",
      gap: "10px",
      marginBottom: "16px",
    } satisfies CSSProperties,

    inputFiltroStyle: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
    } satisfies CSSProperties,

    selectFiltroStyle: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
    } satisfies CSSProperties,

    botaoLimparStyle: {
      background: "rgba(255,255,255,0.08)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      padding: "12px 14px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "auto" : "100%",
    } satisfies CSSProperties,

    mesAtualStyle: {
      fontSize: eDesktop ? "26px" : "22px",
      fontWeight: "bold",
      marginBottom: "14px",
      textTransform: "capitalize",
    } satisfies CSSProperties,

    resumoGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop
        ? "repeat(5, minmax(0, 1fr))"
        : eTablet
        ? "repeat(3, minmax(0, 1fr))"
        : "repeat(2, minmax(0, 1fr))",
      gap: "10px",
      width: "100%",
      marginBottom: "16px",
    } satisfies CSSProperties,

    resumoCardStyle: {
      padding: eDesktop ? "20px" : "16px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      minWidth: 0,
    } satisfies CSSProperties,

    resumoNumeroStyle: {
      fontSize: eDesktop ? "30px" : "22px",
      fontWeight: "bold",
      marginBottom: "6px",
      wordBreak: "break-word",
    } satisfies CSSProperties,

    cardStyle: {
      width: "100%",
      padding: eDesktop ? "24px" : "16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      marginBottom: "16px",
      minWidth: 0,
    } satisfies CSSProperties,

    metaEditorWrapStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "1.2fr 1fr auto" : "1fr",
      gap: "12px",
      alignItems: "end",
    } satisfies CSSProperties,

    metaEditorCampoStyle: {
      display: "grid",
      gap: "8px",
    } satisfies CSSProperties,

    metaInfoCardStyle: {
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      minWidth: 0,
    } satisfies CSSProperties,

    metaInfoTituloStyle: {
      fontSize: "12px",
      opacity: 0.8,
      marginBottom: "6px",
    } satisfies CSSProperties,

    metaInfoValorStyle: {
      fontSize: eDesktop ? "22px" : "18px",
      fontWeight: "bold",
      wordBreak: "break-word",
    } satisfies CSSProperties,

    metaAjudaStyle: {
      marginTop: "12px",
      opacity: 0.8,
      fontSize: "13px",
      lineHeight: 1.35,
    } satisfies CSSProperties,

    calendarCardStyle: {
      width: "100%",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      marginBottom: "16px",
      overflow: "hidden",
    } satisfies CSSProperties,

    mensagemStyle: {
      width: "100%",
      marginBottom: "16px",
      padding: "14px 16px",
      borderRadius: "12px",
      background: "rgba(180,50,50,0.18)",
      border: "1px solid rgba(180,50,50,0.35)",
    } satisfies CSSProperties,

    legendaWrapStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "repeat(3, minmax(0, 1fr))" : "1fr",
      gap: "10px",
    } satisfies CSSProperties,

    legendaItemStyle: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "14px",
      opacity: 0.95,
      lineHeight: 1.35,
      minWidth: 0,
    } satisfies CSSProperties,

    legendaCorStyle: {
      width: "14px",
      height: "14px",
      borderRadius: "4px",
      display: "inline-block",
      flexShrink: 0,
    } satisfies CSSProperties,

    diasSemanaHeaderStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    } satisfies CSSProperties,

    diaSemanaHeaderItemStyle: {
      padding: eDesktop ? "14px 10px" : "10px 4px",
      textAlign: "center",
      fontWeight: "bold",
      opacity: 0.82,
      background: "rgba(255,255,255,0.03)",
      fontSize: eDesktop ? "13px" : "12px",
      minWidth: 0,
    } satisfies CSSProperties,

    grelhaMesStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    } satisfies CSSProperties,

    diaMesCardStyle: {
      minHeight: eDesktop ? "185px" : eTablet ? "140px" : "118px",
      padding: eDesktop ? "10px" : "6px",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: eDesktop ? "8px" : "6px",
      textAlign: "left",
      minWidth: 0,
      cursor: "pointer",
    } satisfies CSSProperties,

    topoDiaStyle: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "4px",
    } satisfies CSSProperties,

    numeroDiaStyle: {
      width: eDesktop ? "28px" : "24px",
      height: eDesktop ? "28px" : "24px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: eDesktop ? "14px" : "12px",
      flexShrink: 0,
    } satisfies CSSProperties,

    financeBadgeStyle: {
      fontSize: eDesktop ? "11px" : "10px",
      fontWeight: "bold",
      padding: eDesktop ? "4px 8px" : "3px 6px",
      borderRadius: "999px",
      maxWidth: "100%",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    } satisfies CSSProperties,

    eventosDiaStyle: {
      display: "grid",
      gap: eDesktop ? "6px" : "4px",
      marginTop: "2px",
      flex: 1,
      alignContent: "start",
      minWidth: 0,
    } satisfies CSSProperties,

    eventoStyle: {
      fontSize: eDesktop ? "12px" : "10px",
      fontWeight: "bold",
      padding: eDesktop ? "6px 8px" : "4px 6px",
      borderRadius: eDesktop ? "8px" : "7px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      minWidth: 0,
    } satisfies CSSProperties,

    rodapeFinanceiroDiaStyle: {
      marginTop: "2px",
      padding: eDesktop ? "8px" : "6px",
      borderRadius: "8px",
      fontSize: eDesktop ? "11px" : "9px",
      display: "grid",
      gap: "2px",
      minWidth: 0,
    } satisfies CSSProperties,

    diaVazioStyle: {
      opacity: 0.28,
      fontSize: "11px",
    } satisfies CSSProperties,

    maisEventosStyle: {
      fontSize: eDesktop ? "12px" : "10px",
      opacity: 0.75,
      fontWeight: "bold",
    } satisfies CSSProperties,

    detailRowStyle: {
      padding: eDesktop ? "16px" : "14px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "grid",
      gap: "14px",
    } satisfies CSSProperties,

    metricsGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "repeat(5, minmax(0, 1fr))" : "1fr 1fr",
      gap: "10px",
    } satisfies CSSProperties,

    miniCardStyle: {
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      minWidth: 0,
    } satisfies CSSProperties,

    miniCardTituloStyle: {
      opacity: 0.8,
      fontSize: "12px",
      marginBottom: "6px",
    } satisfies CSSProperties,

    miniCardValorStyle: {
      fontWeight: "bold",
      fontSize: eDesktop ? "18px" : "15px",
      wordBreak: "break-word",
    } satisfies CSSProperties,

    obraNomeStyle: {
      fontSize: eDesktop ? "17px" : "16px",
      fontWeight: "bold",
    } satisfies CSSProperties,

    subtextoStyle: {
      opacity: 0.8,
      fontSize: "13px",
      marginTop: "4px",
      lineHeight: 1.35,
    } satisfies CSSProperties,

    overlayStyle: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      zIndex: 1000,
    } satisfies CSSProperties,

    modalStyle: {
      width: "100%",
      maxWidth: "620px",
      maxHeight: "90dvh",
      overflowY: "auto",
      borderRadius: "18px",
      background: "#222841",
      border: "1px solid rgba(255,255,255,0.10)",
      padding: eDesktop ? "24px" : "18px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    } satisfies CSSProperties,

    modalResumoGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "repeat(3, minmax(0, 1fr))" : "1fr",
      gap: "10px",
    } satisfies CSSProperties,

    modalResumoCardStyle: {
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
    } satisfies CSSProperties,

    modalResumoTituloStyle: {
      fontSize: "12px",
      opacity: 0.8,
      marginBottom: "6px",
    } satisfies CSSProperties,

    modalResumoValorStyle: {
      fontSize: "20px",
      fontWeight: "bold",
    } satisfies CSSProperties,

    bloqueioInfoStyle: {
      marginTop: "10px",
      marginBottom: "14px",
      padding: "12px",
      borderRadius: "10px",
      background: "rgba(160, 82, 45, 0.18)",
      border: "1px solid rgba(160, 82, 45, 0.35)",
    } satisfies CSSProperties,

    processoDiaCardStyle: {
      padding: "12px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
    } satisfies CSSProperties,

    semItensStyle: {
      padding: "12px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      opacity: 0.8,
    } satisfies CSSProperties,

    labelStyle: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      fontSize: "14px",
    } satisfies CSSProperties,

    textareaStyle: {
      width: "100%",
      minHeight: "110px",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      resize: "vertical",
      fontSize: "14px",
    } satisfies CSSProperties,

    modalAcoesStyle: {
      marginTop: "16px",
      display: "flex",
      flexDirection: eDesktop ? "row" : "column",
      gap: "10px",
      justifyContent: eDesktop ? "flex-end" : "stretch",
    } satisfies CSSProperties,

    botaoPrincipalStyle: {
      background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "12px 16px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "auto" : "100%",
    } satisfies CSSProperties,

    botaoSecundarioStyle: {
      background: "rgba(255,255,255,0.08)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      padding: "12px 16px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "auto" : "100%",
    } satisfies CSSProperties,

    botaoRemoverStyle: {
      background: "rgba(180,50,50,0.18)",
      color: "white",
      border: "1px solid rgba(180,50,50,0.35)",
      borderRadius: "10px",
      padding: "12px 16px",
      fontWeight: "bold",
      cursor: "pointer",
      width: eDesktop ? "auto" : "100%",
    } satisfies CSSProperties,
  };
}