import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      emails,
      assunto,
      titulo,
      obra,
      cliente,
      mensagem,
      detalhes,
    } = body;

    const listaEmails = Array.isArray(emails)
      ? emails.filter(Boolean)
      : [];

    if (listaEmails.length === 0) {
      return NextResponse.json(
        { error: "Sem emails válidos." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "VALERIE <onboarding@resend.dev>",
      to: listaEmails,
      subject: assunto || "Alerta de obra",
      html: `
        <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
          <div style="max-width:680px;margin:auto;background:white;border-radius:16px;padding:24px;border:1px solid #e8eaf3;">
            <h1 style="margin-top:0;color:#25315f;">${titulo || "Alerta de obra"}</h1>
            <p><strong>Obra:</strong> ${obra || "—"}</p>
            <p><strong>Cliente:</strong> ${cliente || "—"}</p>
            <p style="font-size:16px;line-height:1.5;">${mensagem || ""}</p>
            <div style="margin-top:18px;padding:14px;border-radius:12px;background:#f1f3fb;">
              ${detalhes || ""}
            </div>
            <p style="margin-top:24px;color:#777;font-size:12px;">
              Email automático enviado pelo sistema VALERIE.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao enviar email." },
      { status: 500 }
    );
  }
}