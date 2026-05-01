"use client";

import { useState } from "react";

export default function ProjetosPage() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  async function criarProjeto() {
    setLoading(true);

    const res = await fetch("/api/criar-projeto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome_empresa: "Empresa UI",
        nome_cliente: "Cliente UI",
      }),
    });

    const data = await res.json();

    if (data.sucesso) {
      setCodigo(data.codigo);
    }

    console.log(data);
    setLoading(false);
  }

  async function uploadFicheiro(e: any) {
    const file = e.target.files[0];
    if (!file || !codigo) return;

    const base64 = await toBase64(file);

    const res = await fetch("/api/upload-ficheiro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo_val: codigo,
        nome_ficheiro: file.name,
        ficheiro_base64: base64,
      }),
    });

    const data = await res.json();
    console.log(data);
  }

  async function aprovar() {
    const res = await fetch("/api/aprovar-orcamento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo_val: codigo,
      }),
    });

    const data = await res.json();
    console.log(data);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>🚀 Projetos</h1>

      <button onClick={criarProjeto} disabled={loading}>
        Criar Projeto
      </button>

      <p>VAL: {codigo}</p>

      <input type="file" onChange={uploadFicheiro} />

      <br /><br />

      <button onClick={aprovar}>
        Aprovar Orçamento
      </button>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}