import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analisarImagem(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");

  const response = await openai.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `
És um especialista em mobiliário por medida.

Analisa a imagem e devolve apenas JSON válido com estes campos:

{
  "tipo_projeto": "Cozinha | Roupeiro | WC | Movel TV",
  "tipo_gama": "Gama Baixa | Gama Média | Gama Alta",
  "medida_linear_m": number,
  "material_1": "string",
  "material_2": "string",
  "tem_moveis_superiores": boolean,
  "qtd_dobradicas": number,
  "qtd_corredicas": number,
  "led": "Sim | Não",
  "metros_led": number,
  "montagem_homens": number,
  "deslocacao_km": number,
  "transporte_tir_mlinear": number,
  "alojamento_noites": number,
  "voos_pessoas": number,
  "margem_percentual": number
}

Regras:
- responde só com JSON
- não expliques nada
- material_1 deve ser algo como: Melamina branca, MDF, Carvalho, Lacado mate
- material_2 pode ir vazio se não fizer sentido
- se for cozinha e houver armários superiores, então tem_moveis_superiores = true
- se não houver armários superiores, então tem_moveis_superiores = false
- roupeiros normalmente têm_moveis_superiores = false
- usa estimativas razoáveis se faltar informação
`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Analisa esta imagem e devolve os dados do orçamento.",
          },
          {
            type: "input_image",
            image_url: `data:image/png;base64,${base64}`,
            detail: "auto",
          },
        ],
      },
    ],
  });

  const texto = response.output_text;

  try {
    const parsed = JSON.parse(texto);

    return {
      tipo_projeto: parsed.tipo_projeto || "Cozinha",
      tipo_gama: parsed.tipo_gama || "Gama Média",
      medida_linear_m: Number(parsed.medida_linear_m || 0),
      material_1: parsed.material_1 || "Melamina branca",
      material_2: parsed.material_2 || "",
      tem_moveis_superiores: Boolean(parsed.tem_moveis_superiores),
      qtd_dobradicas: Number(parsed.qtd_dobradicas || 0),
      qtd_corredicas: Number(parsed.qtd_corredicas || 0),
      led: parsed.led === "Sim" ? "Sim" : "Não",
      metros_led: Number(parsed.metros_led || 0),
      montagem_homens: Number(parsed.montagem_homens || 2),
      deslocacao_km: Number(parsed.deslocacao_km || 0),
      transporte_tir_mlinear: Number(parsed.transporte_tir_mlinear || 0),
      alojamento_noites: Number(parsed.alojamento_noites || 0),
      voos_pessoas: Number(parsed.voos_pessoas || 0),
      margem_percentual: Number(parsed.margem_percentual || 0.5),
    };
  } catch {
    console.error("Resposta inválida da IA:", texto);
    throw new Error("Falha ao interpretar a imagem.");
  }
}