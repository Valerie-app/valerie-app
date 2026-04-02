"use client";

import { useMemo, useState } from "react";
import { getListaArtigosExtras } from "@/lib/tabelaprecos";

type ArtigoAdicional = {
  descricao: string;
  quantidade: number;
  preco_unitario: number;
};

type Analise = {
  cliente: string;
  referencia: string;
  tipo_cliente: string;
  local_obra: string;
  km_calculados?: number;
  tipo_projeto: string;
  tipo_gama: string;
  medida_linear_m: number;
  material_1: string;
  material_2: string;
  tem_moveis_superiores?: boolean;
  qtd_dobradicas: number;
  qtd_corredicas: number;
  led: "Sim" | "Não";
  metros_led: number;
  montagem_homens: number;
  deslocacao_km: number;
  transporte_tir_mlinear: number;
  alojamento_noites: number;
  voos_pessoas: number;
  margem_percentual: number;
  quer_montagem?: boolean;
  precisa_transporte?: boolean;
  precisa_voos?: boolean;
  precisa_tir?: boolean;
  quer_led?: boolean;
  quer_material_1?: boolean;
  quer_material_2?: boolean;
  artigos_adicionais?: ArtigoAdicional[];
};

type Orcamento = {
  precoMetroLinear?: number;
  baseMetroLinear?: number;
  metrosMaterialCalculado?: number;
  material1Extra?: number;
  material2Extra?: number;
  dobradicas?: number;
  corredicas?: number;
  led?: number;
  montagem?: number;
  kmFaturados?: number;
  deslocacao?: number;
  transporte?: number;
  alojamento?: number;
  voos?: number;
  tir?: number;
  totalArtigosAdicionais?: number;
  subtotal?: number;
  valorMargem?: number;
  total?: number;
};

const initialForm = {
  cliente: "",
  referencia: "",
  tipo_cliente: "Particular",
  local_obra: "",
  km_calculados: 0,
  quer_montagem: true,
  precisa_transporte: false,
  precisa_voos: false,
  precisa_tir: false,
  quer_led: false,
  quer_material_1: true,
  quer_material_2: true,
};

function Card({
  title,
  subtitle,
  children,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {rightSlot}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-slate-700">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
    />
  );
}

