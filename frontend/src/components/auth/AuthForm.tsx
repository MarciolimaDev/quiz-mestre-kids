"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch } from "@/lib/api";
import styles from "./Auth.module.css";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (isRegister && password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }
    try {
      setLoading(true);
      await apiFetch(`/auth/${isRegister ? "register" : "login"}/`, {
        method: "POST",
        body: JSON.stringify(isRegister
          ? { email, first_name: firstName, last_name: lastName, password, password_confirm: passwordConfirm }
          : { email, password }),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Link className={styles.brand} href="/">QuizBlast!</Link>
        <div className={styles.heroContent}>
          <span>Área do professor</span>
          <h1>Transforme cada aula em uma nova missão.</h1>
          <p>Crie quizzes, organize seus alunos e acompanhe o desempenho da turma em tempo real.</p>
          <div className={styles.orbit}><Icon name="rocket" size={70} /></div>
        </div>
      </section>
      <section className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.formHeading}>
            <span>{isRegister ? "Criar conta" : "Bem-vindo de volta"}</span>
            <h2>{isRegister ? "Comece agora" : "Entrar no dashboard"}</h2>
            <p>{isRegister ? "Use seus dados profissionais para criar a conta." : "Acesse sua área de gerenciamento."}</p>
          </div>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <form onSubmit={submit}>
            {isRegister && <div className={styles.nameFields}>
              <label>Nome<input autoComplete="given-name" onChange={(event) => setFirstName(event.target.value)} required value={firstName} /></label>
              <label>Sobrenome<input autoComplete="family-name" onChange={(event) => setLastName(event.target.value)} required value={lastName} /></label>
            </div>}
            <label>E-mail<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="professor@escola.com" required type="email" value={email} /></label>
            <label>Senha<input autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
            {isRegister && <label>Confirmar senha<input autoComplete="new-password" minLength={8} onChange={(event) => setPasswordConfirm(event.target.value)} required type="password" value={passwordConfirm} /></label>}
            <button disabled={loading} type="submit">{loading ? "Aguarde..." : isRegister ? "Criar minha conta" : "Entrar"}<Icon name="play" size={20} /></button>
          </form>
          <p className={styles.switchMode}>{isRegister ? "Já possui uma conta?" : "Ainda não possui uma conta?"} <Link href={isRegister ? "/login" : "/registro"}>{isRegister ? "Entrar" : "Criar conta"}</Link></p>
        </div>
      </section>
    </main>
  );
}
