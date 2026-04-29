"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ClienteDB = {
  id: string;
  nome: string | null;
  email: string | null;
  estado: string | null;
  aprovado: boolean | null;
  tipo_utilizador: string | null;
  nif: string | null;
  contacto: string | null;
  morada: string | null;
  tipo_cliente: string | null;
  desconto_percentual?: number | null;
  empresa_nome?: string | null;
  telefone?: string | null;
  codigo_postal?: string | null;
  cidade?: string | null;
  pais?: string | null;
  nif_tipo?: string | null;
};

type TipoMensagem = "erro" | "sucesso";

export default function LoginPage() {
  const router = useRouter();

  const [modo, setModo] = useState<"entrar" | "registar">("entrar");

  const [nome, setNome] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nifTipo, setNifTipo] = useState<"portugal" | "estrangeiro">("portugal");
  const [nif, setNif] = useState("");
  const [morada, setMorada] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [cidade, setCidade] = useState("");
  const [pais, setPais] = useState("Portugal");
  const [tipoCliente, setTipoCliente] = useState("profissional");

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>("erro");

  const [aEntrar, setAEntrar] = useState(false);
  const [aRegistar, setARegistar] = useState(false);
  const [aVerificar, setAVerificar] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error(error);
          setAVerificar(false);
          return;
        }

        const user = data.session?.user;

        if (!user) {
          setAVerificar(false);
          return;
        }

        const { data: cliente, error: clienteError } = await supabase
          .from("clientes")
          .select(
            "id, nome, email, estado, aprovado, tipo_utilizador, nif, contacto, morada, tipo_cliente"
          )
          .eq("id", user.id)
          .single<ClienteDB>();

        if (clienteError || !cliente) {
          console.error(clienteError);
          await supabase.auth.signOut();
          setAVerificar(false);
          return;
        }

        if (cliente.tipo_utilizador === "admin") {
          router.replace("/admin");
          return;
        }

        if (cliente.estado === "pendente" || cliente.aprovado === false) {
          await supabase.auth.signOut();
          setMensagem("A sua conta ainda está pendente de aprovação.");
          setTipoMensagem("erro");
          setAVerificar(false);
          return;
        }

        if (cliente.estado === "rejeitado") {
          await supabase.auth.signOut();
          setMensagem("A sua conta foi rejeitada.");
          setTipoMensagem("erro");
          setAVerificar(false);
          return;
        }

        router.replace("/dashboard");
      } catch (error) {
        console.error(error);
      } finally {
        setAVerificar(false);
      }
    }

    verificarSessao();
  }, [router]);

  function limparMensagem() {
    setMensagem("");
  }

  function limparFormularioRegisto() {
    setNome("");
    setEmpresaNome("");
    setEmail("");
    setTelefone("");
    setNifTipo("portugal");
    setNif("");
    setMorada("");
    setCodigoPostal("");
    setCidade("");
    setPais("Portugal");
    setTipoCliente("profissional");
    setPassword("");
    setConfirmarPassword("");
  }

  function mostrarMensagem(texto: string, tipo: TipoMensagem) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function validarNifPortugues(valor: string) {
    return /^\d{9}$/.test(valor);
  }

  function normalizarTelefone(valor: string) {
    return valor.replace(/\s+/g, " ").trim();
  }

  function onChangeNifTipo(valor: "portugal" | "estrangeiro") {
    setNifTipo(valor);

    if (valor === "portugal" && !pais.trim()) {
      setPais("Portugal");
    }

    if (valor === "portugal") {
      setPais("Portugal");
    }
  }

  function onChangeTipoCliente(valor: string) {
    setTipoCliente(valor);

    if (valor === "particular") {
      setEmpresaNome("");
    }
  }

  async function entrar() {
    try {
      setAEntrar(true);
      limparMensagem();

      const emailTratado = email.trim().toLowerCase();
      const passwordTratada = password.trim();

      if (!emailTratado || !passwordTratada) {
        mostrarMensagem("Preencha email e password.", "erro");
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: emailTratado,
          password: passwordTratada,
        });

      if (authError) {
        throw authError;
      }

      const user = authData.user;

      if (!user) {
        mostrarMensagem("Não foi possível iniciar sessão.", "erro");
        return;
      }

      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select(
          "id, nome, email, estado, aprovado, tipo_utilizador, nif, contacto, morada, tipo_cliente"
        )
        .eq("id", user.id)
        .single<ClienteDB>();

      if (clienteError || !cliente) {
        throw clienteError || new Error("Utilizador não encontrado.");
      }

      if (cliente.estado === "pendente" || cliente.aprovado === false) {
        mostrarMensagem("A sua conta ainda está pendente de aprovação.", "erro");
        await supabase.auth.signOut();
        return;
      }

      if (cliente.estado === "rejeitado") {
        mostrarMensagem("A sua conta foi rejeitada.", "erro");
        await supabase.auth.signOut();
        return;
      }

      if (cliente.tipo_utilizador === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      mostrarMensagem(error?.message || "Erro ao iniciar sessão.", "erro");
    } finally {
      setAEntrar(false);
    }
  }

  async function registar() {
    try {
      setARegistar(true);
      limparMensagem();

      const nomeTratado = nome.trim();
      const empresaNomeTratado = empresaNome.trim();
      const emailTratado = email.trim().toLowerCase();
      const telefoneTratado = normalizarTelefone(telefone);
      const nifTratado = nif.trim().toUpperCase();
      const moradaTratada = morada.trim();
      const codigoPostalTratado = codigoPostal.trim();
      const cidadeTratada = cidade.trim();
      const paisTratado = pais.trim();
      const tipoClienteTratado =
        tipoCliente.trim() === "particular" ? "particular" : "profissional";
      const passwordTratada = password.trim();
      const confirmarTratada = confirmarPassword.trim();

      const empresaObrigatoria = tipoClienteTratado === "profissional";

      if (
        !nomeTratado ||
        !emailTratado ||
        !telefoneTratado ||
        !nifTratado ||
        !moradaTratada ||
        !cidadeTratada ||
        !paisTratado ||
        !passwordTratada ||
        !confirmarTratada
      ) {
        mostrarMensagem("Preencha todos os campos obrigatórios do registo.", "erro");
        return;
      }

      if (empresaObrigatoria && !empresaNomeTratado) {
        mostrarMensagem("Preencha o nome profissional/atelier.", "erro");
        return;
      }

      if (!validarEmail(emailTratado)) {
        mostrarMensagem("Introduza um email válido.", "erro");
        return;
      }

      if (telefoneTratado.length < 6) {
        mostrarMensagem("Introduza um telefone válido.", "erro");
        return;
      }

      if (nifTipo === "portugal" && !validarNifPortugues(nifTratado)) {
        mostrarMensagem("O NIF português deve ter exatamente 9 dígitos.", "erro");
        return;
      }

      if (nifTipo === "estrangeiro" && nifTratado.length < 5) {
        mostrarMensagem("Introduza uma identificação fiscal estrangeira válida.", "erro");
        return;
      }

      if (passwordTratada.length < 6) {
        mostrarMensagem("A password deve ter pelo menos 6 caracteres.", "erro");
        return;
      }

      if (passwordTratada !== confirmarTratada) {
        mostrarMensagem("As passwords não coincidem.", "erro");
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailTratado,
        password: passwordTratada,
      });

      if (signUpError) {
        throw signUpError;
      }

      const userId = signUpData.user?.id;

      if (!userId) {
        mostrarMensagem("Conta criada, mas não foi possível concluir o registo.", "erro");
        return;
      }

      const { error: clienteError } = await supabase.from("clientes").upsert(
        {
          id: userId,
          nome: nomeTratado,
          email: emailTratado,
          nif: nifTratado,
          contacto: telefoneTratado,
          telefone: telefoneTratado,
          morada: moradaTratada,
          codigo_postal: codigoPostalTratado || null,
          cidade: cidadeTratada,
          pais: paisTratado,
          nif_tipo: nifTipo,
          tipo_cliente: tipoClienteTratado,
          empresa_nome: empresaObrigatoria ? empresaNomeTratado : null,
          estado: "pendente",
          aprovado: false,
          tipo_utilizador: "cliente",
        },
        { onConflict: "id" }
      );

      if (clienteError) {
        throw clienteError;
      }

      await supabase.auth.signOut();

      limparFormularioRegisto();
      mostrarMensagem(
        "Conta criada com sucesso. O seu registo ficou pendente de aprovação do administrador.",
        "sucesso"
      );
      setModo("entrar");
    } catch (error: any) {
      console.error(error);
      mostrarMensagem(error?.message || "Erro ao criar conta.", "erro");
    } finally {
      setARegistar(false);
    }
  }

  function submeterEntrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!aEntrar) {
      void entrar();
    }
  }

  function submeterRegistar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!aRegistar) {
      void registar();
    }
  }

  if (aVerificar) {
    return (
      <main style={mainStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>VALERIE</h1>
          <p style={subtitleStyle}>A verificar sessão...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>VALERIE</h1>
        <p style={subtitleStyle}>
          {modo === "entrar" ? "Entrar na plataforma" : "Criar conta"}
        </p>

        <div style={tabsWrapStyle}>
          <button
            type="button"
            onClick={() => {
              setModo("entrar");
              limparMensagem();
            }}
            style={{
              ...tabButtonStyle,
              ...(modo === "entrar" ? tabButtonAtivoStyle : {}),
            }}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setModo("registar");
              limparMensagem();
            }}
            style={{
              ...tabButtonStyle,
              ...(modo === "registar" ? tabButtonAtivoStyle : {}),
            }}
          >
            Criar conta
          </button>
        </div>

        {mensagem && (
          <div
            style={
              tipoMensagem === "sucesso" ? mensagemSucessoStyle : mensagemErroStyle
            }
          >
            {mensagem}
          </div>
        )}

        {modo === "entrar" ? (
          <form onSubmit={submeterEntrar}>
            <div style={campoStyle}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="o.seu@email.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div style={campoStyle}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                style={inputStyle}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" style={botaoStyle} disabled={aEntrar}>
              {aEntrar ? "A entrar..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={submeterRegistar}>
            <div style={campoStyle}>
              <label style={labelStyle}>Nome do responsável</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                style={inputStyle}
                autoComplete="name"
              />
            </div>

            <div style={campoStyle}>
              <label style={labelStyle}>Tipo de cliente</label>
              <select
                value={tipoCliente}
                onChange={(e) => onChangeTipoCliente(e.target.value)}
                style={inputStyle}
              >
                <option value="profissional" style={optionStyle}>
                  Profissional
                </option>
                <option value="particular" style={optionStyle}>
                  Particular
                </option>
              </select>
            </div>

            {tipoCliente !== "particular" && (
              <div style={campoStyle}>
                <label style={labelStyle}>Nome profissional / atelier</label>
                <input
                  type="text"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  placeholder="Ex: Atelier João Silva"
                  style={inputStyle}
                  autoComplete="organization"
                />
              </div>
            )}

            <div style={duasColunasStyle}>
              <div style={campoStyle}>
                <label style={labelStyle}>Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: +351 912 345 678"
                  style={inputStyle}
                  autoComplete="tel"
                />
              </div>

              <div style={campoStyle}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o.seu@email.com"
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={duasColunasStyle}>
              <div style={campoStyle}>
                <label style={labelStyle}>Tipo de identificação fiscal</label>
                <select
                  value={nifTipo}
                  onChange={(e) =>
                    onChangeNifTipo(e.target.value as "portugal" | "estrangeiro")
                  }
                  style={inputStyle}
                >
                  <option value="portugal" style={optionStyle}>
                    NIF Portugal
                  </option>
                  <option value="estrangeiro" style={optionStyle}>
                    Fiscal estrangeiro
                  </option>
                </select>
              </div>

              <div style={campoStyle}>
                <label style={labelStyle}>
                  {nifTipo === "portugal" ? "NIF" : "N.º fiscal estrangeiro"}
                </label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder={
                    nifTipo === "portugal" ? "Ex: 123456789" : "Ex: DE123456789"
                  }
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>
            </div>

            <div style={campoStyle}>
              <label style={labelStyle}>Morada</label>
              <input
                type="text"
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                placeholder="Ex: Rua das Flores 120"
                style={inputStyle}
                autoComplete="street-address"
              />
            </div>

            <div style={tresColunasStyle}>
              <div style={campoStyle}>
                <label style={labelStyle}>Código postal</label>
                <input
                  type="text"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  placeholder="Ex: 1000-001"
                  style={inputStyle}
                  autoComplete="postal-code"
                />
              </div>

              <div style={campoStyle}>
                <label style={labelStyle}>Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Lisboa"
                  style={inputStyle}
                  autoComplete="address-level2"
                />
              </div>

              <div style={campoStyle}>
                <label style={labelStyle}>País</label>
                <input
                  type="text"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  placeholder="Ex: Portugal"
                  style={inputStyle}
                  autoComplete="country-name"
                />
              </div>
            </div>

            <div style={duasColunasStyle}>
              <div style={campoStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>

              <div style={campoStyle}>
                <label style={labelStyle}>Confirmar Password</label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="********"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" style={botaoStyle} disabled={aRegistar}>
              {aRegistar ? "A criar conta..." : "Criar conta"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background:
    "radial-gradient(circle at top, #343d68 0%, #1f2540 45%, #171c33 100%)",
  fontFamily: "Arial, sans-serif",
  color: "white",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "760px",
  padding: "32px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "42px",
};

const subtitleStyle: CSSProperties = {
  marginTop: "10px",
  marginBottom: "24px",
  opacity: 0.85,
};

const tabsWrapStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "18px",
};

const tabButtonStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const tabButtonAtivoStyle: CSSProperties = {
  background: "rgba(92,115,199,0.30)",
  border: "1px solid rgba(92,115,199,0.55)",
};

const mensagemBaseStyle: CSSProperties = {
  marginBottom: "18px",
  padding: "14px 16px",
  borderRadius: "12px",
};

const mensagemErroStyle: CSSProperties = {
  ...mensagemBaseStyle,
  background: "rgba(180,50,50,0.18)",
  border: "1px solid rgba(180,50,50,0.35)",
};

const mensagemSucessoStyle: CSSProperties = {
  ...mensagemBaseStyle,
  background: "rgba(63,163,107,0.15)",
  border: "1px solid rgba(63,163,107,0.35)",
};

const campoStyle: CSSProperties = {
  marginBottom: "16px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const duasColunasStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const tresColunasStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "14px",
};

const optionStyle: CSSProperties = {
  color: "black",
};

const botaoStyle: CSSProperties = {
  width: "100%",
  background: "linear-gradient(180deg, #5c73c7 0%, #4057a8 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "14px 18px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};