function CheckTile({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
        highlight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"
      }`}
    >
      <span className={highlight ? "font-medium" : "text-sm"}>{label}</span>
      <span className={highlight ? "text-lg font-semibold" : "text-sm font-semibold"}>
        {value}
      </span>
    </div>
  );
}

function formatMoney(value?: number) {
  return `€ ${(value ?? 0).toFixed(2)}`;
}

export default function Page() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const listaArtigos = useMemo(() => getListaArtigosExtras(), []);

  function calcularKmManual(valor: string) {
    const km = Number(valor);
    if (isNaN(km)) return;

    setForm((prev) => ({ ...prev, km_calculados: km }));
    setAnalise((prev) => (prev ? { ...prev, km_calculados: km } : prev));
  }

  function criarArtigoVazio(): ArtigoAdicional {
    const primeiro = listaArtigos[0];
    return {
      descricao: primeiro?.descricao || "",
      quantidade: 1,
      preco_unitario: primeiro?.preco_unitario || 0,
    };
  }

  function adicionarArtigoAdicional() {
    setAnalise((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        artigos_adicionais: [...(prev.artigos_adicionais || []), criarArtigoVazio()],
      };
    });
  }

  function removerArtigoAdicional(index: number) {
    setAnalise((prev) => {
      if (!prev) return prev;
      const novaLista = [...(prev.artigos_adicionais || [])];
      novaLista.splice(index, 1);
      return { ...prev, artigos_adicionais: novaLista };
    });
  }

  function atualizarArtigoAdicional(
    index: number,
    campo: keyof ArtigoAdicional,
    valor: string
  ) {
    setAnalise((prev) => {
      if (!prev) return prev;

      const novaLista = [...(prev.artigos_adicionais || [])];
      const artigo = { ...novaLista[index] };

      if (campo === "descricao") {
        artigo.descricao = valor;
        const encontrado = listaArtigos.find((a) => a.descricao === valor);
        if (encontrado) artigo.preco_unitario = encontrado.preco_unitario;
      } else if (campo === "quantidade") {
        artigo.quantidade = Number(valor) || 0;
      } else if (campo === "preco_unitario") {
        artigo.preco_unitario = Number(valor) || 0;
      }

      novaLista[index] = artigo;
      return { ...prev, artigos_adicionais: novaLista };
    });
  }

  async function gerarOrcamento() {
    if (!file) {
      setError("Carrega uma imagem primeiro.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalise(null);
    setOrcamento(null);

    try {
      const data = new FormData();
      data.append("imagem", file);
      data.append("cliente", form.cliente);
      data.append("referencia", form.referencia);
      data.append("tipo_cliente", form.tipo_cliente);
      data.append("local_obra", form.local_obra);
      data.append("km_calculados", String(form.km_calculados));
      data.append("quer_montagem", String(form.quer_montagem));
      data.append("precisa_transporte", String(form.precisa_transporte));
      data.append("precisa_voos", String(form.precisa_voos));
      data.append("precisa_tir", String(form.precisa_tir));
      data.append("quer_led", String(form.quer_led));
      data.append("quer_material_1", String(form.quer_material_1));
      data.append("quer_material_2", String(form.quer_material_2));

      const analiseRes = await fetch("/api/orcamentos/analisar", {
        method: "POST",
        body: data,
      });

      if (!analiseRes.ok) {
        throw new Error("Falha ao analisar imagem.");
      }

      const analiseJson: Analise = await analiseRes.json();

      setAnalise({
        ...analiseJson,
        artigos_adicionais: [],
      });

      const calculoRes = await fetch("/api/orcamentos/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...analiseJson,
          artigos_adicionais: [],
        }),
      });

      if (!calculoRes.ok) {
        throw new Error("Falha ao calcular orçamento.");
      }

      const calculoJson: Orcamento = await calculoRes.json();
      setOrcamento(calculoJson);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  function atualizarAnalise(campo: keyof Analise, valor: string | boolean) {
    setAnalise((prev) => {
      if (!prev) return prev;

      const numeroCampos: (keyof Analise)[] = [
        "medida_linear_m",
        "qtd_dobradicas",
        "qtd_corredicas",
        "metros_led",
        "montagem_homens",
        "deslocacao_km",
        "transporte_tir_mlinear",
        "alojamento_noites",
        "voos_pessoas",
        "margem_percentual",
        "km_calculados",
      ];

      const booleanCampos: (keyof Analise)[] = [
        "quer_montagem",
        "precisa_transporte",
        "precisa_voos",
        "precisa_tir",
        "quer_led",
        "quer_material_1",
        "quer_material_2",
        "tem_moveis_superiores",
      ];

      return {
        ...prev,
        [campo]: numeroCampos.includes(campo)
          ? Number(valor)
          : booleanCampos.includes(campo)
          ? Boolean(valor)
          : valor,
      };
    });
  }

  async function recalcular() {
    if (!analise) return;

    setLoading(true);
    setError("");

    try {
      const calculoRes = await fetch("/api/orcamentos/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analise),
      });

      if (!calculoRes.ok) {
        throw new Error("Falha ao recalcular orçamento.");
      }

      const calculoJson: Orcamento = await calculoRes.json();
      setOrcamento(calculoJson);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no recálculo.");
    } finally {
      setLoading(false);
    }
  }

  async function guardarOrcamento() {
    try {
      if (!orcamento || !analise) {
        alert("Nada para guardar.");
        return;
      }

      const res = await fetch("/api/orcamentos/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analise, orcamento }),
      });

      if (!res.ok) throw new Error("Erro ao guardar");
      alert("Orçamento guardado com sucesso.");
    } catch {
      alert("Erro ao guardar orçamento.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm">
              Valerie • Sistema de Orçamentos
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Orçamentação profissional com análise por imagem
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
              Cria orçamentos com um visual limpo, ajusta materiais, transporte,
              montagem e extras, e apresenta um resultado final com aspeto comercial.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <Card
              title="Novo orçamento"
              subtitle="Preenche os dados principais do projeto e envia a imagem."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Cliente</Label>
                  <Input
                    placeholder="Nome do cliente"
                    value={form.cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Referência</Label>
                  <Input
                    placeholder="Referência interna"
                    value={form.referencia}
                    onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Tipo de cliente</Label>
                  <Select
                    value={form.tipo_cliente}
                    onChange={(e) => setForm({ ...form, tipo_cliente: e.target.value })}
                  >
                    <option>Particular</option>
                    <option>Profissional</option>
                    <option>Revenda</option>
                  </Select>
                </div>

                <div>
                  <Label>Local da obra</Label>
                  <Input
                    placeholder="Morada / local da obra"
                    value={form.local_obra}
                    onChange={(e) => setForm({ ...form, local_obra: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>KM até obra (ida)</Label>
                  <Input
                    placeholder="Ex: 45"
                    value={form.km_calculados}
                    onChange={(e) => calcularKmManual(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Opções do projeto
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                    Configuração rápida
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <CheckTile
                    checked={form.quer_material_1}
                    onChange={(v) => setForm({ ...form, quer_material_1: v })}
                    label="Usar Material 1"
                  />
                  <CheckTile
                    checked={form.quer_material_2}
                    onChange={(v) => setForm({ ...form, quer_material_2: v })}
                    label="Usar Material 2"
                  />
                  <CheckTile
                    checked={form.quer_montagem}
                    onChange={(v) => setForm({ ...form, quer_montagem: v })}
                    label="Quero montagem"
                  />
                  <CheckTile
                    checked={form.precisa_transporte}
                    onChange={(v) => setForm({ ...form, precisa_transporte: v })}
                    label="Precisa de transporte"
                  />
                  <CheckTile
                    checked={form.precisa_voos}
                    onChange={(v) => setForm({ ...form, precisa_voos: v })}
                    label="Precisa de voos"
                  />
                  <CheckTile
                    checked={form.precisa_tir}
                    onChange={(v) => setForm({ ...form, precisa_tir: v })}
                    label="Precisa de transporte TIR"
                  />
                  <div className="md:col-span-2">
                    <CheckTile
                      checked={form.quer_led}
                      onChange={(v) => setForm({ ...form, quer_led: v })}
                      label="Quero LED"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label>Imagem do projeto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <button
                  onClick={gerarOrcamento}
                  disabled={loading}
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "A gerar..." : "Gerar orçamento"}
                </button>

                <button
                  onClick={recalcular}
                  disabled={!analise || loading}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Recalcular
                </button>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </Card>

            {analise && (
              <Card
                title="Validação da análise"
                subtitle="Corrige ou confirma os dados extraídos antes de fechar o valor."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(analise).map(([key, value]) => {
                    const booleanCampos = [
                      "quer_montagem",
                      "precisa_transporte",
                      "precisa_voos",
                      "precisa_tir",
                      "quer_led",
                      "quer_material_1",
                      "quer_material_2",
                      "tem_moveis_superiores",
                    ];

                    if (key === "artigos_adicionais") return null;

                    if (booleanCampos.includes(key)) {
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) =>
                              atualizarAnalise(key as keyof Analise, e.target.checked)
                            }
                          />
                          <span className="text-sm font-medium text-slate-700">{key}</span>
                        </label>
                      );
                    }

                    return (
                      <div key={key}>
                        <Label>{key}</Label>
                        <Input
                          value={String(value)}
                          onChange={(e) =>
                            atualizarAnalise(key as keyof Analise, e.target.value)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {analise && (
              <Card
                title="Artigos adicionais"
                subtitle="Inclui extras que não venham diretamente da análise da imagem."
                rightSlot={
                  <button
                    type="button"
                    onClick={adicionarArtigoAdicional}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    + Adicionar artigo
                  </button>
                }
              >
                <div className="space-y-4">
                  {(analise.artigos_adicionais || []).map((artigo, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4"
                    >
                      <div>
                        <Label>Artigo</Label>
                        <Select
                          value={artigo.descricao}
                          onChange={(e) =>
                            atualizarArtigoAdicional(index, "descricao", e.target.value)
                          }
                        >
                          {listaArtigos.map((item) => (
                            <option key={item.descricao} value={item.descricao}>
                              {item.descricao}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          value={artigo.quantidade}
                          onChange={(e) =>
                            atualizarArtigoAdicional(index, "quantidade", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label>Preço unitário</Label>
                        <Input
                          type="number"
                          value={artigo.preco_unitario}
                          onChange={(e) =>
                            atualizarArtigoAdicional(index, "preco_unitario", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removerArtigoAdicional(index)}
                          className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}

                  {(analise.artigos_adicionais || []).length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Ainda não existem artigos adicionais neste orçamento.
                    </div>
                  ) : null}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card
              title="Resumo financeiro"
              subtitle="Leitura clara e profissional dos valores do orçamento."
            >
              {!orcamento ? (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                  O resumo financeiro aparece aqui depois de gerar o orçamento.
                </div>
              ) : (
                <div className="space-y-3">
                  <StatRow label="Preço metro linear" value={formatMoney(orcamento.precoMetroLinear)} />
                  <StatRow label="Base metro linear" value={formatMoney(orcamento.baseMetroLinear)} />
                  <StatRow
                    label="Metros material calculado"
                    value={String(orcamento.metrosMaterialCalculado ?? 0)}
                  />
                  <StatRow label="Material 1" value={formatMoney(orcamento.material1Extra)} />
                  <StatRow label="Material 2" value={formatMoney(orcamento.material2Extra)} />
                  <StatRow label="Dobradiças" value={formatMoney(orcamento.dobradicas)} />
                  <StatRow label="Corrediças" value={formatMoney(orcamento.corredicas)} />
                  <StatRow label="LED" value={formatMoney(orcamento.led)} />
                  <StatRow label="Montagem" value={formatMoney(orcamento.montagem)} />
                  <StatRow label="KM faturados" value={`${orcamento.kmFaturados ?? 0} km`} />
                  <StatRow label="Deslocação" value={formatMoney(orcamento.deslocacao)} />
                  <StatRow label="Transporte" value={formatMoney(orcamento.transporte)} />
                  <StatRow label="Alojamento" value={formatMoney(orcamento.alojamento)} />
                  <StatRow label="Voos" value={formatMoney(orcamento.voos)} />
                  <StatRow label="TIR" value={formatMoney(orcamento.tir)} />
                  <StatRow
                    label="Artigos adicionais"
                    value={formatMoney(orcamento.totalArtigosAdicionais)}
                  />

                  <div className="my-4 border-t border-slate-200" />

                  <StatRow label="Subtotal" value={formatMoney(orcamento.subtotal)} />
                  <StatRow label="Margem 50%" value={formatMoney(orcamento.valorMargem)} />
                  <StatRow
                    label="Total final"
                    value={formatMoney(orcamento.total)}
                    highlight
                  />

                  <div className="mt-5 grid gap-3">
                    <button
                      onClick={guardarOrcamento}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Guardar orçamento
                    </button>

                    <button
                      type="button"
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Exportar PDF
                    </button>
                  </div>
                </div>
              )}
            </Card>

            <Card
              title="Ficha comercial"
              subtitle="Resumo rápido para consulta do estado do projeto."
            >
              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900">
                    {form.cliente || "Sem cliente definido"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Referência
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900">
                    {form.referencia || "Sem referência"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Local da obra
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900">
                    {form.local_obra || "Sem localização"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tipo de cliente
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900">
                    {form.tipo_cliente}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}