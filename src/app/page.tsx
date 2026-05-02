"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [aVerificar, setAVerificar] = useState(true);

  useEffect(() => {
    async function verificar() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error(error);
          router.replace("/login");
          return;
        }

        const user = data.session?.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: cliente, error: clienteError } = await supabase
          .from("clientes")
          .select("tipo_utilizador, aprovado, estado")
          .eq("id", user.id)
          .maybeSingle<{
            tipo_utilizador: string | null;
            aprovado: boolean | null;
            estado: string | null;
          }>();

        if (clienteError || !cliente) {
          console.error(clienteError);
          router.replace("/login");
          return;
        }

        if (cliente.tipo_utilizador === "admin") {
          router.replace("/admin");
          return;
        }

        if (cliente.tipo_utilizador === "cliente") {
          if (cliente.aprovado === false || cliente.estado === "pendente") {
            router.replace("/aguardar-aprovacao");
            return;
          }

          if (cliente.estado === "rejeitado") {
            router.replace("/login");
            return;
          }

          router.replace("/dashboard-cliente");
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        setAVerificar(false);
      }
    }

    void verificar();
  }, [router]);

  if (aVerificar) {
    return (
      <main
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#1f2540",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        A entrar...
      </main>
    );
  }

  return null;
}