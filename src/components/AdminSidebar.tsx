"use client";

import { CSSProperties } from "react";
import LogoutButton from "@/components/LogoutButton";

export default function AdminSidebar() {
  return (
    <aside style={asideStyle}>
      <div style={logoStyle}>VALERIE</div>

      <div style={menuContainerStyle}>
        <a href="/admin" style={menuStyle}>Dashboard</a>
        <a href="/admin/processos" style={menuStyle}>Processos</a>
        <a href="/admin/clientes" style={menuStyle}>Clientes</a>
        <a href="/admin/precos" style={menuStyle}>Preços</a>
        <a href="/admin/financeiro" style={menuStyle}>Financeiro</a>
        <a href="/aprovacao-clientes" style={menuStyle}>Aprovação</a>
      </div>

      <div style={{ marginTop: "20px" }}>
        <LogoutButton label="Terminar Sessão" fullWidth />
      </div>
    </aside>
  );
}

const asideStyle: CSSProperties = {
  width: "260px",
  minHeight: "100vh",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: "30px 20px",
};

const logoStyle: CSSProperties = {
  fontSize: "38px",
  letterSpacing: "10px",
  marginBottom: "40px",
};

const menuContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const menuStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
};