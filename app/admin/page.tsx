"use client";

import { useEffect, useState } from "react";

type Gamas = {
  "Gama Baixa": number;
  "Gama Média": number;
  "Gama Alta": number;
};

type Config = {
  precoMetroLinear: {
    Cozinha: Gamas;
    Roupeiro: Gamas;
    WC: Gamas;
    "Movel TV": Gamas;
  };
  precoKm: number;
  margem: number;
  montagemPorHomem: number;
  dobradica: number;
  corredica: number;
  ledMetro: number;
  transportePorMetro: number;
  alojamentoPorNoite: number;
  vooPorPessoa: number;
  tirPorMetro: number;
  materiais: Record<string, number>;
  artigosExtras: Record<string, number>;
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
    />
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function CampoNumero({
  titulo,
  descricao,
  valor,
  onChange,
  step,
}: {
  titulo: string;
  descricao?: string;
  valor: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{titulo}</label>
      {descricao ? <p className="mb-2 mt-1 text-xs text-slate-500">{descricao}</p> : <div className="mb-2" />}
      <Input
        type="number"
        step={step}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function BlocoProjeto({
  nome,
  gamas,
  onChange,
}: {
  nome: string;
  gamas: Gamas;
  onChange: (gama: keyof Gamas, value: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{nome}</h3>

      <div className="grid gap-4 md:grid-cols-3">
        <CampoNumero
          titulo="Gama Baixa"
          descricao="Preço por metro linear."
          valor={gamas["Gama Baixa"]}
          onChange={(v) => onChange("Gama Baixa", v)}
        />

        <CampoNumero
          titulo="Gama Média"
          descricao="Preço por metro linear."
          valor={gamas["Gama Média"]}
          onChange={(v) => onChange("Gama Média", v)}
        />

        <CampoNumero
          titulo="Gama Alta"
          descricao="Preço por metro linear."
          valor={gamas["Gama Alta"]}
          onChange={(v) => onChange("Gama Alta", v)}
        />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function updateField(path: string, value: number) {
    if (!config) return;

    const novo = structuredClone(config) as Record<string, any>;
    const keys = path.split(".");
    let current: Record<string, any> = novo;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setConfig(novo as Config);
  }

  async function guardar() {
    if (!config) return;

    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      alert("Erro ao guardar configuração.");
      return;
    }

    alert("Configuração guardada com sucesso.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-sm">
          A carregar painel admin...
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-sm">
          Erro ao carregar configuração.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm">
              Valerie • Painel Admin
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Configuração de preços
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
              Define os preços por projeto e por gama, além dos restantes custos
              gerais, materiais e artigos extra.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card
            title="Preço por metro linear"
            subtitle="Cada projeto tem as suas 3 gamas para colocares o valor por metro."
          >
            <div className="space-y-5">
              <BlocoProjeto
                nome="Cozinha"
                gamas={config.precoMetroLinear.Cozinha}
                onChange={(gama, value) =>
                  updateField(`precoMetroLinear.Cozinha.${gama}`, value)
                }
              />

              <BlocoProjeto
                nome="Roupeiro"
                gamas={config.precoMetroLinear.Roupeiro}
                onChange={(gama, value) =>
                  updateField(`precoMetroLinear.Roupeiro.${gama}`, value)
                }
              />

              <BlocoProjeto
                nome="WC"
                gamas={config.precoMetroLinear.WC}
                onChange={(gama, value) =>
                  updateField(`precoMetroLinear.WC.${gama}`, value)
                }
              />

              <BlocoProjeto
                nome="Movel TV"
                gamas={config.precoMetroLinear["Movel TV"]}
                onChange={(gama, value) =>
                  updateField(`precoMetroLinear.Movel TV.${gama}`, value)
                }
              />
            </div>
          </Card>

          <Card
            title="Custos gerais"
            subtitle="Custos de produção, logística e margem comercial."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <CampoNumero
                titulo="Preço por KM (€)"
                descricao="Custo por quilómetro usado na deslocação."
                valor={config.precoKm}
                onChange={(v) => updateField("precoKm", v)}
                step="0.01"
              />

              <CampoNumero
                titulo="Margem (%)"
                descricao="Percentagem aplicada ao subtotal. Ex: 0.5 = 50%."
                valor={config.margem}
                onChange={(v) => updateField("margem", v)}
                step="0.01"
              />

              <CampoNumero
                titulo="Montagem por homem (€)"
                descricao="Valor de montagem por trabalhador."
                valor={config.montagemPorHomem}
                onChange={(v) => updateField("montagemPorHomem", v)}
              />

              <CampoNumero
                titulo="LED por metro (€)"
                descricao="Preço por metro linear de LED."
                valor={config.ledMetro}
                onChange={(v) => updateField("ledMetro", v)}
              />

              <CampoNumero
                titulo="Dobradiça (€)"
                descricao="Preço unitário de cada dobradiça."
                valor={config.dobradica}
                onChange={(v) => updateField("dobradica", v)}
              />

              <CampoNumero
                titulo="Corrediça (€)"
                descricao="Preço unitário de cada corrediça."
                valor={config.corredica}
                onChange={(v) => updateField("corredica", v)}
              />

              <CampoNumero
                titulo="Transporte por metro (€)"
                descricao="Custo de transporte por metro linear."
                valor={config.transportePorMetro}
                onChange={(v) => updateField("transportePorMetro", v)}
              />

              <CampoNumero
                titulo="Alojamento por noite (€)"
                descricao="Custo por noite em deslocações com pernoita."
                valor={config.alojamentoPorNoite}
                onChange={(v) => updateField("alojamentoPorNoite", v)}
              />

              <CampoNumero
                titulo="Voo por pessoa (€)"
                descricao="Valor médio por pessoa em viagens de avião."
                valor={config.vooPorPessoa}
                onChange={(v) => updateField("vooPorPessoa", v)}
              />

              <CampoNumero
                titulo="Transporte TIR (€)"
                descricao="Custo de transporte TIR por metro linear."
                valor={config.tirPorMetro}
                onChange={(v) => updateField("tirPorMetro", v)}
              />
            </div>
          </Card>

          <Card
            title="Materiais"
            subtitle="Tabela de preços dos materiais usados no cálculo."
          >
            <div className="grid gap-5 md:grid-cols-2">
              {Object.entries(config.materiais).map(([nome, valor]) => (
                <CampoNumero
                  key={nome}
                  titulo={nome}
                  descricao={`Preço do material: ${nome}.`}
                  valor={valor}
                  onChange={(v) => updateField(`materiais.${nome}`, v)}
                />
              ))}
            </div>
          </Card>

          <Card
            title="Artigos extra"
            subtitle="Tabela de preços dos extras adicionais."
          >
            <div className="grid gap-5 md:grid-cols-2">
              {Object.entries(config.artigosExtras).map(([nome, valor]) => (
                <CampoNumero
                  key={nome}
                  titulo={nome}
                  descricao={`Preço unitário do artigo extra: ${nome}.`}
                  valor={valor}
                  onChange={(v) => updateField(`artigosExtras.${nome}`, v)}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button
            onClick={guardar}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Guardar alterações
          </button>

          <a
            href="/"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voltar ao orçamento
          </a>
        </div>
      </div>
    </main>
  );
}