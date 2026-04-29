"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NovoOrcamentoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/novo-orcamento-cliente");
  }, [router]);

  return null;
}