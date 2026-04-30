import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

function hojeSemHoras() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
}

function parseData(data: string | null) {
  if (!data) return null;
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasAtraso(data: string | null) {
  const d = parseData(data);
  if (!d) return 0;

  const hoje = hojeSemHoras();
  const diff = Math.floor((hoje.getTime() - d.getTime()) / 86400000);

  return diff > 0 ? diff : 0;
}

async function existePicagem(processoId: string, fase: string) {
  const { data, error } = await supabase
    .from("picagens_qr")
    .select("id")
    .eq("processo_id", processoId)
    .eq("fase", fase)
    .limit(1);

  if (error) throw error;

  return !!data?.length;
}

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const { data: processos, error } = await supabase
      .from("processos")
      .select("*")
      .eq("estado", "Validado")
      .or("calendario_arquivado.is.null,calendario_arquivado.eq.false");

    if (error) throw error;

    let emailsEnviados = 0;
    const resultados: any[] = [];

    for (const processo of processos || []) {
      const atrasos: string[] = [];

      const producaoAtraso = diasAtraso(processo.data_inicio_producao_manual);
      if (producaoAtraso > 0) {
        const temPicagem = await existePicagem(processo.id, "producao");
        if (!temPicagem) {
          atrasos.push(
            `Produção deveria ter iniciado em ${processo.data_inicio_producao_manual} e ainda não existe picagem QR. Atraso: ${producaoAtraso} dia(s).`
          );
        }
      }

      const acabamentoAtraso = diasAtraso(processo.data_inicio_acabamento_manual);
      if (acabamentoAtraso > 0) {
        const temPicagem = await existePicagem(processo.id, "acabamentos");
        if (!temPicagem) {
          atrasos.push(
            `Acabamentos deveriam ter iniciado em ${processo.data_inicio_acabamento_manual} e ainda não existe picagem QR. Atraso: ${acabamentoAtraso} dia(s).`
          );
        }
      }

      const montagemAtraso = diasAtraso(processo.data_inicio_montagem_manual);
      if (montagemAtraso > 0) {
        const temPicagem = await existePicagem(processo.id, "montagem");
        if (!temPicagem) {
          atrasos.push(
            `Montagem deveria ter iniciado em ${processo.data_inicio_montagem_manual} e ainda não existe picagem QR. Atraso: ${montagemAtraso} dia(s).`
          );
        }
      }

      if (atrasos.length === 0) continue;

      const emails = [
        processo.responsavel_obra_email,
        processo.admin_alerta_email,
      ]
        .filter(Boolean)
        .map((email: string) => email.trim());

      if (emails.length === 0) {
        resultados.push({
          processo: processo.id,
          obra: processo.nome_obra,
          estado: "atrasado_sem_emails",
          atrasos,
        });
        continue;
      }

      const { error: emailError } = await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "VALERIE <onboarding@resend.dev>",
        to: emails,
        subject: `⚠️ Alerta de atraso - ${processo.nome_obra || "Obra sem nome"}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
            <div style="max-width:680px;margin:auto;background:white;border-radius:16px;padding:24px;border:1px solid #e8eaf3;">
              <h1 style="margin-top:0;color:#25315f;">⚠️ Alerta automático de atraso</h1>

              <p><strong>Obra:</strong> ${processo.nome_obra || "—"}</p>
              <p><strong>Cliente:</strong> ${processo.nome_cliente || "—"}</p>

              <h2 style="color:#b42318;">Situação detetada</h2>
              <ul>
                ${atrasos.map((item) => `<li>${item}</li>`).join("")}
              </ul>

              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />

              <p><strong>Responsável obra:</strong> ${processo.responsavel_obra_nome || "—"}</p>
              <p><strong>Email responsável:</strong> ${processo.responsavel_obra_email || "—"}</p>

              <p style="margin-top:24px;color:#777;font-size:12px;">
                Email automático enviado pelo sistema VALERIE.
              </p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        resultados.push({
          processo: processo.id,
          obra: processo.nome_obra,
          estado: "erro_email",
          erro: emailError,
        });
        continue;
      }

      emailsEnviados += 1;

      resultados.push({
        processo: processo.id,
        obra: processo.nome_obra,
        estado: "email_enviado",
        atrasos,
      });
    }

    return NextResponse.json({
      ok: true,
      analisados: processos?.length || 0,
      emailsEnviados,
      resultados,
    });
  } catch (error: any) {
    console.error("CRON_ALERTAS_ERRO:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro no cron." },
      { status: 500 }
    );
  }
}