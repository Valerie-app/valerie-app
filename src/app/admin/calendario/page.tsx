"use client";

/*
  PAGE.TSX LIMPO — Calendário Admin
  Inclui:
  - Produção
  - Acabamentos
  - Montagens
  - Datas manuais
  - Arquivar/restaurar obras
  - Cartões minimizáveis
  - Responsáveis e emails
*/

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

  responsavel_obra_nome?: string | null;
  responsavel_obra_email?: string | null;
  responsavel_acabamentos_nome?: string | null;
  responsavel_acabamentos_email?: string | null;
  responsavel_montagem_nome?: string | null;
  responsavel_montagem_email?: string | null;
  admin_alerta_email?: string | null;

  data_inicio_producao_manual?: string | null;
  data_fim_producao_manual?: string | null;
  data_inicio_acabamento_manual?: string | null;
  data_fim_acabamento_manual?: string | null;
  data_inicio_montagem_manual?: string | null;
  data_fim_montagem_manual?: string | null;

  calendario_arquivado?: boolean | null;
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

type TipoCalendario = "producao" | "acabamentos" | "montagens";
type FiltroArquivo = "ativas" | "arquivadas" | "todas";

type PlaneamentoProcesso = {
  processo: ProcessoCalendario;
  datasProducao: string[];
  datasAcabamento: string[];
  datasMontagem: string[];
  inicioProducao: string | null;
  fimProducao: string | null;
  inicioAcabamento: string | null;
  fimAcabamento: string | null;
  inicioMontagem: string | null;
  fimMontagem: string | null;
  dataEntregaCalculada: string | null;
  temDatasManuais: boolean;
};

type AlertaPlaneamento = {
  id: string;
  titulo: string;
  texto: string;
  data: string;
  diasAte: number;
  nivel: "urgente" | "breve" | "normal";
  processo: ProcessoCalendario;
};

type ContactosEdit = {
  responsavel_obra_nome: string;
  responsavel_obra_email: string;
  responsavel_acabamentos_nome: string;
  responsavel_acabamentos_email: string;
  responsavel_montagem_nome: string;
  responsavel_montagem_email: string;
  admin_alerta_email: string;
};

type DatasManuaisEdit = {
  data_inicio_producao_manual: string;
  data_fim_producao_manual: string;
  data_inicio_acabamento_manual: string;
  data_fim_acabamento_manual: string;
  data_inicio_montagem_manual: string;
  data_fim_montagem_manual: string;
};

const NOMES_DIAS_MOBILE = ["S", "T", "Q", "Q", "S", "S", "D"];
const NOMES_DIAS_DESKTOP = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DESBLOQUEIO_FIM_SEMANA = "__FIM_SEMANA_DESBLOQUEADO__";
const ESTADOS_DISPONIVEIS = ["Todos", "Validado"] as const;

const COLUNAS_PROCESSOS =
  "id, nome_cliente, nome_obra, estado, dias_fabrico_previstos, dias_acabamento_previstos, dias_montagem_previstos, dias_totais_previstos, data_entrega_prevista, valor_estimado, valor_estimado_com_desconto, valor_final, created_at, responsavel_obra_nome, responsavel_obra_email, responsavel_acabamentos_nome, responsavel_acabamentos_email, responsavel_montagem_nome, responsavel_montagem_email, admin_alerta_email, data_inicio_producao_manual, data_fim_producao_manual, data_inicio_acabamento_manual, data_fim_acabamento_manual, data_inicio_montagem_manual, data_fim_montagem_manual, calendario_arquivado";

