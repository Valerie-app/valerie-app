import nodemailer from "nodemailer";

type BodyPedidoConta = {
  nome?: string;
  email?: string;
  nif?: string;
  contacto?: string;
  morada?: string;
  tipoCliente?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BodyPedidoConta;

    const { nome, email, nif, contacto, morada, tipoCliente } = body;

    if (
      !process.env.EMAIL_HOST ||
      !process.env.EMAIL_PORT ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS
    ) {
      return Response.json(
        {
          success: false,
          error: "Configuração de email incompleta.",
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const linkAprovacao =
      "https://valerie-app-six.vercel.app/aprovacao-clientes";

    await transporter.sendMail({
      from: `"VALERIE" <${process.env.EMAIL_USER}>`,
      to: "geral@valerie.com.pt",
      subject: "Novo pedido de conta pendente de aprovação",
      text: `
Foi criado um novo pedido de acesso à plataforma.

DADOS DO CLIENTE
Nome: ${nome || "—"}
Tipo de Cliente: ${tipoCliente || "—"}
Email: ${email || "—"}
NIF: ${nif || "—"}
Contacto: ${contacto || "—"}
Morada: ${morada || "—"}

Aceda à página de aprovação:
${linkAprovacao}
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao notificar pedido de conta:", error);

    return Response.json(
      {
        success: false,
        error: "Erro ao enviar notificação de aprovação.",
      },
      { status: 500 }
    );
  }
}