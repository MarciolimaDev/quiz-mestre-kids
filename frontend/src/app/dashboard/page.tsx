import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/quiz-control/QuizControl.module.css";

export const metadata: Metadata = {
  title: "Dashboard | QuizBlast!",
  description: "Visão geral do painel do professor.",
};

export default function DashboardPage() {
  return (
    <>
      <div className={styles.missionHeader}>
        <div>
          <h1>Visão geral</h1>
          <p>Resumo rápido do sistema e atalhos para as principais seções.</p>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel} style={{ padding: 28 }}>
          <h2>Resumo do sistema</h2>
          <p style={{ marginTop: 8 }}>
            Aqui você encontra informações gerais sobre o seu ambiente: alunos,
            perguntas, ranking e configurações. Use os atalhos ao lado para
            navegar rapidamente.
          </p>

          <ul style={{ marginTop: 16, lineHeight: 1.8 }}>
            <li>
              <Link href="/dashboard/alunos">Gerenciar alunos</Link>
            </li>
            <li>
              <Link href="/dashboard/perguntas">Gerenciar perguntas</Link>
            </li>
            <li>
              <Link href="/dashboard/ranking">Ver ranking</Link>
            </li>
            <li>
              <Link href="/dashboard/configuracoes">Configurações</Link>
            </li>
          </ul>
        </section>

        <aside className={styles.panel} style={{ padding: 28 }}>
          <h2>Atalhos</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <Link className={`${styles.pressable} ${styles.primaryButton}`} href="/dashboard/alunos">Alunos</Link>
            <Link className={`${styles.pressable} ${styles.primaryButton}`} href="/dashboard/perguntas">Perguntas</Link>
            <Link className={`${styles.pressable} ${styles.primaryButton}`} href="/dashboard/ranking">Ranking</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
