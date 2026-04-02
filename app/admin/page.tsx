"use client";

import { useEffect, useState } from "react";

type Config = {
  precoMetroLinear: {
    Cozinha: number;
    Roupeiro: number;
    WC: number;
    "Movel TV": number;
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
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

    const novo = structuredClone(config) as any;
    const keys = path.split(".");
    let current = novo;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setConfig(novo);
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
              Altera preços, margem, km, materiais e artigos extra sem mexer no código.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Preço por metro linear">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="number"
                value={config.precoMetroLinear.Cozinha}
                onChange={(e) =>
                  updateField("precoMetroLinear.Cozinha", Number(e.target.value))
                }
                placeholder="Cozinha"
              />
              <Input
                type="number"
                value={config.precoMetroLinear.Roupeiro}
                onChange={(e) =>
                  updateField("precoMetroLinear.Roupeiro", Number(e.target.value))
                }
                placeholder="Roupeiro"
              />
              <Input
                type="number"
                value={config.precoMetroLinear.WC}
                onChange={(e) =>
                  updateField("precoMetroLinear.WC", Number(e.target.value))
                }
                placeholder="WC"
              />
              <Input
                type="number"
                value={config.precoMetroLinear["Movel TV"]}
                onChange={(e) =>
                  updateField("precoMetroLinear.Movel TV", Number(e.target.value))
                }
                placeholder="Movel TV"
              />
            </div>
          </Card>

          <Card title="Custos gerais">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="number"
                value={config.precoKm}
                onChange={(e) => updateField("precoKm", Number(e.target.value))}
                placeholder="Preço KM"
              />
              <Input
                type="number"
                step="0.01"
                value={config.margem}
                onChange={(e) => updateField("margem", Number(e.target.value))}
                placeholder="Margem"
              />
              <Input
                type="number"
                value={config.montagemPorHomem}
                onChange={(e) =>
                  updateField("montagemPorHomem", Number(e.target.value))
                }
                placeholder="Montagem por homem"
              />
              <Input
                type="number"
                value={config.ledMetro}
                onChange={(e) => updateField("ledMetro", Number(e.target.value))}
                placeholder="LED por metro"
              />
              <Input
                type="number"
                value={config.dobradica}
                onChange={(e) => updateField("dobradica", Number(e.target.value))}
                placeholder="Dobradiça"
              />
              <Input
                type="number"
                value={config.corredica}
                onChange={(e) => updateField("corredica", Number(e.target.value))}
                placeholder="Corrediça"
              />
              <Input
                type="number"
                value={config.transportePorMetro}
                onChange={(e) =>
                  updateField("transportePorMetro", Number(e.target.value))
                }
                placeholder="Transporte por metro"
              />
              <Input
                type="number"
                value={config.alojamentoPorNoite}
                onChange={(e) =>
                  updateField("alojamentoPorNoite", Number(e.target.value))
                }
                placeholder="Alojamento por noite"
              />
              <Input
                type="number"
                value={config.vooPorPessoa}
                onChange={(e) => updateField("vooPorPessoa", Number(e.target.value))}
                placeholder="Voo por pessoa"
              />
              <Input
                type="number"
                value={config.tirPorMetro}
                onChange={(e) => updateField("tirPorMetro", Number(e.target.value))}
                placeholder="TIR por metro"
              />
            </div>
          </Card>

          <Card title="Materiais">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(config.materiais).map(([nome, valor]) => (
                <Input
                  key={nome}
                  type="number"
                  value={valor}
                  onChange={(e) =>
                    updateField(`materiais.${nome}`, Number(e.target.value))
                  }
                  placeholder={nome}
                />
              ))}
            </div>
          </Card>

          <Card title="Artigos extra">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(config.artigosExtras).map(([nome, valor]) => (
                <Input
                  key={nome}
                  type="number"
                  value={valor}
                  onChange={(e) =>
                    updateField(`artigosExtras.${nome}`, Number(e.target.value))
                  }
                  placeholder={nome}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <button
            onClick={guardar}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Guardar alterações
          </button>
        </div>
      </div>
    </main>
  );
}