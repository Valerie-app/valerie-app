"use client";

import { useState } from "react";

type PedidoConta = {
  nome: string;
  email: string;
  password: string;
  estado: "pendente" | "aprovado" | "rejeitado";
};

export default function LoginPage() {
  const [modo, setModo] = useState<"login" | "registo">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [nomeRegisto, setNomeRegisto] = useState("");
  const [emailRegisto, setEmailRegisto] = useState("");
  const [passwordRegisto, setPasswordRegisto] = useState("");

  function iniciarSessao() {
    if (!email.trim()) {
      setMensagem("Preencha o email.");
      return;
    }

    if (!password.trim()) {
      setMensagem("Preencha a palavra-passe.");
      return;
    }

    const pedidosGuardados = localStorage.getItem("valerie_clientes_pendentes");
    const pedidos: PedidoConta[] = pedidosGuardados
      ? JSON.parse(pedidosGuardados)
      : [];

    const clienteEncontrado = pedidos.find(
      (cliente) => cliente.email === email && cliente.password === password
    );

    if (!clienteEncontrado) {
      setMensagem("Conta não encontrada.");
      return;
    }

    if (clienteEncontrado.estado === "pendente") {
      setMensagem("A sua conta ainda está pendente de aprovação.");
      return;
    }

    if (clienteEncontrado.estado === "rejeitado") {
      setMensagem("A sua conta foi rejeitada.");
      return;
    }

    const dadosCliente = {
      autenticado: true,
      nome: clienteEncontrado.nome,
      email: clienteEncontrado.email,
    };

    localStorage.setItem("valerie_cliente_sessao", JSON.stringify(dadosCliente));
    window.location.href = "/novo-orcamento";
  }

  function pedirConta() {
    if (!nomeRegisto.trim()) {
      setMensagem("Preencha o nome.");
      return;
    }

    if (!emailRegisto.trim()) {
      setMensagem("Preencha o email.");
      return;
    }

    if (!passwordRegisto.trim()) {
      setMensagem("Preencha a palavra-passe.");
      return;
    }

    const pedidosGuardados = localStorage.getItem("valerie_clientes_pendentes");
    const pedidos: PedidoConta[] = pedidosGuardados
      ? JSON.parse(pedidosGuardados)
      : [];

    const emailJaExiste = pedidos.some((cliente) => cliente.email === emailRegisto);

    if (emailJaExiste) {
      setMensagem("Já existe um pedido de conta com esse email.");
      return;
    }

    const novoPedido: PedidoConta = {
      nome: nomeRegisto,
      email: emailRegisto,
      password: passwordRegisto,
      estado: "pendente",
    };

    const novosPedidos = [...pedidos, novoPedido];
    localStorage.setItem("valerie_clientes_pendentes", JSON.stringify(novosPedidos));

    setMensagem("Pedido de conta enviado com sucesso. Aguarda aprovação.");
    setNomeRegisto("");
    setEmailRegisto("");
    setPasswordRegisto("");
    setModo("login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "32px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            fontSize: "34px",
            letterSpacing: "8px",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          VALERIE
        </div>

        <h1
          style={{
            fontSize: "30px",
            marginTop: 0,
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {modo === "login" ? "Iniciar Sessão" : "Pedir Conta"}
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: 0.8,
            marginBottom: "28px",
          }}
        >
          {modo === "login"
            ? "Entre na sua área de cliente para acompanhar pedidos e processos."
            : "Peça acesso à app. A sua conta ficará pendente até ser aprovada."}
        </p>

        {mensagem && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {mensagem}
          </div>
        )}

        {modo === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: cliente@email.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduza a sua palavra-passe"
                style={inputStyle}
              />
            </div>

            <button onClick={iniciarSessao} style={botaoPrincipalStyle}>
              Entrar
            </button>

            <button
              onClick={() => {
                setMensagem("");
                setModo("registo");
              }}
              style={botaoSecundarioStyle}
            >
              Pedir Conta
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input
                value={nomeRegisto}
                onChange={(e) => setNomeRegisto(e.target.value)}
                placeholder="Ex: João Silva"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={emailRegisto}
                onChange={(e) => setEmailRegisto(e.target.value)}
                placeholder="Ex: cliente@email.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Palavra-passe</label>
              <input
                type="password"
                value={passwordRegisto}
                onChange={(e) => setPasswordRegisto(e.target.value)}
                placeholder="Crie uma palavra-passe"
                style={inputStyle}
              />
            </div>

            <button onClick={pedirConta} style={botaoPrincipalStyle}>
              Enviar Pedido de Conta
            </button>

            <button
              onClick={() => {
                setMensagem("");
                setModo("login");
              }}
              style={botaoSecundarioStyle}
            >
              Voltar ao Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const botaoPrincipalStyle: React.CSSProperties = {
  marginTop: "8px",
  background: "linear-gradient(180deg, #4b5f9e 0%, #34457c 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};

const botaoSecundarioStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "14px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};