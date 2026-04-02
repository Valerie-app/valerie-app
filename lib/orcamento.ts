import { CONFIG_ORCAMENTO, getPrecoMaterial, getPrecoMetroLinear } from "./tabelaprecos";

export function calcularOrcamento(input: any) {
  const precoMetroLinear = getPrecoMetroLinear(input.tipo_projeto || "Cozinha");

  const baseMetroLinear = (input.medida_linear_m || 0) * precoMetroLinear;

  let metrosMaterialCalculado = input.medida_linear_m || 0;

  if (input.tipo_projeto === "Cozinha" && input.tem_moveis_superiores) {
    metrosMaterialCalculado = metrosMaterialCalculado * 2;
  }

  const precoMaterial1 = getPrecoMaterial(input.material_1 || "");
  const precoMaterial2 = getPrecoMaterial(input.material_2 || "");

  const material1Extra = input.quer_material_1
    ? metrosMaterialCalculado * precoMaterial1
    : 0;

  const material2Extra = input.quer_material_2
    ? metrosMaterialCalculado * precoMaterial2
    : 0;

  const dobradicas = (input.qtd_dobradicas || 0) * CONFIG_ORCAMENTO.dobradica;
  const corredicas = (input.qtd_corredicas || 0) * CONFIG_ORCAMENTO.corredica;

  const led = input.quer_led
    ? (input.metros_led || 0) * CONFIG_ORCAMENTO.ledMetro
    : 0;

  const montagem = input.quer_montagem
    ? (input.montagem_homens || 0) * CONFIG_ORCAMENTO.montagemPorHomem
    : 0;

  const kmFaturados = input.quer_montagem
    ? (input.km_calculados || 0) * 2
    : 0;

  const deslocacao = kmFaturados * CONFIG_ORCAMENTO.precoKm;

  const transporte = input.precisa_transporte
    ? (input.transporte_tir_mlinear || 0) * CONFIG_ORCAMENTO.transportePorMetro
    : 0;

  const alojamento = input.precisa_transporte
    ? (input.alojamento_noites || 0) * CONFIG_ORCAMENTO.alojamentoPorNoite
    : 0;

  const voos = input.precisa_voos
    ? (input.voos_pessoas || 0) * CONFIG_ORCAMENTO.vooPorPessoa
    : 0;

  const tir = input.precisa_tir
    ? (input.transporte_tir_mlinear || 0) * CONFIG_ORCAMENTO.tirPorMetro
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

  const valorMargem = subtotal * CONFIG_ORCAMENTO.margem;
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