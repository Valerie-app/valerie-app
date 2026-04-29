export const CONFIG_ORCAMENTO = {
  precoMetroLinear: {
    Cozinha: 700,
    Roupeiro: 650,
    WC: 500,
    "Movel TV": 550,
  },

  precoKm: 0.6,
  margem: 0.5,
  montagemPorHomem: 225,

  dobradica: 8,
  corredica: 18,
  ledMetro: 25,

  transportePorMetro: 20,
  alojamentoPorNoite: 90,
  vooPorPessoa: 180,
  tirPorMetro: 35,

  materiais: {
    "Melamina branca": 40,
    "Melamina carvalho": 45,
    MDF: 55,
    Carvalho: 80,
    "Lacado mate": 120,
    "Lacado brilho": 130,
  },

  artigosExtras: {
    "Varão roupeiro": 18,
    "Canto feijão": 95,
    "Sapateira extra": 75,
    "Puxador premium": 12,
    "Gaveteiro extra": 85,
    "Prateleira extra": 25,
  },
};

export function getPrecoMaterial(nome: string) {
  if (!nome) return 0;

  const materiais = CONFIG_ORCAMENTO.materiais as Record<string, number>;

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

export function getPrecoMetroLinear(tipoProjeto: string) {
  const tabela = CONFIG_ORCAMENTO.precoMetroLinear as Record<string, number>;
  return tabela[tipoProjeto] ?? 700;
}

export function getListaArtigosExtras() {
  return Object.entries(CONFIG_ORCAMENTO.artigosExtras).map(
    ([descricao, preco_unitario]) => ({
      descricao,
      preco_unitario,
    })
  );
}