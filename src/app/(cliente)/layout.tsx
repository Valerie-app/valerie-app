"use client";

import { useEffect, useState } from "react";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const sessao = localStorage.getItem("valerie_cliente_sessao");

    if (!sessao) {
      window.location.href = "/login";
      return;
    }

    try {
      const dados = JSON.parse(sessao);

      if (!dados?.autenticado) {
        window.location.href = "/login";
        return;
      }

      setAutorizado(true);
    } catch (error) {
      console.error(error);
      window.location.href = "/login";
    }
  }, []);

  if (!autorizado) {
    return null;
  }

  return <>{children}</>;
}