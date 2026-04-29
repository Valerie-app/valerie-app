"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegistoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegisto() {
    try {
      setLoading(true);
      setMensagem("");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMensagem(error.message);
        return;
      }

      // Criar cliente na tabela
      await supabase.from("clientes").insert({
        id: data.user?.id,
        nome,
        email,
        tipo_utilizador: "cliente",
      });

      setMensagem("Conta criada com sucesso! A entrar...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setMensagem("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>VALERIE</h1>
        <p style={{ opacity: 0.8 }}>Criar conta</p>

        <label>Nome</label>
        <input
          style={inputStyle}
          placeholder="O seu nome"
          onChange={(e) => setNome(e.target.value)}
        />

        <label>Email</label>
        <input
          style={inputStyle}
          placeholder="o.seu@email.com"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          style={inputStyle}
          placeholder="********"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleRegisto} style={botaoStyle}>
          {loading ? "A criar..." : "Criar Conta"}
        </button>

        {mensagem && <p style={{ marginTop: "14px" }}>{mensagem}</p>}

        <p style={{ marginTop: "16px", opacity: 0.8 }}>
          Já tem conta?{" "}
          <a href="/login" style={{ color: "#9fc3ff" }}>
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  padding: "32px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  marginBottom: "16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const botaoStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};