import nodemailer from "nodemailer";

type ArtigoEmail = {
  nome?: string;
  tipo?: string;
  resumo?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nomeCliente = body?.nomeCliente?.trim() || "";
    const nomeObra = body?.nomeObra?.trim() || "";
    const localizacao = body?.localizacao?.trim() || "";
    const observacoes = body?.observacoes?.trim() || "";
    const artigos: ArtigoEmail[] = Array.isArray(body?.artigos) ? body.artigos : [];

    if (!nomeCliente) {
      return Response.json(
        { success: false, error: "Nome do cliente em falta." },
        { status: 400 }
      );
    }

    if (!nomeObra) {
      return Response.json(
        { success: false, error: "Nome da obra em falta." },
        { status: 400 }
      );
    }

    if (artigos.length === 0) {
      return Response.json(
        { success: false, error: "É necessário pelo menos um artigo." },
        { status: 400 }
      );
    }

    if (
      !process.env.EMAIL_HOST ||
      !process.env.EMAIL_PORT ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS
    ) {
      return Response.json(
        { success: false, error: "Configuração de email incompleta." },
        { status: 500 }
      );
    }

    const listaArtigos = artigos
      .map((artigo, index) => {
        return [
          `${index + 1}. ${artigo.nome || "Artigo sem nome"}`,
          `Tipo: ${artigo.tipo || "—"}`,
          `Resumo: ${artigo.resumo || "—"}`,
        ].join("\n");
      })
      .join("\n\n");

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const assunto = `Novo pedido de orçamento — ${nomeCliente} — ${nomeObra}`;

    const textoEmail = [
      "Foi submetido um novo pedido de orçamento.",
      "",
      "DADOS DO CLIENTE / OBRA",
      `Nome do cliente: ${nomeCliente}`,
      `Nome da obra: ${nomeObra}`,
      `Localização: ${localizacao || "—"}`,
      `Observações gerais: ${observacoes || "—"}`,
      "",
      "NOTA",
      "A referência interna VALxxx.26 será atribuída na fase seguinte com ligação à Dropbox.",
      "",
      "ARTIGOS",
      listaArtigos,
    ].join("\n");

    await transporter.sendMail({
      from: `"VALERIE" <${process.env.EMAIL_USER}>`,
      to: "geral@valerie.com.pt",
      subject: assunto,
      text: textoEmail,
    });

    return Response.json({
      success: true,
      message: "Pedido submetido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao submeter orçamento:", error);

    return Response.json(
      {
        success: false,
        error: "Ocorreu um erro ao enviar o pedido de orçamento.",
      },
      { status: 500 }
    );
  }
}