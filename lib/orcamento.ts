import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "config.json");

function getConfig() {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function getPrecoMaterial(nome: string, config: any) {
  if (!nome) return 0;

  const materiais = config.materiais || {};

  if (materiais[nome] !== undefined) {
    return materiais[nome];
  }

  const n = nome.toLowerCase();

  if (n.includes("melamina")) return 40;
  if (n.includes("mdf")) return 55;
  if (n.includes("carvalho")) return 80;
  if (n.includes("lacado")) return 120;

  return 50;
}

function getPrecoMetroLinear(tipoProjeto: string, tipoGama: string, config: any) {
  return config.precoMetroLinear?.[tipoProjeto]?.[tipoGama] ?? 0;
}

export function calcularOrcamento(input: any) {
  const config = getConfig();

  const tipoProjeto = input.tipo_projeto || "Cozinha";
  const tipoGama = input.tipo_gama || "Gama Média";

  const precoMetroLinear = getPrecoMetroLinear(tipoProjeto, tipoGama, config);

  const baseMetroLinear = (input.medida_linear_m || 0) * precoMetroLinear;

  let metrosMaterialCalculado = input.medida_linear_m || 0;

  if (tipoProjeto === "Cozinha" && input.tem_moveis_superiores) {
    metrosMaterialCalculado = metrosMaterialCalculado * 2;
  }

  const precoMaterial1 = getPrecoMaterial(input.material_1 || "", config);
  const precoMaterial2 = getPrecoMaterial(input.material_2 || "", config);

  const material1Extra = input.quer_material_1
    ? metrosMaterialCalculado * precoMaterial1
    : 0;

  const material2Extra = input.quer_material_2
    ? metrosMaterialCalculado * precoMaterial2
    : 0;

  const dobradicas = (input.qtd_dobradicas || 0) * config.dobradica;
  const corredicas = (input.qtd_corredicas || 0) * config.corredica;

  const led = input.quer_led
    ? (input.metros_led || 0) * config.ledMetro
    : 0;

  const montagem = input.quer_montagem
    ? (input.montagem_homens || 0) * config.montagemPorHomem
    : 0;

  const kmFaturados = input.quer_montagem
    ? (input.km_calculados || 0) * 2
    : 0;

  const deslocacao = kmFaturados * config.precoKm;

  const transporte = input.precisa_transporte
    ? (input.transporte_tir_mlinear || 0) * config.transportePorMetro
    : 0;

  const alojamento = input.precisa_transporte
    ? (input.alojamento_noites || 0) * config.alojamentoPorNoite
    : 0;

  const voos = input.precisa_voos
    ? (input.voos_pessoas || 0) * config.vooPorPessoa
    : 0;

  const tir = input.precisa_tir
    ? (input.transporte_tir_mlinear || 0) * config.tirPorMetro
    : 0;

  const artigosAdicionais = Array.isArray(input.artigos_adicionais)
    ? input.artigos_adicionais.map((artigo: any) => {
        const quantidade = Number(artigo.quantidade || 0);
        const precoUnitario = Number(artigo.preco_unitario || 0);
        const total = quantidade * precoUnitario;

        return {
          descricao: artigo.descricao || "",
          quantidade,
          preco_unitario: precoUnitario,
          total,
        };
      })
    : [];

  const totalArtigosAdicionais = artigosAdicionais.reduce(
    (acc: number, artigo: any) => acc + artigo.total,
    0
  );

  const subtotal =
    baseMetroLinear +
    material1Extra +
    material2Extra +
    dobradicas +
    corredicas +
    led +
    montagem +
    deslocacao +
    transporte +
    alojamento +
    voos +
    tir +
    totalArtigosAdicionais;

  const valorMargem = subtotal * config.margem;
  const total = subtotal + valorMargem;

  return {
    precoMetroLinear,
    baseMetroLinear,
    metrosMaterialCalculado,
    precoMaterial1,
    precoMaterial2,
    material1Extra,
    material2Extra,
    dobradicas,
    corredicas,
    led,
    montagem,
    kmFaturados,
    deslocacao,
    transporte,
    alojamento,
    voos,
    tir,
    artigosAdicionais,
    totalArtigosAdicionais,
    subtotal,
    valorMargem,
    total,
  };
}