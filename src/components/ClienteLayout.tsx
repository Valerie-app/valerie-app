"use client";

import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, type ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";

export default function ClienteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { label: "Dashboard", path: "/dashboard-cliente" },
    { label: "Novo Orçamento", path: "/novo-orcamento-cliente" },
    { label: "Processos", path: "/processos-cliente" },
    { label: "Perfil", path: "/perfil-cliente" },
  ];

  return (
    <main style={mainStyle}>
      <aside style={asideStyle}>
        <div style={logoStyle}>VALERIE</div>

        <div style={menuContainerStyle}>
          {menu.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                ...menuStyle,
                ...(pathname === item.path ? menuAtivoStyle : {}),
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <LogoutButton label="Terminar Sessão" fullWidth />
        </div>
      </aside>

      <section style={contentStyle}>{children}</section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  color: "white",
  display: "flex",
  fontFamily: "Arial, sans-serif",
};

const asideStyle: CSSProperties = {
  width: "260px",
  minHeight: "100dvh",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  padding: "30px 20px",
  flexShrink: 0,
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
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "16px",
};

const menuAtivoStyle: CSSProperties = {
  background: "rgba(255,255,255,0.10)",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "40px",
  overflowX: "hidden",
};