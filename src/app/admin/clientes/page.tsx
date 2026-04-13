"use client";

import { useEffect, useState } from "react";

type Cliente = {
  nome: string;
  email: string;
  password: string;
  aprovado: boolean;
};

type Processo = {
  id: number;
  nomeCliente: string;
};

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);

  function carregarDados() {
    const clientesGuardados = localStorage.getItem("valerie_clientes");
    const processosGuardados = localStorage.getItem("valerie_processos");

    const listaClientes: Cliente[] = clientesGuardados
      ? JSON.parse(clientesGuardados)
      : [];

    const listaProcessos: Processo[] = processosGuardados
      ? JSON.parse(processosGuardados)
      : [];

    setClientes(listaClientes);
    setProcessos(listaProcessos);
  }

  function alterarEstado(email: string) {
    const atualizados = clientes.map((c) =>
      c.email === email ? { ...c, aprovado: !c.aprovado } : c
    );

    setClientes(atualizados);
    localStorage.setItem("valerie_clientes", JSON.stringify(atualizados));
  }

  function contarProcessos(nome: string) {
    return processos.filter((p) => p.nomeCliente === nome).length;
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
        color: "white",
        display: "flex",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <aside
        style={{
          width: "260px",
          minHeight: "100vh",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.12)",
          padding: "30px 20px",
        }}
      >
        <div style={{ fontSize: "38px", letterSpacing: "10px", marginBottom: "40px" }}>
          VALERIE
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a href="/admin" style={menuStyle}>Dashboard</a>
          <a href="/admin/processos" style={menuStyle}>Processos</a>
          <a
            href="/admin/clientes"
            style={{ ...menuStyle, background: "rgba(255,255,255,0.08)" }}
          >
            Clientes
          </a>
          <a href="/aprovacao-clientes" style={menuStyle}>Aprovações</a>
        </div>
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        <h1 style={{ fontSize: "38px" }}>Clientes</h1>

        <div style={tableWrapper}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>Nome</th>
                <th style={th}>Email</th>
                <th style={th}>Processos</th>
                <th style={th}>Estado</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={td}>
                    Sem clientes.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.email}>
                    <td style={td}>{cliente.nome}</td>
                    <td style={td}>{cliente.email}</td>
                    <td style={td}>{contarProcessos(cliente.nome)}</td>

                    <td style={td}>
                      {cliente.aprovado ? "Ativo" : "Pendente"}
                    </td>

                    <td style={td}>
                      <button
                        onClick={() => alterarEstado(cliente.email)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "none",
                          background: cliente.aprovado
                            ? "rgba(180,50,50,0.4)"
                            : "rgba(50,180,100,0.4)",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {cliente.aprovado ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const menuStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
};

const tableWrapper: React.CSSProperties = {
  marginTop: "20px",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};