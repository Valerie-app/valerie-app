import nodemailer from "nodemailer";

export async function POST() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"VALERIE" <${process.env.EMAIL_USER}>`,
      to: "catarina@valerie.com.pt",
      subject: "Orçamento validado — PR-1351 — Moradia Vila Verde",
      text: `Foi validado um orçamento por parte do cliente.

Detalhes do processo:
Cliente: Pedro Fernandes
Obra: Moradia Vila Verde
Referência: PR-1351
Estado: Validado

Solicita-se a emissão da fatura proforma.

Após emissão, por favor responder a este email com a proforma em anexo.`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return Response.json({ success: false, error: "Erro ao enviar email" }, { status: 500 });
  }
}