import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/quiz-control/QuizControl.module.css";

export const metadata: Metadata = {
  title: "Dashboard | QuizBlast!",
  description: "Visão geral do painel do professor.",
};

export default function DashboardPage() {
  return (
    <div className={styles.overviewScene}>
      <div aria-hidden="true" className={styles.overviewAnimatedBackground}>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={`${styles.missionHeader} ${styles.overviewHero}`}>
        <div>
          <h1>Visão geral</h1>
          <p>Resumo rápido do sistema e atalhos para as principais seções.</p>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={`${styles.panel} ${styles.overviewCard} ${styles.overviewPrimaryCard}`}>
          <h2>Resumo do sistema</h2>
          <p>
            Aqui você encontra informações gerais sobre o seu ambiente: alunos,
            perguntas, ranking e configurações. Use os atalhos ao lado para
            navegar rapidamente.
          </p>

          <ul className={styles.overviewLinks}>
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

        <aside className={`${styles.panel} ${styles.overviewCard} ${styles.overviewShortcutCard}`}>
          <h2>Atalhos</h2>
          <div className={styles.overviewShortcutList}>
            <Link className={`${styles.pressable} ${styles.overviewShortcutButton}`} href="/dashboard/alunos">Alunos</Link>
            <Link className={`${styles.pressable} ${styles.overviewShortcutButton}`} href="/dashboard/perguntas">Perguntas</Link>
            <Link className={`${styles.pressable} ${styles.overviewShortcutButton}`} href="/dashboard/ranking">Ranking</Link>
          </div>
          <div aria-hidden="true" className={styles.overviewEmoji}>🚀 🎮 ✨</div>
        </aside>
      </div>
    </div>
  );
}
