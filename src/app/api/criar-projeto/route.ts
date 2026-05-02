export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(
      "https://sjqvbfaknsaldhxgys.supabase.co/functions/v1/criar-projeto-dropbox",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({
      sucesso: false,
      erro: String(err),
    });
  }
}