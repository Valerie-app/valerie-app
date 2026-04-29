"use client";

import {
  Suspense,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const STORAGE_KEY = "valerie_novo_orcamento";

type DadosMovelTV = {
  nomeArtigo: string;
  largura: string;
  altura: string;
  profundidade: string;
  numeroPortas: string;
  numeroGavetas: string;
  numeroNichos: string;
  led: string;
  acabamento: string;
  suspenso: string;
  painelRipado: string;
  embalagem: string;
  montagem: string;
  kmIda: string;
  kmRegresso: string;
  tempoMontagem: string;
  numeroPessoas: string;
  outrosAcessorios: string;
};

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

const menuCliente = [
  { label: "Dashboard", path: "/dashboard-cliente" },
  { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
  { label: "Processos", path: "/processos-cliente" },
  { label: "Perfil", path: "/perfil-cliente" },
];

export default function MovelTVPage() {
  return (
    <Suspense fallback={<main style={mainStyle}>A carregar...</main>}>
      <MovelTVConteudo />
    </Suspense>
  );
}

function MovelTVConteudo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editarId = searchParams.get("editar");

  const [nomeArtigo, setNomeArtigo] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [profundidade, setProfundidade] = useState("");
  const [numeroPortas, setNumeroPortas] = useState("");
  const [numeroGavetas, setNumeroGavetas] = useState("");
  const [numeroNichos, setNumeroNichos] = useState("");
  const [led, setLed] = useState("Não");
  const [acabamento, setAcabamento] = useState("");
  const [suspenso, setSuspenso] = useState("Não");
  const [painelRipado, setPainelRipado] = useState("Não");
  const [embalagem, setEmbalagem] = useState("");
  const [montagem, setMontagem] = useState("Não");
  const [kmIda, setKmIda] = useState("");
  const [kmRegresso, setKmRegresso] = useState("");
  const [tempoMontagem, setTempoMontagem] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState("");
  const [outrosAcessorios, setOutrosAcessorios] = useState("");

  function criarResumo(d: DadosMovelTV) {
    return `${d.largura || "—"} x ${d.altura || "—"} x ${
      d.profundidade || "—"
    } cm • ${d.numeroPortas || "0"} portas • ${
      d.numeroGavetas || "0"
    } gavetas • LED: ${d.led}`;
  }

  useEffect(() => {
    if (!editarId) return;

    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return;

    const dados: DadosOrcamento = JSON.parse(guardado);
    const artigo = dados.artigos.find((a) => String(a.id) === editarId);

    if (!artigo || !artigo.dados) return;

    const d = artigo.dados as DadosMovelTV;

    setNomeArtigo(d.nomeArtigo || "");
    setLargura(d.largura || "");
    setAltura(d.altura || "");
    setProfundidade(d.profundidade || "");
    setNumeroPortas(d.numeroPortas || "");
    setNumeroGavetas(d.numeroGavetas || "");
    setNumeroNichos(d.numeroNichos || "");
    setLed(d.led || "Não");
    setAcabamento(d.acabamento || "");
    setSuspenso(d.suspenso || "Não");
    setPainelRipado(d.painelRipado || "Não");
    setEmbalagem(d.embalagem || "");
    setMontagem(d.montagem || "Não");
    setKmIda(d.kmIda || "");
    setKmRegresso(d.kmRegresso || "");
    setTempoMontagem(d.tempoMontagem || "");
    setNumeroPessoas(d.numeroPessoas || "");
    setOutrosAcessorios(d.outrosAcessorios || "");
  }, [editarId]);

  function guardar() {
    const dados: DadosMovelTV = {
      nomeArtigo,
      largura,
      altura,
      profundidade,
      numeroPortas,
      numeroGavetas,
      numeroNichos,
      led,
      acabamento,
      suspenso,
      painelRipado,
      embalagem,
      montagem,
      kmIda,
      kmRegresso,
      tempoMontagem,
      numeroPessoas,
      outrosAcessorios,
    };

    const guardado = localStorage.getItem(STORAGE_KEY);
    const orcamento: DadosOrcamento = guardado
      ? JSON.parse(guardado)
      : {
          nomeCliente: "",
          nomeObra: "",
          localizacao: "",
          observacoes: "",
          artigos: [],
        };

    const resumo = criarResumo(dados);

    if (editarId) {
      orcamento.artigos = orcamento.artigos.map((a) =>
        String(a.id) === editarId ? { ...a, nome: nomeArtigo, resumo, dados } : a
      );
    } else {
      orcamento.artigos.push({
        id: Date.now(),
        tipo: "Móvel TV",
        nome: nomeArtigo || "Móvel TV",
        resumo,
        dados,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamento));
    router.push("/novo-orcamento-cliente");
  }

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          {menuCliente.map((item) => (
            <button
              key={item.path}
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
          <LogoutButton label="Sair" />
        </div>
      </aside>

      <section style={{ flex: 1, padding: 40 }}>
        <h1>{editarId ? "Editar" : "Novo"} Móvel TV</h1>

        <input
          placeholder="Nome"
          value={nomeArtigo}
          onChange={(e) => setNomeArtigo(e.target.value)}
          style={inputStyle}
        />

        <button onClick={guardar} style={botaoStyle}>
          Guardar
        </button>
      </section>
    </main>
  );
}

/* estilos */
const mainStyle: CSSProperties = { display: "flex", minHeight: "100vh", background: "#1f2540", color: "white" };
const asideStyle: CSSProperties = { width: "250px", padding: 20, background: "#171c33" };
const logoStyle: CSSProperties = { fontSize: 28, marginBottom: 20 };
const menuContainerStyle: CSSProperties = { display: "grid", gap: 10 };
const menuStyle: CSSProperties = { padding: 10, background: "#2c355f", color: "white", border: "none", cursor: "pointer" };
const menuActiveStyle: CSSProperties = { background: "#5c73c7" };
const inputStyle: CSSProperties = { display: "block", marginBottom: 10, padding: 10 };
const botaoStyle: CSSProperties = { padding: 10, background: "#5c73c7", border: "none", color: "white" };