export default function AdminCalendarioPage() {
  const router = useRouter();

  const [processos, setProcessos] = useState<ProcessoCalendario[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioCalendario[]>([]);
  const [metaAtual, setMetaAtual] = useState<MetaFaturacao | null>(null);

  const [aVerificar, setAVerificar] = useState(true);
  const [aCarregar, setACarregar] = useState(true);
  const [mensagem, setMensagem] = useState("");

  const [larguraJanela, setLarguraJanela] = useState(1200);
  const [tipoCalendario, setTipoCalendario] = useState<TipoCalendario>("producao");
  const [filtroArquivo, setFiltroArquivo] = useState<FiltroArquivo>("ativas");

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

  const [diasAcabamentoEdit, setDiasAcabamentoEdit] = useState<Record<string, string>>({});
  const [contactosEdit, setContactosEdit] = useState<Record<string, ContactosEdit>>({});
  const [datasManuaisEdit, setDatasManuaisEdit] = useState<Record<string, DatasManuaisEdit>>({});
  const [cartoesAbertos, setCartoesAbertos] = useState<Record<string, boolean>>({});

  const [processoAGuardarAcabamento, setProcessoAGuardarAcabamento] = useState<string | null>(null);
  const [processoAGuardarContactos, setProcessoAGuardarContactos] = useState<string | null>(null);
  const [processoAGuardarDatas, setProcessoAGuardarDatas] = useState<string | null>(null);
  const [processoAEnviarEmail, setProcessoAEnviarEmail] = useState<string | null>(null);
  const [processoAArquivar, setProcessoAArquivar] = useState<string | null>(null);

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
  const nomesDias = eDesktop ? NOMES_DIAS_DESKTOP : NOMES_DIAS_MOBILE;

  useEffect(() => {
    void validarAdmin();
  }, []);

  useEffect(() => {
    if (!aVerificar) {
      void carregarDados();
    }
  }, [mesAtual, aVerificar]);

  async function validarAdmin() {
    try {
      const { data: sessaoData, error: sessaoError } = await supabase.auth.getSession();

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
          .select(COLUNAS_PROCESSOS)
          .eq("estado", "Validado")
          .order("created_at", { ascending: true }),

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

      const listaProcessos = (processosRes.data || []) as ProcessoCalendario[];
      const meta = (metaRes.data || null) as MetaFaturacao | null;

      const diasIniciais: Record<string, string> = {};
      const contactosIniciais: Record<string, ContactosEdit> = {};
      const datasIniciais: Record<string, DatasManuaisEdit> = {};

      for (const processo of listaProcessos) {
        diasIniciais[processo.id] =
          processo.dias_acabamento_previstos !== null &&
          processo.dias_acabamento_previstos !== undefined
            ? String(processo.dias_acabamento_previstos)
            : "";

        contactosIniciais[processo.id] = {
          responsavel_obra_nome: processo.responsavel_obra_nome || "",
          responsavel_obra_email: processo.responsavel_obra_email || "",
          responsavel_acabamentos_nome: processo.responsavel_acabamentos_nome || "",
          responsavel_acabamentos_email: processo.responsavel_acabamentos_email || "",
          responsavel_montagem_nome: processo.responsavel_montagem_nome || "",
          responsavel_montagem_email: processo.responsavel_montagem_email || "",
          admin_alerta_email: processo.admin_alerta_email || "",
        };

        datasIniciais[processo.id] = {
          data_inicio_producao_manual: processo.data_inicio_producao_manual || "",
          data_fim_producao_manual: processo.data_fim_producao_manual || "",
          data_inicio_acabamento_manual: processo.data_inicio_acabamento_manual || "",
          data_fim_acabamento_manual: processo.data_fim_acabamento_manual || "",
          data_inicio_montagem_manual: processo.data_inicio_montagem_manual || "",
          data_fim_montagem_manual: processo.data_fim_montagem_manual || "",
        };
      }

      setProcessos(listaProcessos);
      setBloqueios((bloqueiosRes.data || []) as BloqueioCalendario[]);
      setMetaAtual(meta);
      setDiasAcabamentoEdit(diasIniciais);
      setContactosEdit(contactosIniciais);
      setDatasManuaisEdit(datasIniciais);
      setMetaMensalEdit(
        meta?.objetivo_mensal !== null && meta?.objetivo_mensal !== undefined
          ? String(meta.objetivo_mensal)
          : ""
      );
    } catch (error: any) {
      console.error(error);
      setMensagem(
        error?.message ||
          "Erro ao carregar calendário. Confirma se já criaste as colunas novas no Supabase."
      );
    } finally {
      setACarregar(false);
    }
  }

  function parseDateOnly(valor: string) {
    const [ano, mes, dia] = valor.split("-").map(Number);
    return new Date(ano, (mes || 1) - 1, dia || 1);
  }

  function formatarDataISO(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function formatarData(valor: string | null) {
    if (!valor) return "—";
    return parseDateOnly(valor).toLocaleDateString("pt-PT");
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

  function diferencaDias(dataISO: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const data = parseDateOnly(dataISO);
    data.setHours(0, 0, 0, 0);

    return Math.ceil((data.getTime() - hoje.getTime()) / 86400000);
  }

  function eFimDeSemana(data: Date) {
    const diaSemana = data.getDay();
    return diaSemana === 0 || diaSemana === 6;
  }

  function eDesbloqueioFimSemana(bloqueio: BloqueioCalendario | null) {
    return bloqueio?.motivo === DESBLOQUEIO_FIM_SEMANA;
  }

  function obterBloqueioDoDia(data: Date) {
    const chave = formatarDataISO(data);
    return bloqueios.find((bloqueio) => bloqueio.data === chave) || null;
  }

  function eBloqueioManual(data: Date) {
    const bloqueio = obterBloqueioDoDia(data);
    return !!bloqueio && !eDesbloqueioFimSemana(bloqueio);
  }

  function eDiaUtil(data: Date) {
    const bloqueio = obterBloqueioDoDia(data);

    if (eBloqueioManual(data)) return false;

    if (eFimDeSemana(data)) {
      return eDesbloqueioFimSemana(bloqueio);
    }

    return true;
  }

  function proximoDiaUtil(dataBase: Date) {
    const data = new Date(dataBase);
    data.setHours(0, 0, 0, 0);

    let seguranca = 0;

    while (!eDiaUtil(data) && seguranca < 730) {
      data.setDate(data.getDate() + 1);
      seguranca += 1;
    }

    return data;
  }

  function adicionarDiasUteis(dataBase: Date, dias: number) {
    const datas: string[] = [];
    const data = new Date(dataBase);
    data.setHours(0, 0, 0, 0);

    let seguranca = 0;

    while (datas.length < dias && seguranca < 730) {
      if (eDiaUtil(data)) {
        datas.push(formatarDataISO(data));
      }

      data.setDate(data.getDate() + 1);
      seguranca += 1;
    }

    return datas;
  }

  function obterIntervaloDiasUteis(inicioISO: string | null, fimISO: string | null) {
    if (!inicioISO || !fimISO) return [];

    const inicio = parseDateOnly(inicioISO);
    const fim = parseDateOnly(fimISO);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(0, 0, 0, 0);

    if (inicio.getTime() > fim.getTime()) return [];

    const datas: string[] = [];
    const cursor = new Date(inicio);
    let seguranca = 0;

    while (cursor.getTime() <= fim.getTime() && seguranca < 1460) {
      if (eDiaUtil(cursor)) datas.push(formatarDataISO(cursor));
      cursor.setDate(cursor.getDate() + 1);
      seguranca += 1;
    }

    return datas;
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

  function contarDiasUteisMes(ano: number, mesIndex: number) {
    let total = 0;
    const data = new Date(ano, mesIndex, 1);

    while (data.getMonth() === mesIndex) {
      if (eDiaUtil(data)) total += 1;
      data.setDate(data.getDate() + 1);
    }

    return total;
  }

  function obterBloqueiosUteisDoAno(ano: number) {
    return bloqueios.filter((bloqueio) => {
      const data = parseDateOnly(bloqueio.data);

      return (
        data.getFullYear() === ano &&
        !eFimDeSemana(data) &&
        !eDesbloqueioFimSemana(bloqueio)
      );
    });
  }

  function obterValorFinanceiroProcesso(processo: ProcessoCalendario) {
    return Number(
      processo.valor_final ??
        processo.valor_estimado_com_desconto ??
        processo.valor_estimado ??
        0
    );
  }

  function obterDiasProducaoNecessarios(processo: ProcessoCalendario) {
    const valor = obterValorFinanceiroProcesso(processo);

    if (resumo.objetivoDiario > 0 && valor > 0) {
      return Math.max(Math.ceil(valor / resumo.objetivoDiario), 1);
    }

    return Math.max(
      Number(processo.dias_fabrico_previstos || processo.dias_totais_previstos || 0),
      1
    );
  }

  function obterDiasAcabamentoNecessarios(processo: ProcessoCalendario) {
    return Math.max(Number(processo.dias_acabamento_previstos || 0), 0);
  }

  function obterValorDiarioProcesso(processo: ProcessoCalendario) {
    const valor = obterValorFinanceiroProcesso(processo);
    const dias = obterDiasProducaoNecessarios(processo);

    return dias > 0 ? valor / dias : 0;
  }

  const processosValidados = useMemo(() => {
    return processos.filter((processo) => processo.estado === "Validado");
  }, [processos]);

  const processosFiltradosPorArquivo = useMemo(() => {
    return processosValidados.filter((processo) => {
      const arquivado = processo.calendario_arquivado === true;

      if (filtroArquivo === "ativas") return !arquivado;
      if (filtroArquivo === "arquivadas") return arquivado;
      return true;
    });
  }, [processosValidados, filtroArquivo]);

  const processosVisiveis = useMemo(() => {
    return processosFiltradosPorArquivo.filter((processo) => {
      const textoPesquisa = normalizarTexto(pesquisa);
      const nomeObra = normalizarTexto(processo.nome_obra);
      const nomeCliente = normalizarTexto(processo.nome_cliente);
      const estado = processo.estado || "";

      const passaPesquisa =
        textoPesquisa === "" ||
        nomeObra.includes(textoPesquisa) ||
        nomeCliente.includes(textoPesquisa);

      const passaEstado = filtroEstado === "Todos" || estado === filtroEstado;

      return passaPesquisa && passaEstado;
    });
  }, [processosFiltradosPorArquivo, pesquisa, filtroEstado]);

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
    const mesIndex = mesAtual.getMonth();

    const objetivoMensal = Number(metaAtual?.objetivo_mensal || 0);
    const objetivoAnual = objetivoMensal * 12;

    const diasUteisAno = contarDiasUteisAno(ano);
    const bloqueiosUteisAno = obterBloqueiosUteisDoAno(ano).length;
    const diasUteisReaisAno = Math.max(diasUteisAno, 0);

    const diasUteisMes = contarDiasUteisMes(ano, mesIndex);
    const diasUteisReaisMes = Math.max(diasUteisMes, 0);

    const objetivoDiario =
      diasUteisReaisAno > 0 ? objetivoAnual / diasUteisReaisAno : 0;

    const valorPrevisto = processosValidados.reduce(
      (acc, processo) => acc + obterValorFinanceiroProcesso(processo),
      0
    );

    const totalArquivados = processosValidados.filter(
      (processo) => processo.calendario_arquivado === true
    ).length;

    const totalAtivos = processosValidados.length - totalArquivados;

    return {
      totalProcessosVisiveis: processosVisiveis.length,
      totalProcessosPlaneados: processosValidados.length,
      totalArquivados,
      totalAtivos,
      objetivoMensal,
      objetivoAnual,
      objetivoDiario,
      valorPrevisto,
      diasUteisAno,
      diasUteisReaisAno,
      diasUteisMes,
      diasUteisReaisMes,
      bloqueiosUteisAno,
    };
  }, [processosValidados, processosVisiveis, metaAtual, mesAtual, bloqueios]);

  function calcularPlaneamentos(listaProcessos: ProcessoCalendario[]) {
    const processosOrdenados = [...listaProcessos].sort((a, b) => {
      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dataA - dataB;
    });

    const resultado: PlaneamentoProcesso[] = [];
    const cargaProducaoPorDia: Record<string, number> = {};

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const processo of processosOrdenados) {
      const datasProducaoManuais = obterIntervaloDiasUteis(
        processo.data_inicio_producao_manual || null,
        processo.data_fim_producao_manual || null
      );

      const datasAcabamentoManuais = obterIntervaloDiasUteis(
        processo.data_inicio_acabamento_manual || null,
        processo.data_fim_acabamento_manual || null
      );

      const datasMontagemManuais = obterIntervaloDiasUteis(
        processo.data_inicio_montagem_manual || null,
        processo.data_fim_montagem_manual || null
      );

      const temProducaoManual = datasProducaoManuais.length > 0;
      const temAcabamentoManual = datasAcabamentoManuais.length > 0;
      const temMontagemManual = datasMontagemManuais.length > 0;

      let datasProducao: string[] = [];

      if (temProducaoManual) {
        datasProducao = datasProducaoManuais;
      } else {
        const valor = obterValorFinanceiroProcesso(processo);
        const diasProducao = obterDiasProducaoNecessarios(processo);
        const valorDiario = diasProducao > 0 ? valor / diasProducao : 0;

        let cursor = proximoDiaUtil(hoje);
        let seguranca = 0;

        while (datasProducao.length < diasProducao && seguranca < 1460) {
          const chave = formatarDataISO(cursor);

          if (eDiaUtil(cursor)) {
            const cargaAtual = cargaProducaoPorDia[chave] || 0;
            const novaCarga = cargaAtual + valorDiario;

            if (
              !resumo.objetivoDiario ||
              resumo.objetivoDiario <= 0 ||
              novaCarga <= resumo.objetivoDiario
            ) {
              datasProducao.push(chave);
              cargaProducaoPorDia[chave] = novaCarga;
            }
          }

          cursor.setDate(cursor.getDate() + 1);
          seguranca += 1;
        }
      }

      const fimProducao = datasProducao[datasProducao.length - 1] || null;
      let datasAcabamento: string[] = [];

      if (temAcabamentoManual) {
        datasAcabamento = datasAcabamentoManuais;
      } else if (fimProducao && obterDiasAcabamentoNecessarios(processo) > 0) {
        const inicioAcabamento = parseDateOnly(fimProducao);
        inicioAcabamento.setDate(inicioAcabamento.getDate() + 1);

        datasAcabamento = adicionarDiasUteis(
          inicioAcabamento,
          obterDiasAcabamentoNecessarios(processo)
        );
      }

      const fimAcabamento = datasAcabamento[datasAcabamento.length - 1] || null;

      const datasMontagem = temMontagemManual ? datasMontagemManuais : [];
      const fimMontagem = datasMontagem[datasMontagem.length - 1] || null;

      const dataEntregaCalculada = fimMontagem || fimAcabamento || fimProducao;

      resultado.push({
        processo,
        datasProducao,
        datasAcabamento,
        datasMontagem,
        inicioProducao: datasProducao[0] || null,
        fimProducao,
        inicioAcabamento: datasAcabamento[0] || null,
        fimAcabamento,
        inicioMontagem: datasMontagem[0] || null,
        fimMontagem,
        dataEntregaCalculada,
        temDatasManuais: temProducaoManual || temAcabamentoManual || temMontagemManual,
      });
    }

    return resultado;
  }

  const planeamentos = useMemo<PlaneamentoProcesso[]>(() => {
    return calcularPlaneamentos(processosFiltradosPorArquivo);
  }, [processosFiltradosPorArquivo, resumo.objetivoDiario, bloqueios]);

  const planeamentosVisiveis = useMemo(() => {
    const idsVisiveis = new Set(processosVisiveis.map((processo) => processo.id));
    return planeamentos.filter((item) => idsVisiveis.has(item.processo.id));
  }, [planeamentos, processosVisiveis]);

  const alertas = useMemo<AlertaPlaneamento[]>(() => {
    const lista: AlertaPlaneamento[] = [];

    for (const planeamento of planeamentosVisiveis) {
      if (planeamento.processo.calendario_arquivado) continue;

      const obra = planeamento.processo.nome_obra || "Sem nome";

      const eventos = [
        { titulo: "Começar produção", texto: `${obra} deve começar produção.`, data: planeamento.inicioProducao },
        { titulo: "Produção a terminar", texto: `${obra} termina produção.`, data: planeamento.fimProducao },
        { titulo: "Entra em acabamentos", texto: `${obra} entra em acabamentos.`, data: planeamento.inicioAcabamento },
        { titulo: "Sai de acabamentos", texto: `${obra} sai de acabamentos.`, data: planeamento.fimAcabamento },
        { titulo: "Começar montagem", texto: `${obra} deve começar montagem.`, data: planeamento.inicioMontagem },
        { titulo: "Montagem a terminar", texto: `${obra} termina montagem.`, data: planeamento.fimMontagem },
        { titulo: "Pronto para entrega", texto: `${obra} fica pronto para entrega.`, data: planeamento.dataEntregaCalculada },
      ];

      for (const evento of eventos) {
        if (!evento.data) continue;

        const diasAte = diferencaDias(evento.data);

        if (diasAte < 0 || diasAte > 10) continue;

        lista.push({
          id: `${planeamento.processo.id}-${evento.titulo}-${evento.data}`,
          titulo: evento.titulo,
          texto: evento.texto,
          data: evento.data,
          diasAte,
          nivel: diasAte <= 1 ? "urgente" : diasAte <= 3 ? "breve" : "normal",
          processo: planeamento.processo,
        });
      }
    }

    return lista.sort((a, b) => a.diasAte - b.diasAte);
  }, [planeamentosVisiveis]);

  function obterPlaneamentoProcesso(processoId: string) {
    return planeamentos.find((item) => item.processo.id === processoId) || null;
  }

  function obterPlaneamentosDoDia(data: Date) {
    const chave = formatarDataISO(data);

    return planeamentosVisiveis.filter((item) => {
      if (item.processo.calendario_arquivado && filtroArquivo === "ativas") return false;

      if (tipoCalendario === "producao") return item.datasProducao.includes(chave);
      if (tipoCalendario === "acabamentos") return item.datasAcabamento.includes(chave);
      return item.datasMontagem.includes(chave);
    });
  }

  function obterProcessosDoDia(data: Date) {
    return obterPlaneamentosDoDia(data).map((item) => item.processo);
  }

  function obterValorPrevistoDoDia(data: Date) {
    const bloqueio = obterBloqueioDoDia(data);

    if (tipoCalendario !== "producao") return 0;
    if (eBloqueioManual(data)) return 0;
    if (eFimDeSemana(data) && !eDesbloqueioFimSemana(bloqueio)) return 0;

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
    if (tipoCalendario === "acabamentos") {
      return {
        fundo: "rgba(66,133,244,0.14)",
        borda: "rgba(66,133,244,0.35)",
        texto: "#9fc3ff",
      };
    }

    if (tipoCalendario === "montagens") {
      return {
        fundo: "rgba(156,39,176,0.14)",
        borda: "rgba(186,104,200,0.45)",
        texto: "#e1bee7",
      };
    }

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
        fundo: "rgba(52,168,83,0.20)",
        borda: "rgba(52,168,83,0.55)",
        texto: "#9df5b4",
      };
    }

    if (percentagem >= 0.75) {
      return {
        fundo: "rgba(244,180,0,0.18)",
        borda: "rgba(244,180,0,0.50)",
        texto: "#ffd76c",
      };
    }

    return {
      fundo: "rgba(234,67,53,0.16)",
      borda: "rgba(234,67,53,0.50)",
      texto: "#ff9d9d",
    };
  }

  function obterCoresEstado(estado: string | null) {
    if (tipoCalendario === "montagens") {
      return {
        fundo: "rgba(156,39,176,0.78)",
        borda: "rgba(186,104,200,1)",
      };
    }

    if (tipoCalendario === "acabamentos") {
      return {
        fundo: "rgba(66,133,244,0.78)",
        borda: "rgba(66,133,244,1)",
      };
    }

    if (estado === "Validado") {
      return {
        fundo: "rgba(52,168,83,0.88)",
        borda: "rgba(52,168,83,1)",
      };
    }

    return {
      fundo: "rgba(127,140,141,0.82)",
      borda: "rgba(127,140,141,1)",
    };
  }

  function obterEstiloAlerta(nivel: AlertaPlaneamento["nivel"]) {
    if (nivel === "urgente") {
      return {
        background: "rgba(234,67,53,0.18)",
        border: "1px solid rgba(234,67,53,0.45)",
        color: "#ffb0b0",
      };
    }

    if (nivel === "breve") {
      return {
        background: "rgba(244,180,0,0.16)",
        border: "1px solid rgba(244,180,0,0.40)",
        color: "#ffd76c",
      };
    }

    return {
      background: "rgba(66,133,244,0.14)",
      border: "1px solid rgba(66,133,244,0.35)",
      color: "#9fc3ff",
    };
  }

  function limparFiltros() {
    setPesquisa("");
    setFiltroEstado("Todos");
    setFiltroArquivo("ativas");
  }

  function irMesAnterior() {
    setMesAtual((anterior) => new Date(anterior.getFullYear(), anterior.getMonth() - 1, 1));
  }

  function irMesSeguinte() {
    setMesAtual((anterior) => new Date(anterior.getFullYear(), anterior.getMonth() + 1, 1));
  }

  function irHoje() {
    const hoje = new Date();
    setMesAtual(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  }

  function abrirModalBloqueio(data: Date) {
    const bloqueioExistente = obterBloqueioDoDia(data);

    setDiaSelecionado(data);
    setMotivoBloqueio(
      bloqueioExistente?.motivo === DESBLOQUEIO_FIM_SEMANA
        ? ""
        : bloqueioExistente?.motivo || ""
    );
  }

  function fecharModalBloqueio() {
    setDiaSelecionado(null);
    setMotivoBloqueio("");
  }

  function alternarCartao(processoId: string) {
    setCartoesAbertos((prev) => ({
      ...prev,
      [processoId]: !prev[processoId],
    }));
  }

  async function guardarContactos(processo: ProcessoCalendario) {
    try {
      setProcessoAGuardarContactos(processo.id);
      setMensagem("");

      const valores = contactosEdit[processo.id];

      const payload = {
        responsavel_obra_nome: valores?.responsavel_obra_nome?.trim() || null,
        responsavel_obra_email: valores?.responsavel_obra_email?.trim() || null,
        responsavel_acabamentos_nome: valores?.responsavel_acabamentos_nome?.trim() || null,
        responsavel_acabamentos_email: valores?.responsavel_acabamentos_email?.trim() || null,
        responsavel_montagem_nome: valores?.responsavel_montagem_nome?.trim() || null,
        responsavel_montagem_email: valores?.responsavel_montagem_email?.trim() || null,
        admin_alerta_email: valores?.admin_alerta_email?.trim() || null,
      };

      const { error } = await supabase.from("processos").update(payload).eq("id", processo.id);
      if (error) throw error;

      setProcessos((prev) =>
        prev.map((item) => (item.id === processo.id ? { ...item, ...payload } : item))
      );

      setMensagem("Responsáveis e emails guardados com sucesso.");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao guardar responsáveis e emails.");
    } finally {
      setProcessoAGuardarContactos(null);
    }
  }

  async function guardarDatasManuais(processo: ProcessoCalendario) {
    try {
      setProcessoAGuardarDatas(processo.id);
      setMensagem("");

      const valores = datasManuaisEdit[processo.id];

      const payload = {
        data_inicio_producao_manual: valores?.data_inicio_producao_manual || null,
        data_fim_producao_manual: valores?.data_fim_producao_manual || null,
        data_inicio_acabamento_manual: valores?.data_inicio_acabamento_manual || null,
        data_fim_acabamento_manual: valores?.data_fim_acabamento_manual || null,
        data_inicio_montagem_manual: valores?.data_inicio_montagem_manual || null,
        data_fim_montagem_manual: valores?.data_fim_montagem_manual || null,
      };

      if (
        payload.data_inicio_producao_manual &&
        payload.data_fim_producao_manual &&
        payload.data_inicio_producao_manual > payload.data_fim_producao_manual
      ) {
        setMensagem("A data de início da produção não pode ser depois da data de fim.");
        return;
      }

      if (
        payload.data_inicio_acabamento_manual &&
        payload.data_fim_acabamento_manual &&
        payload.data_inicio_acabamento_manual > payload.data_fim_acabamento_manual
      ) {
        setMensagem("A data de início de acabamentos não pode ser depois da data de fim.");
        return;
      }

      if (
        payload.data_inicio_montagem_manual &&
        payload.data_fim_montagem_manual &&
        payload.data_inicio_montagem_manual > payload.data_fim_montagem_manual
      ) {
        setMensagem("A data de início de montagem não pode ser depois da data de fim.");
        return;
      }

      if (
        payload.data_fim_producao_manual &&
        payload.data_inicio_acabamento_manual &&
        payload.data_inicio_acabamento_manual <= payload.data_fim_producao_manual
      ) {
        setMensagem("Os acabamentos têm de começar depois da produção terminar.");
        return;
      }

      if (
        payload.data_fim_acabamento_manual &&
        payload.data_inicio_montagem_manual &&
        payload.data_inicio_montagem_manual <= payload.data_fim_acabamento_manual
      ) {
        setMensagem("A montagem tem de começar depois dos acabamentos terminarem.");
        return;
      }

      if (
        !payload.data_fim_acabamento_manual &&
        payload.data_fim_producao_manual &&
        payload.data_inicio_montagem_manual &&
        payload.data_inicio_montagem_manual <= payload.data_fim_producao_manual
      ) {
        setMensagem("A montagem tem de começar depois da produção terminar.");
        return;
      }

      const processoAtualizado: ProcessoCalendario = { ...processo, ...payload };
      const planeamentoAtualizado = calcularPlaneamentos(
        processosFiltradosPorArquivo.map((item) =>
          item.id === processo.id ? processoAtualizado : item
        )
      ).find((item) => item.processo.id === processo.id);

      const payloadFinal = {
        ...payload,
        data_entrega_prevista:
          planeamentoAtualizado?.dataEntregaCalculada || processo.data_entrega_prevista,
      };

      const { error } = await supabase.from("processos").update(payloadFinal).eq("id", processo.id);
      if (error) throw error;

      setProcessos((prev) =>
        prev.map((item) => (item.id === processo.id ? { ...item, ...payloadFinal } : item))
      );

      setMensagem("Datas manuais guardadas e entrega recalculada.");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao guardar datas manuais.");
    } finally {
      setProcessoAGuardarDatas(null);
    }
  }

  async function limparDatasManuais(processo: ProcessoCalendario) {
    try {
      setProcessoAGuardarDatas(processo.id);
      setMensagem("");

      const payload = {
        data_inicio_producao_manual: null,
        data_fim_producao_manual: null,
        data_inicio_acabamento_manual: null,
        data_fim_acabamento_manual: null,
        data_inicio_montagem_manual: null,
        data_fim_montagem_manual: null,
      };

      const processoAtualizado: ProcessoCalendario = { ...processo, ...payload };
      const planeamentoAtualizado = calcularPlaneamentos(
        processosFiltradosPorArquivo.map((item) =>
          item.id === processo.id ? processoAtualizado : item
        )
      ).find((item) => item.processo.id === processo.id);

      const payloadFinal = {
        ...payload,
        data_entrega_prevista:
          planeamentoAtualizado?.dataEntregaCalculada || processo.data_entrega_prevista,
      };

      const { error } = await supabase.from("processos").update(payloadFinal).eq("id", processo.id);
      if (error) throw error;

      setDatasManuaisEdit((prev) => ({
        ...prev,
        [processo.id]: {
          data_inicio_producao_manual: "",
          data_fim_producao_manual: "",
          data_inicio_acabamento_manual: "",
          data_fim_acabamento_manual: "",
          data_inicio_montagem_manual: "",
          data_fim_montagem_manual: "",
        },
      }));

      setProcessos((prev) =>
        prev.map((item) => (item.id === processo.id ? { ...item, ...payloadFinal } : item))
      );

      setMensagem("Datas manuais removidas. A obra voltou ao planeamento automático.");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao limpar datas manuais.");
    } finally {
      setProcessoAGuardarDatas(null);
    }
  }

  async function guardarDiasAcabamento(processo: ProcessoCalendario) {
    try {
      setProcessoAGuardarAcabamento(processo.id);
      setMensagem("");

      const valorTexto = (diasAcabamentoEdit[processo.id] || "").trim();
      const diasAcabamento = valorTexto === "" ? 0 : Number(valorTexto.replace(",", "."));

      if (
        Number.isNaN(diasAcabamento) ||
        diasAcabamento < 0 ||
        !Number.isInteger(diasAcabamento)
      ) {
        setMensagem("Introduz um número inteiro válido de dias de acabamento.");
        return;
      }

      const diasFabrico = Number(processo.dias_fabrico_previstos || 0);
      const diasMontagem = Number(processo.dias_montagem_previstos || 0);

      const diasTotais =
        diasFabrico + diasAcabamento + diasMontagem > 0
          ? diasFabrico + diasAcabamento + diasMontagem
          : diasAcabamento;

      const processoAtualizado: ProcessoCalendario = {
        ...processo,
        dias_acabamento_previstos: diasAcabamento,
        dias_totais_previstos: diasTotais,
      };

      const listaAtualizada = processosFiltradosPorArquivo.map((item) =>
        item.id === processo.id ? processoAtualizado : item
      );

      const planeamentoAtualizado = calcularPlaneamentos(listaAtualizada).find(
        (item) => item.processo.id === processo.id
      );

      const payload = {
        dias_acabamento_previstos: diasAcabamento,
        dias_totais_previstos: diasTotais,
        data_entrega_prevista:
          planeamentoAtualizado?.dataEntregaCalculada || processo.data_entrega_prevista,
      };

      const { error } = await supabase.from("processos").update(payload).eq("id", processo.id);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((item) => (item.id === processo.id ? { ...item, ...payload } : item))
      );

      setMensagem("Dias de acabamento guardados e entrega recalculada.");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao guardar dias de acabamento.");
    } finally {
      setProcessoAGuardarAcabamento(null);
    }
  }

  async function arquivarOuRestaurarProcesso(processo: ProcessoCalendario, arquivar: boolean) {
    try {
      setProcessoAArquivar(processo.id);
      setMensagem("");

      const { error } = await supabase
        .from("processos")
        .update({ calendario_arquivado: arquivar })
        .eq("id", processo.id);

      if (error) throw error;

      setProcessos((prev) =>
        prev.map((item) =>
          item.id === processo.id ? { ...item, calendario_arquivado: arquivar } : item
        )
      );

      setMensagem(
        arquivar
          ? "Obra arquivada. Saiu da vista de ativas, mas continua guardada."
          : "Obra restaurada. Voltou à vista de ativas."
      );
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao alterar arquivo da obra.");
    } finally {
      setProcessoAArquivar(null);
    }
  }

  async function enviarAlertasEmail(processo: ProcessoCalendario) {
    try {
      setProcessoAEnviarEmail(processo.id);
      setMensagem("");

      const planeamento = obterPlaneamentoProcesso(processo.id);

      if (!planeamento) {
        setMensagem("Não encontrei planeamento para esta obra.");
        return;
      }

      const emails = [
        processo.responsavel_obra_email,
        processo.responsavel_acabamentos_email,
        processo.responsavel_montagem_email,
        processo.admin_alerta_email,
      ]
        .filter(Boolean)
        .map((email) => String(email).trim());

      if (emails.length === 0) {
        setMensagem("Adiciona pelo menos um email antes de enviar alertas.");
        return;
      }

      const resposta = await fetch("/api/calendario/enviar-alerta-planeamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processoId: processo.id,
          emails,
          obra: processo.nome_obra || "Sem nome",
          cliente: processo.nome_cliente || "—",
          responsavelObra: processo.responsavel_obra_nome || "—",
          responsavelAcabamentos: processo.responsavel_acabamentos_nome || "—",
          responsavelMontagem: processo.responsavel_montagem_nome || "—",
          planeamento: {
            inicioProducao: planeamento.inicioProducao,
            fimProducao: planeamento.fimProducao,
            inicioAcabamento: planeamento.inicioAcabamento,
            fimAcabamento: planeamento.fimAcabamento,
            inicioMontagem: planeamento.inicioMontagem,
            fimMontagem: planeamento.fimMontagem,
            entrega: planeamento.dataEntregaCalculada,
          },
        }),
      });

      const data = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(data?.message || "Erro ao enviar email.");
      }

      setMensagem("Email de alerta enviado com sucesso.");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao enviar email de alerta.");
    } finally {
      setProcessoAEnviarEmail(null);
    }
  }

  async function desbloquearFimSemana() {
    if (!diaSelecionado) return;

    try {
      setAGuardarBloqueio(true);
      setMensagem("");

      const data = formatarDataISO(diaSelecionado);

      const { error } = await supabase.from("bloqueios_calendario").upsert(
        {
          data,
          motivo: DESBLOQUEIO_FIM_SEMANA,
        },
        { onConflict: "data" }
      );

      if (error) throw error;

      setMensagem("Fim de semana desbloqueado com sucesso.");
      fecharModalBloqueio();
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao desbloquear fim de semana.");
    } finally {
      setAGuardarBloqueio(false);
    }
  }

  async function voltarABloquearFimSemana() {
    if (!diaSelecionado) return;

    try {
      setARemoverBloqueio(true);
      setMensagem("");

      const data = formatarDataISO(diaSelecionado);

      const { error } = await supabase
        .from("bloqueios_calendario")
        .delete()
        .eq("data", data)
        .eq("motivo", DESBLOQUEIO_FIM_SEMANA);

      if (error) throw error;

      setMensagem("Fim de semana voltou a ficar bloqueado.");
      fecharModalBloqueio();
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao voltar a bloquear fim de semana.");
    } finally {
      setARemoverBloqueio(false);
    }
  }

  async function guardarBloqueio() {
    if (!diaSelecionado) return;

    try {
      setAGuardarBloqueio(true);
      setMensagem("");

      const data = formatarDataISO(diaSelecionado);

      const { error } = await supabase.from("bloqueios_calendario").upsert(
        {
          data,
          motivo: motivoBloqueio.trim() || "Dia bloqueado manualmente",
        },
        { onConflict: "data" }
      );

      if (error) throw new Error(error.message || "Erro ao guardar bloqueio.");

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

      const { error } = await supabase.from("bloqueios_calendario").delete().eq("data", data);

      if (error) throw new Error(error.message || "Erro ao remover bloqueio.");

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
      const mesNumero = mesAtual.getMonth() + 1;
      const mesIndex = mesAtual.getMonth();

      const diasUteisMes = contarDiasUteisMes(ano, mesIndex);

      const { error } = await supabase.from("metas_faturacao").upsert(
        {
          ano,
          mes: mesNumero,
          objetivo_mensal: valorNumero,
          dias_uteis: diasUteisMes,
        },
        { onConflict: "ano,mes" }
      );

      if (error) throw error;

      setMensagem("Meta mensal guardada com sucesso.");
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao guardar meta mensal.");
    } finally {
      setAGuardarMeta(false);
    }
  }

  const processosDiaSelecionado = diaSelecionado ? obterProcessosDoDia(diaSelecionado) : [];
  const bloqueioDiaSelecionado = diaSelecionado ? obterBloqueioDoDia(diaSelecionado) : null;
  const valorDiaSelecionado = diaSelecionado ? obterValorPrevistoDoDia(diaSelecionado) : 0;
  const diasFinanceirosDiaSelecionado = diaSelecionado ? obterDiasFinanceirosDoDia(diaSelecionado) : 0;
  const diaSelecionadoFimSemana = diaSelecionado ? eFimDeSemana(diaSelecionado) : false;
  const diaSelecionadoFimSemanaDesbloqueado = eDesbloqueioFimSemana(bloqueioDiaSelecionado);

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
          <a href="/admin" style={estilos.menuStyle}>Dashboard</a>
          <a href="/admin/processos" style={estilos.menuStyle}>Processos</a>
          <a href="/admin/clientes" style={estilos.menuStyle}>Clientes</a>
          <a href="/admin/precos" style={estilos.menuStyle}>Preços</a>
          <a href="/admin/financeiro" style={estilos.menuStyle}>Financeiro</a>
          <a href="/admin/calendario" style={{ ...estilos.menuStyle, background: "rgba(255,255,255,0.08)" }}>Calendário</a>
          <a href="/aprovacao-clientes" style={estilos.menuStyle}>Aprovação Clientes</a>
        </div>

        <div style={{ marginTop: "16px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={estilos.contentStyle}>
        <div style={estilos.heroCardStyle}>
          <div>
            <div style={estilos.heroEyebrowStyle}>Planeamento</div>
            <h1 style={{ fontSize: eDesktop ? "40px" : "28px", margin: "6px 0 0 0" }}>
              Calendário
            </h1>
            <p style={estilos.heroTextStyle}>
              Produção, acabamentos, montagens, responsáveis, datas manuais, arquivo e alertas num só painel.
            </p>
          </div>

          <div style={estilos.navegacaoStyle}>
            <button type="button" onClick={irHoje} style={estilos.botaoCalendarioStyle}>Hoje</button>
            <button type="button" onClick={irMesAnterior} style={estilos.botaoCalendarioStyle}>←</button>
            <button type="button" onClick={irMesSeguinte} style={estilos.botaoCalendarioStyle}>→</button>
          </div>
        </div>

        <div style={estilos.tabsStyle}>
          <button
            type="button"
            onClick={() => setTipoCalendario("producao")}
            style={{
              ...estilos.tabStyle,
              ...(tipoCalendario === "producao" ? estilos.tabAtivaStyle : {}),
            }}
          >
            Produção
          </button>

          <button
            type="button"
            onClick={() => setTipoCalendario("acabamentos")}
            style={{
              ...estilos.tabStyle,
              ...(tipoCalendario === "acabamentos" ? estilos.tabAtivaStyle : {}),
            }}
          >
            Acabamentos
          </button>

          <button
            type="button"
            onClick={() => setTipoCalendario("montagens")}
            style={{
              ...estilos.tabStyle,
              ...(tipoCalendario === "montagens" ? estilos.tabAtivaStyle : {}),
            }}
          >
            Montagens
          </button>
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
            onChange={(e) => setFiltroEstado(e.target.value as (typeof ESTADOS_DISPONIVEIS)[number])}
            style={estilos.selectFiltroStyle}
          >
            {ESTADOS_DISPONIVEIS.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>

          <select
            value={filtroArquivo}
            onChange={(e) => setFiltroArquivo(e.target.value as FiltroArquivo)}
            style={estilos.selectFiltroStyle}
          >
            <option value="ativas">Ativas</option>
            <option value="arquivadas">Arquivadas</option>
            <option value="todas">Todas</option>
          </select>

          <button type="button" onClick={limparFiltros} style={estilos.botaoLimparStyle}>
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
            As montagens são reservadas manualmente por obra. As obras arquivadas ficam guardadas, mas saem da vista ativa.
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
                <div style={estilos.resumoNumeroStyle}>{resumo.objetivoMensal.toFixed(2)} €</div>
                <div>Meta mensal</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>{resumo.objetivoDiario.toFixed(2)} €</div>
                <div>Objetivo diário produção</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>{resumo.totalAtivos}</div>
                <div>Obras ativas</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>{resumo.totalArquivados}</div>
                <div>Obras arquivadas</div>
              </div>

              <div style={estilos.resumoCardStyle}>
                <div style={estilos.resumoNumeroStyle}>{resumo.diasUteisReaisAno}</div>
                <div>Dias úteis reais do ano</div>
              </div>
            </div>

            {alertas.length > 0 && (
              <div style={estilos.cardStyle}>
                <h2 style={{ marginTop: 0 }}>Alertas dos próximos 10 dias</h2>

                <div style={estilos.alertasGridStyle}>
                  {alertas.slice(0, 8).map((alerta) => (
                    <div
                      key={alerta.id}
                      style={{
                        ...estilos.alertaCardStyle,
                        ...obterEstiloAlerta(alerta.nivel),
                      }}
                    >
                      <div style={estilos.alertaTituloStyle}>{alerta.titulo}</div>
                      <div style={estilos.alertaTextoStyle}>{alerta.texto}</div>
                      <div style={estilos.alertaDataStyle}>
                        {formatarData(alerta.data)} ·{" "}
                        {alerta.diasAte === 0 ? "hoje" : `em ${alerta.diasAte} dias`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(tipoCalendario === "acabamentos" || tipoCalendario === "montagens") && (
              <div style={estilos.cardStyle}>
                <div style={estilos.tituloComAcoesStyle}>
                  <div>
                    <h2 style={{ marginTop: 0, marginBottom: "6px" }}>
                      {tipoCalendario === "acabamentos"
                        ? "Linha temporal de acabamentos"
                        : "Linha temporal de montagens"}
                    </h2>
                    <p style={{ ...estilos.metaAjudaStyle, marginTop: 0 }}>
                      Os cartões começam minimizados. Abre apenas a obra que queres editar.
                    </p>
                  </div>

                  <div style={estilos.acoesInlineStyle}>
                    <button
                      type="button"
                      onClick={() => {
                        const todosAbertos: Record<string, boolean> = {};
                        planeamentosVisiveis.forEach((item) => {
                          todosAbertos[item.processo.id] = true;
                        });
                        setCartoesAbertos(todosAbertos);
                      }}
                      style={estilos.botaoSecundarioStyle}
                    >
                      Abrir todos
                    </button>

                    <button
                      type="button"
                      onClick={() => setCartoesAbertos({})}
                      style={estilos.botaoSecundarioStyle}
                    >
                      Minimizar todos
                    </button>
                  </div>
                </div>

                <div style={estilos.timelineGridStyle}>
                  {planeamentosVisiveis.length === 0 ? (
                    <div style={estilos.semItensStyle}>Sem obras nesta vista.</div>
                  ) : (
                    planeamentosVisiveis.map((item) => {
                      const estaAberto = cartoesAbertos[item.processo.id] === true;
                      const estaArquivado = item.processo.calendario_arquivado === true;

                      return (
                        <div
                          key={item.processo.id}
                          style={{
                            ...estilos.timelineCardStyle,
                            opacity: estaArquivado ? 0.65 : 1,
                          }}
                        >
                          <div style={estilos.cabecalhoCartaoStyle}>
                            <button
                              type="button"
                              onClick={() => alternarCartao(item.processo.id)}
                              style={estilos.botaoHeaderCartaoStyle}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={estilos.timelineTituloStyle}>
                                  {estaAberto ? "▾" : "▸"} {item.processo.nome_obra || "Sem nome"}
                                </div>
                                <div style={estilos.subtextoStyle}>
                                  Cliente: {item.processo.nome_cliente || "—"}
                                </div>
                              </div>
                            </button>

                            <div style={estilos.badgesWrapStyle}>
                              {item.temDatasManuais && (
                                <div style={estilos.manualBadgeStyle}>Datas manuais</div>
                              )}
                              {estaArquivado && (
                                <div style={estilos.arquivadoBadgeStyle}>Arquivada</div>
                              )}
                              <div style={estilos.timelineBadgeStyle}>
                                {tipoCalendario === "acabamentos"
                                  ? `${item.datasAcabamento.length} dias acab.`
                                  : `${item.datasMontagem.length} dias montagem`}
                              </div>
                            </div>
                          </div>

                          <div style={estilos.timelineDatasStyle}>
                            <span>
                              Prod.: {formatarData(item.inicioProducao)} →{" "}
                              {formatarData(item.fimProducao)}
                            </span>
                            <span>
                              Acab.: {formatarData(item.inicioAcabamento)} →{" "}
                              {formatarData(item.fimAcabamento)}
                            </span>
                            <span>
                              Mont.: {formatarData(item.inicioMontagem)} →{" "}
                              {formatarData(item.fimMontagem)}
                            </span>
                            <span>Entrega: {formatarData(item.dataEntregaCalculada)}</span>
                          </div>

                          <div style={estilos.timelineBarraWrapStyle}>
                            <div
                              style={{
                                ...estilos.timelineBarraStyle,
                                background:
                                  tipoCalendario === "montagens"
                                    ? "linear-gradient(90deg, rgba(156,39,176,0.35), rgba(186,104,200,0.95))"
                                    : "linear-gradient(90deg, rgba(66,133,244,0.35), rgba(66,133,244,0.95))",
                              }}
                            />
                          </div>

                          <div style={estilos.acoesInlineStyle}>
                            <button
                              type="button"
                              onClick={() => alternarCartao(item.processo.id)}
                              style={estilos.botaoSecundarioStyle}
                            >
                              {estaAberto ? "Minimizar" : "Abrir detalhes"}
                            </button>

                            <button
                              type="button"
                              onClick={() => arquivarOuRestaurarProcesso(item.processo, !estaArquivado)}
                              disabled={processoAArquivar === item.processo.id}
                              style={estaArquivado ? estilos.botaoPrincipalStyle : estilos.botaoRemoverStyle}
                            >
                              {processoAArquivar === item.processo.id
                                ? "A guardar..."
                                : estaArquivado
                                ? "Restaurar obra"
                                : "Arquivar obra"}
                            </button>
                          </div>

                          {estaAberto && (
                            <div style={estilos.gestaoGridStyle}>
                              <div style={estilos.editarAcabamentoBoxStyle}>
                                <strong>Responsáveis e emails</strong>

                                <div style={estilos.formGridStyle}>
                                  <input
                                    value={contactosEdit[item.processo.id]?.responsavel_obra_nome || ""}
                                    onChange={(e) =>
                                      setContactosEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          responsavel_obra_nome: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Nome responsável obra"
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <input
                                    value={contactosEdit[item.processo.id]?.responsavel_obra_email || ""}
                                    onChange={(e) =>
                                      setContactosEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          responsavel_obra_email: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Email responsável obra"
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <input
                                    value={contactosEdit[item.processo.id]?.responsavel_acabamentos_nome || ""}
                                    onChange={(e) =>
                                      setContactosEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          responsavel_acabamentos_nome: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Nome responsável acabamentos"
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <input
                                    value={contactosEdit[item.processo.id]?.responsavel_acabamentos_email || ""}
                                    onChange={(e) =>
                                      setContactosEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          responsavel_acabamentos_email: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Email responsável acabamentos"
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <input
                                    value={contactosEdit[item.processo.id]?.responsavel_montagem_nome || ""}
                                    onChange={(e) =>
                                      setContactosEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          responsavel_montagem_nome: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Nome responsável montagem"
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <input
                                    value={contactosEdit[item.processo.id]?.responsavel_montagem_email || ""}
                                    onChange={(e) =>
                                      setContactosEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          responsavel_montagem_email: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Email responsável montagem"
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <input
                                    value={contactosEdit[item.processo.id]?.admin_alerta_email || ""}
                                    onChange={(e) =>
                                      setContactosEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          admin_alerta_email: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Email admin em cópia"
                                    style={estilos.inputFiltroStyle}
                                  />
                                </div>

                                <div style={estilos.acoesInlineStyle}>
                                  <button
                                    type="button"
                                    onClick={() => guardarContactos(item.processo)}
                                    disabled={processoAGuardarContactos === item.processo.id}
                                    style={estilos.botaoPrincipalStyle}
                                  >
                                    {processoAGuardarContactos === item.processo.id
                                      ? "A guardar..."
                                      : "Guardar emails"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => enviarAlertasEmail(item.processo)}
                                    disabled={processoAEnviarEmail === item.processo.id}
                                    style={estilos.botaoSecundarioStyle}
                                  >
                                    {processoAEnviarEmail === item.processo.id
                                      ? "A enviar..."
                                      : "Enviar alerta"}
                                  </button>
                                </div>
                              </div>

                              <div style={estilos.editarAcabamentoBoxStyle}>
                                <strong>Datas manuais do calendário</strong>

                                <div style={estilos.formGridStyle}>
                                  <label style={estilos.smallLabelStyle}>Início produção</label>
                                  <input
                                    type="date"
                                    value={datasManuaisEdit[item.processo.id]?.data_inicio_producao_manual || ""}
                                    onChange={(e) =>
                                      setDatasManuaisEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          data_inicio_producao_manual: e.target.value,
                                        },
                                      }))
                                    }
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <label style={estilos.smallLabelStyle}>Fim produção</label>
                                  <input
                                    type="date"
                                    value={datasManuaisEdit[item.processo.id]?.data_fim_producao_manual || ""}
                                    onChange={(e) =>
                                      setDatasManuaisEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          data_fim_producao_manual: e.target.value,
                                        },
                                      }))
                                    }
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <label style={estilos.smallLabelStyle}>Início acabamentos</label>
                                  <input
                                    type="date"
                                    value={datasManuaisEdit[item.processo.id]?.data_inicio_acabamento_manual || ""}
                                    onChange={(e) =>
                                      setDatasManuaisEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          data_inicio_acabamento_manual: e.target.value,
                                        },
                                      }))
                                    }
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <label style={estilos.smallLabelStyle}>Fim acabamentos</label>
                                  <input
                                    type="date"
                                    value={datasManuaisEdit[item.processo.id]?.data_fim_acabamento_manual || ""}
                                    onChange={(e) =>
                                      setDatasManuaisEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          data_fim_acabamento_manual: e.target.value,
                                        },
                                      }))
                                    }
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <label style={estilos.smallLabelStyle}>Início montagem</label>
                                  <input
                                    type="date"
                                    value={datasManuaisEdit[item.processo.id]?.data_inicio_montagem_manual || ""}
                                    onChange={(e) =>
                                      setDatasManuaisEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          data_inicio_montagem_manual: e.target.value,
                                        },
                                      }))
                                    }
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <label style={estilos.smallLabelStyle}>Fim montagem</label>
                                  <input
                                    type="date"
                                    value={datasManuaisEdit[item.processo.id]?.data_fim_montagem_manual || ""}
                                    onChange={(e) =>
                                      setDatasManuaisEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: {
                                          ...prev[item.processo.id],
                                          data_fim_montagem_manual: e.target.value,
                                        },
                                      }))
                                    }
                                    style={estilos.inputFiltroStyle}
                                  />
                                </div>

                                <div style={estilos.acoesInlineStyle}>
                                  <button
                                    type="button"
                                    onClick={() => guardarDatasManuais(item.processo)}
                                    disabled={processoAGuardarDatas === item.processo.id}
                                    style={estilos.botaoPrincipalStyle}
                                  >
                                    {processoAGuardarDatas === item.processo.id
                                      ? "A guardar..."
                                      : "Guardar datas"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => limparDatasManuais(item.processo)}
                                    disabled={processoAGuardarDatas === item.processo.id}
                                    style={estilos.botaoRemoverStyle}
                                  >
                                    Limpar datas
                                  </button>
                                </div>
                              </div>

                              <div style={estilos.editarAcabamentoBoxStyle}>
                                <strong>Ajustar dias de acabamento</strong>

                                <div style={estilos.editarAcabamentoGridStyle}>
                                  <input
                                    value={diasAcabamentoEdit[item.processo.id] || ""}
                                    onChange={(e) =>
                                      setDiasAcabamentoEdit((prev) => ({
                                        ...prev,
                                        [item.processo.id]: e.target.value,
                                      }))
                                    }
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="Ex: 7"
                                    style={estilos.inputFiltroStyle}
                                  />

                                  <button
                                    type="button"
                                    onClick={() => guardarDiasAcabamento(item.processo)}
                                    disabled={processoAGuardarAcabamento === item.processo.id}
                                    style={estilos.botaoPrincipalStyle}
                                  >
                                    {processoAGuardarAcabamento === item.processo.id
                                      ? "A guardar..."
                                      : "Guardar"}
                                  </button>
                                </div>

                                <div style={estilos.metaAjudaStyle}>
                                  Se a obra não leva acabamento, mete 0 dias. Depois reserva a montagem nas datas manuais.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

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
                  const desbloqueadoFimSemana = eDesbloqueioFimSemana(bloqueio);
                  const hoje = formatarDataISO(new Date()) === dia.chave;
                  const valorDia = obterValorPrevistoDoDia(dia.data);
                  const diasFinanceirosDia = obterDiasFinanceirosDoDia(dia.data);
                  const estiloFinanceiro = obterEstiloFinanceiroDia(valorDia, resumo.objetivoDiario);
                  const limiteEventos = tipoCalendario === "producao" ? (eDesktop ? 3 : 2) : 1;
                  const fimSemana = eFimDeSemana(dia.data);
                  const bloqueadoVisual =
                    eBloqueioManual(dia.data) || (fimSemana && !desbloqueadoFimSemana);

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
                        background: bloqueadoVisual
                          ? "rgba(160,82,45,0.13)"
                          : fimSemana && desbloqueadoFimSemana
                          ? "rgba(52,168,83,0.08)"
                          : "rgba(255,255,255,0.01)",
                        boxShadow: hoje
                          ? "inset 0 0 0 1px rgba(66,133,244,0.4)"
                          : "none",
                      }}
                    >
                      <div style={estilos.topoDiaStyle}>
                        <div
                          style={{
                            ...estilos.numeroDiaStyle,
                            background: hoje ? "rgba(66,133,244,0.95)" : "transparent",
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
                        >
                          {tipoCalendario === "producao"
                            ? `${valorDia.toFixed(0)} €`
                            : tipoCalendario === "acabamentos"
                            ? `${processosDoDia.length} acab.`
                            : `${processosDoDia.length} mont.`}
                        </div>
                      </div>

                      <div style={estilos.eventosDiaStyle}>
                        {bloqueadoVisual && (
                          <div
                            style={{
                              ...estilos.eventoStyle,
                              background: "rgba(160,82,45,0.90)",
                              border: "1px solid rgba(160,82,45,1)",
                            }}
                          >
                            {fimSemana && !eBloqueioManual(dia.data)
                              ? "Fim semana"
                              : "Bloqueado"}
                          </div>
                        )}

                        {fimSemana && desbloqueadoFimSemana && (
                          <div
                            style={{
                              ...estilos.eventoStyle,
                              background: "rgba(52,168,83,0.70)",
                              border: "1px solid rgba(52,168,83,1)",
                            }}
                          >
                            Desbloqueado
                          </div>
                        )}

                        {processosDoDia.length === 0 &&
                        !bloqueadoVisual &&
                        !desbloqueadoFimSemana ? (
                          <div style={estilos.diaVazioStyle}>—</div>
                        ) : (
                          processosDoDia.slice(0, limiteEventos).map((processo) => {
                            const planeamento = obterPlaneamentoProcesso(processo.id);
                            const cores = obterCoresEstado(processo.estado);

                            return (
                              <div
                                key={`${dia.chave}-${processo.id}`}
                                title={`${processo.nome_obra || "Obra"} | Cliente: ${
                                  processo.nome_cliente || "—"
                                }`}
                                style={{
                                  ...estilos.eventoStyle,
                                  background: cores.fundo,
                                  border: `1px solid ${cores.borda}`,
                                }}
                              >
                                {planeamento?.temDatasManuais ? "✎ " : ""}
                                {processo.calendario_arquivado ? "🗄 " : ""}
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
                          {tipoCalendario === "producao"
                            ? `${diasFinanceirosDia.toFixed(2)} dias`
                            : `${processosDoDia.length} obras`}
                        </div>
                        <div style={{ opacity: 0.8 }}>
                          {tipoCalendario === "producao"
                            ? `Meta: ${resumo.objetivoDiario.toFixed(0)} €`
                            : "Ver timeline"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
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
                  <div style={estilos.modalResumoTituloStyle}>Previsto produção</div>
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
                Sábados e domingos ficam bloqueados por defeito. Podes desbloquear este dia se for necessário produzir.
              </p>

              {bloqueioDiaSelecionado && !diaSelecionadoFimSemanaDesbloqueado && (
                <div style={estilos.bloqueioInfoStyle}>
                  <strong>Bloqueio atual:</strong>{" "}
                  {bloqueioDiaSelecionado.motivo || "Sem motivo"}
                </div>
              )}

              {diaSelecionadoFimSemanaDesbloqueado && (
                <div style={estilos.desbloqueioInfoStyle}>
                  <strong>Fim de semana desbloqueado.</strong>
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
                  Processos deste dia ·{" "}
                  {tipoCalendario === "producao"
                    ? "Produção"
                    : tipoCalendario === "acabamentos"
                    ? "Acabamentos"
                    : "Montagens"}
                </h4>

                {processosDiaSelecionado.length === 0 ? (
                  <div style={estilos.semItensStyle}>Sem processos neste dia.</div>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {processosDiaSelecionado.map((processo) => {
                      const planeamento = obterPlaneamentoProcesso(processo.id);

                      return (
                        <div key={processo.id} style={estilos.processoDiaCardStyle}>
                          <div style={{ fontWeight: "bold" }}>
                            {processo.nome_obra || "Sem nome"}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Cliente: {processo.nome_cliente || "—"}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Responsável obra: {processo.responsavel_obra_nome || "—"} ·{" "}
                            {processo.responsavel_obra_email || "sem email"}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Acabamentos: {processo.responsavel_acabamentos_nome || "—"} ·{" "}
                            {processo.responsavel_acabamentos_email || "sem email"}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Montagem: {processo.responsavel_montagem_nome || "—"} ·{" "}
                            {processo.responsavel_montagem_email || "sem email"}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Valor/dia produção: {obterValorDiarioProcesso(processo).toFixed(2)} €
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Produção: {formatarData(planeamento?.inicioProducao || null)} até{" "}
                            {formatarData(planeamento?.fimProducao || null)}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Acabamentos: {formatarData(planeamento?.inicioAcabamento || null)} até{" "}
                            {formatarData(planeamento?.fimAcabamento || null)}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Montagem: {formatarData(planeamento?.inicioMontagem || null)} até{" "}
                            {formatarData(planeamento?.fimMontagem || null)}
                          </div>

                          <div style={estilos.subtextoStyle}>
                            Entrega calculada:{" "}
                            {formatarData(planeamento?.dataEntregaCalculada || null)}
                          </div>

                          {planeamento?.temDatasManuais && (
                            <div style={estilos.manualBadgeStyle}>Esta obra tem datas manuais</div>
                          )}

                          {processo.calendario_arquivado && (
                            <div style={estilos.arquivadoBadgeStyle}>Obra arquivada</div>
                          )}
                        </div>
                      );
                    })}
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

                {diaSelecionadoFimSemana && !diaSelecionadoFimSemanaDesbloqueado && (
                  <button
                    type="button"
                    onClick={desbloquearFimSemana}
                    style={estilos.botaoPrincipalStyle}
                    disabled={aGuardarBloqueio}
                  >
                    {aGuardarBloqueio ? "A desbloquear..." : "Desbloquear fim de semana"}
                  </button>
                )}

                {diaSelecionadoFimSemana && diaSelecionadoFimSemanaDesbloqueado && (
                  <button
                    type="button"
                    onClick={voltarABloquearFimSemana}
                    style={estilos.botaoRemoverStyle}
                    disabled={aRemoverBloqueio}
                  >
                    {aRemoverBloqueio ? "A bloquear..." : "Voltar a bloquear"}
                  </button>
                )}

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
      background: "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
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

    heroCardStyle: {
      width: "100%",
      padding: eDesktop ? "24px" : "18px",
      borderRadius: "20px",
      background: "linear-gradient(180deg, rgba(92,115,199,0.18) 0%, rgba(255,255,255,0.05) 100%)",
      border: "1px solid rgba(255,255,255,0.10)",
      marginBottom: "18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: eDesktop ? "center" : "flex-start",
      flexDirection: eDesktop ? "row" : "column",
      gap: "16px",
    } satisfies CSSProperties,

    heroEyebrowStyle: {
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "1px",
      opacity: 0.72,
      fontWeight: "bold",
    } satisfies CSSProperties,

    heroTextStyle: {
      opacity: 0.82,
      marginTop: "10px",
      lineHeight: 1.4,
      marginBottom: 0,
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

    tabsStyle: {
      display: "flex",
      gap: "10px",
      marginBottom: "16px",
      flexWrap: "wrap",
    } satisfies CSSProperties,

    tabStyle: {
      padding: "12px 16px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      fontWeight: "bold",
      cursor: "pointer",
    } satisfies CSSProperties,

    tabAtivaStyle: {
      background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
      border: "1px solid rgba(255,255,255,0.18)",
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
      gridTemplateColumns: eDesktop ? "1.3fr 0.7fr 0.7fr auto" : "1fr",
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
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
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
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
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
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    } satisfies CSSProperties,

    mensagemStyle: {
      width: "100%",
      marginBottom: "16px",
      padding: "14px 16px",
      borderRadius: "12px",
      background: "rgba(180,50,50,0.18)",
      border: "1px solid rgba(180,50,50,0.35)",
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
      transition: "all 0.2s ease",
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

    subtextoStyle: {
      opacity: 0.8,
      fontSize: "13px",
      marginTop: "4px",
      lineHeight: 1.35,
    } satisfies CSSProperties,

    smallLabelStyle: {
      opacity: 0.8,
      fontSize: "12px",
      fontWeight: "bold",
      marginTop: "4px",
    } satisfies CSSProperties,

    alertasGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop
        ? "repeat(4, minmax(0, 1fr))"
        : eTablet
        ? "repeat(2, minmax(0, 1fr))"
        : "1fr",
      gap: "10px",
    } satisfies CSSProperties,

    alertaCardStyle: {
      padding: "12px",
      borderRadius: "12px",
      minWidth: 0,
    } satisfies CSSProperties,

    alertaTituloStyle: {
      fontWeight: "bold",
      marginBottom: "6px",
    } satisfies CSSProperties,

    alertaTextoStyle: {
      fontSize: "13px",
      lineHeight: 1.35,
      opacity: 0.9,
    } satisfies CSSProperties,

    alertaDataStyle: {
      marginTop: "8px",
      fontSize: "12px",
      fontWeight: "bold",
    } satisfies CSSProperties,

    timelineGridStyle: {
      display: "grid",
      gap: "12px",
      marginTop: "14px",
    } satisfies CSSProperties,

    timelineCardStyle: {
      padding: "14px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.045)",
      border: "1px solid rgba(255,255,255,0.08)",
    } satisfies CSSProperties,

    tituloComAcoesStyle: {
      display: "flex",
      alignItems: eDesktop ? "center" : "stretch",
      justifyContent: "space-between",
      gap: "12px",
      flexDirection: eDesktop ? "row" : "column",
    } satisfies CSSProperties,

    cabecalhoCartaoStyle: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "flex-start",
    } satisfies CSSProperties,

    botaoHeaderCartaoStyle: {
      background: "transparent",
      border: "none",
      color: "white",
      padding: 0,
      textAlign: "left",
      cursor: "pointer",
      flex: 1,
      minWidth: 0,
    } satisfies CSSProperties,

    badgesWrapStyle: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      justifyContent: eDesktop ? "flex-end" : "flex-start",
    } satisfies CSSProperties,

    timelineTituloStyle: {
      fontWeight: "bold",
      fontSize: "16px",
    } satisfies CSSProperties,

    timelineBadgeStyle: {
      padding: "7px 10px",
      borderRadius: "999px",
      background: "rgba(66,133,244,0.18)",
      border: "1px solid rgba(66,133,244,0.35)",
      color: "#9fc3ff",
      fontWeight: "bold",
      fontSize: "12px",
      height: "fit-content",
    } satisfies CSSProperties,

    manualBadgeStyle: {
      display: "inline-block",
      padding: "6px 9px",
      borderRadius: "999px",
      background: "rgba(244,180,0,0.16)",
      border: "1px solid rgba(244,180,0,0.35)",
      color: "#ffd76c",
      fontWeight: "bold",
      fontSize: "12px",
      height: "fit-content",
    } satisfies CSSProperties,

    arquivadoBadgeStyle: {
      display: "inline-block",
      padding: "6px 9px",
      borderRadius: "999px",
      background: "rgba(160,82,45,0.18)",
      border: "1px solid rgba(160,82,45,0.35)",
      color: "#ffc39d",
      fontWeight: "bold",
      fontSize: "12px",
      height: "fit-content",
    } satisfies CSSProperties,

    timelineBarraWrapStyle: {
      marginTop: "12px",
      height: "10px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.08)",
      overflow: "hidden",
    } satisfies CSSProperties,

    timelineBarraStyle: {
      height: "100%",
      width: "100%",
      borderRadius: "999px",
      background: "linear-gradient(90deg, rgba(66,133,244,0.35), rgba(66,133,244,0.95))",
    } satisfies CSSProperties,

    timelineDatasStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "repeat(4, minmax(0, 1fr))" : "1fr",
      gap: "8px",
      marginTop: "10px",
      fontSize: "13px",
      opacity: 0.88,
    } satisfies CSSProperties,

    gestaoGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "1.2fr 1.2fr 0.8fr" : "1fr",
      gap: "12px",
      marginTop: "12px",
    } satisfies CSSProperties,

    editarAcabamentoBoxStyle: {
      marginTop: "12px",
      padding: "12px",
      borderRadius: "10px",
      background: "rgba(66,133,244,0.12)",
      border: "1px solid rgba(66,133,244,0.30)",
      display: "grid",
      gap: "10px",
    } satisfies CSSProperties,

    editarAcabamentoGridStyle: {
      display: "grid",
      gridTemplateColumns: eDesktop ? "1fr auto" : "1fr",
      gap: "10px",
      alignItems: "center",
    } satisfies CSSProperties,

    formGridStyle: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "8px",
    } satisfies CSSProperties,

    acoesInlineStyle: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      alignItems: "center",
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
      maxWidth: "720px",
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
      background: "rgba(160,82,45,0.18)",
      border: "1px solid rgba(160,82,45,0.35)",
    } satisfies CSSProperties,

    desbloqueioInfoStyle: {
      marginTop: "10px",
      marginBottom: "14px",
      padding: "12px",
      borderRadius: "10px",
      background: "rgba(52,168,83,0.16)",
      border: "1px solid rgba(52,168,83,0.35)",
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
      flexWrap: "wrap",
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