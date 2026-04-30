import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ IMPORTANTE (server only)
);

export async function GET() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // 🔹 buscar processos
    const { data: processos, error } = await supabase
      .from("processos")
      .select("*")
      .eq("estado", "Validado")
      .neq("calendario_arquivado", true);

    if (error) throw error;

    for (const processo of processos || []) {
      const emails = [
        processo.responsavel_obra_email,
        processo.responsavel_acabamentos_email,
        processo.responsavel_montagem_email,
        processo.admin_alerta_email,
      ]
        .filter(Boolean)
        .map((e: string) => e.trim());

      if (emails.length === 0) continue;

      const atrasos: string[] = [];

      // 🔹 função verificar atraso + QR
      async function verificar(fase: string, dataFim?: string | null) {
        if (!dataFim) return;

        const data = new Date(dataFim);
        data.setHours(0, 0, 0, 0);

        if (data >= hoje) return;

        // 🔹 ver se existe picagem QR
        const { data: qr } = await supabase
          .from("picagens_qr")
          .select("id")
          .eq("processo_id", processo.id)
          .eq("fase", fase)
          .limit(1);

        if (!qr || qr.length === 0) {
          const dias = Math.floor(
            (hoje.getTime() - data.getTime()) / 86400000
          );

          atrasos.push(`${fase} atrasada ${dias} dias`);
        }
      }

      await verificar("producao", processo.data_fim_producao_manual);
      await verificar("acabamentos", processo.data_fim_acabamento_manual);
      await verificar("montagem", processo.data_fim_montagem_manual);

      if (atrasos.length === 0) continue;

      // 🔥 enviar email
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "VALERIE <onboarding@resend.dev>",

        to: emails,

        subject: `⚠️ Obra em atraso - ${
          processo.nome_obra || "Sem nome"
        }`,

        html: `
          <div style="font-family:Arial;padding:20px;">
            <h2>⚠️ Alerta de atraso</h2>

            <p><strong>Obra:</strong> ${
              processo.nome_obra || "—"
            }</p>

            <p><strong>Cliente:</strong> ${
              processo.nome_cliente || "—"
            }</p>

            <p><strong>Situação:</strong></p>
            <ul>
              ${atrasos.map((a) => `<li>${a}</li>`).join("")}
            </ul>

            <p style="margin-top:20px;">
              Verificar estado da obra e atuação necessária.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}