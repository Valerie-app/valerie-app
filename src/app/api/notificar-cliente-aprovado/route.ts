import nodemailer from "nodemailer";

type BodyClienteAprovado = {
  nome?: string;
  email?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BodyClienteAprovado;
    const { nome, email } = body;

    // 🔒 validação básica
    if (!email || typeof email !== "string") {
      return Response.json(
        { success: false, error: "Email do cliente em falta." },
        { status: 400 }
      );
    }

    // 🔒 valida envs
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
      console.error("ENV EMAIL NÃO CONFIGURADAS");
      return Response.json(
        { success: false, error: "Configuração de email incompleta." },
        { status: 500 }
      );
    }

    // ⚠️ importante: secure depende da porta
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465, // 🔥 correção importante
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const linkLogin = "https://valerie-app-six.vercel.app/login";

    // ✨ email HTML profissional
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color:#4057a8;">Conta Aprovada</h2>

        <p>Olá <strong>${nome || "cliente"}</strong>,</p>

        <p>A sua conta foi <strong>aprovada com sucesso</strong>.</p>

        <p>Já pode aceder à plataforma através do botão abaixo:</p>

        <a href="${linkLogin}" 
           style="
             display:inline-block;
             margin-top:15px;
             padding:12px 18px;
             background:#4057a8;
             color:white;
             text-decoration:none;
             border-radius:8px;
           ">
           Entrar na Plataforma
        </a>

        <p style="margin-top:25px;">
          Cumprimentos,<br/>
          <strong>VALERIE</strong>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"VALERIE" <${EMAIL_USER}>`,
      to: email,
      subject: "A sua conta foi aprovada",
      text: `
Olá ${nome || "cliente"},

A sua conta foi aprovada.

Aceda aqui:
${linkLogin}

VALERIE
      `,
      html, // 👈 importante
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao notificar cliente aprovado:", error);

    return Response.json(
      {
        success: false,
        error: "Erro ao enviar email de aprovação.",
      },
      { status: 500 }
    );
  }
}