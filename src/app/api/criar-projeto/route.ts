const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não definida.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = `${supabaseUrl}/functions/v1/criar-projeto-dropbox`;

    const res = await fetch(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Bearer ${String(serviceRoleKey)}`,
        apikey: String(serviceRoleKey),
      }),
      body: JSON.stringify(body),
    });

    const texto = await res.text();

    let data: any = null;

    try {
      data = texto ? JSON.parse(texto) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      return Response.json(
        {
          sucesso: false,
          erro: data?.erro || data?.message || texto || "Erro ao criar VAL.",
          status: res.status,
          url,
        },
        { status: res.status }
      );
    }

    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json(
      {
        sucesso: false,
        erro: String(err),
      },
      { status: 500 }
    );
  }
}