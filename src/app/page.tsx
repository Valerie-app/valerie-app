"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

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
          .select("tipo_utilizador")
          .eq("id", user.id)
          .single<{ tipo_utilizador: string | null }>();

        if (clienteError) {
          console.error(clienteError);
          router.replace("/login");
          return;
        }

        if (cliente?.tipo_utilizador === "admin") {
          router.replace("/admin");
          return;
        }

        router.replace("/dashboard");
      } catch (error) {
        console.error(error);
        router.replace("/login");
      }
    }

    verificar();
  }, [router]);

  return null;
}