import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type Fase = "producao" | "acabamentos" | "montagem";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function hojeSemHoras() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
}

function parseData(data: string | null) {
  if (!data) return null;
  const [ano, mes, dia] = data.split("-").map(Number);
  const d = new Date(ano, (mes || 1) - 1, dia || 1);
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

async function existePicagem(processoId: string, fase: Fase) {
  const { data, error } = await supabase
    .from("picagens_qr")
    .select("id")
    .eq("processo_id", processoId)
    .eq("fase", fase)
    .limit(1);

  if (error) throw error;
  return !!data?.length;
}

async function alertaJaEnviadoHoje(processoId: string, fase: Fase, dataReferencia: string) {
  const { data, error } = await supabase
    .from("alertas_planeamento_enviados")
    .select("id")
    .eq("processo_id", processoId)
    .eq("fase", fase)
    .eq("data_referencia", dataReferencia)
    .limit(1);

  if (error) throw error;
  return !!data?.length;
}

async function gravarAlertaEnviado(
  processoId: string,
  fase: Fase,
  dataReferencia: string,
  emails: string[]
) {
  const { error } = await supabase.from("alertas_planeamento_enviados").insert({
    processo_id: processoId,
    fase,
    data_referencia: dataReferencia,
    emails,
  });

  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    throw error;
  }
}

function nomeFase(fase: Fase) {
  if (fase === "producao") return "Produção";
  if (fase === "acabamentos") return "Acabamentos";
  return "Montagem";
}

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "RESEND_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const dataHoje = hojeISO();

    const { data: processos, error } = await supabase
      .from("processos")
      .select("*")
      .eq("estado", "Validado")
      .or("calendario_arquivado.is.null,calendario_arquivado.eq.false");

    if (error) throw error;

    let emailsEnviados = 0;
    const resultados: any[] = [];

    for (const processo of processos || []) {
      const emails = [
        processo.responsavel_obra_email,
        processo.admin_alerta_email,
      ]
        .filter(Boolean)
        .map((email: string) => email.trim())
        .filter((email: string, index: number, array: string[]) => array.indexOf(email) === index);

      const verificacoes: Array<{
        fase: Fase;
        data: string | null;
      }> = [
        { fase: "producao", data: processo.data_inicio_producao_manual },
        { fase: "acabamentos", data: processo.data_inicio_acabamento_manual },
        { fase: "montagem", data: processo.data_inicio_montagem_manual },
      ];

      const atrasosParaEnviar: Array<{
        fase: Fase;
        texto: string;
        dataReferencia: string;
      }> = [];

      for (const item of verificacoes) {
        const atraso = diasAtraso(item.data);

        if (atraso <= 0 || !item.data) continue;

        const temPicagem = await existePicagem(processo.id, item.fase);
        if (temPicagem) continue;

        const jaEnviado = await alertaJaEnviadoHoje(processo.id, item.fase, item.data);
        if (jaEnviado) {
          resultados.push({
            processo: processo.id,
            obra: processo.nome_obra,
            fase: item.fase,
            estado: "ja_enviado",
            dataReferencia: item.data,
          });
          continue;
        }

        atrasosParaEnviar.push({
          fase: item.fase,
          dataReferencia: item.data,
          texto: `${nomeFase(item.fase)} deveria ter iniciado em ${item.data} e ainda não existe picagem QR. Atraso: ${atraso} dia(s).`,
        });
      }

      if (atrasosParaEnviar.length === 0) continue;

      if (emails.length === 0) {
        resultados.push({
          processo: processo.id,
          obra: processo.nome_obra,
          estado: "atrasado_sem_emails",
          atrasos: atrasosParaEnviar.map((item) => item.texto),
        });
        continue;
      }

      const { error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "VALERIE <onboarding@resend.dev>",
        to: emails,
        subject: `⚠️ Alerta de atraso - ${processo.nome_obra || "Obra sem nome"}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
            <div style="max-width:720px;margin:auto;background:white;border-radius:16px;padding:24px;border:1px solid #e8eaf3;">
              <h1 style="margin-top:0;color:#25315f;">⚠️ Alerta automático de atraso</h1>

              <p><strong>Obra:</strong> ${processo.nome_obra || "—"}</p>
              <p><strong>Cliente:</strong> ${processo.nome_cliente || "—"}</p>

              <h2 style="color:#b42318;">Situação detetada</h2>
              <ul>
                ${atrasosParaEnviar.map((item) => `<li>${item.texto}</li>`).join("")}
              </ul>

              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />

              <p><strong>Responsável obra:</strong> ${processo.responsavel_obra_nome || "—"}</p>
              <p><strong>Email responsável:</strong> ${processo.responsavel_obra_email || "—"}</p>
              <p><strong>Data da verificação:</strong> ${dataHoje}</p>

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

      for (const item of atrasosParaEnviar) {
        await gravarAlertaEnviado(processo.id, item.fase, item.dataReferencia, emails);
      }

      emailsEnviados += 1;

      resultados.push({
        processo: processo.id,
        obra: processo.nome_obra,
        estado: "email_enviado",
        atrasos: atrasosParaEnviar.map((item) => item.texto),
      });
    }

    return NextResponse.json({
      ok: true,
      dataHoje,
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