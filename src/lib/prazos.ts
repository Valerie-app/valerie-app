export type ExtraPrazo = {
  nome?: string;
  quantidade?: string | number;
};

export type ArtigoPrazo = {
  tipo?: string | null;
  material?: string | null;
  extras?: ExtraPrazo[];
};

export type RegraPrazo = {
  tipo_regra: string | null;
  nome: string | null;
  dias: number | null;
};

export type ResultadoPrazo = {
  diasFabrico: number;
  diasAcabamento: number;
  diasMontagem: number;
  diasTotais: number;
  dataEntregaPrevista: string;
};

function normalizarTexto(valor: string | null | undefined) {
  return (valor || "").trim().toLowerCase();
}

function obterDias(
  regras: RegraPrazo[],
  tipoRegra: string,
  nome: string | null | undefined
) {
  const regra = regras.find(
    (item) =>
      normalizarTexto(item.tipo_regra) === normalizarTexto(tipoRegra) &&
      normalizarTexto(item.nome) === normalizarTexto(nome)
  );

  return Number(regra?.dias || 0);
}

function adicionarDiasUteis(dataBase: Date, dias: number) {
  const data = new Date(dataBase);
  let restantes = dias;

  while (restantes > 0) {
    data.setDate(data.getDate() + 1);

    const diaSemana = data.getDay();
    const eFimDeSemana = diaSemana === 0 || diaSemana === 6;

    if (!eFimDeSemana) {
      restantes -= 1;
    }
  }

  return data;
}

function formatarDataISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function calcularPrazoProcesso(
  artigos: ArtigoPrazo[],
  regras: RegraPrazo[]
): ResultadoPrazo {
  let diasFabrico = 0;
  let diasAcabamento = 0;
  let diasExtras = 0;

  for (const artigo of artigos) {
    const diasArtigo = obterDias(regras, "artigo", artigo.tipo);
    diasFabrico += diasArtigo;

    const diasMaterial = obterDias(regras, "material", artigo.material);
    const diasPolidor = obterDias(regras, "polidor", artigo.material);

    diasAcabamento += Math.max(diasMaterial, diasPolidor);

    const extras = Array.isArray(artigo.extras) ? artigo.extras : [];

    for (const extra of extras) {
      const qtd = Number(extra.quantidade || 0);
      const diasExtra = obterDias(regras, "extra", extra.nome);

      if (diasExtra > 0 && qtd > 0) {
        diasExtras += diasExtra;
      }
    }
  }

  const diasMontagemBase = obterDias(regras, "montagem", "base");
  const diasMontagem = diasMontagemBase > 0 ? diasMontagemBase : 1;

  const diasTotais = diasFabrico + diasAcabamento + diasExtras + diasMontagem;

  const hoje = new Date();
  const dataEntrega = adicionarDiasUteis(hoje, diasTotais);

  return {
    diasFabrico,
    diasAcabamento: diasAcabamento + diasExtras,
    diasMontagem,
    diasTotais,
    dataEntregaPrevista: formatarDataISO(dataEntrega),
  };
}